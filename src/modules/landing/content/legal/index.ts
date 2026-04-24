import type { LegalPage } from "../../types";
import { licenseContent } from "./license";
import { privacyPolicyContent } from "./privacy-policy";
import { termsContent } from "./terms";
import { disclaimerContent } from "./disclaimer";
import { acceptableUseContent } from "./acceptable-use";

export {
  licenseContent,
  privacyPolicyContent,
  termsContent,
  disclaimerContent,
  acceptableUseContent,
};

/**
 * Registry of all legal pages by slug.
 * Used by the legal sidebar to render the nav list and resolve content.
 */
export const legalPages: Record<string, LegalPage> = {
  "privacy-policy": privacyPolicyContent,
  terms: termsContent,
  license: licenseContent,
  disclaimer: disclaimerContent,
  "acceptable-use": acceptableUseContent,
};

export const legalPageOrder: Array<keyof typeof legalPages> = [
  "privacy-policy",
  "terms",
  "license",
  "disclaimer",
  "acceptable-use",
];
