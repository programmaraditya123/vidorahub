"""Client registration and browser authorization state."""
import re
import secrets
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from fastapi import HTTPException
from pymongo.write_concern import WriteConcern
from config.mongo import (client, settings, oauth_clients_collection, oauth_authorization_codes_collection,
    oauth_sessions_collection, oauth_transactions_collection)
from security.token_hash import hash_token

SESSION_COOKIE = "vh_oauth_session"
SESSION_SECONDS = 3600

def now():
    return datetime.now(timezone.utc)

def oauth_error(error, description, status=400):
    raise HTTPException(status, detail={"error": error, "error_description": description})

def validate_scope(scope, allowed=None):
    scopes = (scope or "").split()
    if not set(scopes) <= set(settings.oauth_scopes.split()) or (allowed is not None
        and not set(scopes) <= set(allowed.split())):
        oauth_error("invalid_scope", "Unsupported scope")
    return " ".join(dict.fromkeys(scopes))

async def create_oauth_client(data):
    document = data.model_dump()
    document["scope"] = validate_scope(data.scope if data.scope is not None else settings.oauth_scopes)
    document.update(client_id="vhc_" + secrets.token_urlsafe(24),
        client_id_issued_at=int(time.time()), isActive=True)
    await oauth_clients_collection.insert_one(dict(document))
    return document

async def get_oauth_client(client_id):
    client = await oauth_clients_collection.find_one({"client_id": client_id})
    return client if client and client.get("isActive", True) else None

async def validate_authorization(params):
    client = await get_oauth_client(params["client_id"])
    if not client:
        oauth_error("invalid_client", "Unknown or disabled client")
    if params["redirect_uri"] not in client.get("redirect_uris", []):
        oauth_error("invalid_request", "Invalid redirect_uri")
    if params["response_type"] != "code":
        oauth_error("unsupported_response_type", "Only code is supported")
    if "authorization_code" not in client.get("grant_types", []):
        oauth_error("unauthorized_client", "Authorization code grant is not allowed")
    if params.get("code_challenge_method") != "S256" or not re.fullmatch(
        r"[A-Za-z0-9_-]{43}", params.get("code_challenge") or ""):
        oauth_error("invalid_request", "A valid S256 PKCE challenge is required")
    if params.get("resource") != settings.mcp_resource:
        oauth_error("invalid_target", "resource must match the configured MCP resource")
    params["scope"] = validate_scope(params.get("scope") if params.get("scope") is not None
        else client.get("scope", settings.oauth_scopes), client.get("scope", settings.oauth_scopes))
    return client

async def create_oauth_transaction(params):
    transaction_id = secrets.token_urlsafe(32)
    await oauth_transactions_collection.insert_one(dict(params, transaction_id=transaction_id,
        expires_at=now() + timedelta(minutes=10)))
    return transaction_id

async def get_oauth_transaction(transaction_id):
    transaction = await oauth_transactions_collection.find_one(
        {"transaction_id": transaction_id, "expires_at": {"$gt": now()}})
    if not transaction:
        oauth_error("invalid_request", "Invalid or expired authorization transaction")
    return transaction

async def create_oauth_session(response, user_id):
    session_id = secrets.token_urlsafe(32)
    session_hash = hash_token(session_id)
    # Older deployments retain a unique session_hash index. Populate both hash
    # fields so subsequent sessions do not collide on a missing/null legacy key.
    await oauth_sessions_collection.insert_one({"session_id": session_hash, "session_hash": session_hash,
        "user_id": user_id, "expires_at": now() + timedelta(seconds=SESSION_SECONDS)})
    response.set_cookie(SESSION_COOKIE, session_id, httponly=True,
        secure=settings.oauth_cookie_secure, samesite="lax", max_age=SESSION_SECONDS)

async def get_oauth_session(session_id):
    return await oauth_sessions_collection.find_one(
        {"session_id": hash_token(session_id), "expires_at": {"$gt": now()}})

async def create_authorization_code(transaction, user_id, session=None):
    raw_code = secrets.token_urlsafe(32)
    fields = {key: transaction[key] for key in ("client_id", "redirect_uri", "resource",
        "scope", "code_challenge", "code_challenge_method")}
    await oauth_authorization_codes_collection.insert_one(dict(fields, user_id=user_id,
        code_hash=hash_token(raw_code), used=False, expires_at=now() + timedelta(minutes=5)),
        session=session)
    return raw_code


async def complete_authorization(transaction_id, user_id):
    """Commit code issuance and single-use consumption together (MongoDB replica set)."""
    async def complete(session):
        transaction = await oauth_transactions_collection.find_one_and_delete(
            {"transaction_id": transaction_id, "expires_at": {"$gt": now()}}, session=session)
        if not transaction:
            oauth_error("invalid_request", "Authorization transaction already completed or expired")
        code = await create_authorization_code(transaction, user_id, session=session) if user_id else None
        return transaction, code

    async with await client.start_session() as session:
        # The driver retries transient transaction/commit failures; aborted work rolls back.
        return await session.with_transaction(
            complete, max_commit_time_ms=5000,
            write_concern=WriteConcern("majority", wtimeout=5000),
        )

def callback_url(transaction, **params):
    parsed = urlsplit(transaction["redirect_uri"])
    query = parse_qsl(parsed.query, keep_blank_values=True)
    query.extend(params.items())
    if transaction.get("state") is not None:
        query.append(("state", transaction["state"]))
    return urlunsplit(parsed._replace(query=urlencode(query)))
