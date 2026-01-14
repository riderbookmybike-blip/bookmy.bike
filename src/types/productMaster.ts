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

// MOCK DATA for Initial State
export const MOCK_VEHICLES: ProductVariant[] = [
    {
        id: 'v1',
        type: 'VEHICLE',
        make: 'Honda',
        model: 'Activa 6G',
        variant: 'Standard',
        bodyType: 'SCOOTER',
        fuelType: 'PETROL',
        displacement: 109.51,
        powerUnit: 'CC',
        segment: 'COMMUTER',
        displayName: 'Honda Activa 6G Standard',
        color: 'Matte Axis Grey',
        sku: 'HND-ACT-6G-STD-MAG',
        hsnCode: '871120',
        gstRate: 28,
        label: 'Honda / Activa 6G / Standard / Matte Axis Grey',
        status: 'ACTIVE',
        rating: 4.8,
        price: {
            exShowroom: 74851,
            onRoad: 88500,
            offerPrice: 85500,
            discount: 3000
        },
        specifications: {
            engine: {
                displacement: '109.51 cc',
                maxPower: '7.84 PS @ 8000 rpm',
                maxTorque: '8.90 Nm @ 5250 rpm',
                horsepower: '7.84 HP',
                cooling: 'Air Cooled'
            },
            tyres: {
                frontTyre: '90/100-10',
                rearTyre: '90/100-10',
                frontBrake: 'Drum',
                rearBrake: 'Drum',
                wheelSize: '10 inch'
            },
            dimensions: {
                length: '1761 mm',
                width: '710 mm',
                height: '1156 mm',
                wheelbase: '1238 mm',
                groundClearance: '165 mm',
                seatHeight: '765 mm',
                kerbWeight: '110 kg',
                fuelCapacity: '5.3 L'
            },
            battery: {
                batteryCapacity: 'N/A',
                range: 'N/A',
                chargingTime: 'N/A',
                motorType: 'N/A'
            },
            features: {
                digitalConsole: 'Yes',
                ledLights: 'Yes',
                usbCharging: 'No',
                storageSpace: '18L'
            },
            transmission: {
                type: 'CVT'
            }
        },
        features: ['Silent Start with ACG', 'Double Lid External Fuel Fill', 'LED DC Headlamp']
    },
    {
        id: 'v1b',
        type: 'VEHICLE',
        make: 'Honda',
        model: 'Activa 6G',
        variant: 'Standard',
        bodyType: 'SCOOTER',
        fuelType: 'PETROL',
        displacement: 109.51,
        powerUnit: 'CC',
        segment: 'COMMUTER',
        displayName: 'Honda Activa 6G Standard',
        color: 'Decent Blue',
        sku: 'HND-ACT-6G-STD-DBL',
        hsnCode: '871120',
        gstRate: 28,
        label: 'Honda / Activa 6G / Standard / Decent Blue',
        status: 'ACTIVE',
        rating: 4.8,
        price: {
            exShowroom: 75250,
            onRoad: 89000
        },
        specifications: {
            engine: { displacement: '109.51 cc' },
            transmission: { type: 'CVT' }
        }
    },
    {
        id: 'v2',
        type: 'VEHICLE',
        make: 'Royal Enfield',
        model: 'Classic 350',
        variant: 'Dark',
        bodyType: 'MOTORCYCLE',
        fuelType: 'PETROL',
        displacement: 349.34,
        powerUnit: 'CC',
        segment: 'CRUISER',
        displayName: 'Royal Enfield Classic 350 Dark',
        color: 'Stealth Black',
        sku: 'RE-CLS-350-DRK-BLK',
        hsnCode: '871120',
        gstRate: 28,
        label: 'Royal Enfield / Classic 350 / Dark / Stealth Black',
        status: 'ACTIVE',
        rating: 4.7,
        price: {
            exShowroom: 220991,
            onRoad: 255000,
            offerPrice: 249000,
            discount: 6000
        },
        specifications: {
            engine: {
                displacement: '349.34 cc',
                maxPower: '20.21 PS @ 6100 rpm',
                maxTorque: '27 Nm @ 4000 rpm',
                cooling: 'Air-Oil Cooled'
            },
            transmission: {
                type: 'Manual',
                gears: 5
            }
        },
        features: ['Dual Channel ABS', 'Tripper Navigation', 'USB Charging Port']
    },
    {
        id: 'v2b',
        type: 'VEHICLE',
        make: 'Royal Enfield',
        model: 'Classic 350',
        variant: 'Dark',
        bodyType: 'MOTORCYCLE',
        fuelType: 'PETROL',
        displacement: 349.34,
        powerUnit: 'CC',
        segment: 'CRUISER',
        displayName: 'Royal Enfield Classic 350 Dark',
        color: 'Gunmetal Grey',
        sku: 'RE-CLS-350-DRK-GRY',
        hsnCode: '871120',
        gstRate: 28,
        label: 'Royal Enfield / Classic 350 / Dark / Gunmetal Grey',
        status: 'ACTIVE',
        rating: 4.7,
        price: {
            exShowroom: 222000,
            onRoad: 257000,
            surge: 2000
        },
        specifications: {
            engine: { displacement: '349.34 cc' },
            transmission: { type: 'Manual', gears: 5 }
        }
    },
    // Yamaha R15M V4 - Actual Specifications from Yamaha Motor India
    {
        id: 'v3',
        type: 'VEHICLE',
        make: 'Yamaha',
        model: 'R15M',
        variant: 'V4',
        bodyType: 'MOTORCYCLE',
        fuelType: 'PETROL',
        displacement: 155,
        powerUnit: 'CC',
        segment: 'SPORT',
        displayName: 'Yamaha R15M V4',
        color: 'Metallic Grey',
        sku: 'YMH-R15M-V4-GRY',
        hsnCode: '871120',
        gstRate: 28,
        label: 'Yamaha / R15M / V4 / Metallic Grey',
        status: 'ACTIVE',
        rating: 4.9,
        price: {
            exShowroom: 196500,
            onRoad: 228000
        },
        specifications: {
            engine: {
                displacement: '155 cc',
                maxPower: '18.4 PS @ 10,000 rpm',
                maxTorque: '14.2 Nm @ 7,500 rpm',
                cooling: 'Liquid Cooled',
                fuelSystem: 'Fuel Injection'
            },
            transmission: {
                type: 'Manual',
                gears: 6,
                clutchType: 'Wet, Multiple-Disc, Assist & Slipper'
            },
            brakes: {
                front: '282mm Disc',
                rear: '220mm Disc'
            },
            wheels: {
                front: '100/80-17',
                rear: '140/70-17'
            },
            dimensions: {
                length: '1,990 mm',
                width: '725 mm',
                height: '1,135 mm',
                wheelbase: '1,325 mm',
                groundClearance: '170 mm',
                seatHeight: '815 mm',
                kerbWeight: '142 kg',
                fuelCapacity: '11 L'
            }
        },
        features: [
            'Variable Valve Actuation (VVA)',
            'Quick Shifter (Upshift)',
            'Traction Control System (TCS)',
            'Dual Channel ABS',
            'LED Headlight with DRL',
            'Negative LCD Instrument Cluster',
            'Y-Connect App Connectivity',
            'USD Front Forks'
        ]
    }
];

