-- ================================================================
-- Hero Xtreme 125R — Full Restructure Migration
-- Date: 2026-03-09
-- Model ID: 2180aad1-de15-4337-84a2-f093cffe84d5
-- Brand ID: c14237f7-6c98-4b50-9c02-15b6c0d8b3b5 (HERO)
-- ================================================================

BEGIN;

-- ================================================================
-- PHASE 1: Fix Model-Level Data
-- ================================================================
UPDATE cat_models
SET engine_cc = 124.7,
    emission_standard = 'BS6_STAGE2'
WHERE id = '2180aad1-de15-4337-84a2-f093cffe84d5';

-- ================================================================
-- PHASE 2: Delete Old SKUs, Pricing, Variants, Colours
-- (Order: pricing → skus → variants → colours)
-- ================================================================

-- 2a. Delete pricing for old SKUs
DELETE FROM cat_price_state_mh
WHERE sku_id IN (
  SELECT id FROM cat_skus WHERE model_id = '2180aad1-de15-4337-84a2-f093cffe84d5'
);

-- 2b. Delete old SKUs
DELETE FROM cat_skus
WHERE model_id = '2180aad1-de15-4337-84a2-f093cffe84d5';

-- 2c. Delete old variants
DELETE FROM cat_variants_vehicle
WHERE model_id = '2180aad1-de15-4337-84a2-f093cffe84d5';

-- 2d. Delete old colours
DELETE FROM cat_colours
WHERE model_id = '2180aad1-de15-4337-84a2-f093cffe84d5';

-- ================================================================
-- PHASE 3: Create 4 Correct Variants (with full specs)
-- ================================================================

-- Variant 1: IBS - OBD 2B (base variant, split seat)
INSERT INTO cat_variants_vehicle (
  id, model_id, name, slug, position, status,
  displacement, engine_type, num_valves, max_power, max_torque, air_filter,
  transmission, start_type, mileage_arai,
  front_brake, rear_brake, braking_system,
  front_suspension, rear_suspension,
  kerb_weight, seat_height, ground_clearance, wheelbase, fuel_capacity,
  front_tyre, rear_tyre, tyre_type,
  console_type, led_headlamp, led_tail_lamp, usb_charging, bluetooth, navigation, ride_modes
) VALUES (
  gen_random_uuid(),
  '2180aad1-de15-4337-84a2-f093cffe84d5',
  'IBS - OBD 2B', 'ibs-obd-2b', 1, 'ACTIVE',
  124.7, 'Air Cooled, 4-Stroke, Single Cylinder, 2 Valve', 2,
  '11.4 bhp @ 8250 rpm', '10.5 Nm @ 6000 rpm', NULL,
  'MANUAL', 'KICK_ELECTRIC', 66,
  'Disc 240mm', 'Drum 130mm', 'CBS',
  'Dia. 37mm Telescopic Fork', '7-Step Preload Adj. Monoshock',
  136, 794, 180, 1319, 10.0,
  '90/90-17', '120/80-17', 'Tubeless',
  'DIGITAL', true, true, true, true, false, NULL
);

-- Variant 2: Single Seat ABS
INSERT INTO cat_variants_vehicle (
  id, model_id, name, slug, position, status,
  displacement, engine_type, num_valves, max_power, max_torque, air_filter,
  transmission, start_type, mileage_arai,
  front_brake, rear_brake, braking_system,
  front_suspension, rear_suspension,
  kerb_weight, seat_height, ground_clearance, wheelbase, fuel_capacity,
  front_tyre, rear_tyre, tyre_type,
  console_type, led_headlamp, led_tail_lamp, usb_charging, bluetooth, navigation, ride_modes
) VALUES (
  gen_random_uuid(),
  '2180aad1-de15-4337-84a2-f093cffe84d5',
  'Single Seat ABS', 'single-seat-abs', 2, 'ACTIVE',
  124.7, 'Air Cooled, 4-Stroke, Single Cylinder, 2 Valve', 2,
  '11.4 bhp @ 8250 rpm', '10.5 Nm @ 6000 rpm', NULL,
  'MANUAL', 'KICK_ELECTRIC', 66,
  'Disc 276mm', 'Disc', 'ABS',
  'Dia. 37mm Telescopic Fork', '7-Step Preload Adj. Monoshock',
  136, 794, 180, 1319, 10.0,
  '90/90-17', '120/80-17', 'Tubeless',
  'DIGITAL', true, true, true, true, false, NULL
);

