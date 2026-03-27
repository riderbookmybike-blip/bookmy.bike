# Marketplace Location & RTO Optimization Plan
> **Conversation:** 785c7c31-e918-491b-8d64-f08e494e8cdd (2026-03-28)  
> **Status:** PENDING — implementation paused, resume from Step 1 below  
> **Reference files:**
> - District Audit: `.gemini/antigravity/brain/785c7c31-e918-491b-8d64-f08e494e8cdd/district_audit_report.md`
> - Full Technical Plan (below, also in): `.gemini/antigravity/brain/785c7c31-e918-491b-8d64-f08e494e8cdd/implementation_plan.md`

---

## What Was Completed (This Session)

| Item | Status | Commit |
|---|---|---|
| `cat_reg_rules` + `cat_ins_rules` drop from PDP | ✅ Done | `1e907915` |
| `loc_pincodes` district name fixes (4 renames) | ✅ Done | Via migration |
| RTO code audit (59/59 verified) | ✅ Done | Documented |
| MMRDA zone composition confirmed | ✅ Done | 5 districts, 11 RTOs |

## What's Pending (Resume Here)

### Step 1 — Accessory fix (-1 DB call, low risk)
Remove `accPricingResult` from `cat_price_state_mh` for accessories.  
Use `price_base` already fetched in first `cat_skus` query.  
**File:** `src/app/store/[make]/[model]/[variant]/page.tsx` (line ~646)

### Step 2 — Duplicate fetch fix (-3 DB calls)
`page.tsx` calls `resolveModel + fetchModelSkus + fetchVehicleVariants` AND  
`getPdpSnapshot` repeats all three internally. Pick one path, remove the other.  
**File:** `src/app/store/[make]/[model]/[variant]/page.tsx`, `src/lib/server/storeSot.ts`

### Step 3 — `cat_market_winners` table + trigger (-5 DB calls, BIGGEST WIN)
Single flat table replacing `getDealerDelta()`:
```sql
CREATE TABLE cat_market_winners (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id           uuid REFERENCES cat_skus(id),
    winner_tenant_id uuid REFERENCES id_tenants(id),
    offer_amount     numeric NOT NULL,
    zone             text NOT NULL,    -- 'MMRDA', 'PUNE_METRO'
    district         text,
    state_code       text NOT NULL,    -- 'MH'
    country          text DEFAULT 'IN',
    computed_at      timestamptz DEFAULT now(),
    UNIQUE (sku_id, zone)
);
```
DB trigger on `cat_price_dealer` auto-updates winner on any offer change (concurrency-safe via `ON CONFLICT DO UPDATE WHERE`).  
MMRDA zone seed: Thane, Mumbai Suburban, Palghar, Mumbai City, Raigad (5 districts, 11 RTOs: MH01-MH06, MH43, MH46, MH47, MH48, MH58).

### Step 4 — PdpLocationGate → MMRDA default (-1 DB call + UX)
- Remove hard gate block, default zone = MMRDA cookie
- Non-blocking top banner: "Mumbai Metro prices · Change zone →"
- Pincode input: lazy, below dealer card, only for distance display
**File:** `src/components/store/Personalize/PdpLocationGate.tsx`

---

## Speed Impact

| State | DB Calls | Server Time |
|---|---|---|
| Before this session | ~18 | ~400–700ms |
| After rules drop (done) | ~16 | ~360–640ms |
| After Steps 1+2 | ~12 | ~250–450ms |
| After Steps 3+4 (full) | ~6–7 | ~80–150ms |

---

## MMRDA Zone — Confirmed Data

**Districts:** Thane, Mumbai Suburban, Palghar, Mumbai City, Raigad  
**RTO codes:** MH01, MH02, MH03, MH04, MH05, MH06, MH43, MH46, MH47, MH48, MH58  
**Active dealers:** 19  

**District name fixes already applied to `loc_pincodes`:**
- `Mumbai` → `Mumbai City`
- `Raigarh(MH)` → `Raigad`
- `Ahmed Nagar` / `Ahmednagar` → `Ahilyanagar (Ahmednagar)`
- `Aurangabad` → `Chhatrapati Sambhajinagar (Aurangabad)`
