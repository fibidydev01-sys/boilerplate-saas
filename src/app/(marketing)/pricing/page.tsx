import type { Metadata } from "next";
import { FaqSection, FinalCtaSection, PricingSection } from "@/modules/landing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One price. Everything included. Pay once, get lifetime updates.",
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
