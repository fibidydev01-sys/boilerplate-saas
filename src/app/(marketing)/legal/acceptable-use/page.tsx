import type { Metadata } from "next";
import { brandingConfig } from "@/config";
import {
  LegalContent,
  acceptableUseContent,
  interpolateBrand,
} from "@/modules/landing";

export const metadata: Metadata = {
  title: acceptableUseContent.title,
};

export default function AcceptableUsePage() {
  const page = interpolateBrand(acceptableUseContent, brandingConfig.name);
  return <LegalContent page={page} />;
}
