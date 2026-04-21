# 🚀 SETUP GUIDE

Panduan lengkap setup boilerplate ini dari nol sampai running. **Baca pelan-pelan, jangan di-skim.** 90% masalah setup muncul karena skip satu langkah kecil.

> 💡 **Target audience:** developer yang baru pertama kali pakai boilerplate ini. Gak perlu expert Next.js/Supabase — cukup ngerti command line dasar.

---

## 📋 Daftar Isi

- [Overview: Apa yang kita bikin?](#overview-apa-yang-kita-bikin)
- [Prerequisites (yang harus ada sebelum mulai)](#prerequisites)
- [Bagian 1 — Setup Local Project](#bagian-1--setup-local-project)
- [Bagian 2 — Setup Supabase Project](#bagian-2--setup-supabase-project)
- [Bagian 3 — Environment Variables](#bagian-3--environment-variables)
- [Bagian 4 — Setup Database (SQL)](#bagian-4--setup-database-sql)
- [Bagian 5 — Setup Auth Providers](#bagian-5--setup-auth-providers)
  - [5A — Email/Password](#5a--emailpassword-default-sudah-aktif)
  - [5B — Google OAuth](#5b--google-oauth)
  - [5C — Magic Link](#5c--magic-link-email-otp)
- [Bagian 6 — Redirect URLs (WAJIB, sering terlupa)](#bagian-6--redirect-urls-wajib-sering-terlupa)
- [Bagian 7 — SMTP (Email Delivery)](#bagian-7--smtp-email-delivery)
- [Bagian 8 — Seed User (Admin Pertama)](#bagian-8--seed-user-admin-pertama)
- [Bagian 9 — Generate TypeScript Types](#bagian-9--generate-typescript-types)
- [Bagian 10 — Customize Branding & Config](#bagian-10--customize-branding--config)
- [Bagian 11 — Jalanin App!](#bagian-11--jalanin-app)
- [✅ Verification Checklist](#-verification-checklist)
- [🆘 Troubleshooting](#-troubleshooting)
- [📚 Next Steps](#-next-steps)

---

## Overview: Apa yang kita bikin?

Boilerplate ini adalah **foundation untuk aplikasi web modern** dengan:

- ⚡ **Next.js 15** (App Router) + React 19
- 🔐 **Supabase Auth** (Email, Google OAuth, Magic Link)
- 🎭 **Role-based Access Control** (5 role + permission matrix wildcard)
- 🎨 **Tailwind v4** + **shadcn/ui** components
- 🌍 **i18n** built-in (Indonesia & English)
- 🧱 **8 Module system** (Admin, SaaS, Commerce, Blog, dll — toggle on/off)
- 📦 **Config-driven** — ganti `.env` = ganti identitas aplikasi, zero code change
- 💳 **Stripe-ready** (webhook idempotency sudah di-handle)

**Filosofi:** 1 boilerplate, infinite use cases. Cukup toggle module yang dibutuhin, dan boom — jadi aplikasi siap deploy.

---

## Prerequisites

Pastikan semua ini sudah ada **sebelum mulai**:

### Software

| Tool | Versi minimum | Cek dengan |
|------|---------------|------------|
| Node.js | 20.x atau 22.x LTS | `node --version` |
| npm / pnpm / bun | Latest | `npm --version` |
| Git | Latest | `git --version` |
| Code editor | VS Code (recommended) | — |

> ⚠️ **Jangan pakai Node 18** — beberapa dependency butuh Node 20+.

### Akun

- **Supabase** — sign up gratis di [supabase.com](https://supabase.com) (free tier cukup untuk dev)
- **Google Cloud Console** (optional, kalau mau enable Google OAuth) — [console.cloud.google.com](https://console.cloud.google.com)
- **Resend** atau email provider lain (optional, untuk production SMTP)

### Knowledge

- Basic command line (cd, ls, npm install)
- Basic Git (clone, commit, push)
- Familiar dengan React / Next.js (helpful tapi gak wajib)

Kalau semua checked ✅, lanjut ke Bagian 1.

---

## Bagian 1 — Setup Local Project

### 1.1 Clone repository

```bash
git clone <repository-url> my-app
cd my-app
```

Ganti `<repository-url>` dengan URL repo boilerplate kamu.

### 1.2 Install dependencies

Pilih satu package manager (pakai yang sama konsisten):

```bash
# Pakai npm
npm install

# ATAU pakai pnpm (lebih cepat, recommended)
pnpm install

# ATAU pakai bun (tercepat)
bun install
```

> 💡 **Tips:** Kalau muncul warning soal peer dependency, biasanya aman di-ignore. Kalau error `EACCES`, jangan pakai `sudo` — fix permission npm global: [docs.npmjs.com](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally).

### 1.3 Cek struktur folder

Sekilas, struktur yang penting:

```
src/
├── app/              # Next.js App Router (pages)
├── config/           # ⭐ Otak aplikasi — customize di sini
│   ├── app.config.ts        # Module toggles, auth, payment, locale
│   ├── branding.config.ts   # Nama app, logo, warna, meta
│   └── permissions.config.ts # RBAC matrix
├── core/             # Auth, i18n, layout, utils (shared)
├── modules/          # 8 boilerplate modules (admin, saas, dll)
└── components/ui/    # shadcn/ui components
```

Selanjutnya kita setup Supabase dulu, baru balik ke config.

---

## Bagian 2 — Setup Supabase Project

### 2.1 Bikin project baru

1. Login ke [supabase.com/dashboard](https://supabase.com/dashboard)
2. Klik **New project**
3. Isi:
   - **Name:** nama project kamu (misal `my-app-dev`)
   - **Database Password:** **GENERATE & SIMPAN** password ini ke password manager. Kalau lupa, gak bisa di-recover (harus reset).
   - **Region:** pilih yang paling dekat sama user kamu (misal Singapore untuk user Indonesia)
   - **Pricing Plan:** Free (untuk dev)
4. Klik **Create new project** → tunggu ~2 menit sampai "Setting up project" selesai.

### 2.2 Ambil credentials

Setelah project ready, kamu butuh 3 value:

1. **Project URL** & **Anon Key**:
   - Sidebar → **Project Settings** (ikon gear) → **API**
   - Copy:
     - `Project URL` (misal `https://abcdefghij.supabase.co`)
     - `anon` `public` key (JWT panjang — yang public-safe, bukan service_role)

2. **Service Role Key** (untuk seed script):
   - Di halaman yang sama, scroll ke **Project API keys**
   - Klik **Reveal** di baris `service_role`
   - Copy key-nya
   - ⚠️ **JANGAN COMMIT INI KE GIT** — ini bisa bypass semua security. Hanya dipakai di server-side atau local script.

3. **Project Ref** (untuk generate types nanti):
   - Dari Project URL, ambil subdomain-nya. Misal URL `https://abcdefghij.supabase.co` → project ref-nya `abcdefghij`.
   - Atau: **Project Settings** → **General** → **Reference ID**.

**Simpan 3 value ini sementara di notepad** — kita pakai di step berikutnya.

---

## Bagian 3 — Environment Variables

### 3.1 Bikin file `.env.local`

Di root project (sejajar dengan `package.json`), bikin file baru bernama `.env.local`:

```bash
# macOS / Linux
touch .env.local

# Windows (PowerShell)
New-Item .env.local
```

### 3.2 Isi dengan template ini

Buka `.env.local` di editor, paste template ini, ganti value-nya sama hasil Bagian 2.2:

```bash
# ============================================================
# SUPABASE (wajib)
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# BRANDING (optional — default ada, ganti sesuai app kamu)
# ============================================================
NEXT_PUBLIC_APP_NAME="My App"
NEXT_PUBLIC_APP_SHORT_NAME="App"
NEXT_PUBLIC_APP_DESCRIPTION="A modern web application"
NEXT_PUBLIC_APP_TAGLINE="Welcome"
NEXT_PUBLIC_APP_PRIMARY_COLOR="#16a34a"
NEXT_PUBLIC_APP_KEYWORDS="app,web,platform"
NEXT_PUBLIC_APP_AUTHOR="Your Name"
NEXT_PUBLIC_APP_CATEGORY="productivity"
```

> 💡 **Kenapa dua Supabase key?**
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — aman di-expose ke browser, dipakai client-side dengan RLS protection
> - `SUPABASE_SERVICE_ROLE_KEY` — **bypass RLS**, hanya untuk server/script. TIDAK boleh ke browser.

### 3.3 Pastikan `.env.local` masuk `.gitignore`

Cek file `.gitignore` — harus ada line `.env*.local` atau `.env.local`. Kalau belum, tambahin:

```gitignore
# env files
.env*.local
.env.local
```

**Commit perubahan `.gitignore` SEBELUM commit `.env.local`** — biar `.env.local` gak ikut ke-push.

---

## Bagian 4 — Setup Database (SQL)

Kita punya 2 file SQL yang berbeda tujuan:

| File | Kapan Dipakai | Efek |
|------|---------------|------|
| **`setup.sql`** | Setup pertama kali di fresh project, ATAU update ke project existing yang udah ada data | ✅ Non-destructive, aman di-run berkali-kali |
| **`nuclear-setup.sql`** | Reset total environment dev, atau kalau mau mulai dari nol | ⚠️ **HAPUS SEMUA DATA** di tabel `user_profiles`, `activity_logs`, `stripe_events` |

### 4.1 Pilih file yang tepat

- **Pertama kali setup / fresh Supabase project?** → pakai `setup.sql`
- **Mau reset total data dev?** → pakai `nuclear-setup.sql`
- **Ragu-ragu?** → pakai `setup.sql` (aman)

### 4.2 Jalanin SQL

1. Di Supabase Dashboard, buka sidebar → **SQL Editor**
2. Klik **+ New query**
3. Buka file `setup.sql` (atau `nuclear-setup.sql`) di editor local, **copy semua isinya**
4. Paste ke SQL Editor Supabase
5. Klik tombol **Run** (atau `Ctrl/Cmd + Enter`)
6. Tunggu beberapa detik, lihat output di bawah

### 4.3 Cek output

Kalau sukses, di output harus muncul:

```
NOTICE:  ====================================================
NOTICE:    SETUP COMPLETE
NOTICE:  ====================================================
NOTICE:    user_profiles   : 0 rows
NOTICE:      └─ admins     : 0
NOTICE:    activity_logs   : 0 rows
NOTICE:    stripe_events   : 0 rows
NOTICE:    avatars bucket  : ready ✓
NOTICE:  ====================================================
```

Semua 0 itu normal — DB baru emang kosong. Yang penting `avatars bucket: ready ✓`.

### 4.4 Verifikasi visual

1. Sidebar → **Database** → **Tables** → harus muncul: `user_profiles`, `activity_logs`, `stripe_events`
2. Sidebar → **Storage** → harus muncul bucket `avatars`
3. Sidebar → **Authentication** → **Policies** → harus ada banyak policy untuk 3 tabel di atas

Kalau ada yang missing, lihat [Troubleshooting](#-troubleshooting).

---

## Bagian 5 — Setup Auth Providers

Default-nya cuma Email/Password yang aktif. Untuk Google OAuth + Magic Link, ada setup tambahan.

### 5A — Email/Password (default, sudah aktif)

1. Sidebar → **Authentication** → **Providers**
2. Cari **Email** → pastikan status **Enabled** ✅
3. Setting yang perlu diperhatikan:
   - **Confirm email**
     - Dev: **nonaktifkan** biar cepet testing
     - Production: **aktifkan**
   - **Secure email change** — aktifkan di production
   - **Secure password change** — aktifkan di production
4. Klik **Save** kalau ada perubahan

**Udah selesai.** Email/Password siap pakai.

---

### 5B — Google OAuth

Skip section ini kalau belum mau enable Google login. Bisa tambah nanti.

#### Step 1: Setup di Google Cloud Console

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. **Create project** (atau pilih existing):
   - Klik dropdown project di atas → **New Project**
   - Name: terserah (misal `my-app-auth`)
   - Klik **Create** → tunggu selesai → pilih project-nya
3. Sidebar → **APIs & Services** → **OAuth consent screen**
   - **User Type:** External → **Create**
   - Isi form:
     - **App name:** nama aplikasi (tampil di consent dialog "Sign in to [App Name]")
     - **User support email:** email kamu
     - **Developer contact:** email kamu
   - **Save and continue** → skip **Scopes** → **Save and continue** → di **Test users** bisa add email tester kalau masih mode dev → **Save and continue** → **Back to dashboard**
4. Sidebar → **APIs & Services** → **Credentials**
   - Klik **+ Create credentials** → **OAuth client ID**
   - **Application type:** Web application
   - **Name:** bebas (misal `Supabase Auth`)
   - **Authorized JavaScript origins** (klik **Add URI** untuk tiap entry):
     ```
     http://localhost:3000
     https://your-production-domain.com
     ```
   - **Authorized redirect URIs** (🚨 **INI YANG SERING SALAH**):
     ```
     https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
     ```
     Ganti `<YOUR_PROJECT_REF>` dengan project ref yang udah kamu simpan di Bagian 2.2. Contoh: `https://abcdefghij.supabase.co/auth/v1/callback`.
   - Klik **Create**
   - Muncul modal dengan **Client ID** dan **Client Secret** — **copy dua-duanya, simpan sementara**

#### Step 2: Setup di Supabase

1. Supabase Dashboard → **Authentication** → **Providers**
2. Cari **Google** → klik untuk expand
3. Toggle **Enabled** → ON
4. Paste:
   - **Client ID** (dari Google)
   - **Client Secret** (dari Google)
5. **Save**

#### Step 3: Pastikan provider aktif di boilerplate

Buka `src/config/app.config.ts`, di bagian `auth.providers` pastikan `"google"` ada:

```ts
providers: ["email", "google", "magic-link"] as const,
```

Kalau mau disable Google nanti, tinggal hapus dari array ini. Boilerplate otomatis hide tombolnya.

---

### 5C — Magic Link (email OTP)

Magic Link = login via link yang dikirim ke email, tanpa password.

**Default sudah aktif** kalau Email provider enabled. Yang perlu dipastikan:
- Redirect URL udah di-setup (Bagian 6, next)
- Template email (optional customization)

**Custom email template (opsional):**

1. Supabase Dashboard → **Authentication** → **Email Templates** → **Magic Link**
2. Customize Subject & Body. Available variables:
   - `{{ .ConfirmationURL }}` — link magic login
   - `{{ .Email }}` — email user
   - `{{ .Data }}` — metadata custom kalau ada
3. **Save**

Contoh custom subject: `Login to {{ .SiteURL }}`

**Pastikan di `app.config.ts`** provider `"magic-link"` ada di array:

```ts
providers: ["email", "google", "magic-link"] as const,
```

---

## Bagian 6 — Redirect URLs (WAJIB, sering terlupa)

🚨 **Ini krusial.** Kalau lupa setup, OAuth dan Magic Link akan fail dengan error:

> `Redirect URL not allowed`

### 6.1 Buka konfigurasi

Supabase Dashboard → **Authentication** → **URL Configuration**

### 6.2 Setting yang perlu diisi

**Site URL:**
- Isi URL production kamu (misal `https://my-app.vercel.app`)
- Ini default redirect kalau gak di-override
- Kalau belum deploy, isi `http://localhost:3000` dulu — ganti nanti setelah deploy

**Redirect URLs** (tambah satu per baris, klik **Add URL** untuk tiap entry):

```
http://localhost:3000/api/auth/callback
http://localhost:3000/**
https://your-production-domain.com/api/auth/callback
https://your-production-domain.com/**
https://*-your-vercel-username.vercel.app/**
```

### 6.3 Penjelasan

| URL Pattern | Fungsi |
|-------------|--------|
| `/api/auth/callback` | Endpoint tempat Supabase redirect setelah OAuth/Magic Link sukses |
| `/**` | Wildcard — allow semua path di domain (biar `returnTo` flow jalan) |
| `https://*-username.vercel.app/**` | Wildcard untuk Vercel preview deployments (tiap PR dapat URL unik) |

### 6.4 Save

Klik **Save**. **Tunggu ~1 menit** propagasi sebelum testing.

---

## Bagian 7 — SMTP (Email Delivery)

Default Supabase SMTP punya **limit ~3 email/jam** dan deliverability rendah (banyak masuk spam). Cukup untuk dev, tidak cocok untuk production.

### 7.1 Untuk Development (skip setup)

Default SMTP cukup. Magic link email mungkin masuk **Spam folder** — normal untuk dev.

💡 **Tips dev:** kalau email gak sampe, cek folder Spam/Junk dulu sebelum assume broken.

### 7.2 Untuk Production (wajib setup custom SMTP)

Pilih email provider. Rekomendasi berdasarkan kemudahan:

#### Option A — Resend (termudah, recommended)

1. Daftar di [resend.com](https://resend.com)
2. **Domains** → **Add Domain** → input domain kamu (misal `yourdomain.com`)
3. Resend kasih DNS records (SPF, DKIM, DMARC) yang harus kamu tambah di DNS provider (Cloudflare, Namecheap, dll)
4. Tunggu DNS propagasi (bisa 5 menit – 24 jam), status harus **Verified** ✅
5. **API Keys** → **Create API Key** → beri nama (misal `supabase-smtp`) → copy key-nya
6. Kembali ke Supabase: **Project Settings** → **Auth** → scroll ke **SMTP Settings**:
   - Toggle **Enable Custom SMTP**
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** paste API key Resend
   - **Sender email:** email dari verified domain (misal `no-reply@yourdomain.com`)
   - **Sender name:** nama aplikasi kamu
7. **Save**
8. Test: coba sign up / magic link di app production → cek email masuk inbox (bukan spam)

#### Option B — Provider lain

Konsep sama untuk **SendGrid, Mailgun, Postmark, AWS SES**:
1. Verify domain (DNS records)
2. Get SMTP credentials
3. Paste ke Supabase SMTP Settings

Masing-masing punya dokumentasi specific. Googling `<provider> smtp supabase` akan dapet tutorial step-by-step.

---

## Bagian 8 — Seed User (Admin Pertama)

Setelah DB migration jalan, tabel `user_profiles` masih kosong. Kita butuh admin user untuk login dan akses `/admin`.

### 8.1 Pilih cara

| Cara | Kapan Dipakai |
|------|---------------|
| **A. Pakai seed script** (recommended) | Setup dev dengan 5 user test untuk semua role |
| **B. Sign up manual + elevate** | Production atau kalau mau cuma 1 admin custom |

### 8.2 Cara A: Pakai `seed.js`

Seed script kita bikin 5 user — satu per role — untuk testing permission system lengkap.

#### Step 1: Pastikan `seed.js` ada

File-nya di folder `scripts/` (atau tempatkan di mana aja, path bisa disesuaikan). Pastikan `.env.local` kamu punya `SUPABASE_SERVICE_ROLE_KEY`.

#### Step 2: Install `dotenv` (kalau belum)

```bash
npm install --save-dev dotenv
# atau
pnpm add -D dotenv
```

#### Step 3: Jalanin seed

```bash
node scripts/seed.js
```

Output yang diharapkan:

```
🚀 SEED USERS — Boilerplate
=============================================
📋 Target: 5 user
🎯 Supabase: https://abcdefghij.supabase.co

📝 Super Admin <superadmin@example.com> (super_admin)
   🔐 Create auth user...
   ✅ Auth user created: <uuid>
   👑 Role di-set: super_admin
   ✅ DONE

... (4 user lagi)

=============================================
📊 HASIL
=============================================

✅ Created  : 5
   ✅ Super Admin <superadmin@example.com> [super_admin]
   ... dst

=============================================
🔑 LOGIN CREDENTIALS
=============================================

👤 Super Admin [super_admin]
   Email    : superadmin@example.com
   Password : SuperAdmin@2026

... dst
```

#### Step 4: Catat credentials

**Default password semua user di seed.js ada di file itu.** Simpan ke password manager atau 1Password dev vault.

⚠️ **GANTI password** setelah login pertama. Atau minimal: edit `seed.js` ganti default password sebelum jalanin.

### 8.3 Cara B: Sign up manual + elevate

Kalau gak mau 5 user, cukup 1 admin:

#### Step 1: Sign up

Pilih salah satu:
- **Via app:** jalanin `npm run dev` → buka `http://localhost:3000/login` → sign up (kalau provider Email enabled)
- **Via Supabase Dashboard:** **Authentication** → **Users** → **Add user** → **Create new user** → isi email + password + centang **Auto Confirm Email** → **Create user**

Trigger `handle_new_user()` otomatis bikin row di `user_profiles` dengan role `user`.

#### Step 2: Elevate ke super_admin

Supabase Dashboard → **SQL Editor** → jalanin:

```sql
UPDATE public.user_profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, email, role, is_active FROM public.user_profiles;
```

Harus muncul user kamu dengan `role = 'super_admin'`. Sekarang login → auto redirect ke `/admin`.

---

## Bagian 9 — Generate TypeScript Types

Setelah DB schema ready, generate TypeScript types biar TypeScript bisa auto-complete & type-check DB call.

### 9.1 Install Supabase CLI (kalau belum)

```bash
# Install sebagai dev dependency project (recommended)
npm install --save-dev supabase

# Atau global
npm install -g supabase
```

### 9.2 Login (kalau global)

```bash
npx supabase login
```

Browser akan kebuka → login ke Supabase → return ke terminal.

### 9.3 Generate types

```bash
npx supabase gen types typescript \
  --project-id <YOUR_PROJECT_REF> \
  > src/core/types/database.ts
```

Ganti `<YOUR_PROJECT_REF>` dengan project ref kamu (yang di Bagian 2.2).

**Example:**

```bash
npx supabase gen types typescript \
  --project-id abcdefghij \
  > src/core/types/database.ts
```

File `src/core/types/database.ts` akan ter-overwrite dengan types yang reflect schema DB terbaru.

> 💡 **Kapan perlu re-generate?** Setiap kali ubah schema DB (add column, new table, dll). Bikin habit: setiap habis jalanin migration, generate ulang types.

---

## Bagian 10 — Customize Branding & Config

Sekarang saatnya **adapt boilerplate ke aplikasi kamu**.

### 10.1 Branding (`src/config/branding.config.ts`)

Paling mudah: override via `.env.local` (yang udah kita isi di Bagian 3.2). Semua field di `brandingConfig` bisa di-override via env.

Kalau mau hardcode (tidak recommend untuk multi-environment):

```ts
// src/config/branding.config.ts
export const brandingConfig = {
  name: "Acme Corp",
  shortName: "Acme",
  description: "The best tool ever",
  // ...
};
```

### 10.2 Module Toggles (`src/config/app.config.ts`)

Enable/disable modules sesuai kebutuhan app:

```ts
modules: {
  admin:    { enabled: true,  path: "/admin" },     // ✅ biasanya always on
  saas:     { enabled: false, path: "/workspace" }, // SaaS workspace
  landing:  { enabled: false, path: "/" },          // Public landing page
  commerce: { enabled: false, path: "/shop" },      // E-commerce
  blog:     { enabled: false, path: "/blog" },      // Blog/CMS
  project:  { enabled: false, path: "/projects" },  // Project mgmt
  forum:    { enabled: false, path: "/forum" },     // Community
  chat:     { enabled: false, path: "/chat" },      // Real-time chat
},
```

> 💡 **Phase 1 (current):** cuma `admin` yang udah full implementation. Module lain masih skeleton (module.config.ts aja). Phase 2/3 akan isi sesuai roadmap.

### 10.3 Auth Providers (`src/config/app.config.ts`)

Aktifkan provider yang kamu setup:

```ts
auth: {
  providers: ["email", "google", "magic-link"] as const,
  // Hapus yang belum di-setup:
  // providers: ["email"] as const, // kalau belum setup Google/MagicLink
}
```

### 10.4 Permissions (`src/config/permissions.config.ts`)

Matrix RBAC. Edit kalau butuh permission baru:

```ts
export const permissionMatrix = {
  super_admin: ["*"],                                      // bisa semua
  admin:       ["admin:access", "users:*", "content:*"],   // admin panel + user/content mgmt
  editor:      ["content:read", "content:write", "users:read"],
  viewer:      ["content:read", "users:read"],
  user:        ["profile:read", "profile:write"],
};
```

Pakai di code:

```tsx
import { usePermission } from "@/core/auth/hooks";

const canEdit = usePermission("content:write");
if (!canEdit) return <Forbidden />;
```

### 10.5 Locale (`src/config/app.config.ts` + `src/core/i18n/locales/`)

Default support `id` & `en`. Edit JSON files di `src/core/i18n/locales/` untuk customize copy.

Ganti default locale:

```ts
locale: {
  default: "en",              // ganti dari "id"
  available: ["id", "en"] as const,
}
```

### 10.6 Assets branding

Replace file di `public/branding/`:
- `logo.png` — logo full (192x192 recommended)
- `logo-sm.png` — logo small (96x96)
- `favicon.ico`
- `apple-touch-icon.png` (180x180)

---

## Bagian 11 — Jalanin App!

Setelah semua di atas selesai:

```bash
npm run dev
# atau
pnpm dev
# atau
bun dev
```

Buka `http://localhost:3000` — harusnya redirect ke `/login`.

Login pakai credentials dari seed (misal `superadmin@example.com` / `SuperAdmin@2026`) → masuk dashboard → kalau role `super_admin` atau `admin`, auto-redirect ke `/admin`.

**Test feature:**
- ✅ Login via Email/Password
- ✅ Login via Google (kalau di-setup)
- ✅ Login via Magic Link (cek email)
- ✅ Logout (button di UserMenu kanan atas)
- ✅ Role-based access: user role `user` → akses `/admin` harus redirect
- ✅ Locale switch (kalau diimplementasi di UI)

---

## ✅ Verification Checklist

Cek satu per satu biar yakin semua bener:

### Local Setup
- [ ] Node.js 20+ terinstall (`node --version`)
- [ ] `npm install` berhasil tanpa error fatal
- [ ] `.env.local` ada & berisi 3 Supabase env var
- [ ] `.env.local` ada di `.gitignore`

### Supabase
- [ ] Project Supabase created & running
- [ ] Project URL & Anon Key udah di-copy
- [ ] Service Role Key udah di-copy (untuk seed)
- [ ] SQL migration (`setup.sql`) udah jalan, sanity check NOTICE muncul
- [ ] Tabel `user_profiles`, `activity_logs`, `stripe_events` visible di Database → Tables
- [ ] Storage bucket `avatars` visible di Storage
- [ ] RLS policies aktif di semua 3 tabel

### Auth Providers
- [ ] Email provider enabled
- [ ] (Optional) Google OAuth: Client ID & Secret di-paste, redirect URI match `<ref>.supabase.co/auth/v1/callback`
- [ ] (Optional) Magic Link provider enabled (otomatis kalau Email enabled)

### Redirect URLs
- [ ] `Site URL` di-set
- [ ] `Redirect URLs` include `http://localhost:3000/api/auth/callback` + wildcard `/**`
- [ ] (Production) Redirect URLs include domain production + Vercel preview wildcard

### User
- [ ] Seed script jalan, atau minimal 1 admin manual
- [ ] Bisa login dengan credentials admin
- [ ] Admin user redirect ke `/admin` setelah login

### App
- [ ] `npm run dev` jalan tanpa error
- [ ] Login page load dengan benar (logo, tombol provider sesuai config)
- [ ] Bisa login → masuk dashboard
- [ ] TypeScript gak ada error (`npx tsc --noEmit`)

Kalau semua ✅, setup selesai. 🎉

---

## 🆘 Troubleshooting

### "Missing environment variable" saat `npm run dev`

**Penyebab:** `.env.local` belum dibaca atau typo nama var.

**Fix:**
- Pastikan file bernama persis `.env.local` (bukan `.env` doang, bukan `env.local`)
- Restart dev server — Next.js baca env saat startup
- Cek typo nama var — harus `NEXT_PUBLIC_SUPABASE_URL` bukan `NEXT_PUBLIC_SUPABASE_URL_` dll

### "Redirect URL not allowed" saat OAuth / Magic Link

**Penyebab:** URL callback belum di-whitelist di Supabase.

**Fix:**
- Bagian 6 — pastikan `http://localhost:3000/api/auth/callback` dan `http://localhost:3000/**` udah ada di **Redirect URLs**
- Tunggu ~1 menit propagasi
- Hard refresh browser (Cmd/Ctrl + Shift + R)

### "Invalid login credentials" padahal password bener

**Penyebab:**
- Email belum confirmed (kalau "Confirm email" aktif di provider)
- User gak ada di `user_profiles` (padahal di `auth.users` ada)
- User `is_active = false`

**Fix:**
```sql
-- Cek di SQL Editor
SELECT u.id, u.email, u.email_confirmed_at, p.role, p.is_active
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE u.email = 'your-email@example.com';
```

- Kalau `email_confirmed_at` NULL → confirm manual: **Authentication** → **Users** → klik user → **Confirm email**
- Kalau `p.role` NULL → profile gak ke-create (trigger fail?) → re-run seed atau insert manual
- Kalau `is_active = false` → activate:
  ```sql
  UPDATE public.user_profiles SET is_active = true WHERE email = 'your-email@example.com';
  ```

### Google OAuth redirect ke Supabase tapi error "redirect_uri_mismatch"

**Penyebab:** Authorized redirect URI di Google Console gak match.

**Fix:**
- Buka Google Cloud Console → **Credentials** → edit OAuth client
- **Authorized redirect URIs** harus persis: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
- Tanpa trailing slash, https (bukan http), ref project bener
- Save → tunggu ~5 menit propagasi Google

### Magic Link email gak sampe

**Penyebab & Fix:**
1. Cek folder **Spam/Junk** — default Supabase SMTP sering masuk spam
2. Cek rate limit — default ~3 email/jam. Tunggu atau setup custom SMTP (Bagian 7)
3. Email salah ketik — cek log di **Authentication** → **Logs**

### "foreign key violation" saat seed

**Penyebab:** trigger `handle_new_user()` gak jalan, jadi `user_profiles` row gak ke-create saat auth user dibuat.

**Fix:**
```sql
-- Re-create trigger (udah include di nuclear-setup.sql)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### TypeScript error setelah `supabase gen types`

**Penyebab:** schema DB gak match types yang di-generate.

**Fix:**
- Pastikan SQL migration udah jalan lengkap sampai NOTICE sanity check muncul
- Re-run `supabase gen types` command
- Restart TS server di VS Code: `Cmd/Ctrl + Shift + P` → **TypeScript: Restart TS Server**

### "Module not found: @/config"

**Penyebab:** path alias `@/*` gak ke-set di `tsconfig.json`.

**Fix:** cek `tsconfig.json` ada:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### App build gagal di Vercel tapi local OK

**Penyebab paling umum:**
1. **Env var belum di-set di Vercel** — Settings → Environment Variables → add semua yang ada di `.env.local`
2. **Build command salah** — harus `npm run build` atau `next build`
3. **Node version** — set di Vercel Settings → General → Node.js Version → `20.x`

---

## 📚 Next Steps

Setup selesai? Berikut rekomendasi lanjutan:

### Development
- 📖 **Baca arsitektur:** pelajari `src/core/` dan `src/modules/` — ngerti separation of concern-nya
- 🧪 **Setup testing:** Vitest + React Testing Library (belum include di boilerplate)
- 🎨 **Customize theme:** edit CSS variables di `src/app/globals.css` untuk dark mode / palette

### Production Deploy
- 🚀 **Deploy ke Vercel:** paling mudah untuk Next.js — [vercel.com/docs/frameworks/nextjs](https://vercel.com/docs/frameworks/nextjs)
- 🔐 **Security checklist:**
  - [ ] Email confirmation aktif
  - [ ] Custom SMTP setup (bukan default Supabase)
  - [ ] Rate limiting di Supabase Auth
  - [ ] Review RLS policies untuk tabel custom
- 📊 **Monitoring:** Sentry untuk error tracking, PostHog untuk analytics

### Extend Boilerplate
- ➕ **Aktifkan module:** edit `app.config.ts`, enable module yang dibutuhin, implement content-nya
- 🧩 **Bikin module custom:** follow pattern di `src/modules/admin/` — `module.config.ts` + `index.ts` dulu, lanjut `components/`, `services/`, `migrations/`
- 💳 **Setup Stripe:** kalau enable payment, follow docs Stripe untuk webhook → pakai `stripe_events` table yang udah ada untuk idempotency

---

## 🙋 Butuh Bantuan?

- 📄 Cek file `setup.sql`, `nuclear-setup.sql`, `seed.js` — comment di dalamnya cukup detail
- 🐛 Error yang nggak ada di Troubleshooting? Cek Supabase Logs: **Logs** → **Postgres Logs** / **Auth Logs**
- 💬 Tanya di channel team kamu — jangan malu bertanya, setup Supabase memang tricky di awal

---

**Selamat coding! 🎉**

> _"The best boilerplate is the one you actually understand."_
> — every frustrated developer ever