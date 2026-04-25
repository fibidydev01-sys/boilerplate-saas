import type { Metadata } from "next";
import { brandingConfig } from "@/config";
import { FinalCtaSection, ShowcaseSection } from "@/modules/landing";

export const metadata: Metadata = {
  title: "Showcase",
  description: `Products built with ${brandingConfig.name}.`,
};

export default function ShowcasePage() {
  return (
    <>
      <ShowcaseSection />
      <FinalCtaSection />
    </>
  );
}
