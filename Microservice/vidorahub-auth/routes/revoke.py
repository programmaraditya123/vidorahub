from fastapi import APIRouter, Form, Response
from services.token_service import revoke_token

router = APIRouter(tags=["OAuth"])

@router.post("/revoke")
async def revoke(token: str = Form(...), client_id: str = Form(...), token_type_hint: str | None = Form(None)):
    await revoke_token(token, client_id)
    return Response(status_code=200)
