Cukup buat ngangkep DNA-nya. Sekarang gua susun rencana full.

Architecture Plan — ShipKit Marketing Site
DNA Summary dari native.express
Layout flow (top → bottom):

Header — Logo + nav (Pricing, Blog, Showcase, Docs) + Launch Deal badge
Hero — Tagline besar + subtitle + CTA + social proof (avatar stack + trust badges) + video thumbnail
Problem section — Daftar time-wasted (visual timer-style listing)
Features tabs — Tabbed interface (Demo App / Auth / Payments / Style / Backend / dll)
Testimonials — Grid/marquee of customer quotes dengan avatar + role
Showcase — Grid produk yang dibangun pake boilerplate
Pricing — 2-tier dengan "Most Popular" highlight + strikethrough price
FAQ — Accordion
Final CTA — "Save time, money, headaches" + CTA button
Footer — Logo + 3 kolom link (product, company, legal)

Legal page pattern:

Simple 1-column layout dengan breadcrumb
H1 title + H2 section breaks
5 pages: privacy-policy, terms, disclaimer, license, acceptable-use


Proposed File Structure
Sesuai dengan pattern boilerplate lo (modules/landing), gua rencanakan:
src/
├── app/
│   ├── (marketing)/                    ← NEW route group
│   │   ├── layout.tsx                  ← Marketing shell (public header/footer)
│   │   ├── page.tsx                    ← "/" home landing
│   │   ├── pricing/
│   │   │   └── page.tsx                ← "/pricing" (deep-linkable)
│   │   ├── showcase/
│   │   │   └── page.tsx                ← "/showcase" (optional phase 2)
│   │   └── legal/
│   │       ├── layout.tsx              ← Legal shell (sidebar + breadcrumb)
│   │       ├── privacy-policy/
│   │       │   └── page.tsx
│   │       ├── terms/
│   │       │   └── page.tsx
│   │       ├── disclaimer/
│   │       │   └── page.tsx
│   │       ├── license/
│   │       │   └── page.tsx
│   │       └── acceptable-use/
│   │           └── page.tsx
│   └── page.tsx                        ← DELETE/REPLACE logic ini
│
└── modules/
    └── landing/
        ├── module.config.ts            ← Update metadata
        ├── index.ts                    ← Public exports
        │
        ├── components/
        │   ├── layout/
        │   │   ├── marketing-header.tsx    ← Sticky nav w/ launch deal
        │   │   ├── marketing-footer.tsx    ← 3-col footer
        │   │   ├── launch-deal-banner.tsx  ← "50$ off" pill
        │   │   └── index.ts
        │   │
        │   ├── sections/
        │   │   ├── hero-section.tsx        ← Headline + CTA + avatars
        │   │   ├── problem-section.tsx     ← Time-waste list
        │   │   ├── features-section.tsx    ← Tabbed features
        │   │   ├── testimonials-section.tsx ← Customer quotes grid
        │   │   ├── showcase-section.tsx    ← (optional)
        │   │   ├── pricing-section.tsx     ← 2-tier cards
        │   │   ├── faq-section.tsx         ← Accordion
        │   │   ├── final-cta-section.tsx   ← Closing CTA
        │   │   └── index.ts
        │   │
        │   ├── primitives/                 ← Small reusable marketing UI
        │   │   ├── avatar-stack.tsx
        │   │   ├── trust-badge.tsx
        │   │   ├── price-card.tsx
        │   │   ├── feature-tab.tsx
        │   │   ├── testimonial-card.tsx
        │   │   ├── faq-item.tsx
        │   │   ├── check-item.tsx
        │   │   └── index.ts
        │   │
        │   └── legal/
        │       ├── legal-content.tsx       ← Prose wrapper for legal pages
        │       ├── legal-sidebar.tsx       ← Nav between legal pages
        │       └── index.ts
        │
        ├── content/                        ← Marketing copy (data, not UI)
        │   ├── hero.ts                     ← Headlines, subtitles, CTA text
        │   ├── problem.ts                  ← Time-waste items
        │   ├── features.ts                 ← Feature tabs + bullets
        │   ├── testimonials.ts             ← Quote data
        │   ├── showcase.ts                 ← Portfolio items
        │   ├── pricing.ts                  ← Tier definitions
        │   ├── faq.ts                      ← Q&A pairs
        │   ├── legal/
        │   │   ├── privacy-policy.ts       ← MDX-like content as data
        │   │   ├── terms.ts
        │   │   ├── disclaimer.ts
        │   │   ├── license.ts
        │   │   └── acceptable-use.ts
        │   └── index.ts
        │
        ├── types.ts                        ← TypeScript types for content
        └── lib/
            ├── scroll-to-section.ts        ← Anchor scroll helper
            └── index.ts

