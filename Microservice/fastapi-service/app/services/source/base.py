from dataclasses import dataclass

from app.models.video_source import SourceType


@dataclass(frozen=True)
class SourceMetadata:
    source_type: SourceType
    source_identifier: str
    normalized_url: str
    title: str | None = None
    duration_seconds: int | None = None
    size_bytes: int | None = None


@dataclass(frozen=True)
class LocalMedia:
    path: str
    metadata: SourceMetadata


class VideoSourceProvider:
    source_type: SourceType

    def inspect(self, url: str) -> SourceMetadata:
        raise NotImplementedError

    def acquire(self, url: str, job_dir: str) -> LocalMedia:
        raise NotImplementedError
