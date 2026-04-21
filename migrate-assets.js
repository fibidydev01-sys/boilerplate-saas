#!/usr/bin/env node
/**
 * migrate-assets.js
 *
 * Konsolidasi semua branding asset ke single folder: public/branding/
 *
 * Source awal:
 *   public/icon/icon-{size}x{size}.png    →  public/branding/icon-{size}.png
 *   public/favicon/favicon.ico             →  public/branding/favicon.ico
 *   public/favicon/favicon.svg             →  public/branding/favicon.svg
 *   public/favicon/apple-touch-icon.png    →  public/branding/apple-touch-icon.png
 *
 * Tambahan (copy alias):
 *   public/branding/icon-192.png  →  public/branding/logo.png
 *   public/branding/icon-96.png   →  public/branding/logo-sm.png
 *
 * Cleanup:
 *   Hapus file redundant di /favicon/ (96x96, manifest 192/512 — udah ada di /icon/)
 *   Hapus folder kosong /icon/ dan /favicon/
 *
 * Jalankan: node scripts/migrate-assets.js
 *
 * Script ini IDEMPOTENT — aman di-run berkali-kali.
 * Kalau target file udah ada di /branding/, di-skip.
 */

import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const BRANDING_DIR = path.join(PUBLIC_DIR, "branding");
const ICON_DIR = path.join(PUBLIC_DIR, "icon");
const FAVICON_DIR = path.join(PUBLIC_DIR, "favicon");

// ============================================================
//  CONFIG
// ============================================================

/** Rename mapping: file di /icon/ → nama baru di /branding/ */
const ICON_RENAMES = {
  "icon-48x48.png": "icon-48.png",
  "icon-72x72.png": "icon-72.png",
  "icon-96x96.png": "icon-96.png",
  "icon-144x144.png": "icon-144.png",
  "icon-192x192.png": "icon-192.png",
  "icon-512x512.png": "icon-512.png",
};

/** File dari /favicon/ yang di-keep (dengan nama sama) */
const FAVICON_KEEPS = [
  "favicon.ico",
  "favicon.svg",
  "apple-touch-icon.png",
];

/** File di /favicon/ yang redundant (udah ada versi di /icon/) — akan dihapus */
const FAVICON_REDUNDANT = [
  "favicon-96x96.png",
  "web-app-manifest-192x192.png",
  "web-app-manifest-512x512.png",
];

/** Alias copy: bikin logo.png dan logo-sm.png dari icon yang udah di-migrate */
const LOGO_ALIASES = [
  { from: "icon-192.png", to: "logo.png" },
  { from: "icon-96.png", to: "logo-sm.png" },
];

/** Expected files di /branding/ setelah migrasi sukses (untuk verifikasi) */
const EXPECTED_FILES = [
  "favicon.ico",
  "apple-touch-icon.png",
  "logo.png",
  "logo-sm.png",
  "icon-48.png",
  "icon-72.png",
  "icon-96.png",
  "icon-144.png",
  "icon-192.png",
  "icon-512.png",
];

// ============================================================
//  HELPERS
// ============================================================

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function isEmpty(dir) {
  try {
    const entries = await fs.readdir(dir);
    return entries.length === 0;
  } catch {
    return false;
  }
}

/**
 * Move file dari src → dst. Idempotent:
 * - Kalau dst udah ada & src gak ada: skipped (already done)
 * - Kalau dst udah ada & src masih ada: hapus src, warn duplicate
 * - Kalau keduanya gak ada: missing (warn)
 */
async function moveFile(src, dst, label) {
  const srcExists = await exists(src);
  const dstExists = await exists(dst);

  if (!srcExists && dstExists) {
    console.log(`   ⏭️  ${label} — udah di target, skip`);
    return "skipped";
  }

  if (!srcExists && !dstExists) {
    console.log(`   ⚠️  ${label} — tidak ditemukan di source`);
    return "missing";
  }

  if (srcExists && dstExists) {
    // Source masih ada padahal target udah ada → cleanup duplicate
    await fs.unlink(src);
    console.log(`   🧹 ${label} — duplicate dihapus dari source`);
    return "cleaned";
  }

  // Happy path: rename (= move)
  await fs.rename(src, dst);
  console.log(`   ✅ ${label}`);
  return "moved";
}

async function copyFile(src, dst, label) {
  const srcExists = await exists(src);
  const dstExists = await exists(dst);

  if (dstExists) {
    console.log(`   ⏭️  ${label} — udah ada, skip`);
    return "skipped";
  }

  if (!srcExists) {
    console.log(`   ⚠️  ${label} — source tidak ditemukan`);
    return "missing";
  }

  await fs.copyFile(src, dst);
  console.log(`   ✅ ${label}`);
  return "copied";
}

async function deleteFile(p, label) {
  if (!(await exists(p))) {
    return "already-gone";
  }
  await fs.unlink(p);
  console.log(`   🗑️  ${label}`);
  return "deleted";
}

async function removeDirIfEmpty(dir, label) {
  if (!(await exists(dir))) {
    console.log(`   ⏭️  ${label} — sudah tidak ada`);
    return;
  }
  if (await isEmpty(dir)) {
    await fs.rmdir(dir);
    console.log(`   🗑️  ${label} — folder kosong dihapus`);
  } else {
    const leftover = await fs.readdir(dir);
    console.log(`   ⚠️  ${label} — masih ada ${leftover.length} file, dipertahankan:`);
    leftover.forEach((f) => console.log(`        - ${f}`));
  }
}

