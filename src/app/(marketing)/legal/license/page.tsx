import type { Metadata } from "next";
import { brandingConfig } from "@/config";
import {
  LegalContent,
  interpolateBrand,
  licenseContent,
} from "@/modules/landing";

export const metadata: Metadata = {
  title: licenseContent.title,
};

export default function LicensePage() {
  const page = interpolateBrand(licenseContent, brandingConfig.name);
  return <LegalContent page={page} />;
}
