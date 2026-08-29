# VidoraVibe API

All API responses use:

```json
{ "success": true, "data": {}, "error": null }
```

Failures use:

```json
{ "success": false, "data": null, "error": { "code": "INVALID_URL", "message": "...", "details": null } }
```

Endpoints:

- `GET /health`: service health.
- `GET /ready`: readiness and MongoDB ping when configured.
- `POST /api/v1/vibe-jobs`: create or return an active idempotent job. Body: `{ "source_url": "https://..." }`.
- `GET /api/v1/vibe-jobs/{job_id}`: retrieve persisted job state.
- `POST /api/v1/vibe-jobs/{job_id}/cancel`: request cancellation.
- `GET /api/v1/vibe-jobs/{job_id}/vibes`: list Vibes produced by a job.
- `GET /api/v1/vibes/{vibe_id}`: retrieve a Vibe.
- `PATCH /api/v1/vibes/{vibe_id}`: update lightweight editor fields.
- `POST /api/v1/vibes/{vibe_id}/render`: queue rendering when rendering is configured.
- `GET /api/v1/vibes/{vibe_id}/download`: return a secure media URL when available.
- `POST /api/v1/vibes/{vibe_id}/publish`: publish through VidoraHub when configured.

Authentication currently accepts VidoraHub context headers as a bridge: `X-User-Id`, `X-Account-Id`, `X-Profile-Id`, `X-Session-Id`, and `X-Device-Id`. JWT verification should be wired into `api/dependencies.py` when the signing contract is available.
