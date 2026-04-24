import type { HeroContent } from "../types";

export const heroContent: HeroContent = {
  badge: "Save $50 with the Launch Deal",
  headline: {
    prefix: "Launch your",
    highlight: "SaaS",
    suffix: "in days, not months.",
  },
  subtitle:
    "Everything you need to build, launch, and monetize your web app: production-ready code, multi-tenant commerce, encrypted credentials, and complete documentation.",
  primaryCta: {
    label: "Get ShipKit",
    href: "#pricing",
  },
  secondaryCta: {
    label: "View the docs",
    href: "/docs",
    external: true,
  },
  trustBadges: [
    { label: "Built for web devs" },
    { label: "Ship 60+ hours faster" },
    { label: "Pay once, access forever" },
    { label: "Founder support" },
  ],
  avatars: [
    // Replace these with real buyer avatars before publish
    { src: "/marketing/avatars/placeholder-1.jpg", alt: "Customer" },
    { src: "/marketing/avatars/placeholder-2.jpg", alt: "Customer" },
    { src: "/marketing/avatars/placeholder-3.jpg", alt: "Customer" },
    { src: "/marketing/avatars/placeholder-4.jpg", alt: "Customer" },
  ],
  heroMediaAlt: "ShipKit dashboard preview",
};
