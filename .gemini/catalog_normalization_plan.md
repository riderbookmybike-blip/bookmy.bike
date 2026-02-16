# 🏗️ Catalog Normalization Plan v4

> 📅 16 Feb 2026 · BookMyBike · Supabase `aytdeqjxxjxbgiyslubx`
> 🔄 v4 — Final decision: SKU Matrix universal, Units = Colour / Sub-Variant / Tier

---

## 🎯 Goal

`cat_items` + `cat_skus_linear` (JSONB mess) → **8 clean, normalized tables** — Zero JSONB, सब flat columns, proper naming per product type.

### Core Principles
1. **Zero JSONB** — पूरे catalog में कहीं भी
2. **`cat_specifications`** = Master Blueprint for all specs
3. **Media सिर्फ SKU level पर** — Brand पर सिर्फ logo
4. **कोई table DROP नहीं** — rename to `_v1_archive`
5. **SKU Matrix = universal** — Variant × Unit = SKU (all product types)
6. **7-step Studio flow** — same for all types, labels change dynamically

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

### ✅ After: Clean Naming Per Type

**🏍️ VEHICLE:**
```
Brand → Model → Variant → Colour
TVS   → Jupiter → Disc SmartXonnect → Starlight Blue Gloss
                    (trim level)        (paint colour)
```

**🎒 ACCESSORY:**
```
Brand → Product → Variant → Sub-Variant
Studds → Helmet → Half Face → Blue
                   (style)     (colour/fitment)

Arihant → Crash Guard → Standard → Activa Fitment
                          (tier)    (vehicle compatibility)
```

**🔧 SERVICE:**
```
Brand → Service → Plan → Tier
BookMyBike → Extended Warranty → 2 Year Comprehensive → Platinum
                                  (coverage plan)        (pricing tier)
```

---

## 🧪 Why SKU Matrix Works For ALL Types

### The Universal Pattern: `Variant × Unit = SKU`

Every product type has 2 dimensions that combine to create unique purchasable items:

| Type | Example | Variant (Rows) | Unit (Columns) | SKU = Cell |
|------|---------|----------------|-----------------|------------|
| **Vehicle** | TVS Jupiter | Disc, Drum, SmartXonnect | Starlight Blue, Coral Red | Disc × Starlight Blue |
| **Accessory (colours)** | Studds Helmet | Half Face, Full Face | Blue, Red, Purple | Half Face × Blue |
| **Accessory (fitment)** | Arihant Crash Guard | Standard, Premium Silver | Activa, Jupiter, Fascino | Standard × Activa |
| **Service** | Extended Warranty | Gold Plan, Silver Plan | 1yr, 2yr, 3yr | Gold × 2yr |

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
Step 5: SKU Matrix       ← Variant × Unit grid (universal)
Step 6: Review
Step 7: Publish
```

| Step | Vehicle | Accessory | Service |
|------|---------|-----------|---------|
| 1 | Brand & Type | Brand & Type | Brand & Type |
| 2 | **Model** (Jupiter) | **Product** (Helmet) | **Service** (Warranty) |
| 3 | **Variants** (Disc, Drum) | **Variants** (Half Face, Full Face) | **Plans** (Gold, Silver) |
| 4 | **Colours** (Blue, Red) | **Sub-Variants** (Blue, Red / Activa) | **Tiers** (1yr, 2yr) |
| 5 | SKU Matrix | SKU Matrix | SKU Matrix |
| 6 | Review | Review | Review |
| 7 | Publish | Publish | Publish |

> **Key:** Step 4 "Unit" dimension is flexible:
> - Vehicle → always colours (hex codes, finish)
> - Accessory → could be colours (helmet) OR vehicle fitments (crash guard) OR sizes
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

### 3️⃣ `cat_models` 🆕 — Model / Product / Service Master

> ⚠️ **Renamed from `cat_products`** → `cat_models`
> - Vehicle → "Model" (Jupiter, Splendor)
> - Accessory → "Product" (Crash Guard, Helmet)
> - Service → "Service" (Extended Warranty)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `brand_id` | UUID FK → `cat_brands` | |
| `name` | TEXT NOT NULL | "Jupiter", "Crash Guard", "Extended Warranty" |
| `slug` | TEXT UNIQUE | |
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
| `slug` | TEXT UNIQUE | |
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

### 7️⃣ `cat_skus` 🆕 — Final Purchasable Unit + ALL Media

> **Display name per type:**
> - Vehicle → **"Colour"** (Starlight Blue Gloss)
> - Accessory → **"Sub-Variant"** (Blue / Activa Fitment)
> - Service → **"Tier"** (Platinum)
>
> **Every cell in SKU Matrix = 1 row in this table.**
> **Each row = separate inventory, separate price, separate media.**

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
| `name` | TEXT NOT NULL | "Starlight Blue Gloss" / "Activa Fitment" / "Platinum" |
| `slug` | TEXT UNIQUE | |
| `status` | TEXT | ACTIVE \| INACTIVE \| ARCHIVED |
| `position` | INTEGER | |
| `is_primary` | BOOLEAN | Primary display for variant |
| `price_base` | NUMERIC | Base ex-showroom |
| — **Colour** (Vehicle + some Accessories) | — | — |
| `hex_primary` | TEXT | "#1A3F8C" |
| `hex_secondary` | TEXT | "#C0C0C0" |
| `color_name` | TEXT | "Starlight Blue" |
| `finish` | TEXT | CHECK IN (GLOSS, MATTE, METALLIC, CHROME) |
| — **Fitment** (some Accessories) | — | — |
| `fitment_vehicle` | TEXT | "Activa" — vehicle this fits |
| `fitment_model_id` | UUID FK → `cat_models` | Optional FK to parent vehicle model |
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

**40 columns. Zero JSONB.**

> 🆕 Added `fitment_vehicle` + `fitment_model_id` — for accessories like Crash Guards where
> the Unit dimension is vehicle compatibility, not colour.

---

### 8️⃣ `cat_price_mh` 🆕 — Pricing (All Flat)

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
                    │     display: Colour / Sub-Variant / Tier
                    │     ⬆ Each cell in SKU Matrix = 1 row here
                    └── cat_price_mh (sku_id FK)

cat_specifications ← standalone blueprint, defines columns + validation
```

