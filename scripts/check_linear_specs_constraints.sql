-- Quick validation script for cat_skus_linear specs/galleries

\pset tuples_only on
\pset format aligned

SELECT 'gallery_over_20' AS check, count(*) AS rows
FROM cat_skus_linear
WHERE array_length(gallery_urls, 1) > 20;

SELECT 'disallowed_keys' AS check, count(*) AS rows
FROM cat_skus_linear
WHERE jsonb_path_exists(specs, '$.* ? (@.key !="cc" && @.key !="power_bhp" && @.key !="torque_nm" && @.key !="range_km" && @.key !="battery_kwh" && @.key !="transmission" && @.key !="kerb_weight_kg")');

SELECT 'bad_units' AS check, count(*) AS rows
FROM cat_skus_linear
WHERE (specs ? 'cc' AND specs->'cc'->>'unit' <> 'cc')
   OR (specs ? 'power_bhp' AND specs->'power_bhp'->>'unit' <> 'bhp')
   OR (specs ? 'torque_nm' AND specs->'torque_nm'->>'unit' <> 'nm')
   OR (specs ? 'range_km' AND specs->'range_km'->>'unit' <> 'km')
   OR (specs ? 'battery_kwh' AND specs->'battery_kwh'->>'unit' <> 'kWh')
   OR (specs ? 'kerb_weight_kg' AND specs->'kerb_weight_kg'->>'unit' <> 'kg');

