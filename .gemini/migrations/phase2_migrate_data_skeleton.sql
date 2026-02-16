-- =============================================================================
-- 🏗️ Catalog Normalization v4.2 — Phase 2: Data Migration Skeleton
-- =============================================================================
-- Date: 16 Feb 2026
-- Prerequisites: Phase 1 tables must exist
-- Strategy: INSERT INTO new tables FROM old tables (cat_items + cat_skus_linear)
--
-- ⚠️  This is a SKELETON — actual column mappings need verification against
--     live data before execution. Run SELECT queries first to validate.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Seed cat_specifications (36+ spec definitions)
-- ─────────────────────────────────────────────────────────────────────────────
-- These define what columns exist in cat_variants_vehicle and how they validate.

INSERT INTO cat_specifications (spec_key, display_label, data_type, unit, spec_level, product_types, is_filterable, is_comparable, category, position, suffix, example_value) VALUES
  -- ENGINE
  ('engine_type',       'Engine Type',        'TEXT',    NULL,     'VARIANT', '{VEHICLE}', false, true,  'ENGINE',     1,  NULL,   'Single Cylinder, 4-Stroke'),
  ('displacement',      'Displacement',       'NUMERIC', 'cc',    'VARIANT', '{VEHICLE}', true,  true,  'ENGINE',     2,  'cc',   '113.3'),
  ('max_power',         'Max Power',          'TEXT',    NULL,     'VARIANT', '{VEHICLE}', false, true,  'ENGINE',     3,  NULL,   '5.9 KW @ 6500 RPM'),
  ('max_torque',        'Max Torque',         'TEXT',    NULL,     'VARIANT', '{VEHICLE}', false, true,  'ENGINE',     4,  NULL,   '9.8 Nm @ 4500 RPM'),
  ('num_valves',        'No. of Valves',      'INTEGER', NULL,    'VARIANT', '{VEHICLE}', false, true,  'ENGINE',     5,  NULL,   '2'),
  ('transmission',      'Transmission',       'ENUM',    NULL,    'VARIANT', '{VEHICLE}', true,  true,  'ENGINE',     6,  NULL,   'CVT_AUTOMATIC'),
  ('air_filter',        'Air Filter',         'TEXT',    NULL,    'VARIANT', '{VEHICLE}', false, false, 'ENGINE',     7,  NULL,   'Viscous Paper Type'),
  ('mileage',           'Mileage',            'NUMERIC', 'kmpl',  'VARIANT', '{VEHICLE}', true,  true,  'ENGINE',     8,  'kmpl', '57.0'),
  ('start_type',        'Start Type',         'ENUM',    NULL,    'VARIANT', '{VEHICLE}', true,  true,  'ENGINE',     9,  NULL,   'ELECTRIC'),
  -- BRAKES
  ('front_brake',       'Front Brake',        'TEXT',    NULL,    'VARIANT', '{VEHICLE}', false, true,  'BRAKES',     10, NULL,   'Disc, 220mm'),
  ('rear_brake',        'Rear Brake',         'TEXT',    NULL,    'VARIANT', '{VEHICLE}', false, true,  'BRAKES',     11, NULL,   'Drum, 130mm'),
  ('braking_system',    'Braking System',     'ENUM',    NULL,    'VARIANT', '{VEHICLE}', true,  true,  'BRAKES',     12, NULL,   'CBS'),
  ('front_suspension',  'Front Suspension',   'TEXT',    NULL,    'VARIANT', '{VEHICLE}', false, true,  'BRAKES',     13, NULL,   'Telescopic'),
  ('rear_suspension',   'Rear Suspension',    'TEXT',    NULL,    'VARIANT', '{VEHICLE}', false, true,  'BRAKES',     14, NULL,   'SBT Unit Swing'),
  -- DIMENSIONS
  ('kerb_weight',       'Kerb Weight',        'INTEGER', 'kg',   'VARIANT', '{VEHICLE}', false, true,  'DIMENSIONS', 15, 'kg',   '106'),
  ('seat_height',       'Seat Height',        'INTEGER', 'mm',   'VARIANT', '{VEHICLE}', false, true,  'DIMENSIONS', 16, 'mm',   '770'),
  ('ground_clearance',  'Ground Clearance',   'INTEGER', 'mm',   'VARIANT', '{VEHICLE}', false, true,  'DIMENSIONS', 17, 'mm',   '163'),
  ('wheelbase',         'Wheelbase',          'INTEGER', 'mm',   'VARIANT', '{VEHICLE}', false, true,  'DIMENSIONS', 18, 'mm',   '1275'),
  ('fuel_capacity',     'Fuel Capacity',      'NUMERIC', 'L',    'VARIANT', '{VEHICLE}', false, true,  'DIMENSIONS', 19, 'L',    '5.3'),
  -- FEATURES
  ('console_type',      'Console Type',       'ENUM',    NULL,   'VARIANT', '{VEHICLE}', true,  true,  'FEATURES',   20, NULL,   'DIGITAL'),
  ('led_headlamp',      'LED Headlamp',       'BOOLEAN', NULL,   'VARIANT', '{VEHICLE}', true,  true,  'FEATURES',   21, NULL,   'true'),
  ('led_tail_lamp',     'LED Tail Lamp',      'BOOLEAN', NULL,   'VARIANT', '{VEHICLE}', false, true,  'FEATURES',   22, NULL,   'true'),
  ('usb_charging',      'USB Charging',       'BOOLEAN', NULL,   'VARIANT', '{VEHICLE}', true,  true,  'FEATURES',   23, NULL,   'true'),
  ('bluetooth',         'Bluetooth',          'BOOLEAN', NULL,   'VARIANT', '{VEHICLE}', true,  true,  'FEATURES',   24, NULL,   'false'),
  ('navigation',        'Navigation',         'BOOLEAN', NULL,   'VARIANT', '{VEHICLE}', true,  true,  'FEATURES',   25, NULL,   'false'),
  ('ride_modes',        'Ride Modes',         'TEXT',    NULL,   'VARIANT', '{VEHICLE}', false, false, 'FEATURES',   26, NULL,   'Eco, Sport'),
  -- ELECTRICAL (EVs)
  ('battery_type',      'Battery Type',       'TEXT',    NULL,   'VARIANT', '{VEHICLE}', false, true,  'ELECTRICAL', 27, NULL,   'Lithium-Ion'),
  ('battery_capacity',  'Battery Capacity',   'TEXT',    NULL,   'VARIANT', '{VEHICLE}', false, true,  'ELECTRICAL', 28, NULL,   '3.0 kWh'),
  ('range_km',          'Range',              'INTEGER', 'km',   'VARIANT', '{VEHICLE}', true,  true,  'ELECTRICAL', 29, 'km',   '100'),
  ('charging_time',     'Charging Time',      'TEXT',    NULL,   'VARIANT', '{VEHICLE}', false, true,  'ELECTRICAL', 30, NULL,   '5 hours 0-100%'),
  ('motor_power',       'Motor Power',        'TEXT',    NULL,   'VARIANT', '{VEHICLE}', false, true,  'ELECTRICAL', 31, NULL,   '4.4 kW'),
  -- CHASSIS
  ('front_tyre',        'Front Tyre',         'TEXT',    NULL,   'VARIANT', '{VEHICLE}', false, true,  'CHASSIS',    32, NULL,   '90/90-12'),
  ('rear_tyre',         'Rear Tyre',          'TEXT',    NULL,   'VARIANT', '{VEHICLE}', false, true,  'CHASSIS',    33, NULL,   '90/100-10'),
  ('tyre_type',         'Tyre Type',          'ENUM',    NULL,   'VARIANT', '{VEHICLE}', true,  true,  'CHASSIS',    34, NULL,   'TUBELESS'),
  -- MODEL-LEVEL (for reference)
  ('engine_cc',         'Engine CC',          'NUMERIC', 'cc',   'MODEL',   '{VEHICLE}', true,  true,  'ENGINE',     35, 'cc',   '125.0'),
  ('body_type',         'Body Type',          'ENUM',    NULL,   'MODEL',   '{VEHICLE}', true,  false, 'GENERAL',    36, NULL,   'SCOOTER')
