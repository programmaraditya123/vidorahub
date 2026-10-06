import secrets
from fastapi import APIRouter, Request, Form, Header
from config.mongo import settings
from services.oauth_service import oauth_error
from services.token_service import exchange_token, introspect_token

router = APIRouter(tags=["OAuth"])

@router.post("/token")
async def token(request: Request):
    if request.headers.get("content-type", "").split(";")[0].strip() != "application/x-www-form-urlencoded":
        oauth_error("invalid_request", "Use application/x-www-form-urlencoded")
    form = await request.form()
    if any(len(form.getlist(key)) != 1 for key in form):
        oauth_error("invalid_request", "Duplicate form parameters")
    return await exchange_token(dict(form))

@router.post("/introspect")
async def introspect(token: str = Form(...), authorization: str | None = Header(None)):
    secret = settings.introspection_secret
    if not secret:
        oauth_error("temporarily_unavailable", "Token introspection is not configured", 503)
    if not authorization or not secrets.compare_digest(authorization, "Bearer " + secret.get_secret_value()):
        oauth_error("invalid_client", "Resource server authentication required", 401)
    return await introspect_token(token)
