-- =====================================================================
--  SETUP — Phase 1 Foundation (Incremental / Non-Destructive)
-- =====================================================================
--  File ini AMAN dijalankan di database yang sudah ada data.
--  Semua statement pakai IF NOT EXISTS / OR REPLACE / guarded DO block,
--  jadi idempotent — boleh run berkali-kali tanpa efek samping.
--
--  Kapan pakai file ini?
--    ✅ First-time setup di fresh Supabase project
--    ✅ Production yang sudah punya data real
--    ✅ Top-up environment yang udah ada sebagian
--
--  Kapan pakai nuclear-setup.sql?
--    ❌ Kalau mau reset total (HAPUS SEMUA DATA → rebuild from scratch)
--
--  Cara pakai:
--    1. Supabase Dashboard → SQL Editor → New query
--    2. Paste seluruh isi file ini
--    3. Run
--    4. Cek pesan "SETUP COMPLETE" di akhir output
--
--  Setelah jalan, regenerate types:
--    npx supabase gen types typescript --project-id <YOUR_ID> \
--      > src/core/types/database.ts
-- =====================================================================

-- ---------------------------------------------------------------------
-- STEP 0: EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- STEP 1: user_profiles
-- ---------------------------------------------------------------------
--  Universal profile table. Generic — gak ada kolom spesifik module.
--  Extension per module pakai `metadata` jsonb (namespace by module).
--
--  Role: string (bukan enum) supaya config-driven. Valid values
--  match dengan `appConfig.auth.roles` di src/config/app.config.ts.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
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
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Role constraint — match appConfig.auth.roles
-- Hapus constraint lama kalau ada (biar bisa update role list nanti)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_role_check'
  ) THEN
    ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_role_check;
  END IF;
END $$;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer', 'user'));

-- Locale constraint — match appConfig.locale.available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_locale_check'
  ) THEN
    ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_locale_check;
  END IF;
END $$;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_locale_check
  CHECK (locale IN ('id', 'en'));

-- Indexes
CREATE INDEX IF NOT EXISTS user_profiles_role_idx       ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_is_active_idx  ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx      ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_metadata_idx   ON public.user_profiles USING gin (metadata);

-- Comments
COMMENT ON TABLE  public.user_profiles IS
  'Universal user profile. Extend per module via metadata jsonb.';
COMMENT ON COLUMN public.user_profiles.role IS
  'Role string matching appConfig.auth.roles. Not an enum — config-driven via CHECK.';
COMMENT ON COLUMN public.user_profiles.metadata IS
  'Module-scoped extension. Namespace by module: {"commerce":{...},"saas":{...}}';
COMMENT ON COLUMN public.user_profiles.locale IS
  'User preferred locale. Matches appConfig.locale.available.';

-- ---------------------------------------------------------------------
-- STEP 2: activity_logs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
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

CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx       ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx    ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx        ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS activity_logs_resource_idx      ON public.activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS activity_logs_metadata_idx      ON public.activity_logs USING gin (metadata);

COMMENT ON TABLE  public.activity_logs IS
  'Audit log. Append-only. Populated via activity.service.ts.';
COMMENT ON COLUMN public.activity_logs.action IS
  'Dot-notation action key, e.g. "user.login", "profile.update", "admin.user.deactivate".';
COMMENT ON COLUMN public.activity_logs.resource_type IS
  'Optional resource type: "user", "order", "post", etc.';

-- ---------------------------------------------------------------------
-- STEP 3: stripe_events (webhook idempotency)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id            text PRIMARY KEY,
  type          text NOT NULL,
  api_version   text,
  payload       jsonb NOT NULL,
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  error         text,
  retry_count   integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS stripe_events_type_idx         ON public.stripe_events(type);
CREATE INDEX IF NOT EXISTS stripe_events_received_at_idx  ON public.stripe_events(received_at DESC);
CREATE INDEX IF NOT EXISTS stripe_events_unprocessed_idx  ON public.stripe_events(received_at)
  WHERE processed_at IS NULL;

COMMENT ON TABLE  public.stripe_events IS
  'Stripe webhook idempotency & audit log. Prevents double-processing on retry.';
COMMENT ON COLUMN public.stripe_events.id IS
  'Stripe event.id — natural primary key for idempotency.';
