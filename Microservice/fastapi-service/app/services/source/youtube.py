from pathlib import Path

from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode
from app.models.video_source import SourceType
from app.services.source.base import LocalMedia, SourceMetadata, VideoSourceProvider
from app.utils.url import normalize_and_detect


class YouTubeProvider(VideoSourceProvider):
    source_type = SourceType.YOUTUBE

    def inspect(self, url: str) -> SourceMetadata:
        if not get_settings().youtube_enabled:
            raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "YouTube processing is disabled.", 503)
        detection = normalize_and_detect(url)
        return SourceMetadata(detection.source_type, detection.source_identifier, detection.normalized_url)

    def acquire(self, url: str, job_dir: str) -> LocalMedia:
        try:
            from yt_dlp import YoutubeDL
        except ImportError as exc:
            raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "Install yt-dlp before processing YouTube videos.", 503) from exc

        detection = normalize_and_detect(url)
        output_template = str(Path(job_dir) / "source.%(ext)s")
        options = {
            "format": "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best",
            "outtmpl": output_template,
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
        }
        try:
            with YoutubeDL(options) as downloader:
                info = downloader.extract_info(url, download=True)
                downloaded = Path(downloader.prepare_filename(info))
                media_path = downloaded.with_suffix(".mp4") if downloaded.suffix != ".mp4" else downloaded
                if not media_path.exists():
                    matches = list(Path(job_dir).glob("source.*"))
                    if not matches:
                        raise AppError(ErrorCode.VIDEO_DOWNLOAD_FAILED, "yt-dlp did not produce a media file.", 502)
                    media_path = matches[0]
                metadata = SourceMetadata(
                    source_type=detection.source_type,
                    source_identifier=detection.source_identifier,
                    normalized_url=detection.normalized_url,
                    title=info.get("title"),
                    duration_seconds=int(info["duration"]) if info.get("duration") else None,
                    size_bytes=int(info["filesize"] or info["filesize_approx"]) if info.get("filesize") or info.get("filesize_approx") else None,
                )
                return LocalMedia(str(media_path), metadata)
        except AppError:
            raise
        except Exception as exc:
            raise AppError(ErrorCode.VIDEO_DOWNLOAD_FAILED, "Could not download the YouTube video with yt-dlp.", 502) from exc
