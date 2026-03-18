'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import {
    getAllDealerOffersForAdmin,
    getDealerOfferOverrideHistory,
    type AdminDealerOfferRow,
    type DealerOfferFilterOption,
    type DealerOfferOverrideHistoryRow,
} from '@/app/aums/actions/getAllDealerOffers';
import { deactivateDealerOffer } from '@/app/aums/actions/updateDealerOffer';
import OfferTable from './components/OfferTable';
import EditOfferPanel from './components/EditOfferPanel';

type StatusFilter = 'ALL' | 'DISCOUNT' | 'SURGE' | 'FLAT' | 'INACTIVE';

export default function AumsDealerOffersPage() {
    const { tenantSlug } = useTenant();
    const [rows, setRows] = useState<AdminDealerOfferRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRow, setSelectedRow] = useState<AdminDealerOfferRow | null>(null);

    const [dealerships, setDealerships] = useState<DealerOfferFilterOption[]>([]);
    const [brands, setBrands] = useState<DealerOfferFilterOption[]>([]);
    const [models, setModels] = useState<DealerOfferFilterOption[]>([]);

    const [dealershipFilter, setDealershipFilter] = useState('ALL');
    const [brandFilter, setBrandFilter] = useState('ALL');
    const [modelFilter, setModelFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [historyRows, setHistoryRows] = useState<DealerOfferOverrideHistoryRow[]>([]);
    const [historyOpen, setHistoryOpen] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        setHistoryLoading(true);
        setError('');

        const [res, historyRes] = await Promise.all([getAllDealerOffersForAdmin(), getDealerOfferOverrideHistory(20)]);
        if (!res.success) {
            setRows([]);
            setDealerships([]);
            setBrands([]);
            setModels([]);
            setError(res.message || 'Failed to load dealer offers');
            setLoading(false);
            setHistoryRows(historyRes.success ? historyRes.rows : []);
            setHistoryLoading(false);
            return;
        }

        setRows(res.rows || []);
        setDealerships(res.dealerships || []);
        setBrands(res.brands || []);
        setModels(res.models || []);
        setHistoryRows(historyRes.success ? historyRes.rows : []);
        setLoading(false);
        setHistoryLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            if (dealershipFilter !== 'ALL' && row.tenantId !== dealershipFilter) return false;
            if (brandFilter !== 'ALL' && row.brandName !== brandFilter) return false;
            if (modelFilter !== 'ALL' && row.modelName !== modelFilter) return false;

            if (statusFilter === 'INACTIVE') return !row.isActive;
            if (statusFilter === 'DISCOUNT') return row.isActive && row.offerAmount < 0;
            if (statusFilter === 'SURGE') return row.isActive && row.offerAmount > 0;
            if (statusFilter === 'FLAT') return row.isActive && row.offerAmount === 0;

            return true;
        });
    }, [rows, dealershipFilter, brandFilter, modelFilter, statusFilter]);

    const handleRemove = async (row: AdminDealerOfferRow) => {
        const confirmed = window.confirm(
            `Disable offer for ${row.dealershipName} • ${row.skuName} (${row.stateCode})?`
        );
        if (!confirmed) return;
        const res = await deactivateDealerOffer({
            tenantId: row.tenantId,
            skuId: row.skuId,
            stateCode: row.stateCode,
        });
        if (!res.success) {
            setError(res.message || 'Failed to disable offer');
            return;
        }
        await load();
    };

    const exportCsv = () => {
        const header = [
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

        const esc = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
        const body = filteredRows.map(row =>
            [
                row.dealershipName,
                row.dealershipSlug,
                row.brandName,
                row.modelName,
                row.skuId,
                row.skuName,
                row.stateCode,
                row.offerAmount,
                row.baseExShowroom,
                row.priceAfterOffer,
                row.isActive,
                row.inclusionType,
                row.tatDays ?? '',
                row.updatedAt ?? '',
            ]
                .map(esc)
                .join(',')
        );

        const csv = [header.join(','), ...body].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aums_dealer_offers_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    if (tenantSlug && tenantSlug !== 'aums') {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm font-semibold text-rose-700">
                Dealer Offer Override is available only in the AUMS workspace.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-black text-slate-900">Super Admin Offer Override</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Edit dealer offers across all dealerships without impersonation.
                </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <label className="block">
                        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Dealership
                        </span>
                        <select
                            value={dealershipFilter}
                            onChange={e => setDealershipFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                        >
                            <option value="ALL">All</option>
                            {dealerships.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Brand
                        </span>
                        <select
                            value={brandFilter}
                            onChange={e => setBrandFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                        >
                            <option value="ALL">All</option>
                            {brands.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Model
                        </span>
                        <select
                            value={modelFilter}
                            onChange={e => setModelFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                        >
                            <option value="ALL">All</option>
                            {models.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Status
                        </span>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
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

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {filteredRows.length} rows visible
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportCsv}
                            className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-black uppercase tracking-wider text-emerald-700 hover:bg-emerald-50"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={load}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">
                    Loading dealer offers...
                </div>
            ) : (
                <OfferTable rows={filteredRows} onEdit={setSelectedRow} onRemove={handleRemove} />
            )}

            <EditOfferPanel
                row={selectedRow}
                dealerships={dealerships}
                onClose={() => setSelectedRow(null)}
                onSaved={async () => {
                    setSelectedRow(null);
                    await load();
                }}
            />

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
                                Loading history...
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
