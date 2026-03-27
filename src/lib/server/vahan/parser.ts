import * as XLSX from 'xlsx';
import {
    ParsedVahanMonthlySheet,
    ParsedVahanSheet,
    VahanAxis,
    VahanTwoWheelerMonthlyRow,
    VahanTwoWheelerRow,
} from '@/lib/server/vahan/types';

const TARGET_CLASS_HEADERS = {
    mCycleScooter: 'mcyclescooter',
    moped: 'moped',
    motorisedCycleGt25cc: 'motorisedcyclecc25cc',
} as const;

function normalize(value: unknown): string {
    return String(value ?? '')
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
}

function toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Number(
        String(value ?? '')
            .replace(/,/g, '')
            .trim()
    );
    return Number.isFinite(parsed) ? parsed : 0;
}

function extractAxis(titleCell: string): VahanAxis {
    return /maker\s+wise/i.test(titleCell) ? 'MAKER' : 'RTO';
}

function extractState(titleCell: string): string {
    const match = titleCell.match(/of\s+(.+?)\s*\(\d{4}\)/i);
    return match?.[1]?.trim() || 'Maharashtra';
}

function extractYear(titleCell: string): number {
    const match = titleCell.match(/\((\d{4})\)/);
    return match ? Number(match[1]) : new Date().getFullYear();
}

function extractRto(titleCell: string): { rtoCode: string; rtoName: string } {
    // Example: Maker Month Wise Data of VASAI - MH48 , Maharashtra (2026)
    // Extract: VASAI - MH48
    const match = titleCell.match(/of\s+([A-Z0-9\s-]+)\s*,/i);
    if (match) {
        const fullRtoStr = match[1].trim();
        if (fullRtoStr.includes('-')) {
            const parts = fullRtoStr.split('-');
            const rtoName = parts[0].trim();
            const rtoCode = parts[1].trim();
            return { rtoCode, rtoName };
        }
    }
    return { rtoCode: 'XX', rtoName: 'Unknown' };
}

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function findMonthHeaderIndexes(headerRow: unknown[]): Array<{ monthNo: number; monthLabel: string; index: number }> {
    const normalized = headerRow.map(normalize);
    const matches: Array<{ monthNo: number; monthLabel: string; index: number }> = [];

    MONTH_LABELS.forEach((label, idx) => {
        const monthNo = idx + 1;
        const target = label.toLowerCase();
        const index = normalized.findIndex(v => v === target || v.startsWith(target));
        if (index >= 0) matches.push({ monthNo, monthLabel: label, index });
    });

    return matches;
}

function getHeaderIndexes(headerRow: unknown[]): {
    mCycleScooter: number;
    moped: number;
    motorisedCycleGt25cc: number;
} {
    const normalized = headerRow.map(normalize);

    const mCycleScooter = normalized.findIndex(h => h === TARGET_CLASS_HEADERS.mCycleScooter);
    const moped = normalized.findIndex(h => h === TARGET_CLASS_HEADERS.moped);
    const motorisedCycleGt25cc = normalized.findIndex(h => h === TARGET_CLASS_HEADERS.motorisedCycleGt25cc);

    if (mCycleScooter < 0 || moped < 0 || motorisedCycleGt25cc < 0) {
        throw new Error('Could not locate required 2W class columns in Vahan sheet');
    }

    return { mCycleScooter, moped, motorisedCycleGt25cc };
}

