from fastapi import APIRouter

from app.core.config import get_settings
from app.core.database import get_client
from app.schemas.common import ok

router = APIRouter()


@router.get("/health")
def health():
    return ok({"status": "ok", "service": get_settings().app_name})


@router.get("/ready")
def ready():
    settings = get_settings()
    mongo = "not_configured"
    if settings.mongodb_uri:
        get_client().admin.command("ping")
        mongo = "ok"
    return ok({"status": "ready", "mongo": mongo})
