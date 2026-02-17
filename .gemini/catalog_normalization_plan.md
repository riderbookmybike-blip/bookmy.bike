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
4. **कोई table DROP नहीं** — rename to `_v1_archive`. *(Columns CAN be dropped after cutover, e.g., deprecated JSONB cols.)*
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

### 🔒 Canonical Naming Contract (DB + Code only)
1. **Use only:** `Brand -> Model -> Variant -> SKU`
2. **Do not use aliases:** `Product`, `Family`, `Unit`, `Color_Def`, `Fitment`, `Compatibility`
3. `product_type` stays only as technical enum (`VEHICLE|ACCESSORY|SERVICE`) for behavior, not naming.
4. Accessory/Service differences are handled by metadata (`sku_type`, `cat_suitable_for`) not by changing hierarchy terms.
5. UI labels are separate and type-specific via `HIERARCHY_LABELS` (allowed).

### 📘 One-Word SOT Glossary (Project-wide)
1. `Brand` = brand entity
2. `Model` = second level item
3. `Variant` = third level item
4. `SKU` = purchasable unit
5. `Suitable For` = vehicle applicability

### ⛔ Banned Terms (DB + Code scope)
1. `Product` -> use `Model`
2. `Family` -> use `Model`
3. `Plan` / `Tier` (as DB/code hierarchy names) -> use `Variant` / `SKU`
4. `Fitment` / `Compatibility` -> use `Suitable For`
5. `Unit` / `Sub-Variant` / `Colour` / `Tier` / `Plan` (as DB/code hierarchy names) -> use **`SKU`**
6. UI labels `Product/Plan/Tier/Colour/Sub-Variant` are allowed only in rendering layer.

> PR gate checklist: `docs/catalog_naming_sot_checklist.md`

### 📜 Migration Lineage (Old → New)

| Old (Active) | Rows | New (v4.2) | Status |
|-------------|------|------------|--------|
| `cat_items` (BRAND/TYPE/PRODUCT/VARIANT/UNIT/SKU) | 406 | `cat_models` + `cat_variants_*` + `cat_skus` | ⏳ Phase 2 |
| `cat_skus_linear` (flat + JSONB `specs`, `price_mh`) | 247 | `cat_skus` + `cat_pricing` (all flat columns) | ⏳ Phase 2 |
| `cat_item_compatibility` (FKs → `cat_items`, `is_universal` bool) | 2 | `cat_suitable_for` (FKs → `cat_skus`, NULL = ALL semantics) | 📦 Archive only (no transform) |
| `cat_price_state` → `cat_price_state_archive` | 188 | `cat_pricing` (flat, multi-state) | ✅ Archived |
| `cat_brands` | shared | `cat_brands` (same, JSONB cols to drop) | ✅ Shared |

> ⚠️ **App code currently uses old tables for reads.** V2 Server Actions + Fetcher done (Phase 2). Studio UI rewrite in progress.
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

> ℹ️ **Note:** Column headings below ("Colour", "Plan", "Tier") are **UI labels only** — DB/code always uses `Variant` and `SKU`.

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

## 📊 Studio Flow — 7 Steps, Labels Change

```
Step 1: Type             ← Select category (Vehicle/Accessory/Service) + brand (filtered by type)
Step 2: [Model Level]    ← Dynamic label per type (Model / Product / Service)
Step 3: [Variant Level]  ← Dynamic label per type (Variants)
Step 4: Colour Pool      ← Model-level colour palette (cat_colours) — VEHICLE only
Step 5: SKU Matrix       ← Create + manage SKUs (Cards ↔ Matrix toggle view)
Step 6: Review           ← Full tree summary before going live
Step 7: Activate         ← Set model to ACTIVE
```

