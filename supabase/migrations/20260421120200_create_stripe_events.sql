-- =====================================================================
--  Migration: create_stripe_events
--  Idempotency & audit table for Stripe webhook events.
--
--  Strategy:
--    - Primary key = Stripe event.id (e.g. "evt_xxx")
--    - Webhook handler: INSERT ... ON CONFLICT (id) DO NOTHING
--      If conflict → already processed, skip.
--    - processed_at IS NULL = pending/failed (retry candidate)
-- =====================================================================

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

CREATE INDEX IF NOT EXISTS stripe_events_type_idx
  ON public.stripe_events(type);

CREATE INDEX IF NOT EXISTS stripe_events_received_at_idx
  ON public.stripe_events(received_at DESC);

CREATE INDEX IF NOT EXISTS stripe_events_unprocessed_idx
  ON public.stripe_events(received_at)
  WHERE processed_at IS NULL;

COMMENT ON TABLE public.stripe_events IS
  'Stripe webhook idempotency & audit log. Prevents double-processing.';
COMMENT ON COLUMN public.stripe_events.id IS
  'Stripe event.id — natural primary key for idempotency.';
COMMENT ON COLUMN public.stripe_events.processed_at IS
  'NULL = pending/failed. Set when handler completes successfully.';

-- RLS
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Webhook uses SERVICE_ROLE_KEY → bypasses RLS.
-- Admin UI can read via this policy.
DROP POLICY IF EXISTS stripe_events_admin_select ON public.stripe_events;
CREATE POLICY "stripe_events_admin_select"
  ON public.stripe_events
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- No INSERT/UPDATE policies: service role only.
