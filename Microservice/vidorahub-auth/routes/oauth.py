from fastapi import APIRouter
from models.oauth import OAuthClientRegistrationRequest
from services.oauth_service import create_oauth_client

router = APIRouter(tags=["OAuth"])

@router.post("/register", status_code=201)
@router.post("/oauth/register", status_code=201, include_in_schema=False)
async def register_oauth_client(data: OAuthClientRegistrationRequest):
    return await create_oauth_client(data)
