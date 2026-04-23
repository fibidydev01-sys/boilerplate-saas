# PaaS Add-on: Phase 0 + Phase 1

Full implementation dari arsitektur final yang direncanakan. Ini **bukan** replacement untuk project, tapi **additive patch** yang perlu di-merge.

## Isi Package

- **Phase 0**: Signup flow (register, forgot password, reset password) + DB trigger `handle_new_user`
- **Phase 1**: Commerce backend (Lemon Squeezy credentials + products) — server-side only, no UI

Phase 2 (UI) **tidak di-include** sesuai request. Kamu tinggal bikin page/component yang consume endpoint `/api/commerce/*`.

---

## Langkah Install

### 1. Extract & Merge Files

Extract ZIP ini di root project. Ada 2 folder utama:

```
supabase/migrations/   → tambah ke supabase migrations kamu
src/                   → overwrite file existing (merge manual utk yang modified)
.env.example           → gabung ke .env.example kamu
```

**File NEW** (tinggal copy):

```
src/app/(auth)/register/page.tsx
src/app/(auth)/forgot-password/page.tsx
src/app/(auth)/reset-password/page.tsx
src/app/api/commerce/credentials/route.ts
src/app/api/commerce/products/route.ts
src/core/auth/components/register-form.tsx
src/core/auth/components/forgot-password-form.tsx
src/core/auth/components/reset-password-form.tsx
src/core/auth/components/providers/email-password-register-form.tsx
src/core/lib/encryption.ts
src/modules/commerce/types.ts
src/modules/commerce/lib/ls-client.ts
src/modules/commerce/services/credentials.service.ts
src/modules/commerce/services/products.service.ts
src/modules/commerce/services/index.ts
src/modules/commerce/migrations/001_commerce_credentials.sql
supabase/migrations/000_handle_new_user.sql
supabase/migrations/001_commerce_credentials.sql
```

**File MODIFIED** (overwrite OK, tapi review dulu kalau ada local changes):

```
src/config/app.config.ts                    → tambah 3 field auth + enable commerce
src/core/constants/routes.ts                → tambah 5 route constants
src/core/lib/validators.ts                  → tambah 4 schema baru
src/core/i18n/locales/id.json               → tambah ~60 keys
src/core/i18n/locales/en.json               → tambah ~60 keys
src/core/auth/components/login-form.tsx     → tambah link register/forgot
src/core/auth/components/providers/magic-link-form.tsx → config-driven shouldCreateUser
src/core/auth/components/providers/index.ts → export register form
src/core/auth/components/index.ts           → export new components
src/core/auth/index.ts                      → barrel update
src/core/types/database.ts                  → tambah commerce_credentials table def
src/core/types/index.ts                     → export commerce types
src/modules/commerce/index.ts               → export types & services config
src/modules/commerce/module.config.ts       → enable + tambah provider field
src/proxy.ts                                → tambah public routes
```

---

### 2. Generate ENCRYPTION_KEY

Di terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy output, paste ke `.env.local`:

```
ENCRYPTION_KEY=<hasil_generate>
```

**⚠️ PENTING:**
- Simpan backup key-nya di secret manager.
- Kalau key hilang, semua encrypted credential **locked permanently**.
- Jangan rotate key tanpa re-encrypt row.

---

### 3. Apply Database Migrations

Via Supabase CLI:

```bash
supabase db push
```

Atau manual via Supabase Dashboard → SQL Editor, run file ini berurutan:

1. `supabase/migrations/000_handle_new_user.sql`
2. `supabase/migrations/001_commerce_credentials.sql`

**Verify:**
- Trigger `on_auth_user_created` ada di `auth.users`
- Table `public.commerce_credentials` ada dengan RLS enabled
- 4 policies aktif (select/insert/update/delete — semua by owner)

---

### 4. Supabase Dashboard Settings

Login ke Supabase Dashboard → project kamu → Authentication:

**a) Email provider:**
- Authentication → Providers → Email
- **"Confirm email"** — harus MATCH dengan `appConfig.auth.requireEmailVerification`
  - Default plan: OFF (PaaS mode, zero friction)
  - Kalau kamu pengen verify email: ON

**b) URL Configuration:**
- Authentication → URL Configuration
- **Site URL**: URL production kamu (atau `http://localhost:3000` untuk dev)
- **Redirect URLs**: tambah ini ke allowlist:
  ```
  http://localhost:3000/api/auth/callback
  http://localhost:3000/reset-password
  https://yourdomain.com/api/auth/callback
  https://yourdomain.com/reset-password
  ```

**c) Email templates (optional):**
- Authentication → Email Templates → "Reset Password"
- Pastikan link-nya redirect ke `{{ .SiteURL }}/reset-password`

