import type { PricingContent } from "../types";

/**
 * Single tier pricing. $139 launch price, originally $189.
 *
 * Brand name uses `{appName}` placeholder — interpolated at render time.
 *
 * NOTE on `cta.href`:
 *   This is a boilerplate. The default `#` href is intentional — buyers
 *   replace it with their own checkout URL (Gumroad, Lemon Squeezy direct,
 *   Stripe, etc.) before publish. To keep the value env-driven across
 *   deployments, you can also wire it to a `brandingConfig.purchaseUrl`
 *   field — that's left as an extension point so each buyer chooses their
 *   own payment provider.
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
        label: "Get {appName}",
        // TODO: replace with your own checkout URL before publish
        href: "#",
        external: true,
      },
      footnote: "Pay once. Lifetime updates. Reference-grade documentation included.",
    },
  ],
};
