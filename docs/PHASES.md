# BOILERPLATE PHASES — Status Document

> **Last updated:** 23 April 2026
> **Current state:** Phase 0 + 1 + 2 code complete. Runtime verification pending.
> **Next:** Manual E2E verification dengan LS test account. No Phase 3 planned.

---

## Filosofi & Frame

Boilerplate ini adalah **thin wrapper around Lemon Squeezy**, bukan commerce engine.

Prinsip operasi:
- **LS is source of truth** untuk semua data commerce (orders, customers, subscriptions, analytics, receipts).
- **Database lokal** cuma snapshot buat display + sync state via webhook. Gak ada business logic di DB.
- **UI lokal** cuma CRUD basic — list, filter, action (pause/resume/cancel). Detail lengkap, analytics, customer portal delegasi ke LS.
- **Zero business logic** di atas LS. Kalau user butuh lebih, arahin ke LS dashboard/customer portal.

Konsekuensi desain:
- ❌ Tidak ada analytics/reports page — LS punya
- ❌ Tidak ada order/subscription/customer detail page yang elaborate — LS receipt + customer portal
- ❌ Tidak ada dashboard dengan revenue metrics — LS dashboard
- ❌ Tidak ada multi-provider abstraction — LS only
- ❌ Tidak ada custom checkout — LS hosted checkout via `buy_now_url` atau generated checkout link
- ✅ Kalau butuh sesuatu yang lebih jauh → fork boilerplate, bikin sendiri. Boilerplate ini selesai di sini.

---

## Phase 0 — Foundation ✅ COMPLETE

Infrastructure layer yang semua module bangun di atasnya.

**Delivered:**
- Config system (`app.config`, `branding.config`, `permissions.config`) — env-overridable, module toggle
- i18n lightweight (id + en) — type-safe keys, zero runtime deps
- Supabase clients — browser, server (RSC/RouteHandler), proxy (middleware), service-role (webhook ingestion)
- RBAC dengan wildcard permissions (`can`, `canAll`, `canAny`, `canAccessAdmin`)
- AES-256-GCM encryption helper untuk credentials
- Activity logging service dengan `ActivityAction` enum
- Request utilities (getClientIP, getUserAgent)
- Route constants
- Shared UI primitives (FullPageLoader, ConfirmDialog, OfflineDetector)

**File tree highlights:**
```
src/
├── config/           — app, branding, permissions (3 files)
├── core/
│   ├── auth/         — services, lib, store, hooks, components, provider
│   ├── i18n/         — t() + locales (id.json, en.json)
│   ├── layout/       — AppSidebar, MobileBottomNav, UserMenu, nav-config
│   ├── components/   — loading-spinner, confirm-dialog, offline-detector
│   ├── constants/    — routes
│   ├── lib/          — supabase/*, encryption, request, utils, validators
│   └── types/        — database.ts (Supabase-generated)
```

---

## Phase 1 — Auth + Commerce Backend ✅ COMPLETE

Auth foundation penuh plus commerce connect flow.

### Auth Module

**Providers (3):**
- Email + password (login, register)
- Magic link (mode: login-or-signup / login-only configurable)
- OAuth Google (extensible via `oauth-config.tsx`)

**Flows:**
- Login dengan tab switcher (password ↔ magic link) kalau dua-duanya enabled
- Register dengan tab yang sama + `allowPublicSignup` gate
- Forgot password → magic link reset via PKCE (lewat `/api/auth/callback?next=/reset-password`)
- Reset password → `supabase.auth.updateUser({ password })` dalam recovery session
- Logout dengan confirm dialog + activity log before sign out (session masih valid buat RLS)

**State management:**
- Zustand store (`useAuthStore`) — fetch guard, race protection, `fetchPromise` dedupe
- Facade hook (`useAuth`) — granular subscription via selector, memoized `can()`
- Session listener **tunggal** di `DashboardLayout` (satu `onAuthStateChange` untuk seluruh app)
- Middleware proxy refresh session + route guard + `returnTo` preservation

