-- ============================================================
-- E2: Enable RLS on 11 public tables (advisor lint 0013)
-- Applied via Supabase MCP: e2_rls_enable_11_public_tables_20260320
--
-- Classification:
--   GROUP A (authenticated SELECT): market_winner_price,
--     market_winner_finance, sku_accessory_matrix,
--     cat_service_packages, cat_service_scope, cat_service_entries
--   GROUP B (service_role bypass only): recompute_queue,
--     price_snapshot_sku, shadow_compare_log,
--     shadow_metrics_hourly, winner_cache_invalidation_log
--
-- Date: 2026-03-19
-- Verified: advisor ERROR count 11→0 post-apply
-- ============================================================

-- ─── GROUP A: authenticated SELECT ──────────────────────────
-- These tables back the pricing engine and catalog service
-- displays. Authenticated users need read access; no public
-- (anon) access needed; no writes from client.

ALTER TABLE public.market_winner_price ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read market winner price"
  ON public.market_winner_price FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.market_winner_finance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read market winner finance"
  ON public.market_winner_finance FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.sku_accessory_matrix ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read sku accessory matrix"
  ON public.sku_accessory_matrix FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.cat_service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cat service packages"
  ON public.cat_service_packages FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.cat_service_scope ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cat service scope"
  ON public.cat_service_scope FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.cat_service_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cat service entries"
  ON public.cat_service_entries FOR SELECT
  TO authenticated
  USING (true);

-- ─── GROUP B: service_role bypass only ──────────────────────
-- Internal queue, log, and snapshot tables. No client access
-- ever needed. Enabling RLS with no policies locks out anon
-- and authenticated roles entirely; service_role bypasses RLS
-- by default in Supabase.

ALTER TABLE public.recompute_queue               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_snapshot_sku            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_compare_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_metrics_hourly         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_cache_invalidation_log ENABLE ROW LEVEL SECURITY;
