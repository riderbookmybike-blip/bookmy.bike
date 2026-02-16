# 🏗️ Catalog Normalization Plan v4.2

> 📅 16 Feb 2026 · BookMyBike · Supabase `aytdeqjxxjxbgiyslubx`
> 🔄 v4.2 — Locked decisions: parent-scoped slug, `cat_pricing` multi-state, `cat_suitable_for` Suitable For (cascading Brand→Model→Variant)

---

## 🎯 Goal

`cat_items` + `cat_skus_linear` (JSONB mess) → **9 clean, normalized tables** — Zero JSONB, सब flat columns, proper naming per product type.

## 🔍 Review Outcome (Tight)

### Must-fix changes added in this revision
1. Enforce `sku_type` ↔ variant FK integrity in `cat_skus` with CHECK constraints.
2. Add matrix-level uniqueness so duplicate SKUs cannot be created accidentally.
3. Add explicit unique/index strategy for slugs and parent ordering.
4. Add migration cutover/rollback checklist (counts + totals + parity checks before archive).
5. Clarify one ambiguity: no table DROP is allowed, but dropping obsolete columns is allowed only if data is fully migrated.

### 3 Decisions Confirmed ✅
| # | Question | Decision | Rationale |
|---|----------|----------|----------|
| 1 | Slug policy | **Parent-scoped** `(parent_id, slug)` unique | Same slug under different parents is valid ("disc" under Jupiter ≠ "disc" under Activa) |
| 2 | Pricing table | **Rename `cat_price_mh` → `cat_pricing`** + `state_code DEFAULT 'MH'`, unique `(sku_id, state_code)` | Single table scales to multi-state; avoids 15 identical tables |
| 3 | Suitable For | **`cat_suitable_for` junction table** — cascading Brand→Model→Variant with ALL defaults. No rows = UNIVERSAL | Proper relational model; enables reverse lookups ("which accessories fit Jupiter?"); Studio Review tab: Suitable For selector |

### Core Principles
1. **Zero JSONB** — पूरे catalog में कहीं भी
2. **`cat_specifications`** = Master Blueprint for all specs
3. **Media सिर्फ SKU level पर** — Brand पर सिर्फ logo
4. **कोई table DROP नहीं** — rename to `_v1_archive`
5. **SKU Matrix = universal** — Variant × SKU (all product types)
6. **7-step Studio flow** — same for all types, labels change dynamically
7. **“Suitable For” = single term** — vehicle compatibility managed via `cat_suitable_for` junction table. No "fitment", no "compatibility" word soup.
8. **No new JSONB anywhere** — project-wide freeze on new JSONB columns/functions.

## 🚫 JSONB Elimination Program (All Tables, Gradual)

### Policy (effective immediately)
1. New table/column में `JSONB` allowed नहीं.
2. Existing JSONB read allowed temporarily; write path must move to flat columns first.
3. Every JSONB column needs owner + removal phase tag.

### Phase A: Catalog first (in-flight)
1. `cat_skus_linear.specs`, `cat_skus_linear.price_mh` -> `cat_variants_*` + `cat_pricing` flat columns.
2. Remove legacy sync trigger/function after cutover.
3. Archive old catalog tables to `_v1_archive`.

### Phase B: Pricing/Rules modules
1. `cat_price_state` and related JSON structures -> normalized breakdown columns/tables.
2. RPC inputs currently taking `JSONB` -> typed params or staging table.

### Phase C: CRM/Operations modules
1. `commercials`, `vehicle_details`, `customer_details`, snapshot blobs -> structured tables.
2. Keep append-only audit tables if needed, but payload shape must be typed.

### Phase D: Remaining platform modules
1. Membership/analytics/metadata JSONB columns -> typed schema migration by domain.
2. Drop deprecated JSONB columns only after parity + backfill verification.

### Tracking SQL (run weekly)
```sql
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'jsonb'
ORDER BY table_name, column_name;
```

### 🔒 Canonical Naming Contract (DB + Code + UI)
1. **Use only:** `Brand -> Model -> Variant -> SKU`
2. **Do not use aliases:** `Product`, `Family`, `Unit`, `Color_Def`, `Fitment`, `Compatibility`
3. `product_type` stays only as technical enum (`VEHICLE|ACCESSORY|SERVICE`) for behavior, not naming.
4. Accessory/Service differences are handled by metadata (`sku_type`, `cat_suitable_for`) not by changing hierarchy terms.

### 📘 One-Word SOT Glossary (Project-wide)
1. `Brand` = brand entity
2. `Model` = second level item
3. `Variant` = third level item
4. `SKU` = purchasable unit
5. `Suitable For` = vehicle applicability

### ⛔ Banned Terms (use SOT only)
1. `Product` -> use `Model`
2. `Family` -> use `Model`
3. `Plan` / `Tier` (as hierarchy names) -> use `Variant` / `SKU`
4. `Fitment` / `Compatibility` -> use `Suitable For`
5. `Unit` / `Sub-Variant` / `Colour` / `Tier` / `Plan` (as hierarchy names) -> use **`SKU`**

> PR gate checklist: `docs/catalog_naming_sot_checklist.md`

### 📜 Migration Lineage (Old → New)

| Old (Active) | Rows | New (v4.2) | Status |
|-------------|------|------------|--------|
| `cat_items` (BRAND/TYPE/PRODUCT/VARIANT/UNIT/SKU) | 406 | `cat_models` + `cat_variants_*` + `cat_skus` | ⏳ Phase 2 |
| `cat_skus_linear` (flat + JSONB `specs`, `price_mh`) | 247 | `cat_skus` + `cat_pricing` (all flat columns) | ⏳ Phase 2 |
| `cat_item_compatibility` (FKs → `cat_items`, `is_universal` bool) | 2 | `cat_suitable_for` (FKs → `cat_skus`, NULL = ALL semantics) | 📦 Archive only (no transform) |
| `cat_price_state` → `cat_price_state_archive` | 188 | `cat_pricing` (flat, multi-state) | ✅ Archived |
| `cat_brands` | shared | `cat_brands` (same, JSONB cols to drop) | ✅ Shared |