**Security:**
- RLS di `user_profiles` (self + admin), `activity_logs` (self + admin, append-only)
- `verifyProfile` bedain `exists` vs `isActive` — login page dapet pesan error yang akurat
- `fetchActiveProfile` filter `is_active=true` — deactivated user di-reject di session check
- Callback route handle recovery flow (`next === /reset-password`) vs normal login (log activity)

**Storage:**
- `avatars` bucket — public read, user-folder scoped write (`<user_id>/...`), admin override

### Commerce Module — Phase 1 Portion

- **LS API client** — thin fetch wrapper, timeout, error code mapping (`LSClientError`)
- **Credentials service** — verify (call LS `/users/me` + `/stores`), encrypt + upsert, decrypt for use, delete
- **Products service** — list via credential, transform JSON:API → flat shape, variants attached
- **UI:**
  - `IntegrationPanel` — auto-switch antara `ConnectLSForm` dan `LSStatusCard`
  - `ProductsGrid` — 5 states (loading / not-connected / error / empty / loaded)
  - `ProductCard` — thumbnail, status badge, variant count, external link ke LS

---

## Phase 2 — Commerce CRUD (Thin Wrapper) ✅ COMPLETE

Full CRUD untuk 5 entitas commerce. **Semua engine di LS.**

### Delivered Entities

| Entity | List | Detail | Actions | Sync Source |
|---|---|---|---|---|
| Credentials | — | Status card | Connect, disconnect | Verify ke LS |
| Products | Grid | — (ada ProductCard view) | — | GET /products via API |
| Orders | Table + filter (status, email) | — (link ke LS receipt) | Backfill | Webhook + backfill |
| Subscriptions | Table + filter (status, email) | — (actions inline) | Pause, resume, cancel | Webhook + backfill |
| Customers | Table + filter (email) | — (link ke LS customer portal) | Backfill | Webhook-derived + backfill |

### Webhook Infrastructure

- **Per-user config** — masing-masing user generate webhook URL unik: `{APP_URL}/api/commerce/webhooks/{webhook_token}`
- **Secret** — AES-256-GCM encrypted, reveal plaintext **once** saat provision, abis itu cuma hint
- **HMAC verification** — timing-safe compare, reject kalau mismatch
- **Idempotency** — `UNIQUE(provider, event_id)` di `commerce_webhook_events`, duplicate return 200 tanpa re-process (LS stop retry)
- **Event routing** — `applyEvent` switch based on `event_name`:
  - `order_created`, `order_refunded` → upsert `commerce_orders`
  - `subscription_*` (9 events) → upsert `commerce_subscriptions`
  - Unknown event → stored tapi skip apply, gak dianggap error

### Checkout

- `CheckoutButton` component — POST ke `/api/commerce/checkout`, redirect atau open new tab
- Support pre-fill email/name, discount code, custom data, redirect URL, dark mode
- Custom data flows through ke webhook `meta.custom_data` untuk user matching

### Subscription Actions

- Pause (mode: `void` | `free`, optional `resumesAt`)
- Resume (clear pause)
- Cancel (LS DELETE /subscriptions/{id} — status jadi `cancelled`, accessible sampai `ends_at`)
- Ownership check sebelum hit LS API (cegah cross-user access)
- Immediate sync response ke DB lokal (UI gak nunggu webhook)
- Activity logged per action

### Pages & Routes

**App pages:**
```
(auth)/
  login, register, forgot-password, reset-password
(dashboard)/
  dashboard, overview, profile, settings, admin
  products, orders, subscriptions, customers
  settings/integrations, settings/webhooks
```

**API routes:**
```
/api/auth/callback
/api/commerce/credentials       (GET status, POST save, DELETE)
/api/commerce/products          (GET)
/api/commerce/orders            (GET list, POST backfill)
/api/commerce/orders/[id]       (GET detail)
/api/commerce/subscriptions     (GET list, POST backfill)
/api/commerce/subscriptions/[id](GET detail, PATCH action)
/api/commerce/customers         (GET list, POST backfill)
/api/commerce/checkout          (POST)
/api/commerce/webhooks/config   (GET, POST, DELETE)
/api/commerce/webhooks/[token]  (POST — ingestion, public)
```

