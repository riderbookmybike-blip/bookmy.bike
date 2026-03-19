-- ============================================================
-- W1: Pin search_path on all flagged functions (advisor lint 0011)
-- Prevents search_path injection / schema confusion.
-- Especially critical for SECURITY DEFINER functions (marked SD).
-- Applied via Supabase MCP: w1_pin_search_path_on_flagged_functions_20260320
-- Date: 2026-03-19
-- ============================================================

-- Trigger / utility functions (no args)
ALTER FUNCTION public.auto_generate_sku_code()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.crm_leads_set_updated_at()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_audit_immutable()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_cpd_enqueue_accessory_matrix_on_price_change()  -- SD
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_cpd_enqueue_winner_price()  -- SD
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_cpt_enqueue_price_snapshot()  -- SD
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_csk_enqueue_accessory_matrix()  -- SD
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_fms_enqueue_winner_finance()  -- SD
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_inv_enqueue_winner_price()  -- SD
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_inv_stock_tat_sync()  -- SD
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_leads_default_attribution()  -- SD
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_share_status_audit()  -- SD
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.fn_share_transition_guard()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.gen_sku_code_9()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.set_member_codes()
  SET search_path = public, pg_catalog;

-- Functions with arguments
ALTER FUNCTION public.calc_emi(
  p_principal numeric, p_roi numeric, p_tenure integer, p_type text
) SET search_path = public, pg_catalog;

ALTER FUNCTION public.enqueue_recompute(
  p_job_type text, p_payload jsonb, p_priority integer  -- SD
) SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_fin_winner(
  p_sku_id uuid, p_downpayment numeric, p_tenure integer  -- SD
) SET search_path = public, pg_catalog;

-- get_market_best_offers — overload 1 (district/state)
ALTER FUNCTION public.get_market_best_offers(
  p_district_name text, p_state_code text  -- SD
) SET search_path = public, pg_catalog;

-- get_market_best_offers — overload 2 (lat/lng)
ALTER FUNCTION public.get_market_best_offers(
  p_user_lat double precision, p_user_lng double precision,
  p_state_code text, p_radius_km integer  -- SD
) SET search_path = public, pg_catalog;

-- get_market_candidate_offers — overload 1 (district/state)
ALTER FUNCTION public.get_market_candidate_offers(
  p_district_name text, p_state_code text  -- SD
) SET search_path = public, pg_catalog;

-- get_market_candidate_offers — overload 2 (lat/lng)
ALTER FUNCTION public.get_market_candidate_offers(
  p_user_lat double precision, p_user_lng double precision,
  p_state_code text, p_radius_km integer  -- SD
) SET search_path = public, pg_catalog;
