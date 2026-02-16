-- =============================================================================
-- 🏗️ Catalog Normalization v4.2 — Phase 1: Create Tables + Constraints + Indexes
-- =============================================================================
-- Date: 16 Feb 2026
-- Project: BookMyBike · Supabase `aytdeqjxxjxbgiyslubx`
-- Plan: .gemini/catalog_normalization_plan.md
--
-- This migration creates 8 new tables + alters cat_brands.
-- Run in a single transaction. Rollback-safe.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1️⃣ cat_specifications — Master Blueprint (Spec Registry)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cat_specifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_key        TEXT NOT NULL UNIQUE,
  display_label   TEXT NOT NULL,
  data_type       TEXT NOT NULL CHECK (data_type IN ('TEXT', 'INTEGER', 'NUMERIC', 'BOOLEAN', 'ENUM')),
  unit            TEXT,                         -- "mm", "kg", "cc", "kmpl", etc.
  spec_level      TEXT NOT NULL CHECK (spec_level IN ('MODEL', 'VARIANT')),
  product_types   TEXT[] NOT NULL DEFAULT '{VEHICLE}', -- which types use this spec
  is_filterable   BOOLEAN DEFAULT false,
  is_comparable   BOOLEAN DEFAULT false,
  is_highlighted  BOOLEAN DEFAULT false,
  allowed_values  TEXT[],                        -- for ENUM type
  min_value       NUMERIC,                      -- for numeric range validation
  max_value       NUMERIC,
  category        TEXT CHECK (category IN ('ENGINE', 'BRAKES', 'DIMENSIONS', 'FEATURES', 'ELECTRICAL', 'CHASSIS', 'GENERAL')),
  position        INTEGER DEFAULT 0,
  suffix          TEXT,                          -- "cc", "kg", "mm" — display suffix
  description     TEXT,
  example_value   TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cat_specifications IS 'Master registry of all product attributes. Drives column definitions in variant tables.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2️⃣ cat_models — Master Model/Product/Service table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cat_models (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id          UUID NOT NULL REFERENCES cat_brands(id),
  name              TEXT NOT NULL,
  slug              TEXT,                        -- parent-scoped unique (see index below)
  product_type      TEXT NOT NULL CHECK (product_type IN ('VEHICLE', 'ACCESSORY', 'SERVICE')),
  body_type         TEXT CHECK (body_type IN ('MOTORCYCLE', 'SCOOTER', 'MOPED', 'ELECTRIC')),
  engine_cc         NUMERIC(6,1),                -- vehicles only
  fuel_type         TEXT CHECK (fuel_type IN ('PETROL', 'EV', 'CNG')),
  emission_standard TEXT CHECK (emission_standard IN ('BS4', 'BS6', 'BS6_STAGE2')),
  hsn_code          TEXT,
  item_tax_rate     NUMERIC(4,2) DEFAULT 18,
  position          INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cat_models IS 'Master catalog item: Model (Vehicle), Product (Accessory), or Service.';

-- Parent-scoped slug uniqueness
CREATE UNIQUE INDEX uq_cat_models_brand_type_slug
  ON cat_models (brand_id, product_type, slug);
