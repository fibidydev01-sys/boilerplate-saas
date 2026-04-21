// ============================================================
//  SEED USERS — Boilerplate
// ============================================================
//  Bikin user test untuk semua role di appConfig.auth.roles:
//    - super_admin  → punya "*" permission (semua)
//    - admin        → admin:access, users:*, content:*, profile:*
//    - editor       → content:* (read/write/publish), users:read
//    - viewer       → read-only (content:read, users:read)
//    - user         → cuma profile sendiri
//
//  Jalankan: node scripts/seed.js
//  Butuh di .env.local:
//    - NEXT_PUBLIC_SUPABASE_URL
//    - SUPABASE_SERVICE_ROLE_KEY
//
//  Script ini idempotent:
//    - User baru    → create di auth + profile otomatis via trigger
//    - User existing → sync role + full_name kalau beda
//    - Profile orphan → re-create kalau auth user ada tapi profile hilang
//
//  ⚠️  Password di bawah untuk DEVELOPMENT saja.
//      Ganti sebelum deploy ke staging/production.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
//  📋 SEED DATA
//  Ganti sesuai kebutuhan. Untuk production: HAPUS seed default,
//  bikin super_admin manual via Supabase Auth dashboard.
// ============================================================
const userList = [
  {
    full_name: "Super Admin",
    email: "superadmin@example.com",
    password: "SuperAdmin@2026",
    role: "super_admin",
    locale: "id",
  },
  {
    full_name: "Admin",
    email: "admin@example.com",
    password: "Admin@2026",
    role: "admin",
    locale: "id",
  },
  {
    full_name: "Editor",
    email: "editor@example.com",
    password: "Editor@2026",
    role: "editor",
    locale: "id",
  },
  {
    full_name: "Viewer",
    email: "viewer@example.com",
    password: "Viewer@2026",
    role: "viewer",
    locale: "id",
  },
  {
    full_name: "Regular User",
    email: "user@example.com",
    password: "User@2026",
    role: "user",
    locale: "id",
  },
];

// Valid roles — sync dengan appConfig.auth.roles & DB CHECK constraint
const VALID_ROLES = ["super_admin", "admin", "editor", "viewer", "user"];
const VALID_LOCALES = ["id", "en"];

// ============================================================
//  🔍 VALIDASI INPUT
// ============================================================
function validateUser(user, index) {
  const errors = [];
  if (!user.full_name) errors.push("full_name wajib");
  if (!user.email) errors.push("email wajib");
  if (!user.password || user.password.length < 6)
    errors.push("password minimal 6 karakter");
  if (!VALID_ROLES.includes(user.role))
    errors.push(`role "${user.role}" tidak valid. Pilih: ${VALID_ROLES.join(", ")}`);
  if (user.locale && !VALID_LOCALES.includes(user.locale))
    errors.push(`locale "${user.locale}" tidak valid. Pilih: ${VALID_LOCALES.join(", ")}`);

  if (errors.length) {
    console.error(`❌ User index ${index} (${user.email ?? "?"}) invalid:`);
    errors.forEach((e) => console.error(`   - ${e}`));
    return false;
  }
  return true;
}

