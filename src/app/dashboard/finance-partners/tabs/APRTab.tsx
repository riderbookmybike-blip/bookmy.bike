import React, { useState, useMemo } from 'react';
import { BankPartner } from '@/types/bankPartner';
import { calculateAPRForAllSchemes, APRCalculation } from './utils/aprCalculator';
import { BarChart3, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Info } from 'lucide-react';

type SortField = keyof APRCalculation;
type SortDirection = 'asc' | 'desc' | null;

export default function APRTab({ partner }: { partner: BankPartner }) {
    const assetValue = 100000;
    const downpayment = 0;
    const tenureMonths = 36;
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roiFilter, setRoiFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
    const [aprFilter, setAprFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });

    // Calculate APR for all schemes
    const aprData = useMemo(() => {
        return calculateAPRForAllSchemes(partner.schemes, assetValue, tenureMonths);
    }, [partner.schemes, assetValue, tenureMonths]);

    // Apply filters and sorting
    const filteredAndSortedData = useMemo(() => {
        let data = [...aprData];

        // Text search filter
        if (searchQuery) {
            data = data.filter(item => item.schemeName.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // ROI range filter
        if (roiFilter.min !== '' || roiFilter.max !== '') {
            const min = roiFilter.min === '' ? -Infinity : parseFloat(roiFilter.min);
            const max = roiFilter.max === '' ? Infinity : parseFloat(roiFilter.max);
            data = data.filter(item => item.roi >= min && item.roi <= max);
        }

        // APR range filter
        if (aprFilter.min !== '' || aprFilter.max !== '') {
            const min = aprFilter.min === '' ? -Infinity : parseFloat(aprFilter.min);
            const max = aprFilter.max === '' ? Infinity : parseFloat(aprFilter.max);
            data = data.filter(item => item.apr >= min && item.apr <= max);
        }

        // Sorting
        if (sortField && sortDirection) {
            data.sort((a, b) => {
                const aVal = a[sortField];
                const bVal = b[sortField];

                // Handle nested dealerPayout object
                if (sortField === 'dealerPayout') {
                    const aPayoutVal = (a.dealerPayout as any).value;
                    const bPayoutVal = (b.dealerPayout as any).value;
                    return sortDirection === 'asc' ? aPayoutVal - bPayoutVal : bPayoutVal - aPayoutVal;
                }

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                }

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }

                return 0;
            });
        }

        return data;
    }, [aprData, searchQuery, roiFilter, aprFilter, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Cycle through: asc -> desc -> null
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortDirection(null);
                setSortField(null);
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setRoiFilter({ min: '', max: '' });
        setAprFilter({ min: '', max: '' });
        setSortField(null);
        setSortDirection(null);
    };

    const hasActiveFilters = searchQuery || roiFilter.min || roiFilter.max || aprFilter.min || aprFilter.max;
    const picks = useMemo(() => {
        if (!filteredAndSortedData.length) {
            return { customer: '', dealership: '', balanced: '' };
        }

        const keyOf = (item: APRCalculation) => item.schemeId;
        const byCustomer = [...filteredAndSortedData].sort((a, b) => a.apr - b.apr)[0];
        const byDealership = [...filteredAndSortedData].sort((a, b) => (b.netMargin || 0) - (a.netMargin || 0))[0];

        const aprValues = filteredAndSortedData.map(x => x.apr).sort((a, b) => a - b);
        const marginValues = filteredAndSortedData.map(x => x.netMargin || 0).sort((a, b) => a - b);
        const aprMedian = aprValues[Math.floor(aprValues.length / 2)];
        const marginMedian = marginValues[Math.floor(marginValues.length / 2)];

        const excluded = new Set([keyOf(byCustomer), keyOf(byDealership)]);
        const candidates = filteredAndSortedData.filter(x => !excluded.has(keyOf(x)));
        const balancedSource = (candidates.length ? candidates : filteredAndSortedData).reduce((best, cur) => {
            const curScore = Math.abs(cur.apr - aprMedian) + Math.abs((cur.netMargin || 0) - marginMedian);
            const bestScore = Math.abs(best.apr - aprMedian) + Math.abs((best.netMargin || 0) - marginMedian);
            return curScore < bestScore ? cur : best;
        });

        return {
            customer: keyOf(byCustomer),
            dealership: keyOf(byDealership),
            balanced: keyOf(balancedSource),
        };
    }, [filteredAndSortedData]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-slate-900 dark:text-white font-black text-xl uppercase tracking-tighter flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/10 dark:border-blue-500/20">
                                <BarChart3 size={20} />
                            </div>
                            APR Comparison
                        </h2>
                        <p className="text-slate-500 text-sm mt-2 font-medium">
                            True cost of financing with standardized calculations
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 min-w-[420px]">
                        <SummaryStat label="Vehicle Cost" value={formatCurrency(assetValue)} />
                        <SummaryStat label="Downpayment" value={formatCurrency(downpayment)} />
                        <SummaryStat label="Tenure" value={`${tenureMonths} Months`} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-6">
                <div className="grid grid-cols-12 gap-4 items-end">
                    {/* Search */}
                    <div className="col-span-4">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            Search Scheme
                        </label>
                        <input
                            type="text"
                            placeholder="Type scheme name..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    {/* ROI Filter */}
                    <div className="col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            ROI Range (%)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={roiFilter.min}
                                onChange={e => setRoiFilter({ ...roiFilter, min: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={roiFilter.max}
                                onChange={e => setRoiFilter({ ...roiFilter, max: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* APR Filter */}
                    <div className="col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            APR Range (%)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={aprFilter.min}
                                onChange={e => setAprFilter({ ...aprFilter, min: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={aprFilter.max}
                                onChange={e => setAprFilter({ ...aprFilter, max: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Clear Button */}
                    <div className="col-span-2">
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <X size={14} /> Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-separate border-spacing-0 [&_th]:border-r [&_th]:border-slate-200/80 dark:[&_th]:border-white/10 [&_th:last-child]:border-r-0 [&_td]:border-r [&_td]:border-slate-200/70 dark:[&_td]:border-white/10 [&_td:last-child]:border-r-0 [&_td]:border-b [&_td]:border-slate-200/70 dark:[&_td]:border-white/10">
                        <thead className="bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <SortableHeader
                                    label="Scheme Name"
                                    field="schemeName"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="ROI"
                                    field="roi"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Upfront Charges"
                                    field="upfrontCharges"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Funded Charges"
                                    field="fundedCharges"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Gross Loan Amount"
                                    field="grossLoanAmount"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Payout"
                                    field="dealerPayout"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="EMI (36M)"
                                    field="emi"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="APR"
                                    field="apr"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                    tooltip="APR (Annual Percentage Rate): True annual borrowing cost including interest and charges."
                                />
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12">
                                        <div className="text-slate-400">
                                            <Filter size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-bold text-sm">No schemes match your filters</p>
                                            <p className="text-xs mt-1">Try adjusting your search criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedData.map(item => (
                                    <tr
                                        key={item.schemeId}
                                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-3 py-2.5">
                                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                                                {item.schemeName}
                                            </div>
                                            {item.schemeId === picks.customer && (
                                                <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 mt-1">
                                                    Best for Customer
                                                </div>
                                            )}
                                            {item.schemeId === picks.dealership && (
                                                <div className="text-[9px] font-black text-fuchsia-700 dark:text-fuchsia-400 mt-1">
                                                    Best for Dealership
                                                </div>
                                            )}
                                            {item.schemeId === picks.balanced && (
                                                <div className="text-[9px] font-black text-sky-700 dark:text-sky-400 mt-1">
                                                    Balanced Choice
                                                </div>
                                            )}
                                            {!item.isActive && (
                                                <span className="text-[9px] font-black text-red-500 uppercase">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                                            {formatPercent(item.roi)}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs font-black text-amber-600 dark:text-amber-400">
                                            {formatCurrency(item.upfrontCharges)}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(item.fundedCharges)}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs font-black text-slate-900 dark:text-white">
                                            {formatCurrency(assetValue + item.upfrontCharges + item.fundedCharges)}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="text-xs font-black text-purple-600 dark:text-purple-400">
                                                {item.dealerPayout.type === 'PERCENTAGE'
                                                    ? `${formatPercent(item.dealerPayout.value)}`
                                                    : formatCurrency(item.dealerPayout.value)}
                                            </div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                                                {formatPayoutBasis(item.dealerPayout.basis)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="text-base font-black text-slate-900 dark:text-white">
                                                {formatCurrency(item.emi)}
                                            </div>
                                            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                                per month
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className={`text-base font-black ${getAPRColor(item.apr)}`}>
                                                {formatPercent(item.apr)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border-t border-blue-200 dark:border-blue-500/20 px-8 py-4">
                    <div className="flex items-start gap-3">
                        <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <p className="font-bold">
                                <strong>APR (Annual Percentage Rate)</strong> = True cost of borrowing including
                                interest + all fees
                            </p>
                            <p className="font-medium opacity-80">
                                Lower APR means better value for customers. All calculations assume{' '}
                                {formatCurrency(assetValue)} vehicle cost, {formatCurrency(downpayment)} downpayment and{' '}
                                {tenureMonths}-month tenure.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="text-center text-sm text-slate-500 font-medium">
                Showing <strong className="text-slate-900 dark:text-white">{filteredAndSortedData.length}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{aprData.length}</strong> schemes
            </div>
        </div>
    );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
            <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">{value}</div>
        </div>
    );
}

// Sortable Header Component
function SortableHeader({
    label,
    field,
    currentField,
    direction,
    onSort,
    tooltip,
}: {
    label: string;
    field: SortField;
    currentField: SortField | null;
    direction: SortDirection;
    onSort: (field: SortField) => void;
    tooltip?: string;
}) {
    const isActive = currentField === field;

    return (
        <th
            className="px-3 py-2 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            onClick={() => onSort(field)}
        >
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {label}
                </span>
                {tooltip && (
                    <span
                        title={tooltip}
                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <Info size={12} />
                    </span>
                )}
                <div className="text-slate-400">
                    {!isActive && <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />}
                    {isActive && direction === 'asc' && <ArrowUp size={14} className="text-blue-600" />}
                    {isActive && direction === 'desc' && <ArrowDown size={14} className="text-blue-600" />}
                </div>
            </div>
        </th>
    );
}

// APR Color Helper
function getAPRColor(apr: number): string {
    if (apr < 15) return 'text-green-600 dark:text-green-400';
    if (apr < 20) return 'text-yellow-600 dark:text-yellow-400';
    if (apr < 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
}

function formatPayoutBasis(basis?: string): string {
    switch (basis) {
        case 'LOAN_AMOUNT':
            return 'On Loan Amount';
        case 'GROSS_LOAN_AMOUNT':
            return 'On Gross Loan';
        case 'DISBURSAL_AMOUNT':
            return 'On Disbursal';
        case 'VEHICLE_PRICE':
            return 'On Vehicle Price';
        default:
            return 'On Loan Amount';
    }
}

function formatCurrency(value: number): string {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number): string {
    return `${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}
