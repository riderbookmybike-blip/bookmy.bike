-- ============================================================
-- PERF Batch 2B: Split FOR ALL → explicit write commands
-- CRM + identity tables (multiple_permissive_policies lint 0017)
-- Applied via Supabase MCP: perf_batch2b_split_all_crm_identity_tables_20260319
-- Date: 2026-03-19
-- ============================================================

-- 1. crm_lead_events
-- ALL "Marketplace admin full access" (no WITH CHECK) overlaps SELECT + INSERT.
-- Separate SELECT (Tenants see own events) and INSERT (Tenants can insert events) kept.
-- Split ALL → marketplace UPDATE + DELETE only.
DROP POLICY IF EXISTS "Marketplace admin full access" ON public.crm_lead_events;
CREATE POLICY "Marketplace admin update lead events"
  ON public.crm_lead_events FOR UPDATE TO PUBLIC
  USING ((SELECT is_marketplace_admin()));
CREATE POLICY "Marketplace admin delete lead events"
  ON public.crm_lead_events FOR DELETE TO PUBLIC
  USING ((SELECT is_marketplace_admin()));

-- 2. crm_member_documents
-- ALL "Admin Full Access Member Docs" (auth.role='authenticated', no WITH CHECK)
-- is fully redundant: INSERT, DELETE, SELECT already have explicit policies.
DROP POLICY IF EXISTS "Admin Full Access Member Docs" ON public.crm_member_documents;

-- 3. id_team
-- ALL "Tenant owner or super admin manage team" (no WITH CHECK) + SELECT exists.
DROP POLICY IF EXISTS "Tenant owner or super admin manage team" ON public.id_team;
CREATE POLICY "Owner admin insert id team"
  ON public.id_team FOR INSERT TO authenticated
  WITH CHECK (
    check_is_tenant_owner((SELECT auth.uid()), tenant_id)
    OR check_is_super_admin((SELECT auth.uid()))
  );
CREATE POLICY "Owner admin update id team"
  ON public.id_team FOR UPDATE TO authenticated
  USING (
    check_is_tenant_owner((SELECT auth.uid()), tenant_id)
    OR check_is_super_admin((SELECT auth.uid()))
  );
CREATE POLICY "Owner admin delete id team"
  ON public.id_team FOR DELETE TO authenticated
  USING (
    check_is_tenant_owner((SELECT auth.uid()), tenant_id)
    OR check_is_super_admin((SELECT auth.uid()))
  );

-- 4. id_tenants
-- ALL "Owner or super admin manage tenants" (no WITH CHECK) + SELECT "Allow public view tenants"
DROP POLICY IF EXISTS "Owner or super admin manage tenants" ON public.id_tenants;
CREATE POLICY "Owner admin insert id tenants"
  ON public.id_tenants FOR INSERT TO authenticated
  WITH CHECK (
    check_is_super_admin((SELECT auth.uid()))
    OR check_is_tenant_owner((SELECT auth.uid()), id)
  );
CREATE POLICY "Owner admin update id tenants"
  ON public.id_tenants FOR UPDATE TO authenticated
  USING (
    check_is_super_admin((SELECT auth.uid()))
    OR check_is_tenant_owner((SELECT auth.uid()), id)
  );
CREATE POLICY "Owner admin delete id tenants"
  ON public.id_tenants FOR DELETE TO authenticated
  USING (
    check_is_super_admin((SELECT auth.uid()))
    OR check_is_tenant_owner((SELECT auth.uid()), id)
  );
