-- ============================================================
-- PERF: Consolidate multiple_permissive_policies (lint 0017)
-- Applied: 2026-03-19
-- Tables: cat_assets, cat_brands, cat_hsn_codes, loc_pincodes,
--   cat_price_dealer, crm_leads (SELECT+UPDATE), crm_dealer_shares,
--   crm_lead_events (N/A—kept), id_team, oclub_wallets, oclub_coin_ledger
-- Strategy: merge overlapping same-command policies with OR logic;
--   drop service_role explicit policies (service_role bypasses RLS).
-- Result: Performance WARN count 92→40
-- ============================================================

-- 1. cat_assets: split ALL into write-only, keep SELECT public
DROP POLICY IF EXISTS "Admin Full Access" ON public.cat_assets;
DROP POLICY IF EXISTS "Public Read Access" ON public.cat_assets;
CREATE POLICY "Public read cat assets"
  ON public.cat_assets FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Authenticated write cat assets"
  ON public.cat_assets FOR ALL TO authenticated
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 2. cat_brands: replace ALL with write-only (SELECT public retained)
DROP POLICY IF EXISTS "Admin Manage Brands" ON public.cat_brands;
CREATE POLICY "Admin write cat brands"
  ON public.cat_brands FOR ALL TO PUBLIC
  USING (EXISTS (
    SELECT 1 FROM id_team
    WHERE id_team.user_id = (SELECT auth.uid())
      AND id_team.role IN ('OWNER','SUPER_ADMIN','MARKETPLACE_ADMIN')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM id_team
    WHERE id_team.user_id = (SELECT auth.uid())
      AND id_team.role IN ('OWNER','SUPER_ADMIN','MARKETPLACE_ADMIN')
  ));

-- 3. cat_hsn_codes: replace ALL with write-only (SELECT public retained)
DROP POLICY IF EXISTS "Allow admin write access" ON public.cat_hsn_codes;
CREATE POLICY "Admin write cat hsn codes"
  ON public.cat_hsn_codes FOR ALL TO PUBLIC
  USING ((SELECT auth.uid()) IN (
    SELECT id_team.user_id FROM id_team
    WHERE id_team.role IN ('SUPER_ADMIN','ADMIN','OWNER')
      AND id_team.status = 'ACTIVE'
  ))
  WITH CHECK ((SELECT auth.uid()) IN (
    SELECT id_team.user_id FROM id_team
    WHERE id_team.role IN ('SUPER_ADMIN','ADMIN','OWNER')
      AND id_team.status = 'ACTIVE'
  ));

-- 4. loc_pincodes: replace ALL with write-only (SELECT public retained)
DROP POLICY IF EXISTS "Marketplace admin manage pincodes" ON public.loc_pincodes;
CREATE POLICY "Marketplace admin write pincodes"
  ON public.loc_pincodes FOR ALL TO PUBLIC
  USING ((SELECT is_marketplace_admin()))
  WITH CHECK ((SELECT is_marketplace_admin()));

-- 5. cat_price_dealer: 4 policies → 1 SELECT + 1 write
DROP POLICY IF EXISTS "Allow tenant access" ON public.cat_price_dealer;
DROP POLICY IF EXISTS "Owners can manage their tenant pricing rules" ON public.cat_price_dealer;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.cat_price_dealer;
DROP POLICY IF EXISTS "Everyone can read active pricing rules" ON public.cat_price_dealer;
CREATE POLICY "Authenticated read cat price dealer"
  ON public.cat_price_dealer FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tenant owner write cat price dealer"
  ON public.cat_price_dealer FOR ALL TO PUBLIC
  USING (check_is_tenant_owner((SELECT auth.uid()), tenant_id))
  WITH CHECK (check_is_tenant_owner((SELECT auth.uid()), tenant_id));

-- 6. crm_leads SELECT: 5 policies → 1 unified OR
DROP POLICY IF EXISTS "Allow users to view their tenant's leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Dealers see own leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Dealers see shared leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Marketplace sees all leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Tenants see own leads" ON public.crm_leads;
CREATE POLICY "Unified crm leads read"
  ON public.crm_leads FOR SELECT TO PUBLIC
  USING (
    (SELECT is_marketplace_admin())
    OR (owner_tenant_id = (SELECT get_my_tenant_id()))
    OR (owner_tenant_id IN (
      SELECT id_team.tenant_id FROM id_team
      WHERE id_team.user_id = (SELECT auth.uid())
    ))
    OR (EXISTS (
      SELECT 1 FROM crm_dealer_shares
      WHERE crm_dealer_shares.lead_id = crm_leads.id
        AND crm_dealer_shares.dealer_tenant_id = (SELECT get_my_tenant_id())
    ))
  );

-- 7. crm_leads UPDATE: 2 → 1 OR
DROP POLICY IF EXISTS "Allow users to update their tenant's leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Marketplace can update leads" ON public.crm_leads;
CREATE POLICY "Unified crm leads update"
  ON public.crm_leads FOR UPDATE TO PUBLIC
  USING (
    (SELECT is_marketplace_admin())
    OR (owner_tenant_id IN (
      SELECT id_team.tenant_id FROM id_team
      WHERE id_team.user_id = (SELECT auth.uid())
    ))
  )
  WITH CHECK (
    (SELECT is_marketplace_admin())
    OR (owner_tenant_id IN (
      SELECT id_team.tenant_id FROM id_team
      WHERE id_team.user_id = (SELECT auth.uid())
    ))
  );

-- 8. crm_dealer_shares SELECT: 2 → 1 OR
DROP POLICY IF EXISTS "Dealers see their shares" ON public.crm_dealer_shares;
DROP POLICY IF EXISTS "Marketplace sees all shares" ON public.crm_dealer_shares;
CREATE POLICY "Unified crm dealer shares read"
  ON public.crm_dealer_shares FOR SELECT TO PUBLIC
  USING (
    (SELECT is_marketplace_admin())
    OR (dealer_tenant_id = (SELECT get_my_tenant_id()))
  );

-- 9. id_team SELECT: drop subset policy ("Users can view own memberships")
-- "Owners can view all memberships" already contains: user_id = auth.uid() OR role check
DROP POLICY IF EXISTS "Users can view own memberships" ON public.id_team;

-- 10. oclub_wallets: remove redundant service_role explicit policy
-- service_role bypasses RLS by default; policy is no-op and causes overlap.
DROP POLICY IF EXISTS "Service role full access oclub_wallets" ON public.oclub_wallets;

-- 11. oclub_coin_ledger: same reason as above
DROP POLICY IF EXISTS "Service role full access oclub_ledger" ON public.oclub_coin_ledger;
