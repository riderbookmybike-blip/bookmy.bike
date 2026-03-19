-- ============================================================
-- PERF Batch 1: Split FOR ALL → FOR INSERT/UPDATE/DELETE
-- on 9 catalog/public-read tables (multiple_permissive_policies lint 0017)
-- Applied via Supabase MCP: perf_batch1_split_all_into_write_commands_20260319
-- Date: 2026-03-19
-- Pattern: FOR ALL admin policy + public FOR SELECT → SELECT overlap.
--   Fix: drop ALL, recreate as explicit INSERT/UPDATE/DELETE. SELECT kept as-is.
-- ============================================================

-- 1. cat_assets (auth.role() = 'authenticated')
DROP POLICY IF EXISTS "Authenticated write cat assets" ON public.cat_assets;
CREATE POLICY "Authenticated insert cat assets"
  ON public.cat_assets FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Authenticated update cat assets"
  ON public.cat_assets FOR UPDATE TO authenticated
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Authenticated delete cat assets"
  ON public.cat_assets FOR DELETE TO authenticated
  USING ((SELECT auth.role()) = 'authenticated');

-- 2. cat_brands (admin role in id_team)
DROP POLICY IF EXISTS "Admin write cat brands" ON public.cat_brands;
CREATE POLICY "Admin insert cat brands"
  ON public.cat_brands FOR INSERT TO PUBLIC
  WITH CHECK (EXISTS (SELECT 1 FROM id_team
    WHERE id_team.user_id = (SELECT auth.uid())
      AND id_team.role IN ('OWNER','SUPER_ADMIN','MARKETPLACE_ADMIN')));
CREATE POLICY "Admin update cat brands"
  ON public.cat_brands FOR UPDATE TO PUBLIC
  USING (EXISTS (SELECT 1 FROM id_team
    WHERE id_team.user_id = (SELECT auth.uid())
      AND id_team.role IN ('OWNER','SUPER_ADMIN','MARKETPLACE_ADMIN')))
  WITH CHECK (EXISTS (SELECT 1 FROM id_team
    WHERE id_team.user_id = (SELECT auth.uid())
      AND id_team.role IN ('OWNER','SUPER_ADMIN','MARKETPLACE_ADMIN')));
CREATE POLICY "Admin delete cat brands"
  ON public.cat_brands FOR DELETE TO PUBLIC
  USING (EXISTS (SELECT 1 FROM id_team
    WHERE id_team.user_id = (SELECT auth.uid())
      AND id_team.role IN ('OWNER','SUPER_ADMIN','MARKETPLACE_ADMIN')));

-- 3. cat_hsn_codes (role in id_team)
DROP POLICY IF EXISTS "Admin write cat hsn codes" ON public.cat_hsn_codes;
CREATE POLICY "Admin insert cat hsn codes"
  ON public.cat_hsn_codes FOR INSERT TO PUBLIC
  WITH CHECK ((SELECT auth.uid()) IN (
    SELECT id_team.user_id FROM id_team
    WHERE id_team.role IN ('SUPER_ADMIN','ADMIN','OWNER') AND id_team.status = 'ACTIVE'));
CREATE POLICY "Admin update cat hsn codes"
  ON public.cat_hsn_codes FOR UPDATE TO PUBLIC
  USING ((SELECT auth.uid()) IN (
    SELECT id_team.user_id FROM id_team
    WHERE id_team.role IN ('SUPER_ADMIN','ADMIN','OWNER') AND id_team.status = 'ACTIVE'))
  WITH CHECK ((SELECT auth.uid()) IN (
    SELECT id_team.user_id FROM id_team
    WHERE id_team.role IN ('SUPER_ADMIN','ADMIN','OWNER') AND id_team.status = 'ACTIVE'));
CREATE POLICY "Admin delete cat hsn codes"
  ON public.cat_hsn_codes FOR DELETE TO PUBLIC
  USING ((SELECT auth.uid()) IN (
    SELECT id_team.user_id FROM id_team
    WHERE id_team.role IN ('SUPER_ADMIN','ADMIN','OWNER') AND id_team.status = 'ACTIVE'));

-- 4. loc_pincodes (is_marketplace_admin)
DROP POLICY IF EXISTS "Marketplace admin write pincodes" ON public.loc_pincodes;
CREATE POLICY "Marketplace admin insert pincodes"
  ON public.loc_pincodes FOR INSERT TO PUBLIC
  WITH CHECK ((SELECT is_marketplace_admin()));
CREATE POLICY "Marketplace admin update pincodes"
  ON public.loc_pincodes FOR UPDATE TO PUBLIC
  USING ((SELECT is_marketplace_admin()))
  WITH CHECK ((SELECT is_marketplace_admin()));
CREATE POLICY "Marketplace admin delete pincodes"
  ON public.loc_pincodes FOR DELETE TO PUBLIC
  USING ((SELECT is_marketplace_admin()));

-- 5. cat_price_dealer (check_is_tenant_owner)
DROP POLICY IF EXISTS "Tenant owner write cat price dealer" ON public.cat_price_dealer;
CREATE POLICY "Tenant owner insert cat price dealer"
  ON public.cat_price_dealer FOR INSERT TO PUBLIC
  WITH CHECK (check_is_tenant_owner((SELECT auth.uid()), tenant_id));