COMMENT ON COLUMN public.stripe_events.processed_at IS
  'NULL = pending/failed. Set when handler completes successfully.';

-- ---------------------------------------------------------------------
-- STEP 4: HELPER FUNCTIONS
-- ---------------------------------------------------------------------

-- Auto-update `updated_at`
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Admin check — security-definer supaya gak recursion di RLS
-- Sync dengan appConfig.auth.adminRoles di src/config/app.config.ts
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

-- Auto-create profile untuk user baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'user',
    COALESCE(NEW.raw_user_meta_data ->> 'locale', 'id')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- STEP 5: TRIGGERS (drop & recreate untuk pastiin attachment terbaru)
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_user_profiles_updated ON public.user_profiles;
CREATE TRIGGER on_user_profiles_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- STEP 6: ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
ALTER TABLE public.user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events  ENABLE ROW LEVEL SECURITY;

-- ---- user_profiles policies ----
DROP POLICY IF EXISTS "user_profiles_self_select"       ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_select_all"  ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_self_update"       ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_all"  ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_insert"      ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_delete"      ON public.user_profiles;

CREATE POLICY "user_profiles_self_select"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_admin_select_all"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "user_profiles_self_update"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_admin_update_all"
  ON public.user_profiles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_profiles_admin_insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_profiles_admin_delete"
  ON public.user_profiles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ---- activity_logs policies ----
DROP POLICY IF EXISTS "activity_logs_self_select"            ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_admin_select_all"       ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_authenticated_insert"   ON public.activity_logs;

CREATE POLICY "activity_logs_self_select"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "activity_logs_admin_select_all"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "activity_logs_authenticated_insert"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );
-- Append-only: tidak ada UPDATE / DELETE policy.

-- ---- stripe_events policies ----
DROP POLICY IF EXISTS "stripe_events_admin_select" ON public.stripe_events;

CREATE POLICY "stripe_events_admin_select"
  ON public.stripe_events FOR SELECT
  USING (public.is_admin(auth.uid()));
-- Webhook pakai SERVICE_ROLE_KEY (bypass RLS) untuk INSERT/UPDATE.

-- ---------------------------------------------------------------------
-- STEP 7: AVATARS STORAGE BUCKET
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop semua policy avatar lama biar re-apply bersih
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
    AND public.is_admin(auth.uid())
  );

-- ---------------------------------------------------------------------
-- STEP 8: BACKFILL (dev-friendly, aman untuk prod)
-- ---------------------------------------------------------------------
-- Kalau sudah ada auth.users tapi belum ada user_profiles, buat otomatis.
-- ON CONFLICT DO NOTHING — safe kalau sudah ada.
INSERT INTO public.user_profiles (id, email, full_name, role, locale)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'user',
  COALESCE(u.raw_user_meta_data ->> 'locale', 'id')
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- STEP 9: SANITY CHECK
-- ---------------------------------------------------------------------
DO $$
DECLARE
  profile_count   integer;
  activity_count  integer;
  stripe_count    integer;
  bucket_exists   boolean;
  admin_count     integer;
BEGIN
  SELECT count(*) INTO profile_count  FROM public.user_profiles;
  SELECT count(*) INTO activity_count FROM public.activity_logs;
  SELECT count(*) INTO stripe_count   FROM public.stripe_events;
  SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') INTO bucket_exists;
  SELECT count(*) INTO admin_count    FROM public.user_profiles
    WHERE role IN ('super_admin', 'admin') AND is_active = true;

  RAISE NOTICE '====================================================';
  RAISE NOTICE '  SETUP COMPLETE (incremental)';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '  user_profiles   : % rows', profile_count;
  RAISE NOTICE '    └─ admins     : %', admin_count;
  RAISE NOTICE '  activity_logs   : % rows', activity_count;
  RAISE NOTICE '  stripe_events   : % rows', stripe_count;
  RAISE NOTICE '  avatars bucket  : %', CASE WHEN bucket_exists THEN 'ready ✓' ELSE 'MISSING ✗' END;
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
  RAISE NOTICE '  Next: regenerate TS types';
  RAISE NOTICE '    npx supabase gen types typescript --project-id <ID> \';
  RAISE NOTICE '      > src/core/types/database.ts';
  RAISE NOTICE '====================================================';
END $$;