> ⚠️ **App code currently uses old tables.** Phase 4 will update all code references.
> ⚠️ Old `supabase/migrations/` files are historical — they document the evolution. Do NOT edit/delete them.

---

## 🏷️ Naming Hierarchy — Final Decision

### ❌ Before: Naming Chaos

| Level | cat_items.type | Problem |
|-------|---------------|---------|
| 1 | BRAND | ✅ OK |
| 2 | TYPE | ❓ "TYPE" = confusing |
| 3 | PRODUCT | ❓ "Jupiter" is a Model, not generic "product" |
| 4 | VARIANT | ✅ OK for vehicles, wrong for accessories |
| 5 | UNIT / COLOR_DEF | ❓ "Blue Gloss" is a Colour, not "unit" |
| 6 | SKU | ✅ OK but matrix logic unclear |

### ✅ After: Single Naming (All Types)

**🏍️ VEHICLE:**
```
Brand → Model → Variant → SKU
TVS   → Jupiter → Disc SmartXonnect → Starlight Blue Gloss
                    (trim level)        (SKU name)
```

**🎒 ACCESSORY:**
```
Brand → Model → Variant → SKU
Studds → Helmet → Half Face → Blue
                   (style)     (colour/suitable-for)

Arihant → Crash Guard → Standard → Activa SKU
                          (variant) (vehicle suitability via cat_suitable_for)
```

**🔧 SERVICE:**
```
Brand → Model → Variant → SKU
BookMyBike → Extended Warranty → 2 Year Comprehensive → Platinum
                                  (coverage plan)        (pricing tier)
```

---

## 🧪 Why SKU Matrix Works For ALL Types

### The Universal Pattern: `Variant × SKU`

Every product type has 2 dimensions that combine to create unique purchasable items:

| Type | Example | Variant (Rows) | SKU (Columns) | SKU = Cell |
|------|---------|----------------|---------------|------------|
| **Vehicle** | TVS Jupiter | Disc, Drum, SmartXonnect | Starlight Blue, Coral Red | Disc × Starlight Blue |
| **Accessory (colours)** | Studds Helmet | Half Face, Full Face | Blue, Red, Purple | Half Face × Blue |
| **Accessory (suitable for)** | Arihant Crash Guard | Standard, Premium Silver | Activa, Jupiter, Fascino | Standard × Activa |
| **Service** | Extended Warranty | 2 Year Comprehensive, 1 Year Basic | Platinum, Gold, Silver | 2yr Comp × Platinum |

### Real-World Proof:

**Helmet Matrix:**
```
             Blue    Red    Purple   Black
Half Face     ✅      ✅      ✅       ✅     ← 4 SKUs, each tracked separately
Full Face     ✅      ❌      ✅       ✅     ← 3 SKUs
Open Face     ✅      ✅      ❌       ❌     ← 2 SKUs
                                             = 9 total SKUs
```

**Crash Guard Matrix:**
```
                 Activa   Activa125   Jupiter   Fascino   RayZR
Standard           ✅        ✅          ✅        ✅        ✅     ← 5 SKUs
Premium Silver     ✅        ❌          ✅        ❌        ❌     ← 2 SKUs
Premium Black      ✅        ✅          ✅        ✅        ❌     ← 4 SKUs
                                                                = 11 total SKUs
```

Each cell = separate physical product, separate inventory, separate price, separate part number.

---

## 📊 Studio Flow — Same 7 Steps, Labels Change

```
Step 1: Brand & Type     ← Select category + brand (merged step)
Step 2: [Model Level]    ← Dynamic label per type
Step 3: [Variant Level]  ← Dynamic label per type
Step 4: [Unit Level]     ← Dynamic label per type
Step 5: SKU Matrix       ← Variant × SKU grid (universal)
Step 6: Review
Step 7: Publish
```

| Step | Vehicle | Accessory | Service |
|------|---------|-----------|---------|
| 1 | Brand & Type | Brand & Type | Brand & Type |
| 2 | **Model** (Jupiter) | **Model** (Helmet) | **Model** (Warranty) |
| 3 | **Variant** (Disc, Drum) | **Variant** (Half Face, Full Face) | **Variant** (Gold, Silver) |
| 4 | **SKU** (Blue, Red) | **SKU** (Blue, Red / Activa) | **SKU** (1yr, 2yr) |
| 5 | SKU Matrix | SKU Matrix | SKU Matrix |
| 6 | Review | Review | Review |
| 7 | Publish | Publish | Publish |

> **Key:** Step 4 "Unit" dimension is flexible:
> - Vehicle → always colours (hex codes, finish)
> - Accessory → could be colours (helmet) OR vehicle-specific (crash guard, Suitable For via cat_suitable_for) OR sizes
> - Service → duration / coverage level

---

## 📋 8 Tables — Full Details

---

### 1️⃣ `cat_specifications` — Blueprint Registry ⭐

