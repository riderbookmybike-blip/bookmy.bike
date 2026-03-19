# Phase 4: Post-Update Verification Report

Date: 2026-03-19  
Executor: Antigravity  
Status: **✅ COMPLETE – 10/10 dealers verified**

---

## Summary

| Stat | Value |
|------|-------|
| Dealers processed | 10 |
| Dealers verified PASS | 10 |
| Dealers on hold | 1 (Automax Yamaha) |
| Migration applied | ✅ `id_locations.is_primary` column added |
| Tenant pincodes corrected | 4 (Udan, Automiles Hero, Suryodaya Bajaj, Arni TVS) |
| Location pincodes corrected | 2 (Dream Suzuki SHOWROOM, Sahil Yamaha SHOWROOM) |
| `is_primary` flags set | 10 (one per dealer) |
| `studio_id` values updated | 10 |
| Studio 48C HEAD_OFFICE activated | ✅ |

---

## Rule Set Applied

```
studio_id = UPPER(LEFT(brand_name, 3))
          + '-'
          + REPLACE(rto_code, 'MH', '')          -- from loc_pincodes via tenant pincode
          + UPPER(LEFT(loc_pincodes.taluka, 1))   -- AREA1 = taluka first letter
          + '-'
          + UPPER(LEFT(slug, 3))                  -- DEALER3
```

---

## Verification Results (Final Pass)

| Dealer | Slug | Pincode | Brand | RTO | Taluka | New Code | DB Check | Primary Loc |
|--------|------|---------|-------|-----|--------|----------|----------|-------------|
| Aher Automotive | aher | 421301 | HONDA | MH05 | Kalyan | **HON-05K-AHE** | ✅ PASS | 1 |
| Arni TVS | arni-tvs | 401203 | TVS | MH48 | Vasai | **TVS-48V-ARN** | ✅ PASS | 1 |
| TVS Autorace | autorace | 400104 | TVS | MH47 | Goregaon West | **TVS-47G-AUT** | ✅ PASS | 1 |
| Automiles Hero | automiles-hero | 400097 | HERO | MH47 | Malad East | **HER-47M-AUT** | ✅ PASS | 1 |
| Dream Suzuki | dream-suzuki | 400058 | SUZUKI | MH02 | Mumbai | **SUZ-02M-DRE** | ✅ PASS | 1 |
| Udan | udan | 401208 | SUZUKI | MH48 | Vasai | **SUZ-48V-UDA** | ✅ PASS | 1 |
| Sahil Yamaha | sahil-yamaha | 401501 | YAMAHA | MH48 | Dahanu | **YAM-48D-SAH** | ✅ PASS | 1 |
| Suryodaya Bajaj | suryodaya-bajaj | 401208 | BAJAJ | MH48 | Vasai | **BAJ-48V-SUR** | ✅ PASS | 1 |
| Myscooty | myscooty | 401209 | APRILIA | MH48 | Vasai | **APR-48V-MYS** | ✅ PASS | 1 |
| Studio 48C | aapli | 401203 | APRILIA | MH48 | Vasai | **APR-48V-AAP** | ✅ PASS | 1 |
| Automax Yamaha | automax-yamaha | 401202 | YAMAHA | MH48 | — | **HOLD** | ⏸ HOLD | 0 |

---

## Changes Applied Per Dealer

### Aher Automotive (`HON-05K-AHE`)
- `studio_id`: `A42-HAH-13E` → `HON-05K-AHE`
- `is_primary` set on: WAREHOUSE Murbad Road (only row; SHOWROOM row to be added)
- No pincode changes

### Arni TVS (`TVS-48V-ARN`)
- `studio_id`: `T40-VAR-12N` → `TVS-48V-ARN`
- `tenant.pincode`: `401202` → `401203` (aligns to selected SHOWROOM branch)
- `is_primary` set on: SHOWROOM Nalasopara West (loc id: 2ad83d98)

### TVS Autorace (`TVS-47G-AUT`)
- `studio_id`: `T40-VAU-01T` → `TVS-47G-AUT`
- `is_primary` set on: WAREHOUSE Malad West (only row; Goregaon West SHOWROOM row to be added)
- No pincode changes

