# 🏗️ Catalog Normalization Migration Plan v2

> **Date:** 16 Feb 2026
> **Project:** BookMyBike (bookmy.bike)
> **Supabase Project:** aytdeqjxxjxbgiyslubx
> **Author:** Ajit × AI Assistant

---

## 🎯 GOAL

`cat_items` (self-referencing parent_id hierarchy) और `cat_skus_linear` (JSONB blobs) को **पूरी तरह normalized, flat-column tables** में बदलना —
ताकि हर field validated, indexed, और Supabase Table Editor से editable हो।

**`cat_specifications` registry** = Blueprint जो define करेगी कि कौन सी spec कहाँ, किस type, किस suffix, और किन allowed values के साथ exist करती है।
इससे future में कोई भी नई spec = 1 row add + 1 ALTER TABLE — कोई बड़ा migration नहीं।

### Success Criteria (Definition of Done)
1. Catalog read-path 100% normalized tables से serve हो (no runtime dependency on `cat_items` / `cat_skus_linear`).
2. Functional parity >= 99.5% (sampled PDP/pricing diff report captured).
3. `lint`, `typecheck`, `build` all pass after cutover.
4. Data-quality gates pass: FK orphan count = 0, enum violation = 0, required field null-rate < 0.5%.
5. Rollback drill once staging पर pass हो (flag rollback + archive rename-back simulation).

### Core Principles
1. **Zero JSONB** — पूरे catalog में कहीं भी JSONB नहीं
2. **`cat_specifications` = Master Blueprint** — हर spec इसमें registered, columns इसके हिसाब से
3. **Media सिर्फ SKU level पर** — Brand पर सिर्फ logo, बाकी कहीं नहीं
4. **कोई table DROP नहीं** — पहले migrate, test, verify, फिर archive (rename)
5. **Vehicle / Accessory / Service** — Variant stage से अलग tables
6. **Foreign Keys everywhere** — data integrity DB level पर enforce

### Explicit Non-Goals
1. CRM schema redesign
2. Dealer-pricing business logic redesign
3. UI redesign (only data-source migration + mapper simplification)

---

## 📈 EXPECTATIONS

### Migration के बाद क्या होगा:
| Before | After |
|--------|-------|
| `cat_items` — 1 table, 4 levels, JSONB specs | 8 focused tables, flat columns |
| `cat_skus_linear` — JSONB blobs (product_json, variant_json, unit_json) | Clean FK joins, no reconstruction needed |
| `price_mh` JSONB blob | `cat_price_mh` dedicated table, ~52 flat columns |
| No validation — garbage data possible | CHECK constraints, NOT NULL, FK integrity |
| No spec registry — typos possible, no allowed values | `cat_specifications` = tight blueprint, ENUM-like allowed_values |
| Complex TypeScript mappers (reconstructHierarchy, catalogMapper) | Simple Supabase `.select('*, variant:cat_variants_vehicle(*)')` |
| Catalog bugs (missing type, wrong bodyType) | Impossible — schema IS the contract |
| नई spec add करनी हो तो migration chaos | 1 row in cat_specifications + 1 ALTER TABLE — बस |

### Risk Mitigation:
- पुरानी tables **archive** होंगी (rename), DROP नहीं
- हर phase के बाद **verify** करेंगे
- Rollback possible रहेगा

---

## 📋 PHASE 1 — TABLE DEFINITIONS

---

### Table 1: `cat_specifications` 🆕 NEW TABLE ⭐ BLUEPRINT/REGISTRY

**Purpose:** Master registry/blueprint — हर spec का definition यहाँ registered।
ये table define करती है कि `cat_products`, `cat_variants_vehicle`, `cat_variants_accessory` में
कौन सा column होगा, उसका data type क्या है, suffix क्या है, required है कि नहीं,
और allowed values (ENUM) क्या हैं।

**सबसे पहले ये table बनेगी** — बाकी सब इसी की definition follow करेंगी।

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `spec_key` | TEXT | NO | — | Column name in target table, e.g. "engine_cc", "seat_height" — **UNIQUE** |
| `display_label` | TEXT | NO | — | UI display name: "Engine Capacity", "Seat Height" |
| `description` | TEXT | YES | — | Tooltip/help text: "Engine displacement" |
| — **Data Type Rules** | — | — | — | — |
| `data_type` | TEXT | NO | — | NUMBER \| TEXT \| ENUM \| BOOLEAN |
| `decimal_places` | INTEGER | YES | 0 | NUMBER type: 0 = integer, 1-2 = decimal |
| `suffix` | TEXT | YES | — | "cc", "mm", "kg", "kmpl", "L", "Nm", "KW" |
| — **Scope** | — | — | — | — |
| `spec_level` | TEXT | NO | — | PRODUCT \| VARIANT — किस table में ये column होगा |
| `applies_to` | TEXT | NO | 'VEHICLE' | VEHICLE \| ACCESSORY \| SERVICE \| ALL |
| — **Validation** | — | — | — | — |
| `is_required` | BOOLEAN | YES | false | Mandatory field? Product/Variant बिना इसके बनेगी ही नहीं |
| `allow_blank` | BOOLEAN | YES | true | शुरुआत में blank allow, बाद में tight करो |
| `min_value` | NUMERIC | YES | — | NUMBER type: minimum value |
| `max_value` | NUMERIC | YES | — | NUMBER type: maximum value |
| `allowed_values` | TEXT[] | YES | — | ENUM type: {"DIGITAL","ANALOG","SEMI_DIGITAL","TFT"} — इनमें से ही choose |
| — **Display Controls** | — | — | — | — |
| `display_group` | TEXT | YES | — | "ENGINE" \| "BRAKES" \| "DIMENSIONS" \| "FEATURES" \| "ELECTRICAL" |
| `display_order` | INTEGER | YES | 0 | Group के अंदर sort order |
| `show_in_comparison` | BOOLEAN | YES | true | Compare page पर दिखाना है? |
| `show_in_filter` | BOOLEAN | YES | false | Catalog filter sidebar में दिखाना है? |
| `show_on_pdp` | BOOLEAN | YES | true | Product detail page पर दिखाना है? |
| — **Metadata** | — | — | — | — |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: 21 columns. Zero JSONB. (TEXT[] is PostgreSQL native array, not JSONB)**

