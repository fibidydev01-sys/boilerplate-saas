import type { Metadata } from "next";
import { LegalContent, disclaimerContent } from "@/modules/landing";

export const metadata: Metadata = {
  title: disclaimerContent.title,
};

export default function DisclaimerPage() {
  return <LegalContent page={disclaimerContent} />;
}
