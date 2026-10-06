from fastapi import Request
from services.oauth_service import SESSION_COOKIE, get_oauth_session

async def get_oauth_user(request: Request):
    session_id = request.cookies.get(SESSION_COOKIE)
    session = await get_oauth_session(session_id) if session_id else None
    return session["user_id"] if session else None
