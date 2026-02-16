# 🏗️ Catalog Normalization Migration Plan

> **Date:** 16 Feb 2026  
> **Project:** BookMyBike (bookmy.bike)  
> **Supabase Project:** aytdeqjxxjxbgiyslubx  
> **Author:** Ajit × AI Assistant

---

## 🎯 GOAL

`cat_items` (self-referencing parent_id hierarchy) और `cat_skus_linear` (JSONB blobs) को **पूरी तरह normalized, flat-column tables** में बदलना —
ताकि हर field validated, indexed, और Supabase Table Editor से editable हो।

### Core Principles
1. **Zero JSONB** — पूरे catalog में कहीं भी JSONB नहीं
2. **Media सिर्फ SKU level पर** — Brand पर सिर्फ logo, बाकी कहीं नहीं
3. **कोई table DROP नहीं** — पहले migrate, test, verify, फिर archive
4. **Vehicle / Accessory / Service** — Variant stage से अलग tables
5. **Foreign Keys everywhere** — data integrity DB level पर enforce

---

## 📈 EXPECTATIONS

### Migration के बाद क्या होगा:
| Before | After |
|--------|-------|
| `cat_items` — 1 table, 4 levels, JSONB specs | 6-8 focused tables, flat columns |
| `cat_skus_linear` — JSONB blobs (product_json, variant_json, unit_json) | Clean FK joins, no reconstruction needed |
| `price_mh` JSONB blob | `cat_price_mh` dedicated table, ~40 flat columns |
| No validation — garbage data possible | CHECK constraints, NOT NULL, FK integrity |
| Complex TypeScript mappers (reconstructHierarchy, catalogMapper) | Simple Supabase `.select('*, variant:cat_variants_vehicle(*)')` |
| Catalog bugs (missing type, wrong bodyType) | Impossible — schema IS the contract |

### Risk Mitigation:
- पुरानी tables **archive** होंगी, DROP नहीं
- हर phase के बाद **verify** करेंगे
- Rollback possible रहेगा

---

## 📋 PHASE 1 — TABLE DEFINITIONS

### Table 1: `cat_brands` ✅ ALREADY EXISTS (needs cleanup)

**Purpose:** Master brand registry  
**Current Status:** EXISTS — 12 columns, has JSONB (brand_logos, specifications) जो हटाने हैं  
**Row Count:** ~15 brands

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `name` | TEXT | NO | — | "HONDA", "TVS" |
| `slug` | TEXT | NO | — | "honda", "tvs" (UNIQUE) |
| `logo_url` | TEXT | YES | — | Single logo image URL |
| `logo_svg` | TEXT | YES | — | Inline SVG for fast rendering |
| `website_url` | TEXT | YES | — | Official brand website |
| `brand_category` | TEXT | YES | 'VEHICLE' | VEHICLE \| ACCESSORY \| SERVICE |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Columns to DROP:** `brand_logos` (JSONB), `specifications` (JSONB)  
**Action:** ALTER TABLE — remove 2 JSONB columns

---

### Table 2: `cat_products` 🆕 NEW TABLE

**Purpose:** Product master (Jupiter, Splendor Plus, Activa)  
**Source:** Extract from `cat_items WHERE type = 'PRODUCT'` + `cat_skus_linear.product_json`  
**Expected Rows:** ~20 products

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `brand_id` | UUID | NO | — | FK → cat_brands(id) |
| `name` | TEXT | NO | — | "Jupiter", "Splendor Plus" |
| `slug` | TEXT | NO | — | "jupiter", "splendor-plus" (UNIQUE) |
| `product_type` | TEXT | NO | 'VEHICLE' | VEHICLE \| ACCESSORY \| SERVICE |
| `body_type` | TEXT | YES | — | MOTORCYCLE \| SCOOTER \| MOPED \| null (accessories) |
| `engine_cc` | NUMERIC(6,1) | YES | — | 109.7 (product-level shared spec) |
| `fuel_type` | TEXT | YES | 'PETROL' | PETROL \| EV \| CNG |
| `emission_standard` | TEXT | YES | — | "BS6" |
| `hsn_code` | TEXT | YES | — | GST HSN code |
| `item_tax_rate` | NUMERIC(4,2) | YES | 18 | GST rate |
| `position` | INTEGER | YES | 0 | Display order within brand |
| `status` | TEXT | YES | 'ACTIVE' | ACTIVE \| INACTIVE \| ARCHIVED |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: 15 columns. Zero JSONB.**

