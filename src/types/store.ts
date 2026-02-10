export interface CatalogItem {
    id: string;
    brand_id?: string;
    parent_id?: string;
    type: 'PRODUCT' | 'VARIANT' | 'UNIT' | 'SKU';
    name: string;
    slug?: string;
    sku_code?: string;
    category?: string;

    // Dynamic Specs (The Engine)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    specs: Record<string, any>;

    // Commercials
    price_base: number;
    item_tax_rate: number;
    hsn_code?: string;

    status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';

    // UI Helpers
}

export interface Accessory {
    id: string;
    name: string;
    displayName?: string;
    price: number;
    description?: string;
    discountPrice?: number;
    maxQty?: number;
    isMandatory?: boolean;
    inclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    suitableFor?: string;
}

export interface ServiceOption {
    id: string;
    name: string;
    price: number;
    maxQty?: number;
    description?: string;
    discountPrice?: number;
    isMandatory?: boolean;
    inclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    duration_months?: number;
}
