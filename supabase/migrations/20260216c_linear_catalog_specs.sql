-- Add specs column and simple CHECKs (no subqueries) to avoid drift

ALTER TABLE cat_skus_linear
ADD COLUMN IF NOT EXISTS specs jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Drop old constraint if re-running
ALTER TABLE cat_skus_linear DROP CONSTRAINT IF EXISTS cat_skus_linear_specs_shape;

-- Only allow known keys via jsonb_path_exists on disallowed keys
ALTER TABLE cat_skus_linear
ADD CONSTRAINT cat_skus_linear_specs_shape
CHECK (
  NOT jsonb_path_exists(specs, '$.* ? (@.key !="cc" && @.key !="power_bhp" && @.key !="torque_nm" && @.key !="range_km" && @.key !="battery_kwh" && @.key !="transmission" && @.key !="kerb_weight_kg")')
  AND (NOT specs ? 'cc' OR specs @> '{"cc": {"unit": "cc"}}')
  AND (NOT specs ? 'power_bhp' OR specs @> '{"power_bhp": {"unit": "bhp"}}')
  AND (NOT specs ? 'torque_nm' OR specs @> '{"torque_nm": {"unit": "nm"}}')
  AND (NOT specs ? 'range_km' OR specs @> '{"range_km": {"unit": "km"}}')
  AND (NOT specs ? 'battery_kwh' OR specs @> '{"battery_kwh": {"unit": "kWh"}}')
  AND (NOT specs ? 'kerb_weight_kg' OR specs @> '{"kerb_weight_kg": {"unit": "kg"}}')
) NOT VALID;

ALTER TABLE cat_skus_linear VALIDATE CONSTRAINT cat_skus_linear_specs_shape;