**DDL Guardrails (must-have):**
- `UNIQUE(spec_key, spec_level, applies_to)` (same key different scopes के लिए conflict नहीं)
- `CHECK (data_type IN ('NUMBER','TEXT','ENUM','BOOLEAN'))`
- `CHECK (spec_level IN ('PRODUCT','VARIANT'))`
- `CHECK (applies_to IN ('VEHICLE','ACCESSORY','SERVICE','ALL'))`
- `CHECK (decimal_places IS NULL OR decimal_places BETWEEN 0 AND 3)`
- `CHECK ((data_type='ENUM' AND allowed_values IS NOT NULL AND array_length(allowed_values,1) > 0) OR data_type<>'ENUM')`
- Indexes: `(spec_level, applies_to)`, `(show_in_filter, show_on_pdp, show_in_comparison)`

#### Seed Data — Product-Level Specs (5 specs, 4 REQUIRED)

| spec_key | display_label | data_type | decimal | suffix | level | required | allowed_values |
|----------|--------------|-----------|---------|--------|-------|----------|---------------|
| `product_type` | Product Type | ENUM | — | — | PRODUCT | ✅ YES | {VEHICLE, ACCESSORY, SERVICE} |
| `body_type` | Body Type | ENUM | — | — | PRODUCT | ✅ YES | {MOTORCYCLE, SCOOTER, MOPED, ELECTRIC} |
| `engine_cc` | Engine Capacity | NUMBER | 1 | cc | PRODUCT | ✅ YES | — |
| `fuel_type` | Fuel Type | ENUM | — | — | PRODUCT | ✅ YES | {PETROL, EV, CNG, DIESEL} |
| `emission_standard` | Emission Standard | ENUM | — | — | PRODUCT | ❌ NO | {BS4, BS6, BS6_STAGE2} |

> **🎯 Studio Simplification:** "Add Product" = name दो + `product_type` select करो (from registry) →
> type automatically decide करेगा कि variant कौन सी table use होगी (vehicle/accessory/service).
> Studio में एक step कम!

#### Seed Data — Vehicle Specs (VARIANT Level)

