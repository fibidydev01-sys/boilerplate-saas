# 🔐 ENVIRONMENT VARIABLES — Panduan Lengkap

> **Scope:** Dokumen ini **100% fokus ke env vars**. Semua variabel yang dipakai codebase sampai hari ini (Phase 2 FINAL — auth + commerce + email).
> **Bukan** tutorial deploy, bukan tutorial Docker. Cuma: "env ini apa, diisi pakai apa, dari mana dapetnya."
>
> **Status pengembangan:** 🔒 **FINAL di Phase 2.** Tidak ada penambahan env lagi di masa depan.

---

## 📋 Ringkasan Cepat

Total env vars yang dikenal codebase: **18 variabel.**

| Kategori | Count | Required? |
|---|---|---|
| Supabase | 3 | 3 required |
| Encryption | 1 | **Required** |
| Email (Resend) | 2 | **Required** |
| Send Email Hook | 1 | **Required** |
| App URL | 1 | Optional di local, **required** di production |
| Branding | 10 | Semua optional (ada defaults) |
| System | — | Auto-set by Next.js (NODE_ENV) |

### Minimum viable `.env.local` (full Phase 2)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Encryption
ENCRYPTION_KEY=<base64 32 bytes>

# Resend (auth email delivery)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="My App <noreply@yourdomain.com>"

# Supabase Send Email Hook
SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxxxxxxxxxx
```

7 baris essential. Branding optional (ada defaults). `NEXT_PUBLIC_APP_URL` optional di local.

---

## 1. Supabase (3 variabel)

Dipakai di: `core/lib/supabase/{client,server,proxy,service-role}.ts`, `app/layout.tsx` (preconnect hint).

### 1.1 `NEXT_PUBLIC_SUPABASE_URL`

| Property | Value |
|---|---|
| Required | **Ya** |
| Exposed ke browser | Ya (prefix `NEXT_PUBLIC_`) |
| Default | — (tidak ada, app crash kalau kosong) |
| Format | URL lengkap dengan `https://` |
| Contoh | `https://abcdefgh12345.supabase.co` |

**Dari mana dapetnya:**
Supabase Dashboard → pilih project → **Project Settings** (icon gear di sidebar) → **Data API** → **Project URL**.

**Dipakai buat apa:**
- Browser Supabase client (auth, RLS query) via `createBrowserClient`
- Server Supabase client (RSC, Route Handler) via `createServerClient`
- Middleware proxy (session refresh)
- Service-role client (webhook ingestion)
- `<link rel="preconnect">` di root layout buat speedup TLS handshake

### 1.2 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

