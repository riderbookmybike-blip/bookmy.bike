# 🗓️ Future Plan — Technical Debt & Deferred Improvements

> Ye file un changes ke liye hai jo **sahi hain lekin abhi nahi karne** — jab bhi free time mile, yahan se pick karo.
> Har item mein: kya karna hai, kyu, aur kahan impact padega.

## 📁 Reference Files

| File | Kya hai |
|---|---|
| [`docs/LOCATION_RTO_OPTIMIZATION.md`](./LOCATION_RTO_OPTIMIZATION.md) | Marketplace location gate removal + zone architecture + RTO audit (59 codes) + MMRDA composition. Resume from here. |
| [District Audit Report](../.gemini/antigravity/brain/785c7c31-e918-491b-8d64-f08e494e8cdd/district_audit_report.md) | 200km district audit, distance table from 401203 (HQ-based), DB fixes applied |
| [Zone Architecture Plan](../.gemini/antigravity/brain/785c7c31-e918-491b-8d64-f08e494e8cdd/implementation_plan.md) | Full SQL schema for zone tables, trigger, PDP code flow |

---

## 🟡 Schema / Database

### 1. `cat_skus.price_base` → `price_mrp` Rename
- **Why:** `price_base` semantically ambiguous hai. `price_mrp` clearly batata hai ki ye manufacturer list price hai.
- **Impact:** 26 files affected (`actions/`, `lib/`, `types/`, `components/`, `app/`)
- **Process:**
  1. DB: `ALTER TABLE cat_skus ADD COLUMN price_mrp numeric GENERATED ALWAYS AS (price_base) STORED;` (virtual alias)
  2. Gradually migrate all code references
  3. Drop `price_base` column after full migration
  4. Regenerate Supabase TypeScript types
- **Risk:** HIGH — do it in a dedicated sprint, not alongside feature work
- **Raised:** 2026-03-27

---

### 2. Accessory Pricing — Remove Redundant `cat_price_state_mh` Query on PDP
- **Why:** PDP fetches `cat_skus` (gets `price_base`) AND then separately queries `cat_price_state_mh` for `ex_showroom` — same value, double roundtrip.
- **Fix:** Use `cat_skus.price_base` directly for accessories, remove `accPricingResult` query in `page.tsx`
- **File:** `src/app/store/[make]/[model]/[variant]/page.tsx` (line ~646)
- **Impact:** 1 less DB query on every PDP load, no schema change
- **Risk:** LOW
- **Raised:** 2026-03-27

---

## 🔴 Performance — PDP & Catalog

### 3. PDP Makes 10+ Uncached Sequential DB Calls
- **Why:** `resolveModel()`, `fetchModelSkus()`, `fetchVehicleVariants()` are called TWICE — once directly in page.tsx AND again inside `getPdpSnapshot()`. No caching on any of them.
- **Fix:**
  - Remove duplicate direct calls in `page.tsx`, rely only on `getPdpSnapshot()`
  - Wrap `resolveModel`, `fetchModelSkus`, `fetchVehicleVariants` in `withCache()` (1hr TTL)
  - Move `cat_reg_rules`, `cat_ins_rules`, services, accessories fetch to single `Promise.all()`
- **Files:** `src/lib/server/storeSot.ts`, `src/app/store/[make]/[model]/[variant]/page.tsx`
- **Risk:** MEDIUM
- **Raised:** 2026-03-27

### 4. `resolveModel()` Fetches ALL Active Models Then Filters in JS
- **Why:** `adminClient.from('cat_models').select(...).eq('status','ACTIVE')` — no slug filter, returns everything, filter in JS. Gets worse as catalog grows.
- **Fix:** Add `.eq('slug', modelSlug)` or `.ilike('slug', modelSlug)` at DB level
- **File:** `src/lib/server/storeSot.ts` line ~376
- **Risk:** LOW
- **Raised:** 2026-03-27

---

## 🟡 UX / Architecture

### 5. `PdpLocationGate` — Hard Block with No Fallback
- **Why:** First-visit users with no location history see a full-screen gate. No dismiss, no default. High bounce risk.
- **Fix:** Default to Mumbai district. Replace hard gate with non-blocking top banner: "Showing prices for Mumbai — change district →"
- **Files:** `src/components/store/Personalize/PdpLocationGate.tsx`
- **Note:** Policy was locked 2026-03-20. Needs explicit approval before change.
- **Risk:** LOW (code) / MEDIUM (policy)
- **Raised:** 2026-03-27

### 6. District-First Service Area Architecture
- **Why:** Serviceability currently pincode-dependent. Most users don't share pincode/GPS. Default district removes this friction.
- **Fix:**
  - Add `DEFAULT_DISTRICT = 'Mumbai'` fallback in `locationCookie.ts`
  - Map serviceability at district level (already partially done)
  - Pre-compute winner per `(stateCode, district, modelSlug, variantSlug)` — cache 6h
  - PDP shows district-level winner without requiring pincode
  - Pincode only needed for distance-to-dealer display (lazy, optional)
