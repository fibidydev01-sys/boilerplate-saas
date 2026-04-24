import type { Metadata } from "next";
import { LegalContent, termsContent } from "@/modules/landing";

export const metadata: Metadata = {
  title: termsContent.title,
};

export default function TermsPage() {
  return <LegalContent page={termsContent} />;
}
