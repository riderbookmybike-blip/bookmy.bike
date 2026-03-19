-- ============================================================
-- PERF Batch 2A: Split FOR ALL → FOR INSERT/UPDATE/DELETE
-- 4 low-risk identity/dealer tables (multiple_permissive_policies lint 0017)
-- Applied via Supabase MCP: perf_batch2a_split_all_low_risk_tables_20260319
-- Date: 2026-03-19
-- ============================================================

-- 1. dealer_brands (tenant_id = get_my_tenant_id() OR super_admin)
DROP POLICY IF EXISTS "Tenant members can manage dealer brands" ON public.dealer_brands;
CREATE POLICY "Tenant members insert dealer brands"
  ON public.dealer_brands FOR INSERT TO authenticated
  WITH CHECK (
    (tenant_id = (SELECT get_my_tenant_id()))
    OR check_is_super_admin((SELECT auth.uid()))
  );
CREATE POLICY "Tenant members update dealer brands"
  ON public.dealer_brands FOR UPDATE TO authenticated
  USING (
    (tenant_id = (SELECT get_my_tenant_id()))
    OR check_is_super_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    (tenant_id = (SELECT get_my_tenant_id()))
    OR check_is_super_admin((SELECT auth.uid()))
  );
CREATE POLICY "Tenant members delete dealer brands"
  ON public.dealer_brands FOR DELETE TO authenticated
  USING (
    (tenant_id = (SELECT get_my_tenant_id()))
    OR check_is_super_admin((SELECT auth.uid()))
  );

-- 2. id_dealer_service_areas (check_is_tenant_owner_for_pricing)
DROP POLICY IF EXISTS "Allow tenant modification of service areas" ON public.id_dealer_service_areas;
CREATE POLICY "Tenant owner insert service areas"
  ON public.id_dealer_service_areas FOR INSERT TO PUBLIC
  WITH CHECK (check_is_tenant_owner_for_pricing((SELECT auth.uid()), tenant_id));
CREATE POLICY "Tenant owner update service areas"
  ON public.id_dealer_service_areas FOR UPDATE TO PUBLIC
  USING (check_is_tenant_owner_for_pricing((SELECT auth.uid()), tenant_id))
  WITH CHECK (check_is_tenant_owner_for_pricing((SELECT auth.uid()), tenant_id));
CREATE POLICY "Tenant owner delete service areas"
  ON public.id_dealer_service_areas FOR DELETE TO PUBLIC
  USING (check_is_tenant_owner_for_pricing((SELECT auth.uid()), tenant_id));

-- 3. id_locations (check_is_tenant_owner OR super_admin; original had no WITH CHECK on ALL)
DROP POLICY IF EXISTS "Tenant owner or super admin manage locations" ON public.id_locations;
CREATE POLICY "Owner admin insert locations"
  ON public.id_locations FOR INSERT TO authenticated
  WITH CHECK (
    check_is_tenant_owner((SELECT auth.uid()), tenant_id)
    OR check_is_super_admin((SELECT auth.uid()))
  );
CREATE POLICY "Owner admin update locations"
  ON public.id_locations FOR UPDATE TO authenticated
  USING (
    check_is_tenant_owner((SELECT auth.uid()), tenant_id)
    OR check_is_super_admin((SELECT auth.uid()))
  );
CREATE POLICY "Owner admin delete locations"
  ON public.id_locations FOR DELETE TO authenticated
  USING (
    check_is_tenant_owner((SELECT auth.uid()), tenant_id)
    OR check_is_super_admin((SELECT auth.uid()))
  );

-- 4. id_operating_hours (check_is_tenant_owner OR super_admin; no WITH CHECK on original)
DROP POLICY IF EXISTS "Tenant owner or super admin manage hours" ON public.id_operating_hours;
CREATE POLICY "Owner admin insert operating hours"
  ON public.id_operating_hours FOR INSERT TO authenticated
  WITH CHECK (
    check_is_tenant_owner((SELECT auth.uid()), tenant_id)
    OR check_is_super_admin((SELECT auth.uid()))
  );
CREATE POLICY "Owner admin update operating hours"
  ON public.id_operating_hours FOR UPDATE TO authenticated
  USING (
    check_is_tenant_owner((SELECT auth.uid()), tenant_id)
    OR check_is_super_admin((SELECT auth.uid()))
  );
CREATE POLICY "Owner admin delete operating hours"
  ON public.id_operating_hours FOR DELETE TO authenticated
  USING (
    check_is_tenant_owner((SELECT auth.uid()), tenant_id)
    OR check_is_super_admin((SELECT auth.uid()))
  );
