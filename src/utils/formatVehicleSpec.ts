/**
 * Centralized Vehicle Spec Formatting Utility
 * Eliminates scattered .toFixed() and unit logic across the codebase.
 */

/** Format engine displacement (e.g., "97.00cc" or "124.80cc") */
export function formatEngineCC(value: number | string | undefined | null, decimals = 2): string {
    if (value == null || value === '') return '—';
    const num = Number(value);
    if (isNaN(num)) return '—';
    return `${num.toFixed(decimals)}cc`;
}

/** Format fuel capacity (e.g., "5.1L") */
export function formatFuelCapacity(value: number | string | undefined | null, decimals = 1): string {
    if (value == null || value === '') return '—';
    const num = Number(value);
    if (isNaN(num)) return '—';
    return `${num.toFixed(decimals)}L`;
}

/** Format mileage (e.g., "62 km/l") */
export function formatMileage(value: number | string | undefined | null): string {
    if (value == null || value === '') return '—';
    const num = Number(value);
    if (isNaN(num)) return `${value}`;
    return `${Math.round(num)} km/l`;
}

/** Format currency with Indian notation (₹1.24L, ₹2.50Cr) */
export function formatCurrencyCompact(value: number | undefined | null): string {
    if (value == null) return '—';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
}

/** Format percentage (e.g., "12.50%") */
export function formatPercent(value: number | undefined | null, decimals = 2): string {
    if (value == null) return '—';
    return `${value.toFixed(decimals)}%`;
}

/** Format interest rate from decimal (e.g., 0.085 → "8.50%") */
export function formatInterestRate(decimal: number | undefined | null, decimals = 2): string {
    if (decimal == null) return '—';
    return `${(decimal * 100).toFixed(decimals)}%`;
}

/** Format file size (bytes → KB/MB) */
export function formatFileSize(bytes: number | undefined | null): string {
    if (bytes == null) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format zoom/scale factor (e.g., "1.5x") */
export function formatScale(value: number | undefined | null, decimals = 1): string {
    if (value == null) return '—';
    return `${value.toFixed(decimals)}x`;
}

/** Format coordinates (e.g., "19.0760") */
export function formatCoordinate(value: number | undefined | null, decimals = 6): string {
    if (value == null) return '—';
    return value.toFixed(decimals);
}

/** Format rating (e.g., "4.5/5") */
export function formatRating(value: number | undefined | null, decimals = 1): string {
    if (value == null || !Number.isFinite(value)) return '—';
    return `${value.toFixed(decimals)}/5`;
}

/** Format price range for filters (e.g., "Under 1.5L") */
export function formatPriceLabel(maxPrice: number): string {
    if (maxPrice >= 100000) return `Under ${(maxPrice / 100000).toFixed(1)}L`;
    if (maxPrice >= 1000) return `Under ${(maxPrice / 1000).toFixed(0)}K`;
    return `Under ₹${maxPrice}`;
}
