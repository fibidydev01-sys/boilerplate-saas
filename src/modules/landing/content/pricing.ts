import type { PricingContent } from "../types";

/**
 * Single tier pricing. $139 launch price, originally $189.
 * Gumroad variants must be DISABLED to match this single-tier layout.
 */
export const pricingContent: PricingContent = {
  eyebrow: "Pricing",
  heading: "One price. Everything included.",
  launchDealBadge: "Save $50 with the Launch Deal",
  tiers: [
    {
      id: "solo",
      name: "Your App",
      tagline: "The complete boilerplate for one solo developer",
      priceCents: 13900,
      originalPriceCents: 18900,
      badge: "Lifetime updates included",
      highlighted: true,
      features: [
        "Complete Next.js 16 source code",
        "Multi-tenant commerce engine (Lemon Squeezy Connect)",
        "Full authentication layer with edge cases handled",
        "Permission matrix with wildcard RBAC",
        "AES-256-GCM encryption + activity logging",
        "62-page Docusaurus reference",
        "Solo Developer License",
        "Unlimited personal and client projects",
        "Lifetime updates",
        "Fourteen-day refund window",
      ],
      cta: {
        label: "Get Your App",
        href: "https://fibidy.gumroad.com/l/your-app-saas",
        external: true,
      },
      footnote: "Pay once. Lifetime updates. Reference-grade documentation included.",
    },
  ],
};
