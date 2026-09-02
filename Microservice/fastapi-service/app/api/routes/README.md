# api/routes

This folder contains FastAPI routers. Each file groups related endpoints and is mounted in `app/main.py`.

## Files

- `health.py`: Root, health, and readiness checks.
  - `GET /`: basic service-running message.
  - `GET /health`: returns service status.
  - `GET /ready`: checks whether MongoDB is configured and reachable.
- `vibe_jobs.py`: Job lifecycle endpoints.
  - `POST /api/v1/vibe-jobs`: create or reuse an active job for a source URL.
  - `GET /api/v1/vibe-jobs/{job_id}`: fetch job status and progress.
  - `POST /api/v1/vibe-jobs/{job_id}/cancel`: request cancellation.
  - `GET /api/v1/vibe-jobs/{job_id}/vibes`: list Vibes produced by a job.
- `vibes.py`: Individual Vibe endpoints.
  - `GET /api/v1/vibes/{vibe_id}`: fetch one Vibe.
  - `PATCH /api/v1/vibes/{vibe_id}`: update editable Vibe fields.
  - `POST /api/v1/vibes/{vibe_id}/render`: render or rerender a clip.
  - `GET /api/v1/vibes/{vibe_id}/download`: return the rendered video URL.
  - `POST /api/v1/vibes/{vibe_id}/publish`: placeholder for publishing integration.
- `exports.py`: Reserved router for future export endpoints.
- `__init__.py`: Makes this folder importable as a route package.

## Usage

Route modules should translate HTTP requests into calls to repositories and services. Avoid putting media processing, AI logic, or database query details directly in route handlers.

## Adding routes

1. Create or update a route module in this folder.
2. Add request or response models in `schemas/` when data needs validation.
3. Raise `AppError` for expected failures.
4. Include the router in `app/main.py` if it is a new module.
