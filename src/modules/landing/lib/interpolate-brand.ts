/**
 * Brand interpolation helper — generic, recursive, type-preserving.
 *
 * Replaces `{appName}` placeholders anywhere in a value (string, array, or
 * nested object) with the actual brand name. Used for legal pages, marketing
 * content, and any other place where authored copy needs the brand injected
 * at render time.
 *
 * Why this exists:
 *   Content data files (`hero.ts`, `license.ts`, `faq.ts`, etc.) are pure
 *   `export const` with `{appName}` placeholders instead of importing
 *   `brandingConfig` directly. This keeps content easy to diff, audit, and
 *   move between projects, while the brand name stays env-driven via
 *   `brandingConfig.name`.
 *
 *   Other env-driven values (supportEmail, legalJurisdiction) are read
 *   directly inside content files via template literals — they're shorter,
 *   rarer, and live in structured fields. Brand name appears dozens of
 *   times in prose, so a placeholder stays cleaner.
 *
 * What gets interpolated:
 *   • Strings: `{appName}` → brand name
 *   • Arrays: each element walked recursively
 *   • Plain objects: each value walked recursively
 *   • Anything else (numbers, booleans, null, undefined, Date, etc.): pass-through
 *
 * Where to call:
 *   In server components (page route files), just before passing data to
 *   render components. Runs once per request, zero overhead.
 *
 * @example
 *   import { brandingConfig } from "@/config";
 *   import { licenseContent, interpolateBrand } from "@/modules/landing";
 *
 *   const page = interpolateBrand(licenseContent, brandingConfig.name);
 *   return <LegalContent page={page} />;
 *
 * @example
 *   // Works for any shape — hero, faq, testimonials, etc.
 *   const hero = interpolateBrand(heroContent, brandingConfig.name);
 *   return <HeroSection content={hero} />;
 */
export function interpolateBrand<T>(value: T, brandName: string): T {
  return walk(value, brandName) as T;
}

function walk(value: unknown, brandName: string): unknown {
  if (typeof value === "string") {
    return value.replace(/\{appName\}/g, brandName);
  }
  if (Array.isArray(value)) {
    return value.map((item) => walk(item, brandName));
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = walk(val, brandName);
    }
    return out;
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
