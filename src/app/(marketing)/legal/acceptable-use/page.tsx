import type { Metadata } from "next";
import { LegalContent, acceptableUseContent } from "@/modules/landing";

export const metadata: Metadata = {
  title: acceptableUseContent.title,
};

export default function AcceptableUsePage() {
  return <LegalContent page={acceptableUseContent} />;
}
