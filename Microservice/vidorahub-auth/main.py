from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(
    title="VidoraHub Authorization Server",
    version="1.0.0",
)


@app.get("/.well-known/oauth-authorization-server")
async def oauth_authorization_server():
    return JSONResponse({
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
        ],

        "scopes_supported": [
            "profile:read",
            "products:read",
            "products:write",
            "stores:read",
            "stores:write"
        ]
    })