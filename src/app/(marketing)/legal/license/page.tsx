import type { Metadata } from "next";
import { LegalContent, licenseContent } from "@/modules/landing";

export const metadata: Metadata = {
  title: licenseContent.title,
};

export default function LicensePage() {
  return <LegalContent page={licenseContent} />;
}