// ============================================================
//  🚀 CREATE / SYNC USER
// ============================================================
async function upsertUser(userData) {
  try {
    console.log(`\n📝 ${userData.full_name} <${userData.email}> (${userData.role})`);

    // 1. Cek apakah auth user sudah ada
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existing = users.find((u) => u.email === userData.email);

    if (existing) {
      console.log(`   ⏭️  Auth user ada (${existing.id})`);

      // Cek profile
      const { data: profile, error: profileErr } = await supabase
        .from("user_profiles")
        .select("id, role, full_name, locale")
        .eq("id", existing.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      if (profile) {
        // Profile ada — sync kalau beda
        const needsUpdate =
          profile.role !== userData.role ||
          profile.full_name !== userData.full_name ||
          profile.locale !== userData.locale;

        if (needsUpdate) {
          const { error: updateErr } = await supabase
            .from("user_profiles")
            .update({
              role: userData.role,
              full_name: userData.full_name,
              locale: userData.locale ?? "id",
            })
            .eq("id", existing.id);
          if (updateErr) throw updateErr;
          console.log(`   🔄 Profile di-sync (role/name/locale)`);
          return { status: "updated", ...userData };
        }

        console.log(`   ⏭️  Profile sudah match, skip`);
        return { status: "skipped", ...userData };
      }

      // Auth user ada tapi profile hilang → re-create profile
      const { error: insertErr } = await supabase.from("user_profiles").insert({
        id: existing.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        locale: userData.locale ?? "id",
      });
      if (insertErr) throw insertErr;
      console.log(`   ✅ Profile re-created (orphan auth user)`);
      return { status: "linked", ...userData };
    }

    // 2. Auth user belum ada → create baru
    console.log(`   🔐 Create auth user...`);
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        locale: userData.locale ?? "id",
      },
    });

    if (authErr) throw authErr;
    if (!authData?.user) throw new Error("No user returned from auth.admin.createUser");

    console.log(`   ✅ Auth user created: ${authData.user.id}`);

    // 3. Tunggu trigger handle_new_user selesai
    await new Promise((r) => setTimeout(r, 800));

    // 4. Trigger default role = 'user'. Update kalau beda.
    if (userData.role !== "user") {
      const { error: updateErr } = await supabase
        .from("user_profiles")
        .update({
          role: userData.role,
          full_name: userData.full_name,
          locale: userData.locale ?? "id",
        })
        .eq("id", authData.user.id);
      if (updateErr) throw updateErr;
      console.log(`   👑 Role di-set: ${userData.role}`);
    }

    console.log(`   ✅ DONE`);
    return { status: "created", ...userData, auth_id: authData.user.id };
  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return { status: "failed", ...userData, error: error.message };
  }
}

// ============================================================
//  🎬 MAIN
// ============================================================
async function main() {
  console.log("🚀 SEED USERS — Boilerplate");
  console.log("=============================================");
  console.log(`📋 Target: ${userList.length} user`);
  console.log(`🎯 Supabase: ${SUPABASE_URL}`);

  // Validasi dulu semua sebelum eksekusi
  const allValid = userList.every((u, i) => validateUser(u, i));
  if (!allValid) {
    console.error("\n❌ Ada data user yang invalid. Fix dulu sebelum seed.\n");
    process.exit(1);
  }

  const results = {
    created: [],
    updated: [],
    linked: [],
    skipped: [],
    failed: [],
  };

  for (const user of userList) {
    const result = await upsertUser(user);
    results[result.status]?.push(result);
    // Rate limit friendly — kecilin kalau seed banyak user
    await new Promise((r) => setTimeout(r, 300));
  }

  // ============================================================
  //  📊 SUMMARY
  // ============================================================
  console.log("\n\n=============================================");
  console.log("📊 HASIL");
  console.log("=============================================\n");

  const print = (label, emoji, rows) => {
    console.log(`${emoji} ${label.padEnd(8)} : ${rows.length}`);
    rows.forEach((r) => {
      const detail = r.error ? ` — ${r.error}` : "";
      console.log(`   ${emoji} ${r.full_name} <${r.email}> [${r.role}]${detail}`);
    });
    if (rows.length === 0) console.log(`   (none)`);
    console.log();
  };

  print("Created", "✅", results.created);
  print("Updated", "🔄", results.updated);
  print("Linked", "🔗", results.linked);
  print("Skipped", "⏭️ ", results.skipped);
  print("Failed", "❌", results.failed);

  // ============================================================
  //  🔑 CREDENTIALS
  // ============================================================
  console.log("=============================================");
  console.log("🔑 LOGIN CREDENTIALS");
  console.log("=============================================\n");
  userList.forEach((u) => {
    console.log(`👤 ${u.full_name} [${u.role}]`);
    console.log(`   Email    : ${u.email}`);
    console.log(`   Password : ${u.password}\n`);
  });
  console.log("⚠️  Ganti password setelah login pertama!");
  console.log("⚠️  Untuk production: hapus seed default, bikin admin manual.\n");

  // Exit code — non-zero kalau ada failure
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("✅ Seed selesai!\n");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Seed gagal:", err);
    process.exit(1);
  });