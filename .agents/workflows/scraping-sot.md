---
description: Source of Truth for catalog scraping, ingestion, and seeding. Contains all active table schemas, relationships, and the step-by-step workflow for adding a new vehicle model.
---

# Catalog Scraping & Seeding — Source of Truth

> **Last Updated:** 2026-02-23
> **Key File:** `src/actions/catalog/catalogV2Actions.ts`
> **Scraper File:** `src/actions/catalog/scraperAction.ts`

---

## 1. Active Database Tables (Current Schema)

### ⚠️ DEPRECATED — Do NOT use these tables:
| Table | Status |
|---|---|
| `cat_items` | ❌ DROPPED — replaced by `cat_models + cat_variants_* + cat_skus` |
| `cat_skus_linear` | ❌ DROPPED — replaced by `cat_skus` |
| `cat_price_state` | ❌ DROPPED — replaced by `cat_price_state_mh` |
| `cat_assets` | ⚠️ LEGACY — still exists but not primary |

---

### A. `cat_brands` — Read-only (pre-seeded)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | TEXT | e.g. "Suzuki" |
| slug | TEXT | e.g. "suzuki" |
| is_active | BOOLEAN | Only active brands are listed |

**CRUD:** `listBrands()` — read-only.
**Status:** HERO, TVS, HONDA, BAJAJ, SUZUKI, YAMAHA already seeded.

---

### B. `cat_models` — One per product line
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| brand_id | UUID | FK → cat_brands |
| name | TEXT | e.g. "Access 125" |
| slug | TEXT | Auto-generated from name |
| product_type | ENUM | `VEHICLE` / `ACCESSORY` / `SERVICE` |
| body_type | TEXT | `SCOOTER` / `MOTORCYCLE` / `MOPED` |
| engine_cc | NUMERIC | e.g. 124 |
| fuel_type | TEXT | e.g. `PETROL` |
| emission_standard | TEXT | CHECK: `BS6` / `BS6_STAGE2` / `BS4` |
| hsn_code | TEXT | Optional |
| item_tax_rate | NUMERIC | Optional (GST %) |
| position | INT | Display ordering |
| status | ENUM | `DRAFT` / `ACTIVE` |

**CRUD:** `createModel()`, `updateModel()`, `deleteModel()`, `listModels(brandId)`, `getModel(id)`

#### DB Enum Reference (CHECK constraints)
> ⚠️ All values are **UPPERCASE**. Using display labels (e.g. "Analog") will fail.

| Column | Table | Allowed Values |
|---|---|---|
| emission_standard | cat_models | `BS6`, `BS6_STAGE2`, `BS4` |
| body_type | cat_models | `SCOOTER`, `MOTORCYCLE`, `MOPED`, `ELECTRIC` |
| fuel_type | cat_models | `PETROL`, `EV`, `CNG`, `DIESEL` |
| finish | cat_colours / cat_skus | `GLOSS`, `MATTE`, `CHROME`, `CARBON` |
| transmission | cat_variants_vehicle | `MANUAL`, `CVT_AUTOMATIC`, `AMT`, `DCT` |
| start_type | cat_variants_vehicle | `KICK`, `ELECTRIC`, `KICK_ELECTRIC`, `SILENT_START` |
| console_type | cat_variants_vehicle | `ANALOG`, `DIGITAL`, `SEMI_DIGITAL_ANALOG`, `DIGITAL_TFT` |
| braking_system | cat_variants_vehicle | `SBT`, `CBS`, `ABS`, `DUAL_ABS` |
| mileage column | cat_variants_vehicle | Use `mileage_arai` (NOT `mileage`) |

---

