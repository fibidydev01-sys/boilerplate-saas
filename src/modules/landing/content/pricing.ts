import { brandingConfig } from "@/config";
import type { PricingContent } from "../types";

/**
 * Pricing section.
 *
 * Brand name uses `{appName}` placeholder — interpolated at render time.
 *
 * Purchase button (`tier.cta`) wires to `brandingConfig.purchaseUrl`:
 *   - Set `NEXT_PUBLIC_APP_PURCHASE_URL` to your Gumroad / Lemon Squeezy /
 *     Stripe checkout link.
 *   - When empty (default), button falls back to `#pricing` anchor — safe
 *     placeholder that won't break the layout.
 *   - `external: true` is auto-set when a real URL exists, so the button
 *     opens checkout in a new tab.
 *
 * Single tier pricing. $139 launch price, originally $189.
 */
const purchaseHref = brandingConfig.purchaseUrl || "#pricing";
const isExternalCheckout = Boolean(brandingConfig.purchaseUrl);

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
        href: purchaseHref,
        external: isExternalCheckout,
      },
      footnote:
        "Pay once. Lifetime updates. Reference-grade documentation included.",
    },
  ],
};
