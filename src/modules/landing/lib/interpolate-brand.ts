/**
 * Generic brand interpolator.
 *
 * Replaces `{appName}` placeholders anywhere in a value tree — works on
 * strings, arrays, plain objects, or any nested combination thereof.
 *
 * Why generic (not section-specific):
 *   The boilerplate uses `{appName}` placeholder convention across legal
 *   content, marketing content (hero, testimonials, showcase, faq, etc.),
 *   and any future module. One helper covers all of them. Buyers learn
 *   one concept; we ship less surface area.
 *
 * Why placeholder (not direct `${brandingConfig.name}` interpolation):
 *   Content data files stay PURE — no side imports, no execution-order
 *   dependency on env vars at module load. They're plain data tables you
 *   can grep, diff, and audit without running the app. Brand resolution
 *   happens at the render boundary (page.tsx), not at content authoring.
 *
 * What it does:
 *   • Strings: replace every `{appName}` with `brandName`
 *   • Arrays: map over items recursively
 *   • Plain objects: map over entries recursively
 *   • Primitives (number, boolean, null, undefined): pass through
 *   • Class instances, functions, symbols: pass through (defensive)
 *
 * Type preservation:
 *   Generic `<T>` returns the same shape — TypeScript knows the result
 *   has the same structure as the input.
 *
 * Performance:
 *   Server components only — runs once per request. Recursive walk is O(n)
 *   in tree size. For typical legal/marketing content (<10KB JSON), this
 *   is negligible (<1ms).
 *
 * @example
 *   import { brandingConfig } from "@/config";
 *   import { licenseContent, interpolateBrand } from "@/modules/landing";
 *
 *   const page = interpolateBrand(licenseContent, brandingConfig.name);
 *   return <LegalContent page={page} />;
 *
 * @example
 *   // Marketing content — same helper, same call shape
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

  // Plain object check — exclude class instances, dates, regex, etc.
  if (
    value !== null &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = walk(val, brandName);
    }
    return out;
  }

  // Primitives, null, undefined, class instances — pass through
  return value;
}