### C. `cat_variants_vehicle` — One per variant (trim level)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| model_id | UUID | FK → cat_models |
| name | TEXT | e.g. "Ride Connect TFT ABS Edition" |
| slug | TEXT | Auto-generated |
| position | INT | Display ordering |
| status | ENUM | `DRAFT` / `ACTIVE` |
| **Engine** | | |
| engine_type | TEXT | e.g. "4-Stroke, Single Cylinder" |
| displacement | NUMERIC(6,1) | e.g. 124.0 |
| max_power | TEXT | e.g. "8.4 PS @ 6500 rpm" |
| max_torque | TEXT | e.g. "10.2 Nm @ 5000 rpm" |
| num_valves | INT | |
| transmission | TEXT | e.g. "CVT" |
| air_filter | TEXT | |
| mileage | NUMERIC(5,1) | e.g. 47.0 |
| start_type | TEXT | e.g. "Self Start" |
| **Brakes** | | |
| front_brake | TEXT | e.g. "Disc" |
| rear_brake | TEXT | e.g. "Drum" |
| braking_system | TEXT | e.g. "CBS" / "ABS" |
| front_suspension | TEXT | |
| rear_suspension | TEXT | |
| **Dimensions** | | |
| kerb_weight | INT | in kg |
| seat_height | NUMERIC | in mm |
| ground_clearance | NUMERIC | in mm |
| wheelbase | NUMERIC | in mm |
| fuel_capacity | NUMERIC(4,1) | in litres |
| **Electrical** | | |
| console_type | TEXT | "LCD" / "Digital" / "TFT" |
| led_headlamp | BOOLEAN | |
| led_tail_lamp | BOOLEAN | |
| usb_charging | BOOLEAN | |
| bluetooth | BOOLEAN | |
| navigation | BOOLEAN | |
| ride_modes | TEXT | |
| **Tyres** | | |
| front_tyre | TEXT | e.g. "90/90-12" |
| rear_tyre | TEXT | e.g. "90/100-10" |
| tyre_type | TEXT | "Tubeless" / "Tube" |

**CRUD:** `createVariant(productType, payload)`, `updateVariant()`, `deleteVariant()`, `listVariants(modelId, productType)`
**Note:** Variants are polymorphic — use `vehicle_variant_id` FK in `cat_skus`.

---

### D. `cat_colours` — Model-level colour pool
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| model_id | UUID | FK → cat_models |
| name | TEXT | e.g. "Pearl Grace White" |
| hex_primary | TEXT | e.g. "#FFFFFF" |
| hex_secondary | TEXT | Optional accent |
| finish | TEXT | "Metallic" / "Matte" / "Gloss" / "Pearl" |
| is_popular | BOOLEAN | |
| position | INT | Display ordering |

**CRUD:** `createColour()`, `updateColour()`, `deleteColour()`, `listColours(modelId)`
**Note:** Colours exist at the MODEL level. SKUs link to them via `colour_id`.

---

### E. `cat_skus` — Variant × Colour matrix = one SKU
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| sku_code | TEXT | Auto-generated 9-char code |
| sku_type | ENUM | `VEHICLE` / `ACCESSORY` / `SERVICE` |
| brand_id | UUID | FK → cat_brands |
| model_id | UUID | FK → cat_models |
| vehicle_variant_id | UUID | FK → cat_variants_vehicle (nullable) |
| accessory_variant_id | UUID | FK → cat_variants_accessory (nullable) |
| service_variant_id | UUID | FK → cat_variants_service (nullable) |
| colour_id | UUID | FK → cat_colours (nullable) |
| name | TEXT | e.g. "Access 125 Standard Edition - Pearl Grace White" |
| slug | TEXT | Auto-generated |
| status | ENUM | `DRAFT` / `ACTIVE` |
| position | INT | |
| is_primary | BOOLEAN | Primary SKU for the variant |
| price_base | NUMERIC | Base price (ex-showroom) |
| **Colour cache** | | |
| hex_primary | TEXT | Denormalized from cat_colours |
| hex_secondary | TEXT | Denormalized |
| color_name | TEXT | Denormalized |
| finish | TEXT | Denormalized |
| **Media** | | |
| primary_image | TEXT | URL |
| gallery_img_1..6 | TEXT | Up to 6 gallery images |
| video_url_1, _2 | TEXT | YouTube/Vimeo URLs |
| pdf_url_1 | TEXT | |
| has_360 | BOOLEAN | |
| **Display alignment** | | |
| zoom_factor | NUMERIC | Default 1.0 |
| is_flipped | BOOLEAN | Mirror state |
| offset_x | NUMERIC | Horizontal offset |
| offset_y | NUMERIC | Vertical offset |
| media_shared | BOOLEAN | Share media across colour variants |

**CRUD:** `createSku()`, `updateSku()`, `deleteSku()`, `listSkus(variantId, productType)`, `listSkusByModel(modelId)`

---

### F. `cat_price_state_mh` — Regional pricing (per SKU × state)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| sku_id | UUID | FK → cat_skus |
| state_code | TEXT | e.g. "MH" (unique with sku_id) |
| ex_showroom | NUMERIC | Ex-showroom price |
| ex_factory | NUMERIC | Same as ex_showroom |
| rto_total_state | NUMERIC | RTO charges |
| ins_own_damage_premium_amount | NUMERIC | OD premium |
| ins_own_damage_gst_amount | NUMERIC | GST on OD |
| ins_own_damage_total_amount | NUMERIC | OD total |
| ins_liability_only_premium_amount | NUMERIC | TP premium |
| ins_liability_only_gst_amount | NUMERIC | GST on TP |
| ins_liability_only_total_amount | NUMERIC | TP total |
| ins_gross_premium | NUMERIC | Total insurance |
| on_road_price | NUMERIC | Computed: ex_showroom + RTO + insurance |
| publish_stage | ENUM | `DRAFT` / `PUBLISHED` / `ARCHIVED` |
| is_popular | BOOLEAN | |

