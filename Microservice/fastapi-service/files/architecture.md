# VidoraVibe FastAPI Architecture

VidoraVibe runs as a FastAPI service in `Microservice/fastapi-service`. API routes create persistent jobs, repositories store metadata in MongoDB via `pymongo.MongoClient`, and a worker boundary processes expensive video work outside request handlers.

The core layers are:

- `api/routes`: REST endpoints for jobs, vibes, exports, health, and readiness.
- `core`: settings, MongoDB client, structured errors, logging, and index initialization.
- `models` and `schemas`: status/source enums and typed request/response objects.
- `repositories`: MongoDB access for `vibe_jobs` and `vibes`.
- `services/source`: source adapter registry with YouTube, GCS, and VidoraHub providers.
- `services/jobs`: staged processing pipeline with cancellation and structured failure handling.
- `services/ai`, `services/media`, `services/rendering`: provider seams for transcription, semantic analysis, FFmpeg, and rendering.

VidoraHub integration is close but optional. External users can create jobs for supported external sources, while VidoraHub source and publishing flows require the VidoraHub API URLs and auth contract to be configured.