**Example Trace — Crash Guard Standard for Activa:**
```
cat_brands         → Arihant (id: abc)
cat_models         → Crash Guard (brand_id: abc, product_type: ACCESSORY)
cat_variants_acc   → Standard (model_id: crash-guard-id)
cat_skus           → "Activa Fitment" (accessory_variant_id: standard-id, fitment_vehicle: "Activa")
cat_price_mh       → ex_showroom: 850 (sku_id: activa-fitment-id)
```

**Example Trace — Studds Helmet Half Face Blue:**
```
cat_brands         → Studds (id: xyz)
cat_models         → Helmet (brand_id: xyz, product_type: ACCESSORY)
cat_variants_acc   → Half Face (model_id: helmet-id)
cat_skus           → "Blue" (accessory_variant_id: half-face-id, color_name: Blue, hex_primary: #0000FF)
cat_price_mh       → ex_showroom: 1200 (sku_id: blue-id)
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

### Phase 1: Create Empty Tables _(Risk: ZERO)_
```
1. CREATE cat_specifications
2. SEED cat_specifications (36+ spec definitions)
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
4. INSERT INTO cat_skus + color/fitment/media data
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
1. Update HIERARCHY_LABELS → sku label: Colour / Sub-Variant / Tier
2. catalogFetcher.ts → simple JOINs on new tables
3. SystemCatalogLogic.ts → same
4. catalogMapper.ts → dramatically simplify
5. savePrices.ts → write to cat_price_mh
6. Product Studio → already has "Add Vehicle" / "Add Accessory" / "Add Service" ✅
7. UnitStep.tsx → handle both colour entry AND fitment entry based on context
8. MatrixStep.tsx → works as-is (Variant × Unit cells)
9. supabase gen types
```

### Phase 5: Test _(Risk: ZERO)_
```
1. Marketplace catalog — all products visible
2. PDP — pricing, colours, specs correct
3. CRM quote — SKU selection
4. Admin pricing studio — save/publish
5. Filters — bodyType, braking_system, headlamp etc.
6. Compare page — specs side by side
7. Accessories — Helmet (colour matrix) + Crash Guard (fitment matrix) both work
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
| 7 | `cat_skus` | 40 | ❌ | 🆕 | Colour / Sub-Variant / Tier |
| 8 | `cat_price_mh` | 52 | ❌ | 🆕 | Pricing |
| **Total** | **8 tables** | **~205** | **Zero** | | |

---

## 🔧 Code Constant — Hierarchy Labels

```typescript
// src/lib/constants/catalogLabels.ts
export const HIERARCHY_LABELS = {
  VEHICLE:   { model: 'Model',   variant: 'Variant', sku: 'Colour' },
  ACCESSORY: { model: 'Product', variant: 'Variant', sku: 'Sub-Variant' },
  SERVICE:   { model: 'Service', variant: 'Plan',    sku: 'Tier'   },
} as const;

// Usage in Studio:
// const labels = HIERARCHY_LABELS[product_type];
// Step 2: <h2>Add {labels.model}</h2>     → "Add Model" / "Add Product" / "Add Service"
// Step 3: <h2>Add {labels.variant}</h2>   → "Add Variant" / "Add Variant" / "Add Plan"
// Step 4: <h2>Add {labels.sku}</h2>       → "Add Colour" / "Add Sub-Variant" / "Add Tier"
// Step 5: SKU Matrix                       → Variant × Colour / Variant × Sub-Variant / Plan × Tier
```

---

## ⚠️ Rules

1. **Zero JSONB** — पूरे catalog में कहीं भी
2. **`cat_specifications`** = Single Source of Truth for spec definitions
3. **Media सिर्फ `cat_skus`** पर — brand पर सिर्फ logo
4. **कोई DROP नहीं** — rename to `_v1_archive`
5. **Naming:** Vehicle=Model/Variant/Colour, Accessory=Product/Variant/Sub-Variant, Service=Service/Plan/Tier
6. **Studio:** 3 entry points — Add Vehicle, Add Accessory, Add Service ✅ (DONE)
7. **SKU Matrix universal** — Variant × Unit = SKU (all types, all products)
8. **CRM tables मत छुओ** — post-launch
9. **cat_price_dealer, cat_ins_rules, cat_reg_rules** — already ठीक हैं

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
-- Just add a new SKU — no schema change needed!
INSERT INTO cat_skus (sku_type, brand_id, model_id, accessory_variant_id, name, fitment_vehicle, fitment_model_id, ...)
VALUES ('ACCESSORY', 'arihant-id', 'crash-guard-id', 'standard-id', 'Pulsar NS200 Fitment', 'Pulsar NS200', 'pulsar-model-id');
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
| DB: cat_specifications table | ⏳ Phase 1 |
| DB: cat_models table | ⏳ Phase 1 |
| DB: cat_variants_* tables | ⏳ Phase 1 |
| DB: cat_skus table | ⏳ Phase 1 |
| DB: cat_price_mh table | ⏳ Phase 1 |
| Data migration | ⏳ Phase 2 |
| Code updates (fetchers, mappers) | ⏳ Phase 4 |
| Archive old tables | ⏳ Phase 6 |