### Database Schema

Consolidated di `supabase/setup.sql`:
- `user_profiles`, `activity_logs` (Phase 0+1)
- `commerce_credentials` (Phase 1)
- `commerce_webhook_configs`, `commerce_webhook_events` (Phase 2)
- `commerce_orders`, `commerce_subscriptions`, `commerce_customers` (Phase 2)
- All RLS enabled, owner-scoped select, service-role write untuk webhook tables
- Storage bucket `avatars` dengan user-folder policies

---

## Out of Scope (Explicit Decisions)

Biar gak ada ambiguity soal "kenapa gak bikin X":

| Feature | Alasan Skip | Delegate ke |
|---|---|---|
| Analytics / Reports / Revenue dashboard | Bukan commerce engine | LS Dashboard |
| Order detail page (line items, timeline) | Cukup receipt URL dari LS | LS receipt (di `raw_payload.urls.receipt`) |
| Subscription detail page (billing history) | Cukup LS customer portal | LS customer portal |
| Customer detail page (order history embed) | Cukup LS customer info | LS dashboard + customer portal |
| Multi-provider payment (Stripe/Paddle) | Complexity vs value tradeoff — LS cukup | Fork & customize |
| Custom checkout UI | LS hosted checkout udah bagus | LS checkout (hosted) |
| Subscription line items table | 95% case cukup dari `raw_payload` | `raw_payload.data.attributes.first_order_item` |
| Webhook reconciliation cron | LS retry 3x udah cukup; manual recovery via `commerce_webhook_events.error` | Manual |
| Admin activity log viewer UI | Service ready, UI di-push ke scope `admin` module — not part of commerce wrap | Future admin module |
| Shared layers (email, notifications, search, file-upload) | Placeholder README only — di-activate on demand | Future modules |
| Skeleton modules (admin, saas, landing, blog, project, forum, chat) | Future extension points, not committed | Future |
| Automated tests | Scope MVP, manual verify cukup | Future |
| Runtime locale switcher | i18n default-locked via config sudah memadai | Future (if needed) |

---

## Deployment Checklist

Sebelum go-live:

- [ ] **Generate ENCRYPTION_KEY:**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- [ ] Set di semua env (dev/staging/prod). Pastiin value sama di prod biar encrypted data bisa di-decrypt.
- [ ] **Backup ENCRYPTION_KEY ke password manager / secret vault.** Loss of key = loss of semua saved credentials.
- [ ] **Run setup.sql:**
  - Supabase Dashboard → SQL Editor → New query → paste `supabase/setup.sql` → Run
  - Check output "NUCLEAR SETUP COMPLETE"
- [ ] **Seed users:** `node scripts/seed.js` (creates 5 test users — super_admin, admin, editor, viewer, user)
- [ ] **Regenerate TS types:**
  ```bash
  npx supabase gen types typescript --project-id <PROJECT_ID> > src/core/types/database.ts
  ```
- [ ] **Supabase Dashboard config:**
  - Auth → Providers → Email → "Confirm email" match `appConfig.auth.requireEmailVerification`
  - Auth → URL Configuration → Redirect URLs whitelist:
    - `{APP_URL}/api/auth/callback`
    - `{APP_URL}/reset-password`
  - Auth → Providers → Google → enable + set client ID/secret (kalau pakai Google OAuth)
- [ ] **Branding env vars** (optional — ada defaults):
  - `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_SHORT_NAME`
  - `NEXT_PUBLIC_APP_DESCRIPTION`, `NEXT_PUBLIC_APP_PRIMARY_COLOR`
  - `NEXT_PUBLIC_APP_LANG`, dll
- [ ] **LS webhook registration** (per user):
  - User generate webhook config via UI → dapet URL + secret
  - User paste URL + secret ke LS dashboard (Settings → Webhooks)
  - Subscribe ke 12 events yang relevan (list di `WEBHOOK_EVENTS` di `types.ts`)

