'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock3, ExternalLink, Loader2, Lock, LockOpen, Share2, Warehouse } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getStockById, softLockStock, toggleStockSharing, unlockStock } from '@/actions/inventory';

type TenantRef = { name: string | null; slug: string | null } | { name: string | null; slug: string | null }[] | null;
type BranchRef = { name: string; city: string | null } | { name: string; city: string | null }[] | null;
type PORef = {
    id: string;
    display_id: string | null;
    request_id: string;
    total_po_value: number;
    po_status: string;
    payment_status: string;
    created_at: string;
} | null;

type StockLedgerRow = {
    id: string;
    action: string;
    notes: string | null;
    created_at: string;
    actor_tenant_id: string | null;
    actor_user_id: string | null;
};

type StockDetail = {
    id: string;
    tenant_id: string;
    po_id: string;
    sku_id: string;
    branch_id: string;
    chassis_number: string;
    engine_number: string;
    battery_make: string | null;
    media_chassis_url: string;
    media_engine_url: string;
    media_sticker_url: string | null;
    media_qc_video_url: string;
    qc_status: string;
    qc_notes: string | null;
    status: string;
    is_shared: boolean;
    locked_by_tenant_id: string | null;
    locked_at: string | null;
    created_at: string;
    updated_at: string;
    sku: { name: string | null } | null;
    branch: BranchRef;
    po: PORef;
    owner: TenantRef;
    locker: TenantRef;
    inv_stock_ledger: StockLedgerRow[];
};

const STATUS_STYLES: Record<string, string> = {
    AVAILABLE:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    SOFT_LOCKED:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    HARD_LOCKED:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
    SOLD: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/20',
    IN_TRANSIT:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
};

const parseTenant = (value: TenantRef) => {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] || null;
    return value;
};

const parseBranch = (value: BranchRef) => {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] || null;
    return value;
};

