-- Published Price Architecture: Backfill Existing Data
-- Run this AFTER 20260203_published_price_schema.sql
-- This calculates and populates rto_total, insurance_total, on_road_price for all existing records

-- ============================================
-- 1. BACKFILL cat_prices WITH CALCULATED VALUES
-- ============================================

-- For now, we'll set basic values that AUMS will verify and re-publish
-- RTO/Insurance will be set to 0 initially - AUMS must calculate and publish

UPDATE public.cat_prices
SET 
  rto_total = 0,
  insurance_total = 0,
  on_road_price = ex_showroom_price, -- Initially just ex-showroom, AUMS will publish full on-road
  published_at = NOW()
WHERE rto_total IS NULL OR insurance_total IS NULL OR on_road_price IS NULL;

-- ============================================
-- 2. ADD NOT NULL CONSTRAINTS AFTER BACKFILL
-- ============================================

-- Note: on_road_price remains nullable for flexibility
-- The CHECK constraint ensures integrity when values ARE present

-- We do NOT add NOT NULL on on_road_price to allow partial publishes
-- Instead we use a CHECK for integrity when all values present

ALTER TABLE public.cat_prices 
  DROP CONSTRAINT IF EXISTS chk_on_road_calc;

ALTER TABLE public.cat_prices 
  ADD CONSTRAINT chk_on_road_calc 
  CHECK (
    on_road_price IS NULL 
    OR rto_total IS NULL 
    OR insurance_total IS NULL 
    OR on_road_price = ex_showroom_price + rto_total + insurance_total
  );

-- ============================================
-- 3. CREATE HELPER FUNCTION FOR PUBLISH
-- ============================================

CREATE OR REPLACE FUNCTION public.publish_price_with_lock(
  p_vehicle_color_id UUID,
  p_state_code TEXT,
  p_rto_total NUMERIC,
  p_insurance_total NUMERIC,
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
    on_road_price = v_new_on_road,
    published_at = NOW(),
    published_by = p_published_by
  WHERE vehicle_color_id = p_vehicle_color_id 
    AND state_code = p_state_code;
  
  -- 4. Log to history (unique on publish_job_id prevents duplicates)
  INSERT INTO public.cat_price_history (
    vehicle_color_id, state_code, old_on_road, new_on_road, 
    delta, publish_job_id, published_by
  ) VALUES (
    p_vehicle_color_id, p_state_code, v_old_on_road, v_new_on_road,
    v_delta, p_publish_job_id, p_published_by
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

-- Grant execute to service_role only (called from server action)
REVOKE ALL ON FUNCTION public.publish_price_with_lock FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_price_with_lock TO service_role;

COMMENT ON FUNCTION public.publish_price_with_lock IS 
'Atomically publishes a price update with row locking, history logging, and dealer auto-adjustment.
Only auto-adjusts dealer offers when price INCREASES (to protect dealer margins).';
