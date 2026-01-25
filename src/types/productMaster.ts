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
        mileage?: string;
    };
    imageUrl?: string;
    color?: string; // Added for product card
    availableColors: {
        hexCode: string;
        secondaryHexCode?: string;
        name: string;
        imageUrl?: string; // Added for color gallery
    }[];
}
