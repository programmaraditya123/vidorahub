"""Opaque tokens: hashed storage, atomic use and grant-level revocation."""
import re
import secrets
from datetime import timedelta
from config.mongo import (oauth_authorization_codes_collection as codes,
    oauth_tokens_collection as tokens, oauth_grants_collection as grants, settings)
from security.pkce import verify_code_verifier
from security.token_hash import hash_token
from services.oauth_service import now, oauth_error, get_oauth_client, validate_scope, run_oauth_transaction

ACCESS_SECONDS = 900
REFRESH_SECONDS = 30 * 24 * 3600

async def revoke_grant(grant_id):
    await grants.update_one({"grant_id": grant_id}, {"$set": {"revoked": True}})

async def issue_tokens(context, include_refresh, grant_id, session=None):
    fields = {key: context[key] for key in ("client_id", "user_id", "resource", "scope")}
    result = {"token_type": "Bearer", "expires_in": ACCESS_SECONDS, "scope": context["scope"]}
    for kind, lifetime in (("access", ACCESS_SECONDS), ("refresh", REFRESH_SECONDS)):
        if kind == "refresh" and not include_refresh:
            continue
        raw = secrets.token_urlsafe(48)
        await tokens.insert_one(dict(fields, token_hash=hash_token(raw), kind=kind,
            grant_id=grant_id, revoked=False, used=False, issued_at=now(),
            expires_at=now() + timedelta(seconds=lifetime)), session=session)
        result[kind + "_token"] = raw
    return result

async def exchange_code(form, client):
    required = ("code", "redirect_uri", "code_verifier", "resource")
    if any(not form.get(key) for key in required):
        oauth_error("invalid_request", "code, redirect_uri, code_verifier and resource are required")
    query = {"code_hash": hash_token(form["code"]), "client_id": client["client_id"],
        "redirect_uri": form["redirect_uri"], "resource": form["resource"],
        "expires_at": {"$gt": now()}}
    code = await codes.find_one(query)
    verifier = form["code_verifier"]
    if not code or not re.fullmatch(r"[A-Za-z0-9._~-]{43,128}", verifier) or not verify_code_verifier(verifier, code["code_challenge"]):
        oauth_error("invalid_grant", "Invalid authorization code or PKCE verifier")
    if code.get("used"):
        if code.get("grant_id"):
            await revoke_grant(code["grant_id"])
        oauth_error("invalid_grant", "Authorization code already used")
    async def redeem(session):
        grant_id = secrets.token_urlsafe(24)
        consumed = await codes.find_one_and_update(dict(query, used=False),
            {"$set": {"used": True, "grant_id": grant_id}}, session=session)
        if not consumed:
            return None
        await grants.insert_one({"grant_id": grant_id, "revoked": False,
            "expires_at": now() + timedelta(seconds=REFRESH_SECONDS)}, session=session)
        return await issue_tokens(consumed, "refresh_token" in client["grant_types"], grant_id,
            session=session)

    result = await run_oauth_transaction(redeem)
    if result is None:
        replay = await codes.find_one(query)
        if replay and replay.get("grant_id"):
            await revoke_grant(replay["grant_id"])
        oauth_error("invalid_grant", "Authorization code already used")
    return result

async def exchange_refresh(form, client):
    if not form.get("refresh_token") or not form.get("resource"):
        oauth_error("invalid_request", "refresh_token and resource are required")
    query = {"token_hash": hash_token(form["refresh_token"]), "kind": "refresh",
        "client_id": client["client_id"], "resource": form["resource"],
        "expires_at": {"$gt": now()}, "revoked": False}
    token = await tokens.find_one(query)
    if not token:
        oauth_error("invalid_grant", "Invalid refresh token")
    grant = await grants.find_one({"grant_id": token["grant_id"], "revoked": False,
        "expires_at": {"$gt": now()}})
    if not grant:
        oauth_error("invalid_grant", "Refresh grant has expired or been revoked")
    scope = validate_scope(form.get("scope", token["scope"]), token["scope"])
    if token["used"]:
        await revoke_grant(token["grant_id"])
        oauth_error("invalid_grant", "Refresh token reuse detected; grant revoked")
    async def rotate(session):
        # Reject grants revoked before this transaction's snapshot.
        active_grant = await grants.find_one({"grant_id": token["grant_id"], "revoked": False,
            "expires_at": {"$gt": now()}}, session=session)
        if not active_grant:
            return None
        consumed = await tokens.find_one_and_update(dict(query, used=False),
            {"$set": {"used": True}}, session=session)
        if not consumed:
            return None
        consumed["scope"] = scope
        return await issue_tokens(consumed, True, consumed["grant_id"], session=session)

    result = await run_oauth_transaction(rotate)
    if result is None:
        await revoke_grant(token["grant_id"])
        oauth_error("invalid_grant", "Refresh token reuse detected; grant revoked")
    return result

async def exchange_token(form):
    client = await get_oauth_client(form.get("client_id", ""))
    if not client:
        oauth_error("invalid_client", "Unknown or disabled client")
    grant_type = form.get("grant_type")
    if grant_type not in {"authorization_code", "refresh_token"}:
        oauth_error("unsupported_grant_type", "Unsupported grant_type")
    if grant_type not in client.get("grant_types", []):
        oauth_error("unauthorized_client", "Client is not allowed to use this grant")
    if form.get("resource") and form["resource"] != settings.mcp_resource:
        oauth_error("invalid_target", "Invalid MCP resource")
    if form.get("client_secret"):
        oauth_error("invalid_client", "Only public PKCE clients are supported")
    return await (exchange_code(form, client) if grant_type == "authorization_code"
        else exchange_refresh(form, client))

async def introspect_token(raw):
    token = await tokens.find_one({"token_hash": hash_token(raw), "kind": "access",
        "revoked": False, "expires_at": {"$gt": now()}})
    if not token or not await get_oauth_client(token["client_id"]):
        return {"active": False}
    if not await grants.find_one({"grant_id": token["grant_id"], "revoked": False,
        "expires_at": {"$gt": now()}}):
        return {"active": False}
    return {"active": True, "sub": token["user_id"], "client_id": token["client_id"],
        "aud": token["resource"], "iss": settings.oauth_issuer.rstrip("/"),
        "scope": token["scope"], "token_type": "Bearer",
        "iat": int(token["issued_at"].timestamp()), "exp": int(token["expires_at"].timestamp())}

async def revoke_token(raw, client_id):
    if not await get_oauth_client(client_id):
        oauth_error("invalid_client", "Unknown or disabled client")
    token = await tokens.find_one({"token_hash": hash_token(raw), "client_id": client_id})
    if token:
        await revoke_grant(token["grant_id"])
