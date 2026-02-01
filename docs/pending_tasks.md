# Pending Tasks

## SSPP-001 — Single Source Pricing Protocol (SSPP) ✅ COMPLETED

**Goal:** Centralize all on-road price calculations in a single DB RPC so every surface (desktop, phone, CRM, admin) shows identical pricing.

**Completion Date:** 2026-02-02

### Implementation Summary:

**RPC Functions Created:**
- `get_variant_on_road_price_v1` - Single variant on-road calculation
- `get_catalog_prices_v1` - Bulk catalog pricing

**Calculations Fixed:**
- ✅ 5-Year TP Insurance (legally required for new 2W)
- ✅ RTO fuelMatrix support (New Reg ₹300, Postal ₹70 for PETROL)
- ✅ Cess calculated on MVT amount (not ex-showroom)
- ✅ Smart Card Fee ₹200

**Surfaces Updated:**
- ✅ Desktop PDP (`/store/[make]/[model]/[variant]/page.tsx`)
- ✅ Phone PDP (`/phone/store/[make]/[model]/[variant]/page.tsx`)
- ✅ Admin Pricing Ledger (`PricingLedgerTable.tsx`)
- ✅ Catalog (`SystemCatalogLogic.ts`)
- ✅ PDP Logic (`SystemPDPLogic.ts` - fallback pricing chain)

**Parity Test Results (MH State):**

| Variant | Ex-Showroom | RTO | Insurance | Final On-Road |
|---------|-------------|-----|-----------|---------------|
| Disc | ₹86,350 | ₹10,259 | ₹5,664 | ₹102,273 |
| Drum - Alloy | ₹82,350 | ₹9,810 | ₹5,597 | ₹97,757 |
| Drum Alloy | ₹79,834 | ₹9,528 | ₹5,556 | ₹92,918 |
| Smartxonnect Disc | ₹87,750 | ₹10,416 | ₹5,688 | ₹101,854 |
| Standard | ₹77,375 | ₹9,251 | ₹5,515 | ₹86,998 |

**Legacy Code Status:**
- `calculateOnRoad` retained in `pricingUtility.ts` for admin studio preview only
- All production UI surfaces now use RPC exclusively

**Definition of Done:** ✅
- [x] No client-side pricing calculations in production UI
- [x] All on-road prices returned by RPC
- [x] Parity report shows 100% match for MH test set

---

## Next Priority Tasks

### CAT-001 — Expand Pricing to Other States
- [ ] Add Delhi (DL) pricing rules and cat_prices data
- [ ] Add Karnataka (KA) pricing rules and cat_prices data
- [ ] Re-run parity tests for all 3 states

### INV-001 — Inventory Management
- [ ] Enable stock tracking per dealer/location
- [ ] Wire stock counts to catalog display

### CLEANUP-001 — Database Cleanup
- [ ] Archive and remove deprecated `vehicle_prices` table
- [ ] Remove unused mock data from production