-- Variant 3: Single Seat ABS - OBD 2B
INSERT INTO cat_variants_vehicle (
  id, model_id, name, slug, position, status,
  displacement, engine_type, num_valves, max_power, max_torque, air_filter,
  transmission, start_type, mileage_arai,
  front_brake, rear_brake, braking_system,
  front_suspension, rear_suspension,
  kerb_weight, seat_height, ground_clearance, wheelbase, fuel_capacity,
  front_tyre, rear_tyre, tyre_type,
  console_type, led_headlamp, led_tail_lamp, usb_charging, bluetooth, navigation, ride_modes
) VALUES (
  gen_random_uuid(),
  '2180aad1-de15-4337-84a2-f093cffe84d5',
  'Single Seat ABS - OBD 2B', 'single-seat-abs-obd-2b', 3, 'ACTIVE',
  124.7, 'Air Cooled, 4-Stroke, Single Cylinder, 2 Valve', 2,
  '11.4 bhp @ 8250 rpm', '10.5 Nm @ 6000 rpm', NULL,
  'MANUAL', 'KICK_ELECTRIC', 66,
  'Disc 276mm', 'Disc', 'ABS',
  'Dia. 37mm Telescopic Fork', '7-Step Preload Adj. Monoshock',
  136, 794, 180, 1319, 10.0,
  '90/90-17', '120/80-17', 'Tubeless',
  'DIGITAL', true, true, true, true, false, NULL
);

-- Variant 4: Dual Channel ABS (top variant — cruise control, ride modes, ETB)
INSERT INTO cat_variants_vehicle (
  id, model_id, name, slug, position, status,
  displacement, engine_type, num_valves, max_power, max_torque, air_filter,
  transmission, start_type, mileage_arai,
  front_brake, rear_brake, braking_system,
  front_suspension, rear_suspension,
  kerb_weight, seat_height, ground_clearance, wheelbase, fuel_capacity,
  front_tyre, rear_tyre, tyre_type,
  console_type, led_headlamp, led_tail_lamp, usb_charging, bluetooth, navigation, ride_modes
) VALUES (
  gen_random_uuid(),
  '2180aad1-de15-4337-84a2-f093cffe84d5',
  'Dual Channel ABS', 'dual-channel-abs', 4, 'ACTIVE',
  124.7, 'Air Cooled, 4-Stroke, Single Cylinder, 2 Valve', 2,
  '11.4 bhp @ 8250 rpm', '10.5 Nm @ 6000 rpm', NULL,
  'MANUAL', 'KICK_ELECTRIC', 66,
  'Disc 276mm', 'Disc', 'DUAL_ABS',
  'Dia. 37mm Telescopic Fork', '7-Step Preload Adj. Monoshock',
  136, 794, 180, 1319, 10.0,
  '90/90-17', '120/80-17', 'Tubeless',
  'DIGITAL', true, true, true, true, false, 'Eco, Road, Power'
);

-- ================================================================
-- PHASE 4: Create 11 Correct Colours
-- ================================================================

-- Split Seat Colours (7)
INSERT INTO cat_colours (id, model_id, name, hex_primary, hex_secondary, finish, position) VALUES
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Stallion Black',           '#1C1C1C', NULL,      'MATTE', 1),
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Firestorm Red',            '#B91C1C', NULL,      'GLOSS', 2),
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Cobalt Blue',              '#1E40AF', NULL,      'GLOSS', 3),
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Abrax Orange',             '#EA580C', NULL,      'GLOSS', 4),
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Black Leaf Green',         '#1A1A1A', '#22C55E', 'MATTE', 5),
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Black Matshdow Grey',      '#1A1A1A', '#6B7280', 'MATTE', 6),
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Black Pearl Red',          '#1A1A1A', '#DC2626', 'MATTE', 7);

