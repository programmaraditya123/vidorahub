from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode
from app.models.video_source import SourceType
from app.services.media.http_download import download_http_video
from app.services.source.base import LocalMedia, SourceMetadata, VideoSourceProvider
from app.utils.url import normalize_and_detect


class VidoraHubProvider(VideoSourceProvider):
    source_type = SourceType.VIDORAHUB

    def inspect(self, url: str) -> SourceMetadata:
        detection = normalize_and_detect(url)
        return SourceMetadata(detection.source_type, detection.source_identifier, detection.normalized_url)

    def acquire(self, url: str, job_dir: str) -> LocalMedia:
        settings = get_settings()
        metadata = self.inspect(url)
        # Direct VidoraHub media URLs can be downloaded as-is. API-backed private
        # media can be added here once the internal VidoraHub media endpoint is available.
        if not (settings.vidorahub_internal_api_url or settings.vidorahub_api_url):
            path = download_http_video(metadata.normalized_url, job_dir)
            return LocalMedia(path=path, metadata=metadata)
        path = download_http_video(metadata.normalized_url, job_dir)
        return LocalMedia(path=path, metadata=metadata)
