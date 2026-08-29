from app.services.ai.analysis import MomentCandidate
from app.services.ai.transcription import TranscriptSegment


class VibeDetector:
    def detect(self, moments: list[MomentCandidate], transcript: list[TranscriptSegment]) -> list[MomentCandidate]:
        return sorted(moments, key=lambda moment: moment.vibe_score, reverse=True)
