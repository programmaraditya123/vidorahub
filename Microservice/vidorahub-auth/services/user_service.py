import bcrypt
from bson import ObjectId
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from config.mongo import users_collection, settings
from services.token_service import introspect_token

# A real hash keeps nonexistent-user and wrong-password checks comparable.
DUMMY_HASH = bcrypt.hashpw(b"invalid-password", bcrypt.gensalt())


async def get_user_by_id(user_id):
    """Resolve an account to public identity fields, without exposing credentials."""
    if not isinstance(user_id, str) or not ObjectId.is_valid(user_id):
        return None
    user = await users_collection.find_one({"_id": ObjectId(user_id)},
        {"name": 1, "email": 1, "role": 1, "profilePicUrl": 1,
            "isBlocked": 1, "isDeleted": 1}, max_time_ms=5000)
    if not user or user.get("isBlocked") or user.get("isDeleted"):
        return None
    return {"id": str(user["_id"]), **{key: user.get(key)
        for key in ("name", "email", "role", "profilePicUrl")}}


async def get_user_for_access_token(raw_token, required_scopes=None):
    """Reusable OAuth identity lookup; never treats refresh tokens or login JWTs as access tokens."""
    identity = await introspect_token(raw_token)
    if (not identity.get("active") or identity.get("aud") != settings.mcp_resource
            or identity.get("iss") != settings.oauth_issuer.rstrip("/")):
        raise HTTPException(401, detail={"error": "invalid_token",
            "error_description": "Invalid, expired, or revoked MCP access token"},
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'})
    required = set(settings.oauth_scopes.split() if required_scopes is None else required_scopes)
    if not required <= set(identity.get("scope", "").split()):
        raise HTTPException(403, detail={"error": "insufficient_scope",
            "error_description": "Access token lacks the required scopes"},
            headers={"WWW-Authenticate": 'Bearer error="insufficient_scope"'})
    user = await get_user_by_id(identity.get("sub"))
    if user is None:
        raise HTTPException(401, detail={"error": "invalid_token",
            "error_description": "User account is unavailable"},
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'})
    return user

async def authenticate_password(email, password):
    if len(email) > 320 or len(password) > 4096:
        return None
    user = await users_collection.find_one({"email": email.strip()})
    stored = user.get("password") if user else None
    hashed = stored.encode() if isinstance(stored, str) else DUMMY_HASH
    # Express bcrypt truncates UTF-8 passwords to 72 bytes. Match existing accounts.
    try:
        valid = await run_in_threadpool(bcrypt.checkpw, password.encode()[:72], hashed)
    except (ValueError, TypeError):
        valid = False
    return str(user["_id"]) if user and stored and valid else None
