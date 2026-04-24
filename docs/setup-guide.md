# 
> **Panduan operasional lengkap untuk deploy & jalanin boilerplate ini.**
> Dokumen ini di luar kode — cover semua aspek non-coding biar project bisa running di local development sampai production.
>
> **Status pengembangan:** 🔒 **FINAL di Phase 2.** Tidak ada Phase 3.
---

## 📑 Daftar Isi

1. [Prerequisites](#1-prerequisites)
2. [Setup Supabase Project](#2-setup-supabase-project)
3. [Setup Resend (Email Delivery)](#3-setup-resend-email-delivery)
4. [Local Development Setup](#4-local-development-setup)
5. [Deploy ke Production (Vercel)](#5-deploy-ke-production-vercel)
6. [Deploy Alternatif (Non-Vercel)](#6-deploy-alternatif-non-vercel)
7. [Post-Deploy Verification](#7-post-deploy-verification)
8. [Operational Tasks](#8-operational-tasks)
9. [Troubleshooting](#9-troubleshooting)
10. [Environment Variables Reference](#10-environment-variables-reference)

---

## 1. Prerequisites

Tools & accounts yang wajib ada sebelum mulai:

### 1.1 Software

| Tool | Versi minimum | Cek versi | Download |
|---|---|---|---|
| Node.js | 20.x LTS | `node -v` | [nodejs.org](https://nodejs.org) |
| pnpm | 9.x (recommended) | `pnpm -v` | `npm i -g pnpm` |
| Git | 2.30+ | `git --version` | [git-scm.com](https://git-scm.com) |

**Verifikasi cepat:**
```bash
node -v     # harus v20.x.x atau lebih tinggi
pnpm -v     # harus 9.x.x
git --version
```

Kalau pakai Windows, disarankan install via [nvm-windows](https://github.com/coreybutler/nvm-windows) biar bisa switch versi. Di macOS/Linux pakai [nvm](https://github.com/nvm-sh/nvm).

> **Catatan:** Boilerplate pake `pnpm` (bukan `npm`) — workspaces & dep resolution lebih efisien. `npm` juga jalan tapi gak tested.

### 1.2 Accounts

Wajib daftar (semua free untuk development):

| Service | Guna | Link daftar |
|---|---|---|
| **Supabase** | Database + Auth + Storage | [supabase.com/dashboard](https://supabase.com/dashboard) |
| **Resend** | Transactional email (auth email) | [resend.com](https://resend.com) |
| **Vercel** | Hosting Next.js (primary) | [vercel.com/signup](https://vercel.com/signup) |
| **GitHub** | Version control + deploy trigger | [github.com/signup](https://github.com/signup) |

Optional (untuk fitur tertentu):

| Service | Kapan perlu | Link |
|---|---|---|
| **Google Cloud Console** | Kalau enable Google OAuth | [console.cloud.google.com](https://console.cloud.google.com) |
| **Lemon Squeezy** | Commerce module (per-user, bukan deploy-level) | [lemonsqueezy.com](https://lemonsqueezy.com) |
| **ngrok** | Dev testing webhook (Supabase hook + LS webhook) | [ngrok.com](https://ngrok.com) |

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

### 2.3 Run Database Migration (setup.sql)

Ini step kritis — setup semua table, RLS policy, trigger, storage bucket yang dibutuhkan oleh boilerplate.

1. Di sidebar Supabase: **SQL Editor** (icon `[/>]`)
2. Klik **+ New query** (tombol di kanan atas)
3. **Buka file `supabase/setup.sql`** dari project kamu
4. Copy **seluruh isi** file tersebut
5. Paste ke SQL Editor Supabase
6. Klik **Run** (tombol di kanan bawah, atau `Ctrl+Enter`)
7. Tunggu ~5-10 detik. Scroll ke bagian bawah output. Harus muncul:

   ```
   NOTICE: ====================================================
   NOTICE: SETUP COMPLETE
   NOTICE: ====================================================
   NOTICE: user_profiles              : 0 rows
   NOTICE: activity_logs              : 0 rows
   NOTICE: commerce_credentials       : 0 rows
   NOTICE: commerce_webhook_configs   : 0 rows
   NOTICE: commerce_webhook_events    : 0 rows
   NOTICE: commerce_orders            : 0 rows
   NOTICE: commerce_subscriptions     : 0 rows
   NOTICE: commerce_customers         : 0 rows
   NOTICE: avatars bucket             : ready ✓
   NOTICE: ====================================================
   ```

   Kalau muncul error merah → cek section [Troubleshooting](#9-troubleshooting).

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

Default udah aktif kalau Email provider enabled. Delivery-nya akan via **Supabase Send Email Hook** (kita setup di section 2.6) — jadi template yang dipakai adalah custom template dari boilerplate, bukan default Supabase.

### 2.5 Redirect URLs (WAJIB, sering terlewat)

Ini **krusial** — kalau lupa setup, OAuth **akan fail** dengan error "Redirect URL not allowed".

1. **Authentication** → **URL Configuration**
2. **Site URL**: isi URL production kamu (misal `https://your-app.vercel.app`). Ini default redirect kalau nggak di-override.
3. **Redirect URLs**: tambah **semua** URL callback yang mungkin dipakai (satu per baris):

   ```
   http://localhost:3000/api/auth/callback
   http://localhost:3000/api/auth/confirm
   http://localhost:3000/**
   https://your-production-domain.com/api/auth/callback
   https://your-production-domain.com/api/auth/confirm
   https://your-production-domain.com/**
   https://*-your-vercel-username.vercel.app/api/auth/callback
   https://*-your-vercel-username.vercel.app/api/auth/confirm
   ```

   Penjelasan:
   - `/api/auth/callback` — OAuth PKCE callback (Google)
   - `/api/auth/confirm` — Email OTP verification (magic link, signup, recovery)
   - `/**` — wildcard untuk allow semua path di domain (biar returnTo flow jalan)
   - `https://*-...vercel.app/**` — wildcard untuk Vercel preview deployments

4. **Save**

### 2.6 Setup Supabase Send Email Hook 🔥 **BARU PHASE 2**

Ini **gantiin default Supabase SMTP** — semua auth email (magic link, recovery, signup, email change) akan di-render pake custom template di boilerplate + dikirim via Resend.

**Hook URL baru bisa di-set setelah deployment** (karena butuh public URL). Untuk **dev testing**, kamu butuh tunnel (ngrok) atau preview deployment.

#### Registrasi Hook

1. **Authentication** → **Hooks** → **Send Email Hook**
2. Toggle **Enable hook**
3. **Hook type**: **HTTPS**
4. **Hook URL**: `{YOUR_APP_URL}/api/auth/hooks/send-email`
   - **Production:** `https://your-production-domain.com/api/auth/hooks/send-email`
   - **Dev testing:** `https://abc123.ngrok-free.app/api/auth/hooks/send-email` (ngrok URL)
   - **Preview:** `https://your-branch-xxxxx.vercel.app/api/auth/hooks/send-email`
5. **Generate secret** — Supabase generate secret otomatis, copy value-nya (format: `v1,whsec_xxxxxxxxxx`)
6. Simpan secret sebagai `SEND_EMAIL_HOOK_SECRET` di env vars
7. **Save**

> ⚠️ **Setelah hook enabled:** Supabase **gak akan pakai default SMTP** sama sekali. Semua auth email via hook. Kalau hook fail (500 response), Supabase retry exponential, abis itu email gak terkirim.
>
> Kalau mau sementara balik ke default SMTP (misal Resend down), **disable hook** → Supabase auto-fallback.

#### Fallback: Custom SMTP (optional, jarang dipakai)

Kalau kamu prefer pake Supabase SMTP sebagai fallback (bukan via hook), itu setup terpisah di **Project Settings → Auth → SMTP Settings**. Tapi kalau hook udah setup, ini gak perlu — skip aja section ini.

### 2.7 Buat Admin User Pertama

Setelah migration jalan, DB masih kosong. Buat admin pertama:

#### Step 1: Sign up user via aplikasi

Pilih satu cara:
- **A**: Jalanin app di local (`pnpm dev`), buka `/login`, sign up
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

## 3. Setup Resend (Email Delivery)

**Resend** adalah transactional email service yang dipakai boilerplate untuk semua auth email. Default Supabase SMTP punya limit ~3 email/jam dan deliverability rendah — Resend solve ini.

### 3.1 Daftar & Verify Domain

1. Daftar di [resend.com](https://resend.com) — free tier: 3,000 email/bulan, 100/hari
2. **Domains** → **Add Domain** → masukin domain kamu (misal `yourdomain.com`)
3. Resend generate **DNS records** — kamu harus add ini di DNS provider (Cloudflare, Namecheap, dll):
   - **SPF record** (TXT)
   - **DKIM record** (CNAME x3)
   - **DMARC record** (TXT) — optional tapi recommended
4. Setelah DNS propagate (biasanya 5-30 menit), click **Verify DNS Records**
5. Status harus jadi ✅ **Verified** sebelum bisa kirim email

> 💡 **Tips:** Kalau belum punya domain sendiri, kamu bisa pake subdomain (misal `mail.yourdomain.com`) — DNS setup-nya sama.

> ⚠️ **Untuk dev:** Resend punya sandbox mode (`onboarding@resend.dev`) — bisa kirim ke email kamu sendiri tanpa verify domain. Cocok buat testing di local, tapi production wajib verify domain sendiri.

### 3.2 Generate API Key

1. Resend Dashboard → **API Keys** → **Create API Key**
2. **Name**: bebas (misal `my-app-production`)
3. **Permission**: **Full access** (atau **Sending access** kalau mau tighter)
4. **Domain**: pilih domain yang udah verified
5. **Add** → copy API key (format: `re_xxxxxxxxxxxxx`)
6. Simpan sebagai `RESEND_API_KEY` di env vars

> ⚠️ **API key cuma muncul sekali.** Kalau lupa / hilang, bikin baru.

### 3.3 Tentukan Sender Address

Sender email yang muncul di inbox user. Format: `"Sender Name <email@yourdomain.com>"`.

Contoh:
```
RESEND_FROM_EMAIL="Acme Platform <noreply@acme.com>"
RESEND_FROM_EMAIL="Acme <hello@acme.com>"
```

**Best practices:**
- Sender name match brand name
- Email pake `noreply@` atau `hello@` (jangan pake personal email)
- Domain harus yang udah verified di Resend (otherwise 400 error)

### 3.4 Test Send

Resend punya tombol **Send test email** di dashboard. Bisa kirim dari sender address yang kamu mau → ke email kamu sendiri. Kalau sampe inbox (bukan spam), domain config udah bener.

---

## 4. Local Development Setup

### 4.1 Clone Repository

```bash
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
cd <YOUR_REPO>
```

### 4.2 Install Dependencies

```bash
pnpm install
```

Tunggu ~1-2 menit. Dependencies yang notable:
- `@supabase/ssr`, `@supabase/supabase-js` — Supabase client
- `resend`, `@react-email/components`, `@react-email/render` — email
- `standardwebhooks` — HMAC verify (auth hook + LS webhook)
- `react`, `next` — framework
- `zustand` — state management
- `tailwindcss` — styling

Kalau ada peer dependency warning tapi zero error → OK.

### 4.3 Setup Environment Variables

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
NEXT_PUBLIC_APP_PRIMARY_COLOR="#16a34a"

# Supabase (dari section 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Encryption (generate via node crypto)
ENCRYPTION_KEY=<base64 32 bytes>

# Resend (dari section 3)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="My App <noreply@yourdomain.com>"

# Supabase Send Email Hook (dari section 2.6)
SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxxxxxxxxxx

# App URL (optional di local, wajib di production)
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Penting:** `.env.local` **tidak boleh di-commit ke Git**. File `.gitignore` sudah exclude ini — verify dengan:

```bash
git check-ignore .env.local
# Output: .env.local (artinya di-ignore — GOOD)
```

Detail setiap env var lihat [ENV_VARS.md](./ENV_VARS.md).

### 4.4 Replace Branding Assets

Ganti logo di `public/branding/`:

- `icon-48.png`, `icon-72.png`, `icon-96.png`, `icon-144.png`, `icon-192.png`, `icon-512.png` — PWA icons
- `favicon.ico` — 32x32 px, browser tab icon
- `apple-touch-icon.png` — 180x180 px, iOS homescreen icon

Tools generate favicon + PWA assets dari satu gambar:
- [realfavicongenerator.net](https://realfavicongenerator.net) (recommended)
- [favicon.io](https://favicon.io)

### 4.5 Run Development Server

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000).

**Expected flow:**
- Anon user → redirect ke `/login`
- Login page tampil dengan **nama & logo kamu** (dari `.env.local` + `public/branding/`)
- Login pakai admin user dari step 2.7 → redirect ke `/admin`

### 4.6 Testing Auth Email di Local (ngrok)

Send Email Hook butuh **public URL** yang bisa di-call Supabase cloud. Localhost gak reachable. Solusi: **ngrok**.

#### Setup ngrok

1. Install ngrok: [ngrok.com/download](https://ngrok.com/download) atau `brew install ngrok` / `choco install ngrok`
2. Daftar akun free → dapet authtoken
3. `ngrok config add-authtoken <YOUR_TOKEN>`

#### Jalankan tunnel

```bash
# Terminal 1: Next.js dev server
pnpm dev

# Terminal 2: ngrok tunnel
ngrok http 3000
```

ngrok kasih URL kaya `https://abc123.ngrok-free.app`.

#### Update Supabase hook

1. **Authentication** → **Hooks** → **Send Email Hook**
2. Update **Hook URL** → `https://abc123.ngrok-free.app/api/auth/hooks/send-email`
3. **Save**

Sekarang trigger auth email (misal klik forgot password) → Supabase panggil hook → ngrok forward ke localhost → email terkirim via Resend.

> 💡 **Tip:** ngrok URL berubah tiap restart (free tier). Kalau tunnel restart, update URL di Supabase dashboard.

---

## 5. Deploy ke Production (Vercel)

Vercel = platform resmi Next.js, zero-config. Recommended untuk 95% use case.

### 5.1 Push Code ke GitHub

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git add .
git commit -m "chore: phase 2 complete"
git push -u origin main
```

### 5.2 Import Project ke Vercel

1. Login ke [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Add New...** → **Project**
3. Tab **Import Git Repository** → pilih repo kamu
4. **Framework Preset**: auto-detect sebagai **Next.js** — leave as is
5. **Root Directory**: `.` (leave default)
6. **Build & Output Settings**: leave default (Vercel pakai `pnpm build` otomatis)

### 5.3 Set Environment Variables

**JANGAN click Deploy dulu.** Expand section **Environment Variables**, tambah satu per satu:

| Key | Value | Scope | Sensitive |
|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Nama app kamu | All | No |
| `NEXT_PUBLIC_APP_SHORT_NAME` | Short name | All | No |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Deskripsi | All | No |
| `NEXT_PUBLIC_APP_PRIMARY_COLOR` | `#16a34a` | All | No |
| (other branding vars) | ... | All | No |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Dari Supabase | All | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dari Supabase | All | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Dari Supabase | All | **Yes** ⚠️ |
| `ENCRYPTION_KEY` | Base64 32 bytes | All | **Yes** ⚠️ |
| `RESEND_API_KEY` | Dari Resend | All | **Yes** ⚠️ |
| `RESEND_FROM_EMAIL` | `"Brand <noreply@domain.com>"` | All | No |
| `SEND_EMAIL_HOOK_SECRET` | Dari Supabase hook | All | **Yes** ⚠️ |

**Tips:**
- Paste env vars bulk: ada tombol **Paste .env** — paste langsung dari `.env.local` kamu
- Gunakan **Sensitive** flag untuk semua yang marked ⚠️ — Vercel akan hide value setelah save
- `ENCRYPTION_KEY` **harus identik** di semua environment yang share database. Beda key = encrypted data gak bisa di-decrypt.

### 5.4 Deploy

1. Click **Deploy**
2. Tunggu 2-5 menit. Kamu lihat log build real-time
3. Kalau sukses: ada URL production (`https://your-app.vercel.app`) + preview dari main branch

### 5.5 Update Supabase Redirect URLs + Hook URL

**Penting**: sekarang ambil URL production → balik ke Supabase:

**A. URL Configuration:**
1. **Authentication** → **URL Configuration**
2. **Site URL**: ganti dari `localhost:3000` ke `https://your-app.vercel.app`
3. **Redirect URLs**: tambah:
   ```
   https://your-app.vercel.app/api/auth/callback
   https://your-app.vercel.app/api/auth/confirm
   https://your-app.vercel.app/**
   https://*-your-vercel-username.vercel.app/**
   ```
4. **Save**

**B. Send Email Hook URL:**
1. **Authentication** → **Hooks** → **Send Email Hook**
2. Update **Hook URL** → `https://your-app.vercel.app/api/auth/hooks/send-email`
3. **Save**

### 5.6 Update Google OAuth (kalau dipakai)

Di Google Cloud Console → **Credentials** → OAuth client yang kamu bikin:

1. **Authorized JavaScript origins**: tambah `https://your-app.vercel.app`
2. **Authorized redirect URIs**: tetap hanya `https://<project>.supabase.co/auth/v1/callback` (Supabase yang handle)
3. **Save**

### 5.7 Test Production

1. Buka `https://your-app.vercel.app`
2. Sign up user baru atau login dengan admin
3. Trigger magic link → cek email masuk (bukan spam), click link → sampe dashboard
4. Trigger forgot password → cek email → click link → `/reset-password` → new password works
5. Verify: login flow, logout, role-based redirect jalan

### 5.8 Custom Domain (Opsional)

Kalau punya domain sendiri:

1. Vercel Dashboard → project → **Settings** → **Domains**
2. **Add** → masukin domain (misal `app.yourcompany.com`)
3. Vercel kasih DNS records — tambah di DNS provider kamu (Cloudflare, Namecheap, dll)
   - `A` record → `76.76.21.21`
   - Atau `CNAME` → `cname.vercel-dns.com`
4. Wait propagation (~5 menit sampai 48 jam)
5. Once verified, **update lagi:**
   - Site URL & Redirect URLs di Supabase
   - Send Email Hook URL di Supabase
   - `NEXT_PUBLIC_APP_URL` di Vercel env
   - Google OAuth origins kalau dipakai

---

## 6. Deploy Alternatif (Non-Vercel)

Vercel bukan satu-satunya pilihan. Berikut alternatif utama.

### 6.1 Netlify

Mirip Vercel:

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. Pilih repo → Framework auto-detect Next.js
3. Build command: `pnpm build`
4. Publish directory: `.next`
5. Environment variables: paste seperti di Vercel
6. Deploy

### 6.2 Self-Hosted (VPS, Docker)

Untuk kamu yang butuh kontrol penuh.

**Dockerfile** (create di root project):

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN npm i -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

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
  -e ENCRYPTION_KEY=... \
  -e RESEND_API_KEY=... \
  -e RESEND_FROM_EMAIL="My App <noreply@domain.com>" \
  -e SEND_EMAIL_HOOK_SECRET=... \
  -e NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -e NEXT_PUBLIC_APP_NAME="My App" \
  my-app
```

Deploy Docker image ke:
- **Railway** — [railway.app](https://railway.app)
- **Render** — [render.com](https://render.com)
- **Fly.io** — [fly.io](https://fly.io)
- **DigitalOcean App Platform** — [digitalocean.com/products/app-platform](https://digitalocean.com/products/app-platform)
- **AWS ECS / Google Cloud Run** — untuk enterprise

Setelah deploy, **balik ke Supabase update Redirect URLs + Hook URL** dengan domain baru (section 5.5 logic sama).

### 6.3 Cloudflare Pages

Works, tapi ada beberapa Next.js features yang perlu workaround (middleware, dynamic routes). Recommended cuma untuk static-heavy apps. Skip kalau tidak punya alasan kuat.

---

## 7. Post-Deploy Verification

Setelah production live, wajib run verifikasi.

### 7.1 Smoke Test Checklist

Buka production URL, verify:

| # | Test | Expected |
|---|---|---|
| 1 | Buka homepage anonymous | Redirect ke `/login` |
| 2 | Login page tampil | Brand name & logo sesuai `.env` Vercel |
| 3 | Sign up user baru (kalau allowPublicSignup) | Akun dibuat, profile auto-created |
| 4 | Login user biasa | Redirect ke `/dashboard` |
| 5 | Login admin (role=super_admin) | Redirect ke `/admin` |
| 6 | Akses `/admin` sebagai user biasa | Redirect ke `/dashboard` |
| 7 | Google OAuth (kalau enabled) | Redirect ke Google → consent → back to app |
| 8 | **Magic link request** | Email sampe ke inbox (bukan spam) dengan custom template |
| 9 | **Click magic link** | Landed di dashboard, session active |
| 10 | **Forgot password request** | Email sampe, click → `/reset-password` page |
| 11 | **Reset password submit** | Password updated, bisa login dengan password baru |
| 12 | Logout | Redirect ke `/login`, session clear |
| 13 | Akses halaman proteksi tanpa login | Redirect ke `/login?returnTo=/profile`, setelah login landing di `/profile` |

### 7.2 Database Verify di Supabase

```sql
-- 1. Tables intact
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles', 'activity_logs',
    'commerce_credentials', 'commerce_webhook_configs',
    'commerce_webhook_events', 'commerce_orders',
    'commerce_subscriptions', 'commerce_customers'
  );
-- Expected: 8 rows

-- 2. User count
SELECT count(*) as total_users FROM public.user_profiles;

-- 3. Admin exists
SELECT email, role FROM public.user_profiles
WHERE role IN ('super_admin', 'admin');
-- Expected: minimal 1 admin

-- 4. Recent activity
SELECT action, user_id, created_at FROM public.activity_logs
ORDER BY created_at DESC LIMIT 20;
```

### 7.3 Verify Email Delivery

Cek di Resend dashboard:

1. **Emails** tab → lihat log email yang dikirim
2. Status:
   - ✅ **Delivered** — sampe inbox
   - 🟡 **Sent** — udah dikirim, belum confirm delivery
   - ❌ **Bounced** / **Failed** — masalah di recipient atau domain config

Kalau banyak bounce → cek DKIM/SPF/DMARC setup di Resend.

### 7.4 Verify Supabase Hook Calling

1. Trigger auth email (forgot password dari production URL)
2. Supabase Dashboard → **Logs** → filter by `auth`
3. Cari entry yang `function: send_email_hook` — status harus `200`
4. Kalau `500` / `401` → cek hook logs di Vercel Functions

### 7.5 Check Vercel Build & Runtime Logs

1. Vercel Dashboard → project → **Deployments**
2. Pilih latest deployment → tab **Logs** (atau **Functions** untuk server logs)
3. Expected: zero `ERROR` log. Warning boleh (misal Image optimization disabled kalau belum setup).
4. Filter by `/api/auth/hooks/send-email` — harus ada incoming POST tiap ada auth email trigger

### 7.6 Performance Check (optional)

Run Lighthouse di production:

1. Chrome DevTools (F12) → **Lighthouse** tab
2. Pilih **Mobile**, **Performance + Accessibility + Best Practices + SEO**
3. Click **Analyze page load**

Target Phase 2:
- Performance: 85+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

Kalau jauh di bawah, cek image optimization, unused JS, dll.

---

## 8. Operational Tasks

Task rutin yang perlu tahu cara-nya.

### 8.1 Tambah Admin User Baru

```sql
-- Di Supabase SQL Editor
-- Step 1: user harus sudah sign up dulu via UI atau Dashboard Auth
-- Step 2: elevate role
UPDATE public.user_profiles
SET role = 'super_admin'  -- atau 'admin', 'editor', 'viewer'
WHERE email = 'new-admin@example.com';
```

### 8.2 Deactivate User

```sql
UPDATE public.user_profiles
SET is_active = false
WHERE email = 'user-to-deactivate@example.com';
```

User masih bisa login ke Supabase Auth, **tapi login form di boilerplate akan reject dengan error "accountDeactivated"** karena cek `is_active = true`.

### 8.3 Reactivate User

```sql
UPDATE public.user_profiles
SET is_active = true
WHERE email = 'user@example.com';
```

### 8.4 Delete User (Completely)

```sql
-- Cascade: delete auth user → trigger remove user_profiles row juga
DELETE FROM auth.users WHERE email = 'user-to-delete@example.com';
```

⚠️ **Irreversible.** Backup dulu kalau perlu.

### 8.5 Query Activity Log

```sql
-- Recent activity
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

-- Login in last 24 hours
SELECT count(*) FROM public.activity_logs
WHERE action = 'user.login'
  AND created_at > now() - interval '24 hours';

-- Activity by specific user
SELECT action, metadata, created_at
FROM public.activity_logs
WHERE user_id = (SELECT id FROM public.user_profiles WHERE email = 'user@example.com')
ORDER BY created_at DESC;
```

### 8.6 Rotate Resend API Key

Kalau key bocor:

1. Resend Dashboard → **API Keys** → **Create API Key** (bikin baru)
2. Copy key baru
3. Update `RESEND_API_KEY` di Vercel → **Redeploy**
4. Setelah redeploy sukses & verified, delete key lama di Resend

### 8.7 Rotate Supabase Send Email Hook Secret

Kalau secret bocor:

1. Supabase Dashboard → **Authentication** → **Hooks** → **Send Email Hook**
2. Click **Regenerate secret** (atau disable + enable lagi)
3. Copy secret baru
4. Update `SEND_EMAIL_HOOK_SECRET` di Vercel → **Redeploy**

### 8.8 Change Email Template Content

Email template ada di `src/shared/email/templates/`:

- `magic-link.tsx` — magic link + new user signup
- `recovery.tsx` — password reset
- `confirm-signup.tsx` — invite
- `email-change.tsx` — email change confirmation
- `reauthentication.tsx` — 6-digit OTP

Edit → commit → push → Vercel auto-deploy. Email berikutnya pake template baru.

**Preview template di local:**

```bash
pnpm email dev
```

(butuh `react-email` dev dependency — udah include di `package.json`)

Browser kebuka [http://localhost:3001](http://localhost:3001) — live preview semua template.

### 8.9 Change Branding (Re-brand)

Zero-code rebrand:

1. Update env vars (Vercel Dashboard → Settings → Environment Variables)
2. Replace files di `public/branding/` → commit & push
3. Vercel auto-redeploy → aplikasi jadi brand baru (termasuk email template yang pake `brandingConfig`)

### 8.10 Enable / Disable Auth Provider

Edit `src/config/app.config.ts`:

```ts
auth: {
  providers: ["email", "google", "magic-link"] as const,  // enable semua
  // providers: ["email"] as const,  // cuma email
  // ...
}
```

Commit → push → Vercel rebuild → login page otomatis adjust UI.

### 8.11 Rotate Supabase Service Role Key

Kalau key bocor:

1. Supabase Dashboard → **Project Settings** → **API** → **Reset `service_role` secret**
2. Copy key baru
3. Vercel Dashboard → **Settings** → **Environment Variables** → update `SUPABASE_SERVICE_ROLE_KEY`
4. Trigger redeploy (Vercel → **Deployments** → pilih latest → **Redeploy**)

### 8.12 Rotate Encryption Key

⚠️ **Ini operasi berisiko.** `ENCRYPTION_KEY` dipakai buat encrypt LS credentials & webhook secrets. Rotate = semua encrypted data harus di-re-encrypt.

Proses:

1. Decrypt semua `commerce_credentials.encrypted_api_key` + `commerce_webhook_configs.encrypted_secret` pake key lama
2. Encrypt ulang pake key baru
3. Update env dengan key baru
4. Deploy

Gak ada auto-rotation mechanism. Kalau belum siap, biarin key lama aman di secret manager.

### 8.13 Backup Database

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

### 8.14 Disable Email Temporarily (Emergency)

Kalau Resend down / bocor / bill limit hit:

**Option A — Fallback ke Supabase default SMTP:**
1. Supabase Dashboard → **Auth** → **Hooks** → **Send Email Hook** → **Disable**
2. Supabase auto-fallback pake default SMTP (limit rendah, tapi functional)

**Option B — Complete email disable:**
1. Disable magic link / signup di `app.config.ts`:
   ```ts
   auth: {
     providers: ["email"] as const,  // remove "magic-link"
     allowPublicSignup: false,
     requireEmailVerification: false,
   }
   ```
2. User cuma bisa login email+password existing. Forgot password flow mati.

Pulih Resend? Enable hook lagi, revert config.

---

## 9. Troubleshooting

### 9.1 `NEXT_PUBLIC_SUPABASE_URL is not defined`

**Cause:** env var nggak ke-load.

**Fix:**
- Local: pastikan file namanya `.env.local` (bukan `.env`), pastikan di root project
- Vercel: cek Settings → Environment Variables, pastikan scope include **Production**
- Restart dev server setelah edit `.env.local`

### 9.2 Google OAuth: "redirect_uri_mismatch"

**Cause:** Redirect URI di Google Console nggak match dengan yang dipakai Supabase.

**Fix:**
- Google Console → Credentials → OAuth client → **Authorized redirect URIs**
- Harus ada: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback` (bukan URL app kamu)

### 9.3 Magic Link email gak sampai

**Cause & Fix (urut dari paling common):**

1. **Hook belum di-set / URL salah** → Supabase Dashboard → Auth → Hooks → verify URL benar
2. **Hook return 401** → Secret salah. Regenerate di Supabase, update `SEND_EMAIL_HOOK_SECRET` di Vercel, redeploy
3. **Hook return 500** → Cek Vercel Function logs. Common: `RESEND_API_KEY` missing atau invalid, domain Resend belum verified
4. **Email masuk spam** → Cek DKIM/SPF/DMARC di Resend dashboard, harus semua ✅
5. **Resend domain not verified** → Resend Dashboard → Domains → check DNS status
6. **Rate limit Resend hit** → Free tier 100 email/hari, upgrade atau wait

Debug:
```
Supabase Dashboard → Logs → filter auth + send_email_hook
→ Cari entry yang error
→ Vercel Functions Logs → cari timestamp yang match → baca error detail
```

### 9.4 Email sampai tapi click link error "auth_callback_error"

**Cause:** Link di email pointing ke endpoint yang salah, atau token_hash udah expired.

**Fix:**
- Verify `buildVerificationUrl()` di `send-auth-email.tsx` pointing ke `/api/auth/confirm` (bukan `/api/auth/callback`)
- Token_hash default expire 1 jam. Kalau click link >1 jam setelah email dikirim → expired, request ulang
- Cek `NEXT_PUBLIC_APP_URL` di Vercel — harus match domain production

### 9.5 Hook endpoint return 500 "server_misconfigured"

**Cause:** `SEND_EMAIL_HOOK_SECRET` belum di-set atau format salah.

**Fix:**
- Vercel → Environment Variables → verify `SEND_EMAIL_HOOK_SECRET` exists + scope include Production
- Value **harus** include prefix `v1,` — format: `v1,whsec_xxxxxxxxxx`
- Kalau copy-paste manual, pastikan gak ada trailing whitespace

### 9.6 Hook endpoint return 401 "invalid_signature"

**Cause:** Secret di app ≠ secret di Supabase dashboard.

**Fix:**
- Supabase Dashboard → Auth → Hooks → Regenerate secret
- Copy EXACT value (termasuk `v1,whsec_` prefix) → update `SEND_EMAIL_HOOK_SECRET` di Vercel
- Redeploy

### 9.7 Resend error "Domain is not verified"

**Cause:** Sender di `RESEND_FROM_EMAIL` pake domain yang belum verified.

**Fix:**
- Resend Dashboard → Domains → cek status, harus ✅ **Verified**
- Kalau Pending → tunggu DNS propagate (up to 48h)
- Kalau Failed → re-check DNS records (SPF, DKIM, DMARC), harus match yang dikasih Resend

### 9.8 Login sukses tapi redirect ke `/login` lagi

**Cause:** Session cookie nggak ke-set, biasanya karena redirect URL mismatch.

**Fix:**
- Supabase Dashboard → Authentication → URL Configuration
- Verify **Site URL** = domain production kamu
- Verify **Redirect URLs** include domain + `/api/auth/callback` + `/api/auth/confirm`
- Hard refresh browser (Ctrl+Shift+R), hapus cookies

### 9.9 Admin user akses `/admin` tapi redirect ke `/dashboard`

**Cause:** Role di DB belum `super_admin` atau `admin`.

**Fix:**
```sql
SELECT email, role FROM public.user_profiles WHERE email = 'your-email@example.com';
-- Kalau role bukan admin, elevate:
UPDATE public.user_profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

Logout → login ulang (biar session fetch role baru).

### 9.10 `pnpm build` error: "Module not found: '@/core/...'"

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

### 9.11 `pnpm build` error: "Can't resolve '@react-email/render'"

**Cause:** Dependencies email module belum di-install.

**Fix:**
```bash
pnpm add resend @react-email/components @react-email/render standardwebhooks
pnpm add -D react-email
```

### 9.12 Vercel build fail: "Command exited with 1"

**Cause:** Bisa beberapa hal.

**Fix (urut dari paling common):**
1. Cek Vercel build logs untuk error message exact
2. TypeScript error → run `pnpm tsc --noEmit` di local, fix
3. Missing env var → tambah di Vercel Settings → Environment Variables → Redeploy
4. Outdated deps → `rm -rf node_modules pnpm-lock.yaml && pnpm install` di local, commit baru

### 9.13 Avatar upload fail: 403 Forbidden

**Cause:** Path upload nggak sesuai convention atau RLS policy.

**Fix:**
- Path **harus** diawali dengan `<user_id>/...` (misal `<user_id>/avatar.png`)
- RLS policy `avatars_user_upload` cek `(storage.foldername(name))[1] = auth.uid()::text`
- Contoh code upload benar:
  ```ts
  const filePath = `${user.id}/avatar-${Date.now()}.png`;
  await supabase.storage.from("avatars").upload(filePath, file);
  ```

### 9.14 LS webhook gak dipanggil setelah test purchase

**Cause:** Webhook URL / secret mismatch atau LS test mode salah.

**Fix:**
- User dashboard → Settings → Webhooks → verify URL config + secret match di LS dashboard
- LS Dashboard → Webhooks → cek **Recent Deliveries** — kalau 401 berarti secret mismatch
- Kalau LS test mode ≠ credential test mode → webhook gak kirim (LS bedain production vs test)

### 9.15 Deploy sukses tapi production show "500 Internal Server Error"

**Cause:** Umumnya server-side env var hilang.

**Fix:**
- Vercel Dashboard → project → **Logs** (real-time) → cek error message
- Common culprit:
  - `SUPABASE_SERVICE_ROLE_KEY` lupa di-set
  - `ENCRYPTION_KEY` lupa di-set (commerce endpoints crash)
  - `RESEND_API_KEY` lupa di-set (hook endpoint crash saat trigger email)
- Verify semua env var dari section 5.3 udah set di Vercel

---

## 10. Environment Variables Reference

Quick reference. Detail lengkap lihat [ENV_VARS.md](./ENV_VARS.md).

### 10.1 Public (client-side accessible)

| Variable | Required | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | No | `"My App"` |
| `NEXT_PUBLIC_APP_SHORT_NAME` | No | `"App"` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | No | `"A modern web application"` |
| `NEXT_PUBLIC_APP_TAGLINE` | No | `"Welcome"` |
| `NEXT_PUBLIC_APP_KEYWORDS` | No | `"app,web,platform"` |
| `NEXT_PUBLIC_APP_AUTHOR` | No | `""` |
| `NEXT_PUBLIC_APP_PRIMARY_COLOR` | No | `"#16a34a"` |
| `NEXT_PUBLIC_APP_BG_COLOR` | No | `"#ffffff"` |
| `NEXT_PUBLIC_APP_CATEGORY` | No | `"productivity"` |
| `NEXT_PUBLIC_APP_LANG` | No | `"id-ID"` |
| `NEXT_PUBLIC_APP_URL` | Production **wajib** | fallback ke request origin |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | — |

### 10.2 Secret (server-side only)

| Variable | Required | Keterangan |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Service role, bypass RLS |
| `ENCRYPTION_KEY` | **Yes** | Base64 32 bytes, AES-256-GCM |
| `RESEND_API_KEY` | **Yes** | Resend SDK auth |
| `RESEND_FROM_EMAIL` | **Yes** | Sender: `"Name <email@domain.com>"` |
| `SEND_EMAIL_HOOK_SECRET` | **Yes** | Format: `v1,whsec_xxx` |

### 10.3 File `.env.example` (template)

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
NEXT_PUBLIC_APP_BG_COLOR="#ffffff"
NEXT_PUBLIC_APP_CATEGORY="productivity"
NEXT_PUBLIC_APP_LANG="id-ID"

# App URL (wajib production, optional di local)
# NEXT_PUBLIC_APP_URL=https://your-domain.com

# =====================================================================
# Supabase (Required)
# =====================================================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# =====================================================================
# Encryption (Required)
# =====================================================================
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ENCRYPTION_KEY=

# =====================================================================
# Resend — Transactional Email (Required)
# =====================================================================
RESEND_API_KEY=
RESEND_FROM_EMAIL="My App <noreply@yourdomain.com>"

# =====================================================================
# Supabase Send Email Hook (Required)
# =====================================================================
# Dari Supabase Dashboard → Auth → Hooks → Send Email Hook
# Format: v1,whsec_xxxxxxxxxx
SEND_EMAIL_HOOK_SECRET=
```

---

## 📌 Quick Reference

### Command Cheatsheet

```bash
# Local dev
pnpm dev                    # Start dev server di :3000
pnpm build                  # Build production
pnpm start                  # Run production build lokal
pnpm lint                   # Run ESLint
pnpm email dev              # Preview email templates (http://localhost:3001)

# Supabase CLI
supabase login
supabase link --project-ref <REF>
supabase db push            # Apply migrations
supabase gen types typescript --linked > src/core/types/database.ts

# ngrok (dev testing Send Email Hook)
ngrok http 3000

# Vercel CLI (optional)
npm i -g vercel
vercel                      # Deploy preview
vercel --prod               # Deploy to production
vercel env pull             # Download env vars to .env.local
```

### Important URLs

| What | URL pattern |
|---|---|
| Supabase Dashboard | `https://supabase.com/dashboard/project/<PROJECT_REF>` |
| Supabase Auth callback | `https://<PROJECT_REF>.supabase.co/auth/v1/callback` |
| Resend Dashboard | `https://resend.com/emails` |
| Your app (local) | `http://localhost:3000` |
| Your app (Vercel) | `https://<PROJECT_NAME>.vercel.app` |
| OAuth callback | `<YOUR_APP_URL>/api/auth/callback` |
| Email OTP confirm | `<YOUR_APP_URL>/api/auth/confirm` |
| Send Email Hook | `<YOUR_APP_URL>/api/auth/hooks/send-email` |

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

-- Commerce credential count
SELECT count(*) FROM commerce_credentials WHERE owner_user_id IS NOT NULL;

-- Recent webhook events (all users)
SELECT provider, event_name, received_at, processed_at, error
FROM commerce_webhook_events
ORDER BY received_at DESC LIMIT 20;

-- Failed webhooks (need retry/manual recovery)
SELECT * FROM commerce_webhook_events
WHERE processed_at IS NULL AND error IS NOT NULL;
```

---

## 🎯 Checklist: Production Ready?

Copy ini ke issue tracker sebelum go-live:

```
INFRASTRUCTURE
[ ] Supabase project di region yang tepat
[ ] supabase/setup.sql udah di-apply (8 tables + storage)
[ ] Database backups enabled (Supabase → Project Settings → Database)
[ ] RLS policies active di semua tables
[ ] ENCRYPTION_KEY generated dan di-backup ke secret manager

AUTH
[ ] Email provider enabled
[ ] Email confirmation enabled (production)
[ ] Google OAuth configured di Google Console + Supabase (kalau dipakai)
[ ] Redirect URLs include production domain + /**
[ ] Site URL = production domain

SEND EMAIL HOOK
[ ] Hook enabled di Supabase dashboard
[ ] Hook URL pointing ke production domain + /api/auth/hooks/send-email
[ ] Hook secret di-copy ke SEND_EMAIL_HOOK_SECRET env

RESEND
[ ] Domain verified (DKIM ✓ SPF ✓ DMARC ✓)
[ ] API key generated dan di-set di RESEND_API_KEY
[ ] Sender email di RESEND_FROM_EMAIL pake verified domain
[ ] Test email terkirim sukses ke inbox (bukan spam)

HOSTING (Vercel)
[ ] All env vars set di Production + Preview
[ ] SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY, RESEND_API_KEY,
    SEND_EMAIL_HOOK_SECRET marked as Sensitive
[ ] Custom domain configured (kalau ada)
[ ] HTTPS working (Vercel auto)
[ ] NEXT_PUBLIC_APP_URL set ke production domain

VERIFICATION
[ ] 13 smoke tests di section 7.1 pass
[ ] Admin user pertama created
[ ] Magic link flow tested E2E (email masuk + click link + landed di dashboard)
[ ] Forgot password flow tested E2E
[ ] Lighthouse score > 85 (performance)

MONITORING
[ ] Vercel Analytics enabled (optional tapi recommended)
[ ] Supabase Logs reviewed, zero ERROR
[ ] Resend Emails dashboard checked (zero bounce/fail)
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
- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Resend Docs](https://resend.com/docs)
- [React Email](https://react.email/docs)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Lemon Squeezy API](https://docs.lemonsqueezy.com)

### Troubleshooting
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Next.js Issues](https://github.com/vercel/next.js/issues)
- [Vercel Support](https://vercel.com/support)
- [Resend Support](https://resend.com/support)

### Tools
- [Favicon Generator](https://realfavicongenerator.net)
- [OKLCH Color Picker](https://oklch.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [ngrok](https://ngrok.com) — tunnel untuk dev webhook testing

---

## 🔒 Catatan Final

**Phase 2 = pengembangan boilerplate ini SELESAI.** Tidak ada Phase 3. Tidak ada roadmap tambahan.

Dokumen ini di-update terakhir 23 April 2026. Kalau ada perubahan arsitektur (yang seharusnya gak ada karena udah final), update di sini dulu sebelum merge.

Fork dan extend sendiri kalau butuh fitur yang belum ada di boilerplate ini.

**End of Operations Runbook.**