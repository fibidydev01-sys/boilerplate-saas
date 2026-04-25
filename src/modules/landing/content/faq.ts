import type { FaqContent } from "../types";

/**
 * FAQ content.
 *
 * Brand name uses `{appName}` placeholder — interpolated at render time.
 */
export const faqContent: FaqContent = {
  eyebrow: "FAQ",
  heading: "Frequently asked questions",
  items: [
    {
      question: "What do I get exactly?",
      answer:
        "Complete source code for a production-ready Next.js 16 boilerplate, multi-tenant commerce integration with Lemon Squeezy, encrypted credentials at the database layer, full authentication flows, a permission matrix, activity logging, eight module slots (two production-ready, six staged), and a 62-page Docusaurus reference. All files download immediately after purchase.",
    },
    {
      question: "Is this really one price? No upsells, no tiers?",
      answer:
        "Yes. One tier at $139. Every feature is in the box for everyone. No Pro tier. No 'upgrade to unlock.' No decision paralysis. Stop comparing feature matrices and start building.",
    },
    {
      question: "Do I get lifetime access and updates?",
      answer:
        "Yes. One payment. Every future update is included. When a security patch ships or a dependency gets bumped, it appears in your purchase library automatically.",
    },
    {
      question: "What is the license?",
      answer:
        "Solo Developer License. One developer can use {appName} on unlimited personal projects, unlimited client projects, and their own commercial products. You cannot resell {appName} itself as a boilerplate, starter kit, or competing product. Full terms on the License page.",
    },
    {
      question: "Can I use it for client work?",
      answer:
        "Yes, as long as you are the sole developer working with the source code. You deliver the running application to your client; they receive what you built, not the underlying kit. If they want their in-house team to maintain the code, each developer needs their own license.",
    },
    {
      question: "What if my team grows?",
      answer:
        "Each developer working directly with the {appName} source code needs their own license. Designers, product managers, and clients reviewing the running application do not.",
    },
    {
      question: "Can I get a refund?",
      answer:
        "Fourteen days, no questions asked. Reply to your purchase receipt and the refund is processed.",
    },
    {
      question: "How long does it take to get running?",
      answer:
        "First pnpm dev in ten minutes. First feature shipped by the end of your first day. The getting-started guide walks through every environment variable and first-deploy step.",
    },
    {
      question: "How is {appName} different from other Next.js boilerplates?",
      answer:
        "Most boilerplates fake multi-tenancy by adding a team_id column to every table. {appName} stores each user's Lemon Squeezy credentials encrypted at rest with AES-256-GCM, and the webhook router dispatches events per seller with HMAC-SHA256 timing-safe verification and database-level idempotency. Config-driven architecture means branding, permissions, and feature flags live in one file each, not scattered across forty.",
    },
    {
      question: "What is the tech stack?",
      answer:
        "Next.js 16, React 19, Tailwind CSS v4, TypeScript in strict mode, Supabase for auth and database and storage, Lemon Squeezy for payments, Resend for transactional email, Docusaurus for documentation.",
    },
    {
      question: "How is the module system structured?",
      answer:
        "Eight module slots with strict isolation rules and inward-only dependencies. Two ship production-ready: commerce (multi-tenant Lemon Squeezy with full CRUD) and admin (role-gated). Six are typed, config-wired, and routed — staged for your domain modules: saas, landing, blog, project, forum, chat. Each slot toggles in app.config.ts.",
    },
    {
      question: "I am mainly a backend developer. Can I use this effectively?",
      answer:
        "Yes. The UI is built on shadcn/ui primitives with sensible defaults. You can ship without touching design decisions. When you do need to customize, branding.config.ts is the single source of truth.",
    },
    {
      question: "Is the codebase still being developed?",
      answer:
        "Scope-complete at Phase 2. Future releases are bug fixes, security patches, and dependency upgrades. The codebase you ship with today is the codebase you ship with in twelve months — by design, not by neglect. Build with confidence in a stable foundation.",
    },
    {
      question: "What kind of support comes with the kit?",
      answer:
        "Documentation-first. The 62-page Docusaurus reference covers setup, architecture, every feature, troubleshooting scenarios, and deployment. The kit is self-contained by design — a reference that scales with your project. For genuine bugs, reply to your purchase receipt.",
    },
    {
      question: "Why no Discord or community channel?",
      answer:
        "The kit is reference-complete by design. A documentation-first product scales with your project; a community channel scales with the maintainer's calendar. The kit includes the reference. The community comes from your own builders, not gated behind a tier.",
    },
    {
      question: "Are there any other costs?",
      answer:
        "You pay for the services you use: Supabase (free tier covers most early-stage projects), Lemon Squeezy (transaction fees only, no monthly charges), Resend (free tier covers ten thousand emails). {appName} itself is a one-time payment.",
    },
  ],
};