CREATE INDEX ix_cat_models_brand_status
  ON cat_models (brand_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3️⃣ cat_variants_vehicle — Vehicle Variant + Flat Specs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cat_variants_vehicle (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id          UUID NOT NULL REFERENCES cat_models(id),
  name              TEXT NOT NULL,
  slug              TEXT,                        -- parent-scoped unique (see index below)
  position          INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  -- ENGINE
  engine_type       TEXT,                        -- "Single Cylinder, 4-Stroke"
  displacement      NUMERIC(6,1),                -- 113.3
  max_power         TEXT,                        -- "5.9 KW @ 6500 RPM"
  max_torque        TEXT,                        -- "9.8 Nm @ 4500 RPM"
  num_valves        INTEGER,
  transmission      TEXT CHECK (transmission IN ('MANUAL', 'CVT_AUTOMATIC', 'AMT', 'DCT')),
  air_filter        TEXT,
  mileage           NUMERIC(5,1),                -- 57.0
  start_type        TEXT CHECK (start_type IN ('KICK', 'ELECTRIC', 'KICK_AND_ELECTRIC')),
  -- BRAKES
  front_brake       TEXT,
  rear_brake        TEXT,
  braking_system    TEXT CHECK (braking_system IN ('SBT', 'CBS', 'ABS', 'DUAL_ABS')),
  front_suspension  TEXT,
  rear_suspension   TEXT,
  -- DIMENSIONS
  kerb_weight       INTEGER,                     -- kg
  seat_height       INTEGER,                     -- mm
  ground_clearance  INTEGER,                     -- mm
  wheelbase         INTEGER,                     -- mm
  fuel_capacity     NUMERIC(4,1),                -- litres
  -- FEATURES
  console_type      TEXT CHECK (console_type IN ('ANALOG', 'DIGITAL', 'SEMI_DIGITAL_ANALOG', 'DIGITAL_TFT')),
  led_headlamp      BOOLEAN DEFAULT false,
  led_tail_lamp     BOOLEAN DEFAULT false,
  usb_charging      BOOLEAN DEFAULT false,
  bluetooth         BOOLEAN DEFAULT false,
  navigation        BOOLEAN DEFAULT false,
  ride_modes        TEXT,
  -- ELECTRICAL
  battery_type      TEXT,
  battery_capacity  TEXT,                        -- for EVs
  range_km          INTEGER,                     -- for EVs
  charging_time     TEXT,                        -- for EVs
  motor_power       TEXT,                        -- for EVs
  -- CHASSIS
  front_tyre        TEXT,
  rear_tyre         TEXT,
  tyre_type         TEXT CHECK (tyre_type IN ('TUBE', 'TUBELESS')),
  -- META
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cat_variants_vehicle IS 'Vehicle variant with all specifications as flat columns. Each spec driven by cat_specifications.';

-- Parent-scoped slug uniqueness
CREATE UNIQUE INDEX uq_cat_variants_vehicle_model_slug
  ON cat_variants_vehicle (model_id, slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4️⃣ cat_variants_accessory
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cat_variants_accessory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        UUID NOT NULL REFERENCES cat_models(id),
  name            TEXT NOT NULL,
  slug            TEXT,                          -- parent-scoped unique
  position        INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  material        TEXT,
  weight          INTEGER,                       -- grams
  finish          TEXT CHECK (finish IN ('GLOSS', 'MATTE', 'CHROME', 'CARBON')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cat_variants_accessory IS 'Accessory variant — helmet styles, crash guard types, etc. Suitable For managed via cat_suitable_for.';

CREATE UNIQUE INDEX uq_cat_variants_accessory_model_slug
  ON cat_variants_accessory (model_id, slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5️⃣ cat_variants_service (Future)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cat_variants_service (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        UUID NOT NULL REFERENCES cat_models(id),
  name            TEXT NOT NULL,
  slug            TEXT,                          -- parent-scoped unique
  position        INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  duration_months INTEGER,
  coverage_type   TEXT CHECK (coverage_type IN ('COMPREHENSIVE', 'THIRD_PARTY')),
  labor_included  BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cat_variants_service IS 'Service plan variants — warranty plans, AMC, etc.';

CREATE UNIQUE INDEX uq_cat_variants_service_model_slug
  ON cat_variants_service (model_id, slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6️⃣ cat_skus — Final Purchasable Unit + ALL Media
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cat_skus (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_code              TEXT UNIQUE,
  sku_type              TEXT NOT NULL CHECK (sku_type IN ('VEHICLE', 'ACCESSORY', 'SERVICE')),
  -- FKs
  brand_id              UUID NOT NULL REFERENCES cat_brands(id),
  model_id              UUID NOT NULL REFERENCES cat_models(id),
  vehicle_variant_id    UUID REFERENCES cat_variants_vehicle(id),
  accessory_variant_id  UUID REFERENCES cat_variants_accessory(id),
  service_variant_id    UUID REFERENCES cat_variants_service(id),
  -- Identity
  name                  TEXT NOT NULL,
  slug                  TEXT,
  status                TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  position              INTEGER DEFAULT 0,
  is_primary            BOOLEAN DEFAULT false,
  price_base            NUMERIC,
  -- Colour (Vehicle + some Accessories)
  hex_primary           TEXT,
  hex_secondary         TEXT,
  color_name            TEXT,
  finish                TEXT CHECK (finish IN ('GLOSS', 'MATTE', 'METALLIC', 'CHROME')),
  -- Media (ONLY HERE)
  primary_image         TEXT,
  gallery_img_1         TEXT,
  gallery_img_2         TEXT,
  gallery_img_3         TEXT,
  gallery_img_4         TEXT,
  gallery_img_5         TEXT,
  gallery_img_6         TEXT,
  video_url_1           TEXT,
  video_url_2           TEXT,
  pdf_url_1             TEXT,
  has_360               BOOLEAN DEFAULT false,
  -- Display
  zoom_factor           NUMERIC(3,2) DEFAULT 1.0,
  is_flipped            BOOLEAN DEFAULT false,
  offset_x              INTEGER DEFAULT 0,
  offset_y              INTEGER DEFAULT 0,
  media_shared          BOOLEAN DEFAULT false,
  -- Meta
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cat_skus IS 'Final purchasable unit — each row = 1 cell in SKU Matrix. All media lives here. Suitable For managed via cat_suitable_for.';

-- ─── CHECK: Exactly one variant FK per sku_type ────────────────────────────
ALTER TABLE cat_skus
ADD CONSTRAINT chk_cat_skus_type_fk
CHECK (
  (sku_type = 'VEHICLE'   AND vehicle_variant_id   IS NOT NULL AND accessory_variant_id IS NULL AND service_variant_id IS NULL) OR
  (sku_type = 'ACCESSORY' AND accessory_variant_id IS NOT NULL AND vehicle_variant_id   IS NULL AND service_variant_id IS NULL) OR
  (sku_type = 'SERVICE'   AND service_variant_id   IS NOT NULL AND vehicle_variant_id   IS NULL AND accessory_variant_id IS NULL)
);

-- ─── Partial unique indexes: prevent duplicate matrix cells ────────────────
CREATE UNIQUE INDEX uq_cat_skus_vehicle_cell
  ON cat_skus (vehicle_variant_id, slug) WHERE sku_type = 'VEHICLE';
CREATE UNIQUE INDEX uq_cat_skus_accessory_cell
  ON cat_skus (accessory_variant_id, slug) WHERE sku_type = 'ACCESSORY';
CREATE UNIQUE INDEX uq_cat_skus_service_cell
  ON cat_skus (service_variant_id, slug) WHERE sku_type = 'SERVICE';

-- ─── Lookup indexes ────────────────────────────────────────────────────────
CREATE INDEX ix_cat_skus_model_status
  ON cat_skus (model_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7️⃣ cat_pricing — Pricing (All Flat, Multi-State Ready)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cat_pricing (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id                UUID NOT NULL REFERENCES cat_skus(id),
  state_code            TEXT NOT NULL DEFAULT 'MH',
  -- Core
  ex_showroom           INTEGER NOT NULL CHECK (ex_showroom > 0),
  on_road_price         INTEGER NOT NULL,
  gst_rate              NUMERIC(4,2) DEFAULT 0.18,
  hsn_code              TEXT,
  -- RTO STATE (6 cols)
  rto_total             INTEGER,
  rto_default_type      TEXT CHECK (rto_default_type IN ('STATE', 'BH', 'COMPANY')),
  rto_state_road_tax    INTEGER,
  rto_state_cess        INTEGER,
  rto_state_postal      INTEGER,
  rto_state_smart_card  INTEGER,
  rto_state_registration INTEGER,
  rto_state_total       INTEGER,
  -- RTO BH (6 cols)
  rto_bh_road_tax       INTEGER,
  rto_bh_cess           INTEGER,
  rto_bh_postal         INTEGER,
  rto_bh_smart_card     INTEGER,
  rto_bh_registration   INTEGER,
  rto_bh_total          INTEGER,
  -- RTO COMPANY (6 cols)
  rto_company_road_tax       INTEGER,
  rto_company_cess           INTEGER,
  rto_company_postal         INTEGER,
  rto_company_smart_card     INTEGER,
  rto_company_registration   INTEGER,
  rto_company_total          INTEGER,
  -- Insurance OD (3 cols)
  ins_od_base           INTEGER,
  ins_od_gst            INTEGER,
  ins_od_total          INTEGER,
  -- Insurance TP (3 cols)
  ins_tp_base           INTEGER,
  ins_tp_gst            INTEGER,
  ins_tp_total          INTEGER,
  -- Insurance PA & Totals (5 cols)
  ins_pa                INTEGER,
  ins_gst_total         INTEGER,
  ins_gst_rate          INTEGER,
  ins_base_total        INTEGER,
  ins_net_premium       INTEGER,
  ins_total             INTEGER NOT NULL,
  -- Addon 1 (5 cols)
  addon1_label          TEXT,
  addon1_price          INTEGER,
  addon1_gst            INTEGER,
  addon1_total          INTEGER,
  addon1_default        BOOLEAN DEFAULT false,
  -- Addon 2 (5 cols)
  addon2_label          TEXT,
  addon2_price          INTEGER,
  addon2_gst            INTEGER,
  addon2_total          INTEGER,
  addon2_default        BOOLEAN DEFAULT false,
  -- Publishing (4 cols)
  publish_stage         TEXT DEFAULT 'DRAFT' CHECK (publish_stage IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  published_at          TIMESTAMPTZ,
  published_by          UUID,
  is_popular            BOOLEAN DEFAULT false,
  -- Meta
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cat_pricing IS 'Flat pricing table — 1 row per SKU per state. Renamed from cat_price_mh for multi-state readiness.';

-- ─── Unique: 1 price per SKU per state ─────────────────────────────────────
CREATE UNIQUE INDEX uq_cat_pricing_sku_state
  ON cat_pricing (sku_id, state_code);
CREATE INDEX ix_cat_pricing_publish_stage
  ON cat_pricing (publish_stage);

-- ─── On-road price must be >= ex-showroom ──────────────────────────────────
ALTER TABLE cat_pricing
ADD CONSTRAINT chk_cat_pricing_on_road_gte_ex
CHECK (on_road_price >= ex_showroom);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8️⃣ cat_suitable_for — Suitable For (Cascading Brand→Model→Variant)
-- ─────────────────────────────────────────────────────────────────────────────
-- No rows for a SKU = UNIVERSAL (fits all vehicles)
-- Studio UI: Review tab → "Suitable For: [Brand ▼] [Model ▼] [Variant ▼]"

CREATE TABLE IF NOT EXISTS cat_suitable_for (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id            UUID NOT NULL REFERENCES cat_skus(id) ON DELETE CASCADE,
  target_brand_id   UUID REFERENCES cat_brands(id),   -- NULL = all brands
  target_model_id   UUID REFERENCES cat_models(id),    -- NULL = all models under brand
  target_variant_id UUID,                              -- NULL = all variants under model
  created_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cat_suitable_for IS 'Suitable For — cascading Brand→Model→Variant with ALL defaults. No rows = universal.';


-- Prevent duplicate compatibility entries (NULLs need COALESCE for uniqueness)
CREATE UNIQUE INDEX uq_cat_suitable_for_entry
  ON cat_suitable_for (
    sku_id,
    COALESCE(target_brand_id, '00000000-0000-0000-0000-000000000000'),
    COALESCE(target_model_id, '00000000-0000-0000-0000-000000000000'),
    COALESCE(target_variant_id, '00000000-0000-0000-0000-000000000000')
  );

-- Lookup: all compatibility entries for a given SKU
CREATE INDEX ix_cat_suitable_for_sku
  ON cat_suitable_for (sku_id);

-- Reverse lookup: which accessories fit a given model/brand
CREATE INDEX ix_cat_suitable_for_target_model
  ON cat_suitable_for (target_model_id) WHERE target_model_id IS NOT NULL;
CREATE INDEX ix_cat_suitable_for_target_brand
  ON cat_suitable_for (target_brand_id) WHERE target_brand_id IS NOT NULL;

-- ─── Hierarchy guard: model must belong to brand ───────────────────────────
ALTER TABLE cat_suitable_for
ADD CONSTRAINT chk_cat_suitable_for_hierarchy
CHECK (
  -- If model is set, brand must be set too
  (target_model_id IS NULL OR target_brand_id IS NOT NULL) AND
  -- If variant is set, model must be set too
  (target_variant_id IS NULL OR target_model_id IS NOT NULL)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9️⃣ ALTER cat_brands — Drop JSONB columns (data must be migrated first!)
-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: Only uncomment AFTER Phase 2 migration + Phase 3 verification
-- ALTER TABLE cat_brands DROP COLUMN IF EXISTS brand_logos;
-- ALTER TABLE cat_brands DROP COLUMN IF EXISTS specifications;

-- ─────────────────────────────────────────────────────────────────────────────
-- 🔟 Enable RLS on all new tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE cat_specifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_models             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_variants_vehicle   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_variants_accessory ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_variants_service   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_skus               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_pricing            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_suitable_for      ENABLE ROW LEVEL SECURITY;

-- ─── Public read policies (catalog is public) ──────────────────────────────

CREATE POLICY "Allow public read cat_specifications"
  ON cat_specifications FOR SELECT USING (true);
CREATE POLICY "Allow public read cat_models"
  ON cat_models FOR SELECT USING (true);
CREATE POLICY "Allow public read cat_variants_vehicle"
  ON cat_variants_vehicle FOR SELECT USING (true);
CREATE POLICY "Allow public read cat_variants_accessory"
  ON cat_variants_accessory FOR SELECT USING (true);
CREATE POLICY "Allow public read cat_variants_service"
  ON cat_variants_service FOR SELECT USING (true);
CREATE POLICY "Allow public read cat_skus"
  ON cat_skus FOR SELECT USING (true);
CREATE POLICY "Allow public read cat_pricing"
  ON cat_pricing FOR SELECT USING (true);
CREATE POLICY "Allow public read cat_suitable_for"
  ON cat_suitable_for FOR SELECT USING (true);

COMMIT;
