export type VehicleCollectionMode = 'catalog' | 'favorites' | 'compare' | 'variant_compare';
export type VehicleCardViewMode = 'grid' | 'list';
export type CompareTab = 'favorites' | 'variants' | 'studio';

export interface VehicleModeConfig {
    defaultView: VehicleCardViewMode;
    allowedViews: VehicleCardViewMode[];
    minCompareSelection: number;
    compareCap: number;
}

export const DEFAULT_COMPARE_CAP = 3;
export const DEFAULT_MIN_COMPARE_SELECTION = 2;
export const CATALOG_COMPARE_CAP = 8;

export const VEHICLE_MODE_CONFIG: Record<VehicleCollectionMode, VehicleModeConfig> = {
    catalog: {
        defaultView: 'grid',
        allowedViews: ['grid'], // list hidden — only on compare page
        minCompareSelection: DEFAULT_MIN_COMPARE_SELECTION,
        compareCap: CATALOG_COMPARE_CAP,
    },
    favorites: {
        defaultView: 'grid',
        allowedViews: ['grid'], // list hidden — only on compare page
        minCompareSelection: DEFAULT_MIN_COMPARE_SELECTION,
        compareCap: DEFAULT_COMPARE_CAP,
    },
    compare: {
        defaultView: 'grid',
        allowedViews: ['grid', 'list'],
        minCompareSelection: DEFAULT_MIN_COMPARE_SELECTION,
        compareCap: DEFAULT_COMPARE_CAP,
    },
    variant_compare: {
        defaultView: 'grid',
        allowedViews: ['grid', 'list'],
        minCompareSelection: DEFAULT_MIN_COMPARE_SELECTION,
        compareCap: DEFAULT_COMPARE_CAP,
    },
};

export function getSafeViewMode(mode: VehicleCollectionMode, viewMode?: VehicleCardViewMode): VehicleCardViewMode {
    const config = VEHICLE_MODE_CONFIG[mode];
    if (!viewMode) return config.defaultView;
    return config.allowedViews.includes(viewMode) ? viewMode : config.defaultView;
}

export function compareLimitMessage(cap: number): string {
    return `Max ${cap} models to compare`;
}

export function compareMinSelectionMessage(min: number): string {
    return `Select at least ${min} models to compare`;
}

export function resolveCompareTab(rawTab: string | null, hasFavorites: boolean): CompareTab {
    if (rawTab === 'favorites' || rawTab === 'wishlist') return 'favorites';
    if (rawTab === 'variants' || rawTab === 'studio') return rawTab;
    return hasFavorites ? 'favorites' : 'studio';
}

export function getCompareTabQueryValue(tab: CompareTab): string {
    return tab;
}
