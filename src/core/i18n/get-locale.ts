/**
 * Server-only locale helper.
 *
 * Wraps `readLocaleCookie()` behind a `server-only` import guard so that
 * any accidental import from a client component fails at build time
 * (with a clear error) instead of breaking silently at runtime.
 *
 * Usage in server components / route handlers / page metadata:
 *
 *   import { getServerLocale } from "@/core/i18n/get-locale";
 *   import { t } from "@/core/i18n";
 *
 *   const locale = await getServerLocale();
 *   const title = t("page.title", undefined, locale);
 *
 * Why a separate file (vs. just exporting from i18n/index.ts):
 *   `i18n/index.ts` is a server-safe module that can be imported by
 *   client components too (for the pure `t()` function and types).
 *   Adding `import "server-only"` there would block client imports
 *   entirely. This file isolates the server-only concern.
 */

import "server-only";
import { readLocaleCookie } from "./locale-cookie";

export const getServerLocale = readLocaleCookie;
