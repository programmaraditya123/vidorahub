from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.vibe_job import JobStatus
from app.models.video_source import SourceType


class VibeJobCreate(BaseModel):
    source_url: str = Field(min_length=1, max_length=4096)
    user_id: str | None = None
    account_id: str | None = None
    profile_id: str | None = None


class VibeJob(BaseModel):
    id: str = Field(alias="_id")
    user_id: str | None = None
    account_id: str | None = None
    profile_id: str | None = None
    source_type: SourceType
    source_url: str
    source_identifier: str
    status: JobStatus
    progress: int
    current_stage: JobStatus
    error: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    expires_at: datetime | None = None

    model_config = {"populate_by_name": True}


class VibeJobCreateResult(BaseModel):
    job: VibeJob
    duplicate: bool = False