> **सबसे पहले बनेगी। बाकी सब tables इसकी definition follow करेंगी।**

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | |
| `spec_key` | TEXT UNIQUE | Column name → `"engine_cc"`, `"console_type"` |
| `display_label` | TEXT | UI label → `"Engine Capacity"`, `"Console Type"` |
| `description` | TEXT | Tooltip text |
| `data_type` | TEXT | `NUMBER` \| `TEXT` \| `ENUM` \| `BOOLEAN` |
| `decimal_places` | INTEGER | NUMBER → 0=int, 1=one decimal |
| `suffix` | TEXT | `"cc"`, `"mm"`, `"kg"`, `"kmpl"`, `"L"` |
| `spec_level` | TEXT | `MODEL` \| `VARIANT` — किस table में column |
| `applies_to` | TEXT | `VEHICLE` \| `ACCESSORY` \| `SERVICE` \| `ALL` |
| `is_required` | BOOLEAN | `true` → item बिना इसके बनेगा ही नहीं |
| `allow_blank` | BOOLEAN | शुरुआत में blank OK, बाद में tight करो |
| `min_value` | NUMERIC | NUMBER minimum |
| `max_value` | NUMERIC | NUMBER maximum |
| `allowed_values` | TEXT[] | ENUM → `{"DIGITAL","ANALOG","TFT"}` |
| `display_group` | TEXT | `"ENGINE"` \| `"BRAKES"` \| `"DIMENSIONS"` etc. |
| `display_order` | INTEGER | Sort within group |
| `show_in_comparison` | BOOLEAN | Compare page? |
| `show_in_filter` | BOOLEAN | Catalog sidebar filter? |
| `show_on_pdp` | BOOLEAN | Product detail page? |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**21 columns. Zero JSONB.**

#### Seed: Model-Level Specs (5 specs)

| spec_key | label | type | required | allowed_values |
|----------|-------|------|:--------:|----------------|
| `product_type` | Product Type | ENUM | ✅ | VEHICLE, ACCESSORY, SERVICE |
| `body_type` | Body Type | ENUM | ✅ | MOTORCYCLE, SCOOTER, MOPED, ELECTRIC |
| `engine_cc` | Engine CC | NUMBER(1) cc | ✅ | — |
| `fuel_type` | Fuel Type | ENUM | ✅ | PETROL, EV, CNG, DIESEL |
| `emission_standard` | Emission | ENUM | ❌ | BS4, BS6, BS6_STAGE2 |

#### Seed: Variant-Level Specs (32 vehicle specs)

**ENGINE:**
| spec_key | label | type | suffix | filter? | allowed_values |
|----------|-------|------|--------|:-------:|----------------|
| `engine_type` | Engine Type | TEXT | — | ❌ | — |
| `displacement` | Displacement | NUMBER(1) | cc | ❌ | — |
| `max_power` | Max Power | TEXT | — | ❌ | — |
| `max_torque` | Max Torque | TEXT | — | ❌ | — |
| `num_valves` | Valves | NUMBER(0) | — | ❌ | — |
| `transmission` | Transmission | ENUM | — | ✅ | MANUAL, CVT_AUTOMATIC, AMT, DCT |
| `air_filter` | Air Filter | TEXT | — | ❌ | — |
| `mileage` | Mileage | NUMBER(1) | kmpl | ✅ | — |
| `start_type` | Starting | ENUM | — | ❌ | KICK, ELECTRIC, KICK_ELECTRIC, SILENT_START |

**BRAKES:**
| spec_key | label | type | filter? | allowed_values |
|----------|-------|------|:-------:|----------------|
| `front_brake` | Front Brake | TEXT | ❌ | — |
| `rear_brake` | Rear Brake | TEXT | ❌ | — |
| `braking_system` | Braking | ENUM | ✅ | SBT, CBS, ABS, DUAL_ABS |
| `front_suspension` | Front Susp. | TEXT | ❌ | — |
| `rear_suspension` | Rear Susp. | TEXT | ❌ | — |

**DIMENSIONS:**
| spec_key | label | type | suffix |
|----------|-------|------|--------|
| `kerb_weight` | Kerb Weight | NUMBER(0) | kg |
| `seat_height` | Seat Height | NUMBER(0) | mm |
| `ground_clearance` | Ground Clearance | NUMBER(0) | mm |
| `ground_reach` | Ground Reach | NUMBER(0) | mm |
| `seat_length` | Seat Length | NUMBER(0) | mm |
| `wheelbase` | Wheelbase | NUMBER(0) | mm |
| `vehicle_length` | Length | NUMBER(0) | mm |
| `vehicle_width` | Width | NUMBER(0) | mm |
| `vehicle_height` | Height | NUMBER(0) | mm |
| `fuel_capacity` | Fuel Tank | NUMBER(1) | L |

**FEATURES:**
| spec_key | label | type | filter? | allowed_values |
|----------|-------|------|:-------:|----------------|
| `wheel_type` | Wheel Type | ENUM | ✅ | ALLOY, SPOKE, TUBELESS_ALLOY |
| `tyre_front` | Front Tyre | TEXT | ❌ | — |
| `tyre_rear` | Rear Tyre | TEXT | ❌ | — |
| `under_seat_storage` | Storage | NUMBER(0) | — | — |
| `front_leg_space` | Leg Space | TEXT | ❌ | — |
| `glove_box` | Glove Box | BOOLEAN | ❌ | — |

**ELECTRICAL:**
| spec_key | label | type | filter? | allowed_values |
|----------|-------|------|:-------:|----------------|
| `headlamp` | Headlamp | ENUM | ✅ | HALOGEN, LED, PROJECTOR_LED |
| `tail_lamp` | Tail Lamp | ENUM | ❌ | BULB, LED |
| `console_type` | Console | ENUM | ✅ | ANALOG, DIGITAL, SEMI_DIGITAL_ANALOG, DIGITAL_TFT |
| `battery` | Battery | TEXT | ❌ | — |
| `usb_charging` | USB Charging | BOOLEAN | ❌ | — |
| `navigation` | Navigation | ENUM | ❌ | NONE, BLUETOOTH, SMARTXONNECT, VOICE_ASSIST |

#### Seed: Accessory-Level Specs (4 specs)

| spec_key | label | type | applies_to | allowed_values |
|----------|-------|------|-----------|----------------|
| `suitable_for` | Suitable For | TEXT | ACCESSORY | — |
| `material` | Material | TEXT | ACCESSORY | — |
| `weight` | Weight | NUMBER(0) gm | ACCESSORY | — |
| `finish` | Finish | ENUM | ACCESSORY | GLOSS, MATTE, CHROME, CARBON |