---

### Table 3: `cat_variants_vehicle` 🆕 NEW TABLE

**Purpose:** Vehicle variant with ALL specs as flat columns  
**Source:** Extract from `cat_items WHERE type = 'VARIANT'` + `cat_skus_linear.variant_json` + `specs`  
**Expected Rows:** ~43 vehicle variants

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `product_id` | UUID | NO | — | FK → cat_products(id) |
| `name` | TEXT | NO | — | "Disc SmartXonnect" |
| `slug` | TEXT | YES | — | UNIQUE |
| `position` | INTEGER | YES | 0 | |
| `status` | TEXT | YES | 'ACTIVE' | |
| — **Engine** | — | — | — | — |
| `engine_type` | TEXT | YES | — | "Single Cylinder, 4-Stroke" |
| `displacement` | TEXT | YES | — | "113.3 cc" |
| `max_power` | TEXT | YES | — | "5.9 KW @ 6500 RPM" |
| `max_torque` | TEXT | YES | — | "9.8 Nm @ 4500 RPM" |
| `num_valves` | INTEGER | YES | — | 2 |
| `transmission` | TEXT | YES | — | "CVT Automatic" |
| `air_filter` | TEXT | YES | — | "Viscous Paper Type" |
| `battery` | TEXT | YES | — | "12V, 5Ah MF" |
| `mileage` | TEXT | YES | — | "57 km/l" |
| `start_type` | TEXT | YES | — | "Electric Silent Start" |
| — **Brakes & Suspension** | — | — | — | — |
| `front_brake` | TEXT | YES | — | "Disc, 220mm" |
| `rear_brake` | TEXT | YES | — | "Drum, 130mm" |
| `braking_system` | TEXT | YES | — | "SBT" \| "CBS" \| "ABS" |
| `front_suspension` | TEXT | YES | — | "Telescopic Hydraulic" |
| `rear_suspension` | TEXT | YES | — | "Twin Tube Emulsion SPA" |
| — **Dimensions** | — | — | — | — |
| `kerb_weight` | TEXT | YES | — | "106 Kg" |
| `ground_clearance` | TEXT | YES | — | "163mm" |
| `ground_reach` | TEXT | YES | — | — |
| `seat_length` | TEXT | YES | — | — |
| `wheelbase` | TEXT | YES | — | "1275mm" |
| `vehicle_size` | TEXT | YES | — | "1848 x 665 x 1158 mm" |
| — **Features** | — | — | — | — |
| `wheel_type` | TEXT | YES | — | "Alloy" \| "Spoke" |
| `tyre_size` | TEXT | YES | — | "F: 90/90-12, R: 90/90-10" |
| `headlamp` | TEXT | YES | — | "LED" |
| `tail_lamp` | TEXT | YES | — | "LED" |
| `fuel_capacity` | TEXT | YES | — | "5.1 L" |
| `under_seat_storage` | TEXT | YES | — | "33 L" |
| `front_leg_space` | TEXT | YES | — | — |
| `glove_box` | TEXT | YES | — | "Yes" |
| — **Metadata** | — | — | — | — |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: ~38 columns. Zero JSONB. हर spec queryable + indexable.**

---

### Table 4: `cat_variants_accessory` 🆕 NEW TABLE

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
| `suitable_for` | TEXT | YES | — | "Jupiter, Activa" (compatibility) |
| `material` | TEXT | YES | — | |
| `weight` | TEXT | YES | — | |
| `finish` | TEXT | YES | — | "GLOSS" \| "MATTE" |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: 12 columns. Zero JSONB.**

---

### Table 5: `cat_variants_service` 🆕 NEW TABLE (Future-ready)

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
| `coverage_type` | TEXT | YES | — | COMPREHENSIVE \| THIRD_PARTY |
| `labor_included` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: 11 columns. Zero JSONB.**

---

### Table 6: `cat_skus` 🆕 NEW TABLE (Unified SKU + Media)