| Property | Value |
|---|---|
| Required | **Ya** |
| Exposed ke browser | Ya (prefix `NEXT_PUBLIC_`) |
| Default | — |
| Format | JWT (panjang, mulai `eyJ...`) |
| Contoh | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYyJ9.xxxxx` |

**Dari mana:**
Dashboard → **Project Settings** → **Data API** → bagian **Project API keys** → row `anon` `public` → copy value.

**Aman di-expose?** Ya. Anon key didesain buat client-side. RLS (Row Level Security) yang enforce permission — anon key tidak bisa bypass RLS. Kalau ada table/storage yang kamu mau publik, atur lewat RLS policy.

**Dipakai di:** sama dengan URL di atas (kecuali service-role client — itu pake key beda).

### 1.3 `SUPABASE_SERVICE_ROLE_KEY`

| Property | Value |
|---|---|
| Required | **Ya** |
| Exposed ke browser | **TIDAK** (no `NEXT_PUBLIC_` prefix) |
| Default | — |
| Format | JWT |
| Contoh | `eyJhbGc...` (beda value dari anon key) |

**⚠️ KRITIKAL — JANGAN BOCOR:**
- Service role key **bypass RLS**. Siapa pun yang pegang key ini bisa baca/tulis semua tabel tanpa auth.
- **JANGAN** pernah commit ke Git.
- **JANGAN** pernah pakai prefix `NEXT_PUBLIC_` untuk variabel ini.
- Kalau bocor: Dashboard → Project Settings → API → **Reset** service_role → update env.

**Dari mana:**
Dashboard → **Project Settings** → **Data API** → bagian **Project API keys** → row `service_role` `secret` → **Reveal** → copy.

**Dipakai buat apa:**
- `core/lib/supabase/service-role.ts` — dipakai di route handler `POST /api/commerce/webhooks/[token]`. Webhook dari Lemon Squeezy datang **tanpa user session**, jadi gak bisa pake anon+RLS. Service role dipakai buat upsert ke `commerce_webhook_events`, `commerce_orders`, `commerce_subscriptions`.

---

## 2. Encryption (1 variabel)

### 2.1 `ENCRYPTION_KEY`

| Property | Value |
|---|---|
| Required | **Ya** |
| Exposed ke browser | **TIDAK** |
| Default | — (akan throw error kalau kosong) |
| Format | Base64-encoded 32 bytes |
| Contoh | `aGVsbG9fd29ybGRfdGhpc19pc18zMl9ieXRlc19rZXlzMTI=` |

**Pakai buat apa:**
`core/lib/encryption.ts` — AES-256-GCM encryption. Dipakai buat encrypt:
- LS API keys sebelum masuk `commerce_credentials.encrypted_api_key`
- Webhook secrets sebelum masuk `commerce_webhook_configs.encrypted_secret`

**Cara generate:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Output contoh:
```
GJ4p8QzN5xK2mH9vL3sW7yT1bE6dA0cF+RiU8oZpVnM=
```

Copy ke `.env.local`:

```env
ENCRYPTION_KEY=GJ4p8QzN5xK2mH9vL3sW7yT1bE6dA0cF+RiU8oZpVnM=
```

### ⚠️ CRITICAL RULES

1. **Value harus persis 32 bytes** setelah base64 decode. Kalau beda, `getKey()` di `encryption.ts` bakal throw:
   > `ENCRYPTION_KEY must be 32 bytes (base64 encoded). Got N bytes.`

2. **Value SAMA di semua environment** (dev/staging/prod) yang share database yang sama. Kalau beda, data yang di-encrypt di satu env gak bisa di-decrypt di env lain.

3. **Backup ke secret manager** (1Password, Bitwarden, AWS Secrets Manager, dll). **Kehilangan key = kehilangan semua encrypted data.** Gak ada recovery.

4. **Rotation:** Kalau perlu ganti key (misal bocor), harus:
   - Decrypt semua row pakai key lama
   - Encrypt ulang pakai key baru
   - Update env dengan key baru

   Gak ada auto-rotation mechanism di boilerplate ini.

---

## 3. Email — Resend (2 variabel) 🔥 **BARU PHASE 2**

Dipakai untuk semua auth email (magic link, recovery, signup confirm, email change, reauthentication) via Supabase Send Email Hook.

### 3.1 `RESEND_API_KEY`

| Property | Value |
|---|---|
| Required | **Ya** |
| Exposed ke browser | **TIDAK** (server-side only) |
| Default | — (crash kalau kosong saat hook di-trigger) |
| Format | String `re_xxxxxxxxxxxxx` |
| Contoh | `re_AbCdEfGhIjKlMnOp1234567890` |

**Dari mana:**
1. Daftar di [resend.com](https://resend.com)
2. Dashboard → **API Keys** → **Create API Key**
3. Name bebas (misal `my-app-production`)
4. Permission: **Full access** atau **Sending access**
5. Copy key (⚠️ cuma muncul sekali — kalau lupa, bikin baru)

**Dipakai di:**
- `src/shared/email/resend-client.ts` — `getResendClient()` lazy-init Resend SDK singleton

**Ganti key / rotate:**
Resend Dashboard → bikin key baru → update env → redeploy → delete key lama.

### 3.2 `RESEND_FROM_EMAIL`

| Property | Value |
|---|---|
| Required | **Ya** |
| Exposed ke browser | **TIDAK** |
| Default | — |
| Format | `"Sender Name <email@domain.com>"` (RFC 5322) |
| Contoh | `"Acme Platform <noreply@acme.com>"` |

**Penting — domain harus verified di Resend:**
- Sender email harus pakai domain yang udah **verified** di Resend (DKIM + SPF setup done)
- Kalau pakai unverified domain → Resend return 400 "Domain is not verified"
- Sandbox alternative untuk dev: pakai `onboarding@resend.dev` (cuma bisa kirim ke email kamu sendiri — email yang dipakai daftar Resend)

**Valid formats:**

```env
# ✅ Benar — dengan sender name
RESEND_FROM_EMAIL="My App <noreply@yourdomain.com>"
RESEND_FROM_EMAIL="Acme <hello@acme.com>"

