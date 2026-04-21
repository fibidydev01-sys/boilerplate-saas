# 🚀 OPERATIONS RUNBOOK — Phase 1 Boilerplate

> **Panduan operasional lengkap untuk deploy & jalanin boilerplate ini.**
> Dokumen ini di luar kode — cover semua aspek non-coding biar project bisa running di local development sampai production.

---

## 📑 Daftar Isi

1. [Prerequisites](#1-prerequisites)
2. [Setup Supabase Project](#2-setup-supabase-project)
3. [Local Development Setup](#3-local-development-setup)
4. [Deploy ke Production (Vercel)](#4-deploy-ke-production-vercel)
5. [Deploy Alternatif (Non-Vercel)](#5-deploy-alternatif-non-vercel)
6. [Post-Deploy Verification](#6-post-deploy-verification)
7. [Operational Tasks](#7-operational-tasks)
8. [Troubleshooting](#8-troubleshooting)
9. [Environment Variables Reference](#9-environment-variables-reference)

---

## 1. Prerequisites

Tools & accounts yang wajib ada sebelum mulai:

### 1.1 Software

| Tool | Versi minimum | Cek versi | Download |
|---|---|---|---|
| Node.js | 20.x LTS | `node -v` | [nodejs.org](https://nodejs.org) |
| npm | 10.x | `npm -v` | (bundled dengan Node) |
| Git | 2.30+ | `git --version` | [git-scm.com](https://git-scm.com) |

**Verifikasi cepat:**
```bash
node -v    # harus v20.x.x atau lebih tinggi
npm -v     # harus 10.x.x
git --version
```

Kalau pakai Windows, disarankan install via [nvm-windows](https://github.com/coreybutler/nvm-windows) biar bisa switch versi. Di macOS/Linux pakai [nvm](https://github.com/nvm-sh/nvm).

### 1.2 Accounts

Wajib daftar (semua free untuk development):

| Service | Guna | Link daftar |
|---|---|---|
| **Supabase** | Database + Auth + Storage | [supabase.com/dashboard](https://supabase.com/dashboard) |
| **Vercel** | Hosting Next.js (primary) | [vercel.com/signup](https://vercel.com/signup) |
| **GitHub** | Version control + deploy trigger | [github.com/signup](https://github.com/signup) |

Optional (untuk fitur tertentu):

| Service | Kapan perlu | Link |
|---|---|---|
| **Google Cloud Console** | Kalau enable Google OAuth | [console.cloud.google.com](https://console.cloud.google.com) |
| **Resend / SendGrid** | Custom SMTP untuk email production | [resend.com](https://resend.com) |
| **Stripe** | Phase 2 payment layer | [dashboard.stripe.com](https://dashboard.stripe.com) |

---

## 2. Setup Supabase Project

### 2.1 Buat Project Baru

1. Login ke [supabase.com/dashboard](https://supabase.com/dashboard)
2. Klik **New project**
3. Isi form:
 - **Name**: nama project (bebas, misal `my-boilerplate-dev`)
 - **Database Password**: **generate strong password**, **simpan baik-baik** — ini nggak bisa dilihat lagi, cuma di-reset
 - **Region**: pilih terdekat ke user mayoritas (untuk Indonesia → **Southeast Asia (Singapore)**)
 - **Pricing Plan**: Free (cukup untuk dev & small production)
4. Klik **Create new project** → tunggu 2-3 menit sampai status **Active**

### 2.2 Ambil Credentials

Setelah project active:

1. Di sidebar kiri: **Project Settings** (icon gear) → **Data API**
2. Ada **Project URL** — contoh: `https://xxxxxxxx.supabase.co`
3. Copy & simpan sebagai `NEXT_PUBLIC_SUPABASE_URL`
4. Di bagian **Project API keys**:
 - Copy `anon` `public` key → simpan sebagai `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 - Copy `service_role` `secret` key → simpan sebagai `SUPABASE_SERVICE_ROLE_KEY`
 - ⚠️ **`service_role` key bypass RLS, jangan pernah expose ke browser atau commit ke Git**

Ketiga value ini akan dipakai di `.env.local` (local) dan environment variables Vercel (production).

### 2.3 Run Database Migration (NUCLEAR_SETUP.sql)

Ini step kritis — setup semua table, RLS policy, trigger, storage bucket yang dibutuhkan oleh boilerplate.

#### Cara 1: SQL Editor (copy-paste, paling cepat)

1. Di sidebar Supabase: **SQL Editor** (icon `[/>]`)
2. Klik **+ New query** (tombol di kanan atas)
3. **Buka file `NUCLEAR_SETUP.sql`** dari bundle T6 (phase-1-t6-database-generalization.zip)
4. Copy **seluruh isi** file tersebut
5. Paste ke SQL Editor Supabase
6. Klik **Run** (tombol di kanan bawah, atau `Ctrl+Enter`)
7. Tunggu ~5-10 detik. Scroll ke bagian bawah output. Harus muncul:

 ```
 NOTICE: ====================================================
 NOTICE: NUCLEAR SETUP COMPLETE
 NOTICE: ====================================================
 NOTICE: user_profiles : 0 rows
 NOTICE: activity_logs : 0 rows
 NOTICE: stripe_events : 0 rows
 NOTICE: avatars bucket : ready ✓
 NOTICE: ====================================================
 ```

 Kalau muncul error merah → cek section [Troubleshooting](#8-troubleshooting).

#### Cara 2: Supabase CLI (untuk workflow otomatis)

Install CLI:
```bash
npm install -g supabase
```

Login & link project:
```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```
(Project ref ada di URL Supabase Dashboard, misal: `xxxxxxxx` dari `https://xxxxxxxx.supabase.co`)

Apply migrations:
```bash
# Di root project kamu (yang sudah ada folder supabase/migrations/)
supabase db push
```

### 2.4 Setup Auth Providers

Default cuma email/password aktif. Untuk Google OAuth + Magic Link, ada setup tambahan.

#### 2.4.1 Email (default, sudah aktif)

1. **Authentication** → **Providers** → **Email** → harus ✅ **Enabled**
2. **Confirm email** — untuk **dev**: nonaktifkan biar cepet testing. Untuk **production**: aktifkan.
3. **Secure email change**, **Secure password change** — aktifkan kedua-duanya di production.

#### 2.4.2 Google OAuth

**Di Google Cloud Console:**

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. **Create project** (atau pilih existing)
3. Sidebar: **APIs & Services** → **OAuth consent screen**
 - User Type: **External**
 - App name: nama app kamu (akan tampil di consent dialog)
 - User support email: email kamu
 - Developer contact: email kamu
 - Save & continue (skip scopes untuk sekarang, Add users test kalau masih dev mode)
4. Sidebar: **APIs & Services** → **Credentials** → **+ Create credentials** → **OAuth client ID**
 - Application type: **Web application**
 - Name: bebas (misal "Supabase Auth")
 - **Authorized JavaScript origins**: tambah URL local dev **dan** production:
 - `http://localhost:3000`
 - `https://your-production-domain.com`
 - **Authorized redirect URIs**: tambah callback Supabase:
 - `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
 - Create → muncul modal dengan **Client ID** dan **Client Secret** → copy dua-duanya

**Di Supabase Dashboard:**

1. **Authentication** → **Providers** → **Google**
2. Toggle **Enabled**
3. Paste **Client ID** dan **Client Secret**
4. **Save**

#### 2.4.3 Magic Link (email OTP)

Default udah aktif kalau Email provider enabled. Yang perlu disetup cuma redirect URL (next step) dan template email (optional).

**Custom email template (opsional):**

1. **Authentication** → **Email Templates** → **Magic Link**
2. Customize subject dan body. Available variables: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .Data }}`
3. **Save**

### 2.5 Redirect URLs (WAJIB, sering terlewat)

Ini **krusial** — kalau lupa setup, OAuth dan magic link **akan fail** dengan error "Redirect URL not allowed".

1. **Authentication** → **URL Configuration**
2. **Site URL**: isi URL production kamu (misal `https://your-app.vercel.app`). Ini default redirect kalau nggak di-override.
3. **Redirect URLs**: tambah **semua** URL callback yang mungkin dipakai (satu per baris):

 ```
 http://localhost:3000/api/auth/callback
 http://localhost:3000/**
 https://your-production-domain.com/api/auth/callback
 https://your-production-domain.com/**
 https://*-your-vercel-username.vercel.app/api/auth/callback
 ```

 Penjelasan:
 - `/api/auth/callback` — tempat Supabase redirect setelah OAuth/magic link sukses
 - `/**` — wildcard untuk allow semua path di domain (biar returnTo flow jalan)
 - `https://*-...vercel.app/**` — wildcard untuk Vercel preview deployments (setiap PR dapat URL unik)

4. **Save**

### 2.6 SMTP (Email Delivery)

**Default Supabase SMTP** punya limit ~3 email per jam dan deliverability rendah. Cukup untuk dev, **tidak cocok untuk production**.

#### Untuk dev (skip section ini)

Default SMTP udah cukup. Magic link email mungkin masuk spam — normal.

#### Untuk production (wajib setup)

Pakai transactional email service. Recommended:

**Option A — Resend (paling mudah):**

1. Daftar di [resend.com](https://resend.com)
2. Verify domain (add DNS records: SPF, DKIM, DMARC)
3. **API Keys** → create new key
4. Di Supabase: **Project Settings** → **Auth** → **SMTP Settings**:
 - Enable **Custom SMTP**
 - **Host**: `smtp.resend.com`
 - **Port**: `465`
 - **Username**: `resend`
 - **Password**: your API key
 - **Sender email**: email dari verified domain (misal `no-reply@yourdomain.com`)
 - **Sender name**: nama app
5. **Save**

**Option B — SendGrid, Mailgun, Postmark, dll** — konsep sama: get SMTP credentials, paste ke Supabase.

### 2.7 Buat Admin User Pertama

Setelah migration jalan, DB masih kosong. Buat admin pertama:

#### Step 1: Sign up user via aplikasi

Pilih satu cara:
- **A**: Jalanin app di local (`npm run dev`), buka `/login`, sign up
- **B**: Bikin manual via Supabase Dashboard → **Authentication** → **Users** → **Add user** → fill email + password + **Auto confirm email**

Trigger `handle_new_user()` akan auto-bikin row di `user_profiles` dengan role `user`.

#### Step 2: Elevate ke super_admin

Di Supabase **SQL Editor**, run:

```sql
UPDATE public.user_profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, email, role, is_active FROM public.user_profiles;
```

Harus muncul user kamu dengan `role = 'super_admin'`. Sekarang login → akan redirect ke `/admin`.

---

## 3. Local Development Setup

### 3.1 Clone Repository

```bash
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
cd <YOUR_REPO>
```

### 3.2 Install Dependencies

```bash
npm install
```

Tunggu ~1-2 menit. Kalau ada peer dependency warning tapi zero error → OK.

### 3.3 Setup Environment Variables

Copy template:

```bash
cp .env.example .env.local
```

Edit `.env.local`, isi minimal:

```env
# Branding (bebas, ini yang bikin boilerplate jadi "app kamu")
NEXT_PUBLIC_APP_NAME="My App"
NEXT_PUBLIC_APP_SHORT_NAME="App"
NEXT_PUBLIC_APP_DESCRIPTION="A modern web application"
NEXT_PUBLIC_APP_TAGLINE="Welcome"
NEXT_PUBLIC_APP_KEYWORDS="app,web,platform"
NEXT_PUBLIC_APP_AUTHOR=""
NEXT_PUBLIC_APP_PRIMARY_COLOR="#16a34a"
NEXT_PUBLIC_APP_CATEGORY="productivity"

# Supabase (dari section 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

**⚠️ Penting:** `.env.local` **tidak boleh di-commit ke Git**. File `.gitignore` sudah exclude ini — verify dengan:

```bash
git check-ignore .env.local
# Output: .env.local (artinya di-ignore — GOOD)
```

### 3.4 Replace Branding Assets

Ganti logo di `public/branding/`:

- `logo.png` — 192x192 px, main logo (login page, dashboard header)
- `logo-sm.png` — 96x96 px, small logo (sidebar, header compact)
- `favicon.ico` — 32x32 px, browser tab icon
- `apple-touch-icon.png` — 180x180 px, iOS homescreen icon

Tools generate favicon + PWA assets dari satu gambar:
- [realfavicongenerator.net](https://realfavicongenerator.net) (recommended)
- [favicon.io](https://favicon.io)

### 3.5 Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

**Expected flow:**
- Anon user → redirect ke `/login`
- Login page tampil dengan **nama & logo kamu** (dari `.env.local` + `public/branding/`)
- Login pakai admin user dari step 2.7 → redirect ke `/admin`

### 3.6 Verification Phase 1 di Local

Setelah `npm run dev` jalan, run automated verification:

```bash
chmod +x verify-phase-1.sh    # Linux/macOS only
./verify-phase-1.sh

# Atau include build check (lebih lama tapi thorough):
./verify-phase-1.sh --build
```

Untuk Windows (Git Bash):
```bash
bash verify-phase-1.sh
```

Semua gate pass? Lanjut deploy.

---

## 4. Deploy ke Production (Vercel)

Vercel = platform resmi Next.js, zero-config. Recommended untuk 95% use case.

### 4.1 Push Code ke GitHub

Kalau belum:

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git add .
git commit -m "chore: phase 1 foundation complete"
git push -u origin main
```

### 4.2 Import Project ke Vercel

1. Login ke [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Add New...** → **Project**
3. Tab **Import Git Repository** → pilih repo kamu
 - Kalau belum connect GitHub, click **Adjust GitHub App Permissions** → allow Vercel akses ke repo
4. **Framework Preset**: auto-detect sebagai **Next.js** — leave as is
5. **Root Directory**: `.` (leave default)
6. **Build & Output Settings**: leave default (Vercel pakai `npm run build` otomatis)

### 4.3 Set Environment Variables

**JANGAN click Deploy dulu.** Expand section **Environment Variables**, tambah satu per satu:

| Key | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Nama app kamu | Production, Preview, Development |
| `NEXT_PUBLIC_APP_SHORT_NAME` | Short name | All |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Deskripsi | All |
| `NEXT_PUBLIC_APP_TAGLINE` | Tagline | All |
| `NEXT_PUBLIC_APP_KEYWORDS` | `app,web,platform` | All |
| `NEXT_PUBLIC_APP_AUTHOR` | Author / Company | All |
| `NEXT_PUBLIC_APP_PRIMARY_COLOR` | `#16a34a` | All |
| `NEXT_PUBLIC_APP_CATEGORY` | `productivity` | All |
| `NEXT_PUBLIC_SUPABASE_URL` | Dari Supabase | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dari Supabase | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Dari Supabase — ⚠️ **Sensitive, bukan NEXT_PUBLIC_** | All |

**Tips:**
- Paste env vars bulk: ada tombol **Paste .env** — paste langsung dari `.env.local` kamu
- Gunakan **Sensitive** flag untuk `SUPABASE_SERVICE_ROLE_KEY` — Vercel akan hide value setelah save

### 4.4 Deploy

1. Click **Deploy**
2. Tunggu 2-5 menit. Kamu lihat log build real-time
3. Kalau sukses: ada URL production (`https://your-app.vercel.app`) + preview dari main branch

### 4.5 Update Supabase Redirect URLs

**Penting**: sekarang ambil URL production → balik ke Supabase:

1. **Authentication** → **URL Configuration**
2. **Site URL**: ganti dari `localhost:3000` ke `https://your-app.vercel.app`
3. **Redirect URLs**: tambah:
 ```
 https://your-app.vercel.app/api/auth/callback
 https://your-app.vercel.app/**
 https://*-your-vercel-username.vercel.app/**
 ```
 (Yang terakhir untuk Vercel preview deployments — setiap PR dapat URL unik, pattern `<branch>-<hash>-<username>.vercel.app`)
4. **Save**

### 4.6 Update Google OAuth (kalau dipakai)

Di Google Cloud Console → **Credentials** → OAuth client yang kamu bikin:

1. **Authorized JavaScript origins**: tambah `https://your-app.vercel.app`
2. **Authorized redirect URIs**: tetap hanya `https://<project>.supabase.co/auth/v1/callback` (Supabase yang handle)
3. **Save**

### 4.7 Test Production

1. Buka `https://your-app.vercel.app`
2. Sign up user baru atau login dengan admin
3. Verify: login flow, logout, role-based redirect jalan

### 4.8 Custom Domain (Opsional)

Kalau punya domain sendiri:

1. Vercel Dashboard → project → **Settings** → **Domains**
2. **Add** → masukin domain (misal `app.yourcompany.com`)
3. Vercel kasih DNS records — tambah di DNS provider kamu (Cloudflare, Namecheap, dll)
 - `A` record → `76.76.21.21`
 - Atau `CNAME` → `cname.vercel-dns.com`
4. Wait propagation (~5 menit sampai 48 jam)
5. Once verified, **update lagi Site URL & Redirect URLs di Supabase** dengan domain baru
6. Update Google OAuth origins kalau dipakai

---

## 5. Deploy Alternatif (Non-Vercel)

Vercel bukan satu-satunya pilihan. Berikut alternatif utama.

### 5.1 Netlify

Mirip Vercel:

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. Pilih repo → Framework auto-detect Next.js
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Environment variables: paste seperti di Vercel
6. Deploy

### 5.2 Self-Hosted (VPS, Docker)

Untuk kamu yang butuh kontrol penuh.

**Dockerfile** (create di root project):

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**next.config.js** — pastikan ada `output: 'standalone'`:

```js
module.exports = {
  output: 'standalone',
  // ... existing config
};
```

Build & run:

```bash
docker build -t my-app .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e NEXT_PUBLIC_APP_NAME="My App" \
  my-app
```

Deploy Docker image ke:
- **Railway** — [railway.app](https://railway.app)
- **Render** — [render.com](https://render.com)
- **Fly.io** — [fly.io](https://fly.io)
- **DigitalOcean App Platform** — [digitalocean.com/products/app-platform](https://digitalocean.com/products/app-platform)
- **AWS ECS / Google Cloud Run** — untuk enterprise

Setelah deploy, **balik ke Supabase update Redirect URLs** dengan domain baru (section 4.5 logic sama).

### 5.3 Cloudflare Pages

Works, tapi ada beberapa Next.js features yang perlu workaround (middleware, dynamic routes). Recommended cuma untuk static-heavy apps. Skip kalau tidak punya alasan kuat.

---

## 6. Post-Deploy Verification

Setelah production live, wajib run verifikasi.

### 6.1 Smoke Test Checklist

Buka production URL, verify:

| # | Test | Expected |
|---|---|---|
| 1 | Buka homepage anonymous | Redirect ke `/login` |
| 2 | Login page tampil | Brand name & logo sesuai `.env` Vercel |
| 3 | Sign up user baru | Akun dibuat, auto-create profile di `user_profiles` |
| 4 | Login user biasa | Redirect ke `/dashboard` |
| 5 | Login admin (role=super_admin) | Redirect ke `/admin` |
| 6 | Akses `/admin` sebagai user biasa | Redirect ke `/dashboard` |
| 7 | Google OAuth (kalau enabled) | Redirect ke Google → consent → back to app |
| 8 | Magic link (kalau enabled) | Email terima → klik → landed di app |
| 9 | Logout | Redirect ke `/login`, session clear |
| 10 | Akses halaman proteksi tanpa login, misal `/profile` | Redirect ke `/login?returnTo=/profile`, setelah login landing di `/profile` |

### 6.2 Database Verify di Supabase

```sql
-- 1. Tables intact
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'activity_logs', 'stripe_events');
-- Expected: 3 rows

-- 2. User count (harus sesuai berapa orang yang udah sign up)
SELECT count(*) as total_users FROM public.user_profiles;

-- 3. Admin exists
SELECT email, role FROM public.user_profiles
WHERE role IN ('super_admin', 'admin');
-- Expected: minimal 1 admin

-- 4. Recent activity
SELECT action, user_id, created_at FROM public.activity_logs
ORDER BY created_at DESC LIMIT 20;
-- Expected: (kalau sudah integrasi logActivity) ada log user.login, user.logout, dll
```

### 6.3 Check Vercel Build & Runtime Logs

1. Vercel Dashboard → project → **Deployments**
2. Pilih latest deployment → tab **Logs** (atau **Functions** untuk server logs)
3. Expected: zero `ERROR` log. Warning boleh (misal Image optimization disabled kalau belum setup).

### 6.4 Performance Check (optional)

Run Lighthouse di production:

1. Chrome DevTools (F12) → **Lighthouse** tab
2. Pilih **Mobile**, **Performance + Accessibility + Best Practices + SEO**
3. Click **Analyze page load**

Target Phase 1:
- Performance: 85+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

Kalau jauh di bawah, cek image optimization, unused JS, dll.

---

## 7. Operational Tasks

Task rutin yang perlu tahu cara-nya.

### 7.1 Tambah Admin User Baru

```sql
-- Di Supabase SQL Editor
-- Step 1: user harus sudah sign up dulu via UI atau Dashboard Auth
-- Step 2: elevate role
UPDATE public.user_profiles
SET role = 'super_admin'  -- atau 'admin', 'editor', 'viewer'
WHERE email = 'new-admin@example.com';
```

### 7.2 Deactivate User

```sql
UPDATE public.user_profiles
SET is_active = false
WHERE email = 'user-to-deactivate@example.com';
```

User masih bisa login ke Supabase Auth, **tapi login form di boilerplate akan reject dengan error "accountDeactivated"** karena cek `is_active = true`.

### 7.3 Reactivate User

```sql
UPDATE public.user_profiles
SET is_active = true
WHERE email = 'user@example.com';
```

### 7.4 Delete User (Completely)

```sql
-- Cascade: delete auth user → trigger remove user_profiles row juga
-- (karena FK ON DELETE CASCADE)
DELETE FROM auth.users WHERE email = 'user-to-delete@example.com';
```

⚠️ **Irreversible.** Backup dulu kalau perlu.

### 7.5 Query Activity Log

```sql
-- Recent activity (admin only via RLS atau pakai service_role)
SELECT
  al.action,
  up.email,
  up.full_name,
  al.resource_type,
  al.metadata,
  al.created_at
FROM public.activity_logs al
LEFT JOIN public.user_profiles up ON up.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 100;

-- Login failures in last 24 hours
SELECT count(*) FROM public.activity_logs
WHERE action = 'user.failed_login'
  AND created_at > now() - interval '24 hours';

-- Activity by specific user
SELECT action, metadata, created_at
FROM public.activity_logs
WHERE user_id = (SELECT id FROM public.user_profiles WHERE email = 'user@example.com')
ORDER BY created_at DESC;
```

### 7.6 Change Branding (Re-brand)

Zero-code rebrand:

1. Update env vars (Vercel Dashboard → Settings → Environment Variables)
2. Replace files di `public/branding/` → commit & push
3. Vercel auto-redeploy → aplikasi jadi brand baru

### 7.7 Enable / Disable Auth Provider

Edit `src/config/app.config.ts`:

```ts
auth: {
  providers: ["email", "google", "magic-link"] as const,  // enable semua
  // providers: ["email"] as const,  // cuma email
  // ...
}
```

Commit → push → Vercel rebuild → login page otomatis adjust UI.

### 7.8 Rotate Supabase Service Role Key

Kalau key bocor:

1. Supabase Dashboard → **Project Settings** → **API** → **Reset `service_role` secret**
2. Copy key baru
3. Vercel Dashboard → **Settings** → **Environment Variables** → update `SUPABASE_SERVICE_ROLE_KEY`
4. Trigger redeploy (Vercel → **Deployments** → pilih latest → **Redeploy**)

### 7.9 Backup Database

#### Via Supabase Dashboard
- **Project Settings** → **Database** → **Backups**
- Free plan: 7 daily backups retained automatically
- Pro plan: customizable, 30-day retention

#### Manual backup via `pg_dump`
```bash
# Connection string di Project Settings → Database → Connection string
pg_dump "postgresql://postgres:[PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres" \
  --schema=public \
  --no-owner --no-acl \
  > backup-$(date +%Y%m%d).sql
```

### 7.10 Run Migration Baru (Phase 2+)

Waktu tambah fitur di Phase 2/3 yang butuh DB changes:

1. Bikin file baru di `supabase/migrations/` dengan format timestamp: `YYYYMMDDHHMMSS_description.sql`
2. Write idempotent SQL (pakai `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, dll)
3. Test di local Supabase (atau staging project)
4. Apply ke production:

 ```bash
 supabase db push --linked
 ```

 Atau copy-paste isi file ke SQL Editor → Run

5. Regenerate types:
 ```bash
 npx supabase gen types typescript --linked > src/core/types/database.ts
 ```

6. Commit both `.sql` migration & regenerated `database.ts` → push → Vercel deploy

---

## 8. Troubleshooting

### 8.1 `NEXT_PUBLIC_SUPABASE_URL is not defined`

**Cause:** env var nggak ke-load.

**Fix:**
- Local: pastikan file namanya `.env.local` (bukan `.env`), pastikan di root project
- Vercel: cek Settings → Environment Variables, pastikan scope include **Production**
- Restart dev server setelah edit `.env.local`

### 8.2 Google OAuth: "redirect_uri_mismatch"

**Cause:** Redirect URI di Google Console nggak match dengan yang dipakai Supabase.

**Fix:**
- Google Console → Credentials → OAuth client → **Authorized redirect URIs**
- Harus ada: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback` (bukan URL app kamu)

### 8.3 Magic Link: "Email rate limit exceeded"

**Cause:** Supabase default SMTP limit ~3 email/jam untuk dev.

**Fix:**
- Dev: tunggu 1 jam, atau pakai Supabase Auth → Users → manually generate magic link
- Production: setup custom SMTP (section 2.6)

### 8.4 Login sukses tapi redirect ke `/login` lagi

**Cause:** Session cookie nggak ke-set, biasanya karena redirect URL mismatch.

**Fix:**
- Supabase Dashboard → Authentication → URL Configuration
- Verify **Site URL** = domain production kamu
- Verify **Redirect URLs** include domain + `/api/auth/callback`
- Hard refresh browser (Ctrl+Shift+R), hapus cookies

### 8.5 Admin user akses `/admin` tapi redirect ke `/dashboard`

**Cause:** Role di DB belum `super_admin` atau `admin`.

**Fix:**
```sql
SELECT email, role FROM public.user_profiles WHERE email = 'your-email@example.com';
-- Kalau role bukan admin, elevate:
UPDATE public.user_profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

Logout → login ulang (biar session fetch role baru).

### 8.6 `npm run build` error: "Module not found: '@/core/...'"

**Cause:** TypeScript path alias nggak resolve.

**Fix:**
- Cek `tsconfig.json` punya:
 ```json
 {
 "compilerOptions": {
 "baseUrl": ".",
 "paths": {
 "@/*": ["./src/*"]
 }
 }
 }
 ```

### 8.7 Vercel build fail: "Command exited with 1"

**Cause:** Bisa beberapa hal.

**Fix (urut dari paling common):**
1. Cek Vercel build logs untuk error message exact
2. TypeScript error → run `npx tsc --noEmit` di local, fix
3. Missing env var → tambah di Vercel Settings → Environment Variables → Redeploy
4. Outdated deps → `rm -rf node_modules package-lock.json && npm install` di local, commit baru

### 8.8 Avatar upload fail: 403 Forbidden

**Cause:** Path upload nggak sesuai convention atau RLS policy.

**Fix:**
- Path **harus** diawali dengan `<user_id>/...` (misal `<user_id>/avatar.png`)
- RLS policy `avatars_user_upload` cek `(storage.foldername(name))[1] = auth.uid()::text`
- Contoh code upload benar:
 ```ts
 const filePath = `${user.id}/avatar-${Date.now()}.png`;
 await supabase.storage.from("avatars").upload(filePath, file);
 ```

### 8.9 Activity log kosong walau udah integrate

**Cause:** RLS policy nggak allow SELECT.

**Fix:**
- Cek kamu login sebagai admin (policy `activity_logs_admin_select_all`)
- Atau user biasa cuma bisa lihat log-nya sendiri
- Verify policy:
 ```sql
 SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'activity_logs';
 -- Expected: 3 policies
 ```

### 8.10 Deploy sukses tapi production show "500 Internal Server Error"

**Cause:** Umumnya server-side env var hilang.

**Fix:**
- Vercel Dashboard → project → **Logs** (real-time) → cek error message
- Common culprit: `SUPABASE_SERVICE_ROLE_KEY` lupa di-set (bukan `NEXT_PUBLIC_` karena sensitive)
- Verify semua env var dari section 4.3 udah set di Vercel

---

## 9. Environment Variables Reference

Reference lengkap semua env var yang dipakai boilerplate.

### 9.1 Public (client-side accessible)

Prefix `NEXT_PUBLIC_*` → di-expose ke browser. **Jangan masukin secret di sini.**

| Variable | Required | Default | Keterangan |
|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Yes | `"My App"` | Nama lengkap app, muncul di tab title, meta, welcome |
| `NEXT_PUBLIC_APP_SHORT_NAME` | Yes | `"App"` | Short name, muncul di sidebar, PWA |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Yes | `"A modern web application"` | Meta description, login subtitle |
| `NEXT_PUBLIC_APP_TAGLINE` | No | `"Welcome"` | Tagline marketing |
| `NEXT_PUBLIC_APP_KEYWORDS` | No | `"app,web,platform"` | Comma-separated, untuk SEO |
| `NEXT_PUBLIC_APP_AUTHOR` | No | `""` | Meta author |
| `NEXT_PUBLIC_APP_PRIMARY_COLOR` | No | `"#16a34a"` | Hex color, theme-color meta + PWA |
| `NEXT_PUBLIC_APP_CATEGORY` | No | `"productivity"` | Meta category |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | — | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | — | Anon key (aman di-expose, RLS enforce security) |

### 9.2 Secret (server-side only)

Tanpa prefix `NEXT_PUBLIC_` → **tidak boleh akses dari browser**.

| Variable | Required | Keterangan |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Service role key. Bypass RLS. Dipakai untuk webhook, admin ops, migration |
| `STRIPE_SECRET_KEY` | Phase 2 | Stripe secret untuk server-side API calls |
| `STRIPE_WEBHOOK_SECRET` | Phase 2 | Verify signature webhook Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Phase 2 | Stripe publishable (client-side, boleh expose) |

### 9.3 File `.env.example` (template)

Ini isi file `.env.example` yang harus di-commit ke repo:

```env
# =====================================================================
# Application Branding
# =====================================================================
NEXT_PUBLIC_APP_NAME="My App"
NEXT_PUBLIC_APP_SHORT_NAME="App"
NEXT_PUBLIC_APP_DESCRIPTION="A modern web application"
NEXT_PUBLIC_APP_TAGLINE="Welcome"
NEXT_PUBLIC_APP_KEYWORDS="app,web,platform"
NEXT_PUBLIC_APP_AUTHOR=""
NEXT_PUBLIC_APP_PRIMARY_COLOR="#16a34a"
NEXT_PUBLIC_APP_CATEGORY="productivity"

# =====================================================================
# Supabase (Required)
# =====================================================================
# Get from: Supabase Dashboard → Project Settings → Data API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Secret — NEVER commit, NEVER expose to client
SUPABASE_SERVICE_ROLE_KEY=

# =====================================================================
# Stripe (Phase 2 — optional untuk Phase 1)
# =====================================================================
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## 📌 Quick Reference

### Command Cheatsheet

```bash
# Local dev
npm run dev                 # Start dev server di :3000
npm run build               # Build production
npm run start               # Run production build lokal
npm run lint                # Run ESLint

# Supabase CLI
supabase login              # Authenticate
supabase link --project-ref <REF>
supabase db push            # Apply migrations
supabase db pull            # Sync schema from remote
supabase gen types typescript --linked > src/core/types/database.ts

# Phase 1 verification
./verify-phase-1.sh         # Automated G1-G4
./verify-phase-1.sh --build # Include build check

# Vercel CLI (optional)
npm i -g vercel
vercel                      # Deploy preview
vercel --prod               # Deploy to production
vercel env pull             # Download env vars to .env.local
```

### Important URL

| What | URL pattern |
|---|---|
| Supabase Dashboard | `https://supabase.com/dashboard/project/<PROJECT_REF>` |
| Supabase Auth callback | `https://<PROJECT_REF>.supabase.co/auth/v1/callback` |
| Your app (local) | `http://localhost:3000` |
| Your app (Vercel) | `https://<PROJECT_NAME>.vercel.app` |
| Your app callback | `<YOUR_APP_URL>/api/auth/callback` |

### SQL Snippet Bank

```sql
-- Elevate to super_admin
UPDATE public.user_profiles SET role='super_admin' WHERE email='you@x.com';

-- List all users
SELECT id, email, role, is_active FROM public.user_profiles ORDER BY created_at DESC;

-- Recent logins
SELECT up.email, al.created_at FROM activity_logs al
JOIN user_profiles up ON up.id = al.user_id
WHERE al.action = 'user.login' ORDER BY al.created_at DESC LIMIT 50;

-- Deactivate user
UPDATE public.user_profiles SET is_active=false WHERE email='x@x.com';

-- Verify table structure
\d public.user_profiles  -- psql only

-- Check who is admin
SELECT email, role FROM user_profiles WHERE role IN ('super_admin','admin');
```

---

## 🎯 Checklist: Production Ready?

Copy ini ke issue tracker sebelum go-live:

```
INFRASTRUCTURE
[ ] Supabase project di region yang tepat
[ ] NUCLEAR_SETUP.sql atau migrations sudah di-apply
[ ] Database backups enabled (Supabase → Project Settings → Database)
[ ] RLS policies active di semua tables

AUTH
[ ] Email provider enabled
[ ] Email confirmation enabled (production)
[ ] Google OAuth configured di Google Console + Supabase (kalau dipakai)
[ ] Magic link template customized (kalau dipakai)
[ ] Redirect URLs include production domain + /**
[ ] Site URL = production domain

EMAIL
[ ] Custom SMTP setup (Resend/SendGrid/dll)
[ ] Sender email domain verified (SPF, DKIM, DMARC)
[ ] Magic link email template branded

HOSTING (Vercel)
[ ] All env vars set di Production + Preview
[ ] SUPABASE_SERVICE_ROLE_KEY marked as Sensitive
[ ] Custom domain configured (kalau ada)
[ ] HTTPS working (Vercel auto)

VERIFICATION
[ ] Phase 1 T7 automated gates pass
[ ] 10 smoke tests di section 6.1 pass
[ ] Admin user pertama created
[ ] Lighthouse score > 85 (performance)

MONITORING
[ ] Vercel Analytics enabled (optional tapi recommended)
[ ] Supabase logs reviewed, zero ERROR
[ ] Notification setup untuk downtime (Vercel: integration with Slack/Email)

DOCUMENTATION
[ ] README.md updated dengan project-specific info
[ ] .env.example up-to-date
[ ] Admin contact info documented untuk tim
```

Semua ticked? 🚀 **Production ready.**

---

## 📚 Resource Links

### Official Docs
- [Next.js App Router](https://nextjs.org/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)

### Troubleshooting
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Next.js Issues](https://github.com/vercel/next.js/issues)
- [Vercel Support](https://vercel.com/support)

### Tools
- [Favicon Generator](https://realfavicongenerator.net)
- [Resend (SMTP)](https://resend.com)
- [OKLCH Color Picker](https://oklch.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

**End of Operations Runbook.**

Dokumen ini harus di-update tiap ada perubahan architecture major. Versioning di Git commit messages:
- `docs(ops): add section X`
- `docs(ops): update supabase setup step Y`
