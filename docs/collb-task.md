# Collab Task Queue (Codex → Antigravity)

## Purpose
Single source for tasks that **Codex assigns** to Antigravity.
Antigravity should treat this file as **read-only**.

## Rules
- **Codex writes** tasks here.
- **Antigravity reads only**.
- Tasks must be clearly numbered and have status.
- Any questions for Codex must be asked in `docs/collb-response.md` using `@codex` tag.

---

## Active Tasks
1. **P0 Bug: Financial Summary ₹0 (Ajit says still repro)**
   - ❌ User confirms still missing values on PDP.
   - **Action:** Provide concrete proof (screenshots/logs) and exact URL where it is fixed.
   - Do **not** mark fixed until Ajit confirms.

2. **P0: Registration Options Missing (BH/COMPANY not shown)**
   - **Symptom:** Only STATE option shows; BH/COMPANY missing on PDP registration toggle (Ajit repro).
   - **Repro URL (current):** `http://localhost:3000/store/tvs/jupiter/drum?district=Palghar`
   - **Note:** URL scheme must be updated to avoid district collisions:
     - **SEO‑safe contract:** canonical SKU page `/store/tvs/jupiter/drum` with pricing context via query params (`state`, `district`, `studio_id`) or cookie/session.
     - Variant pages must set canonical to base SKU page.
   - **Required action:**
     - Confirm `cat_price_state.rto` JSON has BH/COMPANY values for SKU/state.
     - If rules exist, ensure publish writes BH/COMPANY.
     - If rules missing, seed rules or surface “not available”.
   - **Deliverable:** root cause + fix summary + screenshot of PDP showing all options.

3. **P0: Insurance Addons Missing (PA, RSA, etc.)**
   - **Symptom:** Only zeroDep shown; other addons missing on PDP (Ajit repro).
   - **Repro URL (current):** `http://localhost:3000/store/tvs/jupiter/drum?district=Palghar`
   - **Note:** Follow SEO‑safe URL contract (canonical base SKU page + query params for context).
   - **Required action:**
     - Verify `cat_price_state.insurance.addons` JSON content for SKU/state.
     - Ensure publish writes full addons list (PA, RSA, etc.) with prices.
   - **Deliverable:** root cause + fix summary + screenshot of PDP showing addons list.

4. **P1: Accessories suitability filter broken**
   - **Symptom:** Accessories not filtered by suitable_for; random items appear.
   - **Required action:**
     - Verify `matchesAccessoryCompatibility` usage in PDP flow and dealer rule overrides.
     - Ensure suitability filter applies when dealer rules are absent.
   - **Deliverable:** root cause + fix summary.

5. **P0: RTO JSON Structure Incomplete (Totals only)**
   - **Requirement:** RTO JSON must include **all fees from registration engine** (dynamic, future‑proof).
   - **Rule:** Fees are mandatory across STATE/BH/COMPANY; only tax differs per type.
   - **Required action:**
     - Use registration engine breakdown to build:
       - `fees`: all non‑tax components (smart card, registration, postal, hypothecation, etc.)
       - `tax`: per type (STATE/BH/COMPANY) road tax + cess
     - JSON should be future‑proof: if new fee introduced in engine, it appears automatically.
   - **Deliverable:** updated JSON shape + publish flow changes + example row + note on how BH/COMPANY totals are derived in UI.

6. **Logic Change: Vehicle base price must come ONLY from cat_price_state**
   - **Requirement:** Ignore `cat_items.price_base` for vehicle SKUs; use `cat_price_state.ex_showroom_price` only.
   - **Accessories/services** keep `cat_items.price_base` and `cat_services`.
   - **Required action:** Update PDP/Catalog fetch logic to avoid fallback to `cat_items.price_base` for vehicles.
   - **Deliverable:** patch summary + list of affected files.

7. **Phase 4 Testing (Blocked by above bugs)**
   - UI checks must be revalidated after P0/P1 bugs are closed.
   - Constraints validation should be re-confirmed only after UI is correct.

8. **P0 Build Error: `revalidateTag` imported in client bundle**
   - ✅ Antigravity claims fix by adding `'use server'` to `savePrices.ts`.
   - **Required:** confirm `npm run build` passes (no client bundle error).

9. **Hard Rename Tables (PAUSED)**
   - **STOP** migration work until P0/P1 bugs above are closed and Ajit confirms.
   - If rename already applied, provide rollback/compat plan and wait for approval before changes.

## Completed Tasks
- Phase 1 migration (pricing_sot_json_final)
- Phase 2 publishPrices JSON write (after BH fix)
- Phase 3 fixes applied (JSON-only client + catalog cleanup) — ✅ 2026-02-05 17:10 IST

---

## Status Notes
- Phase 3 approved ✅
- Phase 4 blocked by P0/P1 bugs