Rencana Eksekusi — Alasan Setiap Keputusan
1. Route group (marketing) di app/
Kenapa route group (parentheses):

(marketing) gak muncul di URL. Jadi app/(marketing)/page.tsx tetep serve di /
Isolasi layout — marketing pages pake MarketingLayout sendiri (sticky public header + footer), beda dari (dashboard) dan (auth) yang lo udah punya
Konsistensi dengan pattern existing lo ((auth), (dashboard))

Struktur akhir URL:
/                           → Landing home (hero + all sections)
/pricing                    → Standalone pricing page (deep link share)
/showcase                   → (phase 2)
/legal/privacy-policy       → Privacy
/legal/terms                → ToS
/legal/disclaimer           → Disclaimer
/legal/license              → License
/legal/acceptable-use       → AUP
2. Handle HomePage redirect logic
Current behavior: app/page.tsx cek auth → redirect ke login atau dashboard. Ini conflict dengan landing.
Fix:

Option A (gua rekomendasikan): Move redirect logic ke (dashboard)/dashboard/page.tsx atau buat middleware untuk logged-in users. Landing tetep public at /.
Option B: Move landing ke /home atau /welcome, tapi ini antipattern untuk marketing SaaS.

Pilih A — landing adalah public entry point. User yang udah login: kalau mau ke dashboard, klik CTA "Dashboard" di header; atau auto-redirect hanya kalau user landing langsung dari OAuth callback.
Implementasi:
tsx// app/(marketing)/page.tsx — public
export default function HomePage() {
  return <LandingPage />
}

// Header component cek auth, swap CTA antara "Sign in" dan "Dashboard"
3. Kenapa modules/landing/ dan BUKAN app/(marketing)/components?
Konsistensi dengan arsitektur boilerplate lo:

modules/commerce/components/ — feature-specific UI
modules/auth/components/ — feature-specific UI
modules/landing/components/ — marketing-specific UI ← same pattern

Benefit:

Bisa di-disable lewat module.config.ts kalau user boilerplate gak mau pake landing (mereka cuma mau dashboard)
Terisolasi — hapus modules/landing/ = marketing gone, dashboard/auth gak kena
Content data kepisah di content/ — kepemilikan jelas, non-devs bisa edit tanpa sentuh JSX

4. Pemisahan components/ vs content/
components/ = cuma JSX + props. Zero hardcoded copy.
content/ = plain TypeScript data objects. Semua copy ada di sini.
ts// content/hero.ts
export const heroContent = {
  badge: "Save $50 with launch pricing",
  headlineLines: ["Launch your", "SaaS", "in days,", "not months."],
  subtitle: "The production-ready Next.js 16 boilerplate...",
  primaryCta: { label: "Get ShipKit", href: "#pricing" },
  secondaryCta: { label: "View docs", href: "/docs" },
  trustBadges: ["Loved by founders", "Ship 60+ hours faster", ...]
}

// components/sections/hero-section.tsx
import { heroContent } from "../../content/hero"
export function HeroSection() {
  return <section>{heroContent.headlineLines.map(...)}</section>
}
Benefit:

