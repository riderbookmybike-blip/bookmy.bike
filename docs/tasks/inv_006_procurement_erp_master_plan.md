# INV-006: Procurement ERP Master Plan (Tight Review v2)

Status: PENDING APPROVAL  
Date: February 24, 2026  
Owner: Inventory + Procurement + Finance + CRM

## 1. Scope Lock

This plan covers complete inward procurement lifecycle:
1. Requisition creation:
1. Manual requisition.
2. Booking-based auto requisition on stock shortage.
2. Multi-dealer RFQ:
1. 4 to 5 dealer quote collection.
2. Full component-wise commercial breakup.
3. Quote comparison + award:
1. Side-by-side compare.
2. Recommendation + override with reason.
3. Quote selection to PO conversion.
4. Logistics:
1. Dispatch note capture.
2. Unit-level in-transit tracking.
5. Receipt + QC:
1. Physical verification with chassis/engine/sticker media.
2. Partial receipt and pending commercial docs.
6. Payments:
1. Requisition-stage payment.
2. PO/dispatch-stage payment.
3. Future Books linkage.

## 2. Out of Scope (Current Cycle)

1. Vendor portal / dealer self-service UI.
2. Advanced forecast planning and auto reorder.
3. Branch transfer optimization engine.
4. Full accounting posting engine (only Books link-ready hooks now).

## 3. Business SOT Workflow

1. Booking created:
1. If SKU available, continue normal.
2. If shortage, create booking-linked requisition.
2. Procurement creates RFQ round for requisition lines.
3. Dealers submit line-level commercials:
1. Vehicle.
2. Registration.
3. Insurance.
4. Add-ons.
5. Accessories.
6. Transportation.
7. Payment terms and credit days.
4. Procurement compares all quotes and awards best line or split lines.
5. Selected quote converts to PO.
6. Dealer dispatches units with challan/LR + chassis/engine.
7. Units marked IN_TRANSIT.
8. Warehouse receives units, performs QC, uploads evidence.
9. Accepted units posted to stock.
10. Requisition closes on physical completion even if some docs are pending.

## 4. ERP Benchmark Alignment

1. Dynamics RFQ and bid comparison:
1. https://learn.microsoft.com/en-us/dynamics365/supply-chain/procurement/request-quotations
2. https://learn.microsoft.com/en-us/dynamics365/supply-chain/procurement/tasks/enter-compare-rfq-bids-award-contracts
2. Oracle award patterns (single/line/split):
1. https://docs.oracle.com/en/cloud/saas/procurement/25d/oaprc/how-you-award-negotiations.html
3. Odoo tender and RFQ model:
1. https://www.odoo.com/documentation/master/applications/inventory_and_mrp/purchase/manage_deals/calls_for_tenders.html
2. https://www.odoo.com/documentation/17.0/applications/inventory_and_mrp/purchase/manage_deals/rfq.html
4. ERPNext RFQ/PO and QC:
1. https://docs.frappe.io/erpnext/user/manual/en/request-for-quotation
2. https://docs.frappe.io/erpnext/user/manual/en/supplier-quotation
3. https://docs.frappe.io/erpnext/v13/user/manual/en/buying/purchase-order
4. https://docs.frappe.io/erpnext/v14/user/manual/en/stock/quality-inspection

## 5. Current Gap Assessment (Reviewed)

1. Requisition detail was placeholder and has only partial flow now.
2. Existing quote model is mostly bundled header, not component matrix.
3. Demand-line and quote cloning model is missing.
4. Dispatch and unit-level in-transit model is missing.
5. QC checklist + media capture not tied to dispatch units yet.
6. Requisition-stage payment records are missing.
7. Comparison recommendation logic is missing.

## 6. Target Data Model (Additive, Backward-Compatible)

## 6.1 Existing Tables to Retain

1. `inv_requests`
2. `inv_request_items`
3. `inv_dealer_quotes`
4. `inv_purchase_orders`
5. `inv_po_payments`
6. `inv_stock`
7. `inv_stock_ledger`

## 6.2 New Tables

1. `inv_request_demand_lines`
1. Stores demand per SKU/color/qty/unit group.
2. `inv_quote_lines`
1. Component-wise quote breakup by demand line.
3. `inv_quote_terms`
1. Payment and credit terms at quote level.
4. `inv_quote_clone_events`
1. Audit of source-to-target cloning.
5. `inv_quote_comparison_snapshots`
1. Saved compare results and scoring config.
6. `inv_dispatch_notes`
1. Challan, transporter, ETA.
7. `inv_dispatch_units`
1. Unit-level movement with chassis/engine.
8. `inv_qc_checks`
1. Checklist + media + QC result per dispatch unit.
9. `inv_procurement_payments`
1. Stage-wise payment records with `books_txn_id`.

## 6.3 Existing Table Extensions

