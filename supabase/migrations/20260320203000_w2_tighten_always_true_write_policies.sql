-- ============================================================
-- W2: Replace always-true write policies with scoped checks
-- Advisor: rls_policy_always_true (lint 0024)
-- Applied via Supabase MCP: w2_tighten_always_true_write_policies_20260320
-- Date: 2026-03-19
-- FK columns verified from information_schema.columns audit.
-- ============================================================

-- 1. crm_finance_assignments → finance_tenant_id
DROP POLICY IF EXISTS "Authenticated users can manage finance assignments"
  ON public.crm_finance_assignments;
CREATE POLICY "Finance team members manage assignments"
  ON public.crm_finance_assignments FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = crm_finance_assignments.finance_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = crm_finance_assignments.finance_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 2. crm_finance_events → actor_tenant_id
DROP POLICY IF EXISTS "Authenticated users can manage finance events"
  ON public.crm_finance_events;
CREATE POLICY "Finance team members manage finance events"
  ON public.crm_finance_events FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = crm_finance_events.actor_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = crm_finance_events.actor_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 3. crm_leads INSERT → tenant_id
DROP POLICY IF EXISTS "Allow authenticated users to insert leads"
  ON public.crm_leads;
CREATE POLICY "Team members insert leads"
  ON public.crm_leads FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = crm_leads.tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 4. crm_media → uploaded_by = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can manage media"
  ON public.crm_media;
CREATE POLICY "Uploader manages crm media"
  ON public.crm_media FOR ALL TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- 5. crm_member_documents → broad (no owner col; protected by Storage + app layer)
DROP POLICY IF EXISTS "Team members can insert member documents" ON public.crm_member_documents;
DROP POLICY IF EXISTS "Team members can delete member documents" ON public.crm_member_documents;
CREATE POLICY "Authenticated insert member documents"
  ON public.crm_member_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated delete own member documents"
  ON public.crm_member_documents FOR DELETE TO authenticated USING (true);

-- 6. crm_quote_events → actor_tenant_id
DROP POLICY IF EXISTS "Authenticated users can manage quote events"
  ON public.crm_quote_events;
CREATE POLICY "Team members manage quote events"
  ON public.crm_quote_events FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = crm_quote_events.actor_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = crm_quote_events.actor_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 7. dealer_finance_access → dealer_tenant_id
DROP POLICY IF EXISTS "Authenticated users can manage dealer finance access"
  ON public.dealer_finance_access;
CREATE POLICY "Dealer team manage finance access"
  ON public.dealer_finance_access FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = dealer_finance_access.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = dealer_finance_access.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 8. dealer_finance_schemes → dealer_tenant_id
DROP POLICY IF EXISTS "Authenticated users can manage finance schemes"
  ON public.dealer_finance_schemes;
CREATE POLICY "Dealer team manage finance schemes"
  ON public.dealer_finance_schemes FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = dealer_finance_schemes.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = dealer_finance_schemes.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 9. dealer_finance_user_access → finance_tenant_id
DROP POLICY IF EXISTS "Authenticated users can manage finance user access"
  ON public.dealer_finance_user_access;
CREATE POLICY "Finance team manage user access"
  ON public.dealer_finance_user_access FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = dealer_finance_user_access.finance_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = dealer_finance_user_access.finance_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 10. debug_logs → service_role only (drop authenticated ALL)
DROP POLICY IF EXISTS "Authenticated can manage debug logs" ON public.debug_logs;

-- 11. inv_dealer_quotes → dealer_tenant_id
DROP POLICY IF EXISTS "Authenticated can manage dealer quotes" ON public.inv_dealer_quotes;
CREATE POLICY "Dealer team manage dealer quotes"
  ON public.inv_dealer_quotes FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = inv_dealer_quotes.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = inv_dealer_quotes.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 12. inv_po_payments → po_id → inv_purchase_orders.dealer_tenant_id
DROP POLICY IF EXISTS "Authenticated can manage PO payments" ON public.inv_po_payments;
CREATE POLICY "Dealer team manage PO payments"
  ON public.inv_po_payments FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      JOIN public.inv_purchase_orders po ON po.id = inv_po_payments.po_id
      WHERE id_team.tenant_id = po.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      JOIN public.inv_purchase_orders po ON po.id = inv_po_payments.po_id
      WHERE id_team.tenant_id = po.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 13. inv_purchase_orders → dealer_tenant_id
DROP POLICY IF EXISTS "Authenticated can manage purchase orders" ON public.inv_purchase_orders;
CREATE POLICY "Dealer team manage purchase orders"
  ON public.inv_purchase_orders FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = inv_purchase_orders.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = inv_purchase_orders.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 14. inv_quote_line_items → quote_id → inv_dealer_quotes.dealer_tenant_id
DROP POLICY IF EXISTS "inv_quote_line_items_access" ON public.inv_quote_line_items;
CREATE POLICY "Dealer team manage quote line items"
  ON public.inv_quote_line_items FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      JOIN public.inv_dealer_quotes q ON q.id = inv_quote_line_items.quote_id
      WHERE id_team.tenant_id = q.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      JOIN public.inv_dealer_quotes q ON q.id = inv_quote_line_items.quote_id
      WHERE id_team.tenant_id = q.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 15. inv_quote_terms → quote_id → inv_dealer_quotes.dealer_tenant_id
DROP POLICY IF EXISTS "inv_quote_terms_access" ON public.inv_quote_terms;
CREATE POLICY "Dealer team manage quote terms"
  ON public.inv_quote_terms FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      JOIN public.inv_dealer_quotes q ON q.id = inv_quote_terms.quote_id
      WHERE id_team.tenant_id = q.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      JOIN public.inv_dealer_quotes q ON q.id = inv_quote_terms.quote_id
      WHERE id_team.tenant_id = q.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 16. inv_request_items → request_id → inv_purchase_orders.dealer_tenant_id
DROP POLICY IF EXISTS "Authenticated can manage request items" ON public.inv_request_items;
CREATE POLICY "Dealer team manage request items"
  ON public.inv_request_items FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      JOIN public.inv_purchase_orders po ON po.id = inv_request_items.request_id
      WHERE id_team.tenant_id = po.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      JOIN public.inv_purchase_orders po ON po.id = inv_request_items.request_id
      WHERE id_team.tenant_id = po.dealer_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 17. inv_stock_ledger → actor_tenant_id
DROP POLICY IF EXISTS "Authenticated can manage stock ledger" ON public.inv_stock_ledger;
CREATE POLICY "Actor tenant manages stock ledger"
  ON public.inv_stock_ledger FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = inv_stock_ledger.actor_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = inv_stock_ledger.actor_tenant_id
        AND id_team.user_id   = auth.uid() AND id_team.status = 'ACTIVE')
  );

-- 18. cat_accessory_suitable_for → drop authenticated ALL (service_role policy retained)
DROP POLICY IF EXISTS "Authenticated manage on cat_item_compatibility"
  ON public.cat_accessory_suitable_for;

-- 19–21. Catalog rules → service_role only
DROP POLICY IF EXISTS "Admin Insert Insurance Rules"          ON public.cat_ins_rules;
DROP POLICY IF EXISTS "Admin Update Insurance Rules"          ON public.cat_ins_rules;
DROP POLICY IF EXISTS "Authenticated can manage reg rules"    ON public.cat_reg_rules;
DROP POLICY IF EXISTS "Authenticated can manage regional configs" ON public.cat_regional_configs;

-- analytics_events, analytics_sessions, notifications service_role: intentional, unchanged.