export default function StockDetailPage() {
    const router = useRouter();
    const params = useParams<{ id?: string; slug?: string }>();
    const { tenantId } = useTenant();
    const stockId = params.id as string;
    const slug = typeof params?.slug === 'string' ? params.slug : undefined;
    const stockBasePath = slug ? `/app/${slug}/dashboard/inventory/stock` : '/dashboard/inventory/stock';
    const ordersBasePath = slug ? `/app/${slug}/dashboard/inventory/orders` : '/dashboard/inventory/orders';

    const [stock, setStock] = useState<StockDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionBusy, setActionBusy] = useState(false);

    const fetchStockDetail = useCallback(async () => {
        if (!stockId) return;
        setLoading(true);
        try {
            const result = await getStockById(stockId);
            if (!result.success || !result.data) {
                throw new Error(result.message || 'Stock not found');
            }
            setStock(result.data as StockDetail);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to load stock detail');
            setStock(null);
        } finally {
            setLoading(false);
        }
    }, [stockId]);

    useEffect(() => {
        fetchStockDetail();
    }, [fetchStockDetail]);

    const owner = useMemo(() => parseTenant(stock?.owner || null), [stock?.owner]);
    const locker = useMemo(() => parseTenant(stock?.locker || null), [stock?.locker]);
    const branch = useMemo(() => parseBranch(stock?.branch || null), [stock?.branch]);
    const sortedLedger = useMemo(
        () =>
            (stock?.inv_stock_ledger || [])
                .slice()
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [stock?.inv_stock_ledger]
    );

    const canToggleSharing = !!stock && tenantId === stock.tenant_id;
    const canSoftLock = !!stock && stock.status === 'AVAILABLE' && !!tenantId;
    const canUnlock = !!stock && (stock.status === 'SOFT_LOCKED' || stock.status === 'HARD_LOCKED');

    const handleToggleSharing = async () => {
        if (!stock) return;
        setActionBusy(true);
        try {
            const result = await toggleStockSharing(stock.id, !stock.is_shared);
            if (!result.success) {
                toast.error(result.message || 'Failed to update sharing');
                return;
            }
            toast.success(result.message || 'Sharing updated');
            await fetchStockDetail();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update sharing');
        } finally {
            setActionBusy(false);
        }
    };

    const handleSoftLock = async () => {
        if (!stock || !tenantId) return;
        setActionBusy(true);
        try {
            const result = await softLockStock(stock.id, tenantId);
            if (!result.success) {
                toast.error(result.message || 'Failed to lock stock');
                return;
            }
            toast.success(result.message || 'Stock locked');
            await fetchStockDetail();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to lock stock');
        } finally {
            setActionBusy(false);
        }
    };

    const handleUnlock = async () => {
        if (!stock) return;
        setActionBusy(true);
        try {
            const result = await unlockStock(stock.id);
            if (!result.success) {
                toast.error(result.message || 'Failed to unlock stock');
                return;
            }
            toast.success(result.message || 'Stock unlocked');
            await fetchStockDetail();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to unlock stock');
        } finally {
            setActionBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-emerald-500" size={40} />
            </div>
        );
    }

    if (!stock) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
                <Warehouse size={44} className="text-amber-500" />
                <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Stock not found
                </p>
                <button
                    onClick={() => router.push(stockBasePath)}
                    className="text-sm font-bold text-indigo-500 hover:underline"
                >
                    Back to Stock List
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push(stockBasePath)}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {stock.sku?.name || 'Vehicle Unit'} • {stock.chassis_number}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Engine {stock.engine_number} • Updated{' '}
                        {format(new Date(stock.updated_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                </div>
                <span
                    className={`inline-flex px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[stock.status] || STATUS_STYLES.AVAILABLE}`}
                >
                    {stock.status.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ownership</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                        {owner?.name || stock.tenant_id}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">
                        Branch: {branch?.name || stock.branch_id}
                        {branch?.city ? ` • ${branch.city}` : ''}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                        Shared: {stock.is_shared ? 'Yes' : 'No'}
                    </p>
                    {stock.locked_by_tenant_id && (
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-300 uppercase mt-1">
                            Locked By: {locker?.name || stock.locked_by_tenant_id}
                        </p>
                    )}
                </div>

                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">QC</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                        {stock.qc_status.replace(/_/g, ' ')}
                    </p>
                    {stock.battery_make && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">
                            Battery: {stock.battery_make}
                        </p>
                    )}
                    {stock.qc_notes && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Notes: {stock.qc_notes}</p>
                    )}
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                        Received {format(new Date(stock.created_at), 'dd MMM yyyy')}
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Purchase Order
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                        {stock.po?.display_id || `PO-${stock.po_id.slice(0, 8).toUpperCase()}`}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">
                        Value: ₹{Number(stock.po?.total_po_value || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                        PO Status: {stock.po?.po_status?.replace(/_/g, ' ') || 'N/A'}
                    </p>
                    <button
                        onClick={() => router.push(`${ordersBasePath}/${stock.po_id}`)}
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-wider hover:underline"
                    >
                        Open PO <ExternalLink size={12} />
                    </button>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Actions</p>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleToggleSharing}
                        disabled={!canToggleSharing || actionBusy}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider disabled:cursor-not-allowed"
                    >
                        <Share2 size={12} />
                        {stock.is_shared ? 'Disable Sharing' : 'Share Across Tenants'}
                    </button>

                    <button
                        onClick={handleSoftLock}
                        disabled={!canSoftLock || actionBusy}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider disabled:cursor-not-allowed"
                    >
                        <Lock size={12} />
                        Soft Lock
                    </button>

                    <button
                        onClick={handleUnlock}
                        disabled={!canUnlock || actionBusy}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider disabled:cursor-not-allowed"
                    >
                        <LockOpen size={12} />
                        Unlock
                    </button>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QC Media</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { label: 'Chassis Photo', url: stock.media_chassis_url },
                        { label: 'Engine Photo', url: stock.media_engine_url },
                        { label: 'Sticker Photo', url: stock.media_sticker_url },
                        { label: 'QC Video', url: stock.media_qc_video_url },
                    ].map(item => (
                        <a
                            key={item.label}
                            href={item.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-wide inline-flex items-center justify-between ${
                                item.url
                                    ? 'border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                    : 'border-slate-100 dark:border-white/5 text-slate-400 pointer-events-none'
                            }`}
                        >
                            <span>{item.label}</span>
                            <ExternalLink size={14} />
                        </a>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-2">
                    <Clock3 size={14} className="text-indigo-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Timeline</p>
                </div>
                {sortedLedger.length === 0 ? (
                    <div className="p-8 text-center text-[11px] font-bold text-slate-400 uppercase">
                        No ledger entries yet.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/10">
                        {sortedLedger.map(entry => (
                            <div key={entry.id} className="px-6 py-4 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                                        {entry.action.replace(/_/g, ' ')}
                                    </p>
                                    {entry.notes && (
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                                            {entry.notes}
                                        </p>
                                    )}
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                        Actor Tenant: {entry.actor_tenant_id || 'N/A'}
                                    </p>
                                </div>
                                <div className="text-right text-[10px] font-black text-slate-400 uppercase">
                                    {format(new Date(entry.created_at), 'dd MMM yyyy')}
                                    <br />
                                    {format(new Date(entry.created_at), 'hh:mm a')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
