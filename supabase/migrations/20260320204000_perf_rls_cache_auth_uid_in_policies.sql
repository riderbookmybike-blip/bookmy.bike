-- ============================================================
-- P-PERF-01: Cache auth.uid() in all W2 RLS policies
-- Replace auth.uid() → (SELECT auth.uid()) in USING/WITH CHECK.
-- Forces single evaluation per query statement, not per row.
-- Performance Advisor: Auth RLS Initialization Plan (lint 0017)
-- Applied via Supabase MCP: perf_rls_cache_auth_uid_in_policies_20260320
-- Date: 2026-03-19
-- ============================================================

-- 1. crm_finance_assignments
DROP POLICY IF EXISTS "Finance team members manage assignments" ON public.crm_finance_assignments;
CREATE POLICY "Finance team members manage assignments"
  ON public.crm_finance_assignments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = crm_finance_assignments.finance_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = crm_finance_assignments.finance_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 2. crm_finance_events
DROP POLICY IF EXISTS "Finance team members manage finance events" ON public.crm_finance_events;
CREATE POLICY "Finance team members manage finance events"
  ON public.crm_finance_events FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = crm_finance_events.actor_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = crm_finance_events.actor_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 3. crm_leads
DROP POLICY IF EXISTS "Team members insert leads" ON public.crm_leads;
CREATE POLICY "Team members insert leads"
  ON public.crm_leads FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = crm_leads.tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 4. crm_media
DROP POLICY IF EXISTS "Uploader manages crm media" ON public.crm_media;
CREATE POLICY "Uploader manages crm media"
  ON public.crm_media FOR ALL TO authenticated
  USING (uploaded_by = (SELECT auth.uid()))
  WITH CHECK (uploaded_by = (SELECT auth.uid()));

-- 5. crm_quote_events
DROP POLICY IF EXISTS "Team members manage quote events" ON public.crm_quote_events;
CREATE POLICY "Team members manage quote events"
  ON public.crm_quote_events FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = crm_quote_events.actor_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = crm_quote_events.actor_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 6. dealer_finance_access
DROP POLICY IF EXISTS "Dealer team manage finance access" ON public.dealer_finance_access;
CREATE POLICY "Dealer team manage finance access"
  ON public.dealer_finance_access FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = dealer_finance_access.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = dealer_finance_access.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 7. dealer_finance_schemes
DROP POLICY IF EXISTS "Dealer team manage finance schemes" ON public.dealer_finance_schemes;
CREATE POLICY "Dealer team manage finance schemes"
  ON public.dealer_finance_schemes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = dealer_finance_schemes.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = dealer_finance_schemes.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 8. dealer_finance_user_access
DROP POLICY IF EXISTS "Finance team manage user access" ON public.dealer_finance_user_access;
CREATE POLICY "Finance team manage user access"
  ON public.dealer_finance_user_access FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = dealer_finance_user_access.finance_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = dealer_finance_user_access.finance_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 9. inv_dealer_quotes
DROP POLICY IF EXISTS "Dealer team manage dealer quotes" ON public.inv_dealer_quotes;
CREATE POLICY "Dealer team manage dealer quotes"
  ON public.inv_dealer_quotes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = inv_dealer_quotes.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = inv_dealer_quotes.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 10. inv_po_payments
DROP POLICY IF EXISTS "Dealer team manage PO payments" ON public.inv_po_payments;
CREATE POLICY "Dealer team manage PO payments"
  ON public.inv_po_payments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
      JOIN public.inv_purchase_orders po ON po.id = inv_po_payments.po_id
    WHERE id_team.tenant_id = po.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
      JOIN public.inv_purchase_orders po ON po.id = inv_po_payments.po_id
    WHERE id_team.tenant_id = po.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 11. inv_purchase_orders
DROP POLICY IF EXISTS "Dealer team manage purchase orders" ON public.inv_purchase_orders;
CREATE POLICY "Dealer team manage purchase orders"
  ON public.inv_purchase_orders FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = inv_purchase_orders.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = inv_purchase_orders.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 12. inv_quote_line_items
DROP POLICY IF EXISTS "Dealer team manage quote line items" ON public.inv_quote_line_items;
CREATE POLICY "Dealer team manage quote line items"
  ON public.inv_quote_line_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
      JOIN public.inv_dealer_quotes q ON q.id = inv_quote_line_items.quote_id
    WHERE id_team.tenant_id = q.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
      JOIN public.inv_dealer_quotes q ON q.id = inv_quote_line_items.quote_id
    WHERE id_team.tenant_id = q.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 13. inv_quote_terms
DROP POLICY IF EXISTS "Dealer team manage quote terms" ON public.inv_quote_terms;
CREATE POLICY "Dealer team manage quote terms"
  ON public.inv_quote_terms FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
      JOIN public.inv_dealer_quotes q ON q.id = inv_quote_terms.quote_id
    WHERE id_team.tenant_id = q.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
      JOIN public.inv_dealer_quotes q ON q.id = inv_quote_terms.quote_id
    WHERE id_team.tenant_id = q.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 14. inv_request_items
DROP POLICY IF EXISTS "Dealer team manage request items" ON public.inv_request_items;
CREATE POLICY "Dealer team manage request items"
  ON public.inv_request_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
      JOIN public.inv_purchase_orders po ON po.id = inv_request_items.request_id
    WHERE id_team.tenant_id = po.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
      JOIN public.inv_purchase_orders po ON po.id = inv_request_items.request_id
    WHERE id_team.tenant_id = po.dealer_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));

-- 15. inv_stock_ledger
DROP POLICY IF EXISTS "Actor tenant manages stock ledger" ON public.inv_stock_ledger;
CREATE POLICY "Actor tenant manages stock ledger"
  ON public.inv_stock_ledger FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = inv_stock_ledger.actor_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.id_team
    WHERE id_team.tenant_id = inv_stock_ledger.actor_tenant_id
      AND id_team.user_id   = (SELECT auth.uid())
      AND id_team.status    = 'ACTIVE'
  ));
