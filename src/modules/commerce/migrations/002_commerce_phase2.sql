-- =====================================================================
-- Commerce Phase 2 — Orders, Subscriptions, Customers, Webhooks
-- =====================================================================
-- Prasyarat: migration Phase 1 (commerce_credentials) udah dijalankan.
-- Jalankan: supabase db push  (atau copy-paste ke SQL editor Supabase)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: touch updated_at (kalau belum ada dari migration sebelumnya)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 1. commerce_webhook_configs
-- ---------------------------------------------------------------------
-- Per-user webhook secret + URL token. User dapet URL unik buat
-- di-registrasiin di dashboard LS mereka:
--   {APP_URL}/api/commerce/webhooks/{webhook_token}
--
-- Secret di-encrypt AES-GCM sama kayak API key.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commerce_webhook_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'lemonsqueezy',
  encrypted_secret text NOT NULL,
  secret_hint text NOT NULL,
  -- Random URL-safe token, unique. Dipake di path /api/commerce/webhooks/{token}
  webhook_token text NOT NULL UNIQUE,
  -- Optional: LS webhook ID kalau kita auto-register via API
  ls_webhook_id text,
  -- Events yang di-subscribe (informational)
  subscribed_events text[] NOT NULL DEFAULT ARRAY[
    'order_created','order_refunded',
    'subscription_created','subscription_updated','subscription_cancelled',
    'subscription_resumed','subscription_expired','subscription_paused',
    'subscription_unpaused','subscription_payment_success',
    'subscription_payment_failed','subscription_payment_recovered'
  ],
  is_active boolean NOT NULL DEFAULT true,
  last_event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_webhook_configs_token
  ON public.commerce_webhook_configs(webhook_token);

CREATE TRIGGER touch_webhook_configs_updated
  BEFORE UPDATE ON public.commerce_webhook_configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 2. commerce_webhook_events