---

### 2️⃣ `cat_brands` — 🔧 Cleanup (EXISTS)

> **2 JSONB columns हटाने हैं, बाकी table ठीक है।**

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | TEXT | "HONDA", "TVS" |
| `slug` | TEXT UNIQUE | "honda", "tvs" |
| `logo_url` | TEXT | **Only media on brand** |
| `logo_svg` | TEXT | Inline SVG |
| `website_url` | TEXT | |
| `brand_category` | TEXT | VEHICLE \| ACCESSORY \| SERVICE |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**DROP:** `brand_logos` (JSONB), `specifications` (JSONB)

---

### 3️⃣ `cat_models` 🆕 — Model Master (All Types)

> ⚠️ **Renamed from `cat_products`** → `cat_models`
> - Vehicle/Accessory/Service: all represented as **Model**

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `brand_id` | UUID FK → `cat_brands` | |
| `name` | TEXT NOT NULL | "Jupiter", "Crash Guard", "Extended Warranty" |
| `slug` | TEXT | Parent-scoped unique via index `(brand_id, product_type, slug)` |
| `product_type` | TEXT NOT NULL | VEHICLE \| ACCESSORY \| SERVICE — from registry |
| `body_type` | TEXT | MOTORCYCLE \| SCOOTER \| MOPED \| ELECTRIC |
| `engine_cc` | NUMERIC(6,1) | Vehicles only |
| `fuel_type` | TEXT | PETROL \| EV \| CNG |
| `emission_standard` | TEXT | BS4 \| BS6 \| BS6_STAGE2 |
| `hsn_code` | TEXT | GST HSN code |
| `item_tax_rate` | NUMERIC(4,2) | default 18 |
| `position` | INTEGER | Display order |
| `status` | TEXT | ACTIVE \| INACTIVE \| ARCHIVED |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**15 columns. Zero JSONB.**

---

### 4️⃣ `cat_variants_vehicle` 🆕 — Vehicle Variant + Flat Specs

> **हर column `cat_specifications` registry से driven.**
> NUMBER → NUMERIC/INTEGER, ENUM → TEXT + CHECK, value stored WITHOUT suffix.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `model_id` | UUID FK → `cat_models` | |
| `name` | TEXT NOT NULL | "Disc SmartXonnect" |
| `slug` | TEXT | Parent-scoped unique via index `(model_id, slug)` |
| `position` | INTEGER | |
| `status` | TEXT | |
| — **ENGINE** | — | — |
| `engine_type` | TEXT | "Single Cylinder, 4-Stroke" |
| `displacement` | NUMERIC(6,1) | 113.3 |
| `max_power` | TEXT | "5.9 KW @ 6500 RPM" |
| `max_torque` | TEXT | "9.8 Nm @ 4500 RPM" |
| `num_valves` | INTEGER | 2 |
| `transmission` | TEXT | CHECK IN (MANUAL, CVT_AUTOMATIC, AMT, DCT) |
| `air_filter` | TEXT | |
| `mileage` | NUMERIC(5,1) | 57.0 |
| `start_type` | TEXT | CHECK IN (KICK, ELECTRIC, ...) |
| — **BRAKES** | — | — |
| `front_brake` | TEXT | "Disc, 220mm" |
| `rear_brake` | TEXT | "Drum, 130mm" |
| `braking_system` | TEXT | CHECK IN (SBT, CBS, ABS, DUAL_ABS) |
| `front_suspension` | TEXT | |
| `rear_suspension` | TEXT | |
| — **DIMENSIONS** | — | — |
| `kerb_weight` | INTEGER | 106 (kg) |
| `seat_height` | INTEGER | 770 (mm) |
| `ground_clearance` | INTEGER | 163 (mm) |
| `ground_reach` | INTEGER | |
| `seat_length` | INTEGER | |
| `wheelbase` | INTEGER | 1275 (mm) |
| `vehicle_length` | INTEGER | 1848 |
| `vehicle_width` | INTEGER | 665 |
| `vehicle_height` | INTEGER | 1158 |
| `fuel_capacity` | NUMERIC(4,1) | 5.1 (L) |
| — **FEATURES** | — | — |
| `wheel_type` | TEXT | CHECK IN (ALLOY, SPOKE, TUBELESS_ALLOY) |
| `tyre_front` | TEXT | |
| `tyre_rear` | TEXT | |
| `under_seat_storage` | INTEGER | 33 (L) |
| `front_leg_space` | TEXT | |
| `glove_box` | BOOLEAN | |
| — **ELECTRICAL** | — | — |
| `headlamp` | TEXT | CHECK IN (HALOGEN, LED, PROJECTOR_LED) |
| `tail_lamp` | TEXT | CHECK IN (BULB, LED) |
| `console_type` | TEXT | CHECK IN (ANALOG, DIGITAL, ...) |
| `battery` | TEXT | |
| `usb_charging` | BOOLEAN | |
| `navigation` | TEXT | CHECK IN (NONE, BLUETOOTH, SMARTXONNECT, ...) |
| — **Meta** | — | — |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**44 columns. Zero JSONB.**

---

### 5️⃣ `cat_variants_accessory` 🆕

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `model_id` | UUID FK → `cat_models` | |
| `name` | TEXT NOT NULL | "Half Face" / "Standard" / "Premium Silver" |
| `slug` | TEXT | Parent-scoped unique via index `(model_id, slug)` |
| `position` | INTEGER | |
| `status` | TEXT | |
| `suitable_for` | TEXT | "Jupiter, Activa" — vehicle compat hint |
| `material` | TEXT | |
| `weight` | INTEGER | grams |
| `finish` | TEXT | CHECK IN (GLOSS, MATTE, CHROME, CARBON) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**12 columns. Zero JSONB.**

---