1. `inv_requests`
1. Add `stage`.
2. Add `physical_receipt_status`.
3. Add `commercial_docs_status`.
2. `inv_dealer_quotes`
1. Add `rfq_round_no`.
2. Add `is_recommended`.
3. Add `selection_reason`.

## 7. State Machines

## 7.1 Requisition

`DRAFT -> RFQ_OPEN -> RFQ_RECEIVED -> QUOTE_SELECTED -> PO_CREATED -> IN_TRANSIT -> RECEIVED_PARTIAL -> RECEIVED_COMPLETE -> CLOSED`

## 7.2 Demand Line

`OPEN -> QUOTED -> ORDERED -> DISPATCHED -> RECEIVED -> QC_PASSED -> STOCKED`

## 7.3 Quote

`DRAFT -> SUBMITTED -> UNDER_REVIEW -> SELECTED | REJECTED`

## 7.4 Dispatch Unit

`IN_TRANSIT -> ARRIVED -> QC_PASSED | QC_FAILED | HOLD`

## 8. API/Server Action Contract

1. `createRequisitionWithDemandLines(input)`
2. `autoCreateRequisitionFromBookingShortage(bookingId)`
3. `submitDealerQuoteWithBreakup(input)`
4. `cloneQuoteAcrossDemandLines(input)`
5. `computeQuoteComparison(requestId, config)`
6. `selectQuoteAndCreatePO(quoteId, selectionReason?)`
7. `createDispatchNote(input)`
8. `markDispatchUnitsInTransit(dispatchNoteId)`
9. `receiveDispatchUnitsWithQC(input)`
10. `recordProcurementPayment(input)`

## 9. UI Scope

1. Requisition detail tabs:
1. Demand lines.
2. RFQ quotes.
3. Comparison.
4. PO.
5. Dispatch.
6. Receipt and QC.
7. Payments.
8. Audit log.
2. Quote entry:
1. Component matrix.
2. Terms panel.
3. Draft and submit.
3. Comparison:
1. Cost and terms compare.
2. Recommendation.
3. Override with reason.
4. Clone wizard:
1. Source quote line.
2. Target demand lines.
3. Clone scope and batch overrides.
5. Dispatch and GRN:
1. Unit tracking.
2. QC evidence upload.
3. Accept/reject/hold.

## 10. Delivery Plan With Time Estimates

Assumption: 1 full-time engineer + 1 QA support, existing codebase context available.

## Phase A: Schema + Core Actions (5 to 7 working days)

1. Migrations for new tables/enums/indices.
2. Backward-safe action layer.
3. Feature flags + seed data path.
4. Unit tests for state transitions.

## Phase B: RFQ + Compare + Clone + PO (6 to 8 working days)

1. Quote matrix UI.
2. Comparison engine.
3. Clone flow.
4. PO conversion with split support.

## Phase C: Dispatch + Receipt + QC + Stock (5 to 7 working days)

1. Dispatch note and in-transit model.
2. GRN and QC capture.
3. Stock posting and ledger sync.

## Phase D: Payments + Books Adapter + KPI (4 to 6 working days)

1. Payment milestones UI/actions.
2. `books_txn_id` integration adapter.
3. KPI dashboards and ops reports.

## Total Estimate

1. MVP usable (Phase A + core of Phase B): 10 to 12 working days.
2. Full version (Phase A to D): 20 to 28 working days.

## 11. Milestone Gates

1. Gate 1:
1. Booking shortage auto requisition works.
2. Manual requisition with multi-line works.
2. Gate 2:
1. 4 to 5 dealer quotes captured with full breakup.
2. Comparison and best-select works.
3. Gate 3:
1. Selected quote converts to PO.
2. Dispatch and in-transit tracking works.
4. Gate 4:
1. Warehouse QC with media works.
2. Accepted units posted to stock.
5. Gate 5:
1. Requisition/PO payments recorded.
2. Books linkage keys stored.

## 12. Acceptance Scenarios (Your Real Cases)

1. Booking done, SKU shortage -> requisition auto-created.
2. Qty 10 same variant with color mix -> separate demand lines.
3. Multiple dealer quotes captured with all commercial components.
4. One quote cloned to selected lines and adjusted.
5. Best quote selected and converted to PO.
6. Dispatch note with chassis/engine marks in transit.
7. Warehouse receives partial units with QC media.
8. RTO/insurance pending but physical units received.
9. Requisition-stage partial/full payment recorded.

## 13. Risks and Mitigation

1. Data model drift with existing inventory code:
1. Mitigation: additive migration + compatibility adapter.
2. Performance issues in comparison screen:
1. Mitigation: snapshot table + indexed aggregates.
3. Inconsistent manual process in branches:
1. Mitigation: strict status guards and mandatory fields.

## 14. Immediate Execution Order (If Approved)

1. Start Phase A migration and action contracts.
2. Freeze old placeholder flows with redirects to new tabbed detail.
3. Complete Phase B quote compare and award.
4. Complete Phase C dispatch/QC.
5. Complete Phase D payments and Books adapter.

