export type BankPartnerStatus = 'ACTIVE' | 'INACTIVE';

export type LocationType = 'BRANCH' | 'SERVICE_POINT';

export interface BankLocation {
    id: string;
    branchName: string;
    type: LocationType;
    address: string;
    taluka: string;
    state: string;
    pincode: string;
    contactNumber: string;
    isPrimary: boolean;
}

export type MemberStatus = 'ACTIVE' | 'ON_NOTICE' | 'RELEASED';
export type BankDesignation =
    | 'SYSTEM_ADMIN'
    | 'EXECUTIVE'
    | 'TEAM_LEADER'
    | 'AREA_SALES_MANAGER'
    | 'REGIONAL_SALES_MANAGER'
    | 'ZONAL_MANAGER'
    | 'NATIONAL_SALES_MANAGER';

export interface BankTeamMember {
    id: string;
    name: string;
    designation: BankDesignation;
    email: string;
    phone: string;

    // Tracking Dates
    dob?: string;
    doj?: string;
    anniversary?: string;

    // Status tracking
    status: MemberStatus;
    onNoticePeriod?: boolean;
    releaseDate?: string;

    // Hierarchy & Multitenancy
    reportingToId?: string;

    // Serviceability
    serviceability: {
        states: string[]; // ['Maharashtra', 'Gujarat'] or ['ALL'] for NSM
        areas: string[]; // ['Pune', 'Mumbai']
        dealerIds: string[]; // Specific BMB Dealer IDs
    };
}

export type InterestType = 'REDUCING' | 'FLAT';
export type ChargeType = 'FIXED' | 'PERCENTAGE' | 'TABLE';
export type ChargeCalculationBasis =
    | 'LOAN_AMOUNT'
    | 'GROSS_LOAN_AMOUNT'
    | 'VEHICLE_PRICE'
    | 'DISBURSAL_AMOUNT'
    | 'FIXED';
export type ChargeImpact = 'UPFRONT' | 'FUNDED';

export interface SchemeTableEntry {
    minAge: number;
    maxAge: number;
    tenure: number;
    rate: number; // Rate %
}

export interface PremiumTableCell {
    tenure: number; // e.g. 12, 18, 24, 36 months
    minLA: number; // Loan Amount range start
    maxLA: number; // Loan Amount range end
    value: number; // Charge amount (₹) for this cell
}

export type TaxStatus = 'INCLUSIVE' | 'EXCLUSIVE' | 'NOT_APPLICABLE';

export interface SchemeCharge {
    id: string;
    name: string;
    type: ChargeType;
    value: number; // Used for FIXED/PERCENTAGE
    calculationBasis: ChargeCalculationBasis;
    impact: ChargeImpact;
    taxStatus: TaxStatus;
    taxRate?: number; // e.g., 18 for 18% GST
    tableData?: SchemeTableEntry[]; // Used if type === 'TABLE' (legacy)
    premiumTable?: PremiumTableCell[]; // Tenure × LA Range matrix

    // Integration
    masterChargeId?: string; // Link to a template in chargesMaster
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
    allowedTenures?: number[]; // Optional list of specific allowed tenures
    minLoanAmount: number;
    maxLoanAmount: number;
    maxLTV: number; // % of Vehicle Price

    // Rates & Earnings
    interestRate: number;
    interestType: InterestType;
    payout: number; // Dealer Payout/Commission
    payoutType: ChargeType; // 'PERCENTAGE' or 'FIXED'
    payoutBasis?: ChargeCalculationBasis; // Basis for percentage calculation (LOAN_AMOUNT, GROSS_LOAN_AMOUNT, DISBURSAL_AMOUNT, FIXED)

    // Dynamic Charges (PF, Doc, Stamp, etc.)
    charges: SchemeCharge[];

    // Applicability Rules
    applicability: {
        brands: 'ALL' | string[]; // ['Honda', 'Hero']
        models: 'ALL' | string[]; // ['Activa 6G', 'Splendor+']
        dealerships: 'ALL' | string[]; // BMB Dealer IDs
    };

    // Features & Incentives
    emiWaiverCount?: number;
    subvention?: number; // Platform/Dealer contribution to lower interest
    subventionType?: ChargeType; // 'PERCENTAGE' or 'FIXED'

    // Marketplace Targeting
    isPrimary?: boolean; // If true, this is the default scheme for this bank in marketplace
}

export interface ManagementMapping {
    states: string[];
    areas: string[];
    dealerIds: string[];
}

export interface BankPartner {
    id: string;
    displayId: string;
    name: string; // e.g., "HDFC Bank", "IDFC First"
    logo?: string; // Legacy
    identity: {
        fullLogo?: string;
        iconLogo?: string;
    };
    admin?: {
        name: string;
        phone: string;
        email: string;
    };
    status: BankPartnerStatus;

