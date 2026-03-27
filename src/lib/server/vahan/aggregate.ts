import seedData from '@/data/vahan/mh_two_wheeler_seed.json';
import { VahanApiResponse, VahanTwoWheelerMonthlyRow, VahanTwoWheelerRow } from '@/lib/server/vahan/types';

function isActiveTwoWheelerRow(row: VahanTwoWheelerRow): boolean {
    return row.twoWheelerTotal > 0 || row.mCycleScooter > 0 || row.moped > 0 || row.motorisedCycleGt25cc > 0;
}

export function buildVahanApiResponse(
    rows: VahanTwoWheelerRow[],
    source: 'db' | 'seed',
    monthlyRows: VahanTwoWheelerMonthlyRow[] = []
): VahanApiResponse {
    const sortedRows = [...rows].sort(
        (a, b) => a.year - b.year || a.axis.localeCompare(b.axis) || a.rowLabel.localeCompare(b.rowLabel)
    );
    const sortedMonthlyRows = [...monthlyRows].sort(
        (a, b) => a.year - b.year || a.monthNo - b.monthNo || a.maker.localeCompare(b.maker)
    );

    const years = Array.from(new Set(sortedRows.map(r => r.year))).sort((a, b) => a - b);
    const latestYear = years.length > 0 ? years[years.length - 1] : null;

    const yearWiseTotals = years.map(year => {
        const total = sortedRows
            .filter(r => r.year === year && r.axis === 'RTO')
            .reduce((sum, row) => sum + row.twoWheelerTotal, 0);
        return { year, total };
    });

    const latestRtoTotals = latestYear
        ? sortedRows
              .filter(r => r.year === latestYear && r.axis === 'RTO')
              .map(r => ({ rto: r.rowLabel, total: r.twoWheelerTotal }))
              .sort((a, b) => b.total - a.total)
        : [];

    const latestMakerTotals = latestYear
        ? sortedRows
              .filter(r => r.year === latestYear && r.axis === 'MAKER' && isActiveTwoWheelerRow(r))
              .map(r => ({ maker: r.rowLabel, total: r.twoWheelerTotal }))
              .sort((a, b) => b.total - a.total)
        : [];

    const yearlyMonitor = years.map(year => {
        const yearRows = sortedRows.filter(r => r.year === year);
        const totalUnits = yearRows.filter(r => r.axis === 'RTO').reduce((sum, row) => sum + row.twoWheelerTotal, 0);
        const oemCount = yearRows.filter(r => r.axis === 'MAKER' && isActiveTwoWheelerRow(r)).length;
        const rtoCount = yearRows.filter(r => r.axis === 'RTO').length;
        return { year, totalUnits, oemCount, rtoCount };
    });

    const monthWiseTotals = sortedMonthlyRows.reduce((acc, row) => {
        const key = `${row.year}-${row.monthNo}`;
        const prev = acc.get(key) || { year: row.year, monthNo: row.monthNo, monthLabel: row.monthLabel, total: 0 };
        prev.total += row.units;
        acc.set(key, prev);
        return acc;
    }, new Map<string, { year: number; monthNo: number; monthLabel: string; total: number }>());

    return {
        rows: sortedRows,
        monthlyRows: sortedMonthlyRows,
        yearWiseTotals,
        yearlyMonitor,
        monthWiseTotals: Array.from(monthWiseTotals.values()).sort((a, b) => a.year - b.year || a.monthNo - b.monthNo),
        latestYear,
        latestRtoTotals,
        latestMakerTotals,
        generatedAt: new Date().toISOString(),
        source,
    };
}

export function getSeedRows(): VahanTwoWheelerRow[] {
    return (seedData.rows || []) as VahanTwoWheelerRow[];
}
