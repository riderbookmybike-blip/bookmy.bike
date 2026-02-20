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
    status: VehicleStatus;
    bodyType: 'MOTORCYCLE' | 'SCOOTER' | 'MOPED' | 'ACCESSORY' | 'SERVICE';
    fuelType: 'PETROL' | 'EV' | 'CNG';
    displacement?: number;
    powerUnit: 'CC' | 'KW';
    segment: string;
    rating: number;
    popularityScore?: number;
    price: {
        exShowroom: number;
        onRoad: number;
        offerPrice?: number;
        discount?: number;
        pricingSource?: string; // e.g., 'MH', 'KA'
        isEstimate?: boolean; // true if fallback used
        bundleValue?: number; // Value of free bundled accessories
        bundlePrice?: number; // Discounted price of bundled accessories
        bundleSavings?: number; // Bundle MRP - Bundle Price
        totalSavings?: number; // Vehicle Discount + Bundle Value
    };
    skuIds?: string[]; // IDs of all SKUs belonging to this variant for pricing aggregation
    districtPrices?: Array<{ district: string; exShowroom: number }>;
    specifications: VehicleSpecifications;
    availableColors: Array<{
        id: string; // The SKU ID for this specific color
        name: string;
        hexCode: string;
        imageUrl?: string;
        zoomFactor?: number;
        isFlipped?: boolean;
        offsetX?: number;
        offsetY?: number;
        finish?: string;
        position?: number;
    }>;
    imageUrl: string;
    zoomFactor?: number;
    isFlipped?: boolean;
    offsetX?: number;
    offsetY?: number;
    color?: string; // Selected color
    suitableFor?: string;
    studioName?: string; // Dealer/Studio name from best offer
    dealerId?: string; // Dealer tenant ID
    studioCode?: string; // e.g. 'ST-001'
    dealerLocation?: string; // e.g. 'MUMBAI, MAHARASHTRA'
}

export interface VehicleSpecifications {
    engine: {
        displacement?: string;
        type?: string;
        maxPower?: string;
        maxTorque?: string;
        numValves?: string;
        startType?: string;
        mileage?: string;
        cooling?: string;
        cylinders?: string;
        boreStroke?: string;
        compressionRatio?: string;
        topSpeed?: string;
    };
    transmission: {
        type: string;
        gears?: string;
        clutch?: string;
    };
    brakes?: {
        front?: string;
        rear?: string;
        abs?: string;
    };
    suspension?: {
        front?: string;
        rear?: string;
    };
    battery?: {
        range?: string;
        chargingTime?: string;
        capacity?: string;
        motorPower?: string;
    };
    dimensions: {
        kerbWeight?: string;
        seatHeight?: string;
        groundClearance?: string;
        wheelbase?: string;
        fuelCapacity?: string;
        curbWeight?: string;
        overallLength?: string;
        overallWidth?: string;
        overallHeight?: string;
        chassisType?: string;
    };
    tyres?: {
        front?: string;
        rear?: string;
        type?: string;
        wheelType?: string;
        frontWheelSize?: string;
        rearWheelSize?: string;
    };
    features: {
        bluetooth?: boolean | string;
        usbCharging?: boolean | string;
        navigation?: boolean | string;
        consoleType?: string;
        headlampType?: string;
        tailLampType?: string;
        rideModes?: string;
        abs?: string;
        speedometer?: string;
        tripmeter?: string;
        clock?: boolean;
        lowFuelIndicator?: boolean;
        lowOilIndicator?: boolean;
        lowBatteryIndicator?: boolean;
        pillionSeat?: boolean;
        pillionFootrest?: boolean;
        standAlarm?: boolean;
        passLight?: boolean;
        killswitch?: boolean;
    };
    warranty?: {
        years?: string;
        distance?: string;
        serviceInterval?: string;
    };
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
            engine: { displacement: '349 cc', maxPower: '20.2 bhp', maxTorque: '27 Nm' },
            transmission: { type: 'Manual', gears: '5 Speed' },
            dimensions: { seatHeight: '790 mm', kerbWeight: '181 kg', curbWeight: '181 kg', fuelCapacity: '13 L' },
            features: { bluetooth: false, abs: 'Dual Channel' },
        },
        availableColors: [
            { id: 'rebel-blue', name: 'Rebel Blue', hexCode: '#0047AB' },
            { id: 'rebel-red', name: 'Rebel Red', hexCode: '#D22B2B' },
            { id: 'rebel-black', name: 'Rebel Black', hexCode: '#1A1A1A' },
        ],
        imageUrl: '/images/bikes/hunter350.png',
        color: 'Rebel Blue',
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
            engine: { displacement: '349 cc', maxPower: '20.2 bhp', maxTorque: '27 Nm' },
            transmission: { type: 'Manual', gears: '5 Speed' },
            dimensions: { seatHeight: '805 mm', kerbWeight: '195 kg', curbWeight: '195 kg', fuelCapacity: '13 L' },
            features: { bluetooth: false, abs: 'Dual Channel' },
        },
        availableColors: [
            { id: 'desert-sand', name: 'Desert Sand', hexCode: '#C2B280' },
            { id: 'marsh-grey', name: 'Marsh Grey', hexCode: '#4B5320' },
        ],
        imageUrl: '/images/bikes/classic350.png',
        color: 'Desert Sand',
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
            engine: { displacement: '348 cc', maxPower: '20.8 bhp', maxTorque: '30 Nm' },
            transmission: { type: 'Manual', gears: '5 Speed' },
            dimensions: { seatHeight: '800 mm', kerbWeight: '181 kg', curbWeight: '181 kg', fuelCapacity: '15 L' },
            features: { bluetooth: true, abs: 'Dual Channel' },
        },
        availableColors: [
            { id: 'precious-red', name: 'Precious Red Metallic', hexCode: '#8B0000' },
            { id: 'marshal-green', name: 'Matte Marshal Green Metallic', hexCode: '#2F4F4F' },
        ],
        imageUrl: '/images/bikes/hness350.png',
        color: 'Precious Red Metallic',
    },
];