| spec_key | display_label | data_type | decimal | suffix | level | required | group | allowed_values | filter? |
|----------|--------------|-----------|---------|--------|-------|----------|-------|---------------|--------|
| **ENGINE** | | | | | | | | | |
| `engine_type` | Engine Type | TEXT | — | — | VARIANT | ❌ | ENGINE | — | ❌ |
| `displacement` | Displacement | NUMBER | 1 | cc | VARIANT | ❌ | ENGINE | — | ❌ |
| `max_power` | Max Power | TEXT | — | — | VARIANT | ❌ | ENGINE | — | ❌ |
| `max_torque` | Max Torque | TEXT | — | — | VARIANT | ❌ | ENGINE | — | ❌ |
| `num_valves` | Number of Valves | NUMBER | 0 | — | VARIANT | ❌ | ENGINE | — | ❌ |
| `transmission` | Transmission | ENUM | — | — | VARIANT | ❌ | ENGINE | {MANUAL, CVT_AUTOMATIC, AMT, DCT} | ✅ |
| `air_filter` | Air Filter | TEXT | — | — | VARIANT | ❌ | ENGINE | — | ❌ |
| `battery` | Battery | TEXT | — | — | VARIANT | ❌ | ELECTRICAL | — | ❌ |
| `mileage` | Mileage | NUMBER | 1 | kmpl | VARIANT | ❌ | ENGINE | — | ✅ |
| `start_type` | Starting Method | ENUM | — | — | VARIANT | ❌ | ENGINE | {KICK, ELECTRIC, KICK_ELECTRIC, SILENT_START} | ❌ |
| **BRAKES & SUSPENSION** | | | | | | | | | |
| `front_brake` | Front Brake | TEXT | — | — | VARIANT | ❌ | BRAKES | — | ❌ |
| `rear_brake` | Rear Brake | TEXT | — | — | VARIANT | ❌ | BRAKES | — | ❌ |
| `braking_system` | Braking System | ENUM | — | — | VARIANT | ❌ | BRAKES | {SBT, CBS, ABS, DUAL_ABS} | ✅ |
| `front_suspension` | Front Suspension | TEXT | — | — | VARIANT | ❌ | BRAKES | — | ❌ |
| `rear_suspension` | Rear Suspension | TEXT | — | — | VARIANT | ❌ | BRAKES | — | ❌ |
| **DIMENSIONS** | | | | | | | | | |
| `kerb_weight` | Kerb Weight | NUMBER | 0 | kg | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| `seat_height` | Seat Height | NUMBER | 0 | mm | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| `ground_clearance` | Ground Clearance | NUMBER | 0 | mm | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| `ground_reach` | Ground Reach | NUMBER | 0 | mm | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| `seat_length` | Seat Length | NUMBER | 0 | mm | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| `wheelbase` | Wheelbase | NUMBER | 0 | mm | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| `vehicle_length` | Length | NUMBER | 0 | mm | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| `vehicle_width` | Width | NUMBER | 0 | mm | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| `vehicle_height` | Height | NUMBER | 0 | mm | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| **FEATURES** | | | | | | | | | |
| `wheel_type` | Wheel Type | ENUM | — | — | VARIANT | ❌ | FEATURES | {ALLOY, SPOKE, TUBELESS_ALLOY} | ✅ |
| `tyre_front` | Front Tyre | TEXT | — | — | VARIANT | ❌ | FEATURES | — | ❌ |
| `tyre_rear` | Rear Tyre | TEXT | — | — | VARIANT | ❌ | FEATURES | — | ❌ |
| `headlamp` | Headlamp | ENUM | — | — | VARIANT | ❌ | ELECTRICAL | {HALOGEN, LED, PROJECTOR_LED} | ✅ |
| `tail_lamp` | Tail Lamp | ENUM | — | — | VARIANT | ❌ | ELECTRICAL | {BULB, LED} | ❌ |
| `console_type` | Console/Instrument | ENUM | — | — | VARIANT | ❌ | ELECTRICAL | {ANALOG, DIGITAL, SEMI_DIGITAL_ANALOG, DIGITAL_TFT} | ✅ |
| `fuel_capacity` | Fuel Tank Capacity | NUMBER | 1 | L | VARIANT | ❌ | DIMENSIONS | — | ❌ |
| `under_seat_storage` | Under-seat Storage | NUMBER | 0 | L | VARIANT | ❌ | FEATURES | — | ❌ |
| `front_leg_space` | Front Leg Space | TEXT | — | — | VARIANT | ❌ | FEATURES | — | ❌ |
| `glove_box` | Glove Box | BOOLEAN | — | — | VARIANT | ❌ | FEATURES | — | ❌ |
| `usb_charging` | USB Charging | BOOLEAN | — | — | VARIANT | ❌ | FEATURES | — | ❌ |
| `navigation` | Navigation/Bluetooth | ENUM | — | — | VARIANT | ❌ | ELECTRICAL | {NONE, BLUETOOTH, SMARTXONNECT, VOICE_ASSIST} | ❌ |

**कुल: 36 vehicle specs registered — 4 PRODUCT level, 32 VARIANT level**

#### Seed Data — Accessory Specs

| spec_key | display_label | data_type | suffix | level | required | allowed_values |
|----------|--------------|-----------|--------|-------|----------|---------------|
| `suitable_for` | Suitable For | TEXT | — | VARIANT | ❌ | — |
| `material` | Material | TEXT | — | VARIANT | ❌ | — |
| `weight` | Weight | NUMBER | gm | VARIANT | ❌ | — |
| `finish` | Finish | ENUM | — | VARIANT | ❌ | {GLOSS, MATTE, CHROME, CARBON} |

---

### Table 2: `cat_brands` ✅ ALREADY EXISTS (needs cleanup)

**Purpose:** Master brand registry
**Current Status:** EXISTS — 12 columns, has JSONB (brand_logos, specifications) जो हटाने हैं
**Row Count:** ~15 brands

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `name` | TEXT | NO | — | "HONDA", "TVS" |
| `slug` | TEXT | NO | — | "honda", "tvs" (UNIQUE) |
| `logo_url` | TEXT | YES | — | Single logo image URL — **only media on brand** |
| `logo_svg` | TEXT | YES | — | Inline SVG for fast rendering |
| `website_url` | TEXT | YES | — | Official brand website |
| `brand_category` | TEXT | YES | 'VEHICLE' | VEHICLE \| ACCESSORY \| SERVICE |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Columns to DROP:** `brand_logos` (JSONB), `specifications` (JSONB)
**Action:** ALTER TABLE — remove 2 JSONB columns
**Total: 10 columns. Zero JSONB.**

---

### Table 3: `cat_products` 🆕 NEW TABLE

**Purpose:** Product master (Jupiter, Splendor Plus, Activa)
**Source:** Extract from `cat_items WHERE type = 'PRODUCT'` + `cat_skus_linear.product_json`
**Expected Rows:** ~20 products
**Columns driven by:** `cat_specifications WHERE spec_level = 'PRODUCT'`

