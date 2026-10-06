from fastapi import (
    APIRouter,
    HTTPException,
    Request,
)
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode

from models.oauth import AuthorizeQuery
from services.oauth_service import (
    get_oauth_client,
    verify_redirect_uri,
    create_authorization_code,
    create_oauth_session

)
from security.dependencies import create_oauth_transaction
from security.sessions import get_oauth_user

router = APIRouter(
    tags=["OAuth"],
)


@router.get("/authorize")
async def authorize(
    request: Request,
    client_id: str,
    redirect_uri: str,
    response_type: str,
    scope: str | None = None,
    state: str | None = None,
    code_challenge: str | None = None,
    code_challenge_method: str | None = None,
):
    #first find the client is it valid or unknown
    client = await get_oauth_client(client_id)

    if not client:
        raise HTTPException(
            status_code=400,
            detail="Unknown client_id",
        )


    #Exact redirect URI validation
    if redirect_uri not in client.get("redirect_uris", []):
        raise HTTPException(
            status_code=400,
            detail="Invalid redirect_uri",
        )


    if response_type != "code":
        raise HTTPException(
            status_code=400,
            detail="Unsupported response_type",
        )


    # if not code_challenge:
        raise HTTPException(
            status_code=400,
            detail="code_challenge is required",
        )


    if code_challenge_method != "S256":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only S256 PKCE is supported"
            ),
        )
    # --------------------------------
    # 5. Get authenticated VidoraHub user
    # --------------------------------

    # auth_code = await create_oauth_session(
    #     # client_id=client_id,
    #     user_id=client_id,
    #     response=client_id
    #     # scope=scope
    # )

    print("*****",request)

    user_id = await get_oauth_user(request)
    print("-----------",user_id)

    if not user_id:

        transaction_id = (
            await create_oauth_transaction(
                client_id=client_id,
                redirect_uri=redirect_uri,
                response_type=response_type,
                scope=scope,
                state=state,
                code_challenge=code_challenge,
                code_challenge_method=
                    code_challenge_method,
            )
        )

        return RedirectResponse(
            url=f"/oauth/login?transaction_id={transaction_id}"
        )

    # user_id = user_id

    # --------------------------------
    # 6. Create authorization code
    # --------------------------------

    code = await create_authorization_code(
        client_id=client_id,
        user_id=user_id,
        redirect_uri=redirect_uri,
        scope=scope,
        code_challenge=code_challenge,
        code_challenge_method=
            code_challenge_method,
    )

    # --------------------------------
    # 7. Redirect to client
    # --------------------------------

    params = {
    "code": code,
}

    if state:
        params["state"] = state

    redirect_url = (
        f"{redirect_uri}"
        f"?{urlencode(params)}"
    )

    return RedirectResponse(
        url=redirect_url,
        status_code=302,
    )


@router.get("/login")
async def oauth_login(
    transaction_id: str,
):
    # transaction = (
    #     await get_oauth_transaction(
    #         transaction_id
    #     )
    # )
    transaction = True

    if not transaction:
        raise HTTPException(
            400,
            "Invalid or expired OAuth transaction",
        )

    # Your actual VidoraHub frontend
    login_url = (
        "https://www.vidorahub.com/login"
        "?oauth_transaction="
        + transaction_id
    )

    return RedirectResponse(
        login_url
    )