-- =====================================================================
--  SETUP.SQL — Phase 0 + 1 + 2 FINAL (FULL RESET, ALL-IN-ONE)
-- =====================================================================
--
--  File ini adalah SINGLE SOURCE OF TRUTH untuk schema database.
--  Jalanin sekali, semua tabel + trigger + RLS + storage bucket ready.
--
--  Status pengembangan: 🔒 FINAL di Phase 2. Tidak ada Phase 3.
--
--  ─────────────────────────────────────────────────────────────────
--  📝 CHANGELOG (penting — jangan revert):
--
--  v2 (RLS recursion fix):
--    Policy admin di user_profiles sebelumnya pakai subquery ke
--    user_profiles sendiri di USING clause → PostgreSQL 42P17
--    infinite recursion. Fix: pakai is_admin() helper (SECURITY
--    DEFINER) yang bypass RLS saat dipanggil — gak trigger policy
--    lagi. Function udah ada sejak v1, cuma gak dipake di policy.
--    Sekalian activity_logs + storage admin policy juga diarahkan
--    ke is_admin() biar konsisten + lebih performant (query plan
--    cacheable karena STABLE).
--  ─────────────────────────────────────────────────────────────────
--
--  Scope:
--    SECTION A. AUTH FOUNDATION                  (Phase 0 + 1)
--      - user_profiles, activity_logs
--      - Triggers: handle_new_user (OAuth-aware), handle_updated_at
--      - Helper: is_admin(), is_admin(uuid)
--      - RLS policies
--      - Storage bucket: avatars
--
--    SECTION B. COMMERCE — PHASE 1              (Credentials)
--      - commerce_credentials (LS API keys, encrypted)
--
--    SECTION C. COMMERCE — PHASE 2              (CRUD wrapper)
--      - commerce_webhook_configs   (per-user webhook URL + secret)
--      - commerce_webhook_events    (idempotent event log)
--      - commerce_orders            (synced from LS)
--      - commerce_subscriptions     (synced from LS)
--      - commerce_customers         (synced from LS)
--
--    SECTION D. BACKFILL & SANITY CHECK
--
-- ---------------------------------------------------------------------
--  CATATAN: AUTH EMAIL MODULE — STATELESS (NO DB SCHEMA)
--
--  Phase 2 juga include custom auth email via Resend + Supabase Send
--  Email Hook. Module ini STATELESS — gak butuh table di DB.
--
--  Supabase yang handle token generation/expiry di auth.users (sudah
--  managed). Kita cuma render template + kirim via Resend lewat hook
--  endpoint di /api/auth/hooks/send-email.
--
--  Setup Resend + Hook di-handle via Supabase Dashboard + env vars,
--  bukan SQL. Lihat instruksi di akhir file ini (D.2 output).
--
-- ---------------------------------------------------------------------
--  FILOSOFI:
--    Phase 2 = thin wrapper ke Lemon Squeezy + Resend.
--    Semua engine (analytics, receipt, customer portal, email delivery)
--    delegasi ke service eksternal. Boilerplate cuma state sync + UI.
--
-- ---------------------------------------------------------------------
--  ⚠️  PERINGATAN:
--  File ini MENGHAPUS dan MEMBUAT ULANG semua tabel public.commerce_*
--  dan public.user_profiles, public.activity_logs.
--
--  ⚠️  Yang DIPRESERVE (tidak dihapus):
--      - auth.users (Supabase-managed)
--      - storage.buckets: 'avatars' (config di-upsert aja)
--      - storage.objects: file avatar yang udah di-upload user
--
--  ⚠️  Profile di public.user_profiles akan di-backfill ulang dengan
--      role default 'user' (elevate manual setelahnya).
--
--  JALANKAN HANYA DI:
--    ✅ Fresh Supabase project
--    ✅ Development environment (data bisa hilang)
--    ❌ Production yang sudah punya data real
--
--  Cara pakai:
--    1. Supabase Dashboard → SQL Editor → New query
--    2. Paste seluruh isi file ini → Run
--    3. Lihat pesan "SETUP COMPLETE" di akhir output
--    4. Lanjut: node scripts/seed.js
--
--  Setelah jalan, regenerate types:
--    npx supabase gen types typescript --project-id <YOUR_ID> \
--      > src/core/types/database.ts
-- =====================================================================

-- ---------------------------------------------------------------------
-- STEP 0: SAFETY EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- STEP 1: DROP EVERYTHING (idempotent — aman walau table belum ada)
-- ---------------------------------------------------------------------
--  Catatan penting tentang `DROP ... IF EXISTS`:
--
--    DROP POLICY IF EXISTS "xxx" ON public.foo;
--    DROP TRIGGER IF EXISTS yyy ON public.foo;
--
--  `IF EXISTS` hanya cek apakah POLICY/TRIGGER-nya ada, BUKAN cek
--  apakah TABLE-nya ada. Kalau `public.foo` belum pernah dibuat,
--  PostgreSQL throw `42P01 relation does not exist` — walau pakai
--  IF EXISTS.
--
--  Solusi: drop TABLE-nya duluan dengan CASCADE. CASCADE otomatis
--  drop semua policy/trigger/index/FK yang nempel di table itu.
-- ---------------------------------------------------------------------

