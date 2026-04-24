/**
 * Type definitions for the marketing content data layer.
 * All marketing copy lives in `content/` and conforms to these shapes.
 * This lets non-devs edit copy without touching JSX.
 */

export type Cta = {
  label: string;
  href: string;
  external?: boolean;
};

export type TrustBadge = {
  label: string;
  icon?: string;
};

export type HeroContent = {
  badge: string;
  headline: {
    prefix: string;
    highlight: string;
    suffix: string;
  };
  subtitle: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  trustBadges: TrustBadge[];
  avatars: Array<{
    src: string;
    alt: string;
  }>;
  heroMediaAlt: string;
};

export type ProblemItem = {
  duration: string;
  label: string;
};

export type ProblemContent = {
  eyebrow: string;
  heading: string;
  items: ProblemItem[];
  conclusion: {
    totalHours: string;
    label: string;
    aside: string;
  };
};

export type FeatureBullet = {
  title: string;
  description: string;
};

export type FeatureTab = {
  id: string;
  label: string;
  heading: string;
  description: string;
  bullets: FeatureBullet[];
  stackBadges?: string[];
};

export type FeaturesContent = {
  eyebrow: string;
  heading: string;
  tabs: FeatureTab[];
};

export type Testimonial = {
  quote: string;
  author: {
    name: string;
    role: string;
    handle?: string;
    avatar: string;
  };
};

export type TestimonialsContent = {
  eyebrow: string;
  heading: string;
  testimonials: Testimonial[];
};

export type ShowcaseItem = {
  name: string;
  category: string;
  description: string;
  tags: string[];
};

export type ShowcaseContent = {
  eyebrow: string;
  heading: string;
  description: string;
  items: ShowcaseItem[];
};

export type PricingTier = {
  id: string;
  name: string;
  tagline: string;
  priceCents: number;
  originalPriceCents?: number;
  badge?: string;
  highlighted?: boolean;
  features: string[];
  cta: Cta;
  footnote: string;
};

export type PricingContent = {
  eyebrow: string;
  heading: string;
  launchDealBadge: string;
  tiers: PricingTier[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqContent = {
  eyebrow: string;
  heading: string;
  items: FaqItem[];
};

export type FinalCtaContent = {
  heading: string;
  subtitle: string;
  cta: Cta;
};

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export type FooterContent = {
  tagline: string;
  copyrightYear: number;
  columns: FooterColumn[];
  legalLinks: FooterLink[];
};

export type HeaderNavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type HeaderContent = {
  navItems: HeaderNavItem[];
  launchDealBadge: string;
  ctaLoggedOut: Cta;
  ctaLoggedIn: Cta;
};

/**
 * Legal page content shape.
 * Renders via the generic `<LegalContent>` component.
 */
export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  list?: {
    type: "bulleted" | "numbered";
    items: string[];
  };
  subsections?: LegalSection[];
};

export type LegalPage = {
  slug: string;
  title: string;
  lastUpdated: string;
  intro?: string[];
  sections: LegalSection[];
  contact?: {
    name: string;
    email: string;
  };
};
