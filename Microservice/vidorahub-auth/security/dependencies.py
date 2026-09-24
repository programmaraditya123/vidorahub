
from typing import Annotated

import jwt
from bson import ObjectId
from fastapi import Depends, HTTPException, Request,Header
from fastapi.security import APIKeyHeader
from pymongo.errors import PyMongoError

from config.mongo import settings, users_collection

async def require_oauth_token(
    authorization: str | None = Header(default=None),
):

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization required",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not authorization.lower().startswith(
        "bearer "
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    token = authorization[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Access token missing",
        )

    # JWT validation will be added here.

    return token





# APIKeyHeader also supports the legacy raw-token header accepted by Express.
authorization_header = APIKeyHeader(
    name="Authorization", auto_error=False,
    description="Bearer <backend login token> (legacy raw tokens also accepted)",
)


async def require_authenticated_user(
    request: Request,
    authorization: Annotated[str | None, Depends(authorization_header)],
) -> dict:
    """Opt in with Depends(require_sign_in); no global auth middleware is needed."""
    def unauthorized(message: str) -> HTTPException:
        return HTTPException(401, detail=message, headers={"WWW-Authenticate": "Bearer"})

    if not authorization or not authorization.strip():
        raise unauthorized("token is not present")
    token = authorization.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    secret = settings.jwt_secret.get_secret_value() if settings.jwt_secret else ""
    if not secret:
        raise HTTPException(503, detail="Authentication is not configured")

    try:
        payload = jwt.decode(
            token, secret, algorithms=["HS256"],
            options={"require": ["exp", "_id"]},
        )
        user_id = payload["_id"]
        if not isinstance(user_id, str) or not ObjectId.is_valid(user_id):
            raise unauthorized("Invalid or expired token")
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise unauthorized("Invalid or expired token") from None

    try:
        user = await users_collection.find_one(
            {"_id": ObjectId(user_id)},
            {"name": 1, "email": 1, "role": 1, "profilePicUrl": 1},
            max_time_ms=5000,
        )
    except PyMongoError:
        raise HTTPException(503, detail="Authentication is temporarily unavailable") from None
    if user is None:
        raise unauthorized("User not found")

    user["_id"] = str(user["_id"])
    request.state.user = user
    return user["_id"]