### 6️⃣ `cat_variants_service` 🆕 (Future)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `model_id` | UUID FK → `cat_models` | |
| `name` | TEXT NOT NULL | "2 Year Comprehensive" |
| `slug` | TEXT | Parent-scoped unique via index `(model_id, slug)` |
| `position` | INTEGER | |
| `status` | TEXT | |
| `duration_months` | INTEGER | |
| `coverage_type` | TEXT | CHECK IN (COMPREHENSIVE, THIRD_PARTY) |
| `labor_included` | BOOLEAN | default true |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**11 columns. Zero JSONB.**

---

### 7️⃣ `cat_skus` 🆕 — Final Purchasable Unit + ALL Media

> **Every cell in SKU Matrix = 1 row in this table.**
> **Each row = separate inventory, separate price, separate media.**
> Canonical name: **SKU** (all product types).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `sku_code` | TEXT UNIQUE | Human-readable code |
| `sku_type` | TEXT NOT NULL | VEHICLE \| ACCESSORY \| SERVICE |
| — **FKs** | — | — |
| `brand_id` | UUID FK → `cat_brands` | |
| `model_id` | UUID FK → `cat_models` | |
| `vehicle_variant_id` | UUID FK → `cat_variants_vehicle` | when VEHICLE |
| `accessory_variant_id` | UUID FK → `cat_variants_accessory` | when ACCESSORY |
| `service_variant_id` | UUID FK → `cat_variants_service` | when SERVICE |
| — **Identity** | — | — |
| `name` | TEXT NOT NULL | "Starlight Blue Gloss" / "Standard" / "Platinum" |
| `slug` | TEXT | Matrix uniqueness enforced by partial indexes on `(variant_id, slug)` |
| `status` | TEXT | ACTIVE \| INACTIVE \| ARCHIVED |
| `position` | INTEGER | |
| `is_primary` | BOOLEAN | Primary display for variant |
| `price_base` | NUMERIC | Base ex-showroom |
| — **Colour** (Vehicle + some Accessories) | — | — |
| `hex_primary` | TEXT | "#1A3F8C" |
| `hex_secondary` | TEXT | "#C0C0C0" |
| `color_name` | TEXT | "Starlight Blue" |
| `finish` | TEXT | CHECK IN (GLOSS, MATTE, METALLIC, CHROME) |
| — **Suitable For** | — | — |
| _(managed via `cat_suitable_for`)_ | — | See Table 9: cascading Brand→Model→Variant. No rows = UNIVERSAL |
| — **Media (ONLY HERE)** | — | — |
| `primary_image` | TEXT | Main image |
| `gallery_img_1` | TEXT | |
| `gallery_img_2` | TEXT | |
| `gallery_img_3` | TEXT | |
| `gallery_img_4` | TEXT | |
| `gallery_img_5` | TEXT | |
| `gallery_img_6` | TEXT | |
| `video_url_1` | TEXT | |
| `video_url_2` | TEXT | |
| `pdf_url_1` | TEXT | Brochure |
| `has_360` | BOOLEAN | |
| — **Display** | — | — |
| `zoom_factor` | NUMERIC(3,2) | default 1.0 |
| `is_flipped` | BOOLEAN | |
| `offset_x` | INTEGER | |
| `offset_y` | INTEGER | |
| `media_shared` | BOOLEAN | true = media shared across sibling SKUs |
| — **Meta** | — | — |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**37 columns. Zero JSONB.**

> 🆕 **Suitable For** = managed via `cat_suitable_for` junction table. No rows = UNIVERSAL. Cascading Brand→Model→Variant.

#### Required DB Constraints (Critical)

```sql
-- 1) Exactly one variant FK must be set based on sku_type
ALTER TABLE cat_skus
ADD CONSTRAINT chk_cat_skus_type_fk
CHECK (
  (sku_type = 'VEHICLE'   AND vehicle_variant_id   IS NOT NULL AND accessory_variant_id IS NULL AND service_variant_id IS NULL) OR
  (sku_type = 'ACCESSORY' AND accessory_variant_id IS NOT NULL AND vehicle_variant_id   IS NULL AND service_variant_id IS NULL) OR
  (sku_type = 'SERVICE'   AND service_variant_id   IS NOT NULL AND vehicle_variant_id   IS NULL AND accessory_variant_id IS NULL)
);

-- 2) Prevent duplicate matrix cells (same variant + same unit name)
CREATE UNIQUE INDEX uq_cat_skus_vehicle_cell
  ON cat_skus (vehicle_variant_id, slug) WHERE sku_type = 'VEHICLE';
CREATE UNIQUE INDEX uq_cat_skus_accessory_cell
  ON cat_skus (accessory_variant_id, slug) WHERE sku_type = 'ACCESSORY';
CREATE UNIQUE INDEX uq_cat_skus_service_cell
  ON cat_skus (service_variant_id, slug) WHERE sku_type = 'SERVICE';

-- 3) Suitable For = managed via cat_suitable_for (dedicated junction table, not inline columns)
-- See Table 9: cat_suitable_for — cascading Brand→Model→Variant with hierarchy guard
```

> Note: keep `slug` normalized/lowercased and generated deterministically from unit name.

---

### 8️⃣ `cat_pricing` 🆕 — Pricing (All Flat, Multi-State Ready)

