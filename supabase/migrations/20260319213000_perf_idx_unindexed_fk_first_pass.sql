-- ============================================================
-- PERF: Add missing FK indexes — first pass, high-traffic tables
-- Advisor: unindexed_foreign_keys
-- Applied via Supabase MCP: perf_idx_unindexed_fk_first_pass_20260319
-- Date: 2026-03-19
--
-- Columns verified MISSING via pg_index audit before applying.
-- Already-indexed FKs (e.g. crm_leads.tenant_id, crm_leads.customer_id)
-- were skipped — no duplicates created.
-- ============================================================

-- crm_leads (2)
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_by
  ON public.crm_leads (created_by);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_by_tenant_id
  ON public.crm_leads (created_by_tenant_id);

-- crm_dealer_shares (4)
CREATE INDEX IF NOT EXISTS idx_crm_dealer_shares_approved_by
  ON public.crm_dealer_shares (approved_by);
CREATE INDEX IF NOT EXISTS idx_crm_dealer_shares_rejected_by
  ON public.crm_dealer_shares (rejected_by);
CREATE INDEX IF NOT EXISTS idx_crm_dealer_shares_requested_by
  ON public.crm_dealer_shares (requested_by);
CREATE INDEX IF NOT EXISTS idx_crm_dealer_shares_revoked_by
  ON public.crm_dealer_shares (revoked_by);

-- crm_share_audit_log (2)
CREATE INDEX IF NOT EXISTS idx_crm_share_audit_log_share_id
  ON public.crm_share_audit_log (share_id);
CREATE INDEX IF NOT EXISTS idx_crm_share_audit_log_changed_by
  ON public.crm_share_audit_log (changed_by);

-- inv_purchase_orders (3)
CREATE INDEX IF NOT EXISTS idx_inv_purchase_orders_receiving_branch_id
  ON public.inv_purchase_orders (receiving_branch_id);
CREATE INDEX IF NOT EXISTS idx_inv_purchase_orders_supplier_tenant_id
  ON public.inv_purchase_orders (supplier_tenant_id);
CREATE INDEX IF NOT EXISTS idx_inv_purchase_orders_supplier_warehouse_id
  ON public.inv_purchase_orders (supplier_warehouse_id);
