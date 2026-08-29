import logging
from pathlib import Path

from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode
from app.models.vibe_job import JobStatus
from app.repositories.vibe_job_repository import VibeJobRepository
from app.repositories.vibe_repository import VibeRepository
from app.services.ai.analysis import SemanticAnalyzer
from app.services.ai.transcription import get_transcription_provider
from app.services.ai.vibe_detection import VibeDetector
from app.services.media.audio import AudioExtractor
from app.services.media.downloader import MediaDownloader
from app.services.media.probe import probe_video
from app.services.rendering.vibe_renderer import VibeRenderer
from app.services.source.registry import SourceRegistry
from app.utils.cleanup import cleanup_job_directory

logger = logging.getLogger(__name__)


class VibeJobProcessor:
    def __init__(self) -> None:
        self.jobs = VibeJobRepository()
        self.vibes = VibeRepository()
        self.registry = SourceRegistry()
        self.downloader = MediaDownloader()
        self.audio = AudioExtractor()
        self.transcriber = get_transcription_provider()
        self.analyzer = SemanticAnalyzer()
        self.detector = VibeDetector()
        self.renderer = VibeRenderer()

    def process(self, job_id: str) -> None:
        job_dir = Path(get_settings().media_temp_dir) / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        try:
            self._raise_if_cancelled(job_id)
            job = self.jobs.get(job_id)
            self.jobs.update_stage(job_id, JobStatus.VALIDATING, 8)
            provider = self.registry.resolve(job["source_url"])
            metadata = provider.inspect(job["source_url"])

            self._raise_if_cancelled(job_id)
            self.jobs.update_stage(job_id, JobStatus.DOWNLOADING, 18, {"source": metadata.__dict__})
            local_media = self.downloader.acquire(provider, job["source_url"], str(job_dir))
            probe = probe_video(local_media.path)
            settings = get_settings()
            if probe.duration > settings.max_video_duration_seconds:
                raise AppError(ErrorCode.VIDEO_TOO_LONG, "The video exceeds the configured duration limit.", 413)
            if probe.size_bytes and probe.size_bytes > settings.max_video_size_mb * 1024 * 1024:
                raise AppError(ErrorCode.VIDEO_TOO_LARGE, "The video exceeds the configured size limit.", 413)

            self._raise_if_cancelled(job_id)
            self.jobs.update_stage(job_id, JobStatus.EXTRACTING_AUDIO, 34)
            audio_path = self.audio.extract(local_media.path, str(job_dir))

            self._raise_if_cancelled(job_id)
            self.jobs.update_stage(job_id, JobStatus.TRANSCRIBING, 52)
            transcript = self.transcriber.transcribe(audio_path)
            if not transcript:
                raise AppError(ErrorCode.TRANSCRIPTION_FAILED, "The transcript was empty.", 422)

            self.jobs.update_stage(job_id, JobStatus.ANALYZING, 68)
            moments = self.analyzer.analyze(transcript)

            self.jobs.update_stage(job_id, JobStatus.DETECTING_VIBES, 78)
            candidates = self.detector.detect(moments, transcript)

            self.jobs.update_stage(job_id, JobStatus.GENERATING_VIBES, 90)
            inserted_vibes = self.vibes.bulk_insert([self._candidate_to_vibe(job, candidate, transcript, local_media.path) for candidate in candidates])
            if get_settings().render_vibes_during_job:
                output_dir = Path(get_settings().media_output_dir) / job_id
                for vibe in inserted_vibes:
                    self._raise_if_cancelled(job_id)
                    try:
                        self.vibes.mark_rendering(vibe["_id"])
                        render_result = self.renderer.render(
                            local_media.path,
                            float(vibe["start_time"]),
                            float(vibe["end_time"]),
                            str(output_dir),
                            str(vibe.get("caption_data", {}).get("aspect_ratio", "9:16")),
                        )
                        self.vibes.mark_ready(
                            vibe["_id"],
                            render_result["video_url"],
                            render_result.get("thumbnail_url") or None,
                            render_result,
                        )
                    except AppError as exc:
                        self.vibes.mark_failed(vibe["_id"], exc.to_dict())

            self.jobs.update_stage(job_id, JobStatus.FINALIZING, 98)
            self.jobs.complete(job_id)
        except AppError as exc:
            logger.warning("vibe_job_failed job_id=%s code=%s", job_id, exc.code)
            self.jobs.fail(job_id, exc.to_dict())
        except Exception as exc:
            logger.exception("vibe_job_failed job_id=%s", job_id)
            self.jobs.fail(
                job_id,
                {"code": ErrorCode.INTERNAL_ERROR, "message": "The Vibe job failed unexpectedly.", "details": None},
            )
        finally:
            cleanup_job_directory(job_dir)

    def _raise_if_cancelled(self, job_id: str) -> None:
        if self.jobs.is_cancelled(job_id):
            raise AppError(ErrorCode.JOB_CANCELLED, "The job was cancelled.", 409)

    def _candidate_to_vibe(self, job: dict, candidate, transcript, source_media_path: str) -> dict:
        return {
            "job_id": job["_id"],
            "user_id": job.get("user_id"),
            "account_id": job.get("account_id"),
            "profile_id": job.get("profile_id"),
            "source_video_id": job["source_identifier"],
            "source_type": job["source_type"],
            "start_time": candidate.start,
            "end_time": candidate.end,
            "duration": candidate.end - candidate.start,
            "title": candidate.title,
            "hook": candidate.hook,
            "description": candidate.description,
            "transcript": [segment.__dict__ for segment in transcript if segment.start <= candidate.end and segment.end >= candidate.start],
            "caption_data": {"template": "default", "aspect_ratio": "9:16"},
            "source_media_path": source_media_path,
            "vibe_score": candidate.vibe_score,
            "hook_score": candidate.hook_score,
            "value_score": candidate.value_score,
            "emotion_score": candidate.emotion_score,
            "completeness_score": candidate.completeness_score,
            "status": "DRAFT",
            "video_url": None,
            "thumbnail_url": None,
        }
