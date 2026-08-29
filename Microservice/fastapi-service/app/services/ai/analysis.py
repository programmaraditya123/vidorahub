from dataclasses import dataclass
import json
import re

from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode
from app.services.ai.transcription import TranscriptSegment


@dataclass(frozen=True)
class MomentCandidate:
    start: float
    end: float
    title: str
    hook: str
    description: str
    vibe_score: float
    hook_score: float
    value_score: float
    emotion_score: float
    completeness_score: float


class SemanticAnalyzer:
    def analyze(self, transcript: list[TranscriptSegment]) -> list[MomentCandidate]:
        settings = get_settings()
        if settings.ai_provider.lower() in {"openai"}:
            return self._analyze_with_openai(transcript)
        if settings.ai_provider.lower() in {"", "disabled", "local", "heuristic"}:
            return self._analyze_locally(transcript)
        raise AppError(ErrorCode.AI_ANALYSIS_FAILED, "The configured AI provider is not implemented yet.", 501)

    def _analyze_with_openai(self, transcript: list[TranscriptSegment]) -> list[MomentCandidate]:
        settings = get_settings()
        if not settings.ai_api_key:
            raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "Configure AI_API_KEY before OpenAI semantic Vibe detection can run.", 503)
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "Install the openai package before OpenAI analysis can run.", 503) from exc

        prompt = self._build_prompt(transcript)
        try:
            response = OpenAI(api_key=settings.ai_api_key).chat.completions.create(
                model=settings.ai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an elite short-form video editor. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            text = response.choices[0].message.content or ""
            data = self._parse_json(text)
            candidates = [self._candidate_from_dict(item) for item in data.get("vibes", [])]
            return [candidate for candidate in candidates if candidate.end > candidate.start]
        except AppError:
            raise
        except Exception as exc:
            raise AppError(ErrorCode.AI_ANALYSIS_FAILED, "OpenAI semantic analysis failed.", 502) from exc

    def _analyze_locally(self, transcript: list[TranscriptSegment]) -> list[MomentCandidate]:
        if not transcript:
            return []
        windows: list[list[TranscriptSegment]] = []
        current: list[TranscriptSegment] = []
        for segment in transcript:
            if not current:
                current = [segment]
                continue
            duration = segment.end - current[0].start
            if duration <= 75:
                current.append(segment)
            else:
                windows.append(current)
                current = [segment]
        if current:
            windows.append(current)

        scored = [self._score_window(window) for window in windows if window[-1].end - window[0].start >= 15]
        return sorted(scored, key=lambda candidate: candidate.vibe_score, reverse=True)[: get_settings().max_vibes_per_job]

    def _score_window(self, window: list[TranscriptSegment]) -> MomentCandidate:
        text = " ".join(segment.text for segment in window).strip()
        lower = text.lower()
        hook_words = ["secret", "mistake", "nobody", "why", "how", "never", "always", "truth", "problem"]
        value_words = ["learn", "lesson", "because", "strategy", "tip", "example", "important", "works"]
        emotion_words = ["love", "hate", "funny", "amazing", "surprised", "angry", "excited", "scared"]
        hook_score = min(100, 42 + sum(8 for word in hook_words if word in lower))
        value_score = min(100, 38 + sum(7 for word in value_words if word in lower))
        emotion_score = min(100, 30 + sum(8 for word in emotion_words if word in lower))
        duration = window[-1].end - window[0].start
        completeness_score = 88 if 30 <= duration <= 90 else 68
        vibe_score = round((hook_score * 0.3) + (value_score * 0.3) + (emotion_score * 0.2) + (completeness_score * 0.2), 2)
        title = self._title_from_text(text)
        return MomentCandidate(
            start=window[0].start,
            end=window[-1].end,
            title=title,
            hook=window[0].text.strip(),
            description=text[:280],
            vibe_score=vibe_score,
            hook_score=hook_score,
            value_score=value_score,
            emotion_score=emotion_score,
            completeness_score=completeness_score,
        )

    def _build_prompt(self, transcript: list[TranscriptSegment]) -> str:
        settings = get_settings()
        transcript_text = "\n".join(f"[{segment.start:.1f}s - {segment.end:.1f}s] {segment.text}" for segment in transcript)
        return f"""Analyze this transcript and identify up to {settings.max_vibes_per_job} meaningful short-form Vibes.

Prioritize strong hooks, valuable insights, key lessons, emotional moments, funny moments, smart discussions, complete stories, surprising moments, and quotable lines.

Rules:
- Each Vibe must be complete and self-contained.
- Prefer 30 to 90 seconds.
- Do not cut mid-thought.
- Avoid heavy overlap.
- Return JSON only with this shape:
{{"vibes":[{{"title":"string","start":0.0,"end":60.0,"hook":"string","description":"string","vibe_score":90,"hook_score":90,"value_score":90,"emotion_score":70,"completeness_score":90}}]}}

Transcript:
{transcript_text[:24000]}
"""

    def _parse_json(self, text: str) -> dict:
        cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
        cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start == -1 or end == -1:
                raise
            return json.loads(cleaned[start : end + 1])

    def _candidate_from_dict(self, item: dict) -> MomentCandidate:
        return MomentCandidate(
            start=float(item.get("start", item.get("start_time", 0))),
            end=float(item.get("end", item.get("end_time", 0))),
            title=str(item.get("title") or "Meaningful Vibe").strip(),
            hook=str(item.get("hook") or item.get("hook_sentence") or "").strip(),
            description=str(item.get("description") or item.get("virality_reason") or "").strip(),
            vibe_score=float(item.get("vibe_score", item.get("score", 0))),
            hook_score=float(item.get("hook_score", item.get("score", 0))),
            value_score=float(item.get("value_score", item.get("score", 0))),
            emotion_score=float(item.get("emotion_score", 50)),
            completeness_score=float(item.get("completeness_score", 70)),
        )

    def _title_from_text(self, text: str) -> str:
        words = re.sub(r"\s+", " ", text).strip().split(" ")
        return " ".join(words[:9]).rstrip(".,!?") or "Meaningful Vibe"