---

### 5. Test Checklist

**Phase 0 (Auth):**
- [ ] Signup via email+password → auto-create profile di `user_profiles`
- [ ] Signup via magic link → auto-create profile
- [ ] Signup via Google OAuth → auto-create profile (verify `full_name` terisi dari Google)
- [ ] Forgot password → cek email → klik link → reset password → auto-login
- [ ] Login gagal dengan email yang belum signup (kalau magicLinkMode = "login-only")
- [ ] `/register` redirect ke `/login` kalau `allowPublicSignup = false`

**Phase 1 (Commerce backend):**
- [ ] `POST /api/commerce/credentials` dengan API key valid → 200 + status connected
- [ ] `POST /api/commerce/credentials` dengan API key invalid → 400 + `invalid_credentials`
- [ ] `GET /api/commerce/credentials` → status (cuma return `key_hint`, bukan plaintext)
- [ ] `GET /api/commerce/products` (connected) → return products
- [ ] `GET /api/commerce/products` (not connected) → 409 + `not_connected`
- [ ] `DELETE /api/commerce/credentials` → 200, row terhapus
- [ ] RLS test: login sebagai user A → query `commerce_credentials` → cuma lihat row sendiri

**Encryption roundtrip:**
```bash
# Di node REPL atau script sementara:
import { encrypt, decrypt } from "./src/core/lib/encryption";
const enc = encrypt("test-key-123");
console.log(decrypt(enc)); // should print "test-key-123"
```

---

## API Contract

### `POST /api/commerce/credentials`

Request:
```json
{
  "apiKey": "eyJ0eXAiOi...",
  "isTestMode": false
}
```

Response 200:
```json
{
  "status": {
    "connected": true,
    "keyHint": "********xyz9",
    "storeId": "12345",
    "storeName": "My Store",
    "isTestMode": false,
    "lastVerifiedAt": "2026-04-22T07:30:00.000Z"
  }
}
```

Error codes: `invalid_credentials` (400), `forbidden` (403), `rate_limited` (429), `network_error` (502), `save_failed` (500), `validation_failed` (400).

### `GET /api/commerce/credentials`

Response 200:
```json
{
  "status": {
    "connected": false,
    "keyHint": null,
    "storeId": null,
    "storeName": null,
    "isTestMode": false,
    "lastVerifiedAt": null
  }
}
```

### `DELETE /api/commerce/credentials`

Response 200: `{ "success": true }`

### `GET /api/commerce/products`

Response 200:
```json
{
  "products": [
    {
      "id": "1",
      "name": "Product Name",
      "slug": "product-name",
      "description": "...",
      "status": "published",
      "statusLabel": "Published",
      "thumbUrl": "https://...",
      "largeThumbUrl": "https://...",
      "price": 1999,
      "priceFormatted": "$19.99",
      "fromPrice": null,
      "toPrice": null,
      "buyNowUrl": "https://...",
      "variants": [
        {
          "id": "11",
          "name": "Default",
          "slug": "default",
          "price": 1999,
          "isSubscription": false,
          "interval": null,
          "intervalCount": null,
          "status": "published",
          "statusLabel": "Published",
          "sort": 0
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

Error codes: `not_connected` (409), `invalid_credentials` (401), `forbidden` (403), `rate_limited` (429), `decrypt_failed` (500), `network_error` (502).

---

## Phase 2 Integration Hints (nanti)

Untuk bikin UI nanti, tinggal panggil endpoint di atas dari client component:

```tsx
// Connect form
const res = await fetch("/api/commerce/credentials", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apiKey, isTestMode }),
});

// List products
const res = await fetch("/api/commerce/products");
const { products } = await res.json();
```

i18n keys untuk commerce UI udah ada di `id.json` / `en.json` namespace `commerce.*`.

---

## Troubleshooting

**Trigger `handle_new_user` fail:**
- Cek Postgres logs di Supabase Dashboard → Logs
- Pastikan column di `user_profiles` match (full_name, email, role, is_active)
- Kalau `user_profiles.role` punya CHECK constraint yang strict, default `'user'` harus masuk

**Decrypt fail:**
- Pastikan `ENCRYPTION_KEY` di env sama dengan waktu encrypt
- Kalau salah key, user harus disconnect & reconnect (row ter-encrypt pake key lama jadi garbage)

**LS API 401:**
- API key salah atau revoked
- Cek di Lemon Squeezy Dashboard → Settings → API

**RLS blocking query:**
- Pastikan user session ada (cek `supabase.auth.getUser()`)
- Query lewat server client, bukan service_role, supaya RLS kena evaluate

---

Bikin issue atau lanjut ke Phase 2 UI kalau udah siap.