# ✅ Benar — email aja (gak recommended, sender name empty)
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ❌ Salah — domain belum verified
RESEND_FROM_EMAIL="Me <email@unverified-domain.com>"

# ❌ Salah — email gratisan (Gmail, Yahoo gak support)
RESEND_FROM_EMAIL=myapp@gmail.com
```

**Dipakai di:**
- `src/shared/email/resend-client.ts` — `getFromAddress()`

**Best practices:**
- Sender name match brand name (`brandingConfig.name`)
- Email pake `noreply@` atau `hello@` atau `support@`
- Jangan pake personal email (`john@company.com`) — looks unprofessional untuk transactional

---

## 4. Supabase Send Email Hook (1 variabel) 🔥 **BARU PHASE 2**

### 4.1 `SEND_EMAIL_HOOK_SECRET`

| Property | Value |
|---|---|
| Required | **Ya** |
| Exposed ke browser | **TIDAK** |
| Default | — (hook return 500 "server_misconfigured" kalau kosong) |
| Format | `v1,whsec_xxxxxxxxxxxxx` (Supabase standard webhook secret format) |
| Contoh | `v1,whsec_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890` |

**Dari mana:**
1. Supabase Dashboard → **Authentication** → **Hooks** → **Send Email Hook**
2. Enable hook → Type **HTTPS** → masukin hook URL
3. Supabase auto-generate secret — tampil di bawah Save button
4. Copy **EXACT** value (termasuk prefix `v1,`)

**Format breakdown:**
- `v1,` — versi protokol Standard Webhooks (required prefix)
- `whsec_` — prefix standard untuk webhook secret
- Sisa karakter — random secret

**Kalau kamu copy value tanpa prefix `v1,`:**
HMAC verify gagal → hook return 401 "invalid_signature".

**Dipakai di:**
- `src/shared/email/verify-webhook.ts` — `verifyHookRequest()` via `standardwebhooks` library

**Rotate secret:**
1. Supabase Dashboard → Auth → Hooks → **Regenerate secret**
2. Update env → redeploy
3. **Gak ada downtime** karena old secret immediately invalid setelah regenerate

---

## 5. App URL (1 variabel)

### 5.1 `NEXT_PUBLIC_APP_URL`

| Property | Value |
|---|---|
| Required | Production **wajib**, local **optional** |
| Exposed ke browser | Ya |
| Default | — (fallback pakai `new URL(request.url).origin`) |
| Format | URL lengkap dengan scheme, tanpa trailing slash |
| Contoh | `https://my-app.vercel.app` atau `http://localhost:3000` |

**Dipakai di 2 tempat:**

1. **`src/shared/email/resend-client.ts` → `getAppUrl()`** — untuk build verification URL di email:
   ```
   {APP_URL}/api/auth/confirm?token_hash=xxx&type=yyy&next=zzz
   ```

2. **`src/app/api/commerce/webhooks/config/route.ts` → `getAppUrl()`** — untuk construct webhook URL per-user:
   ```
   {APP_URL}/api/commerce/webhooks/{token}
   ```

**Kapan wajib di-set:**
- **Production:** wajib set, biar URL pakai domain production (bukan fallback dari request header yang bisa salah kalau ada proxy chain).
- **Local dev:** boleh kosong — fallback ke `http://localhost:3000` dari request origin udah benar.

**Format yang benar:**
```env
# ✅ Benar
NEXT_PUBLIC_APP_URL=https://my-app.vercel.app
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ❌ Salah — trailing slash
NEXT_PUBLIC_APP_URL=https://my-app.vercel.app/

# ❌ Salah — tanpa scheme
NEXT_PUBLIC_APP_URL=my-app.vercel.app
```

Trailing slash otomatis di-strip sama code (`replace(/\/$/, "")`), tapi mending disiplin aja biar konsisten.

---

## 6. Branding (10 variabel)

Semua opsional. Semua punya default di `src/config/branding.config.ts`. Dipakai buat customize branding tanpa touch code.

### 6.1 `NEXT_PUBLIC_APP_NAME`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `"My App"` |
| Dipakai di | Metadata title, meta author description, PWA manifest `name`, welcome message, login header, **email template branding** |

**Contoh:**
```env
NEXT_PUBLIC_APP_NAME="Acme Platform"
```

### 6.2 `NEXT_PUBLIC_APP_SHORT_NAME`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `"App"` |
| Dipakai di | Sidebar logo text, header compact, PWA `short_name` (homescreen icon), apple-mobile-web-app-title, metadata title template (`%s \| ${shortName}`), **email subject line** |

