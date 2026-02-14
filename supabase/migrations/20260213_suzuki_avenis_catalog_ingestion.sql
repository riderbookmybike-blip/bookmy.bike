-- ============================================================
-- Suzuki Avenis 125 — Catalog Ingestion
-- Single-angle color images only (no 360° for now)
-- ============================================================
-- brand_id: 1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46 (Suzuki)
-- category: SCOOTER
-- Hierarchy: 1 FAMILY → 3 VARIANTs → 11 SKUs = 15 rows
-- ============================================================

BEGIN;

-- ============================================================
-- 1. FAMILY: Suzuki Avenis 125
-- ============================================================
INSERT INTO cat_items (
    id, brand_id, category, type, name, slug, status, price_base, zoom_factor,
    specs
) VALUES (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER',
    'FAMILY',
    'Suzuki Avenis 125',
    'suzuki/avenis-125',
    'ACTIVE',
    0,
    1.0,
    '{"engine_cc": 124, "fuel_capacity": 5.2, "mileage": 49.6, "engine_type": "4-Stroke, 1-Cylinder, Air Cooled, SOHC, 2-Valve", "power": "8.7 PS @ 6,750 rpm", "torque": "10 Nm @ 5,500 rpm", "transmission": "CVT (Automatic)", "kerb_weight": "106 kg", "front_brake": "Disc (190mm)", "rear_brake": "Drum (120mm)", "front_tyre": "90/90-12 Tubeless", "rear_tyre": "90/100-10 Tubeless", "ground_clearance": "160 mm", "seat_height": "780 mm", "wheelbase": "1,265 mm", "emission": "BS6 Phase 2B / OBD-2B"}'::jsonb
);

-- ============================================================
-- 2. VARIANTS (3)
-- ============================================================

-- Avenis Ride Connect
INSERT INTO cat_items (
    id, brand_id, category, type, name, slug, status, parent_id, is_primary,
    image_url, zoom_factor
) VALUES (
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER',
    'VARIANT',
    'Avenis Ride Connect',
    'suzuki/avenis-125/ride-connect',
    'ACTIVE',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    true,
    '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png',
    1.0
);

-- Avenis Standard Edition
INSERT INTO cat_items (
    id, brand_id, category, type, name, slug, status, parent_id,
    image_url, zoom_factor
) VALUES (
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER',
    'VARIANT',
    'Avenis Standard',
    'suzuki/avenis-125/standard',
    'ACTIVE',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png',
    1.0
);

-- Avenis Special Edition
INSERT INTO cat_items (
    id, brand_id, category, type, name, slug, status, parent_id,
    image_url, zoom_factor
) VALUES (
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER',
    'VARIANT',
    'Avenis Special Edition',
    'suzuki/avenis-125/special-edition',
    'ACTIVE',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    '/media/suzuki/avenis/colors/metallic-mat-black-titanium-silver.jpg',
    1.0
);

-- ============================================================
-- 3. SKUs — Avenis Ride Connect (5 colors)
-- ============================================================

