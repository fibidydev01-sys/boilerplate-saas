/**
 * Landing module public API.
 * Import from this file at app route boundaries:
 *   import { HeroSection, PricingSection } from "@/modules/landing"
 */

// Config
export { landingModuleConfig } from "./module.config";
export type { LandingModuleConfig } from "./module.config";

// Types
export type {
  Cta,
  HeroContent,
  ProblemContent,
  FeaturesContent,
  FeatureTab,
  TestimonialsContent,
  Testimonial,
  ShowcaseContent,
  PricingContent,
  PricingTier,
  FaqContent,
  FaqItem,
  FinalCtaContent,
  HeaderContent,
  FooterContent,
  LegalPage,
  LegalSection,
} from "./types";

// Content
export * from "./content";

// Library helpers
export { formatPrice, scrollToSection } from "./lib";

// Layout components
export {
  LaunchDealBanner,
  MarketingFooter,
  MarketingHeader,
} from "./components/layout";

// Section components
export {
  HeroSection,
  ProblemSection,
  FeaturesSection,
  TestimonialsSection,
  ShowcaseSection,
  PricingSection,
  FaqSection,
  FinalCtaSection,
} from "./components/sections";

// Primitive components
export {
  AvatarStack,
  CheckItem,
  FaqList,
  FeatureBullet,
  PriceCard,
  TestimonialCard,
  TrustBadge,
} from "./components/primitives";

// Legal components
export { LegalContent, LegalSidebar } from "./components/legal";