---

## Verification Matrix — PENDING ⚠️

**Status runtime verification:** BELUM di-test E2E dengan LS real account.

Semua implementasi udah code-complete, tapi belum ada **actual test run** untuk konfirmasi:

### Auth Flows
- [ ] Email+password login — happy path
- [ ] Email+password login — deactivated user → pesan "account deactivated"
- [ ] Email+password login — non-existent user via OAuth callback → pesan "not registered"
- [ ] Magic link login — email terkirim, klik link, sampai ke dashboard
- [ ] Google OAuth — consent screen, callback, profile auto-created via trigger
- [ ] Forgot password → email → reset-password page → new password works
- [ ] Register (kalau `allowPublicSignup=true`) — email verification flow (kalau enabled)
- [ ] Logout — confirm dialog, activity log written, redirect login

### Commerce — Credentials
- [ ] Connect LS API key (valid) → storeName tampil, `lastVerifiedAt` set
- [ ] Connect LS API key (invalid) → error "invalid_credentials"
- [ ] Disconnect → confirm dialog → credential deleted
- [ ] Test mode toggle works (visible di status card)

### Commerce — Products
- [ ] Products list tampil dari LS store
- [ ] Empty state kalau store kosong
- [ ] Not-connected state kalau belum setup credentials
- [ ] Multi-variant product — "{N} variants" label, "from price"

### Commerce — Webhook Config
- [ ] Generate config → URL + secret tampil (reveal once)
- [ ] Copy URL, paste ke LS dashboard
- [ ] Regenerate → URL dan secret baru, LS dashboard perlu update
- [ ] Delete config → URL gak aktif lagi

### Commerce — Webhook Ingestion
- [ ] Trigger `order_created` dari LS (test mode purchase) → event masuk `commerce_webhook_events`, row masuk `commerce_orders`
- [ ] Trigger `subscription_created` → row masuk `commerce_subscriptions`
- [ ] Trigger `order_refunded` → order row updated, status jadi `refunded`
- [ ] Trigger `subscription_cancelled` (via LS dashboard) → subscription status updated
- [ ] Test HMAC failure — tamper header manually → webhook return 401
- [ ] Test idempotency — replay event via LS dashboard → row masih satu, response `deduplicated: true`
- [ ] Test unknown event — masuk event log tapi skip apply, `processed_at` filled

### Commerce — Orders
- [ ] Orders table list dari DB lokal
- [ ] Filter status (paid/pending/refunded/void) works
- [ ] Filter email works (ILIKE substring)
- [ ] Backfill button → pages=3, fetch dari LS, upsert (cek baris bertambah)

### Commerce — Subscriptions
- [ ] Subscriptions table list
- [ ] Action menu: pause (active → paused), resume (paused → active), cancel (active → cancelled)
- [ ] Status badge updated immediate (sync response dari LS)
- [ ] Actions logged di `activity_logs`
- [ ] Cancelled subscription tetap accessible sampai `ends_at`

### Commerce — Customers
- [ ] Customers table list (sorted by MRR desc)
- [ ] Email filter works
- [ ] Backfill → LS customers synced

### Commerce — Checkout
- [ ] Klik CheckoutButton → POST ke API → LS checkout URL → user redirect
- [ ] User selesai checkout → redirect ke `redirectUrl` (kalau di-pass)
- [ ] Order masuk via webhook → tampil di `/orders`

### Cross-cutting
- [ ] Offline detector — disable network → banner muncul → re-enable → banner hijau 5s → hilang
- [ ] Mobile bottom nav tampil di mobile viewport, hidden di desktop
- [ ] Role gating: login sebagai `user` → `/admin` redirect ke dashboard
- [ ] Role gating: login sebagai `super_admin` → `/admin` accessible
- [ ] Locale fallback: set `NEXT_PUBLIC_APP_LANG=en-US` → UI switch ke English

---

## Known Limitations

