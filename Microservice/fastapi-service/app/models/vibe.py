from enum import Enum


class VibeStatus(str, Enum):
    DRAFT = "DRAFT"
    RENDERING = "RENDERING"
    READY = "READY"
    FAILED = "FAILED"
    PUBLISHED = "PUBLISHED"
