export type ProductType = 'VEHICLE' | 'ACCESSORY' | 'SERVICE';

export type VehicleStatus = 'ACTIVE' | 'DISCONTINUED' | 'UPCOMING';

export interface HSNConfig {
    id: string;
    code: string; // 6-digit HSN
    description: string;
    gstRate: number; // e.g. 28
    type: 'VEHICLE' | 'ACCESSORY' | 'PART' | 'SERVICE';
}

export interface CompatibilityRule {
    makes: string[]; // ['Honda', 'TVS'] or ['ALL']
    models?: string[]; // ['Activa 6G'] - Optional if applies to all models of a make
    variants?: string[]; // Specific variants if needed
}

export interface VehicleSpecifications {
    engine?: {
        displacement?: string;
        maxPower?: string;
        maxTorque?: string;
        cooling?: string;
        horsepower?: string;
        fuelSystem?: string;
    };
    transmission?: {
        type: string;
        gears?: number;
        clutchType?: string;
    };
    dimensions?: {
        length?: string;
        width?: string;
        height?: string;
        wheelbase?: string;
        groundClearance?: string;
        seatHeight?: string;
        curbWeight?: string;
        kerbWeight?: string;
        fuelCapacity?: string;
    };
    tyres?: {
        frontTyre?: string;
        rearTyre?: string;
        frontBrake?: string;
        rearBrake?: string;
        wheelSize?: string;
    };
    battery?: {
        batteryCapacity?: string;
        range?: string;
        chargingTime?: string;
        motorType?: string;
    };
    features?: {
        digitalConsole?: string;
        ledLights?: string;
        usbCharging?: string;
        storageSpace?: string;
        bluetooth?: string;
    };
    brakes?: {
        front?: string;
        rear?: string;
    };
    wheels?: {
        front?: string;
        rear?: string;
    };
    console?: string;
    mileage?: string;
}

export interface ProductBrand {
    id: string;
    name: string;
    logoUrl?: string;
    type: ProductType;
    modelCount: number;
    skuCount: number;
    status: VehicleStatus;
}

export interface ProductVariant {
    id: string;
    type: ProductType;

    // Hierarchy
    make: string;      // Honda
    model: string;     // Activa
    variant: string;   // Standard / 6G
    bodyType?: 'SCOOTER' | 'MOTORCYCLE' | 'MOPED' | 'ELECTRIC_BIKE' | 'ELECTRIC_SCOOTER'; // Enhanced category filtering
    fuelType?: string;   // PETROL, ELECTRIC, etc.
    displacement?: number; // 110, 350, etc.
    powerUnit?: 'CC' | 'KW';
    segment?: string;    // COMMUTER, SPORT, CRUISER, etc.

    // Detailed Context
    displayName?: string; // Full public name
    slug: string;        // URL slug (e.g. "zx")
    modelSlug: string;   // URL slug for the model (e.g. "jupiter")

    // Attributes
    color?: string;    // Imperial Red (Vehicles)
    size?: string;     // L, XL, 94cm (Accessories)
    duration?: string; // 1 Year (Services)

    // Compliance
    hsnCode?: string;
    gstRate?: number; // percentage (e.g. 28)

    // Generated
    sku: string;       // Unique System ID
    label: string;     // "Honda / Activa / Standard / Imperial Red"

    // Specifications & Features
    specifications?: VehicleSpecifications;
    features?: string[];

    // Pricing & Media
    price?: {
        exShowroom: number;
        onRoad?: number;
        offerPrice?: number;
        discount?: number;
        surge?: number;
    };
    imageUrl?: string;
    availableColors?: Array<{
        id: string;
        name: string;
        hexCode: string;
        secondaryHexCode?: string;
        finish?: 'MATT' | 'GLOSSY' | 'METALLIC' | 'SATIN';
        imageUrl?: string;
    }>;

    // Meta
    status: VehicleStatus;
    rating?: number;
    isNew?: boolean;

    // For Accessories/Services Only
    compatibility?: CompatibilityRule;
}

// MOCK DATA REMOVED - REPLACED WITH DB FETCH

// DEALER PRODUCT LINKAGE
export interface DealerProduct {
    id: string; // Linkage ID
    dealerId: string;
    productVariantId: string; // Ref to ProductVariant.id

    // Dealer Overrides
    isActive: boolean;
    purchasePrice: number;
    sellingPrice: number;

    // Computed/Audited
    margin: number;
    lastUpdated: string;
    updatedBy: string;
}

// DEALER BRAND CONFIGURATION (STEP 3)
export interface DealerBrandConfig {
    id: string; // e.g., "db-honda"
    dealerId: string;
    brandName: string; // "Honda"
    isActive: boolean;

    // Brand Level Pricing Rules
    defaultMarginType: 'FIXED' | 'PERCENTAGE';
    defaultMarginValue: number; // e.g., 5000 (Fixed) or 10 (%)

    lastUpdated: string;
}

// --- JUPITER FLOW TYPES (STUDIO MODE) ---

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    isShared?: boolean; // UI indicator for inherited media
    thumbnail?: string;
}

export interface ModelVariant {
    id: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    hsnCode?: string;
    gstRate?: number;
    specifications?: Record<string, Record<string, string | number>>;
}

export interface ModelColor {
    id: string;
    name: string;
    finish?: 'MATT' | 'GLOSSY' | 'METALLIC' | 'SATIN';
    code: string;
    variantIds: string[];
    allIds?: string[]; // Multiple DB rows for the same UI color group
    primaryVariantIds?: string[]; // Variant IDs where this color is primary
    media: MediaItem[];
    variantOverrides?: Record<string, { media?: MediaItem[] }>;
    pricingOverride?: {
        exShowroom?: number;
        discount?: number;
        dealerOffer?: number; // Extra dealer discount
        onRoadOverride?: number; // Final manual override if needed
    };
}

export interface VehicleModel {
    id: string;
    name: string;
    brand: string;
    category?: string;
    fuelType?: string;
    hsnCode?: string;
    gstRate?: number;
    variants: ModelVariant[];
    colors: ModelColor[];
}
