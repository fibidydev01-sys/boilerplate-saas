import type { Metadata } from "next";
import { brandingConfig } from "@/config";
import {
  LegalContent,
  disclaimerContent,
  interpolateBrand,
} from "@/modules/landing";

export const metadata: Metadata = {
  title: disclaimerContent.title,
};

export default function DisclaimerPage() {
  const page = interpolateBrand(disclaimerContent, brandingConfig.name);
  return <LegalContent page={page} />;
}
