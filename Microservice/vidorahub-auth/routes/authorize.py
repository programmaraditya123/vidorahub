import secrets
import logging
import re
from pathlib import Path
from urllib.parse import quote, urlencode, urlsplit
from fastapi import APIRouter, Form, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from config.mongo import settings
from pymongo.errors import PyMongoError
from security.sessions import get_oauth_user
from services.user_service import authenticate_password
from services.oauth_service import (oauth_error, validate_authorization,
    create_oauth_transaction, get_oauth_transaction, create_oauth_session,
    complete_authorization, callback_url, TRANSACTION_COOKIE, TRANSACTION_SECONDS)

router = APIRouter(tags=["OAuth"])
CSRF_COOKIE = "vh_oauth_csrf"
templates = Jinja2Templates(directory=Path(__file__).resolve().parents[1] / "templates")
logger = logging.getLogger(__name__)


def problem_page(request, transaction_id=None, status_code=503, request_id=None):
    nonce = secrets.token_urlsafe(24)
    return templates.TemplateResponse(
        request=request, name="auth_unavailable.html",
        context={"transaction_id": transaction_id, "style_nonce": nonce, "request_id": request_id,
            "unavailable": status_code == 503},
        status_code=status_code,
        headers={**({"Retry-After": "3"} if status_code == 503 else {}), "Referrer-Policy": "same-origin",
            "Content-Security-Policy": "default-src 'none'; "
                f"style-src 'nonce-{nonce}'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"},
    )

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
    response = RedirectResponse("/oauth/login?" + urlencode({"transaction_id": transaction_id}), 302)
    response.set_cookie(TRANSACTION_COOKIE, transaction_id, httponly=True,
        secure=settings.oauth_cookie_secure, samesite="lax", max_age=TRANSACTION_SECONDS, path="/")
    return response

@router.get("/login", include_in_schema=False)
@router.get("/oauth/login", response_class=HTMLResponse)
async def login_page(request: Request, transaction_id: str | None = Query(None,
    description="Use the transaction_id from /authorize. Browsers can resume the latest pending link from their cookie.")):
    if transaction_id is None:
        transaction_id = request.cookies.get(TRANSACTION_COOKIE)
    if not transaction_id:
        oauth_error("invalid_request", "Missing authorization transaction; start a new connection")
    transaction = await get_oauth_transaction(transaction_id)
    client = await validate_authorization(transaction)
    user_id = await get_oauth_user(request)
    return render_consent(request, transaction, client, user_id)


def consent_form_action(redirect_uri):
    """Allow the validated callback origin through a browser's form redirect check."""
    callback = urlsplit(redirect_uri)
    hostname = callback.hostname.encode("idna").decode("ascii")
    if ":" in hostname:
        hostname = f"[{hostname}]"
    if callback.port is not None:
        hostname += f":{callback.port}"
    # A registered URL must never introduce extra CSP directives or source tokens.
    origin = f"{callback.scheme}://{quote(hostname, safe='[]:.-')}"
    return f"'self' {origin}"


def render_consent(request, transaction, client, user_id, error_message=None, email=""):
    # Reuse the browser token so reloading consent does not invalidate another tab.
    csrf = request.cookies.get(CSRF_COOKIE, "")
    if not re.fullmatch(r"[A-Za-z0-9_-]{43}", csrf):
        csrf = secrets.token_urlsafe(32)
    style_nonce = secrets.token_urlsafe(24)
    # Chrome also checks the cross-origin 303 callback against the source page's CSP.
    form_action = consent_form_action(transaction["redirect_uri"])
    response = templates.TemplateResponse(
        request=request, name="consent.html",
        context={"client_name": client["client_name"],
            "client_initial": client["client_name"][:1].upper(),
            "resource": transaction["resource"], "redirect_uri": transaction["redirect_uri"],
            "scopes": transaction["scope"].split(), "signed_in": bool(user_id),
            "transaction_id": transaction["transaction_id"], "csrf_token": csrf, "style_nonce": style_nonce,
            "error_message": error_message, "email": email},
        headers={
            # Keep browser form POST Origin intact; suppress cross-origin referrers.
            "Referrer-Policy": "same-origin",
            "Content-Security-Policy": "default-src 'none'; "
                f"style-src 'nonce-{style_nonce}'; form-action {form_action}; "
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
    transaction = await get_oauth_transaction(transaction_id, allow_completed=True)
    oauth_client = await validate_authorization(transaction)
    if decision not in {"allow", "deny"}:
        oauth_error("invalid_request", "Invalid consent decision")
    user_id = None
    if decision == "allow":
        user_id = await get_oauth_user(request) or await authenticate_password(email, password)
        if not user_id:
            if "text/html" in request.headers.get("accept", "") and not transaction.get("completed"):
                message = "Your sign-in session has expired. Please sign in again." if not email and not password else "The email or password is incorrect. Please try again."
                return render_consent(request, transaction, oauth_client, None, error_message=message, email=email)
            oauth_error("access_denied", "Invalid email or password", 401)
    transaction, code = await complete_authorization(transaction_id, user_id, csrf_token)
    if decision == "deny":
        response = RedirectResponse(callback_url(transaction, error="access_denied"), 303)
    else:
        response = RedirectResponse(callback_url(transaction, code=code), 303)
        try:
            await create_oauth_session(response, user_id)
        except PyMongoError as exc:
            # A remembered session is optional; the committed code must still reach the client.
            logger.warning("OAuth session creation failed error=%s code=%s",
                type(exc).__name__, getattr(exc, "code", None))
    # Keep CSRF and a newer pending link available to other consent tabs.
    if request.cookies.get(TRANSACTION_COOKIE) == transaction_id:
        response.delete_cookie(TRANSACTION_COOKIE, path="/", secure=settings.oauth_cookie_secure,
            httponly=True, samesite="lax")
    return response
