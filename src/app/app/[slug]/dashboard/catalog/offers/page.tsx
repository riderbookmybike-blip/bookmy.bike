'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import {
    getAllDealerOffersForAdmin,
    getAllDealerOffersForExport,
    getDealerOfferOverrideHistory,
    type AdminDealerOfferRow,
    type DealerOfferFilterOption,
    type DealerOfferOverrideHistoryRow,
    type DealerOfferStatus,
} from '@/app/aums/actions/getAllDealerOffers';
import { deactivateDealerOffer } from '@/app/aums/actions/updateDealerOffer';
import OfferTable from './components/OfferTable';
import EditOfferPanel from './components/EditOfferPanel';

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

// ─── CSV helpers ─────────────────────────────────────────────────────────────

const CSV_HEADERS = [
    'dealership_name',
    'dealership_slug',
    'brand',
    'model',
    'sku_id',
    'sku_name',
    'state_code',
    'offer_amount',
    'base_ex_showroom',
    'price_after_offer',
    'is_active',
    'inclusion_type',
    'tat_days',
    'updated_at',
];

function esc(v: unknown) {
    return `"${String(v ?? '').replaceAll('"', '""')}"`;
}

function rowsToCsv(rows: AdminDealerOfferRow[]): string {
    const body = rows.map(r =>
        [
            r.dealershipName,
            r.dealershipSlug,
            r.brandName,
            r.modelName,
            r.skuId,
            r.skuName,
            r.stateCode,
            r.offerAmount,
            r.baseExShowroom,
            r.priceAfterOffer,
            r.isActive,
            r.inclusionType,
            r.tatDays ?? '',
            r.updatedAt ?? '',
        ]
            .map(esc)
            .join(',')
    );
    return [CSV_HEADERS.join(','), ...body].join('\n');
}