| Column | Type | Nullable | Default | Notes | Registry Ref |
|--------|------|----------|---------|-------|-------------|
| `id` | UUID | NO | gen_random_uuid() | PK | — |
| `brand_id` | UUID | NO | — | FK → cat_brands(id) | — |
| `name` | TEXT | NO | — | "Jupiter", "Splendor Plus" | — |
| `slug` | TEXT | NO | — | UNIQUE | — |
| `product_type` | TEXT | NO | 'VEHICLE' | VEHICLE \| ACCESSORY \| SERVICE | — |
| — **Specs from registry** | — | — | — | — | — |
| `body_type` | TEXT | NO | — | CHECK IN ('MOTORCYCLE','SCOOTER','MOPED','ELECTRIC') | ✅ `body_type` ENUM, REQUIRED |
| `engine_cc` | NUMERIC(6,1) | NO | — | CHECK (engine_cc > 0) | ✅ `engine_cc` NUMBER(1), REQUIRED |
| `fuel_type` | TEXT | NO | 'PETROL' | CHECK IN ('PETROL','EV','CNG','DIESEL') | ✅ `fuel_type` ENUM, REQUIRED |
| `emission_standard` | TEXT | YES | — | CHECK IN ('BS4','BS6','BS6_STAGE2') | ✅ `emission_standard` ENUM |
| — **Business** | — | — | — | — | — |
| `hsn_code` | TEXT | YES | — | GST HSN code | — |
| `item_tax_rate` | NUMERIC(4,2) | YES | 18 | GST rate | — |
| `position` | INTEGER | YES | 0 | Display order within brand | — |
| `status` | TEXT | YES | 'ACTIVE' | ACTIVE \| INACTIVE \| ARCHIVED | — |
| `created_at` | TIMESTAMPTZ | YES | now() | | — |
| `updated_at` | TIMESTAMPTZ | YES | now() | | — |

**Total: 16 columns. Zero JSONB. Product-level specs REQUIRED — product बिना engine_cc, body_type, fuel_type के बनेगा ही नहीं।**

---

### Table 4: `cat_variants_vehicle` 🆕 NEW TABLE

**Purpose:** Vehicle variant with ALL specs as flat columns — **हर column `cat_specifications` registry से driven**
**Source:** Extract from `cat_items WHERE type = 'VARIANT'` + `cat_skus_linear.variant_json` + `specs`
**Expected Rows:** ~43 vehicle variants

**Column types: registry में NUMBER → table में NUMERIC, ENUM → TEXT + CHECK, BOOLEAN → BOOLEAN**

| Column | Type | Nullable | Default | Notes | Registry: data_type(decimal) suffix |
|--------|------|----------|---------|-------|-------------------------------------|
| `id` | UUID | NO | gen_random_uuid() | PK | — |
| `product_id` | UUID | NO | — | FK → cat_products(id) | — |
| `name` | TEXT | NO | — | "Disc SmartXonnect" | — |
| `slug` | TEXT | YES | — | UNIQUE | — |
| `position` | INTEGER | YES | 0 | | — |
| `status` | TEXT | YES | 'ACTIVE' | | — |
| — **ENGINE** | — | — | — | — | — |
| `engine_type` | TEXT | YES | — | "Single Cylinder, 4-Stroke" | TEXT |
| `displacement` | NUMERIC(6,1) | YES | — | 113.3 (cc) | NUMBER(1) cc |
| `max_power` | TEXT | YES | — | "5.9 KW @ 6500 RPM" | TEXT |
| `max_torque` | TEXT | YES | — | "9.8 Nm @ 4500 RPM" | TEXT |
| `num_valves` | INTEGER | YES | — | 2 | NUMBER(0) |
| `transmission` | TEXT | YES | — | CHECK IN ('MANUAL','CVT_AUTOMATIC','AMT','DCT') | ENUM |
| `air_filter` | TEXT | YES | — | "Viscous Paper Type" | TEXT |
| `battery` | TEXT | YES | — | "12V, 5Ah MF" | TEXT |
| `mileage` | NUMERIC(5,1) | YES | — | 57.0 (kmpl) | NUMBER(1) kmpl |
| `start_type` | TEXT | YES | — | CHECK IN ('KICK','ELECTRIC','KICK_ELECTRIC','SILENT_START') | ENUM |
| — **BRAKES & SUSPENSION** | — | — | — | — | — |
| `front_brake` | TEXT | YES | — | "Disc, 220mm" | TEXT |
| `rear_brake` | TEXT | YES | — | "Drum, 130mm" | TEXT |
| `braking_system` | TEXT | YES | — | CHECK IN ('SBT','CBS','ABS','DUAL_ABS') | ENUM |
| `front_suspension` | TEXT | YES | — | "Telescopic Hydraulic" | TEXT |
| `rear_suspension` | TEXT | YES | — | "Twin Tube Emulsion SPA" | TEXT |
| — **DIMENSIONS** | — | — | — | — | — |
| `kerb_weight` | INTEGER | YES | — | 106 (kg) | NUMBER(0) kg |
| `seat_height` | INTEGER | YES | — | 770 (mm) | NUMBER(0) mm |
| `ground_clearance` | INTEGER | YES | — | 163 (mm) | NUMBER(0) mm |
| `ground_reach` | INTEGER | YES | — | — (mm) | NUMBER(0) mm |
| `seat_length` | INTEGER | YES | — | — (mm) | NUMBER(0) mm |
| `wheelbase` | INTEGER | YES | — | 1275 (mm) | NUMBER(0) mm |
| `vehicle_length` | INTEGER | YES | — | 1848 (mm) | NUMBER(0) mm |
| `vehicle_width` | INTEGER | YES | — | 665 (mm) | NUMBER(0) mm |
| `vehicle_height` | INTEGER | YES | — | 1158 (mm) | NUMBER(0) mm |
| — **FEATURES** | — | — | — | — | — |
| `wheel_type` | TEXT | YES | — | CHECK IN ('ALLOY','SPOKE','TUBELESS_ALLOY') | ENUM |
| `tyre_front` | TEXT | YES | — | "90/90-12" | TEXT |
| `tyre_rear` | TEXT | YES | — | "90/90-10" | TEXT |
| `headlamp` | TEXT | YES | — | CHECK IN ('HALOGEN','LED','PROJECTOR_LED') | ENUM |
| `tail_lamp` | TEXT | YES | — | CHECK IN ('BULB','LED') | ENUM |
| `console_type` | TEXT | YES | — | CHECK IN ('ANALOG','DIGITAL','SEMI_DIGITAL_ANALOG','DIGITAL_TFT') | ENUM |
| `fuel_capacity` | NUMERIC(4,1) | YES | — | 5.1 (L) | NUMBER(1) L |
| `under_seat_storage` | INTEGER | YES | — | 33 (L) | NUMBER(0) L |
| `front_leg_space` | TEXT | YES | — | | TEXT |
| `glove_box` | BOOLEAN | YES | — | | BOOLEAN |
| `usb_charging` | BOOLEAN | YES | — | | BOOLEAN |
| `navigation` | TEXT | YES | — | CHECK IN ('NONE','BLUETOOTH','SMARTXONNECT','VOICE_ASSIST') | ENUM |
| — **Metadata** | — | — | — | — | — |
| `created_at` | TIMESTAMPTZ | YES | now() | | — |
| `updated_at` | TIMESTAMPTZ | YES | now() | | — |

