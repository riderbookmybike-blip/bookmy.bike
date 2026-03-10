import React, { useState, useMemo, useEffect } from 'react';
import { BankPartner, BankScheme } from '@/types/bankPartner';
import { calculateAPRForAllSchemes, APRCalculation } from './tabs/utils/aprCalculator';
import { BarChart3, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Info, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type SortField = keyof APRCalculation | 'partnerName';
type SortDirection = 'asc' | 'desc' | null;

interface ConsolidatedAPR extends APRCalculation {
    partnerName: string;
    partnerId: string;
}

export default function AllSchemesAPRView({ banks }: { banks: any[] }) {
    const assetValue = 100000;
    const downpayment = 0;
    const tenureMonths = 36;
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [partnerFilter, setPartnerFilter] = useState('');
    const [roiFilter, setRoiFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
    const [aprFilter, setAprFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
    const [schemesByBank, setSchemesByBank] = useState<Map<string, BankScheme[]>>(new Map());

    // Fetch schemes from normalized table
    useEffect(() => {
        async function loadSchemes() {
            const supabase = createClient();
            const bankIds = banks.map(b => b.id);
            if (bankIds.length === 0) return;

            const { data } = await supabase
                .from('fin_marketplace_schemes')
                .select('*')
                .in('lender_tenant_id', bankIds)
                .eq('is_marketplace_active', true)
                .eq('status', 'ACTIVE');

            const map = new Map<string, BankScheme[]>();
            for (const s of data || []) {
                const mapped: BankScheme = {
                    id: s.scheme_code,
                    name: s.scheme_code,
                    interestRate: Number(s.roi),
                    interestType: (s as any).interest_type || 'REDUCING',
                    maxLTV: Number(s.ltv),
                    payout: Number(s.processing_fee),
                    payoutType: s.processing_fee_type as any,
                    minLoanAmount: Number(s.min_loan_amount),
                    maxLoanAmount: Number(s.max_loan_amount),
                    minTenure: s.min_tenure,
                    maxTenure: s.max_tenure,
                    allowedTenures: s.allowed_tenures || [],
                    isActive: true,
                    isPrimary: false,
                    validFrom: s.valid_from,
                    validTo: s.valid_until,
                    charges: (s as any).charges_jsonb || [],
                    applicability: { brands: 'ALL', models: 'ALL', dealerships: 'ALL' },
                } as any;
                const tid = s.lender_tenant_id;
                if (tid) {
                    if (!map.has(tid)) map.set(tid, []);
                    map.get(tid)!.push(mapped);
                }
            }
            setSchemesByBank(map);
        }
        loadSchemes();
    }, [banks]);

    // Calculate APR for all schemes from all partners
    const allSchemesData = useMemo(() => {
        const consolidated: ConsolidatedAPR[] = [];

        banks.forEach(bank => {
            const schemes = schemesByBank.get(bank.id) || [];
            if (schemes.length === 0) return;

            // Map to BankPartner format
            const partner: BankPartner = {
                id: bank.id,
                displayId: bank.display_id || bank.id.slice(0, 8).toUpperCase(),
                name: bank.name,
                status: bank.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                identity: bank.config?.identity,
                admin: bank.config?.admin,
                overview: bank.config?.overview || {},
                locations: bank.config?.locations || [],
                team: bank.config?.team || [],
                schemes: schemes,
                chargesMaster: bank.config?.chargesMaster || [],
                management: bank.config?.management || { states: [], areas: [], dealerIds: [] },
            };

            const aprResults = calculateAPRForAllSchemes(partner.schemes, assetValue, tenureMonths);

            aprResults.forEach(apr => {
                consolidated.push({
                    ...apr,
                    partnerName: partner.name,
                    partnerId: partner.id,
                });
            });
        });

        return consolidated;
    }, [banks, schemesByBank, assetValue, tenureMonths]);

    // Apply filters and sorting
    const filteredAndSortedData = useMemo(() => {
        let data = [...allSchemesData];

        // Text search filter (scheme name OR partner name)
        if (searchQuery) {
            data = data.filter(
                item =>
                    item.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Partner filter
        if (partnerFilter) {
            data = data.filter(item => item.partnerName.toLowerCase().includes(partnerFilter.toLowerCase()));
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
                const aVal = a[sortField as keyof ConsolidatedAPR];
                const bVal = b[sortField as keyof ConsolidatedAPR];

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
    }, [allSchemesData, searchQuery, partnerFilter, roiFilter, aprFilter, sortField, sortDirection]);

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
        setPartnerFilter('');
        setRoiFilter({ min: '', max: '' });
        setAprFilter({ min: '', max: '' });
        setSortField(null);
        setSortDirection(null);
    };

    const hasActiveFilters =
        searchQuery || partnerFilter || roiFilter.min || roiFilter.max || aprFilter.min || aprFilter.max;

    // Get unique partner names for quick filter
    const uniquePartners = useMemo(() => {
        return Array.from(new Set(allSchemesData.map(s => s.partnerName))).sort();
    }, [allSchemesData]);

    const picks = useMemo(() => {
        if (!filteredAndSortedData.length) {
            return { customer: '', dealership: '', balanced: '' };
        }

        const keyOf = (item: ConsolidatedAPR) => `${item.partnerId}-${item.schemeId}`;
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
                            APR Comparison - All Schemes
                        </h2>
                        <p className="text-slate-500 text-sm mt-2 font-medium">
                            Compare true cost of financing across all partners and schemes
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
                    <div className="col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            Search Scheme/Partner
                        </label>
                        <input
                            type="text"
                            placeholder="Type to search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    {/* Partner Filter */}
                    <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            Partner
                        </label>
                        <select
                            value={partnerFilter}
                            onChange={e => setPartnerFilter(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all"
                        >
                            <option value="">All Partners</option>
                            {uniquePartners.map(p => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
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
                    <div className="col-span-1">
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <X size={14} />
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
                                    label="Schemes"
                                    field="schemeName"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label={'Upfront\nCharges'}
                                    field="upfrontCharges"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label={'Funded\nCharges'}
                                    field="fundedCharges"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label={'Gross Loan\nAmount'}
                                    field="grossLoanAmount"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Dealer Earning"
                                    field="netMargin"
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
                                    label="TCC %"
                                    field="totalCostPercentage"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                    tooltip="TCC (Total Cost of Credit): Total extra amount paid over vehicle cost across full tenure."
                                />
                                <SortableHeader
                                    label="IRR"
                                    field="irr"
                                    currentField={sortField}
                                    direction={sortDirection}
                                    onSort={handleSort}
                                    tooltip="IRR (Internal Rate of Return): Effective annualized return/rate implied by this EMI cashflow."
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
                                    <td colSpan={9} className="text-center py-12">
                                        <div className="text-slate-400">
                                            <Filter size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-bold text-sm">No schemes match your filters</p>
                                            <p className="text-xs mt-1">Try adjusting your search criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedData.map((item, idx) => (
                                    <tr
                                        key={`${item.partnerId}-${item.schemeId}-${idx}`}
                                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-start gap-3">
                                                <Building2 size={14} className="text-blue-500 mt-0.5" />
                                                <div className="min-w-0">
                                                    <div className="font-black text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                        {item.partnerName}
                                                    </div>
                                                    <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight mt-0.5">
                                                        {item.schemeName}
                                                    </div>
                                                    <div className="text-[11px] font-black text-blue-600 dark:text-blue-400 mt-0.5">
                                                        ROI {formatPercent(item.roi)}
                                                    </div>
                                                    <span
                                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md mt-1 inline-block ${
                                                            item.interestType === 'REDUCING'
                                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                                                : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                                                        }`}
                                                    >
                                                        {item.interestType}
                                                    </span>
                                                    {(() => {
                                                        const rowKey = `${item.partnerId}-${item.schemeId}`;
                                                        if (rowKey === picks.customer) {
                                                            return (
                                                                <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 mt-1">
                                                                    Best for Customer
                                                                </div>
                                                            );
                                                        }
                                                        if (rowKey === picks.dealership) {
                                                            return (
                                                                <div className="text-[9px] font-black text-fuchsia-700 dark:text-fuchsia-400 mt-1">
                                                                    Best for Dealership
                                                                </div>
                                                            );
                                                        }
                                                        if (rowKey === picks.balanced) {
                                                            return (
                                                                <div className="text-[9px] font-black text-sky-700 dark:text-sky-400 mt-1">
                                                                    Balanced Choice
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </div>
                                            {!item.isActive && (
                                                <span className="text-[9px] font-black text-red-500 uppercase mt-2 inline-block">
                                                    Inactive
                                                </span>
                                            )}
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
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                                                    {formatCurrency(item.netMargin || item.dealerPayout.amount || 0)}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                                                    {item.dealerPayout.type === 'PERCENTAGE'
                                                        ? `${formatPercent(item.dealerPayout.value)} Yield`
                                                        : 'Flat Yield'}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                                                    {formatPayoutBasis(item.dealerPayout.basis)}
                                                </span>
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
                                            <div className="text-base font-black text-rose-600 dark:text-rose-400">
                                                {formatPercent(item.totalCostPercentage)}
                                            </div>
                                            <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                                                {formatCurrency(item.totalCost)} extra
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className={`text-base font-black ${getAPRColor(item.irr)}`}>
                                                {formatPercent(item.irr)}
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
                Showing <strong className="text-slate-900 dark:text-white">{filteredAndSortedData.length}</strong>{' '}
                schemes from <strong className="text-slate-900 dark:text-white">{uniquePartners.length}</strong>{' '}
                partners
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
                <span className="whitespace-pre-line leading-tight text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
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