function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AumsDealerOffersPage() {
    const { tenantSlug } = useTenant();

    // Table data
    const [rows, setRows] = useState<AdminDealerOfferRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRow, setSelectedRow] = useState<AdminDealerOfferRow | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);
    const [totalCount, setTotalCount] = useState(0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // Filters (cached option lists — fetched once, not re-fetched on page change)
    const [dealerships, setDealerships] = useState<DealerOfferFilterOption[]>([]);
    const [brands, setBrands] = useState<DealerOfferFilterOption[]>([]);
    const [models, setModels] = useState<DealerOfferFilterOption[]>([]);
    const [dealershipFilter, setDealershipFilter] = useState('ALL');
    const [brandFilter, setBrandFilter] = useState('ALL');
    const [modelFilter, setModelFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState<DealerOfferStatus>('ALL');
    const optionsLoaded = useRef(false);

    // History
    const [historyRows, setHistoryRows] = useState<DealerOfferOverrideHistoryRow[]>([]);
    const [historyOpen, setHistoryOpen] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Export
    const [exporting, setExporting] = useState(false);

    // Debounce ref — resets page to 1 when filters change
    const filterDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Data fetch ────────────────────────────────────────────────────────────

    const loadPage = useCallback(
        async (targetPage: number, fetchOptions: boolean) => {
            setLoading(true);
            setError('');

            const res = await getAllDealerOffersForAdmin({
                page: targetPage,
                pageSize,
                tenantId: dealershipFilter,
                brandName: brandFilter,
                modelName: modelFilter,
                status: statusFilter,
            });

            if (!res.success) {
                setRows([]);
                setTotalCount(0);
                setError(res.message || 'Failed to load dealer offers');
                setLoading(false);
                return;
            }

            setRows(res.rows);
            setTotalCount(res.totalCount);
            setPage(res.page);

            // Only update option lists on the first clean load
            if (fetchOptions && !optionsLoaded.current) {
                setDealerships(res.dealerships);
                setBrands(res.brands);
                setModels(res.models);
                if (res.dealerships.length > 0 || res.brands.length > 0) {
                    optionsLoaded.current = true;
                }
            }

            setLoading(false);
        },
        [pageSize, dealershipFilter, brandFilter, modelFilter, statusFilter]
    );

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        const res = await getDealerOfferOverrideHistory(20);
        setHistoryRows(res.success ? res.rows : []);
        setHistoryLoading(false);
    }, []);

    // Initial load
    useEffect(() => {
        loadPage(1, true);
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch when filters change (debounced, resets to page 1)
    const onFilterChange = useCallback(
        (setter: (v: any) => void) => (v: any) => {
            setter(v);
            if (filterDebounce.current) clearTimeout(filterDebounce.current);
            filterDebounce.current = setTimeout(() => {
                loadPage(1, false);
            }, 300);
        },
        [loadPage]
    );

    // Re-fetch when pageSize changes (reset to page 1)
    useEffect(() => {
        loadPage(1, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize]);

    // ── Actions ───────────────────────────────────────────────────────────────

    const handleRemove = async (row: AdminDealerOfferRow) => {
        const confirmed = window.confirm(
            `Disable offer for ${row.dealershipName} • ${row.skuName} (${row.stateCode})?`
        );
        if (!confirmed) return;
        const res = await deactivateDealerOffer({ tenantId: row.tenantId, skuId: row.skuId, stateCode: row.stateCode });
        if (!res.success) {
            setError(res.message || 'Failed to disable offer');
            return;
        }
        await loadPage(page, false);
        await loadHistory();
    };

    const exportCurrentPage = () => {
        if (rows.length === 0) return;
        downloadCsv(rowsToCsv(rows), `dealer-offers-page-${page}.csv`);
    };

    const exportAllFiltered = async () => {
        setExporting(true);
        const res = await getAllDealerOffersForExport({
            tenantId: dealershipFilter,
            brandName: brandFilter,
            modelName: modelFilter,
            status: statusFilter,
        });
        setExporting(false);
        if (!res.success || res.rows.length === 0) {
            setError(res.message || 'No rows to export');
            return;
        }
        downloadCsv(rowsToCsv(res.rows), `dealer-offers-all-filtered-${Date.now()}.csv`);
    };

    // ── Guard ─────────────────────────────────────────────────────────────────

    if (tenantSlug && tenantSlug !== 'aums') {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm font-semibold text-rose-700">
                Dealer Offer Override is available only in the AUMS workspace.
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-black text-slate-900">Super Admin Offer Override</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Edit dealer offers across all dealerships without impersonation.
                </p>
            </div>

            {/* Filters */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    {/* Dealership */}
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Dealership
                        </span>
                        <select
                            data-testid="filter-dealership"
                            value={dealershipFilter}
                            onChange={e => onFilterChange(setDealershipFilter)(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                        >
                            <option value="ALL">All</option>
                            {dealerships.map(o => (
                                <option key={o.id} value={o.id}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Brand */}
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Brand
                        </span>
                        <select
                            data-testid="filter-brand"
                            value={brandFilter}
                            onChange={e => onFilterChange(setBrandFilter)(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                        >
                            <option value="ALL">All</option>
                            {brands.map(o => (
                                <option key={o.id} value={o.id}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Model */}
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Model
                        </span>
                        <select
                            data-testid="filter-model"
                            value={modelFilter}
                            onChange={e => onFilterChange(setModelFilter)(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                        >
                            <option value="ALL">All</option>
                            {models.map(o => (
                                <option key={o.id} value={o.id}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Status */}
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Status
                        </span>
                        <select
                            data-testid="filter-status"
                            value={statusFilter}
                            onChange={e => onFilterChange(setStatusFilter)(e.target.value as DealerOfferStatus)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                        >
                            <option value="ALL">All</option>
                            <option value="DISCOUNT">Discount</option>
                            <option value="SURGE">Surge</option>
                            <option value="FLAT">Flat</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </label>
                </div>

                {/* Toolbar row */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <p className="flex-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        {totalCount} total rows
                    </p>
                    <button
                        onClick={() => loadPage(page, false)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={exportCurrentPage}
                        disabled={rows.length === 0}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                        Export Page
                    </button>
                    <button
                        onClick={exportAllFiltered}
                        disabled={exporting || totalCount === 0}
                        className="rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                    >
                        {exporting ? 'Exporting…' : 'Export All (filtered)'}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                    {error}
                </div>
            ) : null}

            {/* Table */}
            {loading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">
                    Loading dealer offers…
                </div>
            ) : (
                <OfferTable rows={rows} onEdit={setSelectedRow} onRemove={handleRemove} />
            )}

            {/* Pagination controls */}
            {!loading && totalCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => loadPage(page - 1, false)}
                            disabled={page <= 1}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-700 disabled:opacity-30 hover:bg-slate-100"
                        >
                            ← Prev
                        </button>
                        <span className="text-xs font-bold text-slate-600">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => loadPage(page + 1, false)}
                            disabled={page >= totalPages}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-700 disabled:opacity-30 hover:bg-slate-100"
                        >
                            Next →
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Show</span>
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-700"
                        >
                            {PAGE_SIZE_OPTIONS.map(n => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                            per page
                        </span>
                    </div>
                </div>
            )}

            {/* Edit panel */}
            <EditOfferPanel
                row={selectedRow}
                dealerships={dealerships}
                onClose={() => setSelectedRow(null)}
                onSaved={async () => {
                    setSelectedRow(null);
                    await loadPage(page, false);
                    await loadHistory();
                }}
            />

            {/* History panel */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
                        Recent Override History
                    </h2>
                    <button
                        onClick={() => setHistoryOpen(prev => !prev)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100"
                    >
                        {historyOpen ? 'Collapse' : 'Expand'}
                    </button>
                </div>

                {historyOpen ? (
                    <div className="mt-4 space-y-2">
                        {historyLoading ? (
                            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                Loading history…
                            </div>
                        ) : historyRows.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                No override history found.
                            </div>
                        ) : (
                            historyRows.map(item => (
                                <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-700">
                                            {item.actionLabel}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-600">{item.actorName}</span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs text-slate-500">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '—'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {item.dealerLabel} • {item.skuLabel}
                                    </p>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-600">
                                        Delta:{' '}
                                        <span
                                            className={
                                                item.offerDelta === null
                                                    ? 'text-slate-500'
                                                    : item.offerDelta < 0
                                                      ? 'text-emerald-700'
                                                      : item.offerDelta > 0
                                                        ? 'text-rose-700'
                                                        : 'text-slate-700'
                                            }
                                        >
                                            {item.offerDelta === null
                                                ? '—'
                                                : `${item.offerDelta > 0 ? '+' : ''}₹${Math.trunc(item.offerDelta).toLocaleString('en-IN')}`}
                                        </span>
                                        {item.updatedCount && item.updatedCount > 1
                                            ? ` • ${item.updatedCount} dealerships`
                                            : ''}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
