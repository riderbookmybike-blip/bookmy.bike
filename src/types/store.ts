export interface CatalogTemplate {
    id: string;
    name: string;
    code: string;
    hierarchy_config: {
        l1: string;
        l2: string;
    };
    attribute_config: {
        key: string;
        label: string;
        type: 'text' | 'number' | 'select' | 'boolean';
        options?: string[];
        suffix?: string;
        required?: boolean;
    }[];
}

export interface CatalogItem {
    id: string;
    template_id: string;
    brand_id?: string;
    parent_id?: string;
    type: 'FAMILY' | 'VARIANT' | 'SKU';
    name: string;
    slug?: string;
    sku_code?: string;

    // Dynamic Specs (The Engine)
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
    price: number;
    description?: string;
    discountPrice?: number;
    maxQty?: number;
    isMandatory?: boolean;
}

export interface ServiceOption {
    id: string;
    name: string;
    price: number;
    description?: string;
    discountPrice?: number;
    maxQty?: number;
}