> ⚠️ **Renamed from `cat_price_mh`** → `cat_pricing`
> - Added `state_code DEFAULT 'MH'` — same table works for all states
> - Unique on `(sku_id, state_code)` — 1 price per SKU per state
> - No need for `cat_price_ka`, `cat_price_dl` etc. — single table scales

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `sku_id` | UUID FK → `cat_skus` | |
| `state_code` | TEXT NOT NULL DEFAULT 'MH' | 'MH', 'KA', 'DL' etc. |
| — | — | **UNIQUE (sku_id, state_code)** |
| — **Core** | — | — |
| `ex_showroom` | INTEGER NOT NULL | CHECK > 0 |
| `on_road_price` | INTEGER NOT NULL | CHECK >= ex_showroom |
| `gst_rate` | NUMERIC(4,2) | default 0.18 |
| `hsn_code` | TEXT | |
| — **RTO STATE** | — | 6 columns |
| `rto_total` | INTEGER | |
| `rto_default_type` | TEXT | STATE \| BH \| COMPANY |
| `rto_state_road_tax` | INTEGER | |
| `rto_state_cess` | INTEGER | |
| `rto_state_postal` | INTEGER | |
| `rto_state_smart_card` | INTEGER | |
| `rto_state_registration` | INTEGER | |
| `rto_state_total` | INTEGER | |
| — **RTO BH** | — | 6 columns |
| `rto_bh_road_tax` | INTEGER | |
| `rto_bh_cess` | INTEGER | |
| `rto_bh_postal` | INTEGER | |
| `rto_bh_smart_card` | INTEGER | |
| `rto_bh_registration` | INTEGER | |
| `rto_bh_total` | INTEGER | |
| — **RTO COMPANY** | — | 6 columns |
| `rto_company_road_tax` | INTEGER | |
| `rto_company_cess` | INTEGER | |
| `rto_company_postal` | INTEGER | |
| `rto_company_smart_card` | INTEGER | |
| `rto_company_registration` | INTEGER | |
| `rto_company_total` | INTEGER | |
| — **Insurance OD** | — | 3 columns |
| `ins_od_base` | INTEGER | |
| `ins_od_gst` | INTEGER | |
| `ins_od_total` | INTEGER | |
| — **Insurance TP** | — | 3 columns |
| `ins_tp_base` | INTEGER | |
| `ins_tp_gst` | INTEGER | |
| `ins_tp_total` | INTEGER | |
| — **Insurance PA & Totals** | — | 5 columns |
| `ins_pa` | INTEGER | |
| `ins_gst_total` | INTEGER | |
| `ins_gst_rate` | INTEGER | |
| `ins_base_total` | INTEGER | |
| `ins_net_premium` | INTEGER | |
| `ins_total` | INTEGER NOT NULL | |
| — **Addon 1** | — | 5 columns |
| `addon1_label` | TEXT | "Zero Depreciation" |
| `addon1_price` | INTEGER | |
| `addon1_gst` | INTEGER | |
| `addon1_total` | INTEGER | |
| `addon1_default` | BOOLEAN | |
| — **Addon 2** | — | 5 columns |
| `addon2_label` | TEXT | "Personal Accident Cover" |
| `addon2_price` | INTEGER | |
| `addon2_gst` | INTEGER | |
| `addon2_total` | INTEGER | |
| `addon2_default` | BOOLEAN | |
| — **Publishing** | — | 4 columns |
| `publish_stage` | TEXT | CHECK IN (DRAFT, PUBLISHED, ARCHIVED) |
| `published_at` | TIMESTAMPTZ | |
| `published_by` | UUID | |
| `is_popular` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**53 columns. Zero JSONB.**

---

## 📊 Full Relationship Chain

```
cat_brands
  └── cat_models (brand_id FK)  — Brand → Model
        ├── cat_variants_vehicle (model_id FK)     — Model → Variant
        ├── cat_variants_accessory (model_id FK)   — Model → Variant
        └── cat_variants_service (model_id FK)     — Model → Variant
              └── cat_skus (brand_id + model_id + variant_id FKs)
                    │     Variant → SKU
                    │     ⬆ Each cell in SKU Matrix = 1 row here
                    └── cat_pricing (sku_id + state_code) — multi-state ready

cat_specifications ← standalone blueprint, defines columns + validation
```

**Example Trace — Crash Guard Standard for Activa:**
```
cat_brands         → Arihant (id: abc)
cat_models         → Crash Guard (brand_id: abc, product_type: ACCESSORY)
cat_variants_acc   → Standard (model_id: crash-guard-id)
cat_skus           → "Standard" (accessory_variant_id: standard-id)
cat_suitable_for  → Suitable For: TVS → Activa → ALL variants
cat_pricing        → ex_showroom: 850, state_code: 'MH' (sku_id: standard-sku-id)
```

**Example Trace — Studds Helmet Half Face Blue:**
```
cat_brands         → Studds (id: xyz)
cat_models         → Helmet (brand_id: xyz, product_type: ACCESSORY)
cat_variants_acc   → Half Face (model_id: helmet-id)
cat_skus           → "Blue" (accessory_variant_id: half-face-id, color_name: Blue, hex_primary: #0000FF)
cat_pricing        → ex_showroom: 1200, state_code: 'MH' (sku_id: blue-id)
```

---

## 🔗 Existing Tables — Status

| Table | Action | Why |
|-------|--------|-----|
| `cat_brands` | 🔧 Cleanup — DROP 2 JSONB cols | brand_logos, specifications |
| `cat_items` | 📦 Archive → `_v1_archive` | Replaced by cat_models + variants + skus |
| `cat_skus_linear` | 📦 Archive → `_v1_archive` | Replaced by normalized joins |
| `cat_assets` | 📦 Archive → `_v1_archive` | Media now on cat_skus |
| `cat_spec_schema` | 📦 Archive → `_v1_archive` | Replaced by cat_specifications |
| `cat_hsn_codes` | ✅ Keep | Reference table |
| `cat_ins_rules` | ✅ Keep | Insurance rule engine |
| `cat_reg_rules` | ✅ Keep | RTO rule engine |
| `cat_regional_configs` | ✅ Keep | Regional settings |
| `cat_price_dealer` | ✅ Keep | Dealer pricing |
| `cat_services` | 🔎 Evaluate | May merge into cat_variants_service |
| `cat_item_compatibility` | ✅ Keep | |
| `cat_item_ingestion_sources` | ✅ Keep | Source tracking |
| `cat_recommendations` | ✅ Keep | |
| `cat_raw_items` | ✅ Keep | Raw staging |