-- ---------------------------------------------------------------------
-- Append-only log semua webhook yang diterima.
-- Dual-purpose:
--   a) Idempotency: UNIQUE(provider, event_id) cegah duplicate processing
--   b) Audit trail + debugging (payload disimpan utuh di payload jsonb)
--
-- Processing state:
--   - received_at : selalu di-set saat insert
--   - verified    : signature HMAC valid
--   - processed_at: udah di-route ke handler & sukses apply ke tabel
--   - error       : error message kalau processing gagal
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commerce_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'lemonsqueezy',
  -- LS pake X-Event-Id header — unique per event
  event_id text NOT NULL,
  -- e.g. "order_created", "subscription_payment_success"
  event_name text NOT NULL,
  -- Full JSON body dari LS
  payload jsonb NOT NULL,
  signature text,
  verified boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_owner_received
  ON public.commerce_webhook_events(owner_user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed
  ON public.commerce_webhook_events(received_at)
  WHERE processed_at IS NULL;

-- ---------------------------------------------------------------------
-- 3. commerce_orders
-- ---------------------------------------------------------------------
-- Snapshot order yang di-sync dari LS (via webhook atau manual refresh).
-- Semua monetary value di-store sebagai integer cents (konvensi LS API).
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commerce_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'lemonsqueezy',
  provider_order_id text NOT NULL,
  order_number integer,
  -- LS "identifier" field — UUID-like external ref
  identifier text,

  -- Customer info (denormalized snapshot saat order dibuat)
  customer_email text,
  customer_name text,
  customer_id text,
  store_id text,

  -- Status: pending | paid | void | refunded | partial_refund
  status text NOT NULL,
  status_formatted text,

  currency text NOT NULL,
  -- All amounts in cents
  subtotal integer NOT NULL DEFAULT 0,
  tax integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  refunded_amount integer NOT NULL DEFAULT 0,
  -- Human-readable (LS pre-formats these)
  subtotal_formatted text,
  total_formatted text,
  tax_formatted text,

  refunded_at timestamptz,
  -- LS created_at (bukan row created_at di DB kita)
  order_created_at timestamptz,

  metadata jsonb NOT NULL DEFAULT '{}',
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_owner_created
  ON public.commerce_orders(owner_user_id, order_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.commerce_orders(owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer
  ON public.commerce_orders(owner_user_id, customer_id);

CREATE TRIGGER touch_orders_updated
  BEFORE UPDATE ON public.commerce_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4. commerce_subscriptions
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commerce_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'lemonsqueezy',
  provider_subscription_id text NOT NULL,

  order_id text,
  order_item_id text,
  product_id text,
  variant_id text,
  product_name text,
  variant_name text,

  customer_email text,
  customer_name text,
  customer_id text,
  store_id text,

  -- Status: on_trial | active | paused | past_due | unpaid | cancelled | expired
  status text NOT NULL,
  status_formatted text,

  -- Pause info
  pause_mode text, -- void | free
  pause_resumes_at timestamptz,

  -- Payment method snapshot
  card_brand text,
  card_last_four text,

  -- Billing cycle
  trial_ends_at timestamptz,
  billing_anchor smallint,
  renews_at timestamptz,
  ends_at timestamptz,

  subscription_created_at timestamptz,

  metadata jsonb NOT NULL DEFAULT '{}',
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_subs_owner_created
  ON public.commerce_subscriptions(owner_user_id, subscription_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subs_status
  ON public.commerce_subscriptions(owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_customer
  ON public.commerce_subscriptions(owner_user_id, customer_id);

CREATE TRIGGER touch_subs_updated
  BEFORE UPDATE ON public.commerce_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 5. commerce_customers
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commerce_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'lemonsqueezy',
  provider_customer_id text NOT NULL,

  email text,
  name text,
  city text,
  region text,
  country text,

  -- Aggregate financials (snapshot dari LS)
  total_revenue_currency integer DEFAULT 0,
  mrr integer DEFAULT 0,
  -- subscribed | unsubscribed | archived | requires_verification | invalid_email | bounced
  status text,

  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customers_owner
  ON public.commerce_customers(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email
  ON public.commerce_customers(owner_user_id, email);

CREATE TRIGGER touch_customers_updated
  BEFORE UPDATE ON public.commerce_customers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================

ALTER TABLE public.commerce_webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_customers ENABLE ROW LEVEL SECURITY;

-- Webhook configs: owner bisa CRUD sendiri
DROP POLICY IF EXISTS "wc_owner_select" ON public.commerce_webhook_configs;
DROP POLICY IF EXISTS "wc_owner_all" ON public.commerce_webhook_configs;
CREATE POLICY "wc_owner_all" ON public.commerce_webhook_configs
  FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

-- Webhook events: owner bisa SELECT doang.
-- INSERT di-handle service role dari route handler (request dari LS,
-- bukan dari session user). Gak ada INSERT policy untuk authenticated.
DROP POLICY IF EXISTS "we_owner_select" ON public.commerce_webhook_events;
CREATE POLICY "we_owner_select" ON public.commerce_webhook_events
  FOR SELECT USING (auth.uid() = owner_user_id);

-- Orders / Subscriptions / Customers: owner read-only via session.
-- Write path sama — dari service role (webhook/backfill).
DROP POLICY IF EXISTS "orders_owner_select" ON public.commerce_orders;
CREATE POLICY "orders_owner_select" ON public.commerce_orders
  FOR SELECT USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "subs_owner_select" ON public.commerce_subscriptions;
CREATE POLICY "subs_owner_select" ON public.commerce_subscriptions
  FOR SELECT USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "cust_owner_select" ON public.commerce_customers;
CREATE POLICY "cust_owner_select" ON public.commerce_customers
  FOR SELECT USING (auth.uid() = owner_user_id);

-- =====================================================================
-- Grants (standard Supabase pattern)
-- =====================================================================
GRANT SELECT ON public.commerce_webhook_configs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.commerce_webhook_configs TO authenticated;
GRANT SELECT ON public.commerce_webhook_events TO authenticated;
GRANT SELECT ON public.commerce_orders TO authenticated;
GRANT SELECT ON public.commerce_subscriptions TO authenticated;
GRANT SELECT ON public.commerce_customers TO authenticated;
