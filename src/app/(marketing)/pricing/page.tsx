import type { Metadata } from "next";
import { FaqSection, FinalCtaSection, PricingSection } from "@/modules/landing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "One price. Lifetime updates. Everything included.",
};

export default function PricingPage() {
  return (
    <>
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
