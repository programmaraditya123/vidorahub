from fastapi import Header,HTTPException,Response
import jwt
from config.mongo import settings,users_collection,oauth_clients_collection
from bson import ObjectId
from models.oauth import OAuthClient



import hashlib
import secrets
import time
from datetime import datetime, timedelta, timezone

from config.mongo import (
    oauth_clients_collection,
    oauth_authorization_codes_collection,
    oauth_sessions_collection
)


AUTHORIZATION_CODE_EXPIRE_SECONDS = 300

OAUTH_SESSION_EXPIRE_SECONDS = 600


def generate_session_id() -> str:
    return secrets.token_urlsafe(48)


async def create_oauth_session(
    response : Response,
    user_id: str,
) -> str:

    session_id = generate_session_id()

    now = datetime.now(timezone.utc)

    expires_at = (
        now
        + timedelta(
            seconds=OAUTH_SESSION_EXPIRE_SECONDS
        )
    )

    await oauth_sessions_collection.insert_one(
        {
            "session_id": session_id,
            "user_id": user_id,
            "created_at": now,
            "expires_at": expires_at,
        }
    )
    response.set_cookie(
        key="oauth_session",
        value=session_id,
        httponly=True,   # Prevents JavaScript from reading the cookie (protects against XSS)
        secure=True,     # Set to True in production (requires HTTPS)
        samesite="lax",  # Controls cross-site cookie sending
        max_age=86400    # Expiration time in seconds (e.g., 1 day)
    )

    return session_id


async def get_oauth_session(
    session_id: str,
):
    return await oauth_sessions_collection.find_one(
        {
            "session_id": session_id,
            "expires_at": {
                "$gt": datetime.now(timezone.utc)
            },
        }
    )


def generate_client_id() -> str:
    return f"vhc_{secrets.token_urlsafe(24)}"


def generate_authorization_code() -> str:
    return secrets.token_urlsafe(48)


def hash_secret(value: str) -> str:
    return hashlib.sha256(
        value.encode("utf-8")
    ).hexdigest()


async def create_oauth_client(
    *,
    client_name: str,
    redirect_uris: list[str],
    grant_types: list[str],
    response_types: list[str],
    token_endpoint_auth_method: str,
    scope : str,
    isActive : bool
):
    client_id = generate_client_id()

    now = int(time.time())

    document = {
        "client_id": client_id,
        "client_name": client_name,
        "redirect_uris": redirect_uris,

        "grant_types": grant_types,
        "response_types": response_types,

        "token_endpoint_auth_method":
            token_endpoint_auth_method,

        "client_id_issued_at": now,

        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "scope" : scope,
        "isActive" : isActive
    }

    await oauth_clients_collection.insert_one(document)

    return {
        "client_id": client_id,
        "client_name": client_name,
        "redirect_uris": redirect_uris,
        "grant_types": grant_types,
        "response_types": response_types,
        "token_endpoint_auth_method":
            token_endpoint_auth_method,
        "client_id_issued_at": now,
        "scope" : scope,
        "isActive" : isActive
    }


async def get_oauth_client(
    client_id: str,
):
    return await oauth_clients_collection.find_one(
        {
            "client_id": client_id
        }
    )


def verify_redirect_uri(
    client: dict,
    redirect_uri: str,
) -> bool:
    return redirect_uri in client.get(
        "redirect_uris",
        []
    )


async def create_authorization_code(
    *,
    client_id: str,
    user_id: str,
    redirect_uri: str,
    scope: str | None,
    code_challenge: str,
    code_challenge_method: str,
):
    raw_code = generate_authorization_code()

    code_hash = hash_secret(raw_code)

    expires_at = datetime.now(
        timezone.utc
    ) + timedelta(
        seconds=AUTHORIZATION_CODE_EXPIRE_SECONDS
    )

    document = {
        "code_hash": code_hash,

        "client_id": client_id,
        "user_id": user_id,

        "redirect_uri": redirect_uri,

        "scope": scope,

        "code_challenge": code_challenge,
        "code_challenge_method":
            code_challenge_method,

        "expires_at": expires_at,

        "used": False,

        "created_at":
            datetime.now(timezone.utc),
    }

    await oauth_authorization_codes_collection.insert_one(
        document
    )

    return raw_code

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



async def get_oauth_client(
    client_id: str
) -> OAuthClient:

    client = await oauth_clients_collection.find_one({"client_id":client_id})

    # if not client:
    #     raise HTTPException(
    #         status_code=400,
    #         detail="Unknown client_id"
    #     )
    # if redirect_uri not in client.redirect_uris:
    #    raise HTTPException(
    #         status_code=400,
    #         detail="Invalid redirect_uri"
    # )
    # if response_type != "code":
    #     raise HTTPException(
    #         status_code=400,
    #         detail="Unsupported response_type"
    #     )
    # if "authorization_code" not in client.grant_types:
    #     raise HTTPException(
    #         status_code=400,
    #         detail="Client does not support authorization_code grant"
    #     )
    # if code_challenge_method != "S256":
    #     raise HTTPException(
    #         status_code=400,
    #         detail="Only S256 PKCE is supported"
    #     )
    # if resource != EXPECTED_RESOURCE:
    #     raise HTTPException(
    #         status_code=400,
    #         detail="Invalid resource"
    #     )
    return client