-- Storage policies (avatars_*) — drop via loop, aman karena storage.objects selalu ada
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE 'avatars_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Trigger di auth.users — auth.users selalu ada (Supabase-managed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop public tables — CASCADE handle semua dependency
-- Urutan drop: child tables dulu (commerce_*), baru parent (user_profiles)
DROP TABLE IF EXISTS public.commerce_webhook_events   CASCADE;
DROP TABLE IF EXISTS public.commerce_webhook_configs  CASCADE;
DROP TABLE IF EXISTS public.commerce_orders           CASCADE;
DROP TABLE IF EXISTS public.commerce_subscriptions    CASCADE;
DROP TABLE IF EXISTS public.commerce_customers        CASCADE;
DROP TABLE IF EXISTS public.commerce_credentials      CASCADE;
DROP TABLE IF EXISTS public.activity_logs             CASCADE;
DROP TABLE IF EXISTS public.user_profiles             CASCADE;

-- Legacy table dari versi sebelumnya — drop kalau masih ada
DROP TABLE IF EXISTS public.stripe_events CASCADE;

-- Functions — last, setelah semua caller-nya hilang
DROP FUNCTION IF EXISTS public.handle_new_user()    CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at()  CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at()   CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at()     CASCADE;
DROP FUNCTION IF EXISTS public.is_admin()           CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid)       CASCADE;


-- =====================================================================
-- ═══════════════════ SECTION A. AUTH FOUNDATION ═══════════════════
-- =====================================================================

-- ---------------------------------------------------------------------
-- A.1  user_profiles — universal profile, module-agnostic
-- ---------------------------------------------------------------------
--  Generic — gak ada kolom spesifik module. Extension per module pakai
--  `metadata` jsonb (namespace by module).
--
--  Role: string (bukan enum) supaya config-driven. Valid values
--  match dengan `appConfig.auth.roles` di src/config/app.config.ts.
-- ---------------------------------------------------------------------
CREATE TABLE public.user_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text NOT NULL DEFAULT '',
  email        text,
  role         text NOT NULL DEFAULT 'user',
  avatar_url   text,
  phone        text,
  locale       text NOT NULL DEFAULT 'id',
  is_active    boolean NOT NULL DEFAULT true,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_profiles_role_check
    CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer', 'user')),

  CONSTRAINT user_profiles_locale_check
    CHECK (locale IN ('id', 'en'))
);

CREATE INDEX user_profiles_role_idx      ON public.user_profiles(role);
CREATE INDEX user_profiles_is_active_idx ON public.user_profiles(is_active);
CREATE INDEX user_profiles_email_idx     ON public.user_profiles(email);
CREATE INDEX user_profiles_metadata_idx  ON public.user_profiles USING gin (metadata);

COMMENT ON TABLE  public.user_profiles IS
  'Universal user profile. Extend per module via metadata jsonb.';
COMMENT ON COLUMN public.user_profiles.role IS
  'Role string matching appConfig.auth.roles. Config-driven via CHECK.';
COMMENT ON COLUMN public.user_profiles.metadata IS
  'Module-scoped extension. Namespace by module: {"commerce":{...},"saas":{...}}';
COMMENT ON COLUMN public.user_profiles.locale IS
  'User preferred locale. Matches appConfig.locale.available.';

-- ---------------------------------------------------------------------
-- A.2  activity_logs — append-only audit log
-- ---------------------------------------------------------------------
CREATE TABLE public.activity_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action         text NOT NULL,
  resource_type  text,
  resource_id    text,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address     inet,
  user_agent     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activity_logs_user_id_idx    ON public.activity_logs(user_id);
CREATE INDEX activity_logs_created_at_idx ON public.activity_logs(created_at DESC);
CREATE INDEX activity_logs_action_idx     ON public.activity_logs(action);
CREATE INDEX activity_logs_resource_idx   ON public.activity_logs(resource_type, resource_id);
CREATE INDEX activity_logs_metadata_idx   ON public.activity_logs USING gin (metadata);

COMMENT ON TABLE  public.activity_logs IS
  'Audit log. Append-only. Populated via activity.service.ts.';
COMMENT ON COLUMN public.activity_logs.action IS
  'Dot-notation action key, e.g. "user.login", "admin.user.deactivate".';

-- ---------------------------------------------------------------------
-- A.3  Helper functions
-- ---------------------------------------------------------------------

