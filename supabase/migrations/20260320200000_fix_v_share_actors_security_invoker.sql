-- E1 Fix: Recreate v_share_actors with SECURITY INVOKER (default)
-- Removes SECURITY DEFINER property which was bypassing the querying user's RLS.
-- Supabase advisor: security_definer_view (lint 0010)
-- Date: 2026-03-19
-- Applied via Supabase MCP as migration: fix_v_share_actors_security_invoker_20260320

DROP VIEW IF EXISTS public.v_share_actors;

CREATE VIEW public.v_share_actors
WITH (security_invoker = true)
AS
SELECT
  id,
  lead_id,
  dealer_tenant_id,
  status,
  share_type,
  requested_by AS initiated_by,
  CASE status
    WHEN 'APPROVED' THEN COALESCE(approved_by, requested_by)
    WHEN 'REJECTED' THEN rejected_by
    WHEN 'REVOKED'  THEN revoked_by
    ELSE NULL::uuid
  END AS resolved_actor,
  CASE status
    WHEN 'APPROVED' THEN COALESCE(approved_at, shared_at)
    WHEN 'REJECTED' THEN rejected_at
    WHEN 'REVOKED'  THEN revoked_at
    ELSE shared_at
  END AS resolved_at,
  shared_by,
  shared_at,
  is_primary
FROM crm_dealer_shares;

GRANT SELECT ON public.v_share_actors TO authenticated;
GRANT SELECT ON public.v_share_actors TO service_role;
