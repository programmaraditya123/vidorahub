from datetime import datetime, timedelta, timezone
from typing import Any

from bson import ObjectId

from app.core.database import get_collection
from app.core.errors import AppError, ErrorCode
from app.models.vibe_job import ACTIVE_JOB_STATUSES, JobStatus
from app.schemas.video_source import SourceDetection


def _serialize(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    return doc


class VibeJobRepository:
    def __init__(self) -> None:
        self.collection = get_collection("vibe_jobs")

    def create_or_get_active(
        self,
        detection: SourceDetection,
        owner_fingerprint: str,
        source_fingerprint: str,
        user_id: str | None,
        account_id: str | None,
        profile_id: str | None,
    ) -> tuple[dict[str, Any], bool]:
        existing = self.collection.find_one(
            {
                "owner_fingerprint": owner_fingerprint,
                "source_fingerprint": source_fingerprint,
                "status": {"$in": list(ACTIVE_JOB_STATUSES)},
            }
        )
        if existing:
            return _serialize(existing), True
        now = datetime.now(timezone.utc)
        doc = {
            "user_id": user_id,
            "account_id": account_id,
            "profile_id": profile_id,
            "owner_fingerprint": owner_fingerprint,
            "source_fingerprint": source_fingerprint,
            "source_type": detection.source_type,
            "source_url": detection.normalized_url,
            "source_identifier": detection.source_identifier,
            "status": JobStatus.QUEUED,
            "progress": 0,
            "current_stage": JobStatus.QUEUED,
            "error": None,
            "created_at": now,
            "updated_at": now,
            "started_at": None,
            "completed_at": None,
            "expires_at": now + timedelta(days=7),
            "stage_state": {},
            "cancel_requested": False,
            "attempts": 0,
        }
        result = self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return _serialize(doc), False

    def get(self, job_id: str) -> dict[str, Any]:
        doc = self.collection.find_one({"_id": ObjectId(job_id)})
        if not doc:
            raise AppError(ErrorCode.JOB_NOT_FOUND, "That processing job was not found.", 404)
        return _serialize(doc)

    def update_stage(
        self,
        job_id: str,
        status: JobStatus,
        progress: int,
        stage_state: dict[str, Any] | None = None,
    ) -> None:
        update: dict[str, Any] = {
            "status": status,
            "current_stage": status,
            "progress": progress,
            "updated_at": datetime.now(timezone.utc),
        }
        if status != JobStatus.QUEUED:
            update.setdefault("started_at", datetime.now(timezone.utc))
        if stage_state:
            update["stage_state"] = stage_state
        self.collection.update_one({"_id": ObjectId(job_id)}, {"$set": update, "$setOnInsert": {}})

    def complete(self, job_id: str) -> None:
        now = datetime.now(timezone.utc)
        self.collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": JobStatus.COMPLETED, "current_stage": JobStatus.COMPLETED, "progress": 100, "updated_at": now, "completed_at": now}},
        )

    def fail(self, job_id: str, error: dict[str, Any]) -> None:
        now = datetime.now(timezone.utc)
        self.collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": JobStatus.FAILED, "current_stage": JobStatus.FAILED, "error": error, "updated_at": now, "completed_at": now}},
        )

    def request_cancel(self, job_id: str) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        self.collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"cancel_requested": True, "status": JobStatus.CANCELLED, "current_stage": JobStatus.CANCELLED, "updated_at": now, "completed_at": now}},
        )
        return self.get(job_id)

    def is_cancelled(self, job_id: str) -> bool:
        doc = self.collection.find_one({"_id": ObjectId(job_id)}, {"cancel_requested": 1, "status": 1})
        return bool(doc and (doc.get("cancel_requested") or doc.get("status") == JobStatus.CANCELLED))
