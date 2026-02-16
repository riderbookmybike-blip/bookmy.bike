# 🏗️ Catalog Normalization Plan v3

> 📅 16 Feb 2026 · BookMyBike · Supabase `aytdeqjxxjxbgiyslubx`

---

## 🎯 Goal

`cat_items` + `cat_skus_linear` (JSONB mess) → **9 clean, normalized tables** — Zero JSONB, सब flat columns, proper naming per product type.

### Core Principles
1. **Zero JSONB** — पूरे catalog में कहीं भी
2. **`cat_specifications`** = Master Blueprint for all specs
3. **Media सिर्फ SKU level पर** — Brand पर सिर्फ logo
4. **कोई table DROP नहीं** — rename to `_v1_archive`
5. **Proper naming per type** — Vehicle/Accessory/Service हर type की अपनी vocabulary

---

## 🏷️ Naming Hierarchy — The Fix

### ❌ Before: Naming Chaos

| Level | cat_items.type | cat_skus_linear field | Problem |
|-------|---------------|----------------------|---------|
| 1 | BRAND | brand_name | ✅ OK |
| 2 | TYPE | type_name | ❓ "TYPE" = confusing, "VEHICLE" is a type but also a category |
| 3 | PRODUCT | product_name | ❓ Vehicle "Jupiter" is a Model, not generic "product" |
| 4 | VARIANT | variant_name | ✅ OK for vehicles, wrong for accessories |
| 5 | UNIT / COLOR_DEF | unit_name | ❓ Vehicle "Blue Gloss" is a Colour, not "unit" |
| 6 | SKU | sku_code | ✅ OK |

**Real Example — अभी:**
```
Vehicle:  TVS > VEHICLE > Jupiter > Disc SmartXonnect > DISC SXC STARLIGHT BLUE GLOSS
                ^^^^                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                confusing type level                     "unit" but it's actually a Colour

Accessory: Generic > ACCESSORY > ACCESSORY(!) > Floor Mat > Jupiter
                                  ^^^^^^^^^^^^   ^^^^^^^^^   ^^^^^^^
                                  product=ACCESSORY??  variant=Floor Mat??  unit=Jupiter??
```

### ✅ After: Clean Naming Per Type

**🏍️ VEHICLE Hierarchy:**
```
Brand → Model → Variant → Colour
TVS   → Jupiter → Disc SmartXonnect → Starlight Blue Gloss
```

**🎒 ACCESSORY Hierarchy:**
```
Brand → Product → Variant → Style
Generic → Floor Mat → Scooter Safety Guard → Activa Fitment
```

**🔧 SERVICE Hierarchy:**
```
Brand → Service → Plan → Tier
BookMyBike → Extended Warranty → 2 Year Comprehensive → Platinum
```

### Naming Map — DB Tables vs Display Labels

| DB Table | VEHICLE display | ACCESSORY display | SERVICE display |
|----------|:--------------:|:----------------:|:--------------:|
| `cat_brands` | Brand | Brand | Brand |
| `cat_models` | **Model** | Product | Service |
| `cat_variants_vehicle` | Variant | — | — |
| `cat_variants_accessory` | — | Variant | — |
| `cat_variants_service` | — | — | Plan |
| `cat_colours` | **Colour** | — | — |
| `cat_skus` | — | **Style** | **Tier** |

> **Key Rename:**
> - `cat_products` → **`cat_models`** — "Model" is universal for vehicles, works for accessories/services too
> - `cat_skus` splits into **`cat_colours`** (vehicles only) + **`cat_skus`** (accessories/services)

Wait — actually ek acha study karte hain. Vehicle SKU = Colour is correct. But do we need 2 separate tables? Let me simplify:

### ✅ Final Decision — Single `cat_skus` with display-label mapping

| DB Table Name | Purpose | Vehicle Label | Accessory Label | Service Label |
|--------------|---------|:------------:|:--------------:|:------------:|
| `cat_brands` | Brand master | Brand | Brand | Brand |
| `cat_models` | Model/Product master | **Model** | **Product** | **Service** |
| `cat_variants_vehicle` | Vehicle variant + specs | **Variant** | — | — |
| `cat_variants_accessory` | Accessory variant | — | **Variant** | — |
| `cat_variants_service` | Service variant | — | — | **Plan** |
| `cat_skus` | Final purchasable unit + media | **Colour** | **Style** | **Tier** |