### Automiles Hero (`HER-47M-AUT`)
- `studio_id`: `H40-EAU-00T` → `HER-47M-AUT`
- `tenant.pincode`: `400064` → `400097` (Malad East, OEM confirmed)
- `is_primary` set on: SHOWROOM Malad East (loc id: 49c0aea9)

### Dream Suzuki (`SUZ-02M-DRE`)
- `studio_id`: `S40-UDR-00E` → `SUZ-02M-DRE`
- SHOWROOM `pincode`: `400060` → `400058`; `taluka` set to `Mumbai`, district to `Mumbai Suburban`
- `is_primary` set on: SHOWROOM (loc id: 5f19e35f)

### Udan (`SUZ-48V-UDA`)
- `studio_id`: `U40-DUD-10A` → `SUZ-48V-UDA`
- `tenant.pincode`: `401028` (UNRESOLVABLE) → `401208` (Vasai East, official site confirmed)
- `is_primary` set on: WAREHOUSE Ambadi Road (only row; Vasai East SHOWROOM to be added)

### Sahil Yamaha (`YAM-48D-SAH`)
- `studio_id`: `Y40-ASA-15H` → `YAM-48D-SAH`
- SHOWROOM `pincode`: `401404` → `401501`; `taluka` set to `Dahanu`, `district` to `Palghar`
- `is_primary` set on: SHOWROOM Palghar/Boisar (loc id: b6e5ca32)

### Suryodaya Bajaj (`BAJ-48V-SUR`)
- `studio_id`: `B40-ASU-12R` → `BAJ-48V-SUR`
- `tenant.pincode`: `401202` → `401208` (Vasai East, showroom confirmed)
- `is_primary` set on: SHOWROOM Vasai East (loc id: 8a677618)

### Myscooty (`APR-48V-MYS`)
- `studio_id`: `M40-YMY-12S` → `APR-48V-MYS`
- `is_primary` set on: SHOWROOM Wailvpada (loc id: 721cdccf)
- No pincode changes

### Studio 48C (`APR-48V-AAP`)
- `studio_id`: `S40-TAA-12P` → `APR-48V-AAP`
- `is_primary` set on: HEAD_OFFICE Panbai Nagar (loc id: df83feaa)
- HEAD_OFFICE `is_active` changed: `false` → `true`
- ⚠️ Note: DEALER3 = `AAP` (from slug `aapli`). Display name "Studio 48C" → "STU" would require either (a) updating slug to `studio-48c` or (b) adding a `studio_code_override` column. Currently rule-consistent.

---

## Automax Yamaha — On Hold
- `studio_id` untouched: `Y40-AAU-12T`
- No `is_primary` set
- Conflict: Tenant pincode 401202 (Vasai, MH48) vs SHOWROOM row 400062 (Goregaon West, likely MH47)
- **Action required**: Business to confirm whether Automax Yamaha primarily operates from Vasai or Mumbai/Goregaon

---

## Open Items Post Phase 4

| Item | Who | Action |
|------|-----|--------|
| Add SHOWROOM row for Aher Automotive | Ops | Street address + GPS in Kalyan |
| Add SHOWROOM row for TVS Autorace (Goregaon West) | Ops | SN 9, Goregaon Samruddhi CHS, 400104 |
| Add SHOWROOM row for Udan (Vasai East) | Ops | Johnson Motor Compound, 401208 |
| Studio 48C: rename slug from `aapli` to `studio-48c` (optional) | Dev | Slug change cascades to studio_id → `APR-48V-STU` |
| Add phone/email for Arni TVS, Aher, TVS Autorace, Myscooty, Studio 48C | Ops | Phase 2 normalize pass |
| Automax Yamaha location decision | Business | Mumbai vs Vasai |

---

## Rollback Reference
See: `reports/dealer_studio_code_rollback_map_20260319.csv`

To revert any dealer (example – Udan):
```sql
UPDATE public.id_tenants SET studio_id = 'U40-DUD-10A', pincode = '401028'
WHERE id = 'f0665ec1-1f45-42b8-9786-d4376092133f';
UPDATE public.id_locations SET is_primary = false
WHERE id = '787e55cb-13bd-440d-8bda-28ea82814174';
```
