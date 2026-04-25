import type { PricingContent } from "../types";

/**
 * Pricing section.
 *
 * Brand name uses `{appName}` placeholder — interpolated at render time.
 *
 * NOTE on cta.href:
 *   The default `"#pricing"` is an in-page anchor. Replace with your real
 *   purchase URL (Gumroad, Lemon Squeezy, Stripe Payment Link, etc.) when
 *   you set up your sales channel.
 *
 * Single tier pricing. $139 launch price, originally $189.
 */
export const pricingContent: PricingContent = {
  eyebrow: "Pricing",
  heading: "One price. Everything included.",
  launchDealBadge: "Save $50 with the Launch Deal",
  tiers: [
    {
      id: "solo",
      name: "{appName}",
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
        // TODO: replace with your purchase URL (Gumroad / Lemon Squeezy / Stripe link)
        label: "Get {appName}",
        href: "#pricing",
      },
      footnote:
        "Pay once. Lifetime updates. Reference-grade documentation included.",
    },
  ],
};
