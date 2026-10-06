from fastapi import Request

from services.oauth_service import (
    get_oauth_session,
)


async def get_oauth_user(
    request: Request,
):
    session_id = request.cookies.get(
        "vh_oauth_session"
    )
    print("+++++++++",session_id)

    if not session_id:
        return None

    session = await get_oauth_session(
        session_id
    )

    if not session:
        return None

    return session["user_id"]