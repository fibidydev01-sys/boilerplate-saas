import type { PricingContent } from "../types";

/**
 * Pricing tiers — keep in sync with Gumroad variants.
 * Personal $139 / Pro $299 / Agency $499.
 * Original prices ($189 / $349 / $549) reflect post-launch pricing.
 */
export const pricingContent: PricingContent = {
  eyebrow: "Pricing",
  heading: "Choose the license that fits your work",
  launchDealBadge: "Save $50 with the Launch Deal",
  tiers: [
    {
      id: "personal",
      name: "Personal",
      tagline: "For solo builders shipping their own products",
      priceCents: 13900,
      originalPriceCents: 18900,
      features: [
        "Complete source code",
        "Multi-tenant commerce engine",
        "Full authentication layer",
        "Permission matrix with wildcards",
        "Activity logging",
        "Single-user license",
        "Unlimited personal projects",
        "Lifetime updates",
        "Fourteen-day refund window",
      ],
      cta: {
        label: "Get Personal",
        href: "https://fibidy.gumroad.com/l/shipkit-saas",
        external: true,
      },
      footnote: "Pay once, access forever.",
    },
    {
      id: "pro",
      name: "Pro",
      tagline: "For freelancers and agencies shipping client work",
      priceCents: 29900,
      originalPriceCents: 34900,
      badge: "Most Popular",
      highlighted: true,
      features: [
        "Everything in Personal",
        "Unlimited client projects",
        "Commercial resale rights",
        "Priority email response",
        "Access to private Discord",
        "Early access to new modules",
        "Lifetime updates",
        "Fourteen-day refund window",
      ],
      cta: {
        label: "Get Pro",
        href: "https://fibidy.gumroad.com/l/shipkit-saas",
        external: true,
      },
      footnote: "Pay once, access forever.",
    },
    {
      id: "agency",
      name: "Agency",
      tagline: "For teams deploying ShipKit across the organization",
      priceCents: 49900,
      originalPriceCents: 54900,
      badge: "50 seats only",
      features: [
        "Everything in Pro",
        "Team seat license",
        "Priority support (24h response)",
        "Dedicated onboarding call",
        "Architecture review session",
        "Direct Slack channel with founder",
        "Lifetime updates",
        "Fourteen-day refund window",
      ],
      cta: {
        label: "Get Agency",
        href: "https://fibidy.gumroad.com/l/shipkit-saas",
        external: true,
      },
      footnote: "Limited to 50 total licenses.",
    },
  ],
};
