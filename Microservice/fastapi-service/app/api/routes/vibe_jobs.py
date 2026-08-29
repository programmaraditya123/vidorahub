from fastapi import APIRouter, Depends

from app.api.dependencies import AuthContext, get_auth_context
from app.repositories.vibe_job_repository import VibeJobRepository
from app.repositories.vibe_repository import VibeRepository
from app.schemas.common import ok
from app.schemas.vibe_job import VibeJobCreate
from app.utils.url import normalize_and_detect, source_fingerprint
from app.workers.vibe_worker import enqueue_vibe_job

router = APIRouter(prefix="/vibe-jobs", tags=["vibe-jobs"])


@router.post("")
def create_vibe_job(payload: VibeJobCreate, auth: AuthContext = Depends(get_auth_context)):
    detection = normalize_and_detect(payload.source_url)
    user_id = auth.user_id or payload.user_id
    account_id = auth.account_id or payload.account_id
    profile_id = auth.profile_id or payload.profile_id
    owner = user_id or account_id or auth.owner_fingerprint
    fingerprint = source_fingerprint(owner, detection.normalized_url)
    repo = VibeJobRepository()
    job, duplicate = repo.create_or_get_active(detection, owner, fingerprint, user_id, account_id, profile_id)
    if not duplicate:
        enqueue_vibe_job(job["_id"])
    return ok({"job": job, "duplicate": duplicate})


@router.get("/{job_id}")
def get_vibe_job(job_id: str):
    return ok(VibeJobRepository().get(job_id))


@router.post("/{job_id}/cancel")
def cancel_vibe_job(job_id: str):
    return ok(VibeJobRepository().request_cancel(job_id))


@router.get("/{job_id}/vibes")
def list_job_vibes(job_id: str):
    VibeJobRepository().get(job_id)
    return ok({"vibes": VibeRepository().list_for_job(job_id)})