**Total: ~44 columns. Zero JSONB.
NUMBER specs → NUMERIC/INTEGER (queryable, sortable, filterable natively).
ENUM specs → TEXT + CHECK constraint (typo impossible).
Value + suffix अलग stored — code suffix registry से pick करेगा।**

---

### Table 5: `cat_variants_accessory` 🆕 NEW TABLE

**Purpose:** Accessory variant specs
**Source:** Extract from `cat_items WHERE type = 'VARIANT' AND category = 'ACCESSORY'`
**Expected Rows:** ~36 accessory variants

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `product_id` | UUID | NO | — | FK → cat_products(id) |
| `name` | TEXT | NO | — | "Floor Mat Standard" |
| `slug` | TEXT | YES | — | UNIQUE |
| `position` | INTEGER | YES | 0 | |
| `status` | TEXT | YES | 'ACTIVE' | |
| `suitable_for` | TEXT | YES | — | "Jupiter, Activa" |
| `material` | TEXT | YES | — | |
| `weight` | INTEGER | YES | — | grams |
| `finish` | TEXT | YES | — | CHECK IN ('GLOSS','MATTE','CHROME','CARBON') |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: 12 columns. Zero JSONB.**

---

### Table 6: `cat_variants_service` 🆕 NEW TABLE (Future-ready)

**Purpose:** Service variant specs
**Expected Rows:** ~0 currently, future use

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `product_id` | UUID | NO | — | FK → cat_products(id) |
| `name` | TEXT | NO | — | "Extended Warranty 2Y" |
| `slug` | TEXT | YES | — | UNIQUE |
| `position` | INTEGER | YES | 0 | |
| `status` | TEXT | YES | 'ACTIVE' | |
| `duration_months` | INTEGER | YES | — | |
| `coverage_type` | TEXT | YES | — | CHECK IN ('COMPREHENSIVE','THIRD_PARTY') |
| `labor_included` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: 11 columns. Zero JSONB.**

---

### Table 7: `cat_skus` 🆕 NEW TABLE (Unified SKU + Media)

**Purpose:** Final purchasable unit — सारी media ONLY यहीं। Color identity + images + videos सब यहाँ।
**Source:** Extract from `cat_items WHERE type IN ('COLOR_DEF', 'SKU')` + `cat_skus_linear.unit_json`
**Expected Rows:** ~247 SKUs
**Media Rule:** सारी media ONLY इस table पर। Brand पर सिर्फ logo, बाकी कहीं नहीं।

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `sku_code` | TEXT | NO | — | UNIQUE, human-readable code |
| `sku_type` | TEXT | NO | 'VEHICLE' | VEHICLE \| ACCESSORY \| SERVICE |
| — **Foreign Keys** | — | — | — | — |
| `brand_id` | UUID | NO | — | FK → cat_brands(id) |
| `product_id` | UUID | NO | — | FK → cat_products(id) |
| `vehicle_variant_id` | UUID | YES | — | FK → cat_variants_vehicle(id) — filled when sku_type=VEHICLE |
| `accessory_variant_id` | UUID | YES | — | FK → cat_variants_accessory(id) — filled when sku_type=ACCESSORY |
| `service_variant_id` | UUID | YES | — | FK → cat_variants_service(id) — filled when sku_type=SERVICE |
| — **Identity** | — | — | — | — |
| `name` | TEXT | NO | — | "Starlight Blue Gloss" |
| `slug` | TEXT | YES | — | UNIQUE |
| `status` | TEXT | YES | 'ACTIVE' | ACTIVE \| INACTIVE \| ARCHIVED |
| `position` | INTEGER | YES | 0 | |
| `is_primary` | BOOLEAN | YES | false | Primary display SKU for variant |
| `price_base` | NUMERIC | YES | 0 | Base ex-showroom before state pricing |
| — **Color Identity** | — | — | — | — |
| `hex_primary` | TEXT | YES | — | "#1A3F8C" |
| `hex_secondary` | TEXT | YES | — | "#C0C0C0" |
| `color_name` | TEXT | YES | — | "Starlight Blue" |
| `finish` | TEXT | YES | — | CHECK IN ('GLOSS','MATTE','METALLIC','CHROME') |
| — **Media (ONLY HERE — nowhere else)** | — | — | — | — |
| `primary_image` | TEXT | YES | — | Main product image URL |
| `gallery_img_1` | TEXT | YES | — | Gallery image 1 |
| `gallery_img_2` | TEXT | YES | — | Gallery image 2 |
| `gallery_img_3` | TEXT | YES | — | Gallery image 3 |
| `gallery_img_4` | TEXT | YES | — | Gallery image 4 |
| `gallery_img_5` | TEXT | YES | — | Gallery image 5 |
| `gallery_img_6` | TEXT | YES | — | Gallery image 6 |
| `video_url_1` | TEXT | YES | — | Video URL 1 |
| `video_url_2` | TEXT | YES | — | Video URL 2 |
| `pdf_url_1` | TEXT | YES | — | Brochure/spec PDF |
| `has_360` | BOOLEAN | YES | false | 360° view available? |
| — **Display Controls** | — | — | — | — |
| `zoom_factor` | NUMERIC(3,2) | YES | 1.0 | Image zoom normalization |
| `is_flipped` | BOOLEAN | YES | false | Mirror image? |
| `offset_x` | INTEGER | YES | 0 | Image X offset |
| `offset_y` | INTEGER | YES | 0 | Image Y offset |
| — **Shareable Media** | — | — | — | — |
| `media_shared` | BOOLEAN | YES | false | true → इस SKU की media variant की सारी SKUs को apply |
| — **Metadata** | — | — | — | — |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: ~38 columns. Zero JSONB.**

