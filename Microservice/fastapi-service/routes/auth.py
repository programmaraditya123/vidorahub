from typing import Annotated

from fastapi import APIRouter, Depends

from services.auth import require_sign_in

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/check-session")
async def check_session(user: Annotated[dict, Depends(require_sign_in)]):
    return {"ok": True, "user": user}
