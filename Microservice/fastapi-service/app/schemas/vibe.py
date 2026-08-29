from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.vibe import VibeStatus
from app.models.video_source import SourceType


class Vibe(BaseModel):
    id: str = Field(alias="_id")
    job_id: str
    user_id: str | None = None
    account_id: str | None = None
    profile_id: str | None = None
    source_video_id: str
    source_type: SourceType
    start_time: float
    end_time: float
    duration: float
    title: str
    hook: str
    description: str | None = None
    transcript: list[dict[str, Any]] = []
    caption_data: dict[str, Any] = {}
    vibe_score: float
    hook_score: float
    value_score: float
    emotion_score: float
    completeness_score: float
    status: VibeStatus
    video_url: str | None = None
    thumbnail_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class VibeUpdate(BaseModel):
    start_time: float | None = None
    end_time: float | None = None
    title: str | None = None
    caption_style: str | None = None
    aspect_ratio: str | None = None


class PublishRequest(BaseModel):
    title: str
    description: str | None = None
    visibility: str = "private"
    tags: list[str] = []
