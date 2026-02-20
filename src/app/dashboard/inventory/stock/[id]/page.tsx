'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    Hash,
    ShieldCheck,
    Package,
    CheckCircle2,
    Tag,
    Truck,
    AlertTriangle,
    XCircle,
    Calendar,
    IndianRupee,
    Clock,
    ArrowDownUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getStockById, updateStockStatus } from '@/actions/inventory';

const STATUS_COLORS: Record<string, string> = {
    AVAILABLE:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    RESERVED:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    SOLD: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10',
    DAMAGED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    IN_TRANSIT:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    AVAILABLE: <CheckCircle2 size={16} />,
    RESERVED: <Tag size={16} />,
    SOLD: <Package size={16} />,
    DAMAGED: <AlertTriangle size={16} />,
    IN_TRANSIT: <Truck size={16} />,
};

const TRANSITIONS: Record<string, string[]> = {
    IN_TRANSIT: ['AVAILABLE', 'DAMAGED'],
    AVAILABLE: ['RESERVED', 'SOLD', 'DAMAGED', 'IN_TRANSIT'],
    RESERVED: ['AVAILABLE', 'SOLD', 'DAMAGED'],
    SOLD: [],
    DAMAGED: ['AVAILABLE'],
};

const TRANSITION_COLORS: Record<string, string> = {
    AVAILABLE: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
    RESERVED: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    SOLD: 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-500/20',
    DAMAGED: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
    IN_TRANSIT: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20',
};

const REASON_LABELS: Record<string, string> = {
    GRN_INWARD: 'GRN Inward',
    STATUS_AVAILABLE: 'Marked Available',
    STATUS_RESERVED: 'Reserved',
    STATUS_SOLD: 'Sold',
    STATUS_DAMAGED: 'Marked Damaged',
    STATUS_IN_TRANSIT: 'In Transit',
    STOCK_STATUS: 'Status Change',
};

interface StockDetail {
    id: string;
    sku_id: string;
    sku_name: string;
    chassis_number: string;
    engine_number: string;
    status: string;
    current_owner_id: string;
    dealer_price: number | null;
    offer_price: number | null;
    invoice_date: string | null;
    created_at: string;
    updated_at: string;
    ledger: LedgerEntry[];
}

interface LedgerEntry {
    id: string;
    sku_id: string;
    branch_id: string;
    qty_delta: number;
    balance_after: number;
    reason_code: string;
    ref_type: string;
    ref_id: string;
    created_at: string;
    created_by: string | null;
}

export default function StockDetailPage() {
    const params = useParams();
    const router = useRouter();
    const stockId = params.id as string;

    const [stock, setStock] = useState<StockDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [transitioning, setTransitioning] = useState(false);

    const fetchData = useCallback(async () => {
        const data = await getStockById(stockId);
        setStock(data as StockDetail | null);
        setLoading(false);
    }, [stockId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTransition = async (newStatus: string) => {
        if (transitioning) return;
        setTransitioning(true);

        const result = await updateStockStatus(stockId, newStatus);

        if (result.success) {
            toast.success(`Status changed to ${newStatus}`);
            await fetchData();
        } else {
            toast.error(result.message || 'Failed to update status');
        }

        setTransitioning(false);
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
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Package size={48} className="text-amber-500" />
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase">Stock Item Not Found</p>
                <button
                    onClick={() => router.push('/dashboard/inventory/stock')}
                    className="text-sm font-bold text-emerald-500 hover:underline"
                >
                    Back to Stock
                </button>
            </div>
        );
    }

    const allowedTransitions = TRANSITIONS[stock.status] || [];

    return (
        <div className="space-y-8 pb-20 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/dashboard/inventory/stock')}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {stock.sku_name}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        Inwarded {format(new Date(stock.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                </div>
                <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border uppercase tracking-widest ${STATUS_COLORS[stock.status]}`}
                >
                    {STATUS_ICONS[stock.status]}
                    {stock.status?.replace(/_/g, ' ')}
                </span>
            </div>

            {/* Vehicle Identity */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Vehicle Identity
                    </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Hash size={10} /> Chassis Number
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {stock.chassis_number}
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <ShieldCheck size={10} /> Engine Number
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {stock.engine_number}
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <IndianRupee size={10} /> Dealer Price
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                            {stock.dealer_price ? `₹${Number(stock.dealer_price).toLocaleString()}` : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Calendar size={10} /> Invoice Date
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                            {stock.invoice_date ? format(new Date(stock.invoice_date), 'dd MMM yyyy') : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Transitions */}
            {allowedTransitions.length > 0 && (
                <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 p-6">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                        <ArrowDownUp size={16} className="text-indigo-500" />
                        Status Transitions
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {allowedTransitions.map(status => (
                            <button
                                key={status}
                                onClick={() => handleTransition(status)}
                                disabled={transitioning}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 ${TRANSITION_COLORS[status]}`}
                            >
                                {STATUS_ICONS[status]}
                                {transitioning ? 'Processing...' : `Mark ${status.replace(/_/g, ' ')}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Ledger Timeline */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <Clock size={16} className="text-emerald-500" />
                        Stock Ledger ({stock.ledger?.length || 0})
                    </h2>
                </div>

                {stock.ledger?.length ? (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {stock.ledger.map(entry => (
                            <div key={entry.id} className="px-6 py-4 flex items-center gap-4">
                                <div
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${
                                        entry.qty_delta > 0
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                            : entry.qty_delta < 0
                                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                              : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                                    }`}
                                >
                                    {entry.qty_delta > 0 ? '+' : entry.qty_delta < 0 ? '' : '○'}
                                    {entry.qty_delta !== 0 ? entry.qty_delta : ''}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase">
                                        {REASON_LABELS[entry.reason_code] || entry.reason_code}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                        {entry.ref_type} · {entry.ref_id?.slice(0, 8)}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-bold text-slate-400">
                                        {format(new Date(entry.created_at), 'dd MMM yyyy')}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400">
                                        {format(new Date(entry.created_at), 'hh:mm a')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase">No ledger entries yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
