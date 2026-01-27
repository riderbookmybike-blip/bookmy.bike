export interface ProductVariant {
    id: string;
    type: 'VEHICLE';
    make: string;
    model: string;
    variant: string;
    displayName: string;
    label: string;
    slug: string;
    modelSlug: string;
    sku: string;
    status: 'ACTIVE' | 'INACTIVE';
    bodyType: 'MOTORCYCLE' | 'SCOOTER';
    fuelType: 'PETROL' | 'EV' | 'CNG';
    displacement?: number;
    powerUnit: 'CC' | 'KW';
    segment: string;
    rating: number;
    price: {
        exShowroom: number;
        onRoad: number;
        offerPrice?: number;
        discount?: number;
        pricingSource?: string; // e.g., 'MH', 'KA'
        isEstimate?: boolean;   // true if fallback used
    };
    specifications: {
        engine: {
            displacement?: number;
            maxPower?: string;
            maxTorque?: string;
        };
        transmission: {
            type: string;
            gears?: string;
        };
        battery?: {
            range?: string;
            chargingTime?: string;
        };
        dimensions: {
            seatHeight?: string;
            kerbWeight?: string;
            curbWeight?: string; // Add alias for backward compat
            fuelCapacity?: string;
        };
        features: {
            bluetooth?: boolean | string; // Handled both type forms
            abs?: string;
        };
    };
    availableColors: Array<{
        name: string;
        hexCode: string;
        imageUrl?: string;
        zoomFactor?: number;
        isFlipped?: boolean;
        offsetX?: number;
        offsetY?: number;
    }>;
    imageUrl: string;
    zoomFactor?: number;
    isFlipped?: boolean;
    offsetX?: number;
    offsetY?: number;
    color?: string; // Selected color
}

// Mock Data for Development/Fallback
export const MOCK_VEHICLES: ProductVariant[] = [
    {
        id: 're-hunter-350-metro',
        type: 'VEHICLE',
        make: 'Royal Enfield',
        model: 'Hunter 350',
        variant: 'Metro Rebel',
        displayName: 'Hunter 350 Metro Rebel',
        label: 'Best Seller',
        slug: 'royal-enfield-hunter-350-metro-rebel',
        modelSlug: 'hunter-350',
        sku: 'RE-H350-METRO',
        status: 'ACTIVE',
        bodyType: 'MOTORCYCLE',
        fuelType: 'PETROL',
        displacement: 349,
        powerUnit: 'CC',
        segment: 'Roadster',
        rating: 4.8,
        price: {
            exShowroom: 169656,
            onRoad: 198000,
            offerPrice: 195000,
            discount: 3000,
            pricingSource: 'Delhi',
        },
        specifications: {
            engine: { displacement: 349, maxPower: '20.2 bhp', maxTorque: '27 Nm' },
            transmission: { type: 'Manual', gears: '5 Speed' },
            dimensions: { seatHeight: '790 mm', kerbWeight: '181 kg', curbWeight: '181 kg', fuelCapacity: '13 L' },
            features: { bluetooth: false, abs: 'Dual Channel' },
        },
        availableColors: [
            { name: 'Rebel Blue', hexCode: '#0047AB' },
            { name: 'Rebel Red', hexCode: '#D22B2B' },
            { name: 'Rebel Black', hexCode: '#1A1A1A' }
        ],
        imageUrl: '/images/bikes/hunter350.png',
        color: 'Rebel Blue'
    },
    {
        id: 're-classic-350-signals',
        type: 'VEHICLE',
        make: 'Royal Enfield',
        model: 'Classic 350',
        variant: 'Signals Edition',
        displayName: 'Classic 350 Signals',
        label: 'Trending',
        slug: 'royal-enfield-classic-350-signals',
        modelSlug: 'classic-350',
        sku: 'RE-C350-SIG',
        status: 'ACTIVE',
        bodyType: 'MOTORCYCLE',
        fuelType: 'PETROL',
        displacement: 349,
        powerUnit: 'CC',
        segment: 'Cruiser',
        rating: 4.9,
        price: {
            exShowroom: 213000,
            onRoad: 245000,
        },
        specifications: {
            engine: { displacement: 349, maxPower: '20.2 bhp', maxTorque: '27 Nm' },
            transmission: { type: 'Manual', gears: '5 Speed' },
            dimensions: { seatHeight: '805 mm', kerbWeight: '195 kg', curbWeight: '195 kg', fuelCapacity: '13 L' },
            features: { bluetooth: false, abs: 'Dual Channel' },
        },
        availableColors: [
            { name: 'Desert Sand', hexCode: '#C2B280' },
            { name: 'Marsh Grey', hexCode: '#4B5320' }
        ],
        imageUrl: '/images/bikes/classic350.png',
        color: 'Desert Sand'
    },
    {
        id: 'honda-cb350-hness',
        type: 'VEHICLE',
        make: 'Honda',
        model: 'Hness CB350',
        variant: 'DLX Pro',
        displayName: 'Hness CB350 DLX Pro',
        label: 'Premium',
        slug: 'honda-hness-cb350-dlx-pro',
        modelSlug: 'hness-cb350',
        sku: 'HON-CB350-DLX',
        status: 'ACTIVE',
        bodyType: 'MOTORCYCLE',
        fuelType: 'PETROL',
        displacement: 348,
        powerUnit: 'CC',
        segment: 'Classic',
        rating: 4.7,
        price: {
            exShowroom: 209857,
            onRoad: 238000,
            discount: 5000,
        },
        specifications: {
            engine: { displacement: 348, maxPower: '20.8 bhp', maxTorque: '30 Nm' },
            transmission: { type: 'Manual', gears: '5 Speed' },
            dimensions: { seatHeight: '800 mm', kerbWeight: '181 kg', curbWeight: '181 kg', fuelCapacity: '15 L' },
            features: { bluetooth: true, abs: 'Dual Channel' },
        },
        availableColors: [
            { name: 'Precious Red Metallic', hexCode: '#8B0000' },
            { name: 'Matte Marshal Green Metallic', hexCode: '#2F4F4F' }
        ],
        imageUrl: '/images/bikes/hness350.png',
        color: 'Precious Red Metallic'
    }
];

export const MOCK_ACCESSORIES = [
    {
        id: 'acc-1',
        name: 'Full Face Helmet',
        brand: 'Axor',
        price: 4500,
        image: '/images/accessories/helmet.png',
        category: 'Safety'
    },
    {
        id: 'acc-2',
        name: 'Riding Gloves',
        brand: 'Rynox',
        price: 2800,
        image: '/images/accessories/gloves.png',
        category: 'Riding Gear'
    }
];

export const MOCK_SERVICES = [
    {
        id: 'serv-1',
        name: 'General Service',
        description: 'Comprehensive checkup and oil change',
        price: 1499,
        duration: '4 Hours'
    },
    {
        id: 'serv-2',
        name: 'Teflon Coating',
        description: 'Paint protection for long lasting shine',
        price: 899,
        duration: '2 Hours'
    }
];

export interface DealerBrandConfig {
    brandName: string;
    logoUrl: string;
    isActive: boolean;
    margin: number;
}

export const MOCK_DEALER_BRANDS: DealerBrandConfig[] = [
    {
        brandName: 'Royal Enfield',
        logoUrl: '/images/logos/royal-enfield.png',
        isActive: true,
        margin: 12
    },
    {
        brandName: 'Honda',
        logoUrl: '/images/logos/honda.png',
        isActive: true,
        margin: 10
    },
    {
        brandName: 'TVS',
        logoUrl: '/images/logos/tvs.png',
        isActive: false,
        margin: 8
    }
];