-- Auto-update `updated_at` timestamp.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Admin check (SECURITY DEFINER — kunci anti-recursion di RLS)
-- ─────────────────────────────────────────────────────────────────────
--
--  WHY SECURITY DEFINER:
--    Pas function ini dipanggil dari USING clause policy di
--    user_profiles, query SELECT di dalam function run as function
--    owner (postgres, yang BYPASSRLS). Jadi gak trigger policy di
--    user_profiles lagi → no recursion.
--
--    Kalau kita inline subquery di policy (tanpa function wrapper),
--    subquery itu run as current user → trigger policy di table yang
--    sama → rekursi → error 42P17 "infinite recursion detected in
--    policy for relation user_profiles".
--
--  VARIAN:
--    is_admin()      → cek current user (auth.uid())
--    is_admin(uuid)  → cek user tertentu (dipake dari app layer)
--
--  STABLE: Function returns same result for same input within
--  transaction → Postgres query planner boleh cache.
--
--  SET search_path = public: Prevent search_path injection kalau
--  ada attacker yang bisa set search_path.
-- ─────────────────────────────────────────────────────────────────────

-- Parameterized variant — cek user tertentu.
-- Dipakai dari application layer (service).
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = check_user_id
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  );
$$;

-- No-arg variant — cek current user. Ergonomic di RLS policy.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  );
$$;

-- Grant execute ke role yang butuh — authenticated & anon supaya
-- callable dari RLS context. Tanpa grant, function invisible dari
-- PostgREST context walaupun SECURITY DEFINER.
GRANT EXECUTE ON FUNCTION public.is_admin()     TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- ---------------------------------------------------------------------
-- A.4  handle_new_user — OAuth-aware profile auto-provisioning
-- ---------------------------------------------------------------------
--  Resolve full_name dari banyak source (urutan prioritas):
--    1. raw_user_meta_data.full_name  (email signup — kita inject sendiri)
--    2. raw_user_meta_data.name       (Google OAuth — standard field)
--    3. given_name + family_name      (Google OAuth — fallback)
--    4. email prefix                   (last resort)
--    5. 'User'                         (very last resort — email null)
--
--  Avatar: support Google ('picture') dan provider lain ('avatar_url').
--
--  Locale: filter ke whitelist sebelum INSERT, biar CHECK constraint
--  gak crash kalau Google kirim locale di luar 'id'/'en' (mis. 'fr-FR').
--
--  EXCEPTION handler: signup HARUS sukses walau profile creation gagal
--  (edge case). Admin bisa fix profile manual nanti. Fail-hard signup
--  lebih buruk UX-nya.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_name   text;
  resolved_locale text;
  resolved_avatar text;
BEGIN
  -- Full name fallback chain
  resolved_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(TRIM(CONCAT(
      NEW.raw_user_meta_data ->> 'given_name',
      ' ',
      NEW.raw_user_meta_data ->> 'family_name'
    )), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'User'
  );

  -- Locale — filter ke whitelist, fallback ke 'id'
  resolved_locale := CASE
    WHEN NEW.raw_user_meta_data ->> 'locale' IN ('id', 'en')
      THEN NEW.raw_user_meta_data ->> 'locale'
    ELSE 'id'
  END;

  -- Avatar — Google pakai 'picture', provider lain pakai 'avatar_url'
  resolved_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'picture', '')
  );

  INSERT INTO public.user_profiles (
    id, email, full_name, avatar_url, role, locale
  )
  VALUES (
    NEW.id,
    NEW.email,
    resolved_name,
    resolved_avatar,
    'user',
    resolved_locale
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Fail-soft: log warning tapi biarin signup lanjut.
    RAISE WARNING '[handle_new_user] failed for user %: % (%)',
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- A.5  Triggers
-- ---------------------------------------------------------------------
CREATE TRIGGER on_user_profiles_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- A.6  Row Level Security — auth tables
-- ---------------------------------------------------------------------
--  CRITICAL: Policy admin di user_profiles HARUS pakai public.is_admin()
--  (SECURITY DEFINER), BUKAN inline subquery ke user_profiles.
--
--  SALAH (infinite recursion — error 42P17):
--    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id=auth.uid() ...))
--
--  BENAR:
--    USING (public.is_admin())
--
--  Policy di table lain (activity_logs, storage.objects) secara teknis
--  gak bakal recursive karena mereka query ke user_profiles (beda
--  table). Tapi tetep pake is_admin() biar:
--    1. Konsisten
--    2. Query plan cacheable (function STABLE)
--    3. Satu source of truth untuk definisi "admin"
-- ---------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ---- user_profiles policies ----

CREATE POLICY "user_profiles_self_select"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_admin_select_all"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "user_profiles_self_update"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_admin_update_all"
  ON public.user_profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_profiles_admin_insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "user_profiles_admin_delete"
  ON public.user_profiles FOR DELETE
  USING (public.is_admin());

-- ---- activity_logs policies ----

