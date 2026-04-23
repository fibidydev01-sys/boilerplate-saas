-- =================================================================
-- Migration: commerce_credentials table
-- Purpose  : Store encrypted LS (Lemon Squeezy) API keys per-user
-- Phase    : 1 (Commerce foundation)
-- =================================================================

CREATE TABLE IF NOT EXISTS public.commerce_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (Phase 1: per-user, 1 user = 1 credential per provider)
  owner_user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Provider identifier (future-proof: stripe, paddle, dll)
  provider text NOT NULL DEFAULT 'lemonsqueezy',

  -- Encrypted API key (AES-256-GCM, base64 encoded)
  -- Format: base64(iv || ciphertext || authTag)
  encrypted_api_key text NOT NULL,

  -- Last N chars plaintext — safe untuk display ("****xyz9")
  key_hint text NOT NULL,

  -- LS store info (cached dari verification call)
  store_id text,
  store_name text,

  -- Mode (test/live)
  is_test_mode boolean NOT NULL DEFAULT false,

  -- Audit trail
  last_verified_at timestamptz,
  last_used_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: 1 user = 1 credential per provider
  UNIQUE (owner_user_id, provider)
);

-- Index untuk query by owner (RLS akan pake ini)
CREATE INDEX IF NOT EXISTS commerce_credentials_owner_idx
  ON public.commerce_credentials(owner_user_id);

-- Enable RLS
ALTER TABLE public.commerce_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies kalau ada (idempotent)
DROP POLICY IF EXISTS "commerce_credentials_owner_select" ON public.commerce_credentials;
DROP POLICY IF EXISTS "commerce_credentials_owner_insert" ON public.commerce_credentials;
DROP POLICY IF EXISTS "commerce_credentials_owner_update" ON public.commerce_credentials;
DROP POLICY IF EXISTS "commerce_credentials_owner_delete" ON public.commerce_credentials;

-- RLS Policies
CREATE POLICY "commerce_credentials_owner_select"
  ON public.commerce_credentials FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "commerce_credentials_owner_insert"
  ON public.commerce_credentials FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "commerce_credentials_owner_update"
  ON public.commerce_credentials FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "commerce_credentials_owner_delete"
  ON public.commerce_credentials FOR DELETE
  USING (owner_user_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS commerce_credentials_set_updated_at ON public.commerce_credentials;

CREATE TRIGGER commerce_credentials_set_updated_at
  BEFORE UPDATE ON public.commerce_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =================================================================
-- Rollback:
--
-- DROP TABLE IF EXISTS public.commerce_credentials CASCADE;
-- DROP FUNCTION IF EXISTS public.set_updated_at();
-- =================================================================
