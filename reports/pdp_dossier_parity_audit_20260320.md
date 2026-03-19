# PDP ↔ Dossier Parity Audit Report
**Date:** 2026-03-20  
**Auditor:** _______________  
**Branch/Commit:** _______________  
**Status:** 🔲 In Progress / ✅ Complete

---

## Section 1 — SOT Contract (PDP as Source of Truth)

### 1.1 Pricing Card Rows (Exact Order)
| # | Row Label | Sign | Zero-Render Rule |
|---|---|---|---|
| 1 | Ex-Showroom | + | Always |
| 2 | Registration | + | Always (even ₹0) |
| 3 | Insurance | + | Always |
| 4 | Insurance Add-ons | + | Always |
| 5 | Accessories | + | Always |
| 6 | Services | + | Always |
| 7 | Warranty | + | Always |
| — | *(spacer)* | — | — |
| 8 | Gross Total | + | Always (bold) |
| 9 | O'Circle Privileged | − | Only if > 0 |
| 10 | Bcoin Used - N | − | Only if > 0 |
| 11 | Surge Charges | + | Only if > 0 |
| — | *(spacer)* | — | — |
| 12 | TAT | info | If present |
| 13 | Delivery By | info | If present |
| 14 | Studio ID | info | If present |
| — | **Net On-Road Price** | = | Always (hero) |

### 1.2 Finance Card Expectations
- Selected scheme displayed at top
- All tenure rows (12, 18, 24, 36, 48, 60 mo) rendered
- Selected tenure highlighted
- EMI formula: flat-rate factor × loan_amount

### 1.3 EMI Calendar (Amortization) Expectations
- Renders for `isLoanQuote === true`
- Year-wise accordion
- Columns: Month, EMI, Principal, Interest, Balance
- `disbursementDate` = `quote.created_at`

---

## Section 2 — Field-Level Mapping Matrix

| PDP Display | DB / Snapshot Field | Dossier Source Path | Type | Status |
|---|---|---|---|---|
| Ex-Showroom | `pricing_snapshot.ex_showroom` | `pricing.exShowroom` | Exact | 🔲 |
| Registration | `pricing_snapshot.rto_total` | `pricing.rtoTotal` | Exact | 🔲 |
| Insurance | `pricing_snapshot.insurance_total` | `pricing.insuranceTotal` | Exact | 🔲 |
| Insurance Add-ons | `pricing_snapshot.insurance_addons_total` | `pricing.insuranceAddonsTotal` | Exact | 🔲 |
| Accessories | `pricing_snapshot.accessories_total` | `pricing.accessoriesTotal` | Exact | 🔲 |
| Services | `pricing_snapshot.services_total` | `pricing.servicesTotal` | Exact | 🔲 |
| Warranty | `pricing_snapshot.warranty_items[]` | `pricing.warrantyItems` | Exact | 🔲 |
| O'Circle Privileged | `pricing_snapshot.total_savings` | `pricing.totalSavings` | Exact | 🔲 |
| Bcoin Used - N | `pricing_snapshot.coin_used` | `pricing.coinUsed` | ✅ Fixed (0823d30e) | 🔲 |
| Coin Discount ₹ | `pricing_snapshot.coin_discount` | `pricing.coinDiscount` | ✅ Fixed | 🔲 |
| Coin-Adjusted Price | `pricing_snapshot.coin_effective_onroad` | `pricing.coinEffectiveOnRoad` | ✅ Fixed | 🔲 |
| Surge Charges | `pricing_snapshot.total_surge` | `pricing.totalSurge` | Exact | 🔲 |
| Net On-Road Price | `grand_total` + `coin_effective_onroad` | `offerOnRoad` | Derived | 🔲 |
| TAT | `pricing_snapshot.delivery.tat` | `pricing.deliveryTatDays` | Exact | 🔲 |
| Delivery By | computed from TAT | `pricing.deliveryByLabel` | Derived | 🔲 |
| Studio ID | `pricing_snapshot.dealer.studio_id` | `pricing.studioId` | Exact | 🔲 |
| Finance Bank | `commercials.finance.bank_name` | `quote.finance.bankName` | Exact | 🔲 |
| Finance Scheme | `commercials.finance.scheme_name` | `quote.finance.schemeName` | Exact | 🔲 |
| Finance ROI | `commercials.finance.roi` | `quote.finance.roi` | Exact | 🔲 |
| Finance Tenure | `commercials.finance.tenure_months` | `quote.finance.tenureMonths` | Exact | 🔲 |
| Finance EMI | `commercials.finance.emi` | `quote.finance.emi` | Exact | 🔲 |
| Finance Loan Amt | `commercials.finance.loan_amount` | `quote.finance.loanAmount` | Exact | 🔲 |
| Down Payment | `commercials.finance.down_payment` | `quote.finance.downPayment` | Exact | 🔲 |
| Selected Accessories | `pricing_snapshot.accessory_items[]` | `pricing.accessories` | ✅ Fixed (0823d30e) | 🔲 |
| Selected Services | `pricing_snapshot.service_items[]` | `pricing.services` | ✅ Fixed | 🔲 |
| Selected Insurance Req | `pricing_snapshot.insurance_required_items[]` | `pricing.insuranceRequired` | ✅ Fixed | 🔲 |
| Selected Insurance Addons | `pricing_snapshot.insurance_addon_items[]` | `pricing.insuranceAddons` | ✅ Fixed | 🔲 |
| RTO Options | `pricing_snapshot.rto_options[]` | `pricing.rtoOptions` | ✅ Fixed | 🔲 |
| Referral Bonus | `pricing_snapshot.referral_bonus` | `pricing.referralBonus` | Exact | 🔲 |