**CRUD:** `upsertPricing()`, `getPricing(skuId, stateCode)`, `listPricingForModel(modelId)`
**Unique constraint:** `(sku_id, state_code)`

---

## 2. Entity Relationships

```
cat_brands (1)
  └──► cat_models (N)
        ├──► cat_variants_vehicle (N per model)
        ├──► cat_variants_accessory (N per model)
        ├──► cat_variants_service (N per model)
        ├──► cat_colours (N per model)
        └──► cat_skus (N = variants × colours)
              └──► cat_price_state_mh (N per SKU, one per state)
```

---

## 3. Scraper Architecture

### Extractor Registry (supported brands)
| Extractor | Brand | Parser Version | Source Pattern |
|---|---|---|---|
| TvsExtractor | tvs | tvs-jss-v1.0 | `tvsmotor.com` (JSS_STATE) |
| HeroExtractor | hero | hero-aem-v1.0 | `heromotocorp.com` (AEM/JSON-LD) |
| YamahaExtractor | yamaha | yamaha-dom-v1.0 | `yamaha-motor-india.com` (DOM) |
| BajajExtractor | bajaj | bajaj-dom-v1.0 | `bajajauto.com` (DOM) |
| BikewaleExtractor | generic | bikewale-ld-v1.0 | `bikewale.com` (JSON-LD) |
| BikedekhoExtractor | generic | bikedekho-ld-v1.0 | `bikedekho.com` (JSON-LD) |

**Note:** No dedicated Suzuki extractor exists yet. Use Bikewale/BikedekhoExtractor, or manual ingestion.

### Domain Allowlist
```
tvsmotor.com, heromotocorp.com, honda2wheelersindia.com,
bajajauto.com, suzukimotorcycle.co.in, yamaha-motor-india.com,
bikewale.com, bikedekho.com
```

### Extraction Output Types
```typescript
interface ExtractedModel {
    name: string;
    category?: string;         // SCOOTER / MOTORCYCLE
    specs: Record<string, unknown>;
    variants: ExtractedVariant[];
    provenance: Provenance;
}

interface ExtractedVariant {
    name: string;
    specs: Record<string, unknown>;
    price?: number;
    colors: ExtractedColor[];
    provenance: Provenance;
}

interface ExtractedColor {
    name: string;
    hex_primary?: string;
    media_urls: string[];      // Image URLs to download
    video_urls?: string[];
    provenance: Provenance;
}
```

---

## 4. Mandatory Ingestion Workflow

> **⚠️ CRITICAL RULE: NO seeding without explicit user approval on the findings report.**

When the user shares a URL or source code, follow these steps IN ORDER:

---

### Step 1: Archive Source Material
Save the raw source (HTML/JSON) to the media folder for future reference:
```
Location: <artifactDir>/media/<brand>_<model>_source.html
Example:  <artifactDir>/media/suzuki_access_125_source.html
```
This ensures the original data is preserved and can be re-parsed later without re-fetching.

---

### Step 2: Extract All Data
Parse the source and extract everything possible:
- Model info (name, category, engine, specs)
- All variants with differentiating specs
- All colours with hex codes
- All image/media URLs per colour
- Pricing (prefer Mumbai/MH ex-showroom)

---

### Step 3: Present Findings Report (MANDATORY — BEFORE ANY SEEDING)

Present the findings in **table format** using the following structure. Use `notify_user` with `BlockedOnUser: true` to get explicit approval.

#### Table 1: Model Overview
| Field | Value |
|---|---|
| Brand | SUZUKI |
| Model Name | Access 125 |
| Body Type | SCOOTER |
| Engine CC | 124 |
| Fuel Type | PETROL |
| Emission | BS6 Phase 2B |
| Mileage | 47 kmpl |

#### Table 2: Variants
| # | Variant Name | Key Specs | Ex-showroom (Mumbai) |
|---|---|---|---|
| 1 | Standard Edition | LCD, Drum/Drum, CBS | ₹XX,XXX |
| 2 | Special Edition | LCD, Disc/Drum, Alloy | ₹XX,XXX |

