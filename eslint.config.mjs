/**
 * ESLint Flat Config — Next.js 16 + ESLint 9
 *
 * Dua tujuan:
 *   1. Next.js / React / TypeScript rules via eslint-config-next
 *   2. Architectural boundaries (Prinsip #5C) — enforce separation of layer:
 *        - core/    : boilerplate-agnostic (gak kenal module apapun)
 *        - shared/  : cross-cutting utilities (boleh pake core/, gak boleh pake modules/)
 *        - modules/ : self-contained features (gak boleh saling import)
 *        - config/  : boleh di-import dari layer manapun
 *
 * ⚠️ Note: JANGAN pake FlatCompat di sini — trigger circular reference bug
 *    di eslint-plugin-react-hooks@6.1.1 yang di-bundle Next 16.
 *    Direct import dari "eslint-config-next/core-web-vitals" = official path.
 *
 * ⚠️ Rule overrides yang butuh plugin di luar nextVitals (mis. `@typescript-eslint/*`)
 *    gak dipake di sini — plugin-nya gak di-register sama core-web-vitals.
 *    Kalau butuh, install + register plugin manual, atau pake rule built-in ESLint.
 *
 * Reference:
 * - https://nextjs.org/docs/app/api-reference/config/eslint
 * - https://github.com/facebook/react/issues/34733
 */

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// ============================================================
//  Module registry — sync dengan appConfig.modules
//  Tambah module baru? Tambah di sini → rules auto-generated.
// ============================================================
const MODULES = [
  "admin",
  "saas",
  "landing",
  "commerce",
  "blog",
  "project",
  "forum",
  "chat",
];

/**
 * Generate cross-module import restriction untuk tiap module.
 *
 * Result: module X dilarang import dari module Y manapun (Y ≠ X).
 * Kalau ada kode yang butuh share antar module → extract ke shared/.
 */
const moduleBoundaries = MODULES.map((current) => ({
  files: [`src/modules/${current}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: MODULES
              .filter((m) => m !== current)
              .map((m) => `@/modules/${m}/*`),
            message: `Module "${current}" tidak boleh import dari module lain. Extract ke shared/ kalau butuh reusable.`,
          },
        ],
      },
    ],
  },
}));

// ============================================================
//  Main config
// ============================================================
const eslintConfig = defineConfig([
  // 1. Next.js base rules (core-web-vitals — include react, react-hooks, next)
  ...nextVitals,

  // 2. core/ — boilerplate-agnostic, gak boleh kenal modules/ atau shared/
  {
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*", "@/shared/*"],
              message:
                "core/ harus boilerplate-agnostic. Tidak boleh import dari modules/ atau shared/. Core cuma boleh depend ke config/ dan standard libs.",
            },
          ],
        },
      ],
    },
  },

  // 3. shared/ — boleh pake core/, tapi gak boleh tau soal modules/
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*"],
              message:
                "shared/ tidak boleh tergantung module tertentu. Hanya core/ + config/ yang diperbolehkan.",
            },
          ],
        },
      ],
    },
  },

  // 4. modules/* — tidak boleh saling import (auto-generated dari MODULES)
  ...moduleBoundaries,

  // 5. Ignores (supplementary — eslint-config-next sudah auto-ignore
  //    .next/**, out/**, build/**, next-env.d.ts)
  globalIgnores([
    "public/**",
    "coverage/**",
    "dist/**",
    "*.config.js",
    "*.config.mjs",
  ]),
]);

export default eslintConfig;
