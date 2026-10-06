from fastapi import APIRouter
from config.mongo import settings

router = APIRouter(tags=["Discovery"])

@router.get("/.well-known/oauth-authorization-server")
async def metadata():
    issuer = settings.oauth_issuer.rstrip("/")
    return {"issuer": issuer, "authorization_endpoint": issuer + "/authorize",
        "token_endpoint": issuer + "/token", "registration_endpoint": issuer + "/register",
        "revocation_endpoint": issuer + "/revoke", "introspection_endpoint": issuer + "/introspect",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "token_endpoint_auth_methods_supported": ["none"],
        "revocation_endpoint_auth_methods_supported": ["none"],
        "code_challenge_methods_supported": ["S256"], "scopes_supported": settings.oauth_scopes.split()}