1. **Manual verification only.** No automated test suite. Regression testing fully manual.
2. **Skeleton modules** (admin, saas, landing, blog, project, forum, chat) hanya `module.config.ts` + README. Toggle aja kalau mau disable di `appConfig.modules.*.enabled = false`.
3. **Shared layer kosong** (email, notifications, payment, search, file-upload) — semua folder README-only. Engage on-demand kalau butuh.
4. **Single-provider commerce.** Tables punya `provider` column + CHECK constraint `= 'lemonsqueezy'`. Kalau mau tambah Stripe/Paddle, harus relax constraint + bikin abstraction layer (itu Phase 3 concern).
5. **i18n locale static.** `appConfig.locale.default` locked di module-load — gak ada runtime locale switcher. `t()` function udah support param `locale`, tinggal wire UI kalau butuh.
6. **No webhook retry safety net.** LS retry 3x (60s, 5m, 30m). Kalau habis 3x, event jadi `processed_at IS NULL` di `commerce_webhook_events` — recovery manual dengan query errored events.
7. **Password policy minimal** — cuma `min(8)`. Boost via Supabase password strength setting di dashboard kalau target audience sensitive.

---

## Phase 3+ — EXPLICITLY REJECTED

Gak ada roadmap Phase 3. Semua "yang belum" adalah **extension point**, bukan **commitment**.

Skeleton modules (admin, saas, landing, blog, project, forum, chat) bisa di-activate kalau butuh, tapi bukan scope boilerplate ini. Fork + extend sendiri.

Alasan:
- Scope creep = never shipping.
- Phase 2 thin wrapper udah cover 90% case commerce. Sisa 10% itu edge case yang mendingan pake LS native features.
- Maintenance boilerplate yang big-fat-framework = overhead berat. Lean wrapper = mudah adopted, mudah forked, mudah extended per-project.

---

## Arsitektur Summary

```
┌─────────────────────────────────────────────────────┐
│ Lemon Squeezy (Source of Truth — Everything)        │
│  ├─ Products, Variants                              │
│  ├─ Orders, Subscriptions, Customers                │
│  ├─ Checkout (hosted)                               │
│  ├─ Customer Portal                                 │
│  ├─ Analytics & Reports                             │
│  └─ Receipts                                        │
└────────────────┬────────────────────────────────────┘
                 │
       ┌─────────┴─────────┐
       │ REST API          │ Webhooks
       │ (read + actions)  │ (sync to local DB)
       ▼                   ▼
┌─────────────────────────────────────────────────────┐
│ This Boilerplate (Thin Wrapper)                     │
│                                                     │
│  API Routes ──▶ Services ──▶ LS Client              │
│                      │                              │
│                      ▼                              │
│                Supabase DB                          │
│  ┌─────────────────────────────────────┐            │
│  │ commerce_credentials    (encrypted) │            │
│  │ commerce_webhook_configs            │            │
│  │ commerce_webhook_events  (log)      │            │
│  │ commerce_orders          (synced)   │            │
│  │ commerce_subscriptions   (synced)   │            │
│  │ commerce_customers       (synced)   │            │
│  │ user_profiles + activity_logs       │            │
│  └─────────────────────────────────────┘            │
│                      │                              │
│                      ▼                              │
│  UI Pages (CRUD Basic)                              │
│  ├─ Products grid                                   │
│  ├─ Orders table                                    │
│  ├─ Subscriptions table + actions                   │
│  └─ Customers table                                 │
└─────────────────────────────────────────────────────┘
```

**Read path:**
UI → fetch `/api/commerce/*` → service → query Supabase (local DB) → transform → return.

**Write path (action):**
UI → fetch PATCH → service → call LS API → upsert response ke DB → return.

**Sync path (webhook):**
LS → POST `/api/commerce/webhooks/{token}` → verify HMAC → insert event log (idempotent) → `applyEvent` router → upsert ke orders/subscriptions/customers.

Simple. No magic. Delegates wisely.

---

**End of document.** Kalau ada gap baru keliatan setelah verification run, update section "Known Limitations" atau "Verification Matrix". Gak ada "Phase 3 planning" section yang bakal di-tambah.
