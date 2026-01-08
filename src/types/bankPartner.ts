export type BankPartnerStatus = 'ACTIVE' | 'INACTIVE';

export interface BankLocation {
    id: string;
    branchName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contactNumber: string;
    isPrimary: boolean;
}

export interface BankTeamMember {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    reportingToId?: string; // Optional hierarchy
}

export type InterestType = 'REDUCING' | 'FLAT';
export type ChargeType = 'FIXED' | 'PERCENTAGE' | 'TABLE';
export type ChargeCalculationBasis = 'LOAN_AMOUNT' | 'GROSS_LOAN_AMOUNT' | 'VEHICLE_PRICE' | 'FIXED';
export type ChargeImpact = 'UPFRONT' | 'FUNDED';

export interface SchemeTableEntry {
    minAge: number;
    maxAge: number;
    tenure: number;
    rate: number; // Rate %
}

export interface SchemeCharge {
    id: string;
    name: string;
    type: ChargeType;
    value: number; // Used for FIXED/PERCENTAGE
    calculationBasis: ChargeCalculationBasis;
    impact: ChargeImpact;
    tableData?: SchemeTableEntry[]; // Used if type === 'TABLE'
}

export interface BankScheme {
    id: string;
    name: string;
    isActive: boolean;

    // Validity
    validFrom?: string;
    validTo?: string;

    // Eligibility
    minTenure: number;
    maxTenure: number;
    minLoanAmount: number;
    maxLoanAmount: number;
    maxLTV: number; // % of Vehicle Price

    // Rates & Earnings
    interestRate: number;
    interestType: InterestType;
    payout: number; // Dealer Payout/Commission (% or Fixed? Assuming % of Loan for now as per industry std, or let's use fixed text for now)
    payoutType: ChargeType; // 'PERCENTAGE' of Loan OR 'FIXED' amount

    // Dynamic Charges (PF, Doc, Stamp, etc.)
    charges: SchemeCharge[];
}

export interface BankPartner {
    id: string;
    displayId: string;
    name: string; // e.g., "HDFC Bank", "IDFC First"
    logo?: string;
    status: BankPartnerStatus;

    // Data
    overview: {
        description: string;
        website?: string;
        supportEmail?: string;
        supportPhone?: string;
    };
    locations: BankLocation[];
    team: BankTeamMember[];
    schemes: BankScheme[];
}

// Mock Data
export const MOCK_BANK_PARTNERS: BankPartner[] = [
    {
        id: 'bp1',
        displayId: 'BNK-7X2-M9Q',
        name: 'HDFC Bank',
        status: 'ACTIVE',
        overview: {
            description: 'Leading private sector bank for two-wheeler loans.',
            website: 'https://hdfcbank.com',
            supportEmail: 'loans@hdfcbank.com',
            supportPhone: '1800-202-6161'
        },
        locations: [
            { id: 'l1', branchName: 'M G Road', city: 'Pune', state: 'Maharashtra', pincode: '411001', address: '123 MG Road', contactNumber: '020-12345678', isPrimary: true }
        ],
        team: [
            { id: 't1', name: 'Amit Sharma', role: 'Area Manager', email: 'amit@hdfc.com', phone: '9876543210' },
            { id: 't2', name: 'Rahul Verma', role: 'Sales Officer', email: 'rahul@hdfc.com', phone: '9876543211', reportingToId: 't1' }
        ],
        schemes: [
            {
                id: 'sch1',
                name: 'Super Saver 2W',
                isActive: true,
                validFrom: '2024-01-01',
                validTo: '2024-12-31',
                minTenure: 12,
                maxTenure: 36,
                minLoanAmount: 30000,
                maxLoanAmount: 200000,
                maxLTV: 90, // 90% Funding
                interestRate: 10.5,
                interestType: 'REDUCING',
                payout: 1.5,
                payoutType: 'PERCENTAGE',
                charges: [
                    { id: 'ch1', name: 'Processing Fee', type: 'PERCENTAGE', value: 2, calculationBasis: 'GROSS_LOAN_AMOUNT', impact: 'UPFRONT' },
                    { id: 'ch2', name: 'Documentation', type: 'FIXED', value: 2065, calculationBasis: 'FIXED', impact: 'UPFRONT' }, // 'FIXED' basis is redundant but keeps type safe
                    { id: 'ch3', name: 'Stamp Duty', type: 'FIXED', value: 590, calculationBasis: 'FIXED', impact: 'UPFRONT' },
                    { id: 'ch4', name: 'Hypothecation', type: 'FIXED', value: 500, calculationBasis: 'FIXED', impact: 'UPFRONT' },
                    { id: 'ch5', name: 'Credit Life Insurance', type: 'FIXED', value: 3000, calculationBasis: 'FIXED', impact: 'FUNDED' } // Funded = Added to Loan
                ]
            }
        ]
    }
];
