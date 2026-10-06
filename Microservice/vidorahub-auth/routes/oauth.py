from fastapi import APIRouter, HTTPException

from models.oauth import (
    OAuthClientRegistrationRequest,
)
from services.oauth_service import (
    create_oauth_client,
)

router = APIRouter(
    prefix="/oauth",
    tags=["OAuth"],
)


@router.post("/register",status_code=201,)
async def register_oauth_client(
    data: OAuthClientRegistrationRequest,
):

    if data.token_endpoint_auth_method != "none":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only public clients using "
                "PKCE are currently supported"
            ),
        )

    if (
        "authorization_code"
        not in data.grant_types
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "authorization_code grant "
                "is required"
            ),
        )

    if data.response_types != ["code"]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only response_type=code "
                "is supported"
            ),
        )

    redirect_uris = [
        str(uri)
        for uri in data.redirect_uris
    ]

    client = await create_oauth_client(
        client_name=data.client_name,
        redirect_uris=redirect_uris,
        grant_types=data.grant_types,
        response_types=data.response_types,
        token_endpoint_auth_method=
            data.token_endpoint_auth_method,
        scope = data.scope,
        isActive = data.isActive
    )

    return client