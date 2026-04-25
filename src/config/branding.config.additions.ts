// src/config/branding.config.additions.ts
//
// NOT a standalone file. This is a REFERENCE SNIPPET showing what to add
// to your existing `src/config/branding.config.ts`.
//
// Two new fields are introduced:
//   - supportEmail      → used by legal pages + footer instead of hardcoded "support@fibidy.com"
//   - legalJurisdiction → used by License and Terms' governing law clause
// ----------------------------------------------------------------------------

/**
 * STEP 1 — Add these env vars to `.env.local` and `.env.example`:
 *
 *   # Contact email exposed on legal pages + footer (fallback if env is empty)
 *   NEXT_PUBLIC_APP_SUPPORT_EMAIL="admin@fibidy.com"
 *
 *   # Governing law jurisdiction for License and ToS
 *   NEXT_PUBLIC_APP_LEGAL_JURISDICTION="Indonesia"
 */

/**
 * STEP 2 — Extend the `brandingConfig` object in `src/config/branding.config.ts`.
 *
 * Before (simplified):
 *
 *   export const brandingConfig = {
 *     name: process.env.NEXT_PUBLIC_APP_NAME ?? "My App",
 *     shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? "App",
 *     description: process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "...",
 *     // ... existing fields
 *   } as const;
 *
 * After — add these two fields:
 *
 *   export const brandingConfig = {
 *     name: process.env.NEXT_PUBLIC_APP_NAME ?? "My App",
 *     shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? "App",
 *     description: process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "...",
 *     // ... existing fields ...
 *
 *     // NEW:
 *     supportEmail:
 *       process.env.NEXT_PUBLIC_APP_SUPPORT_EMAIL ?? "admin@fibidy.com",
 *     legalJurisdiction:
 *       process.env.NEXT_PUBLIC_APP_LEGAL_JURISDICTION ?? "Indonesia",
 *   } as const;
 */

/**
 * STEP 3 — If you have a typed shape (e.g. `BrandingConfig` type), extend it:
 *
 *   export interface BrandingConfig {
 *     name: string;
 *     shortName: string;
 *     // ... existing fields ...
 *
 *     // NEW:
 *     supportEmail: string;
 *     legalJurisdiction: string;
 *   }
 */

/**
 * STEP 4 — Search-and-replace hardcoded contact email.
 *
 * Old (hardcoded in 5 legal files and the footer):
 *   "support@fibidy.com"
 *
 * New:
 *   brandingConfig.supportEmail
 *
 * Files that referenced the hardcoded email before:
 *   - src/modules/landing/content/legal/license.ts
 *   - src/modules/landing/content/legal/terms.ts
 *   - src/modules/landing/content/legal/privacy-policy.ts
 *   - src/modules/landing/content/legal/acceptable-use.ts
 *   - src/modules/landing/content/legal/disclaimer.ts
 *   - src/modules/landing/components/layout/footer.tsx (or equivalent)
 *
 * The replacement legal files in THIS package already reference
 * `brandingConfig.supportEmail` with a fallback — so once you add the field,
 * everything lines up.
 */

/**
 * STEP 5 — Deploy env vars to Vercel
 *
 * Don't forget to set both env vars in your Vercel project settings for
 * Production (and Preview if applicable):
 *
 *   NEXT_PUBLIC_APP_SUPPORT_EMAIL      → admin@fibidy.com
 *   NEXT_PUBLIC_APP_LEGAL_JURISDICTION → Indonesia
 */

export {};
