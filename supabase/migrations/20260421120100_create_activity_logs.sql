-- =====================================================================
--  Migration: create_activity_logs
--  Append-only audit log for user actions.
-- =====================================================================

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

CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx
  ON public.activity_logs(user_id);

CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx
  ON public.activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS activity_logs_action_idx
  ON public.activity_logs(action);

CREATE INDEX IF NOT EXISTS activity_logs_resource_idx
  ON public.activity_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS activity_logs_metadata_idx
  ON public.activity_logs USING gin (metadata);

COMMENT ON TABLE public.activity_logs IS
  'Audit log. Append-only. Populated via activity.service.ts.';
COMMENT ON COLUMN public.activity_logs.action IS
  'Dot-notation action key, e.g. "user.login", "profile.update".';

-- RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_logs_self_select ON public.activity_logs;
CREATE POLICY "activity_logs_self_select"
  ON public.activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS activity_logs_admin_select_all ON public.activity_logs;
CREATE POLICY "activity_logs_admin_select_all"
  ON public.activity_logs
  FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS activity_logs_authenticated_insert ON public.activity_logs;
CREATE POLICY "activity_logs_authenticated_insert"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Intentionally no UPDATE/DELETE policies: append-only.
