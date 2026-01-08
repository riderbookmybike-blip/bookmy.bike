export type ReferralType = 'PERSON' | 'CAMPAIGN' | 'EVENT' | 'BANK' | 'OPEN' | 'SYSTEM';
export type ReferralPlatform = 'bookmy.bike' | 'dealer' | 'bank';
export type ReferralMode = 'BANK_ONLY' | 'OPEN_LOWEST';

export interface ReferralSource {
    id: string;        // 9-char alphanumeric
    code: string;      // Unique
    type: ReferralType;
    platform: ReferralPlatform;
    mode: ReferralMode;
    name: string;
    description?: string;
    allowedBanks?: string[]; // IDs of allowed banks. If empty & mode=OPEN, all allowed.
    linkedEntityId?: string; // If Person/Bank specific
    validFrom?: string;
    validTo?: string;
    isActive: boolean;
}

// --- MOCK GENERATOR ---

export const generateReferralSources = (): ReferralSource[] => {
    return [
        // 1. BANK_ONLY Source (Kotak)
        {
            id: 'REF-SRC-K01',
            code: 'KOTAK2025',
            type: 'BANK',
            platform: 'bank',
            mode: 'BANK_ONLY',
            name: 'Kotak Exclusive Offer',
            description: 'Exclusive rates for Kotak Loans',
            allowedBanks: ['BANK-KOTAK'],
            isActive: true
        },
        // 2. OPEN Source (General)
        {
            id: 'REF-SRC-OP1',
            code: 'OPEN8M2K9',
            type: 'OPEN',
            platform: 'bookmy.bike',
            mode: 'OPEN_LOWEST',
            name: 'Best Rate Finder',
            description: 'Compare all banks',
            allowedBanks: [], // All
            isActive: true
        },
        // 3. CAMPAIGN Source (Diwali - restricted to HDFC + SBI)
        {
            id: 'REF-SRC-CP1',
            code: 'DIWALI25X',
            type: 'CAMPAIGN',
            platform: 'bookmy.bike',
            mode: 'BANK_ONLY',
            name: 'Diwali Dhamaka',
            allowedBanks: ['BANK-HDFC', 'BANK-SBI'],
            isActive: true
        },
        // 4. PERSON Source (Standard - Open)
        {
            id: 'REF-SRC-P01',
            code: 'AJIT9P2L7',
            type: 'PERSON',
            platform: 'bookmy.bike',
            mode: 'OPEN_LOWEST',
            name: 'Ajit Singh',
            linkedEntityId: 'CUST-1001',
            isActive: true
        }
    ];
};

export const getRandomReferralSource = (sources: ReferralSource[]) => sources[Math.floor(Math.random() * sources.length)];
