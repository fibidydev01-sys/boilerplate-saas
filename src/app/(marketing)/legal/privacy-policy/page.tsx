import type { Metadata } from "next";
import { brandingConfig } from "@/config";
import {
  LegalContent,
  interpolateBrand,
  privacyPolicyContent,
} from "@/modules/landing";

export const metadata: Metadata = {
  title: privacyPolicyContent.title,
};

export default function PrivacyPolicyPage() {
  const page = interpolateBrand(privacyPolicyContent, brandingConfig.name);
  return <LegalContent page={page} />;
}
