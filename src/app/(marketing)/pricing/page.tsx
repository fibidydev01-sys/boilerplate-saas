import type { Metadata } from "next";
import { FaqSection, FinalCtaSection, PricingSection } from "@/modules/landing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One-time payment. Lifetime updates. Choose Personal, Pro, or Agency.",
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
