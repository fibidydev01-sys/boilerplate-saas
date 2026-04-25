# Next.js 16 Multi-Tenant SaaS Boilerplate

A production-ready Next.js 16 + Supabase + Lemon Squeezy boilerplate for
indie SaaS builders. Multi-tenant commerce, encrypted credentials, full
authentication layer, and reference-grade documentation.

> **One license. One developer. Unlimited projects. Lifetime updates.**

---

## What's inside

- **Next.js 16** with App Router, React 19, Tailwind CSS v4, TypeScript strict
- **Supabase** — auth, database, storage, with Row-Level Security enforced
- **Lemon Squeezy** — multi-tenant commerce with per-user encrypted credentials
- **Resend** — transactional email with React Email templates
- **8 module slots** — 2 production-ready, 6 staged for your domain
- **62-page Docusaurus reference** — every feature documented

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Language | TypeScript (strict mode) |
| Auth + DB | Supabase (with RLS) |
| Payments | Lemon Squeezy (multi-tenant) |
| Email | Resend + React Email |
| State | Zustand (granular selectors) |
| Forms | React Hook Form + Zod |
| Docs | Docusaurus |

---

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set the required variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Encryption key for storing user credentials (32 bytes hex)
ENCRYPTION_KEY="..."

# Resend
RESEND_API_KEY="..."

# App branding (env-driven, ganti tanpa code change)
NEXT_PUBLIC_APP_NAME="Your App"
NEXT_PUBLIC_APP_SHORT_NAME="App"
NEXT_PUBLIC_APP_DESCRIPTION="A modern web application"
NEXT_PUBLIC_APP_SUPPORT_EMAIL="hello@yourapp.com"
NEXT_PUBLIC_APP_LEGAL_JURISDICTION="Indonesia"
NEXT_PUBLIC_APP_PURCHASE_URL=""
NEXT_PUBLIC_APP_AUTH_BG=""
```

### 3. Run database migrations

```bash
# Apply migrations to your Supabase project
pnpm db:seed
```

### 4. Start development server

```bash
pnpm dev
```

Open `http://localhost:3000` to see the landing page.

---

## Architecture

### Config-driven design

Three config files control the entire boilerplate:

```
src/config/
├── app.config.ts          # Modules, auth, payment, locale
├── branding.config.ts     # Identity (env-driven)
└── permissions.config.ts  # RBAC matrix with wildcards
```

Change branding without touching code: edit `.env.local`, the entire app
updates — landing pages, legal docs, dashboard header, sidebar, email
templates, PWA manifest, all of it.

### Module system

Eight module slots with strict isolation rules:

| Module | Status | Purpose |
|--------|--------|---------|
| `admin` | ✅ Production-ready | Role-gated admin panel |
| `commerce` | ✅ Production-ready | Multi-tenant Lemon Squeezy |
| `landing` | ✅ Production-ready | Marketing pages, legal, pricing |
| `saas` | ⚙️ Skeleton | Your workspace module |
| `blog` | ⚙️ Skeleton | Content publishing |
| `project` | ⚙️ Skeleton | Project management |
| `forum` | ⚙️ Skeleton | Community discussion |
| `chat` | ⚙️ Skeleton | Messaging |

Each module toggles in `app.config.ts`. Disabled modules are excluded from
routing and bundle.

### Authentication

Supabase SSR with dual callback architecture:
- `/api/auth/callback` — PKCE OAuth flow
- `/api/auth/confirm` — Email OTP confirmation

Provider system: `LoginForm` and `RegisterForm` read enabled providers
from `appConfig.auth` and render dynamically. Add Google/GitHub/Apple by
editing the config — no component changes needed.

### Multi-tenant commerce

Each user encrypts their own Lemon Squeezy API key with AES-256-GCM
(`node:crypto`) before persisting. Webhook ingestion uses HMAC-SHA256
timing-safe verification with database-level idempotency via `UNIQUE
(provider, event_id)`.

This means: each user can connect their own Lemon Squeezy account, sell
their own products, and receive their own webhooks — without ever seeing
another user's data.

---

## Branding

Single source of truth: `src/config/branding.config.ts`. Every value is
overridable via environment variable.

