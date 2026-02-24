# INV-006 Requisition UAT Checklist

Status: IN PROGRESS  
Prepared on: February 24, 2026  
Module: `Inventory > Requisitions`

## 1. Objective
Validate end-to-end requisition flow after recent upgrades:
1. Requisition listing visibility
2. Quote add/edit/clone
3. Quote comparison + selection
4. Requisition stage progression to PO handoff

## 2. Environment
1. App URL: `http://127.0.0.1:3000`
2. Requisition list:
   - `/dashboard/inventory/requisitions`
   - `/app/<tenant-slug>/dashboard/inventory/requisitions`
3. Requisition detail:
   - `/dashboard/inventory/requisitions/<request-id>`
   - `/app/<tenant-slug>/dashboard/inventory/requisitions/<request-id>`

## 3. Auto-Verified Checks (Code + Lint)
1. Quote duplicate dealer guard present in `addDealerQuote`: PASS
2. Quote edit action present (`updateDealerQuote`): PASS
3. Quote panel supports create + edit + clone paths: PASS
4. Quote compare uses total offer (`bundled + transport`): PASS
5. Requisition list shows `Quotes` and `PO` linkage columns: PASS
6. ESLint on touched inventory requisition files: PASS

## 4. Manual UAT Scenarios

| ID | Scenario | Steps | Expected | Status |
|---|---|---|---|---|
| RQ-01 | Requisition list visibility | Open requisition list page | Rows visible with new `Quotes` and `PO` columns | PENDING |
| RQ-02 | New quote add | Open a `QUOTING` requisition and add quote for supplier A | Quote appears in list with `SUBMITTED` | PENDING |
| RQ-03 | Duplicate dealer guard | Try adding another active quote for same supplier A | Error: dealer already has active quote | PENDING |
| RQ-04 | Edit submitted quote | Use `Edit Existing Quote`, change bundled/transport, save | Same quote updates; no duplicate created | PENDING |
| RQ-05 | Clone quote to multiple dealers | Select source quote, choose target suppliers, clone | Quotes created for selected target dealers | PENDING |
| RQ-06 | Compare snapshot accuracy | Check best quote and spread in snapshot | Best = lowest `bundled + transport`, spread correct | PENDING |
| RQ-07 | Cost line matrix coverage | Verify included/excluded tags by quote | Matrix reflects `bundled_item_ids` per quote | PENDING |
| RQ-08 | Select quote and advance | Click `Select & Move To Ordered` on a submitted quote | Requisition status becomes `ORDERED`; PO linked | PENDING |
| RQ-09 | Next stage routing | On ordered requisition click top `Next Stage` | Opens linked PO page | PENDING |
| RQ-10 | Non-quoting guard | Open `ORDERED` or `RECEIVED` requisition | Quote entry UI is disabled | PENDING |

## 5. Negative-Path Focus
1. Tampered request/quote IDs from URL
2. Unauthorized user session
3. Requisition not in `QUOTING` but quote add/edit attempted
4. Invalid bundled item IDs in quote payload

## 6. Exit Criteria
Mark UAT as PASS only when:
1. `RQ-01` to `RQ-10` all PASS
2. No blocker in negative-path checks
3. No unexpected redirect or status regression

## 7. Known Follow-Up (Post UAT)
1. Delivery note + in-transit + partial receive flow (Phase extension)
2. Award override reason enforcement (if business requires)
3. Optional recommendation scoring weights in comparison

