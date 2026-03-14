/**
 * PDP Parity Contract — Phase 1 (2026-03-14)
 *
 * Single canonical source of truth for every key that must appear in a PDP
 * card.  Keys are split into three taxonomies so that test assertions can
 * correctly distinguish unconditional from conditional presence:
 *
 *   REQUIRED_CORE_KEYS   — always rendered, parity tests assert presence
 *                          unconditionally on every device/viewport.
 *   CONDITIONAL_KEYS     — rendered only when a runtime condition is true
 *                          (e.g. otherCharges > 0, totalSavings > 0).
 *                          Tests assert: IF key present on desktop → present
 *                          on mobile too (not that it must always be present).
 *   COMMAND_BAR_KEYS     — values emitted by the command bar compute path;
 *                          all unconditional, checked in numeric parity tests.
 *
 * PDP_KEY_SOURCE_MAP provides documentation-level source + formula metadata
 * for every key.  Components MUST derive their compute from this spec;
 * any divergence is a parity bug.
 *
 * ⚠️  This file must NOT import from React or any component.
 *     It is pure constants — safe to import from both client and test code.
 */

// ─── Key Taxonomies ────────────────────────────────────────────────────────────

/** Always present regardless of runtime state */
export const REQUIRED_CORE_KEYS = [
    'ex_showroom',
    'registration',
    'insurance',
    'insurance_addons',
    'accessories',
    'services',
    'warranty',
    'tat',
] as const;

/**
 * Present only when the corresponding runtime condition is true.
 * Test rule: if present on desktop → must be present on mobile (and vice versa).
 * Tests must NOT assert these are always present.
 */
export const CONDITIONAL_KEYS = [
    'other_charges', // data.otherCharges > 0
    'o_circle_privileged', // totalSavings > 0
    'bcoin_used', // coinPricing.discount > 0
    'surge_charges', // totalSurge > 0
    'delivery_by', // winnerTatDays >= 0
    'studio_id', // bestOffer.studio_id != null
    'distance', // bestOffer.distance_km is finite
] as const;

/** Command bar parity keys — always emitted, checked numerically */
export const COMMAND_BAR_KEYS = [
    'display_on_road',
    'bcoin_equivalent',
    'total_savings',
    'footer_emi',
    'emi_tenure',
] as const;

// ─── Derived aggregates (for test convenience) ────────────────────────────────

export const ALL_PRICING_KEYS = [...REQUIRED_CORE_KEYS, ...CONDITIONAL_KEYS] as const;

export const PDP_ALL_REQUIRED_KEYS = [...REQUIRED_CORE_KEYS, ...CONDITIONAL_KEYS, ...COMMAND_BAR_KEYS] as const;

// Typescript nominal types
export type RequiredCoreKey = (typeof REQUIRED_CORE_KEYS)[number];
export type ConditionalKey = (typeof CONDITIONAL_KEYS)[number];
export type CommandBarKey = (typeof COMMAND_BAR_KEYS)[number];
export type PdpParityKey = (typeof PDP_ALL_REQUIRED_KEYS)[number];

// ─── Source-of-Truth Metadata ─────────────────────────────────────────────────
//
// source     = canonical runtime expression to compute the value
// formula    = computation strategy label
// condition  = runtime guard expression (only for conditional keys)
//
// Components must not deviate from these source paths.  If you change a
// source path, update this map AND update `buildPdpCommonState()` accordingly.

type KeyMeta = {
    source: string;
    formula: string;
    condition?: string;
};

export const PDP_KEY_SOURCE_MAP: Record<PdpParityKey, KeyMeta> = {
    // ── Required core (pricing line items) ──
    ex_showroom: {
        source: 'data.baseExShowroom',
        formula: 'direct',
    },
    registration: {
        source: 'data.rtoEstimates',
        formula: 'direct',
    },
    insurance: {
        source: 'data.baseInsurance',
        formula: 'direct',
    },
    insurance_addons: {
        source: 'Math.round((data.insuranceAddonsPrice || 0) + (data.insuranceAddonsDiscount || 0))',
        formula: 'sum',
    },
    accessories: {
        source: 'data.accessoriesPrice',
        formula: 'direct',
    },
    services: {
        source: '(data.servicesPrice || 0) + (data.servicesDiscount || 0)',
        formula: 'sum',
    },
    warranty: {
        source: 'data.warrantyItems',
        formula: 'info_label',
    },
    tat: {
        source: 'bestOffer.delivery_tat_days ?? bestOffer.deliveryTatDays ?? bestOffer.tat_days',
        formula: 'tatLabel',
    },

    // ── Conditional (pricing group 2 + delivery extras) ──
    other_charges: {
        source: 'data.otherCharges',
        formula: 'direct',
        condition: 'data.otherCharges > 0',
    },
    o_circle_privileged: {
        source: 'buildPdpCommonState().totalSavings',
        formula: 'deduction',
        condition: 'totalSavings > 0',
    },
    bcoin_used: {
        source: 'buildPdpCommonState().coinPricing.discount',
        formula: 'deduction',
        condition: 'coinPricing != null && coinPricing.discount > 0',
    },
    surge_charges: {
        source: 'buildPdpCommonState().totalSurge',
        formula: 'addition',
        condition: 'totalSurge > 0',
    },
    delivery_by: {
        source: 'bestOffer.delivery_tat_days',
        formula: 'dateLabel',
        condition: 'winnerTatDays !== null && winnerTatDays >= 0',
    },
    studio_id: {
        source: 'bestOffer.studio_id || bestOffer.studioId || bestOffer.studio',
        formula: 'direct',
        condition: 'studioIdLabel != null',
    },
    distance: {
        source: 'bestOffer.distance_km',
        formula: 'kmLabel',
        condition: 'Number.isFinite(studioDistanceKm) && studioDistanceKm >= 0',
    },

    // ── Command bar ──
    display_on_road: {
        source: 'coinPricing?.effectivePrice ?? data.totalOnRoad',
        formula: 'direct',
    },
    bcoin_equivalent: {
        source: 'coinsNeededForPrice(displayOnRoad)',
        formula: 'coin_fn',
    },
    total_savings: {
        source: 'buildPdpCommonState().totalSavings + (coinPricing?.discount ?? 0)',
        formula: 'sum',
    },
    footer_emi: {
        source: 'computeFinanceMetrics({ scheme, displayOnRoad, userDownPayment, loanAmount, totalOnRoad, emiTenure }).monthlyEmi',
        formula: 'finance_fn',
    },
    emi_tenure: {
        source: 'data.emiTenure',
        formula: 'direct',
    },
};
