from dataclasses import dataclass

from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode


@dataclass(frozen=True)
class TranscriptSegment:
    start: float
    end: float
    text: str
    speaker: str | None = None
    confidence: float | None = None


class TranscriptionProvider:
    def transcribe(self, audio_path: str) -> list[TranscriptSegment]:
        raise NotImplementedError


class DisabledTranscriptionProvider(TranscriptionProvider):
    def transcribe(self, audio_path: str) -> list[TranscriptSegment]:
        raise AppError(
            ErrorCode.PROVIDER_NOT_CONFIGURED,
            "Configure TRANSCRIPTION_PROVIDER and TRANSCRIPTION_API_KEY before transcription can run.",
            503,
        )


class OpenAITranscriptionProvider(TranscriptionProvider):
    def transcribe(self, audio_path: str) -> list[TranscriptSegment]:
        settings = get_settings()
        if not settings.transcription_api_key and not settings.ai_api_key:
            raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "Configure TRANSCRIPTION_API_KEY or AI_API_KEY for OpenAI transcription.", 503)
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "Install the openai package before OpenAI transcription can run.", 503) from exc

        client = OpenAI(api_key=settings.transcription_api_key or settings.ai_api_key)
        try:
            with open(audio_path, "rb") as audio:
                result = client.audio.transcriptions.create(
                    model=settings.transcription_model,
                    file=audio,
                    response_format="verbose_json",
                )
        except Exception as exc:
            raise AppError(ErrorCode.TRANSCRIPTION_FAILED, "OpenAI transcription failed.", 502) from exc

        segments = getattr(result, "segments", None) or []
        transcript: list[TranscriptSegment] = []
        for segment in segments:
            if isinstance(segment, dict):
                transcript.append(
                    TranscriptSegment(
                        start=float(segment.get("start", 0)),
                        end=float(segment.get("end", 0)),
                        text=str(segment.get("text", "")).strip(),
                    )
                )
            else:
                transcript.append(
                    TranscriptSegment(
                        start=float(getattr(segment, "start", 0)),
                        end=float(getattr(segment, "end", 0)),
                        text=str(getattr(segment, "text", "")).strip(),
                    )
                )
        return [segment for segment in transcript if segment.text and segment.end > segment.start]


class LocalWhisperTranscriptionProvider(TranscriptionProvider):
    def transcribe(self, audio_path: str) -> list[TranscriptSegment]:
        settings = get_settings()
        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:
            raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "Install faster-whisper before local transcription can run.", 503) from exc

        device = "cpu" if settings.local_whisper_device == "auto" else settings.local_whisper_device
        try:
            model = WhisperModel(settings.local_whisper_model, device=device)
            segments, _ = model.transcribe(audio_path, vad_filter=True)
            return [
                TranscriptSegment(start=float(segment.start), end=float(segment.end), text=segment.text.strip())
                for segment in segments
                if segment.text.strip() and segment.end > segment.start
            ]
        except Exception as exc:
            raise AppError(ErrorCode.TRANSCRIPTION_FAILED, "Local Whisper transcription failed.", 500) from exc


def get_transcription_provider() -> TranscriptionProvider:
    settings = get_settings()
    provider = settings.transcription_provider.lower()
    if provider in {"openai", "whisper", "openai-whisper"}:
        return OpenAITranscriptionProvider()
    if provider in {"local", "faster-whisper", "faster_whisper"}:
        return LocalWhisperTranscriptionProvider()
    if provider in {"", "disabled"}:
        return DisabledTranscriptionProvider()
    return DisabledTranscriptionProvider()