> Table names stay generic. **Display labels per product_type** stored in `cat_hierarchy_labels`:

### `cat_hierarchy_labels` (config rows, not a table — in `cat_specifications`)

We add these to `cat_specifications` with `spec_level = 'SYSTEM'`:

| spec_key | display_label | data_type | applies_to | allowed_values |
|----------|--------------|-----------|-----------|----------------|
| `level_model_label` | Model Level Label | ENUM | ALL | {Model, Product, Service} |
| `level_variant_label` | Variant Level Label | ENUM | ALL | {Variant, Variant, Plan} |
| `level_sku_label` | SKU Level Label | ENUM | ALL | {Colour, Style, Tier} |

Actually — even simpler. Hard-code a `HIERARCHY_LABELS` constant in code:

```typescript
const HIERARCHY_LABELS = {
  VEHICLE:   { model: 'Model',   variant: 'Variant', sku: 'Colour' },
  ACCESSORY: { model: 'Product', variant: 'Variant', sku: 'Style'  },
  SERVICE:   { model: 'Service', variant: 'Plan',    sku: 'Tier'   },
} as const;
```

This is config, not data — belongs in code, not DB. No need to query for labels.

---

## 📋 Studio UX Change

### ❌ Before: Generic "+" button
```
[ + Add Item ] → confusing wizard → select type → select level → fill form
```

### ✅ After: Three clear entry points
```
[ + Add Vehicle ]     → Name (Model) + Body Type + Engine CC → auto-creates in cat_models
[ + Add Accessory ]   → Name (Product) → auto-creates in cat_models
[ + Add Service ]     → Name (Service) → auto-creates in cat_models
```

**Product Studio Steps (Vehicle):**
```
Step 1: "Add Vehicle Model" → name, body_type, engine_cc, fuel_type (from registry REQUIRED specs)
Step 2: "Add Variant" → name + specs (32 flat columns, all from registry)
Step 3: "Add Colour" → name, hex_primary, hex_secondary, finish, media (images/gallery)
Step 4: "Set Pricing" → cat_price_mh flat columns
```

**Product Studio Steps (Accessory):**
```
Step 1: "Add Accessory Product" → name, suitable_for
Step 2: "Add Variant" → name, material, weight, finish
Step 3: "Add Style" → name, color, media
Step 4: "Set Pricing" → price_base
```

---

## 🔀 Before vs After — Summary

| Aspect | Before (अभी) | After |
|--------|-------------|-------|
| **Naming** | Product, Unit, Type, SKU — confusing | Model/Variant/Colour (vehicle), Product/Variant/Style (accessory) |
| **Tables** | `cat_items` 1 table, 6 levels via parent_id | 9 focused tables, FK linked |
| **Specs** | JSONB blob — no validation | Flat columns + `cat_specifications` registry |
| **Pricing** | `price_mh` JSONB blob | `cat_price_mh` — 52 flat columns |
| **Media** | Scattered across cat_items + cat_assets + cat_skus_linear | ONLY on `cat_skus` (called "Colour" for vehicles) |
| **Studio** | Generic "+" → confusing wizard | "Add Vehicle" / "Add Accessory" / "Add Service" — clear paths |
| **型 Validation** | None — garbage in, garbage out | CHECK constraints, ENUM allowed_values, NOT NULL |
| **New spec** | Major migration | 1 row registry + 1 ALTER TABLE |

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

#### Seed: Model-Level Specs (5 specs, 4 REQUIRED)

| spec_key | label | type | required | allowed_values |
|----------|-------|------|:--------:|----------------|
| `product_type` | Product Type | ENUM | ✅ | VEHICLE, ACCESSORY, SERVICE |
| `body_type` | Body Type | ENUM | ✅ | MOTORCYCLE, SCOOTER, MOPED, ELECTRIC |
| `engine_cc` | Engine CC | NUMBER(1) cc | ✅ | — |
| `fuel_type` | Fuel Type | ENUM | ✅ | PETROL, EV, CNG, DIESEL |
| `emission_standard` | Emission | ENUM | ❌ | BS4, BS6, BS6_STAGE2 |