**Status Legend:** `Exact` = direct pass-through | `Derived` = computed at render | `Missing` = not in snapshot | `Fallback drift risk` = recomputed from catalog

---

## Section 3 — Page-by-Page Parity Audit

### Page 3 — Pricing

| Check | Expected | Actual | Status | Severity |
|---|---|---|---|---|
| All 14 rows present | See SOT §1.1 | ___ | 🔲 | ___ |
| Row order matches | Sequential 1-14 | ___ | 🔲 | ___ |
| Ex-Showroom value | = `pricing_snapshot.ex_showroom` | ___ | 🔲 | ___ |
| Coin deduction row present | Only if `coin_discount > 0` | ___ | 🔲 | ___ |
| `Bcoin Used - N` shows correct N | = `pricing.coinUsed` | ___ | 🔲 | ___ |
| Net price = coin-effective | `coinEffectiveOnRoad ?? onRoadTotal` | ___ | 🔲 | ___ |
| Savings amount correct | `totalSavings` from snapshot | ___ | 🔲 | ___ |
| TAT row present | If `deliveryTatDays` set | ___ | 🔲 | ___ |
| Studio ID row present | If `studioId` set | ___ | 🔲 | ___ |

### Page 4 — Finance Planner

| Check | Expected | Actual | Status | Severity |
|---|---|---|---|---|
| Finance Not Selected guard | Shows empty state if `!isLoanQuote` | ___ | 🔲 | — |
| Bank name shown | `quote.finance.bankName` | ___ | 🔲 | ___ |
| Correct EMI in hero card | `quote.finance.emi` (not recomputed) | ___ | 🔲 | ___ |
| Selected tenure highlighted | Matches `quote.finance.tenureMonths` | ___ | 🔲 | ___ |
| All tenure rows rendered | 12/18/24/36/48/60 mo | ___ | 🔲 | ___ |
| EMI formula consistent | Flat-rate × `loanAmount` | ___ | 🔲 | ___ |
| Down Payment correct | `quote.finance.downPayment` | ___ | 🔲 | ___ |

### Page 5 — Finance Summary

| Check | Expected | Actual | Status | Severity |
|---|---|---|---|---|
| Renders for loan quotes | `isLoanQuote === true` | ___ | 🔲 | — |
| Empty state for cash | "Direct Liquid Purchase" | ___ | 🔲 | — |
| Financier name | `quote.finance.bankName` | ___ | 🔲 | ___ |
| Scheme name | `quote.finance.schemeName` | ___ | 🔲 | ___ |
| ROI displayed | `quote.finance.roi` | ___ | 🔲 | ___ |
| Net Loan Amount | `quote.finance.loanAmount` | ___ | 🔲 | ___ |
| Total Outflow | `netLoan + totalInterest` | ___ | 🔲 | ___ |

### Page 6 — EMI Calendar (Amortization)

| Check | Expected | Actual | Status | Severity |
|---|---|---|---|---|
| Renders for `isLoanQuote` | Year accordion visible | ___ | 🔲 | — |
| Empty state for cash | "No EMI Schedule Applicable" | ___ | 🔲 | — |
| Disbursement date | `quote.created_at` | ___ | 🔲 | ___ |
| Interest type | `quote.finance.interestType` or `REDUCING` | ___ | 🔲 | ___ |
| Total months = tenure | Rows count = `tenureMonths` | ___ | 🔲 | ___ |
| Final balance = 0 | Last row balance ≈ ₹0 | ___ | 🔲 | ___ |
| Year 1 expanded by default | `expandedYear = 1` | ___ | 🔲 | ___ |

### Page 7 — Accessories

| Check | Expected | Actual | Status | Severity |
|---|---|---|---|---|
| Only selected items shown | No full-catalog fallback | ✅ Fixed | — | — |
| Empty = "None Selected" placeholder | Not blank page | ___ | 🔲 | ___ |
| Selected items match PDP | IDs from `pricing_snapshot.accessory_items[]` | ___ | 🔲 | ___ |

### Page 8 — Insurance

| Check | Expected | Actual | Status | Severity |
|---|---|---|---|---|
| Required items from snapshot only | No `optionInsuranceRequired` fallback | ✅ Fixed | — | — |
| Add-ons from snapshot only | No `optionInsuranceAddons` fallback | ✅ Fixed | — | — |
| Insurance total matches | `pricing_snapshot.insurance_total` | ___ | 🔲 | ___ |

### Page 9 — Registration (RTO)