---

### Table 8: `cat_price_mh` 🆕 NEW TABLE (Zero JSONB Pricing)

**Purpose:** Maharashtra state pricing — every field a flat column
**Source:** Extract from `cat_skus_linear.price_mh`
**Expected Rows:** ~144 (one per vehicle SKU)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `sku_id` | UUID | NO | — | FK → cat_skus(id), UNIQUE |
| — **Core Pricing** | — | — | — | — |
| `ex_showroom` | INTEGER | NO | — | CHECK (ex_showroom > 0) |
| `on_road_price` | INTEGER | NO | — | CHECK (on_road_price >= ex_showroom) |
| `gst_rate` | NUMERIC(4,2) | YES | 0.18 | |
| `hsn_code` | TEXT | YES | — | |
| — **RTO — STATE** | — | — | — | — |
| `rto_total` | INTEGER | NO | 0 | Grand total of selected RTO type |
| `rto_default_type` | TEXT | YES | 'STATE' | STATE \| BH \| COMPANY |
| `rto_state_road_tax` | INTEGER | YES | 0 | |
| `rto_state_cess` | INTEGER | YES | 0 | |
| `rto_state_postal` | INTEGER | YES | 70 | |
| `rto_state_smart_card` | INTEGER | YES | 200 | |
| `rto_state_registration` | INTEGER | YES | 300 | |
| `rto_state_total` | INTEGER | YES | 0 | |
| — **RTO — BH** | — | — | — | — |
| `rto_bh_road_tax` | INTEGER | YES | 0 | |
| `rto_bh_cess` | INTEGER | YES | 0 | |
| `rto_bh_postal` | INTEGER | YES | 70 | |
| `rto_bh_smart_card` | INTEGER | YES | 200 | |
| `rto_bh_registration` | INTEGER | YES | 300 | |
| `rto_bh_total` | INTEGER | YES | 0 | |
| — **RTO — COMPANY** | — | — | — | — |
| `rto_company_road_tax` | INTEGER | YES | 0 | |
| `rto_company_cess` | INTEGER | YES | 0 | |
| `rto_company_postal` | INTEGER | YES | 70 | |
| `rto_company_smart_card` | INTEGER | YES | 200 | |
| `rto_company_registration` | INTEGER | YES | 300 | |
| `rto_company_total` | INTEGER | YES | 0 | |
| — **Insurance — OD** | — | — | — | — |
| `ins_od_base` | INTEGER | YES | 0 | |
| `ins_od_gst` | INTEGER | YES | 0 | |
| `ins_od_total` | INTEGER | YES | 0 | |
| — **Insurance — TP** | — | — | — | — |
| `ins_tp_base` | INTEGER | YES | 0 | |
| `ins_tp_gst` | INTEGER | YES | 0 | |
| `ins_tp_total` | INTEGER | YES | 0 | |
| — **Insurance — PA & Totals** | — | — | — | — |
| `ins_pa` | INTEGER | YES | 0 | |
| `ins_gst_total` | INTEGER | YES | 0 | |
| `ins_gst_rate` | INTEGER | YES | 18 | |
| `ins_base_total` | INTEGER | YES | 0 | |
| `ins_net_premium` | INTEGER | YES | 0 | |
| `ins_total` | INTEGER | NO | 0 | Grand total insurance |
| — **Addon 1 (Zero Depreciation)** | — | — | — | — |
| `addon1_label` | TEXT | YES | 'Zero Depreciation' | |
| `addon1_price` | INTEGER | YES | 0 | |
| `addon1_gst` | INTEGER | YES | 0 | |
| `addon1_total` | INTEGER | YES | 0 | |
| `addon1_default` | BOOLEAN | YES | false | |
| — **Addon 2 (PA Cover)** | — | — | — | — |
| `addon2_label` | TEXT | YES | 'Personal Accident Cover' | |
| `addon2_price` | INTEGER | YES | 0 | |
| `addon2_gst` | INTEGER | YES | 0 | |
| `addon2_total` | INTEGER | YES | 0 | |
| `addon2_default` | BOOLEAN | YES | false | |
| — **Publishing** | — | — | — | — |
| `publish_stage` | TEXT | YES | 'DRAFT' | CHECK IN ('DRAFT','PUBLISHED','ARCHIVED') |
| `published_at` | TIMESTAMPTZ | YES | — | |
| `published_by` | UUID | YES | — | |
| `is_popular` | BOOLEAN | YES | false | |
| — **Metadata** | — | — | — | — |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: ~52 columns. ZERO JSONB.**

