# BOILERPLATE PHASES — Status Document

> **Last updated:** 23 April 2026
> **Current state:** Phase 0 + 1 + 2 code complete. Runtime verification pending.
> **Development status:** 🔒 **FINAL — FULL MENTOK.** Phase 2 adalah versi terakhir. No Phase 3 ever.

---

## Filosofi & Frame

Boilerplate ini adalah **thin wrapper around Lemon Squeezy**, bukan commerce engine.

Prinsip operasi:
- **LS is source of truth** untuk semua data commerce (orders, customers, subscriptions, analytics, receipts).
- **Database lokal** cuma snapshot buat display + sync state via webhook. Gak ada business logic di DB.
- **UI lokal** cuma CRUD basic — list, filter, action (pause/resume/cancel). Detail lengkap, analytics, customer portal delegasi ke LS.
- **Zero business logic** di atas LS. Kalau user butuh lebih, arahin ke LS dashboard/customer portal.
- **Auth email delegate ke Resend** via Supabase Send Email Hook — kita cuma render + kirim, Supabase handle token/expiry.

Konsekuensi desain:
- ❌ Tidak ada analytics/reports page — LS punya
- ❌ Tidak ada order/subscription/customer detail page yang elaborate — LS receipt + customer portal
- ❌ Tidak ada dashboard dengan revenue metrics — LS dashboard
- ❌ Tidak ada multi-provider abstraction — LS only
- ❌ Tidak ada custom checkout — LS hosted checkout via `buy_now_url` atau generated checkout link
- ❌ Tidak ada in-house email server / transactional email engine — Resend + Supabase hook
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
- Forgot password → magic link reset via token_hash verification
- Reset password → `supabase.auth.updateUser({ password })` dalam recovery session
- Logout dengan confirm dialog + activity log before sign out (session masih valid buat RLS)

**Auth routes (3 endpoints, distinct responsibilities):**

| Route | Method | Flow | Param |
|---|---|---|---|
| `/api/auth/callback` | GET | OAuth PKCE (Google) | `code` → `exchangeCodeForSession` |
| `/api/auth/confirm` | GET | Email OTP (signup, magiclink, recovery, invite, email_change) | `token_hash` + `type` → `verifyOtp` |
| `/api/auth/hooks/send-email` | POST | Supabase Send Email Hook receiver | HMAC-signed payload dari Supabase |

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
- Confirm route handle email OTP flows — type-aware routing (recovery → reset-password, lainnya → role-aware)

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

## Phase 2 — Commerce CRUD + Custom Auth Email ✅ COMPLETE

Full CRUD untuk 5 entitas commerce **plus** custom-branded auth email via Resend. **Semua engine di LS/Resend.**

### Part A — Commerce CRUD (Thin Wrapper)

#### Delivered Entities

| Entity | List | Detail | Actions | Sync Source |
|---|---|---|---|---|
| Credentials | — | Status card | Connect, disconnect | Verify ke LS |
| Products | Grid | — (ada ProductCard view) | — | GET /products via API |
| Orders | Table + filter (status, email) | — (link ke LS receipt) | Backfill | Webhook + backfill |
| Subscriptions | Table + filter (status, email) | — (actions inline) | Pause, resume, cancel | Webhook + backfill |
| Customers | Table + filter (email) | — (link ke LS customer portal) | Backfill | Webhook-derived + backfill |

#### Webhook Infrastructure (Commerce)

- **Per-user config** — masing-masing user generate webhook URL unik: `{APP_URL}/api/commerce/webhooks/{webhook_token}`
- **Secret** — AES-256-GCM encrypted, reveal plaintext **once** saat provision, abis itu cuma hint
- **HMAC verification** — timing-safe compare, reject kalau mismatch
- **Idempotency** — `UNIQUE(provider, event_id)` di `commerce_webhook_events`, duplicate return 200 tanpa re-process (LS stop retry)
- **Event routing** — `applyEvent` switch based on `event_name`:
  - `order_created`, `order_refunded` → upsert `commerce_orders`
  - `subscription_*` (9 events) → upsert `commerce_subscriptions`
  - Unknown event → stored tapi skip apply, gak dianggap error

#### Checkout

- `CheckoutButton` component — POST ke `/api/commerce/checkout`, redirect atau open new tab
- Support pre-fill email/name, discount code, custom data, redirect URL, dark mode
- Custom data flows through ke webhook `meta.custom_data` untuk user matching

