import type { Metadata } from "next";
import { FinalCtaSection, ShowcaseSection } from "@/modules/landing";

export const metadata: Metadata = {
  title: "Showcase",
  description: "Products shipped with ShipKit.",
};

export default function ShowcasePage() {
  return (
    <>
      <ShowcaseSection />
      <FinalCtaSection />
    </>
  );
}
