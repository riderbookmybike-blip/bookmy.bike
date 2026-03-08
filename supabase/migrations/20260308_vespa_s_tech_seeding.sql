-- ============================================================
-- Vespa S Tech 125 & 150 — Specifications & Pricing Seeding
-- ============================================================
-- Model ID: 404b943d-ff8f-4682-ab35-d76accc8d2bc (Vespa S Tech)
-- Variants: 
--   125: 9c9a87a2-42be-47be-a52d-31461d9d6b1b
--   150: cfacd74f-7712-442e-9f96-695e5445afdf
-- ============================================================

BEGIN;

-- 1. Update Specifications for Vespa S Tech 125
UPDATE cat_variants_vehicle
SET 
    displacement = 124.45,
    max_power = '9.51 PS @ 7100 rpm',
    max_torque = '10.1 Nm @ 5600 rpm',
    braking_system = 'CBS',
    transmission = 'CVT_AUTOMATIC',
    cooling_system = 'Air Cooled',
    cylinders = 1,
    num_valves = 3,
    fuel_capacity = 7.4,
    kerb_weight = 115,
    seat_height = 770,
    front_brake = '200 mm Ventilated Disc',
    rear_brake = '140 mm Drum',
    front_tyre = '110/70-11 Tubeless',
    rear_tyre = '120/70-10 Tubeless',
    tyre_type = 'Tubeless',
    console_type = 'DIGITAL_TFT',
    led_headlamp = true,
    led_tail_lamp = true,
    usb_charging = true,
    bluetooth = true,
    navigation = true,
    emission_norm = 'BS6 Phase 2',
    updated_at = NOW()
WHERE id = '9c9a87a2-42be-47be-a52d-31461d9d6b1b';

-- 2. Update Specifications for Vespa S Tech 150
UPDATE cat_variants_vehicle
SET 
    displacement = 149.5,
    max_power = '11.42 PS @ 7500 rpm',
    max_torque = '11.66 Nm @ 6100 rpm',
    braking_system = 'ABS',
    transmission = 'CVT_AUTOMATIC',
    cooling_system = 'Air Cooled',
    cylinders = 1,
    num_valves = 3,
    fuel_capacity = 7.4,
    kerb_weight = 115,
    seat_height = 770,
    front_brake = '200 mm Ventilated Disc',
    rear_brake = '140 mm Drum',
    front_tyre = '110/70-11 Tubeless',
    rear_tyre = '120/70-10 Tubeless',
    tyre_type = 'Tubeless',
    console_type = 'DIGITAL_TFT',
    led_headlamp = true,
    led_tail_lamp = true,
    usb_charging = true,
    bluetooth = true,
    navigation = true,
    emission_norm = 'BS6 Phase 2',
    updated_at = NOW()
WHERE id = 'cfacd74f-7712-442e-9f96-695e5445afdf';

-- 3. Update SKUs with accurate hex and metadata
-- Grigio Grey (Light Silver/Grey)
UPDATE cat_skus
SET 
    hex_primary = '#D5D5D5',
    finish = 'MATTE',
    updated_at = NOW()
WHERE id IN ('e0591d59-cd19-49b7-a98a-6bec8284eba8', '0d2c7d8b-77c6-4064-8a13-c512e0a9436e');

-- Matt Black
UPDATE cat_skus
SET 
    hex_primary = '#181818',
    finish = 'MATTE',
    updated_at = NOW()
WHERE id IN ('82363074-949e-4603-9f47-564362e12e35', 'd60885b3-d8f1-4381-8f66-5651a8023b31');

-- 4. Upsert Pricing for Mumbai (MH)
-- Note: 'cat_price_state_mh' is the SOT for MH state pricing.
INSERT INTO cat_price_state_mh (sku_id, state_code, ex_showroom, ex_factory, on_road_price, publish_stage)
VALUES 
    ('e0591d59-cd19-49b7-a98a-6bec8284eba8', 'MH', 181000, 181000, 207000, 'PUBLISHED'),
    ('82363074-949e-4603-9f47-564362e12e35', 'MH', 181000, 181000, 207000, 'PUBLISHED'),
    ('0d2c7d8b-77c6-4064-8a13-c512e0a9436e', 'MH', 198320, 198320, 222000, 'PUBLISHED'),
    ('d60885b3-d8f1-4381-8f66-5651a8023b31', 'MH', 198320, 198320, 222000, 'PUBLISHED')
ON CONFLICT (sku_id, state_code) DO UPDATE 
SET 
    ex_showroom = EXCLUDED.ex_showroom,
    ex_factory = EXCLUDED.ex_factory,
    on_road_price = EXCLUDED.on_road_price,
    publish_stage = EXCLUDED.publish_stage,
    updated_at = NOW();

COMMIT;
