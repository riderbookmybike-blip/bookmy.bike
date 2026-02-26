/**
 * Pricing Constants — Centralized EMI factors and IDV depreciation.
 *
 * EMI factors are flat-rate multipliers for approximate EMI calculation.
 * IDV depreciation is applied to ex-showroom price for insurance valuation.
 */

export const EMI_FACTORS: Record<number, number> = {
    12: 0.091,
    24: 0.049,
    36: 0.035,
    48: 0.028,
    60: 0.024,
};

export const DEFAULT_EMI_TENURE = 36;

export const IDV_DEPRECIATION_RATE = 0.95;

/** NaN-safe EMI factor lookup. Falls back to DEFAULT_EMI_TENURE for any unrecognized value. */
export const getEmiFactor = (tenure: number): number => EMI_FACTORS[tenure] ?? EMI_FACTORS[DEFAULT_EMI_TENURE];