---

## 📊 PHASE 2 — CURRENT TABLE STATUS

### Tables जो EXIST करती हैं:

| Table | Status | Action |
|-------|--------|--------|
| `cat_brands` | ✅ EXISTS — 12 cols | 🔧 REFACTOR: DROP `brand_logos` (JSONB), `specifications` (JSONB) |
| `cat_items` | ✅ EXISTS — 29 cols | 📦 ARCHIVE: Data extract → new tables, rename to `_v1_archive` |
| `cat_skus_linear` | ✅ EXISTS — 23 cols | 📦 ARCHIVE: Data extract → new tables, rename to `_v1_archive` |
| `cat_spec_schema` | ✅ EXISTS — 13 cols | 🔄 REPLACE: `cat_specifications` replaces this as the master registry |
| `cat_assets` | ✅ EXISTS — 13 cols | 📦 ARCHIVE: Media now on cat_skus, rename to `_v1_archive` |
| `cat_hsn_codes` | ✅ EXISTS — 11 cols | ✅ KEEP AS-IS |
| `cat_ins_rules` | ✅ EXISTS — 17 cols | ✅ KEEP AS-IS |
| `cat_reg_rules` | ✅ EXISTS — 14 cols | ✅ KEEP AS-IS |
| `cat_regional_configs` | ✅ EXISTS — 8 cols | ✅ KEEP AS-IS |
| `cat_price_dealer` | ✅ EXISTS — 17 cols | ✅ KEEP AS-IS |
| `cat_services` | ✅ EXISTS — 11 cols | 🔎 EVALUATE: May merge into cat_variants_service |
| `cat_item_compatibility` | ✅ EXISTS — 7 cols | ✅ KEEP AS-IS |
| `cat_item_ingestion_sources` | ✅ EXISTS — 7 cols | ✅ KEEP AS-IS |
| `cat_recommendations` | ✅ EXISTS — 5 cols | ✅ KEEP AS-IS |
| `cat_raw_items` | ✅ EXISTS — 17 cols | ✅ KEEP AS-IS |
| `cat_price_state_archive` | ✅ EXISTS — 25 cols | ✅ KEEP AS-IS (already archived) |
| `catalog_audit_log` | ✅ EXISTS — 10 cols | ✅ KEEP AS-IS |

### Tables जो CREATE करनी हैं:

| Table | Status | Depends On |
|-------|--------|-----------|
| `cat_specifications` | 🆕 CREATE (FIRST) | None — ये सबसे पहले |
| `cat_products` | 🆕 CREATE | cat_brands |
| `cat_variants_vehicle` | 🆕 CREATE | cat_products |
| `cat_variants_accessory` | 🆕 CREATE | cat_products |
| `cat_variants_service` | 🆕 CREATE | cat_products |
| `cat_skus` | 🆕 CREATE | cat_brands, cat_products, cat_variants_* |
| `cat_price_mh` | 🆕 CREATE | cat_skus |

---

## 🔄 PHASE 3 — EXECUTION PLAN (Phase-by-Phase)

### Phase 0: Preflight (Mandatory before schema change)
```
1. DB backup snapshot + dry run on staging clone
2. Introduce feature flag for read path (old/new)
3. Baseline report: row counts, null rates, sampled pricing parity
4. Plan write-freeze window for final cutover backfill
```
**Risk:** LOW, but mandatory for safe cutover

### Phase 3.1: Create Empty Tables (Schema Only)
```
1. CREATE cat_specifications (blueprint — सबसे पहले)
2. SEED cat_specifications with 40 spec definitions
3. CREATE cat_products
4. CREATE cat_variants_vehicle (columns match registry)
5. CREATE cat_variants_accessory
6. CREATE cat_variants_service
7. CREATE cat_skus
8. CREATE cat_price_mh
9. ALTER cat_brands — DROP JSONB columns
```
**Risk:** ZERO — सिर्फ empty tables बन रही हैं, कुछ तूट नहीं सकता

### Phase 3.2: Migrate Data (INSERT from old tables)
```
1. INSERT INTO cat_products FROM cat_items/cat_skus_linear
2. INSERT INTO cat_variants_vehicle FROM cat_items/cat_skus_linear
3. INSERT INTO cat_variants_accessory FROM cat_items/cat_skus_linear
4. INSERT INTO cat_skus FROM cat_items/cat_skus_linear
5. INSERT INTO cat_price_mh FROM cat_skus_linear.price_mh (JSONB → flat columns)
6. Save migration audit map (source_id, target_id, checksum)
```
**Risk:** LOW — old tables अभी भी exist करती हैं, app old tables से पढ़ रहा है

### Phase 3.3: Verify Data Integrity
```
1. Row count matching — old vs new
2. Price calculation verification — JSONB totals vs flat column totals
3. FK integrity — सारे references valid
4. Required field check — cat_specifications.is_required = true वाले fields भरे हैं?
5. ENUM validation — allowed_values से match करते हैं?
6. Uniqueness checks — product/variant slug uniqueness + sku_code uniqueness
7. Price invariants — on_road_price >= ex_showroom
```