export const MOCK_ACCESSORIES = [
    {
        id: 'acc-1',
        name: 'Full Face Helmet',
        brand: 'Axor',
        price: 4500,
        image: '/images/accessories/helmet.png',
        category: 'Safety',
    },
    {
        id: 'acc-2',
        name: 'Riding Gloves',
        brand: 'Rynox',
        price: 2800,
        image: '/images/accessories/gloves.png',
        category: 'Riding Gear',
    },
];

export const MOCK_SERVICES = [
    {
        id: 'serv-1',
        name: 'General Service',
        description: 'Comprehensive checkup and oil change',
        price: 1499,
        duration: '4 Hours',
    },
    {
        id: 'serv-2',
        name: 'Teflon Coating',
        description: 'Paint protection for long lasting shine',
        price: 899,
        duration: '2 Hours',
    },
];

export type ProductType = 'VEHICLE' | 'ACCESSORY' | 'SERVICE';
export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'UPCOMING';

export interface DealerBrandConfig {
    id: string;
    dealerId: string;
    brandName: string;
    isActive: boolean;
    defaultMarginType: 'FIXED' | 'PERCENTAGE';
    defaultMarginValue: number;
    lastUpdated: string;
    logoUrl?: string;
}

export const MOCK_DEALER_BRANDS: DealerBrandConfig[] = [
    {
        id: 'db-re',
        dealerId: 'current',
        brandName: 'Royal Enfield',
        logoUrl: '/images/logos/royal-enfield.png',
        isActive: true,
        defaultMarginType: 'PERCENTAGE',
        defaultMarginValue: 12,
        lastUpdated: new Date().toISOString(),
    },
    {
        id: 'db-honda',
        dealerId: 'current',
        brandName: 'Honda',
        logoUrl: '/images/logos/honda.png',
        isActive: true,
        defaultMarginType: 'PERCENTAGE',
        defaultMarginValue: 10,
        lastUpdated: new Date().toISOString(),
    },
    {
        id: 'db-tvs',
        dealerId: 'current',
        brandName: 'TVS',
        logoUrl: '/images/logos/tvs.png',
        isActive: false,
        defaultMarginType: 'PERCENTAGE',
        defaultMarginValue: 8,
        lastUpdated: new Date().toISOString(),
    },
];