// ============================================================
//  MAIN
// ============================================================

async function main() {
  console.log("🚀 MIGRATE ASSETS — konsolidasi ke /public/branding/");
  console.log("===========================================\n");

  // ---- Step 0: safety check ----
  if (!(await exists(PUBLIC_DIR))) {
    console.error("❌ Folder public/ tidak ditemukan.");
    console.error(`   Cwd: ${PROJECT_ROOT}`);
    console.error("   Jalanin script ini dari root project.");
    process.exit(1);
  }

  // ---- Step 1: pastikan /branding/ ada ----
  console.log("📂 Step 1: Setup folder /branding/");
  await fs.mkdir(BRANDING_DIR, { recursive: true });
  console.log(`   ✅ ${path.relative(PROJECT_ROOT, BRANDING_DIR)} ready\n`);

  // ---- Step 2: migrate /icon/ dengan rename ----
  console.log("📦 Step 2: Migrate icon files (rename size format)");
  for (const [oldName, newName] of Object.entries(ICON_RENAMES)) {
    const src = path.join(ICON_DIR, oldName);
    const dst = path.join(BRANDING_DIR, newName);
    await moveFile(src, dst, `${oldName} → ${newName}`);
  }
  console.log();

  // ---- Step 3: migrate /favicon/ (keep as-is) ----
  console.log("🌐 Step 3: Migrate favicon files");
  for (const filename of FAVICON_KEEPS) {
    const src = path.join(FAVICON_DIR, filename);
    const dst = path.join(BRANDING_DIR, filename);
    await moveFile(src, dst, filename);
  }
  console.log();

  // ---- Step 4: hapus file redundant di /favicon/ ----
  console.log("🧹 Step 4: Cleanup file redundant di /favicon/");
  for (const filename of FAVICON_REDUNDANT) {
    const src = path.join(FAVICON_DIR, filename);
    await deleteFile(src, `/favicon/${filename}`);
  }
  console.log();

  // ---- Step 5: bikin logo aliases ----
  console.log("🎨 Step 5: Bikin logo aliases (copy dari icon yang udah migrate)");
  for (const { from, to } of LOGO_ALIASES) {
    const src = path.join(BRANDING_DIR, from);
    const dst = path.join(BRANDING_DIR, to);
    await copyFile(src, dst, `${from} → ${to}`);
  }
  console.log();

  // ---- Step 6: hapus folder kosong ----
  console.log("🏁 Step 6: Cleanup folder kosong");
  await removeDirIfEmpty(ICON_DIR, "public/icon/");
  await removeDirIfEmpty(FAVICON_DIR, "public/favicon/");
  console.log();

  // ---- Step 7: VERIFIKASI ----
  console.log("🔍 Step 7: Verifikasi file yang diharapkan");
  console.log("===========================================");

  const results = { ok: [], missing: [] };
  for (const filename of EXPECTED_FILES) {
    const p = path.join(BRANDING_DIR, filename);
    if (await exists(p)) {
      const stat = await fs.stat(p);
      const kb = (stat.size / 1024).toFixed(1);
      console.log(`   ✅ ${filename.padEnd(30)} (${kb} KB)`);
      results.ok.push(filename);
    } else {
      console.log(`   ❌ ${filename.padEnd(30)} MISSING`);
      results.missing.push(filename);
    }
  }

  // List bonus files di /branding/ (kalau ada, misal favicon.svg)
  const allInBranding = await fs.readdir(BRANDING_DIR);
  const bonus = allInBranding.filter((f) => !EXPECTED_FILES.includes(f));
  if (bonus.length > 0) {
    console.log(`\n   📎 Bonus files:`);
    bonus.forEach((f) => console.log(`      + ${f}`));
  }

  // ---- Summary ----
  console.log("\n===========================================");
  console.log(`📊 HASIL: ${results.ok.length}/${EXPECTED_FILES.length} file sesuai expected`);
  console.log("===========================================");

  if (results.missing.length > 0) {
    console.log("\n⚠️  File yang hilang:");
    results.missing.forEach((f) => console.log(`   - ${f}`));
    console.log("\n💡 Tips:");
    console.log("   - Kalau icon-{size}.png hilang, cek apakah /public/icon/ awalnya ada");
    console.log("   - Kalau favicon.ico hilang, siapkan manual di /public/branding/");
    console.log("   - Bisa generate semua size pakai: https://realfavicongenerator.net/");
    process.exit(1);
  }

  console.log("\n✅ Migrasi sukses!\n");
  console.log("📂 Final structure:");
  console.log("   public/");
  console.log("   └── branding/");
  allInBranding.sort().forEach((f) => console.log(`       ├── ${f}`));
  console.log("\n🚀 Next: pnpm build && pnpm start");
  console.log("   Lalu buka: http://localhost:3000/manifest.webmanifest");
  console.log("   Cek icon URL di manifest valid semua.\n");
}

main().catch((err) => {
  console.error("\n❌ Script gagal:", err);
  process.exit(1);
});