function parseRows(args: {
    rows: unknown[][];
    axis: VahanAxis;
    state: string;
    year: number;
    source: string;
}): VahanTwoWheelerRow[] {
    const { rows, axis, state, year, source } = args;
    if (rows.length < 4) return [];

    const dataHeaderRow = rows[2];
    const labelColumnIndex = 1;
    const indexes = getHeaderIndexes(dataHeaderRow);

    const out: VahanTwoWheelerRow[] = [];

    for (let i = 3; i < rows.length; i += 1) {
        const row = rows[i] || [];
        const serial = String(row[0] ?? '').trim();
        const rowLabel = String(row[labelColumnIndex] ?? '').trim();

        if (!serial || !rowLabel) continue;
        if (!/^\d+$/.test(serial)) continue;

        const mCycleScooter = toNumber(row[indexes.mCycleScooter]);
        const moped = toNumber(row[indexes.moped]);
        const motorisedCycleGt25cc = toNumber(row[indexes.motorisedCycleGt25cc]);

        out.push({
            axis,
            state,
            stateCode: state.toUpperCase() === 'MAHARASHTRA' ? 'MH' : state.slice(0, 2).toUpperCase(),
            year,
            rowLabel,
            mCycleScooter,
            moped,
            motorisedCycleGt25cc,
            twoWheelerTotal: mCycleScooter + moped + motorisedCycleGt25cc,
            source,
            fetchedAt: new Date().toISOString(),
        });
    }

    return out;
}

function parseMonthlyRows(args: {
    rows: unknown[][];
    state: string;
    rtoCode: string;
    rtoName: string;
    year: number;
    source: string;
}): VahanTwoWheelerMonthlyRow[] {
    const { rows, state, rtoCode, rtoName, year, source } = args;
    if (rows.length < 4) throw new Error('Monthly workbook has insufficient rows');

    const headerRow = rows[2] || [];
    const monthIndexes = findMonthHeaderIndexes(headerRow);
    if (monthIndexes.length < 3) {
        throw new Error('Could not find month columns (JAN..DEC) in monthly workbook');
    }

    const out: VahanTwoWheelerMonthlyRow[] = [];
    for (let i = 3; i < rows.length; i += 1) {
        const row = rows[i] || [];
        const serial = String(row[0] ?? '').trim();
        const maker = String(row[1] ?? '').trim();

        if (!serial || !maker || !/^\d+$/.test(serial)) continue;

        monthIndexes.forEach(month => {
            const units = toNumber(row[month.index]);
            out.push({
                stateCode: state.toUpperCase() === 'MAHARASHTRA' ? 'MH' : state.slice(0, 2).toUpperCase(),
                state,
                rtoCode,
                rtoName,
                year,
                monthNo: month.monthNo,
                monthLabel: month.monthLabel,
                maker,
                units,
                source,
                fetchedAt: new Date().toISOString(),
            });
        });
    }

    return out;
}

function parseVahanWorkbook(workbook: XLSX.WorkBook, source: string): ParsedVahanSheet {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false }) as unknown[][];

    const titleCell = String(rows?.[0]?.[0] ?? '').trim();
    const axis = extractAxis(titleCell);
    const state = extractState(titleCell);
    const year = extractYear(titleCell);

    return {
        axis,
        state,
        year,
        rows: parseRows({ rows, axis, state, year, source }),
    };
}

export function parseVahanWorkbookFile(filePath: string): ParsedVahanSheet {
    const workbook = XLSX.readFile(filePath);
    return parseVahanWorkbook(workbook, filePath);
}

export function parseVahanWorkbookBuffer(buffer: Buffer, source: string): ParsedVahanSheet {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return parseVahanWorkbook(workbook, source);
}

export function parseVahanMonthlyWorkbookFile(filePath: string): ParsedVahanMonthlySheet {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false }) as unknown[][];
    const titleCell = String(rows?.[0]?.[0] ?? '').trim();
    const state = extractState(titleCell);
    const year = extractYear(titleCell);
    const { rtoCode, rtoName } = extractRto(titleCell);
    return {
        state,
        year,
        rows: parseMonthlyRows({ rows, state, rtoCode, rtoName, year, source: filePath }),
    };
}

export function parseVahanMonthlyWorkbookBuffer(buffer: Buffer, source: string): ParsedVahanMonthlySheet {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false }) as unknown[][];
    const titleCell = String(rows?.[0]?.[0] ?? '').trim();
    const state = extractState(titleCell);
    const year = extractYear(titleCell);
    const { rtoCode, rtoName } = extractRto(titleCell);
    return {
        state,
        year,
        rows: parseMonthlyRows({ rows, state, rtoCode, rtoName, year, source }),
    };
}
