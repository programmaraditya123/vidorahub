from fastapi import APIRouter, Depends
from pydantic import BaseModel
from security.oauth_dependencies import require_oauth_user

router = APIRouter(tags=["Users"])


class OAuthUser(BaseModel):
    id: str
    name: str | None = None
    email: str | None = None
    role: int | None = None
    profilePicUrl: str | None = None


class OAuthUserResponse(BaseModel):
    authenticated: bool
    user: OAuthUser


@router.get("/oauth/userinfo", response_model=OAuthUserResponse,
    summary="Find the user belonging to the MCP access token")
async def userinfo(user: dict = Depends(require_oauth_user)):
    return {"authenticated": True, "user": user}