#### Subscription Actions

- Pause (mode: `void` | `free`, optional `resumesAt`)
- Resume (clear pause)
- Cancel (LS DELETE /subscriptions/{id} — status jadi `cancelled`, accessible sampai `ends_at`)
- Ownership check sebelum hit LS API (cegah cross-user access)
- Immediate sync response ke DB lokal (UI gak nunggu webhook)
- Activity logged per action

---

### Part B — Custom Auth Email (Resend + Supabase Send Email Hook)

Custom-branded auth emails — replace default Supabase SMTP email dengan React Email template yang di-render + dikirim via Resend.

#### Arsitektur Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User trigger auth action (signup, magic link, reset pwd)  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Supabase generate token_hash + expiry                     │
│    Kirim POST ke Send Email Hook kita dengan HMAC-signed     │
│    payload berisi: user, token_hash, type, redirect_to       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. /api/auth/hooks/send-email (POST)                         │
│    - Verify HMAC via standardwebhooks                        │
│    - Dispatch ke sendAuthEmail()                             │
│    - Pilih template by email_action_type                     │
│    - Render React Email → HTML + plaintext                   │
│    - Send via Resend                                         │
│    - Return 200 (success) / 401 (bad sig) / 500 (retry)      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. User receive email → click link                           │
│    Link format: {APP_URL}/api/auth/confirm                   │
│                 ?token_hash=xxx&type=yyy&next=zzz            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. /api/auth/confirm (GET)                                   │
│    - supabase.auth.verifyOtp({ token_hash, type })           │
│    - Branch by type:                                         │
│      • recovery → /reset-password                            │
│      • signup/magiclink/invite → verify profile +            │
│        log login + role-aware redirect                       │
│      • email_change → dashboard                              │
└──────────────────────────────────────────────────────────────┘
```

#### Delivered Templates (6)

Semua pake `@react-email/components` + Tailwind. Inline styles untuk email client compatibility.

| Template | File | Purpose | Email action types |
|---|---|---|---|
| Confirm Signup | `confirm-signup.tsx` | Invite / signup confirmation | `invite` |
| Magic Link | `magic-link.tsx` | Login link (existing + new user) | `signup`, `magiclink` |
| Recovery | `recovery.tsx` | Password reset | `recovery` |
| Email Change | `email-change.tsx` | Email address change confirm | `email_change` |
| Reauthentication | `reauthentication.tsx` | 6-digit OTP step-up auth | `reauthentication` |
| Shared Layout | `_layout.tsx` | Header, footer, PrimaryButton shell | (all) |

Semua template minimalist & clean — single brand color dari `brandingConfig.theme.primaryColor`, prose-heavy, inline button styles.

#### Security

- **HMAC signature verification** — via `standardwebhooks` library, reject kalau mismatch
- **Secret format** — `v1,whsec_xxxxx` (Supabase standard)
- **Status code semantics** — match Supabase retry behavior:
  - 200 → success / skipped → STOP retry
  - 400 → malformed → STOP retry
  - 401 → bad signature → STOP retry (config issue)
  - 500 → transient (Resend down) → RETRY

#### Fallback Behavior

- Kalau hook **disabled** di Supabase dashboard → fallback ke default Supabase SMTP (template default, bukan custom)
- Kalau hook **error 500 persistent** → Supabase retry exponential, abis itu email gak terkirim (user harus request ulang)
- Kalau `SEND_EMAIL_HOOK_SECRET` belum di-set → hook endpoint return 500 (server_misconfigured)

---

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
/api/auth/callback               GET — OAuth PKCE
/api/auth/confirm                GET — Email OTP verification
/api/auth/hooks/send-email       POST — Supabase Send Email Hook receiver
/api/commerce/credentials        GET status, POST save, DELETE
/api/commerce/products           GET
/api/commerce/orders             GET list, POST backfill
/api/commerce/orders/[id]        GET detail
/api/commerce/subscriptions      GET list, POST backfill
/api/commerce/subscriptions/[id] GET detail, PATCH action
/api/commerce/customers          GET list, POST backfill
/api/commerce/checkout           POST
/api/commerce/webhooks/config    GET, POST, DELETE
/api/commerce/webhooks/[token]   POST — LS webhook ingestion (public)
```

### File Tree — Email Module