> **Studio:** "Add Vehicle Model" → name दो + `product_type = VEHICLE`, `body_type`, `engine_cc`, `fuel_type` select (from registry) — type decide करेगा कौन सी variant table use होगी। एक step कम!

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

| Before | After |
|--------|-------|
| 12 columns, 2 JSONB | 10 columns, Zero JSONB |

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

### 3️⃣ `cat_models` 🆕 — Model / Product / Service Master

> ⚠️ **Renamed from `cat_products`** → `cat_models` because:
> - Vehicle = "Model" (Jupiter, Splendor)
> - Accessory = "Product" (Floor Mat, Helmet)
> - Service = "Service" (Extended Warranty)
> - "Model" is the industry-standard term for 2-wheelers

| Before | After |
|--------|-------|
| `cat_items WHERE type = 'PRODUCT'` — specs in JSONB | Flat columns, FK to brands, REQUIRED specs enforced |
| No naming consistency | `product_type` decides display label (Model/Product/Service) |

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `brand_id` | UUID FK → `cat_brands` | |
| `name` | TEXT NOT NULL | "Jupiter", "Floor Mat", "Extended Warranty" |
| `slug` | TEXT UNIQUE | |
| `product_type` | TEXT NOT NULL | VEHICLE \| ACCESSORY \| SERVICE — from registry ENUM |
| `body_type` | TEXT | MOTORCYCLE \| SCOOTER \| MOPED \| ELECTRIC — from registry |
| `engine_cc` | NUMERIC(6,1) | from registry NUMBER(1) |
| `fuel_type` | TEXT | PETROL \| EV \| CNG — from registry |
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
> NUMBER → NUMERIC/INTEGER, ENUM → TEXT + CHECK, value stored WITHOUT suffix (suffix from registry).

| Before | After |
|--------|-------|
| `specs: {"seat_height": "770 mm"}` — TEXT with suffix | `seat_height: 770` — INTEGER, suffix "mm" from registry |
| `specs: {"console_type": "Digital"}` — no validation | `console_type: 'DIGITAL'` — CHECK IN allowed_values |

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `model_id` | UUID FK → `cat_models` | ⚠️ renamed from product_id |
| `name` | TEXT NOT NULL | "Disc SmartXonnect" |
| `slug` | TEXT UNIQUE | |
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
| `console_type` | TEXT | CHECK IN (ANALOG, DIGITAL, SEMI_DIGITAL_ANALOG, DIGITAL_TFT) |
| `battery` | TEXT | |
| `usb_charging` | BOOLEAN | |
| `navigation` | TEXT | CHECK IN (NONE, BLUETOOTH, SMARTXONNECT, VOICE_ASSIST) |
| — **Meta** | — | — |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**44 columns. Zero JSONB.**

---

### 5️⃣ `cat_variants_accessory` 🆕

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `model_id` | UUID FK → `cat_models` | ⚠️ renamed from product_id |
| `name` | TEXT NOT NULL | "Safety Guard" |
| `slug` | TEXT UNIQUE | |
| `position` | INTEGER | |
| `status` | TEXT | |
| `suitable_for` | TEXT | "Jupiter, Activa" |
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
| `slug` | TEXT UNIQUE | |
| `position` | INTEGER | |
| `status` | TEXT | |
| `duration_months` | INTEGER | |
| `coverage_type` | TEXT | CHECK IN (COMPREHENSIVE, THIRD_PARTY) |
| `labor_included` | BOOLEAN | default true |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**11 columns. Zero JSONB.**

---

### 7️⃣ `cat_skus` 🆕 — Final Unit + ALL Media

> **Display name per type:**
> - Vehicle → **"Colour"** (Starlight Blue Gloss)
> - Accessory → **"Style"** (Activa Fitment)
> - Service → **"Tier"** (Platinum)
>
> **सारी media ONLY this table पर।**

