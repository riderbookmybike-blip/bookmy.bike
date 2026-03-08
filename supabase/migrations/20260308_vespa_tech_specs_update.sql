-- ============================================================
-- Vespa Tech 125 & 150 — Specifications & Media Update
-- ============================================================
-- Model ID: 715768a9-7746-407c-a31a-cc6dc0879d03 (Vespa Tech)
-- Variants: 
--   125: 1a821056-f419-4729-a56d-132be2dea9d1
--   150: be3a2079-e1ef-4ea5-a94b-30b6d0a23485
-- ============================================================

BEGIN;

-- 1. Update Variants with Full Specifications
UPDATE cat_variants_vehicle
SET 
    emission_norm = 'BS6 Phase 2',
    front_brake = '200 mm Ventilated Disc',
    rear_brake = '140 mm Drum',
    front_tyre = '110/70-11 Tubeless',
    rear_tyre = '120/70-10 Tubeless',
    tyre_type = 'Tubeless',
    front_suspension = 'Aircraft-inspired Hydraulic Single Side Arm',
    rear_suspension = 'Dual-effect Hydraulic Shock Absorber (4-position adjustable)',
    kerb_weight = 115,
    seat_height = 770,
    ground_clearance = 155,
    wheelbase = 1290,
    updated_at = NOW()
WHERE model_id = '715768a9-7746-407c-a31a-cc6dc0879d03';

-- 2. Update SKUs with Media Paths & Color Metadata
-- Blue Energico SKUs
UPDATE cat_skus
SET 
    primary_image = '/media/piaggio/vespa-tech/blue_energico.webp',
    gallery_img_1 = '/media/piaggio/vespa-tech/blue_energico.webp',
    hex_primary = '#08427A',
    finish = 'GLOSS',
    media_shared = true,
    updated_at = NOW()
WHERE id IN ('956ae513-23ae-4949-9a83-046c5f744bcf', 'a96782a8-cd4f-4e2e-8de0-79cbcd102c80');

-- Grigio Grey SKUs
UPDATE cat_skus
SET 
    hex_primary = '#ECECEC',
    finish = 'GLOSS',
    media_shared = true,
    updated_at = NOW()
WHERE id IN ('efacbc4e-3f8b-4b41-8861-a1642e56d0cd', '841ed190-6783-47cf-889b-c3fdc5279c9b');

COMMIT;
