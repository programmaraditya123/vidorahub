# AdSystem Frontend Design

Design doc for integrating the `ffmpegWorker/modules/AdSystem` backend into the existing Next.js frontend. No new frameworks — uses what `frontend/` already has.

**Existing stack**: Next.js 16 (App Router) · React 19 · TypeScript · Redux Toolkit + RTK Query · axios · SCSS modules · Capacitor · `@react-oauth/google`.

---

## 1. Audience & Surfaces

Three surfaces, three roles:

| Surface | Route prefix | Role | Purpose |
|---|---|---|---|
| Public feed | `/` (existing viewer) | any (incl. anon) | Show ads inline; record impressions/clicks |
| Brand dashboard | `/brand/*` | role `3` | Wallet, campaign CRUD, creative upload, analytics |
| Admin console | `/admin/ads/*` | role `2` | Moderation queue, manual topup, global analytics |

Roles come from JWT (`role: 2 | 3`). Backend `requireBrand` is a strict `=== 3` — frontend must send the role as a number, not string.

---

## 2. Folder Layout (additions only)

```
frontend/
├── app/
│   ├── (viewer)/                    # existing feed; inject <AdCard/>
│   ├── brand/
│   │   ├── layout.tsx               # role-guard: requireRole(3)
│   │   ├── wallet/page.tsx
│   │   ├── campaigns/page.tsx
│   │   ├── campaigns/new/page.tsx
│   │   ├── campaigns/[id]/page.tsx  # detail + creatives + analytics
│   │   └── analytics/page.tsx
│   └── admin/
│       └── ads/
│           ├── layout.tsx           # role-guard: requireRole(2)
│           ├── moderation/page.tsx
│           ├── topup/page.tsx
│           └── analytics/page.tsx
└── src/
    ├── lib/
    │   ├── ads/
    │   │   ├── impressionTracker.ts # IntersectionObserver singleton
    │   │   ├── clickBeacon.ts       # navigator.sendBeacon wrapper
    │   │   ├── adBlockerProbe.ts    # detect & rewrite path
    │   │   └── types.ts             # Campaign, Creative, AdFeedItem, etc.
    │   └── auth/
    │       └── roleGuard.tsx        # client component for role gating
    ├── redux/
    │   └── services/
    │       └── adsApi.ts            # RTK Query slice (single file)
    ├── components/
    │   ├── ads/
    │   │   ├── AdCard.tsx           # rendered inside viewer feed
    │   │   ├── AdBadge.tsx          # "Sponsored" label
    │   │   └── AdCard.module.scss
    │   ├── brand/
    │   │   ├── WalletCard.tsx
    │   │   ├── TopupHistory.tsx
    │   │   ├── CampaignWizard/
    │   │   │   ├── Step1Targeting.tsx
    │   │   │   ├── Step2Budget.tsx
    │   │   │   ├── Step3Schedule.tsx
    │   │   │   └── Step4Review.tsx
    │   │   ├── CreativeUploader.tsx # 2-stage: presign → PUT → confirm
    │   │   ├── CampaignList.tsx
    │   │   └── AnalyticsChart.tsx
    │   └── admin/
    │       ├── ModerationQueue.tsx
    │       ├── ModerationCard.tsx
    │       └── TopupForm.tsx        # surfaces revivedCampaigns toast
    └── hooks/
        ├── useImpressionTracking.ts
        └── useRoleGuard.ts
```

---

## 3. Two-Layer API Strategy

**Why two layers**: RTK Query handles cached JSON resources cleanly; axios is needed for streaming, multipart uploads, and beacons where RTK Query is awkward.

### 3a. RTK Query (`src/redux/services/adsApi.ts`)

Single slice. Tag types: `Campaign | Creative | Balance | Transactions | Pending | AnalyticsDaily`.

Endpoints:

| Endpoint | Method | Path | Provides / Invalidates |
|---|---|---|---|
| `getBalance` | GET | `/api/v1/ads/billing/balance` | provides `Balance` |
| `getTransactions` | GET | `/api/v1/ads/billing/transactions` | provides `Transactions` |
| `topup` (admin) | POST | `/api/v1/ads/billing/topup` | invalidates `Balance, Transactions, Campaign` |
| `listCampaigns` | GET | `/api/v1/ads/campaigns` | provides `Campaign` |
| `getCampaign` | GET | `/api/v1/ads/campaigns/:id` | provides `Campaign` (id) |
| `createCampaign` | POST | `/api/v1/ads/campaigns` | invalidates `Campaign` |
| `updateCampaign` | PATCH | `/api/v1/ads/campaigns/:id` | invalidates `Campaign` (id) |
| `presignCreative` | POST | `/api/v1/ads/creatives/presign` | — |
| `confirmCreative` | POST | `/api/v1/ads/creatives/confirm` | invalidates `Creative, Pending` |
| `listCreatives` | GET | `/api/v1/ads/creatives?campaignId=` | provides `Creative` |
| `getPendingModeration` | GET | `/api/v1/ads/moderation/pending` | provides `Pending` |
| `approveCreative` | POST | `/api/v1/ads/moderation/:id/approve` | invalidates `Pending, Creative` |
| `rejectCreative` | POST | `/api/v1/ads/moderation/:id/reject` | invalidates `Pending, Creative` |
| `getAnalyticsDaily` | GET | `/api/v1/ads/analytics/daily?campaignId=&from=&to=` | provides `AnalyticsDaily` |