INSERT INTO cat_items (
    id, brand_id, category, type, name, slug, status, parent_id,
    image_url, zoom_factor, gallery_urls, specs
) VALUES
-- RC: Glossy Sparkle Black / Pearl Mira Red
(
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Glossy Sparkle Black / Pearl Mira Red',
    'suzuki/avenis-125/ride-connect/glossy-sparkle-black-pearl-mira-red',
    'ACTIVE',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png',
    1.0,
    '["/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png"]'::jsonb,
    '{"Color": "Glossy Sparkle Black / Pearl Mira Red", "hex_primary": "#f60a12", "primary_image": "/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png", "gallery": ["/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png"]}'::jsonb
),
-- RC: Met. Mat Platinum Silver / Glass Sparkle Black
(
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Met. Mat Platinum Silver / Glass Sparkle Black',
    'suzuki/avenis-125/ride-connect/met-mat-platinum-silver-glass-sparkle-black',
    'ACTIVE',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    '/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png',
    1.0,
    '["/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png"]'::jsonb,
    '{"Color": "Met. Mat Platinum Silver / Glass Sparkle Black", "hex_primary": "#aaaaaa", "primary_image": "/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png", "gallery": ["/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png"]}'::jsonb
),
-- RC: Champion Yellow / Glossy Sparkle Black
(
    'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Champion Yellow / Glossy Sparkle Black',
    'suzuki/avenis-125/ride-connect/champion-yellow-glossy-sparkle-black',
    'ACTIVE',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    '/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png',
    1.0,
    '["/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png"]'::jsonb,
    '{"Color": "Champion Yellow / Glossy Sparkle Black", "hex_primary": "#e6d72e", "primary_image": "/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png", "gallery": ["/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png"]}'::jsonb
),
-- RC: Glossy Sparkle Black
(
    'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Glossy Sparkle Black',
    'suzuki/avenis-125/ride-connect/glossy-sparkle-black',
    'ACTIVE',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    '/media/suzuki/avenis/colors/glossy-sparkle-black.png',
    1.0,
    '["/media/suzuki/avenis/colors/glossy-sparkle-black.png"]'::jsonb,
    '{"Color": "Glossy Sparkle Black", "hex_primary": "#000000", "primary_image": "/media/suzuki/avenis/colors/glossy-sparkle-black.png", "gallery": ["/media/suzuki/avenis/colors/glossy-sparkle-black.png"]}'::jsonb
),
-- RC: Glossy Sparkle Black / Pearl Glacier White
(
    'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Glossy Sparkle Black / Pearl Glacier White',
    'suzuki/avenis-125/ride-connect/glossy-sparkle-black-pearl-glacier-white',
    'ACTIVE',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png',
    1.0,
    '["/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png"]'::jsonb,
    '{"Color": "Glossy Sparkle Black / Pearl Glacier White", "hex_primary": "#ffffff", "primary_image": "/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png", "gallery": ["/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png"]}'::jsonb
);

-- ============================================================
-- 4. SKUs — Avenis Standard (5 colors, same images)
-- ============================================================

INSERT INTO cat_items (
    id, brand_id, category, type, name, slug, status, parent_id,
    image_url, zoom_factor, gallery_urls, specs
) VALUES
-- STD: Glossy Sparkle Black / Pearl Mira Red
(
    'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Glossy Sparkle Black / Pearl Mira Red',
    'suzuki/avenis-125/standard/glossy-sparkle-black-pearl-mira-red',
    'ACTIVE',
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png',
    1.0,
    '["/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png"]'::jsonb,
    '{"Color": "Glossy Sparkle Black / Pearl Mira Red", "hex_primary": "#f60a12", "primary_image": "/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png", "gallery": ["/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png"]}'::jsonb
),
-- STD: Met. Mat Platinum Silver / Glass Sparkle Black
(
    'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Met. Mat Platinum Silver / Glass Sparkle Black',
    'suzuki/avenis-125/standard/met-mat-platinum-silver-glass-sparkle-black',
    'ACTIVE',
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    '/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png',
    1.0,
    '["/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png"]'::jsonb,
    '{"Color": "Met. Mat Platinum Silver / Glass Sparkle Black", "hex_primary": "#aaaaaa", "primary_image": "/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png", "gallery": ["/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png"]}'::jsonb
),
-- STD: Champion Yellow / Glossy Sparkle Black
(
    'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Champion Yellow / Glossy Sparkle Black',
    'suzuki/avenis-125/standard/champion-yellow-glossy-sparkle-black',
    'ACTIVE',
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    '/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png',
    1.0,
    '["/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png"]'::jsonb,
    '{"Color": "Champion Yellow / Glossy Sparkle Black", "hex_primary": "#e6d72e", "primary_image": "/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png", "gallery": ["/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png"]}'::jsonb
),
-- STD: Glossy Sparkle Black
(
    'a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Glossy Sparkle Black',
    'suzuki/avenis-125/standard/glossy-sparkle-black',
    'ACTIVE',
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    '/media/suzuki/avenis/colors/glossy-sparkle-black.png',
    1.0,
    '["/media/suzuki/avenis/colors/glossy-sparkle-black.png"]'::jsonb,
    '{"Color": "Glossy Sparkle Black", "hex_primary": "#000000", "primary_image": "/media/suzuki/avenis/colors/glossy-sparkle-black.png", "gallery": ["/media/suzuki/avenis/colors/glossy-sparkle-black.png"]}'::jsonb
),
-- STD: Glossy Sparkle Black / Pearl Glacier White
(
    'b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Glossy Sparkle Black / Pearl Glacier White',
    'suzuki/avenis-125/standard/glossy-sparkle-black-pearl-glacier-white',
    'ACTIVE',
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png',
    1.0,
    '["/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png"]'::jsonb,
    '{"Color": "Glossy Sparkle Black / Pearl Glacier White", "hex_primary": "#ffffff", "primary_image": "/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png", "gallery": ["/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png"]}'::jsonb
);

