import {
  FaqSection,
  FeaturesSection,
  FinalCtaSection,
  HeroSection,
  PricingSection,
  ProblemSection,
  ShowcaseSection,
  TestimonialsSection,
  landingModuleConfig,
} from "@/modules/landing";

export default function HomePage() {
  const { features } = landingModuleConfig;

  return (
    <>
      {features.hero ? <HeroSection /> : null}
      {features.problem ? <ProblemSection /> : null}
      {features.features ? <FeaturesSection /> : null}
      {features.testimonials ? <TestimonialsSection /> : null}
      {features.showcase ? <ShowcaseSection /> : null}
      {features.pricing ? <PricingSection /> : null}
      {features.faq ? <FaqSection /> : null}
      {features.finalCta ? <FinalCtaSection /> : null}
    </>
  );
}
