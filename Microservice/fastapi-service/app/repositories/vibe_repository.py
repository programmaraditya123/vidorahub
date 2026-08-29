from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from app.core.database import get_collection
from app.core.errors import AppError, ErrorCode
from app.models.vibe import VibeStatus


def _serialize(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    return doc


class VibeRepository:
    def __init__(self) -> None:
        self.collection = get_collection("vibes")

    def list_for_job(self, job_id: str) -> list[dict[str, Any]]:
        return [_serialize(doc) for doc in self.collection.find({"job_id": job_id}).sort("vibe_score", -1)]

    def get(self, vibe_id: str) -> dict[str, Any]:
        doc = self.collection.find_one({"_id": ObjectId(vibe_id)})
        if not doc:
            raise AppError(ErrorCode.VIBE_NOT_FOUND, "That Vibe was not found.", 404)
        return _serialize(doc)

    def update(self, vibe_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        clean = {key: value for key, value in changes.items() if value is not None}
        if clean:
            clean["updated_at"] = datetime.now(timezone.utc)
            if "start_time" in clean or "end_time" in clean:
                existing = self.get(vibe_id)
                start = clean.get("start_time", existing["start_time"])
                end = clean.get("end_time", existing["end_time"])
                if end <= start:
                    raise AppError(ErrorCode.INVALID_URL, "End time must be after start time.")
                clean["duration"] = end - start
            self.collection.update_one({"_id": ObjectId(vibe_id)}, {"$set": clean})
        return self.get(vibe_id)

    def mark_rendering(self, vibe_id: str) -> dict[str, Any]:
        self.collection.update_one(
            {"_id": ObjectId(vibe_id)},
            {"$set": {"status": VibeStatus.RENDERING, "updated_at": datetime.now(timezone.utc)}},
        )
        return self.get(vibe_id)

    def mark_ready(self, vibe_id: str, video_url: str, thumbnail_url: str | None = None, render_result: dict[str, Any] | None = None) -> dict[str, Any]:
        update: dict[str, Any] = {
            "status": VibeStatus.READY,
            "video_url": video_url,
            "updated_at": datetime.now(timezone.utc),
        }
        if thumbnail_url:
            update["thumbnail_url"] = thumbnail_url
        if render_result:
            update["render_result"] = render_result
        self.collection.update_one({"_id": ObjectId(vibe_id)}, {"$set": update})
        return self.get(vibe_id)

    def mark_failed(self, vibe_id: str, error: dict[str, Any]) -> dict[str, Any]:
        self.collection.update_one(
            {"_id": ObjectId(vibe_id)},
            {"$set": {"status": VibeStatus.FAILED, "render_error": error, "updated_at": datetime.now(timezone.utc)}},
        )
        return self.get(vibe_id)

    def mark_published(self, vibe_id: str, publish_result: dict[str, Any]) -> dict[str, Any]:
        self.collection.update_one(
            {"_id": ObjectId(vibe_id)},
            {"$set": {"status": VibeStatus.PUBLISHED, "publish_result": publish_result, "updated_at": datetime.now(timezone.utc)}},
        )
        return self.get(vibe_id)

    def bulk_insert(self, vibes: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not vibes:
            return []
        now = datetime.now(timezone.utc)
        for vibe in vibes:
            vibe.setdefault("created_at", now)
            vibe.setdefault("updated_at", now)
        result = self.collection.insert_many(vibes)
        return [self.get(str(inserted_id)) for inserted_id in result.inserted_ids]
