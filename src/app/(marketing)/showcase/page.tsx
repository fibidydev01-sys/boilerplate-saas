import type { Metadata } from "next";
import { brandingConfig } from "@/config";
import { FinalCtaSection, ShowcaseSection } from "@/modules/landing";

export const metadata: Metadata = {
  title: "Showcase",
  description: `Products shipped with ${brandingConfig.name}.`,
};

export default function ShowcasePage() {
  return (
    <>
      <ShowcaseSection />
      <FinalCtaSection />
    </>
  );
}