**Purpose:** Final purchasable unit — सारी media यहीं। Color identity + images + videos सब यहाँ।  
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
| `finish` | TEXT | YES | — | "GLOSS" \| "MATTE" \| "METALLIC" |
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
| `media_shared` | BOOLEAN | YES | false | अगर true → इस SKU की media, इसके variant की सारी SKUs को apply होगी |
| — **Metadata** | — | — | — | — |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: ~38 columns. Zero JSONB.**

**`media_shared` कैसे काम करेगा:**
- अगर variant "Jupiter Disc" की 3 colors हैं (Blue, Red, Grey)
- और सबकी images same हैं (generic product shot)
- तो सिर्फ 1 SKU पर `media_shared = true` set करो
- Code उस SKU की images सारी sibling SKUs को दिखाएगा
- जब individual color images आवें, तो `media_shared = false` करो और हर SKU पर अपनी images डालो

---

### Table 7: `cat_price_mh` 🆕 NEW TABLE (Zero JSONB Pricing)

**Purpose:** Maharashtra state pricing — every field a flat column  
**Source:** Extract from `cat_skus_linear.price_mh`  
**Expected Rows:** ~144 (one per vehicle SKU)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `sku_id` | UUID | NO | — | FK → cat_skus(id), UNIQUE |
| — **Core Pricing** | — | — | — | — |
| `ex_showroom` | INTEGER | NO | — | ₹74,469 — CHECK (ex_showroom > 0) |
| `on_road_price` | INTEGER | NO | — | ₹88,101 — CHECK (on_road_price >= ex_showroom) |
| `gst_rate` | NUMERIC(4,2) | YES | 0.18 | |
| `hsn_code` | TEXT | YES | — | |
| — **RTO — STATE Registration** | — | — | — | — |
| `rto_total` | INTEGER | NO | 0 | Grand total of selected RTO type |
| `rto_default_type` | TEXT | YES | 'STATE' | STATE \| BH \| COMPANY — which is active |
| `rto_state_road_tax` | INTEGER | YES | 0 | |
| `rto_state_cess` | INTEGER | YES | 0 | |
| `rto_state_postal` | INTEGER | YES | 70 | |
| `rto_state_smart_card` | INTEGER | YES | 200 | |
| `rto_state_registration` | INTEGER | YES | 300 | |
| `rto_state_total` | INTEGER | YES | 0 | Sum of above |
| — **RTO — BH Registration** | — | — | — | — |
| `rto_bh_road_tax` | INTEGER | YES | 0 | |
| `rto_bh_cess` | INTEGER | YES | 0 | |
| `rto_bh_postal` | INTEGER | YES | 70 | |
| `rto_bh_smart_card` | INTEGER | YES | 200 | |
| `rto_bh_registration` | INTEGER | YES | 300 | |
| `rto_bh_total` | INTEGER | YES | 0 | |
| — **RTO — COMPANY Registration** | — | — | — | — |
| `rto_company_road_tax` | INTEGER | YES | 0 | |
| `rto_company_cess` | INTEGER | YES | 0 | |
| `rto_company_postal` | INTEGER | YES | 70 | |
| `rto_company_smart_card` | INTEGER | YES | 200 | |
| `rto_company_registration` | INTEGER | YES | 300 | |
| `rto_company_total` | INTEGER | YES | 0 | |
| — **Insurance — OD (Own Damage)** | — | — | — | — |
| `ins_od_base` | INTEGER | YES | 0 | |
| `ins_od_gst` | INTEGER | YES | 0 | |
| `ins_od_total` | INTEGER | YES | 0 | |
| — **Insurance — TP (Third Party)** | — | — | — | — |
| `ins_tp_base` | INTEGER | YES | 0 | |
| `ins_tp_gst` | INTEGER | YES | 0 | |
| `ins_tp_total` | INTEGER | YES | 0 | |
| — **Insurance — PA** | — | — | — | — |
| `ins_pa` | INTEGER | YES | 0 | |
| — **Insurance — Totals** | — | — | — | — |
| `ins_gst_total` | INTEGER | YES | 0 | |
| `ins_gst_rate` | INTEGER | YES | 18 | |
| `ins_base_total` | INTEGER | YES | 0 | |
| `ins_net_premium` | INTEGER | YES | 0 | |
| `ins_total` | INTEGER | NO | 0 | Grand total insurance |
| — **Insurance — Addon 1 (Zero Depreciation)** | — | — | — | — |
| `addon1_label` | TEXT | YES | 'Zero Depreciation' | |
| `addon1_price` | INTEGER | YES | 0 | |
| `addon1_gst` | INTEGER | YES | 0 | |
| `addon1_total` | INTEGER | YES | 0 | |
| `addon1_default` | BOOLEAN | YES | false | Auto-selected? |
| — **Insurance — Addon 2 (PA Cover)** | — | — | — | — |
| `addon2_label` | TEXT | YES | 'Personal Accident Cover' | |
| `addon2_price` | INTEGER | YES | 0 | |
| `addon2_gst` | INTEGER | YES | 0 | |
| `addon2_total` | INTEGER | YES | 0 | |
| `addon2_default` | BOOLEAN | YES | false | |
| — **Publishing** | — | — | — | — |
| `publish_stage` | TEXT | YES | 'DRAFT' | DRAFT \| PUBLISHED \| ARCHIVED |
| `published_at` | TIMESTAMPTZ | YES | — | |
| `published_by` | UUID | YES | — | |
| `is_popular` | BOOLEAN | YES | false | |
| — **Metadata** | — | — | — | — |
| `created_at` | TIMESTAMPTZ | YES | now() | |
| `updated_at` | TIMESTAMPTZ | YES | now() | |