`baseQuery` reads JWT from auth slice and sets `Authorization: Bearer …`.

### 3b. axios (raw)

Used for:

- **Creative upload PUT** to presigned URL (binary, progress events).
- **Impression POST** `/api/v1/feed/impression` (fire-and-forget; tolerate failure).
- **Click beacon** `/api/v1/feed/click` via `navigator.sendBeacon` — falls back to axios POST with `keepalive: true` if beacon blocked.

axios instance lives at `src/lib/api.ts` (likely already exists — reuse).

---

## 4. Public Feed Integration

### 4a. Ad fetch
Existing feed loader appends `?withAds=1` (or whatever the public endpoint already is — `/api/v1/feed`). Backend interleaves ad items: `{ type: 'ad', campaignId, creativeId, mediaUrl, ctaUrl, headline, ... }`.

### 4b. Render
`<AdCard/>` rendered in feed list when `item.type === 'ad'`. Always shows `<AdBadge/>` ("Sponsored").

### 4c. Impression tracking (`src/lib/ads/impressionTracker.ts`)
Singleton `IntersectionObserver` (threshold `0.5`, root = viewport):

1. `<AdCard/>` mounts → `observer.observe(el)` with `data-campaign-id`, `data-creative-id`.
2. When `intersectionRatio >= 0.5` for **>= 1000ms** continuously → fire impression POST once per (campaignId, sessionId).
3. Dedupe via in-memory `Set<campaignId>` per page session.
4. On unmount → `observer.unobserve`.

**Backend contract**: POST body must use field name `adId` set to the **campaignId** (the controller does `Campaign.findById(adId)`).

### 4d. Click tracking (`src/lib/ads/clickBeacon.ts`)
On `<AdCard/>` CTA click:
```ts
const ok = navigator.sendBeacon('/api/v1/feed/click', JSON.stringify({ adId, creativeId }));
if (!ok) axios.post('/api/v1/feed/click', { adId, creativeId }, { keepalive: true });
window.location.href = ctaUrl; // navigate after queueing beacon
```

### 4e. Ad-blocker resilience (`src/lib/ads/adBlockerProbe.ts`)
On app boot, fetch `/__probe/ads.gif`. If blocked, rewrite ad endpoints from `/api/v1/feed/...` to `/api/v1/f/...` via a runtime base-path swap. Backend already aliases (deferred — currently a queued gap, see §10).

### 4f. SSR skip
`<AdCard/>` is a `'use client'` component and **only fetches/renders on client mount**. No ads in SSR HTML — prevents fake impressions from bots & prefetch.

---

## 5. Brand Dashboard (`/brand/*`)

### 5a. Wallet (`/brand/wallet`)
- `<WalletCard/>`: live balance via `useGetBalanceQuery()` polling every 30s.
- `<TopupHistory/>`: paginated `useGetTransactionsQuery({page})`.
- No self-service topup yet (queued backend gap).

### 5b. Campaign Wizard (`/brand/campaigns/new`)
4 steps, local React state, single POST on Step 4:

1. **Targeting** — geo, demo, interests.
2. **Budget** — daily cap, lifetime cap (validated client-side ≤ wallet balance × safety factor).
3. **Schedule** — start/end dates, frequency cap (per-user impressions/day).
4. **Review** — summary, submit → `createCampaign` mutation.

After submit → redirect to `/brand/campaigns/[id]` to upload creative.

### 5c. Creative Upload (`<CreativeUploader/>`) — two-stage
1. Client → `presignCreative({ filename, contentType, size })` → returns `{ uploadUrl, creativeId, fields }`.
2. Client `axios.put(uploadUrl, file, { onUploadProgress })`.
3. Client → `confirmCreative({ creativeId })` → enters moderation queue (status `pending`).
4. UI shows status badge: `pending | approved | rejected` (rejected shows reason from backend).

### 5d. Campaign List (`/brand/campaigns`)
Table: name, status (`active | paused | exhausted | ended`), spent today / daily cap, lifetime spent / lifetime cap, CTR. Row actions: pause/resume (PATCH), view detail.

`exhausted` = backend flag set when daily or lifetime cap hit. Visually distinct (amber); will auto-revive on daily reset (cron) or topup.

### 5e. Campaign Detail (`/brand/campaigns/[id]`)
Tabs:
- **Overview** — same metrics as list row, big.
- **Creatives** — grid of creatives with status, preview, replace.
- **Analytics** — `<AnalyticsChart/>` time-series for this campaign.