export const MOCK_ACCESSORIES: ProductVariant[] = [
    {
        id: 'a1',
        type: 'ACCESSORY',
        make: 'Studds',
        model: 'Ninja 3G',
        variant: 'Flip Up',
        size: 'L (58cm)',
        sku: 'STD-NIN-3G-BLK-L',
        hsnCode: '650610',
        gstRate: 18,
        label: 'Studds / Ninja 3G / Flip Up / L (58cm)',
        status: 'ACTIVE',
        compatibility: {
            makes: ['ALL']
        }
    },
    {
        id: 'a2',
        type: 'ACCESSORY',
        make: 'Honda',
        model: 'Chrome Guard',
        variant: 'Full Kit',
        sku: 'HND-ACT-GRD-SET',
        hsnCode: '871410',
        gstRate: 18,
        label: 'Honda / Chrome Guard / Full Kit',
        status: 'ACTIVE',
        compatibility: {
            makes: ['Honda'],
            models: ['Activa 6G', 'Activa 125']
        }
    }
];

export const MOCK_SERVICES: ProductVariant[] = [
    {
        id: 's1',
        type: 'SERVICE',
        make: 'AUMS',
        model: 'AMC',
        variant: 'Gold Plan',
        duration: '1 Year',
        sku: 'SVC-AMC-GLD-1Y',
        hsnCode: '998729',
        gstRate: 18,
        label: 'Service / AMC / Gold Plan / 1 Year',
        status: 'ACTIVE',
        compatibility: {
            makes: ['ALL']
        }
    }
];

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

export const MOCK_DEALER_PRODUCTS: DealerProduct[] = [
    {
        id: 'dp1',
        dealerId: 'd1',
        productVariantId: 'v1', // Honda Activa
        isActive: true,
        purchasePrice: 72000,
        sellingPrice: 85000,
        margin: 13000,
        lastUpdated: '2024-01-02T10:00:00Z',
        updatedBy: 'Sales Manager'
    }
];

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

export const MOCK_DEALER_BRANDS: DealerBrandConfig[] = [
    {
        id: 'db-honda',
        dealerId: 'current-user',
        brandName: 'Honda',
        isActive: true,
        defaultMarginType: 'FIXED',
        defaultMarginValue: 2000,
        lastUpdated: new Date().toISOString()
    }
];

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
