import type { Metadata } from "next";
import { LegalContent, privacyPolicyContent } from "@/modules/landing";

export const metadata: Metadata = {
  title: privacyPolicyContent.title,
};

export default function PrivacyPolicyPage() {
  return <LegalContent page={privacyPolicyContent} />;
}