CREATE POLICY "activity_logs_self_select"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "activity_logs_admin_select_all"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "activity_logs_authenticated_insert"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );
-- Append-only: no UPDATE / DELETE policies.

-- ---------------------------------------------------------------------
-- A.7  Storage — avatars bucket (tied to user profile)
-- ---------------------------------------------------------------------
-- Upsert bucket config — gak bisa DELETE karena Supabase protect_delete
-- trigger, dan juga kita WANT to preserve existing user avatars.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- User upload — hanya ke folder <user_id>/...
CREATE POLICY "avatars_user_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- User update — hanya file miliknya
CREATE POLICY "avatars_user_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- User delete — hanya file miliknya
CREATE POLICY "avatars_user_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin override
CREATE POLICY "avatars_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.is_admin()
  );


-- =====================================================================
-- ═══════════════════ SECTION B. COMMERCE — PHASE 1 ═══════════════════
-- =====================================================================

-- ---------------------------------------------------------------------
-- B.1  commerce_credentials — Lemon Squeezy API keys (encrypted)
-- ---------------------------------------------------------------------
--  Simpan encrypted API key per user per provider.
--
--  Security model:
--    - `encrypted_api_key` pakai AES-256-GCM (lihat src/core/lib/encryption.ts)
--    - Master key di ENCRYPTION_KEY env (server-only)
--    - `key_hint` = masked partial untuk display (e.g. "********xyz9")
--    - RLS: user cuma akses row-nya sendiri (owner_user_id = auth.uid())
--
--  UNIQUE (owner_user_id, provider) — 1 credential per provider per user.
-- ---------------------------------------------------------------------
CREATE TABLE public.commerce_credentials (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider          text NOT NULL DEFAULT 'lemonsqueezy',
  encrypted_api_key text NOT NULL,
  key_hint          text NOT NULL,
  store_id          text,
  store_name        text,
  is_test_mode      boolean NOT NULL DEFAULT false,
  last_verified_at  timestamptz,
  last_used_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT commerce_credentials_provider_check
    CHECK (provider IN ('lemonsqueezy')),

  CONSTRAINT commerce_credentials_owner_provider_unique
    UNIQUE (owner_user_id, provider)
);

CREATE INDEX commerce_credentials_owner_idx
  ON public.commerce_credentials(owner_user_id);
CREATE INDEX commerce_credentials_provider_idx
  ON public.commerce_credentials(provider);

COMMENT ON TABLE  public.commerce_credentials IS
  'Encrypted commerce provider credentials (Phase 1: Lemon Squeezy only).';
COMMENT ON COLUMN public.commerce_credentials.encrypted_api_key IS
  'AES-256-GCM encrypted. Decrypt via src/core/lib/encryption.ts on server.';
COMMENT ON COLUMN public.commerce_credentials.key_hint IS
  'Masked partial key safe for client display (e.g. "********xyz9").';

CREATE TRIGGER on_commerce_credentials_updated
  BEFORE UPDATE ON public.commerce_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.commerce_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commerce_credentials_self_select"
  ON public.commerce_credentials FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "commerce_credentials_self_insert"
  ON public.commerce_credentials FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "commerce_credentials_self_update"
  ON public.commerce_credentials FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "commerce_credentials_self_delete"
  ON public.commerce_credentials FOR DELETE
  USING (auth.uid() = owner_user_id);


-- =====================================================================
-- ═══════════════════ SECTION C. COMMERCE — PHASE 2 ═══════════════════
-- =====================================================================
-- Thin wrapper tables — sync state dari Lemon Squeezy.
-- Semua engine/analytics/receipt tetap di LS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- C.1  commerce_webhook_configs — per-user webhook URL + secret
-- ---------------------------------------------------------------------
--  User generate webhook config via UI → dapet unique URL token buat
--  di-register di LS dashboard mereka:
--    {APP_URL}/api/commerce/webhooks/{webhook_token}
--
--  Secret di-encrypt AES-GCM sama kayak API key.
-- ---------------------------------------------------------------------
CREATE TABLE public.commerce_webhook_configs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider          text NOT NULL DEFAULT 'lemonsqueezy',
  encrypted_secret  text NOT NULL,
  secret_hint       text NOT NULL,
  -- Random URL-safe token, unique. Dipake di path /api/commerce/webhooks/{token}
  webhook_token     text NOT NULL UNIQUE,
  -- Optional: LS webhook ID kalau kita auto-register via API
  ls_webhook_id     text,
  -- Events yang di-subscribe (informational)
  subscribed_events text[] NOT NULL DEFAULT ARRAY[
    'order_created','order_refunded',
    'subscription_created','subscription_updated','subscription_cancelled',
    'subscription_resumed','subscription_expired','subscription_paused',
    'subscription_unpaused','subscription_payment_success',
    'subscription_payment_failed','subscription_payment_recovered'
  ],
  is_active         boolean NOT NULL DEFAULT true,
  last_event_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT commerce_webhook_configs_provider_check
    CHECK (provider IN ('lemonsqueezy')),

  CONSTRAINT commerce_webhook_configs_owner_provider_unique
    UNIQUE (owner_user_id, provider)
);