-- Single Seat Colours (4)
INSERT INTO cat_colours (id, model_id, name, hex_primary, hex_secondary, finish, position) VALUES
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Abrax Orange (Single Seat)',   '#EA580C', NULL, 'GLOSS', 8),
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Stallion Black (Single Seat)', '#1C1C1C', NULL, 'MATTE', 9),
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Firestorm Red (Single Seat)',  '#DC2626', NULL, 'GLOSS', 10),
  (gen_random_uuid(), '2180aad1-de15-4337-84a2-f093cffe84d5', 'Cobalt Blue (Single Seat)',    '#1E40AF', NULL, 'GLOSS', 11);

-- ================================================================
-- PHASE 5: Create SKUs (Variant × Colour matrix)
-- Only valid combinations:
--   IBS OBD2B (split seat)       → 7 split-seat colours
--   Single Seat ABS              → 4 single-seat colours
--   Single Seat ABS OBD2B        → 4 single-seat colours
--   Dual Channel ABS (split seat)→ 7 split-seat colours
-- ================================================================

-- Helper: Use subqueries to get the newly created variant/colour IDs
-- We'll use a DO block for this

DO $$
DECLARE
  v_model_id UUID := '2180aad1-de15-4337-84a2-f093cffe84d5';
  v_brand_id UUID := 'c14237f7-6c98-4b50-9c02-15b6c0d8b3b5';
  v_ibs_id UUID;
  v_single_abs_id UUID;
  v_single_abs_obd_id UUID;
  v_dual_abs_id UUID;
  v_colour RECORD;
  v_sku_pos INT := 0;
  v_price_base NUMERIC;
  v_sku_id UUID;
  v_variant_name TEXT;
  v_is_single_seat BOOLEAN;