| Check | Expected | Actual | Status | Severity |
|---|---|---|---|---|
| RTO options from snapshot only | No live fallback | ✅ Fixed | — | — |
| Selected RTO type highlighted | `pricing.rtoType` | ___ | 🔲 | ___ |
| RTO total matches pricing card | `pricing_snapshot.rto_total` | ___ | 🔲 | ___ |

---

## Section 4 — Data Completeness Audit

| Field | Stored in Snapshot? | Dossier Uses It? | Gap |
|---|---|---|---|
| `coin_effective_onroad` | ✅ (0823d30e) | ✅ | None |
| `coin_discount` | ✅ (0823d30e) | 🔲 verify | Verify label |
| `coin_used` | ✅ (0823d30e) | 🔲 verify | Verify count display |
| `accessory_items[]` | ✅ | ✅ | None |
| `service_items[]` | ✅ | ✅ | None |
| `insurance_required_items[]` | ✅ | ✅ | None |
| `insurance_addon_items[]` | ✅ | ✅ | None |
| `rto_options[]` | ✅ | ✅ | None |
| `warranty_items[]` | ✅ | 🔲 verify | Verify render |
| `rto_breakdown[]` | ✅ | 🔲 verify | HiFi recompute skipped? |
| `insurance_breakdown[]` | ✅ | 🔲 verify | HiFi recompute skipped? |
| `referral_bonus` | ✅ | 🔲 verify | Label present? |
| Finance interestType | `pricing_snapshot.finance_interest_type` | ✅ (c8cd9eed) | None |
| `disbursementDate` for amort | `quote.created_at` | ✅ (c8cd9eed) | None |

---

## Section 5 — State & User-Type Audit

| Scenario | Test Path | Pricing Source | Expected Behavior | Status |
|---|---|---|---|---|
| Logged-in consumer, own quote | `/store → save → /q/ID` | `cat_price_state_mh` | Full parity | 🔲 |
| Logged-in consumer, coin applied | `/store → apply coins → save → dossier` | snapshot | `coinEffectiveOnRoad` in hero | 🔲 |
| OCircle member, referral active | Source with `referral_applied=true` | snapshot | Referral row visible | 🔲 |
| Cash purchase (no finance) | Save without selecting finance | — | EMI pages show empty state | 🔲 |
| Old quote (pre-parity-fix) | Quote saved before `0823d30e` | fallback | Graceful HiFi fallback | 🔲 |
| Staff-created CRM quote | Via CRM quote editor | dealer pricing | Parity with CRM input | 🔲 |

---

## Section 6 — Known Issues Backlog

| ID | Page | Description | Severity | Fixed In |
|---|---|---|---|---|
| P1-001 | Page 3 | `Bcoin Used - N` row visibility | P1 | 0823d30e |
| P1-002 | Page 3 | `coin_effective_onroad` as hero price | P1 | 0823d30e |
| P1-003 | Pages 7-9 | Full catalog fallback instead of selected-only | P1 | 0823d30e |
| P1-004 | Pages 5-6 | `financeMode` strict check caused blank EMI page | P1 | c8cd9eed |
| P2-001 | All pages | ALL CAPS labels on card content | P2 | c012fcc3 |
| P3-001 | All pages | `disbursementDate=null` → wrong EMI dates | P3 | c8cd9eed |
| 🔲 | Page 4 | Verify actual `quote.finance.emi` vs EMI_FACTORS recompute | P0 | Pending |
| 🔲 | Page 3 | Bcoin count `N` actual display verification | P1 | Pending |
| 🔲 | Page 3 | Referral bonus row label | P2 | Pending |

---

## Section 7 — Evidence Template

For each new finding, capture:

```
### FIND-XXX
**Page:** Dossier Page N  
**Severity:** P0 / P1 / P2 / P3  
**PDP value:** ₹XX,XXX  
**Dossier value:** ₹XX,XXX  
**Source path (PDP):** ProductClient.tsx:NNN  
**Source path (Dossier):** DossierClient.tsx:NNN  
**DB field:** `commercials.pricing_snapshot.*`  
**Payload snippet:**
```json
{ "field": "value" }
```
**Screenshot:** `reports/pdp_dossier_mismatch_evidence/FIND-XXX-pdp.png`  
**Screenshot:** `reports/pdp_dossier_mismatch_evidence/FIND-XXX-dossier.png`  
**Remediation:** One-line fix description
```

---

## Final Scorecard (Fill after audit)

| Dossier Page | Pass/Fail | P0 | P1 | P2 | P3 | Notes |
|---|---|---|---|---|---|---|
| Page 3 — Pricing | 🔲 | _ | _ | _ | _ | |
| Page 4 — Finance Planner | 🔲 | _ | _ | _ | _ | |
| Page 5 — Finance Summary | 🔲 | _ | _ | _ | _ | |
| Page 6 — EMI Calendar | 🔲 | _ | _ | _ | _ | |
| Page 7 — Accessories | 🔲 | _ | _ | _ | _ | |
| Page 8 — Insurance | 🔲 | _ | _ | _ | _ | |
| Page 9 — RTO | 🔲 | _ | _ | _ | _ | |
| Page 10 — Services | 🔲 | _ | _ | _ | _ | |
| **Total** | | _ | _ | _ | _ | |
