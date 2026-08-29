from enum import Enum


class SourceType(str, Enum):
    YOUTUBE = "YOUTUBE"
    GCS = "GCS"
    VIDORAHUB = "VIDORAHUB"