```
src/shared/email/
├── index.ts                     — barrel exports
├── resend-client.ts             — lazy Resend singleton + getFromAddress() + getAppUrl()
├── send-auth-email.tsx          — dispatcher (payload → template → send)
├── types.ts                     — SupabaseEmailHookPayload, EmailActionType
├── verify-webhook.ts            — HMAC verification via standardwebhooks
├── README.md                    — module docs
└── templates/
    ├── _layout.tsx              — shared shell + PrimaryButton
    ├── confirm-signup.tsx
    ├── magic-link.tsx
    ├── recovery.tsx
    ├── email-change.tsx
    └── reauthentication.tsx

src/app/api/auth/
├── callback/route.ts            — OAuth PKCE (exchangeCodeForSession)
├── confirm/route.ts             — Email OTP (verifyOtp)
└── hooks/send-email/route.ts    — Supabase Send Email Hook receiver
```

### Database Schema

Consolidated di `supabase/setup.sql`:
- `user_profiles`, `activity_logs` (Phase 0+1)
- `commerce_credentials` (Phase 1)
- `commerce_webhook_configs`, `commerce_webhook_events` (Phase 2)
- `commerce_orders`, `commerce_subscriptions`, `commerce_customers` (Phase 2)
- All RLS enabled, owner-scoped select, service-role write untuk webhook tables
- Storage bucket `avatars` dengan user-folder policies

**Catatan:** Email module **gak ada DB schema** — stateless, langsung render + kirim. Supabase yang handle token/expiry di auth.users.

### External Dependencies (Phase 2 tambahan)

```bash
# Production
pnpm add resend                        # Resend SDK
pnpm add @react-email/components       # Email component primitives
pnpm add @react-email/render           # Server-side HTML render
pnpm add standardwebhooks              # HMAC verification

# Dev only
pnpm add -D react-email                # Local preview server
```

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
| Multi-provider email (SendGrid, Postmark, SES) | Resend cukup, abstraction jadi overhead | Fork & customize |
| In-app notifications / push notifications | Out of scope, delegate ke 3rd party (OneSignal, etc) | Future notifications module |
| Email preferences / unsubscribe management | Auth email gak perlu unsubscribe, marketing email out of scope | Future |
| Runtime locale switcher | i18n default-locked via config sudah memadai | Future (if needed) |
| Shared layers (notifications, search, file-upload) | Placeholder README only — di-activate on demand | Future modules |
| Skeleton modules (admin, saas, landing, blog, project, forum, chat) | Future extension points, not committed | Future |
| Automated tests | Scope MVP, manual verify cukup | Future |

---

## Deployment Checklist

Sebelum go-live:

### Database & Encryption

- [ ] **Generate ENCRYPTION_KEY:**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- [ ] Set di semua env (dev/staging/prod). Pastiin value sama di prod biar encrypted data bisa di-decrypt.
- [ ] **Backup ENCRYPTION_KEY ke password manager / secret vault.** Loss of key = loss of semua saved credentials.
- [ ] **Run setup.sql:**
  - Supabase Dashboard → SQL Editor → New query → paste `supabase/setup.sql` → Run
  - Check output "SETUP COMPLETE"
- [ ] **Seed users:** `node scripts/seed.js` (creates 5 test users — super_admin, admin, editor, viewer, user)
- [ ] **Regenerate TS types:**
  ```bash
  npx supabase gen types typescript --project-id <PROJECT_ID> > src/core/types/database.ts
  ```

### Supabase Auth Config

- [ ] Auth → Providers → Email → "Confirm email" match `appConfig.auth.requireEmailVerification`
- [ ] Auth → URL Configuration → Redirect URLs whitelist:
  - `{APP_URL}/api/auth/callback`
  - `{APP_URL}/api/auth/confirm`
  - `{APP_URL}/reset-password`
- [ ] Auth → Providers → Google → enable + set client ID/secret (kalau pakai Google OAuth)
- [ ] **Auth → Hooks → Send Email Hook:**
  - Enable
  - Type: HTTPS
  - URL: `{APP_URL}/api/auth/hooks/send-email`
  - Copy generated secret (format `v1,whsec_xxx`) ke `SEND_EMAIL_HOOK_SECRET` env
  - **Penting:** setelah hook enabled, Supabase **gak kirim email default lagi** — semua auth email via hook

### Resend Config