CREATE INDEX commerce_webhook_configs_token_idx
  ON public.commerce_webhook_configs(webhook_token);

COMMENT ON TABLE  public.commerce_webhook_configs IS
  'Per-user webhook config: unique URL token + HMAC secret (encrypted).';

CREATE TRIGGER on_commerce_webhook_configs_updated
  BEFORE UPDATE ON public.commerce_webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.commerce_webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commerce_webhook_configs_self_all"
  ON public.commerce_webhook_configs FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- ---------------------------------------------------------------------
-- C.2  commerce_webhook_events — append-only event log
-- ---------------------------------------------------------------------
--  Dual-purpose:
--    a) Idempotency: UNIQUE(provider, event_id) cegah duplicate processing
--    b) Audit trail + debugging (payload disimpan utuh di payload jsonb)
--
--  Processing state:
--    - received_at : selalu di-set saat insert
--    - verified    : signature HMAC valid
--    - processed_at: udah di-route ke handler & sukses apply ke tabel
--    - error       : error message kalau processing gagal
--
--  INSERT via service role (webhook request dari LS, no session).
--  User cuma boleh SELECT untuk debugging di UI.
-- ---------------------------------------------------------------------
CREATE TABLE public.commerce_webhook_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider       text NOT NULL DEFAULT 'lemonsqueezy',
  -- LS pake X-Event-Id header — unique per event
  event_id       text NOT NULL,
  -- e.g. "order_created", "subscription_payment_success"
  event_name     text NOT NULL,
  -- Full JSON body dari LS
  payload        jsonb NOT NULL,
  signature      text,
  verified       boolean NOT NULL DEFAULT false,
  processed_at   timestamptz,
  error          text,
  received_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT commerce_webhook_events_provider_check
    CHECK (provider IN ('lemonsqueezy')),

  CONSTRAINT commerce_webhook_events_provider_event_unique
    UNIQUE (provider, event_id)
);

CREATE INDEX commerce_webhook_events_owner_received_idx
  ON public.commerce_webhook_events(owner_user_id, received_at DESC);
CREATE INDEX commerce_webhook_events_unprocessed_idx
  ON public.commerce_webhook_events(received_at)
  WHERE processed_at IS NULL;

COMMENT ON TABLE  public.commerce_webhook_events IS
  'Append-only webhook event log. Idempotent via UNIQUE(provider, event_id).';

ALTER TABLE public.commerce_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commerce_webhook_events_self_select"
  ON public.commerce_webhook_events FOR SELECT
  USING (auth.uid() = owner_user_id);

-- ---------------------------------------------------------------------
-- C.3  commerce_orders — synced from LS
-- ---------------------------------------------------------------------
--  Snapshot order dari LS. Di-populate via webhook (order_created,
--  order_refunded) atau via backfill service.
--
--  Semua monetary value di-store sebagai integer cents (konvensi LS).
--  Human-readable formatted string di-store juga (LS pre-formats).
--
--  User cuma SELECT. Write via service role dari webhook/backfill.
-- ---------------------------------------------------------------------
CREATE TABLE public.commerce_orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider            text NOT NULL DEFAULT 'lemonsqueezy',
  provider_order_id   text NOT NULL,
  order_number        integer,
  -- LS "identifier" field — UUID-like external ref
  identifier          text,

  -- Customer info (denormalized snapshot saat order dibuat)
  customer_email      text,
  customer_name       text,
  customer_id         text,
  store_id            text,

  -- Status: pending | paid | void | refunded | partial_refund
  status              text NOT NULL,
  status_formatted    text,

  currency            text NOT NULL,
  -- All amounts in cents
  subtotal            integer NOT NULL DEFAULT 0,
  tax                 integer NOT NULL DEFAULT 0,
  total               integer NOT NULL DEFAULT 0,
  refunded_amount     integer NOT NULL DEFAULT 0,
  -- Human-readable (LS pre-formats)
  subtotal_formatted  text,
  total_formatted     text,
  tax_formatted       text,

  refunded_at         timestamptz,
  -- LS created_at (bukan row created_at di DB kita)
  order_created_at    timestamptz,

  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload         jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT commerce_orders_provider_check
    CHECK (provider IN ('lemonsqueezy')),

  CONSTRAINT commerce_orders_provider_order_unique
    UNIQUE (provider, provider_order_id)
);

CREATE INDEX commerce_orders_owner_created_idx
  ON public.commerce_orders(owner_user_id, order_created_at DESC);
CREATE INDEX commerce_orders_status_idx
  ON public.commerce_orders(owner_user_id, status);