-- ============================================================
-- 5. SKU — Avenis Special Edition (1 exclusive color)
-- ============================================================

INSERT INTO cat_items (
    id, brand_id, category, type, name, slug, status, parent_id,
    image_url, zoom_factor, gallery_urls, specs
) VALUES (
    'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f',
    '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46',
    'SCOOTER', 'SKU',
    'Metallic Mat Black / Titanium Silver',
    'suzuki/avenis-125/special-edition/metallic-mat-black-titanium-silver',
    'ACTIVE',
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    '/media/suzuki/avenis/colors/metallic-mat-black-titanium-silver.jpg',
    1.0,
    '["/media/suzuki/avenis/colors/metallic-mat-black-titanium-silver.jpg"]'::jsonb,
    '{"Color": "Metallic Mat Black / Titanium Silver", "hex_primary": "#cdbac0", "primary_image": "/media/suzuki/avenis/colors/metallic-mat-black-titanium-silver.jpg", "gallery": ["/media/suzuki/avenis/colors/metallic-mat-black-titanium-silver.jpg"]}'::jsonb
);

-- ============================================================
-- 6. cat_assets — Primary images for VARIANTs and SKUs
-- ============================================================

INSERT INTO cat_assets (item_id, type, url, is_primary, zoom_factor, position) VALUES
-- Variants
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'IMAGE', '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png', true, 1.0, 0),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'IMAGE', '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png', true, 1.0, 0),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'IMAGE', '/media/suzuki/avenis/colors/metallic-mat-black-titanium-silver.jpg', true, 1.0, 0),
-- RC SKUs
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'IMAGE', '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png', true, 1.0, 0),
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'IMAGE', '/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png', true, 1.0, 0),
('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'IMAGE', '/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png', true, 1.0, 0),
('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'IMAGE', '/media/suzuki/avenis/colors/glossy-sparkle-black.png', true, 1.0, 0),
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'IMAGE', '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png', true, 1.0, 0),
-- STD SKUs
('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 'IMAGE', '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-mira-red.png', true, 1.0, 0),
('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 'IMAGE', '/media/suzuki/avenis/colors/met-mat-platinum-silver-glass-sparkle-black.png', true, 1.0, 0),
('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'IMAGE', '/media/suzuki/avenis/colors/champion-yellow-glossy-sparkle-black.png', true, 1.0, 0),
('a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', 'IMAGE', '/media/suzuki/avenis/colors/glossy-sparkle-black.png', true, 1.0, 0),
('b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', 'IMAGE', '/media/suzuki/avenis/colors/glossy-sparkle-black-pearl-glacier-white.png', true, 1.0, 0),
-- SE SKU
('c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'IMAGE', '/media/suzuki/avenis/colors/metallic-mat-black-titanium-silver.jpg', true, 1.0, 0);

-- ============================================================
-- 7. Verification
-- ============================================================
-- Run after COMMIT:
--   SELECT type, count(*) FROM cat_items
--   WHERE brand_id = '1e9a31a4-66fd-4fe3-8ba6-5477dcf28f46'
--     AND name ILIKE '%avenis%'
--   GROUP BY type;
--   Expected: FAMILY: 1, VARIANT: 3, SKU: 11

COMMIT;