### 5f. Analytics (`/brand/analytics`)
Cross-campaign rollup. ⚠️ Backend currently has no brand-scoped analytics GET — queued (§10). Until then, this page aggregates client-side from `getAnalyticsDaily` calls per campaign.

---

## 6. Admin Console (`/admin/ads/*`)

### 6a. Moderation (`/admin/ads/moderation`)
- `<ModerationQueue/>` — `useGetPendingModerationQuery({ pollingInterval: 15000 })`.
- `<ModerationCard/>` — preview media, brand info, approve/reject buttons. Reject opens modal for reason.
- No SSE/webhook yet → polling (queued gap §10).

### 6b. Manual Topup (`/admin/ads/topup`)
Form: brand selector, amount, note. On submit → `topup` mutation. Response includes `revivedCampaigns: string[]` — surface as toast: *"Topped up. Revived 3 paused campaigns: Foo, Bar, Baz."*

### 6c. Global Analytics (`/admin/ads/analytics`)
Aggregate impressions/clicks/spend across all brands. Reuses `<AnalyticsChart/>` without `campaignId` filter.

---

## 7. Auth & Role Guards

### 7a. JWT
Already in Redux `auth` slice. `baseQuery` of `adsApi` reads it. axios instance has interceptor.

### 7b. Role guard (`src/lib/auth/roleGuard.tsx`)
```tsx
'use client';
export function RoleGuard({ role, children }: { role: 2 | 3; children: ReactNode }) {
  const user = useAppSelector(s => s.auth.user);
  const router = useRouter();
  useEffect(() => {
    if (!user) router.replace('/login');
    else if (Number(user.role) !== role) router.replace('/403');
  }, [user, role, router]);
  if (!user || Number(user.role) !== role) return null;
  return <>{children}</>;
}
```
Used in `app/brand/layout.tsx` (`role={3}`) and `app/admin/ads/layout.tsx` (`role={2}`).

`Number(user.role)` is critical because backend uses strict `=== 3`.

### 7c. /auth/me
No `/auth/me` endpoint exists yet (queued gap §10). Until then, role is read from decoded JWT on login.

---

## 8. Edge Cases

| Case | Handling |
|---|---|
| Wallet hits 0 mid-session | Backend returns 402 on `deduct`; UI shows "Insufficient funds" toast on next mutation; campaigns auto-paused server-side. |
| Campaign exhausted | List badge "Exhausted (daily)" or "Exhausted (lifetime)". Daily auto-revives at cron; lifetime needs topup. |
| Creative rejected | Card shows reason; "Replace" button opens uploader pre-scoped to same campaign. |
| Ad-blocker active | Path rewrite (§4e); if still blocked, feed silently omits ads. |
| Tab hidden during impression timer | `IntersectionObserver` callbacks pause; restart timer on `visibilitychange` → `visible`. |
| Double-mount in StrictMode | Impression Set dedup prevents double-fire. |
| Slow network on creative upload | Progress bar; `confirmCreative` only fires after PUT 200. |
| Idempotency on topup | Mutation accepts client-generated `idempotencyKey` (uuid v4) so retries are safe. |
| Anon viewer | Impressions/clicks still POST (backend allows anon); no JWT header sent. |

---

## 9. Build Order (5 Milestones)

1. **M1 — Plumbing**: `adsApi.ts` slice + `roleGuard.tsx` + types + axios instance reuse. No UI.
2. **M2 — Brand wallet + campaign list**: read-only screens. Validates auth + RTK wiring.
3. **M3 — Campaign wizard + creative uploader**: full create flow incl. presigned upload.
4. **M4 — Public feed integration**: `<AdCard/>`, impression tracker, click beacon, SSR skip.
5. **M5 — Admin moderation + topup + analytics**: completes the loop; surfaces `revivedCampaigns`.

Each milestone is independently shippable.

---

## 10. Backend Gaps Surfaced (Queued, Not Fixed)

Discovered during this design pass. None block M1–M5 minimally, but should be filed:

1. No brand-scoped analytics rollup endpoint (only per-campaign daily). M5 workaround: client-side aggregation.
2. No `DELETE /campaigns/:id` (only pause). Brand deletion requires admin.
3. No `/auth/me` — role read from JWT decode only.
4. No self-service brand topup (Stripe/Razorpay) — admin-only manual topup for now.
5. No moderation webhook/SSE — admin queue uses 15s polling.
6. No per-creative time-series (only per-campaign).
7. `requireBrand` uses strict `=== 3` — frontend must coerce role to Number before send/compare.

---

## 11. Out of Scope

- Native (Capacitor) ad rendering differences — assumed identical to web for v1.
- A/B testing of creatives — backend has no split flag.
- Real-time bidding / auction — not in backend.
- GDPR consent banner integration with impression gating — handled by existing consent layer if any.
