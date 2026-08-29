from app.models.video_source import SourceType
from app.services.source.gcs import GCSProvider
from app.services.source.vidorahub import VidoraHubProvider
from app.services.source.youtube import YouTubeProvider
from app.utils.url import normalize_and_detect


class SourceRegistry:
    def __init__(self) -> None:
        self.providers = {
            SourceType.YOUTUBE: YouTubeProvider(),
            SourceType.GCS: GCSProvider(),
            SourceType.VIDORAHUB: VidoraHubProvider(),
        }

    def resolve(self, url: str):
        detection = normalize_and_detect(url)
        return self.providers[detection.source_type]
