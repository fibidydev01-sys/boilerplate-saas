import type { FeaturesContent } from "../types";

export const featuresContent: FeaturesContent = {
  eyebrow: "Features",
  heading: "Every piece you need to ship a real SaaS",
  tabs: [
    {
      id: "commerce",
      label: "Commerce",
      heading: "Multi-tenant commerce, done right.",
      description:
        "Each user stores their own Lemon Squeezy API key and webhook secret. Credentials are encrypted at rest with AES-256-GCM. The webhook router dispatches events to the correct seller automatically. Real per-seller commerce, not a shared processor wearing a costume.",
      stackBadges: ["Lemon Squeezy", "AES-256-GCM"],
      bullets: [
        {
          title: "Per-user credentials",
          description:
            "Each seller connects their own Lemon Squeezy store. Isolated, encrypted, dispatched correctly.",
        },
        {
          title: "Webhook signature verification",
          description:
            "Every incoming webhook is verified against its seller's secret before any state change.",
        },
        {
          title: "Checkout orchestration",
          description:
            "Typed checkout service with error mapping, currency handling, and i18n-ready error messages.",
        },
        {
          title: "Order and subscription sync",
          description:
            "Full CRUD services for products, orders, customers, and subscriptions.",
        },
      ],
    },
    {
      id: "auth",
      label: "Auth",
      heading: "Production-grade authentication on day one.",
      description:
        "Supabase Auth wired up with OAuth PKCE and email OTP flows. Two separate callback routes handled correctly so you never end up with broken redirects or stale sessions.",
      stackBadges: ["Supabase Auth"],
      bullets: [
        {
          title: "OAuth PKCE",
          description:
            "Google, GitHub, and any Supabase-supported provider. PKCE flow implemented properly.",
        },
        {
          title: "Email OTP and magic links",
          description:
            "Passwordless authentication with branded email templates shipped via Resend.",
        },
        {
          title: "Ready-to-use components",
          description:
            "Sign in, sign up, forgot password, reset password. All typed, all validated.",
        },
        {
          title: "Session hydration",
          description:
            "Server and client session helpers that work with the Next.js App Router out of the box.",
        },
      ],
    },
    {
      id: "permissions",
      label: "Permissions",
      heading: "A permission system you can actually reason about.",
      description:
        "Config-driven permission matrix with wildcard support. One pure can() function. Zero magic strings scattered across forty files. Your future self will thank you at 2 a.m. during an incident.",
      stackBadges: ["TypeScript", "RLS"],
      bullets: [
        {
          title: "Single source of truth",
          description:
            "permissions.config.ts owns every rule. Change one line, propagate everywhere.",
        },
        {
          title: "Wildcard support",
          description:
            "Grant admin.* to cover admin.read, admin.write, admin.delete without repetition.",
        },
        {
          title: "Row Level Security",
          description:
            "Supabase RLS policies enforced at the database level, not just the app layer.",
        },
        {
          title: "Typed hooks",
          description:
            "usePermission() returns strongly typed boolean checks in any component.",
        },
      ],
    },
    {
      id: "architecture",
      label: "Architecture",
      heading: "Config-driven, modular, opinionated.",
      description:
        "Three config files own the entire application surface. Modules are isolated, so you can extend or remove features without breaking the rest. TypeScript in strict mode, no any, no shortcuts.",
      stackBadges: ["Next.js 16", "Tailwind v4", "TypeScript"],
      bullets: [
        {
          title: "Single source of truth",
          description:
            "app.config.ts, branding.config.ts, and permissions.config.ts own every decision.",
        },
        {
          title: "Modular feature folders",
          description:
            "Commerce, auth, admin, and more. Isolated modules you can extend or replace.",
        },
        {
          title: "Typed database layer",
          description:
            "Supabase types generated from your schema. End-to-end type safety.",
        },
        {
          title: "Server-first rendering",
          description:
            "App Router with Server Components by default. Client components only where they earn it.",
        },
      ],
    },
    {
      id: "dx",
      label: "Developer experience",
      heading: "A codebase that respects your time.",
      description:
        "Eighty-eight files of documentation. Typed activity logging. Error boundaries. Middleware guards. Everything a production app needs, nothing it does not.",
      stackBadges: ["Docusaurus", "Zustand", "React Query"],
      bullets: [
        {
          title: "Complete documentation",
          description:
            "Every module, every config, every known pitfall. Docusaurus-powered.",
        },
        {
          title: "Activity logging",
          description:
            "Typed enums for every user action. Analytics and audit in one pass.",
        },
        {
          title: "Six module scaffolds",
          description:
            "SaaS, landing, blog, project, forum, chat. Extend or replace as you need.",
        },
        {
          title: "Internationalization",
          description:
            "i18n scaffold with English and Indonesian. Add a language by adding a JSON file.",
        },
      ],
    },
  ],
};
