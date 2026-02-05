-- Fix chk_on_road_calc_v2 to support dual-format RTO JSON
-- Issue: rto.STATE changed from numeric to object (with total + breakdown)
-- Solution: Cast TEXT columns to JSONB and handle both formats

-- ============================================
-- 1. DROP OLD CONSTRAINT
-- ============================================
ALTER TABLE cat_price_state
  DROP CONSTRAINT IF EXISTS chk_on_road_calc_v2;

-- ============================================
-- 2. RECREATE WITH DUAL-FORMAT SUPPORT
-- ============================================
-- Handles:
--   - rto.STATE as number (legacy): rto = '{"STATE": 10968, ...}'
--   - rto.STATE as object (new):    rto = '{"STATE": {"total": 10968, "roadTax": ...}, ...}'
--
-- Falls back to rto_total/insurance_total if JSON is NULL or malformed.
-- NOT VALID: Skip full table scan, validate after successful publish.
-- ============================================

ALTER TABLE cat_price_state
  ADD CONSTRAINT chk_on_road_calc_v2
  CHECK (
    on_road_price IS NULL
    OR rto IS NULL
    OR insurance IS NULL
    OR on_road_price =
      ex_showroom_price
      + COALESCE(
          CASE
            -- Cast TEXT to JSONB, then check if STATE is number or object
            WHEN jsonb_typeof((rto::jsonb)->'STATE') = 'number' 
              THEN ((rto::jsonb)->>'STATE')::numeric
            WHEN jsonb_typeof((rto::jsonb)->'STATE') = 'object' 
              THEN ((rto::jsonb)->'STATE'->>'total')::numeric
            ELSE NULL
          END,
          rto_total,
          0
        )
      + COALESCE(
          ((insurance::jsonb)->>'base_total')::numeric,
          insurance_total,
          0
        )
  ) NOT VALID;

-- ============================================
-- 3. VALIDATE CONSTRAINT (Run manually after successful publish)
-- ============================================
-- After confirming publish works:
-- ALTER TABLE cat_price_state VALIDATE CONSTRAINT chk_on_road_calc_v2;
