# VidoraHub Mobile App

Production-ready React Native application for VidoraHub, built with Expo SDK 56.

## Quick Start

```bash
cd vidorahub-app
cp .env.example .env
npm start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint |
| `npm test` | Jest unit tests |

## Architecture

See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for the full route map, API inventory, and migration decisions.

```
src/
├── navigation/     # Root, Auth, Main, Tab navigators + deep linking
├── screens/        # Screen components mapped from Next.js routes
├── features/       # Feature modules (video, vibes, auth, store, chat, etc.)
├── components/     # Shared UI primitives
├── services/api/   # Axios clients + API functions
├── queries/        # TanStack Query hooks
├── mutations/      # TanStack mutations
├── store/          # Zustand stores
├── theme/          # Design tokens
└── providers/      # App-wide providers
```

## Environment

Copy `.env.example` to `.env` and set:

- `EXPO_PUBLIC_API_BASE_URL` — Primary FastAPI backend
- `EXPO_PUBLIC_API_BASE_URL_SECOND` — Reactions/follow bitmap API
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` — Google Sign-In (required for OAuth)

## Native Builds

Firebase and Google Sign-In require a development build (not Expo Go):

```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) for Firebase.

## Deep Links

- `vidorahub://video/:slug`
- `vidorahub://channel/:id`
- `vidorahub://vibes?v=:id`
- `https://www.vidorahub.com/video/:slug`
