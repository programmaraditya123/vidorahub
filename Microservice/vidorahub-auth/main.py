from fastapi import FastAPI,Header,Depends,Query
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from config.mongo import client,create_oauth_indexes
from services.oauth_service import authenticate_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated
from security.dependencies import require_authenticated_user 
from startup_functions.db import create_default_oauth_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    await client.admin.command("ping")
    print("MongoDB connected successfully")
    await create_oauth_indexes()
    await create_default_oauth_client()
    yield

    # async with mcp.session_manager.run():
    # yield


app = FastAPI(
    title="VidoraHub Authorization Server",
    version="1.0.0",
    lifespan=lifespan
)

@app.get('/')
def home():
    return "the mcp-auth backend is runing"

@app.get("/.well-known/oauth-authorization-server")
async def oauth_authorization_server():
    return {
        "issuer": "https://auth.vidorahub.com",

        "authorization_endpoint":
            "https://auth.vidorahub.com/authorize",

        "token_endpoint":
            "https://auth.vidorahub.com/token",

        "response_types_supported": [
            "code"
        ],

        "grant_types_supported": [
            "authorization_code",
            "refresh_token"
        ],

        "code_challenge_methods_supported": [
            "S256"
        ]
    }

security = HTTPBearer()

@app.get("/auth/me")
async def get_authenticated_user(user_id : Annotated[str,Depends(require_authenticated_user)]):


    return {
        "authenticated": True,
        "user": user_id,
    }

# @app.get("/authorize")
# async def authorize(
#     user_id: Annotated[
#         str,
#         Depends(require_authenticated_user)
#     ],

#     response_type: str = Query(...),
#     client_id: str = Query(...),
#     redirect_uri: str = Query(...),
#     state: str | None = Query(default=None),
#     code_challenge: str = Query(...),
#     code_challenge_method: str = Query(...),
#     resource: str = Query(...),
# ):
    