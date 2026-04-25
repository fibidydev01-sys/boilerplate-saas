import { brandingConfig } from "@/config";
import type { FinalCtaContent, HeaderContent, FooterContent } from "../types";

/**
 * Final CTA section content.
 *
 * Brand name uses `{appName}` placeholder — interpolated at render time.
 */
export const finalCtaContent: FinalCtaContent = {
  heading: "Save time, money, and headaches.",
  subtitle:
    "Stop wasting weeks on boilerplate. Build your next SaaS with {appName}.",
  cta: {
    label: "Get {appName}",
    href: "#pricing",
  },
};

/**
 * Header content.
 *
 * Brand name uses `{appName}` placeholder — interpolated at render time.
 */
export const headerContent: HeaderContent = {
  navItems: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Showcase", href: "/showcase" },
    { label: "Docs", href: "/docs", external: true },
  ],
  launchDealBadge: "$50 off with Launch Deal",
  ctaLoggedOut: {
    label: "Sign in",
    href: "/login",
  },
  ctaLoggedIn: {
    label: "Dashboard",
    href: "/dashboard",
  },
};

/**
 * Footer content.
 *
 * - Tagline & copyright: brand-neutral
 * - Support email link: env-driven via `brandingConfig.supportEmail`
 * - Legal links: static slug list (titles handled by legal-sidebar)
 */
export const footerContent: FooterContent = {
  tagline: "The production-ready Next.js 16 boilerplate for indie SaaS.",
  copyrightYear: new Date().getFullYear(),
  columns: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/pricing" },
        { label: "Showcase", href: "/showcase" },
        { label: "FAQ", href: "/#faq" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs", external: true },
        { label: "Changelog", href: "/docs/changelog", external: true },
        {
          label: "Support",
          href: `mailto:${brandingConfig.supportEmail}`,
          external: true,
        },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/legal/privacy-policy" },
        { label: "Terms of Service", href: "/legal/terms" },
        { label: "License", href: "/legal/license" },
        { label: "Disclaimer", href: "/legal/disclaimer" },
        { label: "Acceptable Use", href: "/legal/acceptable-use" },
      ],
    },
  ],
  legalLinks: [
    { label: "Privacy", href: "/legal/privacy-policy" },
    { label: "Terms", href: "/legal/terms" },
    { label: "License", href: "/legal/license" },
  ],
};
