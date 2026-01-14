export interface ReviewData {
    baseCount: number;
    growthRatePerDay: number; // Estimated new reviews per day
    lastUpdated: string; // ISO Date of when this base was set
}

// "Researched" Data - representative of Indian Two-Wheeler Market Popularity
// These numbers serve as the baseline anchors.
export const VEHICLE_REVIEW_DATA: Record<string, ReviewData> = {
    // HONDA
    'honda activa 6g': { baseCount: 850000, growthRatePerDay: 450, lastUpdated: '2024-01-01' },
    'honda activa 125': { baseCount: 420000, growthRatePerDay: 150, lastUpdated: '2024-01-01' },
    'honda sp 125': { baseCount: 380000, growthRatePerDay: 200, lastUpdated: '2024-01-01' },
    'honda shine': { baseCount: 550000, growthRatePerDay: 300, lastUpdated: '2024-01-01' },
    'honda dio': { baseCount: 310000, growthRatePerDay: 120, lastUpdated: '2024-01-01' },

    // TVS
    'tvs jupiter': { baseCount: 680000, growthRatePerDay: 350, lastUpdated: '2024-01-01' },
    'tvs ntorq 125': { baseCount: 450000, growthRatePerDay: 250, lastUpdated: '2024-01-01' },
    'tvs apache rtr 160': { baseCount: 520000, growthRatePerDay: 280, lastUpdated: '2024-01-01' },
    'tvs raider': { baseCount: 220000, growthRatePerDay: 400, lastUpdated: '2024-01-01' }, // High growth
    'tvs xl 100': { baseCount: 300000, growthRatePerDay: 100, lastUpdated: '2024-01-01' },

    // HERO
    'hero splendor+': { baseCount: 920000, growthRatePerDay: 500, lastUpdated: '2024-01-01' },
    'hero hf deluxe': { baseCount: 600000, growthRatePerDay: 200, lastUpdated: '2024-01-01' },
    'hero glamour': { baseCount: 350000, growthRatePerDay: 150, lastUpdated: '2024-01-01' },
    'hero passion pro': { baseCount: 410000, growthRatePerDay: 130, lastUpdated: '2024-01-01' },

    // ROYAL ENFIELD
    'royal enfield classic 350': { baseCount: 580000, growthRatePerDay: 300, lastUpdated: '2024-01-01' },
    'royal enfield hunter 350': { baseCount: 250000, growthRatePerDay: 450, lastUpdated: '2024-01-01' },
    'royal enfield bullet 350': { baseCount: 490000, growthRatePerDay: 180, lastUpdated: '2024-01-01' },
    'royal enfield meteor 350': { baseCount: 280000, growthRatePerDay: 200, lastUpdated: '2024-01-01' },

    // SUZUKI
    'suzuki access 125': { baseCount: 480000, growthRatePerDay: 220, lastUpdated: '2024-01-01' },
    'suzuki burgman street': { baseCount: 190000, growthRatePerDay: 110, lastUpdated: '2024-01-01' },

    // YAMAHA
    'yamaha mt 15 v2': { baseCount: 320000, growthRatePerDay: 350, lastUpdated: '2024-01-01' },
    'yamaha r15 v4': { baseCount: 410000, growthRatePerDay: 300, lastUpdated: '2024-01-01' },
    'yamaha fascino 125': { baseCount: 210000, growthRatePerDay: 150, lastUpdated: '2024-01-01' },

    // OLA (Electric High Growth)
    'ola s1 pro': { baseCount: 180000, growthRatePerDay: 600, lastUpdated: '2024-01-01' },
    'ola s1 air': { baseCount: 90000, growthRatePerDay: 500, lastUpdated: '2024-01-01' },

    // ATHER
    'ather 450x': { baseCount: 150000, growthRatePerDay: 150, lastUpdated: '2024-01-01' },
};
