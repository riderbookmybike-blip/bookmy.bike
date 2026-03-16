export type LatLng = {
    lat: number | null;
    lng: number | null;
};

export type GeoCoordinates = {
    latitude: number | null;
    longitude: number | null;
};

export type CoordinateInput = {
    lat?: unknown;
    lng?: unknown;
    latitude?: unknown;
    longitude?: unknown;
};

const toFiniteNumber = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeLatLng = (input: CoordinateInput | null | undefined): LatLng => {
    if (!input || typeof input !== 'object') return { lat: null, lng: null };
    const lat = toFiniteNumber((input as CoordinateInput).lat ?? (input as CoordinateInput).latitude);
    const lng = toFiniteNumber((input as CoordinateInput).lng ?? (input as CoordinateInput).longitude);
    return { lat, lng };
};

export const normalizeGeoCoordinates = (input: CoordinateInput | null | undefined): GeoCoordinates => {
    const { lat, lng } = normalizeLatLng(input);
    return {
        latitude: lat,
        longitude: lng,
    };
};

export const hasValidCoordinates = (
    coords: Partial<GeoCoordinates | LatLng> | null | undefined
): coords is { latitude: number; longitude: number } | { lat: number; lng: number } => {
    if (!coords || typeof coords !== 'object') return false;
    const lat = toFiniteNumber((coords as any).lat ?? (coords as any).latitude);
    const lng = toFiniteNumber((coords as any).lng ?? (coords as any).longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
};