| Field | Env var | Default |
|-------|---------|---------|
| `name` | `NEXT_PUBLIC_APP_NAME` | "My App" |
| `shortName` | `NEXT_PUBLIC_APP_SHORT_NAME` | "App" |
| `description` | `NEXT_PUBLIC_APP_DESCRIPTION` | "A modern web application" |
| `tagline` | `NEXT_PUBLIC_APP_TAGLINE` | "Welcome" |
| `supportEmail` | `NEXT_PUBLIC_APP_SUPPORT_EMAIL` | "admin@fibidy.com" |
| `legalJurisdiction` | `NEXT_PUBLIC_APP_LEGAL_JURISDICTION` | "Indonesia" |
| `purchaseUrl` | `NEXT_PUBLIC_APP_PURCHASE_URL` | "" |
| `assets.authBackground` | `NEXT_PUBLIC_APP_AUTH_BG` | (Cloudinary stock) |
| `theme.primaryColor` | `NEXT_PUBLIC_APP_PRIMARY_COLOR` | "#16a34a" |

### Logo assets

Replace files in `public/branding/` to update the app logo everywhere:

```
public/branding/
├── logo.png              192×192  (auth pages, final CTA)
├── logo-sm.png            96×96   (header, sidebar, footer)
├── favicon.ico                    (browser tab)
├── apple-touch-icon.png  180×180  (iOS home screen)
└── icon-{48,72,96,144,192,512}.png  (PWA manifest)
```

One file replacement updates all 6+ surfaces using the logo.

### Marketing & legal content

Content files use `{appName}` placeholders, interpolated at render via the
`interpolateBrand` helper. This keeps content data pure (no runtime imports)
while staying env-driven.

```ts
// src/modules/landing/content/legal/license.ts
export const licenseContent: LegalPage = {
  title: "Solo Developer License",
  intro: ["When you purchase {appName}, you are granted..."],
  // ...
};

// src/app/(marketing)/legal/license/page.tsx
const page = interpolateBrand(licenseContent, brandingConfig.name);
```

---

## Internationalization

Two locales out of the box: English (default) and Indonesian.

```
src/core/i18n/
├── index.ts              # Type-safe key resolver with fallback
└── locales/
    ├── en.json           # Source of truth
    └── id.json
```

Type-safe keys via recursive `NestedKey<Dict>`. Fallback chain:
active locale → English → key.

Add a new locale: drop `xx.json` matching the EN structure, add to
`appConfig.locale.available`.

---

## Project structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Login / register / forgot / reset (50/50 layout)
│   ├── (dashboard)/          # Authenticated app shell
│   ├── (marketing)/          # Landing, pricing, showcase, legal
│   ├── api/                  # Auth callbacks, webhooks
│   └── layout.tsx            # Root layout, metadata, manifest
├── components/ui/            # shadcn/ui primitives
├── config/                   # Three config files (single source of truth)
├── core/                     # Cross-cutting concerns
│   ├── auth/                 # Auth services, hooks, store
│   ├── i18n/                 # Translation resolver
│   ├── layout/               # Header, sidebar, mobile nav
│   ├── lib/                  # Supabase clients, utils, validators
│   └── components/           # Shared components
└── modules/                  # 8 module slots
    ├── admin/                # Production-ready
    ├── auth/                 # Login/register form composers
    ├── commerce/             # Production-ready (Lemon Squeezy)
    ├── landing/              # Production-ready
    └── ...                   # 4 staged skeletons
```

---

## License

Solo Developer License. One developer can use this boilerplate on
unlimited personal projects, unlimited client projects, and their own
commercial products. You cannot resell this boilerplate as a competing
product.

Full terms: `/legal/license` route or `src/modules/landing/content/legal/license.ts`.

### TL;DR

| Allowed | Not allowed |
|---------|-------------|
| Unlimited personal & client projects | Reselling as a boilerplate |
| Selling apps you build with it | Publishing source to public Git |
| Modifying & extending | Repackaging as your own work |
| Lifetime updates | Sharing license with other devs |

---

## Refund policy

Fourteen days, no questions asked. Reply to your purchase receipt to
request a refund.

---

## Support

Documentation-first product. The included Docusaurus reference covers
setup, architecture, every feature, troubleshooting, and deployment.

For genuine bugs and blockers not covered in the docs, reply to your
purchase receipt.

Custom development, private consulting, and hands-on integration work
are not part of the license — those are separate engagements.

---

## Stack credits

Built on the shoulders of giants:

- [Next.js](https://nextjs.org/) — Vercel
- [Supabase](https://supabase.com/) — Postgres + Auth + Storage + RLS
- [Lemon Squeezy](https://www.lemonsqueezy.com/) — Multi-tenant commerce
- [Resend](https://resend.com/) — Transactional email
- [shadcn/ui](https://ui.shadcn.com/) — Component primitives
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) — Form & validation