    // Data
    overview: {
        description: string;
        website?: string;
        supportEmail?: string;
        supportPhone?: string;
        whatsapp?: string;
        customerCare?: string;
        helpline?: string;
        appLinks?: {
            android?: string;
            ios?: string;
        };
    };
    locations: BankLocation[];
    team: BankTeamMember[];
    schemes: BankScheme[];

    // Master Configs
    chargesMaster: SchemeCharge[];
    management: ManagementMapping; // Global Mapping
}

// Day-wise Routing Configuration
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface DayRouting {
    p1: string; // Tenant ID or 'ANY'
    p2: string; // Tenant ID or 'ANY'
    p3: string; // Tenant ID or 'ANY'
}

export type FinanceRoutingTable = Record<DayOfWeek, DayRouting>;

// Mock Data
export const MOCK_BANK_PARTNERS: BankPartner[] = [
    {
        id: 'bp1',
        displayId: 'BNK-7X2-M9Q',
        name: 'HDFC Bank',
        identity: {
            fullLogo: 'https://logos-world.net/wp-content/uploads/2021/09/HDFC-Bank-Logo.png',
            iconLogo: 'https://vignette.wikia.nocookie.net/logopedia/images/e/e4/HDFC_Bank_Logo.png',
        },
        status: 'ACTIVE',
        overview: {
            description: 'Leading private sector bank for two-wheeler loans.',
            website: 'https://hdfcbank.com',
            supportEmail: 'loans@hdfcbank.com',
            supportPhone: '1800-202-6161',
            whatsapp: '912267606161',
            customerCare: '1800-202-6161',
            helpline: '1800-202-6162',
            appLinks: {
                android: 'https://play.google.com/store/apps/details?id=com.snapwork.hdfc',
                ios: 'https://apps.apple.com/in/app/hdfc-bank-mobilebanking/id461304235',
            },
        },
        admin: {
            name: 'Kshitij Anand',
            phone: '9888877777',
            email: 'kshitij.anand@hdfcbank.com',
        },
        locations: [
            {
                id: 'l1',
                branchName: 'M G Road',
                type: 'BRANCH',
                taluka: 'Pune',
                state: 'Maharashtra',
                pincode: '411001',
                address: '123 MG Road',
                contactNumber: '020-12345678',
                isPrimary: true,
            },
        ],
        team: [
            {
                id: 't1',
                name: 'Amit Sharma',
                designation: 'AREA_SALES_MANAGER',
                email: 'amit@hdfc.com',
                phone: '9876543210',
                status: 'ACTIVE',
                dob: '1990-05-15',
                doj: '2020-01-10',
                serviceability: { states: ['Maharashtra'], areas: ['Pune'], dealerIds: [] },
            },
            {
                id: 't2',
                name: 'Rahul Verma',
                designation: 'EXECUTIVE',
                email: 'rahul@hdfc.com',
                phone: '9876543211',
                reportingToId: 't1',
                status: 'ACTIVE',
                serviceability: { states: ['Maharashtra'], areas: ['Pune'], dealerIds: [] },
            },
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
                    {
                        id: 'ch1',
                        name: 'Processing Fee',
                        type: 'PERCENTAGE',
                        value: 2,
                        calculationBasis: 'GROSS_LOAN_AMOUNT',
                        impact: 'UPFRONT',
                        taxStatus: 'NOT_APPLICABLE',
                    },
                    {
                        id: 'ch2',
                        name: 'Documentation',
                        type: 'FIXED',
                        value: 2065,
                        calculationBasis: 'FIXED',
                        impact: 'UPFRONT',
                        taxStatus: 'NOT_APPLICABLE',
                    }, // 'FIXED' basis is redundant but keeps type safe
                    {
                        id: 'ch3',
                        name: 'Stamp Duty',
                        type: 'FIXED',
                        value: 590,
                        calculationBasis: 'FIXED',
                        impact: 'UPFRONT',
                        taxStatus: 'NOT_APPLICABLE',
                    },
                    {
                        id: 'ch4',
                        name: 'Hypothecation',
                        type: 'FIXED',
                        value: 500,
                        calculationBasis: 'FIXED',
                        impact: 'UPFRONT',
                        taxStatus: 'NOT_APPLICABLE',
                    },
                    {
                        id: 'ch5',
                        name: 'Credit Life Insurance',
                        type: 'FIXED',
                        value: 3000,
                        calculationBasis: 'FIXED',
                        impact: 'FUNDED',
                        taxStatus: 'NOT_APPLICABLE',
                    }, // Funded = Added to Loan
                ],
                applicability: {
                    brands: 'ALL',
                    models: 'ALL',
                    dealerships: 'ALL',
                },
            },
        ],
        chargesMaster: [],
        management: { states: [], areas: [], dealerIds: [] },
    },
];
