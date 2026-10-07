"""FastAPI dependency for endpoints using opaque MCP OAuth access tokens."""
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.user_service import get_user_for_access_token

oauth_bearer = HTTPBearer(auto_error=False, scheme_name="MCPAccessToken",
    description="MCP OAuth access_token returned by /token, not an Express login JWT")


async def require_oauth_user(request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(oauth_bearer)) -> dict:
    if credentials is None:
        raise HTTPException(401, detail={"error": "invalid_token",
            "error_description": "Authorization: Bearer <MCP access token> is required"},
            headers={"WWW-Authenticate": "Bearer"})
    user = await get_user_for_access_token(credentials.credentials)
    request.state.user = user
    return user