| Before | After |
|--------|-------|
| `cat_items` type=COLOR_DEF/SKU — gallery_urls JSONB | Flat: `primary_image`, `gallery_img_1..6`, `video_url_1/2` |
| `cat_skus_linear.unit_json` — color data JSONB | Direct: `hex_primary`, `color_name`, `finish` |
| Images scattered across 3 tables | **Single source — only cat_skus** |

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `sku_code` | TEXT UNIQUE | Human-readable |
| `sku_type` | TEXT NOT NULL | VEHICLE \| ACCESSORY \| SERVICE |
| — **FKs** | — | — |
| `brand_id` | UUID FK → `cat_brands` | |
| `model_id` | UUID FK → `cat_models` | ⚠️ renamed from product_id |
| `vehicle_variant_id` | UUID FK → `cat_variants_vehicle` | when VEHICLE |
| `accessory_variant_id` | UUID FK → `cat_variants_accessory` | when ACCESSORY |
| `service_variant_id` | UUID FK → `cat_variants_service` | when SERVICE |
| — **Identity** | — | — |
| `name` | TEXT NOT NULL | "Starlight Blue Gloss" / "Activa Fitment" / "Platinum" |
| `slug` | TEXT UNIQUE | |
| `status` | TEXT | ACTIVE \| INACTIVE \| ARCHIVED |
| `position` | INTEGER | |
| `is_primary` | BOOLEAN | Primary display for variant |
| `price_base` | NUMERIC | Base ex-showroom |
| — **Colour** (Vehicle) | — | — |
| `hex_primary` | TEXT | "#1A3F8C" |
| `hex_secondary` | TEXT | "#C0C0C0" |
| `color_name` | TEXT | "Starlight Blue" |
| `finish` | TEXT | CHECK IN (GLOSS, MATTE, METALLIC, CHROME) |
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

**38 columns. Zero JSONB.**

---

### 8️⃣ `cat_price_mh` 🆕 — Pricing (All Flat)

| Before | After |
|--------|-------|
| `price_mh` = 1 JSONB blob | 52 flat columns |
| `price_mh->'rto'->'STATE'->>'roadTax'` | `rto_state_road_tax` |

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `sku_id` | UUID FK UNIQUE → `cat_skus` | 1 price per SKU |
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
| — **Addon 1** | — | 4 columns |
| `addon1_label` | TEXT | "Zero Depreciation" |
| `addon1_price` | INTEGER | |
| `addon1_gst` | INTEGER | |
| `addon1_total` | INTEGER | |
| `addon1_default` | BOOLEAN | |
| — **Addon 2** | — | 4 columns |
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

**52 columns. Zero JSONB.**

---

## 📊 Full Relationship Chain

```
cat_brands
  └── cat_models (brand_id FK)  — display: Model / Product / Service
        ├── cat_variants_vehicle (model_id FK)     — display: Variant
        ├── cat_variants_accessory (model_id FK)   — display: Variant
        └── cat_variants_service (model_id FK)     — display: Plan
              └── cat_skus (brand_id + model_id + variant_id FKs)
                    │     display: Colour / Style / Tier
                    └── cat_price_mh (sku_id FK)

cat_specifications ← standalone blueprint, defines columns + validation for models & variants
```

---

## 🔗 Existing Tables — Status

| Table | Action | Why |
|-------|--------|-----|
| `cat_brands` | 🔧 Cleanup — DROP 2 JSONB cols | brand_logos, specifications |
| `cat_items` | 📦 Archive → rename `_v1_archive` | Replaced by cat_models + variants + skus |
| `cat_skus_linear` | 📦 Archive → rename `_v1_archive` | Replaced by normalized joins |
| `cat_assets` | 📦 Archive → rename `_v1_archive` | Media now on cat_skus |
| `cat_spec_schema` | 📦 Archive → rename `_v1_archive` | Replaced by cat_specifications |
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

### Phase 1: Create Empty Tables _(Risk: ZERO)_
```
1. CREATE cat_specifications
2. SEED cat_specifications (36 spec definitions)
3. CREATE cat_models  (renamed from cat_products)
4. CREATE cat_variants_vehicle
5. CREATE cat_variants_accessory
6. CREATE cat_variants_service
7. CREATE cat_skus
8. CREATE cat_price_mh
9. ALTER cat_brands — DROP 2 JSONB cols
```