**Total: ~52 columns. ZERO JSONB. हर pricing field individually queryable, sortable, constraintable.**

---

## 📊 PHASE 2 — CURRENT TABLE STATUS

### Tables जो EXIST करती हैं:

| Table | Status | Action |
|-------|--------|--------|
| `cat_brands` | ✅ EXISTS — 12 cols | 🔧 REFACTOR: DROP `brand_logos` (JSONB), `specifications` (JSONB) |
| `cat_items` | ✅ EXISTS — 29 cols | 📦 ARCHIVE: Data extract → new tables, फिर rename to `cat_items_archive` |
| `cat_skus_linear` | ✅ EXISTS — 23 cols | 📦 ARCHIVE: Data extract → new tables, फिर rename to `cat_skus_linear_archive` |
| `cat_assets` | ✅ EXISTS — 13 cols | 🔎 EVALUATE: Media अब cat_skus में, ये table redundant हो सकती है |
| `cat_hsn_codes` | ✅ EXISTS — 11 cols | ✅ KEEP AS-IS: Reference table, not affected |
| `cat_ins_rules` | ✅ EXISTS — 17 cols | ✅ KEEP AS-IS: Insurance rule engine |
| `cat_reg_rules` | ✅ EXISTS — 14 cols | ✅ KEEP AS-IS: RTO rule engine |
| `cat_regional_configs` | ✅ EXISTS — 8 cols | ✅ KEEP AS-IS: Regional settings |
| `cat_price_dealer` | ✅ EXISTS — 17 cols | ✅ KEEP AS-IS: Dealer offer pricing |
| `cat_services` | ✅ EXISTS — 11 cols | 🔎 EVALUATE: May merge into cat_variants_service |
| `cat_spec_schema` | ✅ EXISTS — 13 cols | 🔎 EVALUATE: Spec definitions — may become redundant with flat cols |
| `cat_item_compatibility` | ✅ EXISTS — 7 cols | ✅ KEEP AS-IS: Cross-product compatibility |
| `cat_item_ingestion_sources` | ✅ EXISTS — 7 cols | ✅ KEEP AS-IS: Source URL tracking |
| `cat_recommendations` | ✅ EXISTS — 5 cols | ✅ KEEP AS-IS: Product recommendations |
| `cat_raw_items` | ✅ EXISTS — 17 cols | ✅ KEEP AS-IS: Raw ingestion staging |
| `cat_price_state_archive` | ✅ EXISTS — 25 cols | ✅ KEEP AS-IS: Already archived |
| `catalog_audit_log` | ✅ EXISTS — 10 cols | ✅ KEEP AS-IS: Audit trail |
| `cat_item_hierarchy_archive` | ✅ EXISTS — 2 cols | ✅ KEEP AS-IS: Already archived |

### Tables जो CREATE करनी हैं:

| Table | Status | Depends On |
|-------|--------|-----------|
| `cat_products` | 🆕 CREATE | cat_brands |
| `cat_variants_vehicle` | 🆕 CREATE | cat_products |
| `cat_variants_accessory` | 🆕 CREATE | cat_products |
| `cat_variants_service` | 🆕 CREATE | cat_products |
| `cat_skus` | 🆕 CREATE | cat_brands, cat_products, cat_variants_* |
| `cat_price_mh` | 🆕 CREATE | cat_skus |

---

## 🔄 PHASE 3 — EXECUTION PLAN (Phase-by-Phase)

### Phase 3.1: Create Empty Tables (Schema Only)
```
1. CREATE cat_products
2. CREATE cat_variants_vehicle
3. CREATE cat_variants_accessory
4. CREATE cat_variants_service
5. CREATE cat_skus
6. CREATE cat_price_mh
7. ALTER cat_brands — DROP JSONB columns
```
**Risk:** ZERO — सिर्फ empty tables बन रही हैं, कुछ तूट नहीं सकता

### Phase 3.2: Migrate Data (INSERT from old tables)
```
1. INSERT INTO cat_products FROM cat_items/cat_skus_linear
2. INSERT INTO cat_variants_vehicle FROM cat_items/cat_skus_linear
3. INSERT INTO cat_variants_accessory FROM cat_items/cat_skus_linear
4. INSERT INTO cat_skus FROM cat_items/cat_skus_linear
5. INSERT INTO cat_price_mh FROM cat_skus_linear.price_mh (JSONB → flat)
```
**Risk:** LOW — old tables अभी भी exist करती हैं, app old tables से पढ़ रहा है

### Phase 3.3: Verify Data Integrity
```
1. Row count matching — old vs new
2. Price calculation verification — JSONB totals vs flat column totals
3. FK integrity — सारे references valid
4. Null check — कोई required field empty तो नहीं
```

### Phase 3.4: Update Application Code
```
1. catalogFetcher.ts — new tables से read
2. SystemCatalogLogic.ts — new tables से read
3. catalogMapper.ts — simplify (no more reconstructHierarchy)
4. savePrices.ts — new table को write
5. Admin catalog pages — new tables
6. TypeScript types regenerate
```
**Risk:** MEDIUM — यहाँ सबसे ज़्यादा ध्यान लगेगा

### Phase 3.5: Test Everything
```
1. Marketplace catalog page — सारे 12 products दिखें
2. PDP pages — pricing, colors, specs सब correct
3. CRM quote creation — SKU selection, pricing
4. Admin pricing studio — save/publish flow
5. Dossier/PDF generation — pricing breakdown
```

### Phase 3.6: Archive Old Tables
```
1. ALTER TABLE cat_items RENAME TO cat_items_v1_archive
2. ALTER TABLE cat_skus_linear RENAME TO cat_skus_linear_v1_archive
```
**DROP कभी नहीं — सिर्फ rename**

---

## 📊 Table Summary

| # | Table | Columns | JSONB | Status | Media |
|---|-------|---------|-------|--------|-------|
| 1 | cat_brands | 10 | ❌ | 🔧 Refactor | Logo only |
| 2 | cat_products | 15 | ❌ | 🆕 Create | ❌ None |
| 3 | cat_variants_vehicle | 38 | ❌ | 🆕 Create | ❌ None |
| 4 | cat_variants_accessory | 12 | ❌ | 🆕 Create | ❌ None |
| 5 | cat_variants_service | 11 | ❌ | 🆕 Create | ❌ None |
| 6 | cat_skus | 38 | ❌ | 🆕 Create | ✅ ALL media here |
| 7 | cat_price_mh | 52 | ❌ | 🆕 Create | ❌ None |
| **Total** | **7 tables** | **~176** | **Zero** | | |

---

## ⚠️ IMPORTANT RULES

1. **कोई JSONB नहीं** — पूरे catalog में कहीं भी
2. **Media सिर्फ cat_skus पर** — brand पर सिर्फ logo_url + logo_svg
3. **पुरानी tables DROP नहीं** — पहले rename to _archive
4. **हर phase verify करो** — अगले phase पर तभी जाओ जब पिछला 100% verified
5. **cat_price_dealer, cat_ins_rules, cat_reg_rules** को मत छुओ — ये already ठीक हैं
6. **CRM tables मत छुओ** — वो Phase 2 (post-launch) में
