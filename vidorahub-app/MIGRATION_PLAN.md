# VidoraHub React Native Migration Plan

## Executive Summary

This document maps the Next.js frontend (`frontend/`) to the production React Native app (`vidorahub-app/`). The web app uses Next.js 16 App Router, axios dual-backend APIs, client-side JWT auth, and SCSS-module design tokens. The mobile app preserves all **implemented** web features using Expo SDK 56, React Navigation, TanStack Query, Zustand, and the required tech stack.

---

## Feature Reality Check (Web vs Master Prompt)

| Feature | Web Status | RN Implementation |
|---------|-----------|-------------------|
| Long-form videos | ✅ Home, search, player | Full |
| Short videos (Vibes) | ✅ ThreeVibesFeed | Full (FlashList + expo-av) |
| Creator profiles | ✅ `/profile` | Full |
| Brand profiles | ❌ Not in web | Scaffold only |
| Creator store | ✅ Product cards on profile/channel | Full |
| Marketplace / campaigns | ❌ Not in web | Scaffold only |
| Messaging / chat | ❌ Comments only | Comments + chat scaffold |
| Authentication | ✅ Login, signup, Google | Full |
| OTP / Forgot password | ❌ Not in web | Scaffold only |
| Notifications | ❌ Not in web | Expo Notifications + FCM scaffold |
| User dashboard | ❌ Studio external link | Deep link to studio |
| Search & discovery | ✅ `/search` | Full |
| Video upload | ✅ `/uploadvideo` | Full (expo-image-picker) |
| Vibe upload | ✅ `/uploadvibe` | Full |
| Creator portfolio | ✅ Profile masonry | Full |
| Revenue / earn | ✅ `/earn` | Full |
| Watch history | ⚠️ Under development | Screen with parity |
| Likes/dislikes/follow | ✅ bitmap API | Full |
| Comments | ✅ CommentSection | Full |

---

## Route → Screen Mapping

| Next.js Route | React Navigation Screen | Navigator |
|---------------|------------------------|-----------|
| `/` | `Home` | Tab |
| `/search` | `Search` | Tab |
| `/vibes` | `Vibes` | Tab |
| `/vibes?v=:id` | `Vibes` (initialVibeId param) | Tab |
| `/vibes/[slug]` | `Vibes` (legacy, same as above) | Tab |
| `/video/[slug]` | `VideoPlayer` | Stack |
| `/channel/[id]` | `Channel` | Stack |
| `/profile` | `Profile` | Tab |
| `/profile?tab=store` | `Profile` (tab=store) | Tab |
| `/earn` | `Earn` | Stack |
| `/history` | `History` | Stack |
| `/upload` | `UploadChooser` | Stack |
| `/uploadvideo` | `UploadVideo` | Stack |
| `/uploadvibe` | `UploadVibe` | Stack |
| `/login` | `Login` | Auth Stack |
| `/signup` | `Signup` | Auth Stack |

### Navigation Architecture

```
RootNavigator
├── AuthNavigator (unauthenticated)
│   ├── Login
│   └── Signup
└── MainNavigator (authenticated or guest browsing)
    ├── TabNavigator
    │   ├── Home
    │   ├── Search
    │   ├── Vibes
    │   ├── Upload (auth-gated → Auth modal)
    │   └── Profile (auth-gated → Signup)
    └── Stack screens
        ├── VideoPlayer
        ├── Channel
        ├── Earn
        ├── History
        ├── UploadChooser
        ├── UploadVideo
        └── UploadVibe
```

---

## Dependency Map

### Web → Mobile Equivalents

| Web | Mobile |
|-----|--------|
| `localStorage` | MMKV + Expo Secure Store (tokens) |
| `sessionStorage.redirectAfterLogin` | MMKV `redirectAfterLogin` |
| `@react-oauth/google` | `@react-native-google-signin/google-signin` |
| `next/navigation` | React Navigation |
| `next/image` | `expo-image` |
| `hls.js` | `expo-av` / `react-native-video` (HLS native) |
| SCSS modules | Theme tokens + StyleSheet |
| Redux (unused) | Zustand |
| useEffect fetching | TanStack Query |
| DOM portals / modals | RN Modal + @gorhom/bottom-sheet |
| Capacitor wrapper | Native Expo app |

### API Backends (unchanged)

| Client | Base URL Env | Purpose |
|--------|-------------|---------|
| `http` | `EXPO_PUBLIC_API_BASE_URL` | Primary FastAPI |
| `http2` | `EXPO_PUBLIC_API_BASE_URL_SECOND` | Reactions/follow bitmap API |
| FFmpeg worker | Hardcoded Render URL | Transcode queue, activity |