#### Table 3: Colours (Model-level Pool)
| # | Colour Name | Hex | Finish | Available For |
|---|---|---|---|---|
| 1 | Pearl Grace White | #FFFFFF | Pearl | All variants |
| 2 | Solid Ice Green | #4CAF50 | Gloss | Special Edition+ |

#### Table 4: Colour × Variant Matrix
| Colour ↓ / Variant → | Standard | Special | Ride Connect | ... |
|---|---|---|---|---|
| Pearl Grace White | ✅ | ✅ | ✅ | |
| Solid Ice Green | ❌ | ✅ | ✅ | |

#### Table 5: Available Images
| # | Colour | Image Count | Sample URL | Status |
|---|---|---|---|---|
| 1 | Pearl Grace White | 3 | https://... | ✅ Accessible |
| 2 | Metallic Mat Black | 2 | https://... | ✅ Accessible |

#### Summary
| Metric | Count |
|---|---|
| Variants | 6 |
| Colours | 6 |
| Total SKUs (V×C) | 34 |
| Images found | 18 |

**→ STOP HERE. Wait for user approval before proceeding to Step 4.**

---

### Step 4: Seed (Only After Approval)

Execute in this exact dependency order:
```
1. Verify cat_brands entry exists
2. Create cat_models entry
3. Create cat_colours entries (model-level pool)
4. Create cat_variants_vehicle entries (one per trim)
5. Create cat_skus entries (variant × colour matrix)
6. Upsert cat_price_state_mh entries (one per SKU × state_code='MH')
7. Download images → upload to Supabase Storage → update cat_skus.primary_image
```

---

### Step 5: Post-Seed Verification
After seeding, verify by running:
```sql
SELECT m.name as model, v.name as variant, s.name as sku, s.color_name, p.ex_showroom, p.on_road_price
FROM cat_skus s
JOIN cat_models m ON s.model_id = m.id
JOIN cat_variants_vehicle v ON s.vehicle_variant_id = v.id
LEFT JOIN cat_price_state_mh p ON p.sku_id = s.id
WHERE m.name = '[MODEL_NAME]'
ORDER BY v.position, s.position;
```

---

### Image Handling

> ⚠️ **CRITICAL RULE:** Same colour name across different variants does NOT mean the same image!
> Each variant has different body parts (disc vs drum brake, TFT vs analog console, etc.),
> so a "Metallic Mat Black" on Standard Edition looks different from "Metallic Mat Black" on Ride Connect TFT Edition.
> **Always download variant-specific images from the OEM website.**

- **Local folder structure:**
  ```
  public/media/{brand}/{model-slug}/{variant-slug}/{colour-slug}/
  Example: public/media/suzuki/access-125/standard-edition/metallic-mat-black/
  ```
  Create one folder per variant × colour combination. Place the colour-specific image(s) inside.

- **Asset Sovereignty mandate:** All images must be re-hosted to Supabase Storage
- **Bucket:** `vehicles` (public)
- **CORS:** Use `getProxiedUrl()` from `@/lib/utils/urlHelper` for external URLs
- **BG Removal:** Browser-side via `@imgly/background-removal` (in SKUMediaManager)
- **Source archival:** Raw HTML/JSON saved to `<artifactDir>/media/` folder

---

## 5. Key Server Action Signatures

```typescript
// Models
createModel({ brand_id, name, product_type, body_type?, engine_cc?, fuel_type?, emission_standard? })
// Colours (model-level)
createColour({ model_id, name, hex_primary?, hex_secondary?, finish? })
// Variants
createVariant('VEHICLE', { model_id, name, displacement?, max_power?, ... })
// SKUs
createSku({ sku_type, brand_id, model_id, vehicle_variant_id?, colour_id?, name, price_base?, primary_image? })
// Pricing
upsertPricing({ sku_id, state_code: 'MH', ex_showroom, rto_total_state?, ins_total?, on_road_price? })
```

---

## 6. Existing Brand Config

| Brand | brand.ts id | market.ts | Review Data |
|---|---|---|---|
| HERO | hero | ✅ | ✅ multiple models |
| TVS | tvs | ✅ | ✅ multiple models |
| HONDA | honda | ✅ | ✅ |
| BAJAJ | bajaj | ✅ | ✅ |
| SUZUKI | suzuki | ✅ | ✅ access 125, burgman street |
| YAMAHA | yamaha | ✅ | ✅ |

---

## 7. Pricing Reference (Regional)

- **Default state_code:** `MH` (Maharashtra/Mumbai)
- **Pricing table:** `cat_price_state_mh`
- **On-road formula:** `ex_showroom + rto_total_state + ins_gross_premium`
- **Unique key:** `(sku_id, state_code)` — use `upsertPricing()` for idempotent writes
