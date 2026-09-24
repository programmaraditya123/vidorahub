from fastapi import Header,HTTPException
import jwt
from config.mongo import settings,users_collection
from bson import ObjectId
from models.oauth import OAuthClient


async def authenticate_user(
    authorization: str | None,
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is required",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    token = authorization.strip()
    

    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Token is missing",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )
    secret = settings.jwt_secret.get_secret_value() if settings.jwt_secret else ""
    try:

        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={
                "require": [
                    "exp",
                    "_id",
                ]
            },
        )

        user_id = payload["_id"]

        if not isinstance(user_id, str):
            raise ValueError()

        if not ObjectId.is_valid(user_id):
            raise ValueError()

    except (
        jwt.InvalidTokenError,
        TypeError,
        ValueError,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        ) from None

    user = await users_collection.find_one(
        {
            "_id": ObjectId(user_id)
        },
        {
            "name": 1,
            "email": 1,
            "role": 1,
            "profilePicUrl": 1,
            "userSerialNumber": 1,
        },
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return {
        "user_id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "profilePicUrl": user.get("profilePicUrl"),
        "userSerialNumber": user.get(
            "userSerialNumber"
        ),
    }


OAUTH_CLIENTS = {
    "buddy-ai": OAuthClient(
        client_id="buddy-ai",
        client_name="Buddy AI",
        redirect_uris=[
            "http://localhost:3000/oauth/callback"
        ],
        grant_types=[
            "authorization_code",
            "refresh_token"
        ],
        token_endpoint_auth_method="none",
    )
}
redirect_uri=[
    "http://localhost:3000/oauth/callback"
]

response_type="code"

code_challenge_method="S256"

EXPECTED_RESOURCE = "https://mcp.vidorahub.com"

resource = "https://mcp.vidorahub.com"

def get_oauth_client(
    client_id: str
) -> OAuthClient:

    client = OAUTH_CLIENTS.get(client_id)

    if not client:
        raise HTTPException(
            status_code=400,
            detail="Unknown client_id"
        )
    if redirect_uri not in client.redirect_uris:
       raise HTTPException(
            status_code=400,
            detail="Invalid redirect_uri"
    )
    if response_type != "code":
        raise HTTPException(
            status_code=400,
            detail="Unsupported response_type"
        )
    if "authorization_code" not in client.grant_types:
        raise HTTPException(
            status_code=400,
            detail="Client does not support authorization_code grant"
        )
    if code_challenge_method != "S256":
        raise HTTPException(
            status_code=400,
            detail="Only S256 PKCE is supported"
        )
    if resource != EXPECTED_RESOURCE:
        raise HTTPException(
            status_code=400,
            detail="Invalid resource"
        )
    return client