> ℹ️ **Step 5 has two views:** Cards (CRUD per variant) and Matrix (Variant × SKU bird's-eye grid with inline price editing). Both are tabs within one step — no redundancy.

> ℹ️ **Below are UI-only display labels.** DB/code uses canonical `Variant`/`SKU` throughout.

| Step | Vehicle (UI Label) | Accessory (UI Label) | Service (UI Label) |
|------|---------|-----------|---------| 
| 1 | Type (+ Brand) | Type (+ Brand) | Type (+ Brand) |
| 2 | **Model** (Jupiter) | **Product** (Helmet) | **Service** (Extended Warranty) |
| 3 | **Variants** (Disc, Drum) | **Variants** (Half Face, Full Face) | **Plans** (2yr Comprehensive, 1yr Basic) |
| 4 | **Colour Pool** (model palette) | — (skip if N/A) | — (skip if N/A) |
| 5 | **SKU Matrix** (Cards ↔ Matrix) | **SKU Matrix** | **SKU Matrix** |
| 6 | Review | Review | Review |
| 7 | Activate | Activate | Activate |

> **Key:** Step 4 Colour Pool is defined at the model level (`cat_colours`).
> Step 5 SKUs link to colours via `colour_id` FK. Cards view for CRUD, Matrix view for coverage + pricing.
> - Vehicle → colours from pool (hex codes, finish)
> - Accessory → could be colours (helmet) OR vehicle-specific (crash guard, Suitable For) OR sizes
> - Service → duration / coverage level

---

## 📋 9 Tables — Full Details

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

#### Current State (12 columns — includes 2 deprecated JSONB)
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
| `brand_logos` | ~~JSONB~~ | ⚠️ **Deprecated — to be dropped** |
| `specifications` | ~~JSONB~~ | ⚠️ **Deprecated — to be dropped** |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### Target State (10 columns — after JSONB column drop)
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

**Column DROP (not table DROP):** `brand_logos` (JSONB), `specifications` (JSONB) — per principle #4, tables are never dropped, but deprecated columns CAN be dropped after cutover.

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
| `status` | TEXT | DRAFT \| ACTIVE (lifecycle gate-controlled) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**15 columns. Zero JSONB.**

---

### 4️⃣ `cat_variants_vehicle` 🆕 — Vehicle Variant + Flat Specs

> **हर column `cat_specifications` registry से driven.**
> NUMBER → NUMERIC/INTEGER, ENUM → TEXT + CHECK, value stored WITHOUT suffix.
> ⚠️ Actual DB = **42 columns** (verified 17-Feb-2026)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `model_id` | UUID FK → `cat_models` | |
| `name` | TEXT NOT NULL | "Disc SmartXonnect" |
| `slug` | TEXT | Parent-scoped unique via index `(model_id, slug)` |
| `position` | INTEGER | |
| `status` | TEXT | DRAFT \| ACTIVE |
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
| `wheelbase` | INTEGER | 1275 (mm) |
| `fuel_capacity` | NUMERIC(4,1) | 5.1 (L) |
| — **ELECTRICAL** | — | — |
| `console_type` | TEXT | CHECK IN (ANALOG, DIGITAL, ...) |
| `led_headlamp` | BOOLEAN | true = LED headlamp |
| `led_tail_lamp` | BOOLEAN | true = LED tail lamp |
| `usb_charging` | BOOLEAN | |
| `bluetooth` | BOOLEAN | |
| `navigation` | BOOLEAN | |
| `ride_modes` | TEXT | e.g. "Eco, City, Sport" |
| — **TYRES** | — | — |
| `front_tyre` | TEXT | |
| `rear_tyre` | TEXT | |
| `tyre_type` | TEXT | e.g. "Tubeless" |
| — **EV** | — | — |
| `battery_type` | TEXT | |
| `battery_capacity` | TEXT | |
| `range_km` | INTEGER | |
| `charging_time` | TEXT | |
| `motor_power` | TEXT | |
| — **Meta** | — | — |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**42 columns. Zero JSONB.**

> ⚠️ **Planned but NOT in DB yet** (add via ALTER if needed later):
> `ground_reach`, `seat_length`, `vehicle_length`, `vehicle_width`, `vehicle_height`,
> `under_seat_storage`, `front_leg_space`, `glove_box`, `wheel_type`, `battery` (text)

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
| `material` | TEXT | |
| `weight` | INTEGER | grams |
| `finish` | TEXT | CHECK IN (GLOSS, MATTE, CHROME, CARBON) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**11 columns. Zero JSONB.**

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

**⚠️ कोई table DROP नहीं — सिर्फ rename to `_v1_archive`** *(Deprecated columns CAN be dropped.)*

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
10. ALTER cat_brands — DROP 2 JSONB cols (`brand_logos`, `specifications`)  ⏳ NOT DONE
```

### Phase 2: Seed V2 Tables ✅ DONE
```
Seed 5 models (Jupiter 125, Activa 6G, Jupiter 110, Unicorn, XL 100)
Seed variants + SKUs for all 5 models (58 total SKUs)
```

### Phase 3: Seed Pricing ✅ DONE
```
Populate cat_pricing for all 58 SKUs (MH state)
RTO + Insurance breakdowns with arithmetic integrity verified
```

### Phase 4: Testing ✅ PASSED
```
Data pipeline, pricing integrity, specs, RLS, constraints, TypeScript — all passed
(See detailed results in "✅ What's Already Done" section below)
```

### Phase 5: Archive Old Tables ⏳ PENDING
```
Rename legacy tables to _v1_archive
Drop deprecated JSONB columns from cat_brands
```

### Phase 6: cat_colours — Colour as First-Class Entity ⏳ PENDING
```
(See detailed plan in Phase 6 section below)
```

## 📊 Final Summary

| # | Table | Cols | JSONB | Current State | Target State | Hierarchy Level |
|---|-------|:----:|:-----:|---------------|--------------|----------------|
| 1 | `cat_specifications` | 21 | ❌ | ✅ Created + Seeded (60 specs) | Done | Blueprint |
| 2 | `cat_brands` | 12 → 10 | ⚠️ 2 JSONB remain | 🔧 Existing — `brand_logos`, `specifications` JSONB NOT dropped yet | DROP 2 JSONB cols (Phase 5) | Brand |
| 3 | `cat_models` | 15 | ❌ | ✅ Created | Model |
| 4 | `cat_variants_vehicle` | 42 | ❌ | ✅ Created (10 planned cols deferred) | Variant |
| 5 | `cat_variants_accessory` | 11 | ❌ | ✅ Created | Variant |
| 6 | `cat_variants_service` | 11 | ❌ | ✅ Created | Variant |
| 7 | `cat_skus` | 37 | ❌ | ✅ Created | SKU |
| 8 | `cat_pricing` | 55 | ❌ | ✅ Created | Pricing |
| 9 | `cat_suitable_for` | 6 | ❌ | ✅ Created | Suitable For |
| **Total** | **9 tables** | **~208** | **Pending cleanup (brand JSONB)** | | |

---

## 🔧 Code Constant — Hierarchy Labels (Two Layers)

### Layer 1: Database & Code — Canonical (universal)
```
Tables:     cat_brands → cat_models → cat_variants_* → cat_skus
Variables:  brand       model        variant           sku
Columns:    brand_id    model_id     variant_id        sku_id
```
> सब jagah same names. कोई confusion नहीं.

### Layer 2: UI / Display — Type-Specific (user-facing)
```typescript
// src/lib/constants/catalogLabels.ts
export const HIERARCHY_LABELS = {
  VEHICLE:   { model: 'Model',   variant: 'Variant', sku: 'Colour' },
  ACCESSORY: { model: 'Product', variant: 'Variant', sku: 'Sub-Variant' },
  SERVICE:   { model: 'Service', variant: 'Plan',    sku: 'Tier' },
} as const;

// Usage in Studio:
// const labels = HIERARCHY_LABELS[product_type];
// Step 2: <h2>Add {labels.model}</h2>     → "Add Model" / "Add Product" / "Add Service"
// Step 3: <h2>Add {labels.variant}</h2>   → "Add Variant" / "Add Variant" / "Add Plan"
// Step 4: <h2>Add {labels.sku}</h2>        → "Add Colour" / "Add Sub-Variant" / "Add Tier"
// Step 5: SKU Matrix                       → Variant × Colour / Variant × Sub-Variant / Plan × Tier
```

> UI mein user ko context ke hisaab se label dikhe — Vehicle mein "Colour", Accessory mein "Sub-Variant", Service mein "Tier".
> Lekin code mein hamesha `model`, `variant`, `sku` hi use hoga.

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
| **Code: V2 Server Actions** (`catalogV2Actions.ts`) | ✅ Phase 2 — DONE |
| **Code: V2 Fetcher** (`catalogFetcherV2.ts`) | ✅ Phase 2 — DONE |
| **Code: Hierarchy Labels** (`catalogLabels.ts`) — UI labels per type | ✅ Phase 2 — DONE |
| **Code: Studio V2 UI** — 8 files, 2336 lines | ✅ Phase 2 — DONE |
| &ensp;└ `studio-v2/page.tsx` — Orchestrator (406L) | ✅ |
| &ensp;└ `steps/BrandStepV2.tsx` — Category + Brand (250L) | ✅ |
| &ensp;└ `steps/ModelStepV2.tsx` — CRUD cat_models (394L) | ✅ |
| &ensp;└ `steps/VariantStepV2.tsx` — Accordion specs (385L) | ✅ |
| &ensp;└ `steps/SKUStepV2.tsx` — Colour/Sub-Variant/Tier (355L) | ✅ |
| &ensp;└ `steps/MatrixStepV2.tsx` — Cross-ref table (192L) | ✅ |
| &ensp;└ `steps/ReviewStepV2.tsx` — Validation + tree (237L) | ✅ |
| &ensp;└ `steps/PublishStepV2.tsx` — Activate model (117L) | ✅ |
| **Entry Point**: Catalog page "Studio V2" button added | ✅ Phase 2 — DONE |
| DB: `emission_standard` constraint fixed: added `BS-VI` | ✅ Done |
| **Seed: TVS Jupiter 125** — 1 model, 4 variants, 13 SKUs | ✅ Phase 3 — DONE |
| &ensp;└ Model: Jupiter 125 (124.8cc, SCOOTER, BS-VI) | ✅ |
| &ensp;└ Variants: Drum Alloy, Disc, DT SXC, SmartXonnect | ✅ |
| &ensp;└ SKUs: 3 + 5 + 2 + 3 = 13 colour SKUs (all ACTIVE) | ✅ |
| Fresh data seeding (remaining products) | ⏳ Phase 3 — IN PROGRESS |
| **Seed: Jupiter 125 Pricing (MH)** — 13 rows, full RTO+Insurance breakdown | ✅ Phase 3 — DONE |
| **Seed: Activa 6G Pricing (MH)** — 18 rows (3 variants × 6 colors), full RTO+Insurance | ✅ Phase 3 — DONE |
| **Seed: Jupiter 110 Pricing (MH)** — 9 rows (5 variants), full RTO+Insurance | ✅ Phase 3 — DONE |
| &ensp;└ Drum (3), Drum Alloy (2), Drum SXC (1), Disc SXC (2), Special Ed (1) | ✅ |
| **Seed: Unicorn Pricing (MH)** — 3 rows (1 variant × 3 colors), full RTO+Insurance | ✅ Phase 3 — DONE |
| **Seed: XL 100 Pricing (MH)** — 15 rows (5 variants), full RTO+Insurance | ✅ Phase 3 — DONE |
| &ensp;└ Strategy: JSONB→flat via `::numeric::int` cast, join on variant+color | ✅ |
| &ensp;└ Integrity: `on_road_price = ex_showroom + rto_total + ins_total` — 0 diff all rows | ✅ |
| `cat_pricing` population (all V2 models) | ✅ Phase 3 — DONE (58 total rows) |
| **Phase 4 — Testing** | ✅ PASSED |
| &ensp;└ TEST 1: Data pipeline (58 SKUs, all ACTIVE, all with pricing) | ✅ |
| &ensp;└ TEST 2: Pricing integrity (`on_road = ex_showroom + rto + ins`) — 0 diff all rows | ✅ |
| &ensp;└ TEST 3: Variant specs completeness — displacement, brake, transmission filled | ✅ |
| &ensp;└ TEST 4: RLS — `cat_pricing` has public SELECT, no new security advisories | ✅ |
| &ensp;└ TEST 5: Constraints — PK, FK, CHECK (ex_showroom > 0, on_road >= ex, publish_stage enum) | ✅ |
| &ensp;└ TEST 6: TypeScript `tsc --noEmit` — zero errors | ✅ |
| &ensp;└ NOTE: V2 Fetcher (`catalogFetcherV2.ts`) built, not yet wired to catalog page | ℹ️ |
| &ensp;└ NOTE: Jupiter 125 missing images (0/13), all others have images | ℹ️ |
| &ensp;└ NOTE: Activa + Unicorn missing `max_power`, `mileage`, `fuel_capacity`, `kerb_weight` specs | ℹ️ |
| Archive old tables | ⏳ Phase 5 |

---

## Phase 6: `cat_colours` — Colour as First-Class Entity

### 🎯 Objective
Extract colour data from `cat_skus` into a dedicated `cat_colours` table at the model level.
SKU becomes a pure **cross-product** of `Variant × Colour` via dual FKs.

### 📐 Target Schema

```
cat_brands (1)
  └── cat_models (N)
        ├── cat_variants_vehicle (N)    — FK: model_id
        ├── cat_colours (N)             — FK: model_id  ← NEW
        └── cat_skus (N×M)             — FK: variant_id + colour_id
```

**Entity purpose:**
| Entity | What it represents | Example |
|--------|--------------------|---------|
| `cat_models` | A vehicle model | Jupiter 110 |
| `cat_variants_vehicle` | A variant/trim level | Drum, Drum Alloy, SmartXonnect |
| `cat_colours` | A colour option for a model | Starlight Blue Gloss, Meteor Red |
| `cat_skus` | One buyable product = Variant × Colour | Jupiter Drum × Starlight Blue |

---

### 🗄️ Step 1: Create `cat_colours` Table

```sql
CREATE TABLE public.cat_colours (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID NOT NULL REFERENCES public.cat_models(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,            -- "Starlight Blue Gloss"
    hex_primary     TEXT,                     -- "#1B3F8B"
    hex_secondary   TEXT,                     -- nullable, dual-tone
    finish          TEXT CHECK (finish IN ('GLOSS','MATTE','METALLIC','CHROME')),
    position        INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(model_id, name)                   -- no duplicate colour names per model
);

-- RLS: public read, admin write
ALTER TABLE public.cat_colours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cat_colours" ON public.cat_colours
    FOR SELECT USING (true);
```

| Challenge | Solution |
|-----------|----------|
| **Duplicate colour names across variants** — "Starlight Blue Gloss" appears in 3 variants but is ONE colour | `UNIQUE(model_id, name)` constraint ensures one colour entry per model, referenced by many SKUs |
| **What about same colour name across models?** — Honda also has "Meteor Red" | Constraint is per-model (`model_id + name`), so Honda Activa "Meteor Red" ≠ TVS Jupiter "Meteor Red". This is correct — they have different hex codes |
| **Finish might be NULL** — some legacy data may not have it | Column is nullable. Can backfill later via UI |

---

### 🔗 Step 2: Add `colour_id` FK to `cat_skus`

```sql
ALTER TABLE public.cat_skus
    ADD COLUMN colour_id UUID REFERENCES public.cat_colours(id) ON DELETE SET NULL;

-- Optional: composite unique to prevent duplicate SKUs
-- ALTER TABLE public.cat_skus 
--     ADD CONSTRAINT unique_variant_colour UNIQUE(vehicle_variant_id, colour_id);
```

| Challenge | Solution |
|-----------|----------|
| **`ON DELETE SET NULL` vs `CASCADE`** — what if a colour is deleted? | `SET NULL` is safer. SKU doesn't get deleted, just loses its colour reference. Admin can reassign. `CASCADE` would silently delete SKUs (dangerous) |
| **Composite unique constraint** — should we enforce unique `(variant_id, colour_id)`? | **Defer for now**. Some edge cases: "Special Edition" variants may have exclusive colours OR the same variant might have two entries for the same colour (e.g., different finish years). Add constraint later after data is stable |
| **Existing columns `color_name`, `hex_primary`, `hex_secondary`, `finish` on `cat_skus`** — redundant now | **Keep as denormalized cache** for Phase 6. Drop in Phase 7 after all consumers migrate to JOIN. This avoids breaking 26+ files at once |

---

### 📦 Step 3: Migrate Existing Data

**Strategy:** Extract unique colours from existing `cat_skus` → INSERT into `cat_colours` → backfill `colour_id` on `cat_skus`

```sql
-- Step 3a: Extract unique colours per model
INSERT INTO cat_colours (model_id, name, hex_primary, hex_secondary, finish, position)
SELECT DISTINCT ON (model_id, color_name)
    model_id,
    color_name,
    hex_primary,
    hex_secondary,
    finish,
    ROW_NUMBER() OVER (PARTITION BY model_id ORDER BY position) - 1
FROM cat_skus
WHERE color_name IS NOT NULL
  AND status = 'ACTIVE'
ORDER BY model_id, color_name, position;

-- Step 3b: Backfill colour_id on existing SKUs
UPDATE cat_skus s
SET colour_id = c.id
FROM cat_colours c
WHERE c.model_id = s.model_id
  AND c.name = s.color_name;
```

| Challenge | Solution |
|-----------|----------|
| **Same colour name, different hex across variants** — e.g., "Midnight Black" could have slightly different hex in Drum vs SmartXonnect | `DISTINCT ON (model_id, color_name)` picks one. Hex differences should be normalized anyway (one hex per colour name per model). If genuinely different, they should be different colour names |
| **SKUs with NULL `color_name`** — accessories/services won't have colours | Skip them in migration (`WHERE color_name IS NOT NULL`). `colour_id` stays NULL for non-vehicle SKUs. This is correct by design |
| **Colour names with inconsistent casing** — "starlight blue" vs "Starlight Blue Gloss" | Pre-migration audit: `SELECT model_id, LOWER(color_name), COUNT(*) FROM cat_skus GROUP BY 1,2 HAVING COUNT(DISTINCT color_name) > 1`. Fix casing before migration |
| **Position ordering** — colours within a model need consistent sort order | `ROW_NUMBER() OVER (PARTITION BY model_id)` generates 0-based position. Can reorder in UI later |

---

### 🔧 Step 4: Code Changes — Impact Analysis

**26 files reference `color_name`/`hex_primary` from SKU-level data:**

#### Layer 1: V2 Direct Consumers (Phase 6 scope)
| File | What uses | Change needed |
|------|-----------|---------------|
| `catalogFetcherV2.ts` | `s.color_name`, `s.hex_primary` in `RawProductRow` | Add JOIN to `cat_colours` via `colour_id`. Read from colour entity |
| `catalogV2Actions.ts` | `CatalogSku.color_name` type + `createSku()` | Add `listColours()`, `createColour()`, `updateColour()`, `deleteColour()` actions. Update `createSku()` to accept `colour_id` |
| `SKUStepV2.tsx` | Creates SKU with `color_name` inline | **Reworked entirely** — becomes Colour Pool step |
| `MatrixStepV2.tsx` | Read-only grid by SKU name | **Reworked entirely** — becomes Variant × Colour checkbox matrix |
| `ReviewStepV2.tsx` | Displays `sku.hex_primary`, `sku.color_name` | Read from joined `colour` data or keep denormalized cache |

#### Layer 2: V1 Consumers (NOT in Phase 6 scope — keep working via denormalized columns)
| File | What uses | Phase 6 action |
|------|-----------|----------------|
| `catalogFetcher.ts` (V1) | `specs.hex_primary` from `cat_items` | **No change** — V1 path doesn't touch `cat_skus` |
| `catalogMapper.ts` | `sku.specs?.hex_primary` from `cat_items` JSONB | **No change** — V1 mapper |
| `crm.ts` | `commercials.hex_primary` from quote snapshot | **No change** — reads from stored JSONB, not live colour |
| `QuoteEditorWrapper.tsx` | `q.commercials?.color_name` | **No change** — reads from quote, not catalogue |
| `BookingEditorWrapper.tsx` | `color_name` from booking | **No change** — snapshot data |
| `syncAction.ts` | `hex_primary` during V1→V2 sync | Minimal update — also write `colour_id` during sync |
| `scraperAction.ts` | `hex_primary` during scrape ingest | Minimal update — also create colour if needed |
| `ProductClient.tsx` (PDP) | `hex_primary` from V1 `ProductVariant` type | **No change** — V1 type |
| `SystemCatalogLogic.ts` | Colour logic for CRM | **No change** — uses V1 data |
| V1 Studio steps | `UnitStep.tsx`, `MatrixStep.tsx`, `ReviewStep.tsx` | **No change** — V1 studio |
| `catalog/products/page.tsx` | Admin list `hex_primary` | **No change** — V1 `cat_items` |
| `catalog/audit/page.tsx` | Audit view | **No change** |

| Challenge | Solution |
|-----------|----------|
| **26 files reference colour data** — too many to change at once | **Two-layer strategy**: V2 consumers (5 files) migrate to `cat_colours` JOIN. V1 consumers (21 files) keep using existing denormalized data. Zero breakage |
| **`catalogFetcherV2.ts` needs JOIN** — currently reads `hex_primary` directly from SKU select | Add `colour:cat_colours!colour_id(id, name, hex_primary, hex_secondary, finish)` to the PostgREST nested select. Fallback to SKU-level `hex_primary` if `colour_id` is NULL |
| **`createSku()` currently sets `color_name`** — consumers expect this | Keep writing `color_name` + `hex_primary` to SKU (denormalized cache) PLUS set `colour_id`. This is the **bridge period** strategy |
| **TypeScript types** — need `cat_colours` in `supabase.ts` | Regenerate types via `generate_typescript_types` after migration |

---

### 🎨 Step 5: Studio V2 UI Rework

**Current flow (7 steps):**
```
Brand → Model → Variants → Colours/SKUs → Matrix (readonly) → Review → Publish
```

**New flow (7 steps, same count, better UX):**
```
Brand → Model → Variants → Colour Pool → SKU Matrix → Review → Publish
                                ↑ NEW          ↑ REWORKED
```

#### Step 4 NEW: Colour Pool
- Shows all colours defined for this model (from `cat_colours`)
- Add/edit/delete colours (name, hex picker, finish dropdown)
- No variant association here — just the palette
- UI: Grid of colour cards with swatch, name, hex code

#### Step 5 REWORKED: SKU Matrix
- **Rows** = Variants (from `cat_variants_vehicle`)
- **Columns** = Colours (from `cat_colours`)
- **Cells** = Checkbox (☑️/☐)
  - ☑️ Checked → SKU exists for this Variant×Colour
  - ☐ Unchecked → No SKU
- **Toggle logic:**
  - Check a cell → `createSku({ variant_id, colour_id, ... })` auto-generates SKU
  - Uncheck → `deleteSku()` or mark INACTIVE
- **Inline price edit** on checked cells (same as current matrix)
- **Bulk actions:** "Select All" column header toggles a colour across all variants

| Challenge | Solution |
|-----------|----------|
| **Orphan colours** — colour defined but zero SKUs assigned | Show ⚠️ warning badge: "0 variants" in Colour Pool. Blocking validation before Publish: "2 colours have no variants assigned — remove or assign them" |
| **Colour in some variants but not all** — this is valid (e.g., "Midnight Black" only in Disc SmartXonnect) | Normal case. Matrix shows partial row — unchecked cells are just unchecked. This is the whole point of the matrix |
| **Auto-generate SKU name** — when checking a cell, what's the SKU name? | Auto: `{colour_name}` as name. SKU code: `{model_slug}-{variant_slug}-{colour_slug}`. Both can be edited after creation |
| **Auto-generate `price_base`** — what price for a new SKU? | Default to model's base price or 0. Admin edits in matrix or Review step |
| **Media (images) per SKU** — each colour has different images | Images stay on `cat_skus` (per-SKU), NOT on `cat_colours`. A colour swatch is model-level, but product photos are SKU-level (same colour may look different on different variants). This is already correct in the schema |
| **360° shared media** — `media_shared` flag on SKU | Keep on `cat_skus`. If `media_shared = true`, SKU shares 360° assets with primary SKU of same variant. No change needed |
| **Mobile UX** — matrix may be too wide on mobile | Horizontal scroll + sticky first column (variant names). Already implemented in current MatrixStepV2 |
| **Deleting a colour from pool** — what happens to its SKUs? | `ON DELETE SET NULL` on FK. Show confirmation dialog: "This will disconnect X SKUs from this colour. Continue?" Optionally offer "Delete colour AND its SKUs" |

---

### 📋 Step 6: Validation & Testing

| Test | What to verify |
|------|----------------|
| **Schema integrity** | `cat_colours` has correct columns, UNIQUE constraint, FK to models |
| **Data migration** | All existing colours extracted. `colour_id` backfilled on all vehicle SKUs with colour data |
| **No orphan SKUs** | `SELECT COUNT(*) FROM cat_skus WHERE color_name IS NOT NULL AND colour_id IS NULL` = 0 |
| **Referential integrity** | `SELECT * FROM cat_skus WHERE colour_id NOT IN (SELECT id FROM cat_colours)` = 0 |
| **V2 fetcher** | `catalogFetcherV2.ts` JOINs colour data correctly. Marketplace shows correct colours |
| **V1 not broken** | V1 catalog, CRM, quotes, bookings — all unchanged. `tsc --noEmit` passes |
| **Studio V2 Colour Pool** | Can create, edit, delete colours. Hex picker works. Orphan warning shows |
| **Studio V2 Matrix** | Checkbox creates/removes SKUs. Price editing works. Bulk select works |
| **RLS** | `cat_colours` is publicly readable. No new security advisories |
| **TypeScript** | Regenerated types include `cat_colours`. `tsc --noEmit` passes |

---

### 📅 Execution Order

| Phase | Task | Dependencies |
|-------|------|-------------|
| 6.1 | Create `cat_colours` table + RLS | None |
| 6.2 | Add `colour_id` FK to `cat_skus` | 6.1 |
| 6.3 | Migrate existing colour data | 6.2 |
| 6.4 | Regenerate TypeScript types | 6.3 |
| 6.5 | Add CRUD actions for `cat_colours` in `catalogV2Actions.ts` | 6.4 |
| 6.6 | Update `catalogFetcherV2.ts` to JOIN `cat_colours` | 6.4 |
| 6.7 | Build Colour Pool step (Studio V2 Step 4) | 6.5 |
| 6.8 | Rework Matrix step (Studio V2 Step 5) | 6.5, 6.7 |
| 6.9 | Validation & testing | All above |
| 6.10 | `tsc --noEmit` + build verification | 6.9 |

### ⚠️ Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| V1 consumers break | Low | High | Denormalized cache columns kept. Zero V1 code changes |
| Colour data inconsistency during migration | Medium | Medium | Pre-migration audit query. Fix casing/duplicates before INSERT |
| Orphan colours accumulate over time | Medium | Low | UI warning + optional cleanup action in Colour Pool |
| Matrix UI performance with many variants × colours | Low | Low | Max ~10 variants × ~20 colours = 200 cells. Fine |
| `ON DELETE SET NULL` leaves dangling SKUs | Low | Medium | Confirmation dialog. Option to cascade-delete related SKUs |
