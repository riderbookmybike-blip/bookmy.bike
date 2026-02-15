import {
    ProductVariant,
    DealerBrandConfig,
    MOCK_VEHICLES,
    MOCK_ACCESSORIES,
    MOCK_SERVICES,
    MOCK_DEALER_BRANDS,
} from '@/types/productMaster';

// Local mock override type (not part of shared productMaster exports)
interface DealerProduct {
    productVariantId: string;
    dealerId: string;
    purchasePrice: number;
    margin: number;
    sellingPrice: number;
    isActive: boolean;
}

// Local mock overrides (empty by default)
const MOCK_DEALER_PRODUCTS: DealerProduct[] = [];

export interface PriceBreakdown {
    basePrice: number; // Cost / Purchase Price
    margin: number;
    sellingPrice: number;
    source: 'VARIANT_OVERRIDE' | 'BRAND_RULE' | 'MASTER_FALLBACK';
}

// Helper to find Master Product
const getMasterProduct = (variantId: string): any => {
    return [...MOCK_VEHICLES, ...MOCK_ACCESSORIES, ...MOCK_SERVICES].find(p => p.id === variantId);
};

export function calculateDealerPrice(variantId: string, dealerId: string = 'current-user'): PriceBreakdown {
    const master = getMasterProduct(variantId);
    if (!master) {
        throw new Error(`Product Variant ${variantId} not found`);
    }

    // 1. Check Variant Override
    const override = MOCK_DEALER_PRODUCTS.find(dp => dp.productVariantId === variantId && dp.dealerId === dealerId);

    if (override && override.isActive) {
        return {
            basePrice: override.purchasePrice,
            margin: override.margin,
            sellingPrice: override.sellingPrice,
            source: 'VARIANT_OVERRIDE',
        };
    }

    // 2. Check Brand Rule
    const brandConfig = MOCK_DEALER_BRANDS.find(b => b.brandName === master.make);

    // Mock Master Base Price (Assume standard purchase price is ~85% of some hypothetical MRP,
    // but since we don't have MRP in Master, let's assume a base cost for the mock)
    // For specific mock items, we can harcode or derive.
    // Let's derive a "Standard Purchase Price" based on a mock lookup or random for prototype.
    // actually, let's just assume a base cost map for the MOCK_VEHICLES
    let baseCost = 70000;
    const masterType = (master as any)?.type;
    if (masterType === 'ACCESSORY') baseCost = 1500;
    if (masterType === 'SERVICE') baseCost = 500;

    // Better mock data handling:
    const modelName = (master as any)?.model || (master as any)?.name || '';
    if (modelName.includes('Activa')) baseCost = 72000;
    if (modelName.includes('Classic')) baseCost = 180000;

    if (brandConfig && brandConfig.isActive) {
        const margin = baseCost * ((brandConfig.defaultMarginValue || 0) / 100);

        return {
            basePrice: baseCost,
            margin: margin,
            sellingPrice: baseCost + margin,
            source: 'BRAND_RULE',
        };
    }

    // 3. Fallback (Not Enabled or No Rule)
    return {
        basePrice: baseCost,
        margin: 0,
        sellingPrice: baseCost, // Sell at cost? Or maybe valid logic is it's not sellable.
        source: 'MASTER_FALLBACK',
    };
}

export function isProductEnabledForDealer(variantId: string, dealerId: string = 'current-user'): boolean {
    const master = getMasterProduct(variantId);
    if (!master) return false;

    // 1. Check Specific Override
    const override = MOCK_DEALER_PRODUCTS.find(dp => dp.productVariantId === variantId);
    if (override) return override.isActive;

    // 2. Check Brand Config
    const brandConfig = MOCK_DEALER_BRANDS.find(b => b.brandName === master.make);
    if (brandConfig) return brandConfig.isActive;

    return false; // Disabled by default if no brand rule
}
