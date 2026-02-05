-- Granular Pricing Architecture: Schema Migration
-- Phase 1.1: Add breakdown columns to cat_prices and history

-- ============================================
-- 1. EXTEND cat_prices TABLE
-- ============================================

ALTER TABLE public.cat_prices 
  ADD COLUMN IF NOT EXISTS rto_breakdown JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS insurance_breakdown JSONB DEFAULT '{}'::JSONB;

COMMENT ON COLUMN public.cat_prices.rto_breakdown IS 'Detailed breakdown of RTO components (road_tax, smart_card, etc.)';
COMMENT ON COLUMN public.cat_prices.insurance_breakdown IS 'Detailed breakdown of Insurance components (od, tp, addons)';

-- ============================================
-- 2. EXTEND cat_price_history TABLE
-- ============================================

ALTER TABLE public.cat_price_history
  ADD COLUMN IF NOT EXISTS rto_breakdown JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS insurance_breakdown JSONB DEFAULT '{}'::JSONB;

-- ============================================
-- 3. UPDATE publish_price_with_lock FUNCTION
-- ============================================

-- Dropping first to ensure signature change is handled cleanly if needed (though OR REPLACE usually handles it if types match, adding args needs care)
DROP FUNCTION IF EXISTS public.publish_price_with_lock;

CREATE OR REPLACE FUNCTION public.publish_price_with_lock(
  p_vehicle_color_id UUID,
  p_state_code TEXT,
  p_rto_total NUMERIC,
  p_insurance_total NUMERIC,
  p_rto_breakdown JSONB,
  p_insurance_breakdown JSONB,
  p_published_by UUID,
  p_publish_job_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_on_road NUMERIC;
  v_new_on_road NUMERIC;
  v_delta NUMERIC;
  v_ex_showroom NUMERIC;
  v_affected_dealers INT := 0;
BEGIN
  -- 1. Lock the row to prevent concurrent updates
  SELECT ex_showroom_price, on_road_price
  INTO v_ex_showroom, v_old_on_road
  FROM public.cat_prices
  WHERE vehicle_color_id = p_vehicle_color_id
    AND state_code = p_state_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Price record not found');
  END IF;

  -- 2. Calculate new on-road
  v_new_on_road := v_ex_showroom + p_rto_total + p_insurance_total;
  v_delta := v_new_on_road - COALESCE(v_old_on_road, v_new_on_road);

  -- 3. Update cat_prices
  UPDATE public.cat_prices
  SET
    rto_total = p_rto_total,
    insurance_total = p_insurance_total,
    rto_breakdown = p_rto_breakdown,
    insurance_breakdown = p_insurance_breakdown,
    on_road_price = v_new_on_road,
    published_at = NOW(),
    published_by = p_published_by
  WHERE vehicle_color_id = p_vehicle_color_id
    AND state_code = p_state_code;

  -- 4. Log to history (unique on publish_job_id prevents duplicates)
  INSERT INTO public.cat_price_history (
    vehicle_color_id, state_code, old_on_road, new_on_road,
    delta, rto_breakdown, insurance_breakdown, publish_job_id, published_by
  ) VALUES (
    p_vehicle_color_id, p_state_code, v_old_on_road, v_new_on_road,
    v_delta, p_rto_breakdown, p_insurance_breakdown, p_publish_job_id, p_published_by
  )
  ON CONFLICT (vehicle_color_id, state_code, publish_job_id) DO NOTHING;

  -- 5. Auto-adjust dealer offers ONLY if price INCREASED
  IF v_delta > 0 THEN
    UPDATE public.id_dealer_pricing_rules
    SET
      offer_amount = offer_amount + v_delta,
      auto_adjusted_at = NOW(),
      auto_adjusted_delta = v_delta,
      last_publish_job_id = p_publish_job_id
    WHERE vehicle_color_id = p_vehicle_color_id
      AND state_code = p_state_code
      AND (last_publish_job_id IS NULL OR last_publish_job_id != p_publish_job_id);

    GET DIAGNOSTICS v_affected_dealers = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'old_on_road', v_old_on_road,
    'new_on_road', v_new_on_road,
    'delta', v_delta,
    'dealers_adjusted', v_affected_dealers
  );
END;
$$;
