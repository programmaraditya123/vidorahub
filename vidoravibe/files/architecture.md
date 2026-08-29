# VidoraVibe Frontend Architecture

The Next.js app lives in `vidoravibe` and routes users to `/vibes/create` by default.

Key pieces:

- `app/vibes/create`: source entry and job creation.
- `app/vibes/jobs/[jobId]`: refresh-safe job polling and results display.
- `app/vibes/[vibeId]`: preview, lightweight editing, and export actions.
- `lib/api`: typed VidoraVibe API client with timeouts and structured error parsing.
- `lib/vibes/source.ts`: client-side source detection for immediate input feedback.
- `components/vibes`: reusable workflow components.

The frontend keeps business logic on the backend. It collects input, displays source detection, creates jobs, polls persisted state, and renders job/vibe results.
