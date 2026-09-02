# services/ai

This folder contains transcription and AI-assisted moment detection.

## Files

- `transcription.py`: Defines transcript segment data and transcription providers.
  - `DisabledTranscriptionProvider`: raises a configuration error when transcription is disabled.
  - `OpenAITranscriptionProvider`: sends audio to the configured OpenAI transcription model.
  - `LocalWhisperTranscriptionProvider`: uses `faster-whisper` locally.
  - `get_transcription_provider()`: selects the provider from settings.
- `analysis.py`: Converts transcript segments into scored `MomentCandidate` objects.
  - Uses OpenAI when `AI_PROVIDER=openai`.
  - Uses a local heuristic analyzer when AI is disabled, local, or heuristic.
  - Scores hooks, value, emotion, completeness, and total Vibe score.
- `vibe_detection.py`: Sorts candidate moments by Vibe score. This is the place to expand filtering, overlap removal, or ranking rules.

## Usage

The job processor calls transcription first, then semantic analysis, then final detection. Provider configuration is controlled by `TRANSCRIPTION_PROVIDER`, `TRANSCRIPTION_API_KEY`, `AI_PROVIDER`, `AI_API_KEY`, and related model settings.

## Editing guidance

Add provider-specific code behind provider classes. Keep returned data normalized as `TranscriptSegment` or `MomentCandidate` so the rest of the pipeline does not need to know which AI provider was used.
