# API Integration

Set `NEXT_PUBLIC_VIDORAVIBE_API_URL` to the FastAPI origin, for example `http://localhost:8000`.

The frontend calls:

- `POST /api/v1/vibe-jobs`
- `GET /api/v1/vibe-jobs/{jobId}`
- `GET /api/v1/vibe-jobs/{jobId}/vibes`
- `POST /api/v1/vibe-jobs/{jobId}/cancel`
- `GET /api/v1/vibes/{vibeId}`
- `PATCH /api/v1/vibes/{vibeId}`
- `GET /api/v1/vibes/{vibeId}/download`

API failures are converted into human-readable messages through `VidoraVibeApiError`.