### Phase 3.4: Update Application Code
```
1. catalogFetcher.ts — new tables से read (simple JOINs)
2. SystemCatalogLogic.ts — new tables से read
3. catalogMapper.ts — simplify drastically (no more reconstructHierarchy)
4. savePrices.ts — cat_price_mh table को write
5. Admin catalog pages — new tables
6. TypeScript types regenerate (supabase gen types)
7. One-release dual-read comparator logs (payload hash drift monitor)
```
**Risk:** MEDIUM — यहाँ सबसे ज़्यादा ध्यान लगेगा

### Phase 3.5: Test Everything
```
1. Marketplace catalog page — सारे 12+ products दिखें
2. PDP pages — pricing, colors, specs सब correct
3. CRM quote creation — SKU selection, pricing
4. Admin pricing studio — save/publish flow
5. Dossier/PDF generation — pricing breakdown
6. Filters — bodyType, braking_system, wheel_type, headlamp etc.
7. Compare page — specs side by side from registry
```

### Phase 3.6: Archive Old Tables (Rename, NOT Drop)
```
1. ALTER TABLE cat_items RENAME TO cat_items_v1_archive
2. ALTER TABLE cat_skus_linear RENAME TO cat_skus_linear_v1_archive
3. ALTER TABLE cat_assets RENAME TO cat_assets_v1_archive
4. ALTER TABLE cat_spec_schema RENAME TO cat_spec_schema_v1_archive
```
**DROP कभी नहीं — सिर्फ rename**

### Phase 3.7: Post-Cutover Stabilization
```
1. 72-hour monitoring: error rate, latency, parity drift logs
2. If stable, disable comparator and keep archives as read-only fallback
3. Publish migration report with parity score + known deviations
```

---

## 📊 Final Table Summary

| # | Table | Columns | JSONB | Status | Media |
|---|-------|---------|-------|--------|-------|
| 1 | cat_specifications | 21 | ❌ | 🆕 Create (FIRST) | ❌ None |
| 2 | cat_brands | 10 | ❌ | 🔧 Refactor | Logo only |
| 3 | cat_products | 16 | ❌ | 🆕 Create | ❌ None |
| 4 | cat_variants_vehicle | 44 | ❌ | 🆕 Create | ❌ None |
| 5 | cat_variants_accessory | 12 | ❌ | 🆕 Create | ❌ None |
| 6 | cat_variants_service | 11 | ❌ | 🆕 Create | ❌ None |
| 7 | cat_skus | 38 | ❌ | 🆕 Create | ✅ ALL media here |
| 8 | cat_price_mh | 52 | ❌ | 🆕 Create | ❌ None |
| **Total** | **8 tables** | **~204** | **Zero** | | |

---

## ⚠️ IMPORTANT RULES

1. **कोई JSONB नहीं** — पूरे catalog में कहीं भी (TEXT[] allowed, JSONB strictly not)
2. **`cat_specifications` = Single Source of Truth** — हर spec यहाँ registered
3. **Media सिर्फ cat_skus पर** — brand पर सिर्फ logo_url + logo_svg
4. **पुरानी tables DROP नहीं** — पहले rename to _v1_archive
5. **हर phase verify करो** — अगले phase पर तभी जाओ जब पिछला 100% verified
6. **cat_price_dealer, cat_ins_rules, cat_reg_rules** को मत छुओ — ये already ठीक हैं
7. **CRM tables मत छुओ** — वो Phase 2 (post-launch) में
8. **नई spec add करने का तरीका:**
   - Step 1: `INSERT INTO cat_specifications` (1 row)
   - Step 2: `ALTER TABLE cat_variants_vehicle ADD COLUMN xyz ...` (1 column)
   - Step 3: Seed/backfill data if available
   - Step 4: Supabase TypeScript types regenerate + impacted pages smoke test
   - **यह small migration है, लेकिन typed app में type sync mandatory है।**

---

## 🧮 Future-Proof Kaise?

### नई spec add करनी हो (Example: "Top Speed")
```sql
-- Step 1: Registry में register करो
INSERT INTO cat_specifications (spec_key, display_label, data_type, decimal_places, suffix, spec_level, applies_to, display_group, show_in_comparison, show_in_filter)
VALUES ('top_speed', 'Top Speed', 'NUMBER', 0, 'kmph', 'VARIANT', 'VEHICLE', 'ENGINE', true, true);

-- Step 2: Table में column add करो
ALTER TABLE cat_variants_vehicle ADD COLUMN top_speed INTEGER;

-- बस! 2 DB queries + type regeneration + smoke test
-- (comparison/filter page registry से read करते हैं — auto-detect)
```

### नई ENUM value add करनी हो (Example: console_type में "OLED" add)
```sql
-- Step 1: Registry में allowed_values update करो
UPDATE cat_specifications
SET allowed_values = array_append(allowed_values, 'OLED')
WHERE spec_key = 'console_type';

-- Step 2: CHECK constraint update करो
ALTER TABLE cat_variants_vehicle DROP CONSTRAINT chk_console_type;
ALTER TABLE cat_variants_vehicle ADD CONSTRAINT chk_console_type
  CHECK (console_type IN ('ANALOG','DIGITAL','SEMI_DIGITAL_ANALOG','DIGITAL_TFT','OLED'));

-- बस! Filter/Compare pages auto-detect from registry
```
