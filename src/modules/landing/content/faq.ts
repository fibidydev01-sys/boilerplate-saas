import type { FaqContent } from "../types";

export const faqContent: FaqContent = {
  eyebrow: "FAQ",
  heading: "Frequently asked questions",
  items: [
    {
      question: "What do I get exactly?",
      answer:
        "Complete source code for a production-ready Next.js 16 boilerplate, multi-tenant commerce integration with Lemon Squeezy, encrypted credentials at the database layer, full authentication flows, a permission matrix, activity logging, six module scaffolds, and eighty-eight files of Docusaurus documentation. All files download immediately after purchase.",
    },
    {
      question: "Do I get lifetime access and updates?",
      answer:
        "Yes. One payment. Every future update included. When a new module ships or a dependency gets bumped, you get it.",
    },
    {
      question: "What is the license?",
      answer:
        "Commercial. Use it for unlimited personal and client projects. The only restriction is you cannot resell the boilerplate itself as a boilerplate. Full license terms are on the License page.",
    },
    {
      question: "Can I get a refund?",
      answer:
        "Fourteen days, no questions asked. If it is not a fit, reply to your purchase receipt and the refund is processed the same day.",
    },
    {
      question: "How long does it take to get running?",
      answer:
        "First npm run dev in ten minutes. First feature shipped by the end of your first day. The getting-started guide walks through every environment variable and first-deploy step.",
    },
    {
      question: "How is ShipKit different from other Next.js boilerplates?",
      answer:
        "Most boilerplates fake multi-tenancy by adding a team_id column to every table. ShipKit stores each user's Lemon Squeezy credentials encrypted at rest with AES-256-GCM, and the webhook router dispatches events per seller. Config-driven architecture means branding, permissions, and feature flags live in one file each, not scattered across forty.",
    },
    {
      question: "What is the tech stack?",
      answer:
        "Next.js 16, React 19, Tailwind CSS v4, TypeScript in strict mode, Supabase for auth and database and storage, Lemon Squeezy for payments, Resend for transactional email, Docusaurus for documentation.",
    },
    {
      question: "I am mainly a backend developer. Can I use this effectively?",
      answer:
        "Yes. The UI is built on shadcn/ui primitives with sensible defaults. You can ship without touching design decisions. When you do need to customize, branding.config.ts is the single source of truth.",
    },
    {
      question: "Will you help if I get stuck?",
      answer:
        "Reply to your purchase receipt. Every message gets a response within twenty-four hours. Pro and Agency tiers include access to a private Discord and priority response.",
    },
    {
      question: "Are there any other costs?",
      answer:
        "You pay for the services you use: Supabase (free tier covers most early-stage projects), Lemon Squeezy (transaction fees only, no monthly charges), Resend (free tier covers ten thousand emails). ShipKit itself is a one-time payment.",
    },
  ],
};