**Contoh:**
```env
NEXT_PUBLIC_APP_SHORT_NAME="Acme"
```

**Email subjects pakai `shortName`:**
- `"Masuk ke {shortName}"` (magic link)
- `"Reset password {shortName}"` (recovery)
- `"Konfirmasi perubahan email {shortName}"` (email change)
- `"Kode verifikasi {shortName}"` (reauthentication)

**Kenapa dipisah dari `APP_NAME`?** `short_name` di PWA harus pendek (max ~12 char biar gak ke-truncate di homescreen) + email subject line juga harus ringkas.

### 6.3 `NEXT_PUBLIC_APP_DESCRIPTION`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `"A modern web application"` |
| Dipakai di | `<meta name="description">` (SEO), login page subtitle, PWA `description` |

**Contoh:**
```env
NEXT_PUBLIC_APP_DESCRIPTION="The fastest way to manage your team"
```

**Tips:** 150-160 karakter optimal buat SEO. Singkat tapi deskriptif.

### 6.4 `NEXT_PUBLIC_APP_TAGLINE`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `"Welcome"` |
| Dipakai di | Currently reserved untuk marketing/welcome (bisa dipakai di landing module di future) |

**Contoh:**
```env
NEXT_PUBLIC_APP_TAGLINE="Built for speed, designed for humans"
```

### 6.5 `NEXT_PUBLIC_APP_KEYWORDS`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `"app,web,platform"` |
| Format | Comma-separated string, auto-split jadi array |
| Dipakai di | `<meta name="keywords">` (SEO, pengaruh minor tapi ada) |

**Contoh:**
```env
NEXT_PUBLIC_APP_KEYWORDS="team management, collaboration, productivity, saas"
```

**Parsing:** Code auto-split by `,` dan trim whitespace. Jadi `"team, saas "` → `["team", "saas"]`.

### 6.6 `NEXT_PUBLIC_APP_AUTHOR`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `""` (empty string — akan di-skip di metadata kalau kosong) |
| Dipakai di | `<meta name="author">` |

**Contoh:**
```env
NEXT_PUBLIC_APP_AUTHOR="Acme Corp"
```

### 6.7 `NEXT_PUBLIC_APP_PRIMARY_COLOR`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `"#16a34a"` (green-600 Tailwind) |
| Format | Hex color dengan `#` prefix |
| Dipakai di | `<meta name="theme-color">`, PWA manifest `theme_color`, `msapplication-TileColor`, splash screen bg, **email template accent color (button, links)** |

**Contoh:**
```env
NEXT_PUBLIC_APP_PRIMARY_COLOR="#2563eb"
```

**PENTING — dipakai di 2 layer:**

1. **Browser chrome / PWA:** theme-color meta tag, splash screen, Windows tile.

2. **UI primary (Tailwind CSS):** di `globals.css` ada CSS variable `--primary` format OKLCH yang **harus di-sync manual** kalau primary color di env berubah. Belum auto-sync.

3. **Email templates:** template `.tsx` baca dari `brandingConfig.theme.primaryColor` langsung → button & link color di email pake value ini.

Kalau mau ganti UI primary totally, edit `--primary` di `src/app/globals.css` + update env ini (untuk email).

### 6.8 `NEXT_PUBLIC_APP_BG_COLOR`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `"#ffffff"` |
| Format | Hex color |
| Dipakai di | PWA manifest `background_color` (splash screen warna bg saat PWA di-launch dari homescreen) |

**Contoh:**
```env
NEXT_PUBLIC_APP_BG_COLOR="#0a0a0a"
```

**Kapan beda dari white?** Kalau app default dark mode — splash screen putih jarring ke dark UI. Set sesuai theme dominan.

### 6.9 `NEXT_PUBLIC_APP_CATEGORY`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `"productivity"` |
| Format | String kategori PWA |
| Dipakai di | Metadata `category`, PWA manifest `categories` |

**Valid values (kategori PWA standard):**
`books`, `business`, `education`, `entertainment`, `finance`, `fitness`, `food`, `games`, `government`, `health`, `kids`, `lifestyle`, `magazines`, `medical`, `music`, `navigation`, `news`, `personalization`, `photo`, `productivity`, `security`, `shopping`, `social`, `sports`, `travel`, `utilities`, `weather`.