CREATE INDEX commerce_orders_customer_idx
  ON public.commerce_orders(owner_user_id, customer_id);

COMMENT ON TABLE public.commerce_orders IS
  'Orders synced from Lemon Squeezy via webhook or backfill.';

CREATE TRIGGER on_commerce_orders_updated
  BEFORE UPDATE ON public.commerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.commerce_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commerce_orders_self_select"
  ON public.commerce_orders FOR SELECT
  USING (auth.uid() = owner_user_id);

-- ---------------------------------------------------------------------
-- C.4  commerce_subscriptions — synced from LS
-- ---------------------------------------------------------------------
--  Subscription state dari LS. Di-populate via webhook dan juga
--  immediate sync setelah action (pause/resume/cancel) biar UI
--  gak nunggu webhook delay.
-- ---------------------------------------------------------------------
CREATE TABLE public.commerce_subscriptions (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                   text NOT NULL DEFAULT 'lemonsqueezy',
  provider_subscription_id   text NOT NULL,

  order_id                   text,
  order_item_id              text,
  product_id                 text,
  variant_id                 text,
  product_name               text,
  variant_name               text,

  customer_email             text,
  customer_name              text,
  customer_id                text,
  store_id                   text,

  -- Status: on_trial | active | paused | past_due | unpaid | cancelled | expired
  status                     text NOT NULL,
  status_formatted           text,

  -- Pause info
  pause_mode                 text, -- void | free
  pause_resumes_at           timestamptz,

  -- Payment method snapshot
  card_brand                 text,
  card_last_four             text,

  -- Billing cycle
  trial_ends_at              timestamptz,
  billing_anchor             smallint,
  renews_at                  timestamptz,
  ends_at                    timestamptz,

  subscription_created_at    timestamptz,

  metadata                   jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload                jsonb,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT commerce_subscriptions_provider_check
    CHECK (provider IN ('lemonsqueezy')),

  CONSTRAINT commerce_subscriptions_provider_sub_unique
    UNIQUE (provider, provider_subscription_id)
);

CREATE INDEX commerce_subscriptions_owner_created_idx
  ON public.commerce_subscriptions(owner_user_id, subscription_created_at DESC);
CREATE INDEX commerce_subscriptions_status_idx
  ON public.commerce_subscriptions(owner_user_id, status);
CREATE INDEX commerce_subscriptions_customer_idx
  ON public.commerce_subscriptions(owner_user_id, customer_id);

COMMENT ON TABLE public.commerce_subscriptions IS
  'Subscriptions synced from Lemon Squeezy. Actions proxied to LS API.';

CREATE TRIGGER on_commerce_subscriptions_updated
  BEFORE UPDATE ON public.commerce_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.commerce_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commerce_subscriptions_self_select"
  ON public.commerce_subscriptions FOR SELECT
  USING (auth.uid() = owner_user_id);

-- ---------------------------------------------------------------------
-- C.5  commerce_customers — synced from LS
-- ---------------------------------------------------------------------
CREATE TABLE public.commerce_customers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                text NOT NULL DEFAULT 'lemonsqueezy',
  provider_customer_id    text NOT NULL,

  email                   text,
  name                    text,
  city                    text,
  region                  text,
  country                 text,

  -- Aggregate financials (snapshot dari LS — LS yang compute)
  total_revenue_currency  integer DEFAULT 0,
  mrr                     integer DEFAULT 0,
  -- subscribed | unsubscribed | archived | requires_verification | invalid_email | bounced
  status                  text,

  metadata                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT commerce_customers_provider_check
    CHECK (provider IN ('lemonsqueezy')),

  CONSTRAINT commerce_customers_provider_customer_unique
    UNIQUE (provider, provider_customer_id)
);

CREATE INDEX commerce_customers_owner_idx
  ON public.commerce_customers(owner_user_id);
CREATE INDEX commerce_customers_email_idx
  ON public.commerce_customers(owner_user_id, email);

COMMENT ON TABLE public.commerce_customers IS
  'Customers synced from Lemon Squeezy. Aggregate numbers (MRR, total) computed by LS.';

CREATE TRIGGER on_commerce_customers_updated
  BEFORE UPDATE ON public.commerce_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.commerce_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commerce_customers_self_select"
  ON public.commerce_customers FOR SELECT
  USING (auth.uid() = owner_user_id);

-- ---------------------------------------------------------------------
-- C.6  Grants — standard Supabase pattern
-- ---------------------------------------------------------------------
-- Write access untuk commerce_* tables di-handle via service role dari
-- webhook route / backfill service. Authenticated user cuma SELECT
-- kecuali untuk webhook_configs (CRUD penuh karena user-managed).
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.commerce_webhook_configs TO authenticated;
GRANT SELECT ON public.commerce_webhook_events  TO authenticated;
GRANT SELECT ON public.commerce_orders          TO authenticated;
GRANT SELECT ON public.commerce_subscriptions   TO authenticated;
GRANT SELECT ON public.commerce_customers       TO authenticated;