CREATE POLICY "Tenant owner update cat price dealer"
  ON public.cat_price_dealer FOR UPDATE TO PUBLIC
  USING (check_is_tenant_owner((SELECT auth.uid()), tenant_id))
  WITH CHECK (check_is_tenant_owner((SELECT auth.uid()), tenant_id));
CREATE POLICY "Tenant owner delete cat price dealer"
  ON public.cat_price_dealer FOR DELETE TO PUBLIC
  USING (check_is_tenant_owner((SELECT auth.uid()), tenant_id));

-- 6. cat_raw_items (id_members.role SUPER_ADMIN/MARKETPLACE_ADMIN)
DROP POLICY IF EXISTS "Manage items" ON public.cat_raw_items;
CREATE POLICY "Admin insert cat raw items"
  ON public.cat_raw_items FOR INSERT TO PUBLIC
  WITH CHECK (EXISTS (SELECT 1 FROM id_members
    WHERE id_members.id = (SELECT auth.uid())
      AND id_members.role = ANY(ARRAY['SUPER_ADMIN','MARKETPLACE_ADMIN'])));
CREATE POLICY "Admin update cat raw items"
  ON public.cat_raw_items FOR UPDATE TO PUBLIC
  USING (EXISTS (SELECT 1 FROM id_members
    WHERE id_members.id = (SELECT auth.uid())
      AND id_members.role = ANY(ARRAY['SUPER_ADMIN','MARKETPLACE_ADMIN'])))
  WITH CHECK (EXISTS (SELECT 1 FROM id_members
    WHERE id_members.id = (SELECT auth.uid())
      AND id_members.role = ANY(ARRAY['SUPER_ADMIN','MARKETPLACE_ADMIN'])));
CREATE POLICY "Admin delete cat raw items"
  ON public.cat_raw_items FOR DELETE TO PUBLIC
  USING (EXISTS (SELECT 1 FROM id_members
    WHERE id_members.id = (SELECT auth.uid())
      AND id_members.role = ANY(ARRAY['SUPER_ADMIN','MARKETPLACE_ADMIN'])));

-- 7. id_primary_dealer_districts (super_admin OR tenant_owner)
DROP POLICY IF EXISTS "Primary dealer mapping write by owner or super admin"
  ON public.id_primary_dealer_districts;
CREATE POLICY "Owner admin insert primary dealer districts"
  ON public.id_primary_dealer_districts FOR INSERT TO PUBLIC
  WITH CHECK (
    check_is_super_admin((SELECT auth.uid()))
    OR check_is_tenant_owner((SELECT auth.uid()), tenant_id));
CREATE POLICY "Owner admin update primary dealer districts"
  ON public.id_primary_dealer_districts FOR UPDATE TO PUBLIC
  USING (
    check_is_super_admin((SELECT auth.uid()))
    OR check_is_tenant_owner((SELECT auth.uid()), tenant_id))
  WITH CHECK (
    check_is_super_admin((SELECT auth.uid()))
    OR check_is_tenant_owner((SELECT auth.uid()), tenant_id));
CREATE POLICY "Owner admin delete primary dealer districts"
  ON public.id_primary_dealer_districts FOR DELETE TO PUBLIC
  USING (
    check_is_super_admin((SELECT auth.uid()))
    OR check_is_tenant_owner((SELECT auth.uid()), tenant_id));

-- 8. sys_dashboard_templates (id_members.role = 'OWNER')
DROP POLICY IF EXISTS "Superadmin full access templates" ON public.sys_dashboard_templates;
CREATE POLICY "Owner insert sys dashboard templates"
  ON public.sys_dashboard_templates FOR INSERT TO PUBLIC
  WITH CHECK (EXISTS (SELECT 1 FROM id_members
    WHERE id_members.id = (SELECT auth.uid()) AND id_members.role = 'OWNER'));
CREATE POLICY "Owner update sys dashboard templates"
  ON public.sys_dashboard_templates FOR UPDATE TO PUBLIC
  USING (EXISTS (SELECT 1 FROM id_members
    WHERE id_members.id = (SELECT auth.uid()) AND id_members.role = 'OWNER'))
  WITH CHECK (EXISTS (SELECT 1 FROM id_members
    WHERE id_members.id = (SELECT auth.uid()) AND id_members.role = 'OWNER'));
CREATE POLICY "Owner delete sys dashboard templates"
  ON public.sys_dashboard_templates FOR DELETE TO PUBLIC
  USING (EXISTS (SELECT 1 FROM id_members
    WHERE id_members.id = (SELECT auth.uid()) AND id_members.role = 'OWNER'));

-- 9. sys_role_templates (is_super_admin())
DROP POLICY IF EXISTS "Superadmins can manage role templates" ON public.sys_role_templates;
CREATE POLICY "Superadmin insert sys role templates"
  ON public.sys_role_templates FOR INSERT TO PUBLIC
  WITH CHECK ((SELECT is_super_admin()));
CREATE POLICY "Superadmin update sys role templates"
  ON public.sys_role_templates FOR UPDATE TO PUBLIC
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));
CREATE POLICY "Superadmin delete sys role templates"
  ON public.sys_role_templates FOR DELETE TO PUBLIC
  USING ((SELECT is_super_admin()));