**Contoh:**
```env
NEXT_PUBLIC_APP_CATEGORY="business"
```

### 6.10 `NEXT_PUBLIC_APP_LANG`

| Property | Value |
|---|---|
| Required | Tidak |
| Default | `"id-ID"` |
| Format | BCP-47 language tag |
| Dipakai di | PWA manifest `lang`, HTML `<html lang="...">` |

**Contoh valid values:**
- `id-ID` — Indonesian (Indonesia)
- `en-US` — English (US)
- `en-GB` — English (UK)
- `ja-JP` — Japanese
- `zh-CN` — Chinese Simplified

**Contoh:**
```env
NEXT_PUBLIC_APP_LANG="en-US"
```

**Note:** Ini **bukan** locale UI. UI locale di-control lewat `appConfig.locale.default` di `src/config/app.config.ts` (value `"id"` atau `"en"`). `NEXT_PUBLIC_APP_LANG` cuma metadata PWA — bahasa OS/browser hint buat accessibility tools.

**⚠️ Email template bahasa:** Saat ini **hardcoded Indonesian** di semua subject + copy body. Mengubah `NEXT_PUBLIC_APP_LANG` **tidak** akan translate email. Kalau target audience English, edit manual file template di `src/shared/email/templates/`.

---

## 7. System / Auto-managed

### 7.1 `NODE_ENV`

| Property | Value |
|---|---|
| Required | Tidak (Next.js auto-set) |
| Exposed | Yes (baca-only, readonly) |
| Values | `development` \| `production` \| `test` |
| **JANGAN** di-set manual | — Next.js yang handle |

**Di-set otomatis oleh:**
- `pnpm dev` → `development`
- `pnpm build` & `pnpm start` → `production`
- Test runner → `test`

**Dipakai codebase buat:**
- `app/api/auth/callback/route.ts` + `app/api/auth/confirm/route.ts` — deteksi localhost buat redirect handling (production pake forwarded-host header)
- `core/auth/components/forgot-password-form.tsx` — dev-only warning logging
- `core/i18n/index.ts` — dev-only missing translation warning
- `modules/commerce/services/activity.service.ts` — dev-only error logging

**DON'T:**
Jangan override `NODE_ENV` di `.env.local` atau Vercel. Next.js sendiri yang manage. Kalau di-override bisa bikin bug aneh (misal: dev mode features aktif di production build).

---

## 8. Full `.env.local` Template (Ready to Copy)

Copy ini ke `.env.local` di root project. Uncomment & isi yang kamu butuh:

```env
# =====================================================================
# SUPABASE (REQUIRED)
# =====================================================================
# Dari: Supabase Dashboard → Project Settings → Data API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# ⚠️ SECRET — bypass RLS. JANGAN commit, JANGAN expose ke client.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# =====================================================================
# ENCRYPTION (REQUIRED)
# =====================================================================
# Generate:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
#
# ⚠️ SIMPAN DI SECRET MANAGER. Kehilangan key = kehilangan encrypted data.
# ⚠️ Value harus SAMA di semua env yang share database.
ENCRYPTION_KEY=GJ4p8QzN5xK2mH9vL3sW7yT1bE6dA0cF+RiU8oZpVnM=

# =====================================================================
# RESEND — TRANSACTIONAL EMAIL (REQUIRED)
# =====================================================================
# Dari: resend.com/api-keys (butuh domain verified dulu)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Format: "Sender Name <email@verified-domain.com>"
# Domain harus yang udah verified di Resend (DKIM + SPF ✓)
RESEND_FROM_EMAIL="My App <noreply@yourdomain.com>"

# =====================================================================
# SUPABASE SEND EMAIL HOOK (REQUIRED)
# =====================================================================
# Dari: Supabase Dashboard → Auth → Hooks → Send Email Hook → Generate
# Format EXACT: v1,whsec_xxxxxxxxxx (termasuk prefix "v1,")
SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxxxxxxxxxx

# =====================================================================
# APP URL (Production wajib, local optional)
# =====================================================================
# Dipakai oleh email module (build verify URL) + webhook config route.
# Format: https://domain.com (no trailing slash, pake scheme)
# NEXT_PUBLIC_APP_URL=https://my-app.vercel.app

# =====================================================================
# BRANDING (Semua opsional, ada defaults)
# =====================================================================
NEXT_PUBLIC_APP_NAME="My App"
NEXT_PUBLIC_APP_SHORT_NAME="App"
NEXT_PUBLIC_APP_DESCRIPTION="A modern web application"
NEXT_PUBLIC_APP_TAGLINE="Welcome"
NEXT_PUBLIC_APP_KEYWORDS="app,web,platform"
NEXT_PUBLIC_APP_AUTHOR=""
NEXT_PUBLIC_APP_PRIMARY_COLOR="#16a34a"
NEXT_PUBLIC_APP_BG_COLOR="#ffffff"
NEXT_PUBLIC_APP_CATEGORY="productivity"
NEXT_PUBLIC_APP_LANG="id-ID"
```

