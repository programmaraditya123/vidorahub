from app.core.errors import AppError, ErrorCode
from app.models.video_source import SourceType
from app.services.media.http_download import download_http_video
from app.services.source.base import LocalMedia, SourceMetadata, VideoSourceProvider
from app.utils.url import normalize_and_detect


class GCSProvider(VideoSourceProvider):
    source_type = SourceType.GCS

    def inspect(self, url: str) -> SourceMetadata:
        detection = normalize_and_detect(url)
        return SourceMetadata(detection.source_type, detection.source_identifier, detection.normalized_url)

    def acquire(self, url: str, job_dir: str) -> LocalMedia:
        metadata = self.inspect(url)
        path = download_http_video(metadata.normalized_url, job_dir)
        return LocalMedia(path=path, metadata=metadata)
