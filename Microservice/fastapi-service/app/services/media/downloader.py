from app.services.source.base import LocalMedia, VideoSourceProvider


class MediaDownloader:
    def acquire(self, provider: VideoSourceProvider, source_url: str, job_dir: str) -> LocalMedia:
        return provider.acquire(source_url, job_dir)
