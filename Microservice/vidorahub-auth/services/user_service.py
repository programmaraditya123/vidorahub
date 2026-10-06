import bcrypt
from fastapi.concurrency import run_in_threadpool
from config.mongo import users_collection

# A real hash keeps nonexistent-user and wrong-password checks comparable.
DUMMY_HASH = bcrypt.hashpw(b"invalid-password", bcrypt.gensalt())

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