**⚠️ कोई table DROP नहीं — सिर्फ rename to `_v1_archive`**

---

## 🔄 Execution Plan

### Phase 1: Create Empty Tables _(Risk: ZERO)_ ✅ DONE
```
1. CREATE cat_specifications              ✅
2. SEED cat_specifications (36+ spec definitions)  ✅
3. CREATE cat_models                      ✅
4. CREATE cat_variants_vehicle            ✅
5. CREATE cat_variants_accessory          ✅
6. CREATE cat_variants_service            ✅
7. CREATE cat_skus                        ✅
8. CREATE cat_pricing (multi-state)       ✅
9. CREATE cat_suitable_for (Suitable For)✅
10. ALTER cat_brands — DROP 2 JSONB cols   ⏳
```

> ⚠️ **STALE DUPLICATE REMOVED** — See below for current execution plan.

---

## 📊 Final Summary

| # | Table | Cols | JSONB | Status | Hierarchy Level |
|---|-------|:----:|:-----:|--------|----------------|
| 1 | `cat_specifications` | 22 | ❌ | ✅ Created + Seeded (60 specs) | Blueprint |
| 2 | `cat_brands` | 10 | ❌ | 🔧 Existing | Brand |
| 3 | `cat_models` | 15 | ❌ | ✅ Created | Model |
| 4 | `cat_variants_vehicle` | 42 | ❌ | ✅ Created | Variant |
| 5 | `cat_variants_accessory` | 11 | ❌ | ✅ Created | Variant |
| 6 | `cat_variants_service` | 11 | ❌ | ✅ Created | Variant |
| 7 | `cat_skus` | 36 | ❌ | ✅ Created | SKU |
| 8 | `cat_pricing` | 55 | ❌ | ✅ Created | Pricing |
| 9 | `cat_suitable_for` | 6 | ❌ | ✅ Created | Suitable For |
| **Total** | **9 tables** | **~208** | **Zero** | | |

---

## 🔧 Code Constant — Hierarchy Labels (Canonical)

```typescript
// src/lib/constants/catalogLabels.ts
export const HIERARCHY_LABELS = {
  VEHICLE:   { model: 'Model', variant: 'Variant', sku: 'SKU' },
  ACCESSORY: { model: 'Model', variant: 'Variant', sku: 'SKU' },
  SERVICE:   { model: 'Model', variant: 'Variant', sku: 'SKU' },
} as const;

// Usage in Studio:
// const labels = HIERARCHY_LABELS[product_type];
// Step 2: <h2>Add {labels.model}</h2>     → "Add Model"
// Step 3: <h2>Add {labels.variant}</h2>   → "Add Variant"
// Step 4: <h2>Add {labels.sku}</h2>       → "Add SKU"
// Step 5: SKU Matrix                       → Variant × SKU
```

---

## ⚠️ Rules

1. **Zero JSONB** — पूरे catalog में कहीं भी
2. **`cat_specifications`** = Single Source of Truth for spec definitions
3. **Media सिर्फ `cat_skus`** पर — brand पर सिर्फ logo
4. **कोई DROP नहीं** — rename to `_v1_archive`
5. **Naming (strict):** Brand=Brand, Level2=Model, Level3=Variant, Level4=SKU
6. **Studio:** 3 entry points — Add Vehicle, Add Accessory, Add Service ✅ (DONE)
7. **SKU Matrix universal** — Variant × SKU (all types, all products)
8. **CRM tables मत छुओ** — post-launch
9. **cat_price_dealer, cat_ins_rules, cat_reg_rules** — already ठीक हैं
10. **Save is always allowed** — incomplete data = fine, status stays DRAFT
11. **Validation only on status transitions** — not on save

---

## 🚦 Product Lifecycle — 3-Stage Gate System

### Status Flow:
```
 ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
 │  DRAFT   │───▶│  ACTIVE  │───▶│ PUBLISHED │───▶│   LIVE   │
 └──────────┘    └──────────┘    └───────────┘    └──────────┘
      ↑               ↑               ↑                ↑
   Save (any)    Product Studio   Pricing Engine   Dealer Pricing
   no checks     all specs ✅     all prices ✅    offer exists ✅
```

### Stage 1: DRAFT → ACTIVE _(Product Studio — Review Step)_
> **Who:** Admin / Catalog Manager via **Product Studio**
> **Gate:** All required specs (`cat_specifications.is_required = true`) must be filled
> **What happens:** Model/Variant/SKU is visible for pricing, but NOT on marketplace

```
✅ ALLOW SAVE with missing specs (status stays DRAFT)
❌ BLOCK ACTIVATE if:
   - Model missing: engine_cc, cooling, fuel_system, emission_standard, mileage, fuel_capacity, transmission
   - Variant missing: max_power, max_torque, front_brake, rear_brake, braking_system, 
     headlamp, console_type, bluetooth, navigation, usb_charging, start_type, key_type, 
     led_drl, aho, front/rear suspension, front/rear tyre, tyre_type, wheel_type,
     kerb_weight, ground_clearance, seat_height, gearbox
   - SKU missing: name, slug, primary_image
💡 Error message: "Cannot activate: 4 required specs missing — [engine_cc, cooling, ...]"
```

### Stage 2: ACTIVE → PUBLISHED _(Pricing Engine)_
> **Who:** Admin / Pricing Manager via **Pricing Engine**
> **Gate:** All pricing fields in `cat_pricing` must be complete for at least 1 state
> **What happens:** SKU has base pricing, visible on marketplace with "Starting at ₹XX,XXX"

```
✅ ALLOW SAVE draft pricing (publish_stage = 'DRAFT')
❌ BLOCK PUBLISH if:
   - ex_showroom missing or zero
   - insurance_od, insurance_tp not calculated
   - rto_total missing
   - on_road_price doesn't compute correctly
💡 Error message: "Cannot publish: ex_showroom price missing for state MH"
```

