from pydantic import BaseModel

from app.models.video_source import SourceType


class SourceDetection(BaseModel):
    source_type: SourceType
    normalized_url: str
    source_identifier: str
    display_name: str