- **Risk:** HIGH — touches location resolution, PDP pricing, catalog serviceability
- **Raised:** 2026-03-27

---

## 🟢 Code Quality

### 7. `cat_price_dealer` Accessory `vehicle_color_id` Column — Misleading Name
- **Why:** `cat_price_dealer.vehicle_color_id` stores SKU IDs for ALL types (vehicles, accessories, services) but is named `vehicle_color_id` — confusing for accessories/services.
- **Fix:** Rename to `sku_id` with proper migration
- **Risk:** HIGH — used in 15+ files
- **Raised:** 2026-03-27

### 8. Catalog Image Quality Audit (Blurred Cards)
- **Why:** Some catalog cards show blurred vehicle images even when OEM site looks sharp. Current hypothesis: low-res source assets (thumbnail/homepage variants) were ingested for some SKUs.
- **Approach (strict order):**
  1. Run full audit: list all catalog image URLs with resolution and identify low-res assets.
  2. Build mismatch report: `model/sku -> current image -> width/height -> source host/path`.
  3. Check alternatives only for flagged assets:
     - Existing better media already in our storage.
     - OEM high-res product-page assets (if publicly available).
  4. Replace image only when objectively better source is available.
  5. If no better source exists, keep current image (no blind upscaling/compression hacks).
- **Constraints:**
  - Primary dependency is OEM media availability.
  - No forced enhancement pipeline unless replacement source quality is higher.
  - Keep audit report before any bulk update.
- **Files/Areas (expected):** `cat_skus.primary_image`, ingestion scripts under `scripts/`, catalog media in `public/media` and Supabase storage.
- **Risk:** MEDIUM
- **Raised:** 2026-03-28

### 9. [REVIEW] PDP — `cat_reg_rules` + `cat_ins_rules` Removal Validation
- **Context:** Both tables were fetched on every PDP load as fallback for RTO and insurance data. But `cat_price_state_mh` already has all data via flat columns (`rto_roadtax_amount_state`, `rto_registration_fee_state`, `insurance_premium` etc.). Removal done 2026-03-28.
- **What was removed:** 2 DB fetches, `effectiveRule` + `insuranceRule` variables, 2 unused props to `ProductClient`
- **Review needed:**
  1. Verify no edge case SKUs rely on the fallback rule mock (`effectiveRule` had a hardcoded 10% road tax default for missing data)
  2. Confirm all published SKUs in `cat_price_state_mh` have `rto_roadtax_amount_state > 0` — if any are 0, they'll now show ₹0 RTO (was previously falling back to rule calculation)
  3. Cross-check PDP RTO + insurance display on 2-3 different models post-deploy
- **Files:** `src/app/store/[make]/[model]/[variant]/page.tsx`
- **Risk:** LOW-MEDIUM (data-dependent)
- **Raised:** 2026-03-28

### 10. [PENDING] PDP Performance — Remaining Optimization Steps
- **Context:** 2 DB calls already removed (cat_reg_rules + cat_ins_rules, commit 1e907915). 11 more to go across 4 steps.
- **Remaining steps in order:**
  1. **Accessory fix** (-1 call): Remove `accPricingResult` from `cat_price_state_mh` for accessories → use `price_base` already in first `cat_skus` fetch
  2. **Duplicate fetch fix** (-3 calls): `page.tsx` calls `resolveModel + fetchModelSkus + fetchVehicleVariants` AND `getPdpSnapshot` repeats all three — choose one path
  3. **`cat_market_winners` table** (-5 calls): Single flat table (sku_id, winner_tenant_id, offer_amount, zone, district, state_code, country, computed_at). DB trigger on `cat_price_dealer` auto-updates on offer change. Replaces `getDealerDelta()` waterfall. MMRDA zone pre-seeded.
  4. **PdpLocationGate → MMRDA default** (-1 call + UX): Default zone cookie = MMRDA, non-blocking banner replaces hard gate
- **Expected result:** ~18 DB calls → ~6–7. Server time ~400–700ms → ~80–150ms
- **Files:** `page.tsx`, `PdpLocationGate.tsx`, `storeSot.ts`
- **Risk:** MEDIUM (Step 3 needs migration + trigger)
- **Raised:** 2026-03-28

---

## How to Use This File

- Jab bhi ek sprint free ho → is file se ek item uthao
- Item complete hone par `✅ Done: [date]` mark karo
- Naya item add karne ka format:
  ```
  ### N. Title
  - **Why:** ...
  - **Fix:** ...
  - **Files:** ...
  - **Risk:** LOW / MEDIUM / HIGH
  - **Raised:** YYYY-MM-DD
  ```