- [ ] Daftar di [resend.com](https://resend.com)
- [ ] Add & verify domain (DNS records: SPF, DKIM, DMARC)
- [ ] Generate API key → simpan sebagai `RESEND_API_KEY`
- [ ] Decide sender address → set `RESEND_FROM_EMAIL="MyApp <noreply@yourdomain.com>"`
- [ ] Test send email via Resend dashboard "Emails" tab

### App Config

- [ ] **Branding env vars** (optional — ada defaults):
  - `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_SHORT_NAME`
  - `NEXT_PUBLIC_APP_DESCRIPTION`, `NEXT_PUBLIC_APP_PRIMARY_COLOR`
  - `NEXT_PUBLIC_APP_LANG`, dll
- [ ] `NEXT_PUBLIC_APP_URL` — **wajib set di production** (dipakai email module + webhook config)

### LS Webhook Registration (per user, bukan deploy step)

- [ ] User generate webhook config via UI → dapet URL + secret
- [ ] User paste URL + secret ke LS dashboard (Settings → Webhooks)
- [ ] Subscribe ke 12 events yang relevan (list di `WEBHOOK_EVENTS` di `types.ts`)

---

## Verification Matrix — PENDING ⚠️

**Status runtime verification:** BELUM di-test E2E dengan real account.

Semua implementasi udah code-complete, tapi belum ada **actual test run** untuk konfirmasi:

### Auth Flows

- [ ] Email+password login — happy path
- [ ] Email+password login — deactivated user → pesan "account deactivated"
- [ ] Email+password login — non-existent user via OAuth callback → pesan "not registered"
- [ ] Google OAuth — consent screen, callback, profile auto-created via trigger
- [ ] Register (kalau `allowPublicSignup=true`) — email verification flow
- [ ] Logout — confirm dialog, activity log written, redirect login

### Auth Email (Phase 2)

- [ ] Trigger magic link → hook endpoint dipanggil Supabase → Resend kirim email
- [ ] Email masuk inbox (bukan spam) dengan custom template + branding
- [ ] Click link → `/api/auth/confirm` → verifyOtp success → dashboard
- [ ] Forgot password → email terkirim → click link → `/reset-password` page → new password works
- [ ] Signup (kalau `requireEmailVerification=true`) → email terkirim → click link → account activated
- [ ] Email change confirm → email terkirim ke alamat baru → click link → email di DB updated
- [ ] HMAC failure test — tamper signature header manually → hook return 401
- [ ] Missing secret test — unset `SEND_EMAIL_HOOK_SECRET` → hook return 500 "server_misconfigured"
- [ ] Resend domain issue test — kirim dari unverified domain → Resend error di log, hook return 500
- [ ] Unknown email_action_type test (simulate via Supabase) → hook return 200 with `skipped: true`

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

### Commerce — Orders / Subscriptions / Customers

- [ ] Orders table list dari DB lokal; filter status + email works; backfill works
- [ ] Subscriptions table list; action pause/resume/cancel works; status badge updated immediate
- [ ] Customers table list (sorted by MRR desc); backfill works

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
3. **Shared layer placeholder** (notifications, payment, search, file-upload) — semua folder README-only. Engage on-demand kalau butuh. Email module **sudah implemented** (bukan placeholder).
4. **Single-provider commerce.** Tables punya `provider` column + CHECK constraint `= 'lemonsqueezy'`. Kalau mau tambah Stripe/Paddle, harus relax constraint + bikin abstraction layer.
5. **Single-provider email.** Resend only. Kalau mau SendGrid/Postmark/SES, swap di `resend-client.ts` + `sendAuthEmail()` (interface kecil).
6. **i18n locale static.** `appConfig.locale.default` locked di module-load — gak ada runtime locale switcher. `t()` function udah support param `locale`, tinggal wire UI kalau butuh.
7. **Email template locale hardcoded Indonesian.** Semua subject + copy di template dalam Bahasa. Kalau target audience English, edit manual di `send-auth-email.tsx` (subjects) + template `.tsx` files.
8. **No webhook retry safety net (LS).** LS retry 3x (60s, 5m, 30m). Kalau habis 3x, event jadi `processed_at IS NULL` di `commerce_webhook_events` — recovery manual dengan query errored events.
9. **No email retry safety net beyond Supabase.** Hook return 500 → Supabase retry exponential. Kalau Resend down terus-terusan, email gak terkirim. User harus request ulang (klik "resend magic link" / forgot password lagi).
10. **Password policy minimal** — cuma `min(8)`. Boost via Supabase password strength setting di dashboard kalau target audience sensitive.

---

## 🔒 Phase 3+ — EXPLICITLY REJECTED (PERMANENT)

**GAK ADA roadmap Phase 3.** Pengembangan boilerplate ini sudah **FULL MENTOK di Phase 2**. Tidak ada commitment untuk fitur lanjutan.

Semua "yang belum" adalah **extension point**, bukan **commitment** maupun **backlog**.

### Alasan (final)

- **Scope creep = never shipping.** Boilerplate yang terus nambah fitur = maintenance hell.
- **Phase 2 thin wrapper udah cover 90% case commerce.** Sisa 10% itu edge case yang mendingan pake LS native features.
- **Auth email via Resend + Hook udah cover 100% kebutuhan transactional auth email.** Marketing email / campaign / sequences bukan scope boilerplate.
- **Lean wrapper = mudah adopted, mudah forked, mudah extended per-project.** Big-fat-framework = beban berat untuk semua orang.

### Kalau kamu butuh lebih

**Fork & extend sendiri.** Skeleton modules (admin, saas, landing, blog, project, forum, chat) bisa di-activate kalau butuh, tapi bukan scope boilerplate ini.

Dokumentasi, PR review, feature request, issue tracker — semua **gak akan di-handle di repo boilerplate ini** karena dianggap sudah final.

---

## Arsitektur Summary

```
┌──────────────────────────────────────────────────────────────┐
│ EXTERNAL SERVICES (Source of Truth)                          │
├──────────────────────────────────────────────────────────────┤
│ Lemon Squeezy      Resend              Supabase Auth         │
│ ├─ Products        ├─ Transactional    ├─ Token generation   │
│ ├─ Orders          │  email delivery   ├─ Session mgmt       │
│ ├─ Subscriptions   ├─ Domain reputation├─ RLS enforcement    │
│ ├─ Customers       └─ Bounce handling  ├─ OAuth providers    │
│ ├─ Checkout                            └─ Send Email Hook    │
│ ├─ Customer Portal                        (→ our receiver)   │
│ ├─ Analytics                                                 │
│ └─ Receipts                                                  │
└──────────────┬───────────────────────────────────────────────┘
               │
       ┌───────┴────────┬──────────────────┐
       │ REST API       │ Webhooks         │ Hook (outbound)
       │ (read+actions) │ (sync to DB)     │ (render+send)
       ▼                ▼                  ▼
┌──────────────────────────────────────────────────────────────┐
│ THIS BOILERPLATE (Thin Wrapper)                              │
│                                                              │
│  API Routes ──▶ Services ──▶ LS Client / Resend Client       │
│                     │                                        │
│                     ▼                                        │
│               Supabase DB                                    │
│  ┌────────────────────────────────────┐                      │
│  │ commerce_credentials   (encrypted) │                      │
│  │ commerce_webhook_configs           │                      │
│  │ commerce_webhook_events (log)      │                      │
│  │ commerce_orders        (synced)    │                      │
│  │ commerce_subscriptions (synced)    │                      │
│  │ commerce_customers     (synced)    │                      │
│  │ user_profiles + activity_logs      │                      │
│  └────────────────────────────────────┘                      │
│                     │                                        │
│                     ▼                                        │
│  UI Pages (CRUD Basic)                                       │
│  ├─ Products grid                                            │
│  ├─ Orders table                                             │
│  ├─ Subscriptions table + actions                            │
│  └─ Customers table                                          │
└──────────────────────────────────────────────────────────────┘
```

**Read path:**
UI → fetch `/api/commerce/*` → service → query Supabase (local DB) → transform → return.

**Write path (action):**
UI → fetch PATCH → service → call LS API → upsert response ke DB → return.

**Sync path (LS webhook):**
LS → POST `/api/commerce/webhooks/{token}` → verify HMAC → insert event log (idempotent) → `applyEvent` router → upsert ke orders/subscriptions/customers.

**Auth email path:**
User action → Supabase generate token → POST `/api/auth/hooks/send-email` (HMAC-signed) → verify → dispatch → Resend send → user click link → `/api/auth/confirm` → verifyOtp → session + redirect.

Simple. No magic. Delegates wisely.

---

**End of document.** Kalau ada gap baru keliatan setelah verification run, update section "Known Limitations" atau "Verification Matrix". **Phase 3 tidak pernah akan ditambahkan.** Fork dan extend sendiri kalau butuh.