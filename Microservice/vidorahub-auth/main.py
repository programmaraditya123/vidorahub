from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
from config.mongo import client, create_oauth_indexes
from routes import authorize, metadata, oauth, revoke, token
from security.dependencies import require_authenticated_user

@asynccontextmanager
async def lifespan(app):
    await client.admin.command("ping")
    await create_oauth_indexes()
    try:
        yield
    finally:
        client.close()

app = FastAPI(title="VidoraHub Authorization Server", version="1.0.0", lifespan=lifespan)
for module in (metadata, oauth, authorize, token, revoke):
    app.include_router(module.router)

@app.middleware("http")
async def response_security(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    # FastAPI's docs load CDN assets and inline scripts to render their UI.
    docs_paths = {app.docs_url, app.redoc_url, app.swagger_ui_oauth2_redirect_url}
    if request.scope.get("path") not in docs_paths:
        response.headers.setdefault("Content-Security-Policy", "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'")
    return response


@app.exception_handler(HTTPException)
async def oauth_exception(request, exc):
    body = exc.detail if isinstance(exc.detail, dict) else {"error": "invalid_request", "error_description": exc.detail}
    return JSONResponse(body, status_code=exc.status_code, headers=exc.headers)

@app.exception_handler(RequestValidationError)
async def invalid_request(request, exc):
    if request.scope.get("path") in {"/register", "/oauth/register"}:
        return JSONResponse({"error": "invalid_client_metadata", "error_description": "Invalid public client registration metadata"}, status_code=400)
    return JSONResponse({"error": "invalid_request", "error_description": "Missing or invalid request parameters"}, status_code=400)

@app.exception_handler(PyMongoError)
async def database_unavailable(request, exc):
    return JSONResponse({"error": "temporarily_unavailable", "error_description": "Authentication storage is unavailable"}, status_code=503)

@app.get("/")
async def home():
    return {"service": "vidorahub-auth", "status": "ok"}

@app.get("/auth/me")
async def get_authenticated_user(user_id: str = Depends(require_authenticated_user)):
    return {"authenticated": True, "user": user_id}