ON CONFLICT (spec_key) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Migrate cat_items (FAMILY) → cat_models
-- ─────────────────────────────────────────────────────────────────────────────
-- Source: cat_items WHERE type = 'PRODUCT' (these are the family-level items)
--
-- TODO: Verify mapping — cat_items.type hierarchy is:
--   BRAND → TYPE → PRODUCT → VARIANT → UNIT → SKU
--   We want PRODUCT-level items → cat_models

-- SKELETON (to be refined with actual data inspection):
/*
INSERT INTO cat_models (id, brand_id, name, slug, product_type, body_type, engine_cc, hsn_code, item_tax_rate, position, status, created_at, updated_at)
SELECT
  ci.id,
  ci.brand_id,
  ci.name,
  ci.slug,
  'VEHICLE',                                      -- TODO: determine from cat_items.category or parent
  (ci.specs->>'bodyType')::TEXT,                   -- map to MOTORCYCLE/SCOOTER/MOPED/ELECTRIC
  (ci.specs->>'engine_cc')::NUMERIC(6,1),
  ci.hsn_code,
  ci.item_tax_rate,
  ci.position,
  ci.status,
  ci.created_at,
  ci.updated_at
FROM cat_items ci
WHERE ci.type = 'PRODUCT'
  AND ci.status != 'INACTIVE';                     -- TODO: confirm filter
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Migrate cat_items (VARIANT) → cat_variants_vehicle
-- ─────────────────────────────────────────────────────────────────────────────
-- Source: cat_items WHERE type = 'VARIANT'
-- Specs come from cat_items.specs JSONB → flat columns

-- SKELETON:
/*
INSERT INTO cat_variants_vehicle (id, model_id, name, slug, position, status,
  engine_type, displacement, max_power, max_torque, num_valves, transmission,
  mileage, front_brake, rear_brake, braking_system, kerb_weight, seat_height,
  ground_clearance, wheelbase, fuel_capacity, console_type, led_headlamp,
  usb_charging, front_tyre, rear_tyre, tyre_type,
  created_at, updated_at)
SELECT
  ci.id,
  ci.parent_id,                                    -- parent = PRODUCT → model_id
  ci.name,
  ci.slug,
  ci.position,
  ci.status,
  -- Specs from JSONB
  ci.specs->>'engine_type',
  (ci.specs->>'displacement')::NUMERIC(6,1),
  ci.specs->>'max_power',
  ci.specs->>'max_torque',
  (ci.specs->>'num_valves')::INTEGER,
  ci.specs->>'transmission',
  (ci.specs->>'mileage')::NUMERIC(5,1),
  ci.specs->>'front_brake',
  ci.specs->>'rear_brake',
  ci.specs->>'braking_system',
  (ci.specs->>'kerb_weight')::INTEGER,
  (ci.specs->>'seat_height')::INTEGER,
  (ci.specs->>'ground_clearance')::INTEGER,
  (ci.specs->>'wheelbase')::INTEGER,
  (ci.specs->>'fuel_capacity')::NUMERIC(4,1),
  ci.specs->>'console_type',
  (ci.specs->>'led_headlamp')::BOOLEAN,
  (ci.specs->>'usb_charging')::BOOLEAN,
  ci.specs->>'front_tyre',
  ci.specs->>'rear_tyre',
  ci.specs->>'tyre_type',
  ci.created_at,
  ci.updated_at
FROM cat_items ci
WHERE ci.type = 'VARIANT';
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Migrate → cat_skus (colour/media from cat_items + cat_assets)
-- ─────────────────────────────────────────────────────────────────────────────
-- Source: cat_items WHERE type = 'SKU' (or cat_skus_linear)
-- Media: JOIN cat_assets for image/video URLs

-- SKELETON:
/*
INSERT INTO cat_skus (id, sku_code, sku_type, brand_id, model_id, vehicle_variant_id,
  name, slug, status, position, is_primary, price_base,
  hex_primary, hex_secondary, color_name, finish,
  primary_image, gallery_img_1, gallery_img_2, gallery_img_3,
  zoom_factor, is_flipped, offset_x, offset_y, has_360,
  created_at, updated_at)
SELECT
  ci.id,
  ci.sku_code,
  'VEHICLE',
  ci.brand_id,
  -- model_id: need to walk up parent chain (SKU → UNIT → VARIANT → PRODUCT)
  (SELECT pp.id FROM cat_items pp WHERE pp.id = (SELECT p.parent_id FROM cat_items p WHERE p.id = ci.parent_id)),
  -- vehicle_variant_id: parent of UNIT
  (SELECT p.parent_id FROM cat_items p WHERE p.id = ci.parent_id),
  ci.name,
  ci.slug,
  ci.status,
  ci.position,
  ci.is_primary,
  ci.price_base,
  ci.specs->>'hex',
  ci.specs->>'hex_secondary',
  ci.specs->>'color_name',
  ci.specs->>'finish',
  ci.image_url,
  -- Gallery from cat_assets
  NULL, NULL, NULL,                                -- TODO: lateral join cat_assets
  ci.zoom_factor,
  ci.is_flipped,
  ci.offset_x::INTEGER,
  ci.offset_y::INTEGER,
  EXISTS (SELECT 1 FROM cat_assets ca WHERE ca.item_id = ci.id AND ca.type = '360'),
  ci.created_at,
  ci.updated_at
FROM cat_items ci
WHERE ci.type = 'SKU';
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 5: Migrate → cat_pricing (from cat_skus_linear.price_mh JSONB)
-- ─────────────────────────────────────────────────────────────────────────────
-- Source: cat_skus_linear.price_mh JSONB → 52 flat columns

-- SKELETON:
/*
INSERT INTO cat_pricing (sku_id, state_code,
  ex_showroom, on_road_price, gst_rate, hsn_code,
  rto_total, rto_default_type,
  rto_state_road_tax, rto_state_cess, rto_state_postal, rto_state_smart_card, rto_state_registration, rto_state_total,
  rto_bh_road_tax, rto_bh_cess, rto_bh_postal, rto_bh_smart_card, rto_bh_registration, rto_bh_total,
  rto_company_road_tax, rto_company_cess, rto_company_postal, rto_company_smart_card, rto_company_registration, rto_company_total,
  ins_od_base, ins_od_gst, ins_od_total,
  ins_tp_base, ins_tp_gst, ins_tp_total,
  ins_pa, ins_gst_total, ins_gst_rate, ins_base_total, ins_net_premium, ins_total,
  addon1_label, addon1_price, addon1_gst, addon1_total, addon1_default,
  addon2_label, addon2_price, addon2_gst, addon2_total, addon2_default,
  publish_stage, published_at, is_popular)
SELECT
  sl.id,                                           -- sku_id = cat_skus_linear.id → mapped to new cat_skus.id
  'MH',                                            -- state_code
  (sl.price_mh->>'ex_showroom')::INTEGER,
  (sl.price_mh->>'on_road_price')::INTEGER,
  COALESCE((sl.price_mh->>'gst_rate')::NUMERIC, 0.18),
  sl.price_mh->>'hsn_code',
  -- ... (expand all 52 JSONB keys)
  -- TODO: Map every price_mh key to its flat column
  sl.publish_stage,
  sl.published_at,
  sl.is_popular
FROM cat_skus_linear sl
WHERE sl.price_mh IS NOT NULL
  AND sl.price_mh->>'ex_showroom' IS NOT NULL;
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3 Verification Queries (run AFTER migration, DO NOT include in migration)
-- ─────────────────────────────────────────────────────────────────────────────

-- V1: Row count parity
-- SELECT 'cat_models' AS tbl, COUNT(*) FROM cat_models
-- UNION ALL SELECT 'source_products', COUNT(*) FROM cat_items WHERE type = 'PRODUCT';

-- V2: Price totals match
-- SELECT SUM(ex_showroom) FROM cat_pricing WHERE state_code = 'MH';
-- vs
-- SELECT SUM((price_mh->>'ex_showroom')::INTEGER) FROM cat_skus_linear WHERE price_mh IS NOT NULL;

-- V3: FK integrity
-- SELECT COUNT(*) FROM cat_skus s LEFT JOIN cat_models m ON s.model_id = m.id WHERE m.id IS NULL;

-- V4: No duplicate matrix cells
-- SELECT vehicle_variant_id, slug, COUNT(*) FROM cat_skus WHERE sku_type = 'VEHICLE' GROUP BY 1,2 HAVING COUNT(*) > 1;

-- V5: Suitable For check for accessories (entries should exist in cat_suitable_for)
-- SELECT s.id, s.name FROM cat_skus s WHERE s.sku_type = 'ACCESSORY'
-- AND NOT EXISTS (SELECT 1 FROM cat_suitable_for c WHERE c.sku_id = s.id);
-- Note: No rows in cat_suitable_for = UNIVERSAL (intentional). Only flag if business logic requires explicit entries.

-- V6: Parity snapshot (sample)
-- SELECT ci.name, ci.slug, ci.price_base, cm.name, cm.slug
-- FROM cat_items ci
-- JOIN cat_models cm ON cm.id = ci.id
-- LIMIT 100;

COMMIT;
