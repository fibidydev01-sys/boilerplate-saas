#!/usr/bin/env node
/**
 * migrate-i18n.mjs
 *
 * Migrates client components from `import { t } from "@/core/i18n"` →
 * `useTranslation()` hook, so they react to locale switching.
 *
 * USAGE:
 *   node migrate-i18n.mjs              # DRY-RUN (preview only, no writes)
 *   node migrate-i18n.mjs --apply      # actually write changes
 *
 * Run from your project root (the directory containing src/).
 *
 * What it does, per file:
 *   1. Imports — replace `t` with `useTranslation` from "@/core/i18n":
 *        import { t } from "@/core/i18n"
 *        import { t, type TranslationKey } from "@/core/i18n"
 *        import { type TranslationKey, t } from "@/core/i18n"
 *      → all become `import { useTranslation, ... } from "@/core/i18n"`
 *
 *   2. Hooks — for every `export function ComponentName(...)` block whose
 *      body uses `t(`, inject `const { t } = useTranslation();` on the
 *      first line of the body. Idempotent (skips if already present).
 *
 * What it does NOT do:
 *   - Server components (no `"use client"` directive) — skipped.
 *   - Files with helper functions outside components that use `t()` —
 *     these are listed under "MANUAL REVIEW" in the report so you can
 *     fix them by hand (move helper inside component, or pass `t`).
 *   - validators.ts / nav-config.ts / error-i18n.ts — explicitly skipped
 *     (known limitations, see project README).
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");

// ---------- ANSI colors (strip when not TTY, e.g. piped to file) ----------
const tty = process.stdout.isTTY;
const c = {
  r: (s) => (tty ? `\x1b[31m${s}\x1b[0m` : s),
  g: (s) => (tty ? `\x1b[32m${s}\x1b[0m` : s),
  y: (s) => (tty ? `\x1b[33m${s}\x1b[0m` : s),
  b: (s) => (tty ? `\x1b[1m${s}\x1b[0m` : s),
  d: (s) => (tty ? `\x1b[2m${s}\x1b[0m` : s),
  cy: (s) => (tty ? `\x1b[36m${s}\x1b[0m` : s),
};

// ---------- Sanity check ----------
if (!existsSync("src")) {
  console.error(c.r("Error:") + ` 'src/' directory not found.`);
  console.error(`Run this script from your project root (the dir containing src/).`);
  process.exit(1);
}

// ---------- Skip lists ----------
// Files that should NEVER be auto-migrated (known limitations).
const SKIP_FILES = new Set([
  "src/core/lib/validators.ts",            // Zod schemas at module load
  "src/core/layout/nav-config.ts",         // Dead helper, no callers
  "src/modules/commerce/lib/error-i18n.ts", // Dead helper, no callers
]);

// Files with helper functions outside components that use t() — the auto
// migration will fix the import and inject hooks into components, but the
// helper still needs manual relocation. Flagged for review.
const MANUAL_REVIEW = new Set([
  "src/modules/commerce/components/connect-ls-form.tsx",
  "src/modules/commerce/components/products-grid.tsx",
]);

// ---------- File walker ----------
function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, ent.name).replace(/\\/g, "/");
    if (ent.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

// ---------- Stage 1: import replacement (deterministic) ----------
function migrateImports(content) {
  const patterns = [
    // import { t } from "@/core/i18n"
    [
      /import\s*\{\s*t\s*\}\s*from\s*["']@\/core\/i18n["']\s*;?/g,
      'import { useTranslation } from "@/core/i18n";',
    ],
    // import { t, type TranslationKey } from "@/core/i18n"
    [
      /import\s*\{\s*t\s*,\s*type\s+TranslationKey\s*\}\s*from\s*["']@\/core\/i18n["']\s*;?/g,
      'import { useTranslation, type TranslationKey } from "@/core/i18n";',
    ],
    // import { type TranslationKey, t } from "@/core/i18n"
    [
      /import\s*\{\s*type\s+TranslationKey\s*,\s*t\s*\}\s*from\s*["']@\/core\/i18n["']\s*;?/g,
      'import { useTranslation, type TranslationKey } from "@/core/i18n";',
    ],
  ];
  let result = content;
  let changed = false;
  for (const [from, to] of patterns) {
    if (from.test(result)) {
      result = result.replace(from, to);
      changed = true;
    }
  }
  return { content: result, changed };
}

// ---------- Stage 2: hook injection (heuristic) ----------
//
// Finds every top-level `export function ComponentName(...)` block. For
// each one whose body uses `t(` and doesn't already have a hook, injects
// `const { t } = useTranslation();` after the opening brace.
//
// Uses brace-counting (not regex) to find body bounds — handles return
// type annotations, multi-line signatures, nested objects, etc.
function injectHooks(content) {
  const lines = content.split("\n");
  const insertions = []; // { lineIdx, indent, name }

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(
      /^(\s*)export\s+(?:default\s+)?function\s+(\w+)\s*\(/
    );
    if (!m) continue;

    const baseIndent = m[1];
    const name = m[2];

    // Walk forward to find the body's opening `{` (after the param list
    // and any return type annotation). Track paren AND brace depth so we
    // don't confuse `({ a }: { b: number }): JSX.Element {` with the body.
    // We track both because destructured params like `{ size, text }` and
    // type annotations like `: { text?: string }` contain `{` `}` that
    // are not the body brace.
    let braceLine = -1;
    let braceCol = -1;
    let parenDepth = 0;
    let typeBraceDepth = 0; // braces seen WITHIN parens or type annotations
    let sawParen = false;
    let sawCloseParen = false;
    outer: for (let j = i; j < Math.min(i + 30, lines.length); j++) {
      const line = lines[j];
      // Start scanning from the position after `function name` on the first line
      const startCol = j === i ? line.indexOf("(") : 0;
      for (let k = startCol; k < line.length; k++) {
        const ch = line[k];
        if (ch === "(") {
          sawParen = true;
          parenDepth++;
        } else if (ch === ")") {
          parenDepth--;
          if (parenDepth === 0) sawCloseParen = true;
        } else if (ch === "{") {
          // If still inside parens, OR right after `:` (return type),
          // it's a type/destructure brace — track depth and skip.
          if (parenDepth > 0 || !sawCloseParen) {
            typeBraceDepth++;
          } else if (typeBraceDepth > 0) {
            // Already inside a return-type brace
            typeBraceDepth++;
          } else {
            // Real body brace
            braceLine = j;
            braceCol = k;
            break outer;
          }
        } else if (ch === "}") {
          if (typeBraceDepth > 0) typeBraceDepth--;
        }
      }
    }
    if (braceLine === -1) continue;

    // Walk forward to find matching `}` (body end). CRITICAL: start
    // scanning from braceCol on braceLine, not indexOf("{") — earlier
    // braces on that line (destructured params, type annotations) are
    // not the body brace.
    let depth = 0;
    let endLine = -1;
    let started = false;
    bodyScan: for (let j = braceLine; j < lines.length; j++) {
      const line = lines[j];
      const startCol = j === braceLine ? braceCol : 0;
      for (let k = startCol; k < line.length; k++) {
        const ch = line[k];
        if (ch === "{") {
          depth++;
          started = true;
        } else if (ch === "}") {
          depth--;
          if (started && depth === 0) {
            endLine = j;
            break bodyScan;
          }
        }
      }
    }
    if (endLine === -1) continue;

    const body = lines.slice(braceLine, endLine + 1).join("\n");

    // Skip components that don't actually use t(
    if (!/\bt\s*\(/.test(body)) continue;

    // Skip if already has hook (idempotent)
    if (/const\s*\{\s*t\s*[,}\s]/.test(body)) continue;

    insertions.push({
      lineIdx: braceLine,
      indent: baseIndent + "  ",
      name,
    });
  }

  // Apply insertions in reverse so earlier line numbers remain valid
  insertions.sort((a, b) => b.lineIdx - a.lineIdx);
  for (const { lineIdx, indent } of insertions) {
    lines.splice(lineIdx + 1, 0, `${indent}const { t } = useTranslation();`);
  }

  return {
    content: lines.join("\n"),
    changed: insertions.length > 0,
    names: insertions.map((i) => i.name).reverse(),
  };
}

// ---------- Diff preview (lightweight, ~5 lines around first change) ----------
function showDiff(before, after) {
  const bL = before.split("\n");
  const aL = after.split("\n");

  // Find first divergence
  let i = 0;
  while (i < Math.min(bL.length, aL.length) && bL[i] === aL[i]) i++;
  if (i >= Math.max(bL.length, aL.length)) return;

  console.log(c.d(`    ─── @ line ${i + 1} ───`));

  // Print 1 line of context above (if any)
  if (i > 0) console.log(c.d(`      ${bL[i - 1]}`));

  // Show up to 5 changed lines on each side, then sync
  let bi = i;
  let ai = i;
  let shown = 0;
  while (shown < 6 && (bi < bL.length || ai < aL.length)) {
    // If lines match, advance both
    if (bi < bL.length && ai < aL.length && bL[bi] === aL[ai]) {
      console.log(c.d(`      ${bL[bi]}`));
      bi++;
      ai++;
      shown++;
      // Once we've found 1 line of synced context, stop
      if (shown > 0 && bL[bi - 1] === aL[ai - 1]) break;
      continue;
    }
    // Look ahead in aL — is bL[bi] coming up? (means lines added)
    const lookaheadA = aL.slice(ai, ai + 4).indexOf(bL[bi]);
    if (lookaheadA > 0) {
      // Lines were added before bL[bi]
      for (let k = 0; k < lookaheadA && shown < 6; k++) {
        console.log(c.g(`    + ${aL[ai]}`));
        ai++;
        shown++;
      }
      continue;
    }
    // Otherwise: line was removed or replaced
    if (bi < bL.length) {
      console.log(c.r(`    - ${bL[bi]}`));
      bi++;
      shown++;
    }
    if (ai < aL.length && (bi >= bL.length || bL[bi] !== aL[ai])) {
      console.log(c.g(`    + ${aL[ai]}`));
      ai++;
      shown++;
    }
  }
}

// ---------- Discovery ----------
const all = walk("src").filter((f) => f.endsWith(".tsx"));
const targets = [];

for (const f of all) {
  if (SKIP_FILES.has(f)) continue;
  const content = readFileSync(f, "utf8");
  if (!/['"]use client['"]/.test(content)) continue; // server components
  if (!/import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*["']@\/core\/i18n["']/.test(content)) continue;
  targets.push(f);
}

// ---------- Run ----------
console.log("");
console.log("  " + c.b("i18n migration: t() → useTranslation()"));
console.log(
  "  " +
  c.d("mode: ") +
  (APPLY ? c.b(c.y("APPLY (will write)")) : c.b(c.g("DRY-RUN (preview)")))
);
console.log("  " + c.d(`scanning src/ → ${targets.length} candidate file(s)`));
console.log("");

let modified = 0;
let noOp = 0;
const manualNeeded = [];

for (const f of targets) {
  const before = readFileSync(f, "utf8");

  const i1 = migrateImports(before);
  const i2 = injectHooks(i1.content);
  const after = i2.content;
  const fileChanged = i1.changed || i2.changed;

  if (!fileChanged) {
    console.log("  " + c.d("[no-op]") + " " + c.d(f));
    noOp++;
    continue;
  }

  modified++;
  console.log(
    "  " + (APPLY ? c.b(c.g("[wrote] ")) : c.b(c.cy("[change]"))) + " " + c.b(f)
  );

  if (i1.changed) {
    console.log("    " + c.g("✓") + " import: " + c.r("t") + " → " + c.g("useTranslation"));
  }
  if (i2.changed) {
    for (const name of i2.names) {
      console.log(
        "    " + c.g("✓") + " hook injected → " + c.b(name) + "()"
      );
    }
  }

  if (MANUAL_REVIEW.has(f)) {
    manualNeeded.push(f);
    console.log(
      "    " +
      c.y("⚠ manual review:") +
      " has helper function(s) outside the component using t(). After auto-migration, move those helpers INSIDE the component (so they close over the hooked t), or pass t as parameter."
    );
  }

  // Preview only — show abbreviated diff
  if (!APPLY) showDiff(before, after);

  if (APPLY) writeFileSync(f, after);
}

// ---------- Report ----------
console.log("");
console.log("  " + c.b("Summary"));
console.log(
  "    " +
  c.b(modified) +
  " file(s) " +
  (APPLY ? c.g("modified") : c.y("would be modified"))
);
console.log("    " + c.d(`${noOp} file(s) already migrated (no-op)`));

if (manualNeeded.length > 0) {
  console.log("");
  console.log("  " + c.y(`⚠ ${manualNeeded.length} file(s) need manual review:`));
  for (const f of manualNeeded) console.log("    " + c.y("- " + f));
  console.log(
    "    " +
    c.d(
      "These have helper fns OUTSIDE the component (mapErrorCode etc.). Move inside or refactor."
    )
  );
}

if (!APPLY) {
  console.log("");
  console.log(
    "  " +
    c.y("This was a dry run.") +
    " Run with " +
    c.b("--apply") +
    " to write changes:"
  );
  console.log("    " + c.b("node migrate-i18n.mjs --apply"));
}
console.log("");