BEGIN
  -- Get variant IDs
  SELECT id INTO v_ibs_id FROM cat_variants_vehicle WHERE model_id = v_model_id AND slug = 'ibs-obd-2b';
  SELECT id INTO v_single_abs_id FROM cat_variants_vehicle WHERE model_id = v_model_id AND slug = 'single-seat-abs';
  SELECT id INTO v_single_abs_obd_id FROM cat_variants_vehicle WHERE model_id = v_model_id AND slug = 'single-seat-abs-obd-2b';
  SELECT id INTO v_dual_abs_id FROM cat_variants_vehicle WHERE model_id = v_model_id AND slug = 'dual-channel-abs';

  -- Create SKUs for each variant × matching colours
  FOR v_colour IN
    SELECT id, name, hex_primary, hex_secondary, finish FROM cat_colours WHERE model_id = v_model_id ORDER BY position
  LOOP
    v_is_single_seat := v_colour.name LIKE '%(Single Seat)%';

    -- IBS OBD2B — split seat colours only
    IF NOT v_is_single_seat THEN
      v_sku_pos := v_sku_pos + 1;
      v_sku_id := gen_random_uuid();
      INSERT INTO cat_skus (
        id, sku_code, sku_type, brand_id, model_id, vehicle_variant_id, colour_id,
        name, slug, status, position, is_primary,
        price_base, color_name, hex_primary, hex_secondary, finish,
        primary_image, media_shared
      ) VALUES (
        v_sku_id,
        substr(replace(gen_random_uuid()::text, '-', ''), 1, 9),
        'VEHICLE', v_brand_id, v_model_id, v_ibs_id, v_colour.id,
        'HERO - Xtreme 125R - IBS OBD2B - ' || v_colour.name,
        'hero-xtreme-125r-ibs-obd2b-' || lower(replace(replace(v_colour.name, ' ', '-'), '''', '')),
        'ACTIVE', v_sku_pos,
        CASE WHEN v_sku_pos = 1 THEN true ELSE false END,
        92500, v_colour.name, v_colour.hex_primary, v_colour.hex_secondary, v_colour.finish,
        NULL, true
      );
      -- Pricing
      INSERT INTO cat_price_state_mh (id, sku_id, state_code, ex_showroom, ex_factory, on_road_price, publish_stage)
      VALUES (gen_random_uuid(), v_sku_id, 'MH', 92500, 92500, 108990, 'PUBLISHED');
    END IF;

    -- Single Seat ABS — single seat colours only
    IF v_is_single_seat THEN
      v_sku_pos := v_sku_pos + 1;
      v_sku_id := gen_random_uuid();
      INSERT INTO cat_skus (
        id, sku_code, sku_type, brand_id, model_id, vehicle_variant_id, colour_id,
        name, slug, status, position, is_primary,
        price_base, color_name, hex_primary, hex_secondary, finish,
        primary_image, media_shared
      ) VALUES (
        v_sku_id,
        substr(replace(gen_random_uuid()::text, '-', ''), 1, 9),
        'VEHICLE', v_brand_id, v_model_id, v_single_abs_id, v_colour.id,
        'HERO - Xtreme 125R - Single Seat ABS - ' || replace(v_colour.name, ' (Single Seat)', ''),
        'hero-xtreme-125r-single-seat-abs-' || lower(replace(replace(replace(v_colour.name, ' (Single Seat)', ''), ' ', '-'), '''', '')),
        'ACTIVE', v_sku_pos, false,
        95434, v_colour.name, v_colour.hex_primary, v_colour.hex_secondary, v_colour.finish,
        NULL, true
      );
      INSERT INTO cat_price_state_mh (id, sku_id, state_code, ex_showroom, ex_factory, on_road_price, publish_stage)
      VALUES (gen_random_uuid(), v_sku_id, 'MH', 95434, 95434, 112450, 'PUBLISHED');
    END IF;

    -- Single Seat ABS OBD2B — single seat colours only
    IF v_is_single_seat THEN
      v_sku_pos := v_sku_pos + 1;
      v_sku_id := gen_random_uuid();
      INSERT INTO cat_skus (
        id, sku_code, sku_type, brand_id, model_id, vehicle_variant_id, colour_id,
        name, slug, status, position, is_primary,
        price_base, color_name, hex_primary, hex_secondary, finish,
        primary_image, media_shared
      ) VALUES (
        v_sku_id,
        substr(replace(gen_random_uuid()::text, '-', ''), 1, 9),
        'VEHICLE', v_brand_id, v_model_id, v_single_abs_obd_id, v_colour.id,
        'HERO - Xtreme 125R - Single Seat ABS OBD2B - ' || replace(v_colour.name, ' (Single Seat)', ''),
        'hero-xtreme-125r-single-seat-abs-obd2b-' || lower(replace(replace(replace(v_colour.name, ' (Single Seat)', ''), ' ', '-'), '''', '')),
        'ACTIVE', v_sku_pos, false,
        95447, v_colour.name, v_colour.hex_primary, v_colour.hex_secondary, v_colour.finish,
        NULL, true
      );
      INSERT INTO cat_price_state_mh (id, sku_id, state_code, ex_showroom, ex_factory, on_road_price, publish_stage)
      VALUES (gen_random_uuid(), v_sku_id, 'MH', 95447, 95447, 112465, 'PUBLISHED');
    END IF;

    -- Dual Channel ABS — split seat colours only
    IF NOT v_is_single_seat THEN
      v_sku_pos := v_sku_pos + 1;
      v_sku_id := gen_random_uuid();
      INSERT INTO cat_skus (
        id, sku_code, sku_type, brand_id, model_id, vehicle_variant_id, colour_id,
        name, slug, status, position, is_primary,
        price_base, color_name, hex_primary, hex_secondary, finish,
        primary_image, media_shared
      ) VALUES (
        v_sku_id,
        substr(replace(gen_random_uuid()::text, '-', ''), 1, 9),
        'VEHICLE', v_brand_id, v_model_id, v_dual_abs_id, v_colour.id,
        'HERO - Xtreme 125R - Dual Channel ABS - ' || v_colour.name,
        'hero-xtreme-125r-dual-channel-abs-' || lower(replace(replace(v_colour.name, ' ', '-'), '''', '')),
        'ACTIVE', v_sku_pos, false,
        104500, v_colour.name, v_colour.hex_primary, v_colour.hex_secondary, v_colour.finish,
        NULL, true
      );
      INSERT INTO cat_price_state_mh (id, sku_id, state_code, ex_showroom, ex_factory, on_road_price, publish_stage)
      VALUES (gen_random_uuid(), v_sku_id, 'MH', 104500, 104500, 123100, 'PUBLISHED');
    END IF;
  END LOOP;
END $$;

COMMIT;