---

## 9. Referensi Silang: Env → File yang Pakai

Kalau kamu mau trace "env X dipakai di mana aja":

| Env Var | File yang pakai | Path |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `createClient` (browser) | `src/core/lib/supabase/client.ts` |
| | `createServerClient` | `src/core/lib/supabase/server.ts` |
| | `updateSession` (middleware) | `src/core/lib/supabase/proxy.ts` |
| | `createServiceRoleClient` | `src/core/lib/supabase/service-role.ts` |
| | `<link rel="preconnect">` | `src/app/layout.tsx` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `createClient` (browser) | `src/core/lib/supabase/client.ts` |
| | `createServerClient` | `src/core/lib/supabase/server.ts` |
| | `updateSession` (middleware) | `src/core/lib/supabase/proxy.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | `createServiceRoleClient` | `src/core/lib/supabase/service-role.ts` |
| `ENCRYPTION_KEY` | `getKey()` → encrypt/decrypt | `src/core/lib/encryption.ts` |
| `RESEND_API_KEY` | `getResendClient()` | `src/shared/email/resend-client.ts` |
| `RESEND_FROM_EMAIL` | `getFromAddress()` | `src/shared/email/resend-client.ts` |
| `SEND_EMAIL_HOOK_SECRET` | `verifyHookRequest()` | `src/shared/email/verify-webhook.ts` |
| `NEXT_PUBLIC_APP_URL` | `getAppUrl()` (email) | `src/shared/email/resend-client.ts` |
| | `getAppUrl()` (webhook config) | `src/app/api/commerce/webhooks/config/route.ts` |
| `NEXT_PUBLIC_APP_NAME` | `brandingConfig.name` | `src/config/branding.config.ts` |
| `NEXT_PUBLIC_APP_SHORT_NAME` | `brandingConfig.shortName` | `src/config/branding.config.ts` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `brandingConfig.description` | `src/config/branding.config.ts` |
| `NEXT_PUBLIC_APP_TAGLINE` | `brandingConfig.tagline` | `src/config/branding.config.ts` |
| `NEXT_PUBLIC_APP_KEYWORDS` | `brandingConfig.meta.keywords` | `src/config/branding.config.ts` |
| `NEXT_PUBLIC_APP_AUTHOR` | `brandingConfig.meta.author` | `src/config/branding.config.ts` |
| `NEXT_PUBLIC_APP_PRIMARY_COLOR` | `brandingConfig.theme.primaryColor` + `themeColorMeta` | `src/config/branding.config.ts` |
| `NEXT_PUBLIC_APP_BG_COLOR` | `brandingConfig.theme.backgroundColor` | `src/config/branding.config.ts` |
| `NEXT_PUBLIC_APP_CATEGORY` | `brandingConfig.meta.category` | `src/config/branding.config.ts` |
| `NEXT_PUBLIC_APP_LANG` | `brandingConfig.meta.lang` | `src/config/branding.config.ts` |
| `NODE_ENV` | dev-only logging | multiple (auto-set) |

---

## 10. Validation Checklist

Sebelum `pnpm dev` atau deploy, cek:

```
[ ] File .env.local ada di root project (bukan di src/)
[ ] File .env.local TIDAK masuk Git (run: git check-ignore .env.local → harus output ".env.local")
[ ] NEXT_PUBLIC_SUPABASE_URL terisi, format https://xxx.supabase.co
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY terisi, JWT panjang (~200+ char)
[ ] SUPABASE_SERVICE_ROLE_KEY terisi, beda value dari anon key
[ ] ENCRYPTION_KEY terisi, base64 32 bytes
[ ] ENCRYPTION_KEY di-backup ke password manager
[ ] RESEND_API_KEY terisi, format re_xxxxxxxxxx
[ ] RESEND_FROM_EMAIL terisi, format "Name <email@verified-domain.com>"
[ ] SEND_EMAIL_HOOK_SECRET terisi, format v1,whsec_xxxxxxxxxx (dengan prefix!)
[ ] NEXT_PUBLIC_APP_URL terisi di production (optional di local)
[ ] Branding vars optional — isi sesuai brand kamu (atau pake default)
```

### Smoke test env udah ke-load:

```bash
# 1. Pastikan .env.local di-read
pnpm dev

