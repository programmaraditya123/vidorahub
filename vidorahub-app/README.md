# VidoraHub Mobile App

Production React Native CLI application for VidoraHub.

## Quick Start

```bash
cd vidorahub-app
cp .env.example .env
npm install
npm start
```

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start Metro |
| `npm run android` | Run on Android |
| `npm run android:debug` | Build Android debug APK |
| `npm run android:release` | Build Android release APK |
| `npm run android:bundle` | Build Android release AAB |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint |
| `npm test` | Jest unit tests |

## Environment

Copy `.env.example` to `.env` and set:

- `API_BASE_URL` - Primary FastAPI backend
- `API_BASE_URL_SECOND` - Reactions/follow bitmap API
- `FFMPEG_WORKER_URL` - Transcoding worker URL
- `GOOGLE_CLIENT_ID` - Google Sign-In web client ID
- `GCS_BASE_URL` - Google Cloud Storage base URL
- `SENTRY_DSN` - Sentry DSN
- `FIREBASE_*` - Firebase app metadata, if read from JS

## Native Builds

Android uses `android/app/google-services.json` for Firebase and release signing placeholders in `android/app/build.gradle`.

```bash
npm run android
npm run android:debug
npm run android:release
npm run android:bundle
```

## Deep Links

- `vidorahub://video/:slug`
- `vidorahub://channel/:id`
- `vidorahub://vibes?v=:id`
- `https://www.vidorahub.com/video/:slug`