-- =====================================================================
-- ═══════════════════ SECTION D. BACKFILL & SANITY CHECK ═══════════════════
-- =====================================================================

-- ---------------------------------------------------------------------
-- D.1  Backfill profiles untuk auth.users yang sudah ada
-- ---------------------------------------------------------------------
-- auth.users tidak dihapus saat nuclear (Supabase-managed), jadi kita
-- rebuild profile-nya. Role default 'user' — elevate ke admin nanti
-- via seed script atau manual UPDATE.
INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role, locale)
SELECT
  u.id,
  u.email,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
    NULLIF(TRIM(CONCAT(
      u.raw_user_meta_data ->> 'given_name',
      ' ',
      u.raw_user_meta_data ->> 'family_name'
    )), ''),
    NULLIF(split_part(COALESCE(u.email, ''), '@', 1), ''),
    'User'
  ),
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'avatar_url', ''),
    NULLIF(u.raw_user_meta_data ->> 'picture', '')
  ),
  'user',
  CASE
    WHEN u.raw_user_meta_data ->> 'locale' IN ('id', 'en')
      THEN u.raw_user_meta_data ->> 'locale'
    ELSE 'id'
  END
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- D.2  Sanity check + Next Steps (Phase 2 FINAL)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  profile_count          integer;
  activity_count         integer;
  credentials_count      integer;
  webhook_configs_count  integer;
  webhook_events_count   integer;
  orders_count           integer;
  subscriptions_count    integer;
  customers_count        integer;
  bucket_exists          boolean;
  admin_count            integer;
  rls_self_check_ok      boolean;
