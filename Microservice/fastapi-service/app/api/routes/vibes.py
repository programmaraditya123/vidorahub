from fastapi import APIRouter

from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode
from app.repositories.vibe_repository import VibeRepository
from app.schemas.common import ok
from app.schemas.vibe import PublishRequest, VibeUpdate
from app.services.rendering.vibe_renderer import VibeRenderer

router = APIRouter(prefix="/vibes", tags=["vibes"])


@router.get("/{vibe_id}")
def get_vibe(vibe_id: str):
    return ok(VibeRepository().get(vibe_id))


@router.patch("/{vibe_id}")
def update_vibe(vibe_id: str, payload: VibeUpdate):
    return ok(VibeRepository().update(vibe_id, payload.model_dump()))


@router.post("/{vibe_id}/render")
def render_vibe(vibe_id: str):
    repo = VibeRepository()
    vibe = repo.mark_rendering(vibe_id)
    source_media_path = vibe.get("source_media_path")
    if not source_media_path:
        raise AppError(ErrorCode.VIDEO_NOT_FOUND, "The source media is no longer available for rendering.", 404)
    output_dir = f"{get_settings().media_output_dir}/{vibe['job_id']}"
    try:
        render_result = VibeRenderer().render(source_media_path, float(vibe["start_time"]), float(vibe["end_time"]), output_dir)
        return ok(repo.mark_ready(vibe_id, render_result["video_url"], render_result.get("thumbnail_url") or None, render_result))
    except AppError as exc:
        repo.mark_failed(vibe_id, exc.to_dict())
        raise


@router.get("/{vibe_id}/download")
def download_vibe(vibe_id: str):
    vibe = VibeRepository().get(vibe_id)
    if not vibe.get("video_url"):
        raise AppError(ErrorCode.VIDEO_NOT_FOUND, "The rendered video is not available for download yet.", 404)
    return ok({"download_url": vibe["video_url"], "expires_in_seconds": 900})


@router.post("/{vibe_id}/publish")
def publish_vibe(vibe_id: str, payload: PublishRequest):
    if not get_settings().vidorahub_api_url:
        raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "Configure VIDORAHUB_API_URL before publishing.", 503)
    raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "VidoraHub publish transport is not configured yet.", 503)
