import type { HeroContent } from "../types";

/**
 * Hero section content.
 *
 * Brand name uses `{appName}` placeholder — interpolated at render time.
 * No direct `brandingConfig` import → keeps content data pure.
 */
export const heroContent: HeroContent = {
  badge: "One price. Everything included. $139.",
  headline: {
    prefix: "Ship your",
    highlight: "SaaS",
    suffix: "this weekend, not next quarter.",
  },
  subtitle:
    "The complete Next.js 16 + Supabase + Lemon Squeezy boilerplate. Multi-tenant commerce, encrypted credentials, and a 62-page Docusaurus reference. One license, lifetime updates.",
  primaryCta: {
    label: "Get {appName}",
    href: "#pricing",
  },
  secondaryCta: {
    label: "View the docs",
    href: "/docs",
    external: true,
  },
  trustBadges: [
    { label: "Ship 60+ hours faster" },
    { label: "One price, one license" },
    { label: "Lifetime updates" },
    { label: "Reference-grade documentation" },
  ],
  avatars: [
    // PLACEHOLDER — replace with real buyer avatars before publish
    { src: "/marketing/avatars/placeholder-1.jpg", alt: "Customer" },
    { src: "/marketing/avatars/placeholder-2.jpg", alt: "Customer" },
    { src: "/marketing/avatars/placeholder-3.jpg", alt: "Customer" },
    { src: "/marketing/avatars/placeholder-4.jpg", alt: "Customer" },
  ],
  heroMediaAlt: "{appName} dashboard preview",
};