### Stage 3: PUBLISHED → LIVE _(Dealer Pricing)_
> **Who:** Dealership via **Dealer Pricing Dashboard**
> **Gate:** Dealer-specific offer must exist (margin, discount, finance terms)
> **What happens:** SKU shows on that dealer's storefront as purchasable with on-road price

```
✅ ALLOW SAVE offer draft
❌ BLOCK GO-LIVE if:
   - No dealer margin set
   - No valid offer window (start_date / end_date)
💡 Error message: "Cannot go live: dealer margin not configured"
```

### Status in DB Tables:

| Table | Column | Values | Meaning |
|-------|--------|--------|---------|
| `cat_models` | `status` | `DRAFT`, `ACTIVE` | Specs completeness |
| `cat_variants_*` | `status` | `DRAFT`, `ACTIVE` | Variant specs complete |
| `cat_skus` | `status` | `DRAFT`, `ACTIVE` | SKU details + media complete |
| `cat_pricing` | `publish_stage` | `DRAFT`, `PUBLISHED` | Pricing complete |
| Dealer offer table | `stage` | `DRAFT`, `LIVE` | Dealer offer complete |

### Key Principle:
> 📝 **Save कभी fail नहीं होगा.** Data incomplete हो, missing हो — save हो जायेगा DRAFT के रूप में.
> ❌ **Status change fail होगा** अगर required fields empty हैं.
> यानी — एक ही काम चार बार नहीं करना पड़ेगा. जब ready हो, tab activate करो.

---

## 🧷 Index + Uniqueness — Parent-Scoped ✅

> **Decision:** Slugs are **parent-scoped unique**, not globally unique.
> Rationale: "disc" under Jupiter ≠ "disc" under Activa — same slug, different parents is valid.

```sql
-- cat_models: slug unique within brand + type
CREATE UNIQUE INDEX uq_cat_models_brand_type_slug
  ON cat_models (brand_id, product_type, slug);
CREATE INDEX ix_cat_models_brand_status ON cat_models (brand_id, status);

-- variants: slug unique within model (parent-scoped)
CREATE UNIQUE INDEX uq_cat_variants_vehicle_model_slug
  ON cat_variants_vehicle (model_id, slug);
CREATE UNIQUE INDEX uq_cat_variants_accessory_model_slug
  ON cat_variants_accessory (model_id, slug);
CREATE UNIQUE INDEX uq_cat_variants_service_model_slug
  ON cat_variants_service (model_id, slug);

-- cat_skus: lookup indexes
CREATE INDEX ix_cat_skus_model_status ON cat_skus (model_id, status);

-- cat_pricing: unique per SKU per state + publish lookup
CREATE UNIQUE INDEX uq_cat_pricing_sku_state
  ON cat_pricing (sku_id, state_code);
CREATE INDEX ix_cat_pricing_publish_stage ON cat_pricing (publish_stage);
```

---

## 🧮 Future-Proof

**नई spec:**
```sql
INSERT INTO cat_specifications (spec_key, ...) VALUES ('top_speed', ...);
ALTER TABLE cat_variants_vehicle ADD COLUMN top_speed INTEGER;
-- बस! 2 queries. कोई migration chaos नहीं.
```

**नई ENUM value:**
```sql
UPDATE cat_specifications SET allowed_values = array_append(allowed_values, 'OLED') WHERE spec_key = 'console_type';
ALTER TABLE cat_variants_vehicle DROP CONSTRAINT IF EXISTS chk_console_type;
ALTER TABLE cat_variants_vehicle ADD CONSTRAINT chk_console_type CHECK (console_type IN ('ANALOG','DIGITAL','SEMI_DIGITAL_ANALOG','DIGITAL_TFT','OLED'));
```

**नया accessory type (Crash Guard for new vehicle):**
```sql
-- Just add a new SKU + Suitable For entry — no schema change needed!
INSERT INTO cat_skus (sku_type, brand_id, model_id, accessory_variant_id, name, ...)
VALUES ('ACCESSORY', 'arihant-id', 'crash-guard-id', 'standard-id', 'Standard', ...);

-- Then add Suitable For:
INSERT INTO cat_suitable_for (sku_id, target_brand_id, target_model_id)
VALUES ('new-sku-id', 'bajaj-id', 'pulsar-ns200-model-id');
```

---

## ✅ What's Already Done

| Item | Status |
|------|--------|
| `catalogLabels.ts` — HIERARCHY_LABELS constant | ✅ Done |
| Studio: 3 entry points (Add Vehicle/Accessory/Service) | ✅ Done |
| Studio: BrandStep merged with CategoryStep | ✅ Done |
| Studio: 8 steps → 7 steps (Type step removed) | ✅ Done |
| Studio: Dynamic step labels per product_type | ✅ Done |
| Studio: Header renamed to "Catalog Studio" | ✅ Done |
| Products listing: 3 color-coded add buttons | ✅ Done |
| DB: Phase 1 — 9 new tables created (all empty, RLS enabled) | ✅ Done |
| DB: `cat_price_state` → archived to `cat_price_state_archive` | ✅ Done |
| DB: `cat_item_compatibility` still active (2 rows) | ⚠️ Legacy — archive in Phase 5 |
| DB: `cat_skus_linear` still active (247 rows, JSONB) | ⚠️ Legacy — archive in Phase 5 |
| DB: `cat_items` still active (406 rows) | ⚠️ Legacy — archive in Phase 5 |
| Legacy data migration | ⏭️ SKIPPED — fresh seed approach |
| Code + UI update (fetchers, mappers, studio) | ⏳ Phase 2 ← NEXT |
| Fresh data seeding (SQL scripts per product) | ⏳ Phase 3 |
| Testing | ⏳ Phase 4 |
| Archive old tables | ⏳ Phase 5 |