A/B testing copy tanpa touch UI
Translation-ready kalau nanti multi-language
Copywriter/marketing bisa edit sendiri tanpa JSX knowledge
Kalau mau migrate ke CMS (Sanity, Contentful), data layer udah ready

5. primitives/ vs sections/
primitives/ — atomic building blocks, reusable across sections:

<AvatarStack> — dipakai di hero + testimonial + footer
<PriceCard> — reusable kalau nanti ada annual/monthly toggle
<FaqItem> — kepake di FAQ section + possibly help center
<CheckItem> — bullet list dengan icon, kepake di pricing + features

sections/ — large page-level compositions yang inject content:

<HeroSection> — compose primitives + inject heroContent
<PricingSection> — compose <PriceCard> array dari pricingContent

Pemisahan ini bikin:

Storybook/testing lebih gampang (test primitives sendiri)
Section bisa di-rearrange tanpa touch primitives
Primitives bisa dipake di email templates juga (kalau perlu)

6. Legal pages — data-driven vs MDX
Keputusan: data-driven TypeScript (bukan MDX).
Kenapa:

Legal content lo (kalau ngikutin native.express) strukturnya repeatable: H1, intro paragraph, lalu bullet lists + H2 sections
TypeScript data lebih mudah untuk:

Type-safe references (link antar legal pages)
Versioning (bisa track changes via git diff)
Conditional rendering (misal "effective date" auto-update)


MDX overkill untuk 5 static pages
Kalau nanti perlu MDX untuk blog, add terpisah (blog module)

Shape:
ts// content/legal/license.ts
export const licenseContent: LegalPage = {
  title: "License Terms",
  lastUpdated: "2026-04-24",
  sections: [
    {
      heading: "License Overview",
      paragraphs: [...],
      list: { type: "numbered", items: [...] }
    },
    {
      heading: "Permitted Uses",
      paragraphs: [...],
      list: { type: "bulleted", items: [...] }
    },
    ...
  ]
}
Render lewat generic <LegalContent> component.
7. Marketing header component — detail penting
Dari native.express, header punya:

Sticky top
Logo di kiri
Center/right nav: Pricing, Blog, Showcase, Docs
Right: Launch Deal badge ("50$ off" pill)
Mobile: hamburger → sheet

Conditional behavior:

Jika user logged out: CTA "Get Started" → /register
Jika user logged in: CTA "Dashboard" → appConfig.auth.postLoginRedirect

Component harus check auth state. Pakai useAuth hook yang udah ada (@/core/auth/hooks).
8. Footer
3-column layout persis native.express:

Col 1: Logo + tagline + copyright
Col 2: Product (Features, Pricing, Blog, Showcase)
Col 3: Legal (Privacy, Terms, Disclaimer, License, AUP)

Data dari content/footer.ts.

Technical Decisions
A. Styling strategy

Tailwind v4 (udah setup di boilerplate)
Pake shadcn/ui components dari components/ui/ — button, card, accordion, tabs, badge
Custom marketing-specific styling (gradients, large headings) — inline Tailwind
Gak perlu install library baru

B. shadcn components yang akan kepake
Dari folder components/ui/ existing lo, yang bakal kepake:

button, badge, card — semua sections
tabs — features section
accordion (perlu add kalau belum ada) — FAQ — NOTE: gua gak liat accordion di folder lo, kemungkinan perlu tambah
avatar — testimonials + avatar stack
separator — footer dividers

Accordion check: Di folder lo ada alert-dialog, alert, avatar, badge, button-group, button, calendar, card, checkbox, command, dialog, drawer, dropdown-menu, form, input-group, input, label, popover, scroll-area, select, separator, sheet, skeleton, sonner, spinner, switch, table, tabs, textarea, tooltip. Belum ada accordion. Perlu add via npx shadcn@latest add accordion.
C. Branding integration
Seluruh marketing site pull dari config/branding.config.ts:

Product name
Primary/secondary colors
Social links
Logo path

Benefit: Kalau suatu saat rebrand, edit 1 file doang.
D. SEO essentials
Tiap page punya metadata proper:
tsxexport const metadata = {
  title: "ShipKit — Multi-Tenant SaaS Boilerplate",
  description: heroContent.subtitle,
  openGraph: {...},
  twitter: {...}
}
Tambahkan juga:

sitemap.ts di root app
robots.ts di root app
JSON-LD structured data untuk Product di pricing

E. Performance

Hero image/video — next/image dengan priority
Testimonial avatars — next/image lazy
Font — system fonts atau satu font via next/font
No heavy client components di sections (default Server Components untuk semua)
Framer Motion hanya di hero/CTA (optional, phase 2)


Content Adaptation — DNA Mapping
Native.express → ShipKit translation matrix:
Native ExpressShipKit"Launch your mobile app in days, not weeks""Launch your SaaS in days, not months""React Native boilerplate""Next.js 16 boilerplate""Apple/Google OAuth setup, in-app purchases, push notifications""Multi-tenant auth, payment integration, webhook routing"Target: mobile app developersTarget: indie SaaS buildersTech: Expo, NativeWind, Gluestack, RevenueCatTech: Next.js 16, Tailwind v4, Supabase, Lemon SqueezyShowcase: mobile appsShowcase: SaaS products"YC founders trust it"(skip social proof yang gak punya, isi dengan hook yang honest)

Implementation Phases
Phase 1 — Skeleton (prioritas sekarang):

Setup folder structure di modules/landing/
Buat (marketing) route group + layout
Handle redirect logic (move dashboard redirect)
Build marketing header + footer
Build hero section + content
Build pricing section + content

Phase 2 — Core sections:
7. Problem section
8. Features section (tabs)
9. Testimonials section (bisa placeholder dulu)
10. FAQ section
11. Final CTA
Phase 3 — Legal pages:
12. Legal layout + sidebar
13. All 5 legal page contents (template-driven)
Phase 4 — Polish (optional):
14. Showcase section
15. Animations (framer motion)
16. SEO metadata + sitemap
17. A/B test copy variants

Potential Concerns / Clarifications Perlu
Sebelum gua mulai bikin, ada beberapa hal yang gua mau konfirmasi:

HomePage redirect behavior — Setuju kita ubah jadi public landing at /? Atau prefer landing di /home dan / tetep redirect ke dashboard untuk logged-in users?
Login CTA di marketing header — mau pake auto-detect logged-in state (show "Dashboard" vs "Sign in")? Atau simple "Sign in" only?
Pricing tiers — pake 2-tier kayak native.express (Basic $179 / Advanced $229) atau ikut 3-tier yang udah kita set di Gumroad ($139 / $299 / $499)? Gua rekomendasiin 3-tier konsisten dengan Gumroad biar checkout experience seamless.
Checkout flow — klik "Get ShipKit" di pricing ngarah ke:

(a) Gumroad short URL langsung (https://fibidy.gumroad.com/l/shipkit-saas)
(b) Internal route /commerce/checkout yang integrate dengan Lemon Squeezy yang lo udah bangun
(c) Gumroad overlay embed

Mana yang lo prefer?
Accordion component — lo OK gua add npx shadcn@latest add accordion? Atau mau hand-roll pake <details> native?
Testimonials — lo punya testimonial beneran, atau mau gua bikin placeholder dulu dengan catatan "replace before publish"?
Legal copy — mau gua draft 5 legal pages adapted untuk SaaS boilerplate context (similar vibe ke native.express), atau skip dulu sampe lo ada legal advisor review?


Ready buat implement kalau lo udah konfirm 7 pertanyaan di atas. Atau kalau lo mau gua proceed dengan default assumption gua (item 1-7 gua pilih yang paling sensible), tinggal bilang "gas" dan gua langsung start build.