---

## Architecture Decisions

1. **Feature-based folders** under `src/features/` with co-located components, hooks, and types.
2. **TanStack Query** for all server state; Zustand for auth, UI, and session-only state.
3. **Secure token storage** via Expo Secure Store; non-sensitive prefs via MMKV.
4. **Deep linking** scheme `vidorahub://` + universal links for `vidorahub.com` paths.
5. **Video playback**: `react-native-video` for HLS long-form; `expo-av` for vibes feed slides.
6. **Offline**: NetInfo detection + query cache persistence via MMKV for read-heavy feeds.
7. **Firebase/Sentry**: Configured via env; graceful no-op when keys absent (dev mode).
8. **Scaffold features** (chat, marketplace, brand): typed stores + placeholder screens for future backend parity.

---

## API Endpoint Inventory

### Primary (`http`)

- `POST api/v1/register`
- `POST /api/v1/userlogin`
- `POST api/v1/google-login`
- `GET api/v1/getVedioDataExceptCommentsDocs/:id`
- `GET /api/v1/getNextVideos`
- `GET /api/v1/creatorProfile`
- `GET /api/v1/creatorchannel/:id`
- `PUT /api/v1/deletevideo`
- `POST /api/v1/views`
- `GET /api/v1/allvideos`
- `POST /api/v1/get-upload-url`
- `POST /api/v1/uploadvideo`
- `GET /api/v1/getEarnings`
- `GET /api/v1/allProducts/:creatorId`
- `GET /api/v1/getVedioComments/:id`
- `POST /api/v1/postVedioComments/:id`
- `GET /api/v1/allvibes`

### Secondary (`http2`)

- `bitmap/v1/addLike`, `removeLike`, `addDislike`, `removeDislike`
- `bitmap/v1/reactions`
- `bitmap/v1/followReaction/:id`, `follow/:id`, `unfollow/:id`

---

## Design System Tokens (from `globals.css`)

| Token | Value |
|-------|-------|
| primary | `#7c3aed` |
| primaryEnd | `#a855f7` |
| royalPurple | `#6d28d9` |
| bg | `#ffffff` |
| bgSubtle | `#f6f4fb` |
| bgMuted | `#f9f7ff` |
| border | `rgba(124, 58, 237, 0.12)` |
| textPrimary | `#1a1a2e` |
| textMuted | `#6b7280` |
| textFaint | `#9ca3af` |
| Font | Be Vietnam Pro |

Breakpoints: mobile `<768`, tablet `768–1024`, desktop `>1024` (tablet layouts use 2-column grids).

---

## Implementation Phases

### Phase 1 — Core (Complete)
- Expo project, dependencies, ESLint/Prettier/Husky
- Theme, config, storage, API clients
- Auth store, providers, navigation shell
- Deep linking config

### Phase 2 — Auth & Shared UI
- Login, Signup, Google Sign-In
- Button, Input, Card, Avatar, Loader, Toast, AuthModal
- Error boundary, Sentry wrapper

### Phase 3 — Content Feeds
- Home infinite video grid (FlashList)
- Search with debounced query
- Vibes vertical feed (FlashList + snap)

### Phase 4 — Video & Social
- Long-form video player screen
- Comments, reactions, follow
- Up-next sidebar as bottom sheet

### Phase 5 — Profile & Store
- Profile screen with tabs (videos/store)
- Channel screen (public creator)
- Product cards + modal

### Phase 6 — Upload & Earn
- Upload chooser, video upload flow, vibe upload
- Earn dashboard

### Phase 7 — Platform Services
- Push notifications, Firebase analytics/crashlytics
- Offline detection, retry queue
- Testing structure (Jest, Detox config)

---

## Build & Run

```bash
cd vidorahub-app
cp .env.example .env
npm start
npm run android
npm run ios
npm run typecheck
npm test
```

Required env vars: see `.env.example`.

---

## Verification Checklist

- [ ] TypeScript strict mode passes
- [ ] All 14 web routes have RN screens
- [ ] Auth flow: login → token persist → auto-restore
- [ ] Google Sign-In on Android/iOS
- [ ] Video HLS playback
- [ ] Vibes feed infinite scroll
- [ ] Deep links: `vidorahub://video/:slug`, `vidorahub://channel/:id`
- [ ] Offline banner + cached home feed
