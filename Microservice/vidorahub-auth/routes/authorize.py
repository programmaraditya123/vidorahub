import secrets
from pathlib import Path
from urllib.parse import urlencode, urlsplit
from fastapi import APIRouter, Form, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from config.mongo import settings, oauth_transactions_collection
from security.sessions import get_oauth_user
from services.user_service import authenticate_password
from services.oauth_service import (now, oauth_error, validate_authorization,
    create_oauth_transaction, get_oauth_transaction, create_oauth_session,
    create_authorization_code, callback_url)

router = APIRouter(tags=["OAuth"])
CSRF_COOKIE = "vh_oauth_csrf"
templates = Jinja2Templates(directory=Path(__file__).resolve().parents[1] / "templates")

@router.get("/authorize", responses={
    302: {"description": "Open the redirect in a browser to sign in and grant access"},
    400: {"description": "Invalid OAuth parameters; returns error and error_description"},
})
async def authorize(request: Request, client_id: str, redirect_uri: str, response_type: str,
    resource: str = Query(..., description="Exact MCP server URL, not the client name (e.g. Claude)",
        examples=[settings.mcp_resource]),
    scope: str | None = None, state: str | None = None,
    code_challenge: str | None = Query(None,
        description="Base64url-encoded SHA-256 of the code_verifier, without padding. Generate a fresh verifier for each real authorization.",
        examples=["E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"]),
    code_challenge_method: str | None = Query(None,
        description="Required PKCE method: S256", examples=["S256"])):
    if any(len(request.query_params.getlist(key)) != 1 for key in request.query_params):
        oauth_error("invalid_request", "Duplicate authorization parameters")
    params = dict(client_id=client_id, redirect_uri=redirect_uri, response_type=response_type,
        resource=resource, scope=scope, state=state, code_challenge=code_challenge,
        code_challenge_method=code_challenge_method)
    await validate_authorization(params)
    transaction_id = await create_oauth_transaction(params)
    return RedirectResponse("/oauth/login?" + urlencode({"transaction_id": transaction_id}), 302)

@router.get("/login", include_in_schema=False)
@router.get("/oauth/login", response_class=HTMLResponse)
async def login_page(request: Request, transaction_id: str):
    transaction = await get_oauth_transaction(transaction_id)
    client = await validate_authorization(transaction)
    csrf = secrets.token_urlsafe(32)
    user_id = await get_oauth_user(request)
    style_nonce = secrets.token_urlsafe(24)
    response = templates.TemplateResponse(
        request=request, name="consent.html",
        context={"client_name": client["client_name"],
            "client_initial": client["client_name"][:1].upper(),
            "resource": transaction["resource"], "redirect_uri": transaction["redirect_uri"],
            "scopes": transaction["scope"].split(), "signed_in": bool(user_id),
            "transaction_id": transaction_id, "csrf_token": csrf, "style_nonce": style_nonce},
        headers={
            # Keep browser form POST Origin intact; suppress cross-origin referrers.
            "Referrer-Policy": "same-origin",
            "Content-Security-Policy": "default-src 'none'; "
                f"style-src 'nonce-{style_nonce}'; form-action 'self'; "
                "frame-ancestors 'none'; base-uri 'none'",
        },
    )
    response.set_cookie(CSRF_COOKIE, csrf, httponly=True, secure=settings.oauth_cookie_secure,
        samesite="lax", max_age=600, path="/oauth/login")
    return response

@router.post("/oauth/login")
async def login_submit(request: Request, transaction_id: str = Form(...),
    csrf_token: str = Form(...), decision: str = Form(...),
    email: str = Form(""), password: str = Form("")):
    form = await request.form()
    if any(len(form.getlist(key)) != 1 for key in form):
        oauth_error("invalid_request", "Duplicate form parameters")
    cookie = request.cookies.get(CSRF_COOKIE, "")
    if not cookie or not secrets.compare_digest(cookie, csrf_token):
        oauth_error("invalid_request", "Invalid browser form", 403)
    origin = request.headers.get("origin")
    issuer = urlsplit(settings.oauth_issuer)
    if origin and origin != f"{issuer.scheme}://{issuer.netloc}":
        oauth_error("invalid_request", "Invalid request origin: open consent at the configured OAUTH_ISSUER (including scheme and port)", 403)
    transaction = await get_oauth_transaction(transaction_id)
    await validate_authorization(transaction)
    if decision not in {"allow", "deny"}:
        oauth_error("invalid_request", "Invalid consent decision")
    user_id = None
    if decision == "allow":
        user_id = await get_oauth_user(request) or await authenticate_password(email, password)
        if not user_id:
            oauth_error("access_denied", "Invalid email or password", 401)
    consumed = await oauth_transactions_collection.find_one_and_delete(
        {"transaction_id": transaction_id, "expires_at": {"$gt": now()}})
    if not consumed:
        oauth_error("invalid_request", "Authorization transaction already completed")
    if decision == "deny":
        response = RedirectResponse(callback_url(transaction, error="access_denied"), 303)
    else:
        code = await create_authorization_code(transaction, user_id)
        response = RedirectResponse(callback_url(transaction, code=code), 303)
        await create_oauth_session(response, user_id)
    response.delete_cookie(CSRF_COOKIE, path="/oauth/login")
    return response
