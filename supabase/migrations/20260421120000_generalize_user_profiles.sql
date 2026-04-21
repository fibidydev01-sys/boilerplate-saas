-- =====================================================================
--  Migration: generalize_user_profiles
--  Adds: metadata (jsonb), email, locale columns + GIN index
--  Safe to run on existing production data (non-destructive).
-- =====================================================================

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add columns if not exist
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email     text,
  ADD COLUMN IF NOT EXISTS locale    text NOT NULL DEFAULT 'id',
  ADD COLUMN IF NOT EXISTS metadata  jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill email from auth.users for existing profiles
UPDATE public.user_profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- Indexes
CREATE INDEX IF NOT EXISTS user_profiles_email_idx
  ON public.user_profiles(email);

CREATE INDEX IF NOT EXISTS user_profiles_metadata_idx
  ON public.user_profiles USING gin (metadata);

-- Updated-at trigger function (shared)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_user_profiles_updated'
  ) THEN
    CREATE TRIGGER on_user_profiles_updated
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- is_admin helper (security-definer for RLS)
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

-- Auto-create profile trigger
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN public.user_profiles.metadata IS
  'Module-scoped extension. Namespace by module: {"commerce":{...},"saas":{...}}';
COMMENT ON COLUMN public.user_profiles.locale IS
  'User preferred locale. Matches appConfig.locale.available.';
COMMENT ON COLUMN public.user_profiles.email IS
  'Mirror of auth.users.email for easier queries. Auto-synced on signup.';
