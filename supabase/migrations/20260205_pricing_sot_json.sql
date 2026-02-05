-- Pricing SOT v2: Add rto/insurance JSONB and backfill (dynamic GST)

-- 1) Add new JSONB columns + optional HSN code (keep legacy columns)
ALTER TABLE public.cat_prices
  ADD COLUMN IF NOT EXISTS rto JSONB,
  ADD COLUMN IF NOT EXISTS insurance JSONB,
  ADD COLUMN IF NOT EXISTS hsn_code TEXT;

-- 2) Backfill hsn_code and gst_rate (from cat_items) if missing
UPDATE public.cat_prices p
SET
  hsn_code = COALESCE(p.hsn_code, i.hsn_code),
  gst_rate = COALESCE(p.gst_rate, (i.item_tax_rate / 100.0))
FROM public.cat_items i
WHERE p.vehicle_color_id = i.id
  AND (p.hsn_code IS NULL OR p.gst_rate IS NULL);

-- 3) Backfill rto/insurance JSON from legacy columns (safe mapping)
WITH source AS (
  SELECT
    p.vehicle_color_id,
    p.state_code,
    p.district,
    p.rto_total,
    p.rto_breakdown,
    p.insurance_total,
    p.insurance_breakdown,
    p.gst_rate,
    i.item_tax_rate
  FROM public.cat_prices p
  LEFT JOIN public.cat_items i ON i.id = p.vehicle_color_id
  WHERE p.rto IS NULL OR p.insurance IS NULL
),
calc AS (
  SELECT
    vehicle_color_id,
    state_code,
    district,
    rto_total,
    rto_breakdown,
    insurance_total,
    insurance_breakdown,
    CASE
      WHEN jsonb_typeof(insurance_breakdown) = 'object' THEN COALESCE((insurance_breakdown->>'odPremium')::numeric, 0)
      WHEN jsonb_typeof(insurance_breakdown) = 'array' THEN COALESCE((
        SELECT (elem->>'amount')::numeric
        FROM jsonb_array_elements(insurance_breakdown) elem
        WHERE (elem->>'label') ILIKE '%OD%'
        LIMIT 1
      ), 0)
      ELSE 0
    END AS od_val,
    CASE
      WHEN jsonb_typeof(insurance_breakdown) = 'object' THEN COALESCE((insurance_breakdown->>'tpPremium')::numeric, 0)
      WHEN jsonb_typeof(insurance_breakdown) = 'array' THEN COALESCE((
        SELECT (elem->>'amount')::numeric
        FROM jsonb_array_elements(insurance_breakdown) elem
        WHERE (elem->>'label') ILIKE '%TP%'
        LIMIT 1
      ), 0)
      ELSE 0
    END AS tp_val,
    CASE
      WHEN jsonb_typeof(insurance_breakdown) = 'object' AND insurance_breakdown ? 'addons' THEN
        CASE
          WHEN jsonb_typeof(insurance_breakdown->'addons') = 'array' THEN insurance_breakdown->'addons'
          WHEN jsonb_typeof(insurance_breakdown->'addons') = 'object' THEN (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                'id', e.key,
                'label', e.key,
                'price', (e.value::text)::numeric,
                'gst', 0,
                'total', (e.value::text)::numeric,
                'default', false
              )
            ), '[]'::jsonb)
            FROM jsonb_each(insurance_breakdown->'addons') AS e(key, value)
          )
          ELSE '[]'::jsonb
        END
      ELSE '[]'::jsonb
    END AS addons_val,
    CASE
      WHEN gst_rate IS NOT NULL AND gst_rate <= 1 THEN (gst_rate * 100)
      WHEN gst_rate IS NOT NULL THEN gst_rate
      WHEN item_tax_rate IS NOT NULL THEN item_tax_rate
      ELSE 18
    END AS gst_rate_pct
  FROM source
),
jsons AS (
  SELECT
    vehicle_color_id,
    state_code,
    district,
    jsonb_build_object(
      'STATE', COALESCE(rto_total, 0),
      'BH', CASE
        WHEN jsonb_typeof(rto_breakdown) = 'object' AND rto_breakdown ? 'bh' THEN (rto_breakdown->>'bh')::numeric
        WHEN jsonb_typeof(rto_breakdown) = 'object' AND rto_breakdown ? 'BH' THEN (rto_breakdown->>'BH')::numeric
        ELSE NULL
      END,
      'COMPANY', NULL,
      'default', 'STATE'
    ) AS rto_json,
    jsonb_build_object(
      'od', COALESCE(od_val, 0),
      'tp', COALESCE(tp_val, 0),
      'gst_rate', COALESCE(gst_rate_pct, 18),
      'base_total', CASE
        WHEN (COALESCE(od_val, 0) + COALESCE(tp_val, 0)) > 0
          THEN ROUND((COALESCE(od_val, 0) + COALESCE(tp_val, 0)) * (1 + COALESCE(gst_rate_pct, 18) / 100))
        ELSE COALESCE(insurance_total, 0)
      END,
      'addons', COALESCE(addons_val, '[]'::jsonb)
    ) AS insurance_json,
    COALESCE(gst_rate_pct, 18) AS gst_rate_pct
  FROM calc
),
addons_gst AS (
  SELECT
    j.vehicle_color_id,
    j.state_code,
    j.district,
    j.rto_json,
    jsonb_build_object(
      'od', (j.insurance_json->>'od')::numeric,
      'tp', (j.insurance_json->>'tp')::numeric,
      'gst_rate', j.gst_rate_pct,
      'base_total', (j.insurance_json->>'base_total')::numeric,
      'addons', (
        SELECT COALESCE(jsonb_agg(
          jsonb_set(
            jsonb_set(
              jsonb_set(addon, '{gst}', to_jsonb(ROUND((addon->>'price')::numeric * (j.gst_rate_pct / 100)))), true
            ),
            '{total}', to_jsonb(ROUND((addon->>'price')::numeric * (1 + j.gst_rate_pct / 100))), true
          )
        ), '[]'::jsonb)
        FROM jsonb_array_elements(j.insurance_json->'addons') AS addon
      )
    ) AS insurance_json
  FROM jsons j
)
UPDATE public.cat_prices p
SET
  rto = COALESCE(p.rto, a.rto_json),
  insurance = COALESCE(p.insurance, a.insurance_json)
FROM addons_gst a
WHERE p.vehicle_color_id = a.vehicle_color_id
  AND p.state_code = a.state_code
  AND p.district = a.district
  AND (p.rto IS NULL OR p.insurance IS NULL);

-- 4) Recompute base on-road (Ex + STATE RTO + Insurance base_total)
UPDATE public.cat_prices
SET on_road_price = ex_showroom_price
  + COALESCE((rto->>'STATE')::numeric, rto_total, 0)
  + COALESCE((insurance->>'base_total')::numeric, insurance_total, 0);

-- 5) Add schema constraints (NOT VALID, validate later)
ALTER TABLE public.cat_prices
  ADD CONSTRAINT rto_schema_check
  CHECK (rto ? 'STATE' AND rto ? 'default') NOT VALID;

ALTER TABLE public.cat_prices
  ADD CONSTRAINT insurance_schema_check
  CHECK (insurance ? 'od' AND insurance ? 'tp' AND insurance ? 'base_total') NOT VALID;
