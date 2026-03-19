# Phase 0: Data Model Schema Decision Note

Date: 2026-03-19  
Executor: Antigravity  
Status: **READY FOR BUSINESS SIGN-OFF** – No destructive writes until approved.

---

## 1. Tables Audited

### `id_tenants`
Fields relevant to studio code generation:
- `id` (uuid PK)
- `name` (text) – display name
- `slug` (varchar) – short canonical slug
- `studio_id` (text, nullable) – current code **TO BE REPLACED**
- `pincode` (text, nullable) – **primary registered pincode** (used for RTO resolution)
- `phone`, `email`, `location` – contact/location text
- `type` (varchar) – filter on `'DEALER'`
- `brand_type` (text, default `'MONOBRAND'`)

**Note**: `studio_id` is a single text field on `id_tenants`. It stores the computed 9-char code. No dedicated history table exists. Phase 4 must create a rollback map before overwriting.

---

### `id_locations`
Branch/location rows per tenant. Fields:
- `id` (uuid PK)
- `tenant_id` (uuid FK → id_tenants)
- `name` (text)
- `type` (text) – observed values: `SHOWROOM`, `WAREHOUSE`, `HEAD_OFFICE`
- `address_line_1`, `address_line_2`, `city`, `state`
- `pincode` (text)
- `district`, `taluka`
- `contact_phone`, `contact_email`
- `map_link` (text)
- `is_active` (boolean, default true)
- `lat`, `lng` (double precision)

**⚠️ MISSING: `is_primary` field** – there is no boolean `is_primary` on `id_locations` to mark one branch as the primary branch per tenant. This is needed for Phase 2–4 to resolve which branch drives the studio code.

---

### `dealer_brands`
- `tenant_id` (uuid FK)
- `brand_id` (uuid FK)
- `is_primary` (boolean, default false) ✅ – already present
- `pincode` (text) – brand-level pincode (separate from tenant/location)
- Additional fields: `taluka`, `district`, `state`, `country`, `area`, `rto_code`, `latitude`, `longitude`

**Note**: `dealer_brands` has its own geographic fields and `rto_code`. It could serve as an alternate source for studio code if `id_locations.is_primary` is not added. However, mixing resolution sources creates ambiguity. Recommendation: add `is_primary` to `id_locations` and use it as authoritative.

---

### `loc_pincodes`
- `pincode` (text)
- `area` (text) – postal area name (e.g., "Bassein Road S.O")
- `taluka` (text)
- `district` (text)
- `rto_code` (text) – authoritative RTO code (e.g., "MH48")
- `state_code` (text)
- Standard timestamps

**Status**: Authoritative. Must be used for all RTO and area resolution. **Do not use pincode-last-two heuristic.**

---

## 2. Branch Model Decision

**Recommendation: Add `is_primary` to `id_locations`.**

Rationale:
- `id_locations` is already the branch table (SHOWROOM, WAREHOUSE, HEAD_OFFICE)
- Business will select one SHOWROOM row as "primary" per dealership
- `is_primary = true` on that row drives: RTO token, area token, studio code
- All other location rows remain as branches (is_primary = false)
- Constraint: at most one `is_primary = true` per `tenant_id`

**Alternative considered**: Use existing `dealer_brands.rto_code` + `dealer_brands.pincode`. Rejected because it conflates brand geography with branch geography and doesn't support multi-branch selection.

---

## 3. Studio Code Derivation Rule (Confirmed)

```
studio_id = BRAND3 + '-' + RTO_DIGITS + AREA1 + '-' + DEALER3
```

Where:
- `BRAND3` = first 3 chars of primary brand name (uppercased), from `dealer_brands` where `is_primary = true`
- `RTO_DIGITS` = `loc_pincodes.rto_code` with 'MH' stripped (e.g., MH48 → '48'), resolved from primary branch pincode
- `AREA1` = first letter of `loc_pincodes.area` (uppercase), resolved from primary branch pincode
- `DEALER3` = first 3 chars of `id_tenants.slug` (uppercased)

---

## 4. Migration SQL Draft

> **PENDING BUSINESS SIGN-OFF. Do not execute until approved.**

```sql
-- Migration: add is_primary to id_locations
-- Safe: additive only, no data deleted

ALTER TABLE public.id_locations
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;

-- Optional: partial unique index to enforce single primary per tenant
-- (enforce at app level first; enable index after data is clean)
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_one_primary_per_tenant
--   ON public.id_locations (tenant_id)
--   WHERE is_primary = true;

COMMENT ON COLUMN public.id_locations.is_primary IS 
  'Marks the single authoritative primary branch for studio code generation. Exactly one row per tenant_id should be true.';
```

**Phase 4 Addenda (not to execute now)**:
```sql
-- After business selects primary branch per dealer, set is_primary:
UPDATE public.id_locations SET is_primary = true
  WHERE id = '<selected_branch_uuid>';

-- Then update studio_id on id_tenants:
UPDATE public.id_tenants SET studio_id = '<computed_code>'
  WHERE id = '<tenant_uuid>';
```

---

## 5. Identified Data Gaps / Conflicts (For Phase 4 Pre-conditions)

| Dealer | Conflict | Impact on Studio Code |
|--------|----------|----------------------|
| Arni TVS | Tenant pincode 401202 vs SHOWROOM 401203 – different area tokens | Area letter changes: B vs G |
| Automiles Hero | Tenant pincode 400064 (Malad West) vs SHOWROOM 400097 (Malad East) | Area letter may change |
| Dream Suzuki | SHOWROOM pincode 400060 vs official site pincode 400058 | Area token: J vs A |
| **Udan** | **CRITICAL**: Tenant pincode 401028 → no loc_pincodes match → rto_code = null | **Cannot generate code without fix** |
| Suryodaya Bajaj | Tenant 401202 vs SHOWROOM 401208 | Area token: B vs G |
| Automax Yamaha | Tenant 401202 (MH48) vs SHOWROOM 400062 (Mumbai Suburban, likely MH47) | **Entire RTO segment may change** |
| Sahil Yamaha | SHOWROOM pincode 401404 vs aggregator/tenant 401501 | Area token: P vs A |

---

## 6. Next Steps (Phase 2+)

1. Business reviews enrichment snapshot and selects primary branch per dealer
2. Migration SQL for `is_primary` field is applied (after sign-off)
3. Primary branch is_primary set per selection
4. Studio codes computed using confirmed derivation rule
5. Rollback map written before any `studio_id` update
