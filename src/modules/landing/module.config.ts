/**
 * Landing module config.
 * Follows the same pattern as modules/admin and modules/commerce.
 *
 * This module owns the public marketing surface of the application:
 *   - Home page (hero, features, pricing, FAQ, testimonials, showcase, CTA)
 *   - Standalone pricing page (/pricing)
 *   - Showcase page (/showcase)
 *   - Legal pages (/legal/*)
 *
 * Disable this module to ship dashboard-only (e.g. internal tools).
 */

export const landingModuleConfig = {
  id: "landing",
  name: "Landing",
  description: "Public marketing site with hero, pricing, FAQ, and legal pages.",
  enabled: true,
  routes: {
    home: "/",
    pricing: "/pricing",
    showcase: "/showcase",
    legal: {
      privacyPolicy: "/legal/privacy-policy",
      terms: "/legal/terms",
      license: "/legal/license",
      disclaimer: "/legal/disclaimer",
      acceptableUse: "/legal/acceptable-use",
    },
  },
  features: {
    // Toggle sections independently.
    // If you want a minimalist landing (hero + pricing only), disable the rest.
    hero: true,
    problem: true,
    features: true,
    testimonials: true,
    showcase: true,
    pricing: true,
    faq: true,
    finalCta: true,
  },
  checkout: {
    /**
     * Where the "Get ShipKit" CTAs point.
     * - "external": Gumroad short URL (current setup)
     * - "internal": your /commerce/checkout route
     */
    mode: "external" as "external" | "internal",
    externalUrl: "https://fibidy.gumroad.com/l/shipkit-saas",
    internalPath: "/commerce/checkout",
  },
} as const;

export type LandingModuleConfig = typeof landingModuleConfig;