### Phase 2: Migrate Data _(Risk: LOW)_
```
1. INSERT INTO cat_models FROM cat_items + cat_skus_linear
2. INSERT INTO cat_variants_vehicle (JSONB specs → flat columns)
3. INSERT INTO cat_variants_accessory
4. INSERT INTO cat_skus + color/media data
5. INSERT INTO cat_price_mh (JSONB price_mh → 52 flat columns)
```

### Phase 3: Verify _(Risk: ZERO)_
```
1. Row counts match
2. Price totals match
3. FK integrity OK
4. Required fields filled
5. ENUM values valid
```

### Phase 4: Update Code _(Risk: MEDIUM)_
```
1. Add HIERARCHY_LABELS constant
2. catalogFetcher.ts → simple JOINs on new tables
3. SystemCatalogLogic.ts → same
4. catalogMapper.ts → dramatically simplify
5. savePrices.ts → write to cat_price_mh
6. Product Studio → "Add Vehicle" / "Add Accessory" / "Add Service" buttons
7. supabase gen types
```

### Phase 5: Test _(Risk: ZERO)_
```
1. Marketplace catalog — all products visible
2. PDP — pricing, colours, specs correct
3. CRM quote — SKU selection
4. Admin pricing studio — save/publish
5. Filters — bodyType, braking_system, headlamp etc.
6. Compare page — specs side by side
```

### Phase 6: Archive _(Risk: LOW)_
```
1. RENAME cat_items → cat_items_v1_archive
2. RENAME cat_skus_linear → cat_skus_linear_v1_archive
3. RENAME cat_assets → cat_assets_v1_archive
4. RENAME cat_spec_schema → cat_spec_schema_v1_archive
```

---

## 📊 Final Summary

| # | Table | Cols | JSONB | Status | Display Label |
|---|-------|:----:|:-----:|--------|--------------|
| 1 | `cat_specifications` | 21 | ❌ | 🆕 | Blueprint |
| 2 | `cat_brands` | 10 | ❌ | 🔧 | Brand |
| 3 | `cat_models` | 15 | ❌ | 🆕 | Model / Product / Service |
| 4 | `cat_variants_vehicle` | 44 | ❌ | 🆕 | Variant |
| 5 | `cat_variants_accessory` | 12 | ❌ | 🆕 | Variant |
| 6 | `cat_variants_service` | 11 | ❌ | 🆕 | Plan |
| 7 | `cat_skus` | 38 | ❌ | 🆕 | Colour / Style / Tier |
| 8 | `cat_price_mh` | 52 | ❌ | 🆕 | Pricing |
| **Total** | **8 tables** | **~203** | **Zero** | | |

---

## 🔧 Code Constant — Hierarchy Labels

```typescript
// src/lib/constants/catalogLabels.ts
export const HIERARCHY_LABELS = {
  VEHICLE:   { model: 'Model',   variant: 'Variant', sku: 'Colour' },
  ACCESSORY: { model: 'Product', variant: 'Variant', sku: 'Style'  },
  SERVICE:   { model: 'Service', variant: 'Plan',    sku: 'Tier'   },
} as const;

// Usage in Studio:
// const labels = HIERARCHY_LABELS[product_type];
// <h2>Add {labels.model}</h2>
// <h2>Add {labels.variant}</h2>
// <h2>Add {labels.sku}</h2>
```

---

## ⚠️ Rules

1. **Zero JSONB** — पूरे catalog में कहीं भी
2. **`cat_specifications`** = Single Source of Truth for spec definitions
3. **Media सिर्फ `cat_skus`** पर — brand पर सिर्फ logo
4. **कोई DROP नहीं** — rename to `_v1_archive`
5. **Naming:** Vehicle=Model/Variant/Colour, Accessory=Product/Variant/Style, Service=Service/Plan/Tier
6. **Studio:** 3 entry points — Add Vehicle, Add Accessory, Add Service
7. **CRM tables मत छुओ** — post-launch
8. **cat_price_dealer, cat_ins_rules, cat_reg_rules** — already ठीक हैं


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
