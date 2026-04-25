import type { Metadata } from "next";
import { brandingConfig } from "@/config";
import {
  LegalContent,
  interpolateBrand,
  termsContent,
} from "@/modules/landing";

export const metadata: Metadata = {
  title: termsContent.title,
};

export default function TermsPage() {
  const page = interpolateBrand(termsContent, brandingConfig.name);
  return <LegalContent page={page} />;
}
