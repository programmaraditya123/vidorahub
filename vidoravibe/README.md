# VidoraVibe UI

Next.js 16 / React 19 creator workspace for `../Microservice/vidoravibe-fastapi`.

```sh
npm install
npm run dev
```

Set `NEXT_PUBLIC_VIDORAVIBE_API_URL=http://localhost:8001` in `.env.local` (see `.env.example`). The API must allow the exact UI origin in `CORS_ORIGINS`; the storage bucket also needs the CORS configuration in the service README. Open `/vibes/create`.

Features: existing VidoraHub sign-in, signed/public GCS links, chunked direct GCS uploads with progress/cancel/recovery, clip duration/count/preferences, job history, resilient progress polling, cancellation, captioned vertical clip previews, new renders for timing edits, and private downloads.

Identity is shared through the existing Node backend. The UI reuses `localStorage.token` on the same origin. Across origins, sign in again with the same account. There is no new account database and no password persistence. API keys and Google service credentials belong only in the Python service `.env`, never in `NEXT_PUBLIC_*` variables.

Run `npm run lint`, `npm run build`, and `npm run test:e2e` to verify. Browser tests use the installed Chrome channel and mock API/storage responses; they do not submit real videos to production services. See the backend README for deployment, API contracts, provider requirements, privacy/retention, research links, and capacity limits. Private preview links expire after 15 minutes; reopen a clip to refresh its URL. Edits create new clips and leave originals intact.

The current local `.env.local` targets the running API on port 8000; the example and `python -m app` entry point use 8001. Keep the UI origin setting aligned with the port you actually start. The configured identity service is a separate deployed Node backend.
