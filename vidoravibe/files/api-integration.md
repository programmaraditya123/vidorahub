# API Integration

Set `NEXT_PUBLIC_VIDORAVIBE_API_URL=http://localhost:8001`. Configure the FastAPI origin in production before building the UI.

The typed API client adds the existing `localStorage.token` as a Bearer token. The `/vibes` layout checks the current session and offers login through the same VidoraHub identity backend if needed. Storage is origin-scoped, so separate domains require sign-in with the same account.

Job creation requires an `Idempotency-Key` and exactly one `source_url` (GCS HTTPS) or completed `upload_id`. Retries of an unchanged request reuse the key; changed requests get a new key. Uploads request a resumable GCS session, PUT 8 MiB chunks directly to storage, and submit the owner-bound upload ID after completion.

The UI uses authenticated session, login, upload, job listing/creation/status/cancellation, clip listing/detail/edit, and download endpoints. API failures become readable `VidoraVibeApiError` messages. `PATCH /api/v1/vibes/{id}` returns `{ job_id, vibe }`; editing creates a new durable render and preserves the original clip. Downloads return short-lived signed URLs.

See [the service README](../../Microservice/vidoravibe-fastapi/README.md) and its `/docs` endpoint for the complete contract, CORS configuration, limits and setup.