BEGIN
  SELECT count(*) INTO profile_count          FROM public.user_profiles;
  SELECT count(*) INTO activity_count         FROM public.activity_logs;
  SELECT count(*) INTO credentials_count      FROM public.commerce_credentials;
  SELECT count(*) INTO webhook_configs_count  FROM public.commerce_webhook_configs;
  SELECT count(*) INTO webhook_events_count   FROM public.commerce_webhook_events;
  SELECT count(*) INTO orders_count           FROM public.commerce_orders;
  SELECT count(*) INTO subscriptions_count    FROM public.commerce_subscriptions;
  SELECT count(*) INTO customers_count        FROM public.commerce_customers;
  SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars')
    INTO bucket_exists;
  SELECT count(*) INTO admin_count FROM public.user_profiles
    WHERE role IN ('super_admin', 'admin') AND is_active = true;

  -- RLS anti-recursion smoke test: panggil is_admin() dari context
  -- postgres (BYPASSRLS). Kalau ini error, berarti function belum
  -- ke-create sempurna atau ada syntax error.
  BEGIN
    PERFORM public.is_admin();
    rls_self_check_ok := true;
  EXCEPTION WHEN OTHERS THEN
    rls_self_check_ok := false;
  END;

  RAISE NOTICE '====================================================';
  RAISE NOTICE '  SETUP COMPLETE — PHASE 0 + 1 + 2 (FINAL, v2)';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '  SECTION A — Auth Foundation (Phase 0+1)';
  RAISE NOTICE '    user_profiles              : % rows', profile_count;
  RAISE NOTICE '      └─ admins                : %', admin_count;
  RAISE NOTICE '    activity_logs              : % rows (reset)', activity_count;
  RAISE NOTICE '    avatars bucket             : %',
    CASE WHEN bucket_exists THEN 'ready ✓' ELSE 'MISSING ✗' END;
  RAISE NOTICE '    is_admin() function        : %',
    CASE WHEN rls_self_check_ok THEN 'callable ✓' ELSE 'ERROR ✗' END;
  RAISE NOTICE '';
  RAISE NOTICE '  SECTION B — Commerce Phase 1';
  RAISE NOTICE '    commerce_credentials       : % rows (reset)', credentials_count;
  RAISE NOTICE '';
  RAISE NOTICE '  SECTION C — Commerce Phase 2';
  RAISE NOTICE '    commerce_webhook_configs   : % rows (reset)', webhook_configs_count;
  RAISE NOTICE '    commerce_webhook_events    : % rows (reset)', webhook_events_count;
  RAISE NOTICE '    commerce_orders            : % rows (reset)', orders_count;
  RAISE NOTICE '    commerce_subscriptions     : % rows (reset)', subscriptions_count;
  RAISE NOTICE '    commerce_customers         : % rows (reset)', customers_count;
  RAISE NOTICE '';
  RAISE NOTICE '  AUTH EMAIL MODULE (Phase 2)';
  RAISE NOTICE '    Stateless — no DB schema needed ✓';
  RAISE NOTICE '    Setup via Supabase Dashboard + env vars (see below)';
  RAISE NOTICE '====================================================';
  IF admin_count = 0 THEN
    RAISE NOTICE '  ⚠️  Belum ada admin user!';
    RAISE NOTICE '     Jalankan: node scripts/seed.js';
    RAISE NOTICE '     Atau elevate manual:';
    RAISE NOTICE '       UPDATE public.user_profiles';
    RAISE NOTICE '       SET role=''super_admin''';
    RAISE NOTICE '       WHERE email=''you@example.com'';';
    RAISE NOTICE '====================================================';
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '  NEXT STEPS — PHASE 2 FINAL CHECKLIST';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '';
  RAISE NOTICE '  [1] Seed users (recommended):';
  RAISE NOTICE '      node scripts/seed.js';
  RAISE NOTICE '';
  RAISE NOTICE '  [2] Generate ENCRYPTION_KEY (buat commerce credential):';
  RAISE NOTICE '      node -e "console.log(require(''crypto'')';
  RAISE NOTICE '        .randomBytes(32).toString(''base64''))"';
  RAISE NOTICE '      Simpan ke .env.local sebagai ENCRYPTION_KEY';
  RAISE NOTICE '      ⚠️  BACKUP ke password manager — kehilangan key =';
  RAISE NOTICE '         kehilangan semua encrypted credential!';
  RAISE NOTICE '';
  RAISE NOTICE '  [3] Regenerate TS types:';
  RAISE NOTICE '      npx supabase gen types typescript \';
  RAISE NOTICE '        --project-id <ID> > src/core/types/database.ts';
  RAISE NOTICE '';
  RAISE NOTICE '  [4] Supabase Auth Config:';
  RAISE NOTICE '      a. Auth → Providers → Email';
  RAISE NOTICE '         └─ Confirm email: match';
  RAISE NOTICE '            appConfig.auth.requireEmailVerification';
  RAISE NOTICE '';
  RAISE NOTICE '      b. Auth → URL Configuration → Redirect URLs:';
  RAISE NOTICE '         └─ {APP_URL}/api/auth/callback    (OAuth)';
  RAISE NOTICE '         └─ {APP_URL}/api/auth/confirm     (Email OTP)';
  RAISE NOTICE '         └─ {APP_URL}/reset-password';
  RAISE NOTICE '         └─ {APP_URL}/**                   (wildcard)';
  RAISE NOTICE '';
  RAISE NOTICE '      c. Auth → Providers → Google (optional):';
  RAISE NOTICE '         └─ Enable + set Client ID/Secret dari';
  RAISE NOTICE '            Google Cloud Console';
  RAISE NOTICE '';
  RAISE NOTICE '  [5] Setup Resend (untuk auth email):';
  RAISE NOTICE '      a. Daftar di resend.com + verify domain';
  RAISE NOTICE '         (DKIM + SPF DNS records)';
  RAISE NOTICE '      b. Generate API key → simpan sebagai';
  RAISE NOTICE '         RESEND_API_KEY di .env.local';
  RAISE NOTICE '      c. Set sender address:';
  RAISE NOTICE '         RESEND_FROM_EMAIL=';
  RAISE NOTICE '           "My App <noreply@yourdomain.com>"';
  RAISE NOTICE '';
  RAISE NOTICE '  [6] Register Supabase Send Email Hook:';
  RAISE NOTICE '      Auth → Hooks → Send Email Hook:';
  RAISE NOTICE '      a. Toggle Enable';
  RAISE NOTICE '      b. Type: HTTPS';
  RAISE NOTICE '      c. URL: {APP_URL}/api/auth/hooks/send-email';
  RAISE NOTICE '         (Dev: pakai ngrok tunnel)';
  RAISE NOTICE '      d. Copy generated secret (format: v1,whsec_xxx)';
  RAISE NOTICE '         → simpan sebagai SUPABASE_AUTH_HOOK_SECRET';
  RAISE NOTICE '';
  RAISE NOTICE '      ⚠️  Setelah hook enabled, Supabase gak pake';
  RAISE NOTICE '         default SMTP lagi. Semua auth email via hook';
  RAISE NOTICE '         → Resend.';
  RAISE NOTICE '';
  RAISE NOTICE '  [7] Install email dependencies (kalau belum):';
  RAISE NOTICE '      pnpm add resend @react-email/components \';
  RAISE NOTICE '              @react-email/render standardwebhooks';
  RAISE NOTICE '      pnpm add -D react-email';
  RAISE NOTICE '';
  RAISE NOTICE '  [8] Commerce setup (per-user, NOT deploy step):';
  RAISE NOTICE '      User generate LS credential via UI di';
  RAISE NOTICE '      /settings/integrations + webhook config di';
  RAISE NOTICE '      /settings/webhooks.';
  RAISE NOTICE '';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '  🔒 PHASE 2 = FINAL. No Phase 3 planned.';
  RAISE NOTICE '====================================================';
END $$;