# 2. Cek console — seharusnya gak ada:
#    "NEXT_PUBLIC_SUPABASE_URL is not defined"
#    "ENCRYPTION_KEY env var not set"
#    "SUPABASE_SERVICE_ROLE_KEY not set"
#    "RESEND_API_KEY is not set"
#    "SEND_EMAIL_HOOK_SECRET is not set"

# 3. Buka http://localhost:3000
#    - Harus redirect ke /login
#    - Login page harus tampil brand name kamu (kalau NEXT_PUBLIC_APP_NAME di-set)

# 4. (Optional) Test hook endpoint di ngrok
#    - Trigger magic link dari UI
#    - Email harus sampai inbox (cek Resend dashboard "Emails" log)
```

Kalau ada error "X not defined" → env belum ke-load. Check:
- File naming (`.env.local` bukan `.env`, bukan `env.local`)
- Lokasi (root project, sejajar `package.json`)
- Restart dev server (Next.js cache env di-load sekali di startup)

---

## 11. Catatan Terakhir

### Yang GAK ada di codebase (tapi sering ditanya):

- ❌ `DATABASE_URL` — direct Postgres connection. Boilerplate ini **cuma pakai Supabase client**, gak ada raw query via pg driver. Kalau kamu perlu (misal migration tool external), ambil dari Supabase Dashboard → Project Settings → Database → Connection string. Tapi gak dipakai di runtime app.

- ❌ `STRIPE_*` — disebut di dokumen lama, tapi codebase sekarang pakai **Lemon Squeezy** (bukan Stripe). Credential LS disimpan di DB (encrypted), bukan env. Jadi gak ada `LEMONSQUEEZY_API_KEY` di env — user input via UI, di-encrypt, simpan di `commerce_credentials.encrypted_api_key`.

- ❌ `SMTP_*` — email config **gak dipakai**. Semua auth email via Supabase Send Email Hook + Resend (section 3 & 4). Custom SMTP di Supabase dashboard cuma fallback kalau hook disabled — bukan primary.

- ❌ `SENDGRID_*`, `POSTMARK_*`, `MAILGUN_*` — boilerplate **Resend-only**. Kalau mau swap provider, edit `src/shared/email/resend-client.ts` + `send-auth-email.tsx`.

- ❌ `NEXTAUTH_*` — boilerplate pakai Supabase Auth, bukan NextAuth. Gak ada variabel ini.

### Yang dibahas di docs lama tapi gak relevan:

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — referensi dari Phase 2 draft lama. **Tidak dipakai** karena Phase 2 finalnya pake LS. Abaikan.

- `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET` — LS credentials **per-user**, stored encrypted di DB bukan env. Gak ada env vars untuk LS di tingkat app.

### Semua yang ADA di codebase:

18 env vars di atas. Itu aja. Kalau ada import `process.env.SOMETHING_ELSE` yang gak di-list di sini, itu bug atau leftover — feedback ke gue.

### Perubahan dari Phase 1 → Phase 2

Env vars yang **baru** di Phase 2:
- `RESEND_API_KEY` — transactional email
- `RESEND_FROM_EMAIL` — sender address
- `SEND_EMAIL_HOOK_SECRET` — Supabase hook HMAC verify

Yang **expanded usage** di Phase 2:
- `NEXT_PUBLIC_APP_URL` — dulu cuma webhook config, sekarang juga email module
- `NEXT_PUBLIC_APP_NAME` / `SHORT_NAME` / `PRIMARY_COLOR` — dipakai juga di email template branding

Env vars yang **gak berubah**:
- Supabase (3), Encryption (1), Branding lainnya

---

## 🔒 Catatan Final

**Phase 2 = pengembangan boilerplate ini SELESAI.** Tidak ada Phase 3. Tidak ada env vars baru yang akan ditambah.

Dokumen ini 1:1 sama codebase per 23 April 2026. Kalau fork & extend sendiri tambah fitur baru, update dokumen fork kamu sendiri.

**End of ENV guide.**