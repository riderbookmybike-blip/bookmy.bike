export type VahanAxis = 'RTO' | 'MAKER';

export interface VahanTwoWheelerRow {
    axis: VahanAxis;
    state: string;
    stateCode: string;
    year: number;
    rowLabel: string;
    mCycleScooter: number;
    moped: number;
    motorisedCycleGt25cc: number;
    twoWheelerTotal: number;
    source: string;
    fetchedAt: string;
}

export interface VahanTwoWheelerMonthlyRow {
    stateCode: string;
    state: string;
    rtoCode: string;
    rtoName: string;
    year: number;
    monthNo: number;
    monthLabel: string;
    maker: string;
    units: number;
    source: string;
    fetchedAt: string;
}

export interface ParsedVahanSheet {
    axis: VahanAxis;
    state: string;
    year: number;
    rows: VahanTwoWheelerRow[];
}

export interface ParsedVahanMonthlySheet {
    state: string;
    year: number;
    rows: VahanTwoWheelerMonthlyRow[];
}

export interface VahanApiResponse {
    rows: VahanTwoWheelerRow[];
    monthlyRows: VahanTwoWheelerMonthlyRow[];
    yearWiseTotals: Array<{ year: number; total: number }>;
    yearlyMonitor: Array<{ year: number; totalUnits: number; oemCount: number; rtoCount: number }>;
    monthWiseTotals: Array<{ year: number; monthNo: number; monthLabel: string; total: number }>;
    latestYear: number | null;
    latestRtoTotals: Array<{ rto: string; total: number }>;
    latestMakerTotals: Array<{ maker: string; total: number }>;
    generatedAt: string;
    source: 'db' | 'seed';
}
