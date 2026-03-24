/**
 * Member Fields — Single Source of Truth
 * ─────────────────────────────────────────
 * Defines the canonical DB column names on `id_members` for location, analytics,
 * and other platform-tracked fields.
 * Import these constants instead of hardcoding column names.
 */

// ── Location columns on id_members ──────────────────────────────────────────
/**
 * All geolocation columns written when a member grants browser location access.
 * Source: Nominatim reverse geocoding + browser Geolocation API.
 */
export const MEMBER_LOCATION_FIELDS = {
    /** ISO state name  e.g. "Maharashtra" */
    STATE: 'state',
    /** District / county e.g. "Nashik" */
    DISTRICT: 'district',
    /** Taluka / tehsil / block e.g. "Dindori" */
    TALUKA: 'taluka',
    /** Locality / village / suburb / area e.g. "Ozar" */
    AREA: 'address', // mapped to the existing `address` TEXT column
    /** 6-digit Indian pincode */
    PINCODE: 'pincode',
    /** GPS latitude (double precision) */
    LATITUDE: 'latitude',
    /** GPS longitude (double precision) */
    LONGITUDE: 'longitude',
} as const;

export type MemberLocationFieldKey = keyof typeof MEMBER_LOCATION_FIELDS;
export type MemberLocationFieldValue = (typeof MEMBER_LOCATION_FIELDS)[MemberLocationFieldKey];

/**
 * localStorage key used to debounce repeated geo-saves.
 * Stores the ISO timestamp of the last successful location save.
 */
export const GEO_LAST_SAVED_KEY = 'bmb_geo_last_saved' as const;

/** Minimum interval (ms) between geo saves to avoid flooding the DB. Default: 24 hours. */
export const GEO_SAVE_INTERVAL_MS = 86_400_000; // 24 * 60 * 60 * 1000
