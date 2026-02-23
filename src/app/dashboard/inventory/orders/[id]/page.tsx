'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    ArrowLeft,
    Truck,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink,
    Calendar,
    Building2,
    FileText,
    Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTenant } from '@/lib/tenant/tenantContext';

interface PODetail {
    id: string;
    display_id: string | null;
    request_id: string;
    quote_id: string;
    total_po_value: number;
    payment_status: string;
    po_status: string;
    transporter_name: string | null;
    docket_number: string | null;
    expected_delivery_date: string | null;
    created_at: string;
    request: {
        sku_id: string;
        display_id: string | null;
    };
    stock?: Array<{
        id: string;
        chassis_number: string;
        engine_number: string;
        qc_status: string;
        status: string;
    }>;
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10',
    SENT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    SHIPPED:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    RECEIVED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
};

export default function PODetailPage() {
    const params = useParams();
    const router = useRouter();
    const { tenantId } = useTenant();
    const poId = params.id as string;

    const [po, setPO] = useState<PODetail | null>(null);
    const [skuName, setSkuName] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const fetchPO = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('inv_purchase_orders')
            .select(
                `
                *,
                request:inv_requests (
                    sku_id, display_id
                ),
                stock:inv_stock (
                    id, chassis_number, engine_number, qc_status, status
                )
            `
            )
            .eq('id', poId)
            .single();

        if (error) {
            console.error('Error fetching PO:', error);
            setLoading(false);
            return;
        }

        const poData = data as any;
        setPO(poData);

        // Resolve SKU names
        if (poData?.request?.sku_id) {
            const { data: sku } = await supabase
                .from('cat_skus')
                .select('name')
                .eq('id', poData.request.sku_id)
                .single();
            if (sku) setSkuName(sku.name || 'Unnamed SKU');
        }

        setLoading(false);
    }, [poId]);

    useEffect(() => {
        fetchPO();
    }, [fetchPO]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    if (!po) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Package size={48} className="text-amber-500" />
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase">PO Not Found</p>
                <button
                    onClick={() => router.push('/dashboard/inventory/orders')}
                    className="text-sm font-bold text-indigo-500 hover:underline"
                >
                    Back to List
                </button>
            </div>
        );
    }

    const canCreateGRN = po.po_status === 'SHIPPED'; // Simplified GRN logic for new schema

    return (
        <div className="space-y-8 pb-20 max-w-6xl mx-auto">
            {/* Back + Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/dashboard/inventory/orders')}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {po.display_id || `PO-${po.id.slice(0, 8).toUpperCase()}`}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        Created {format(new Date(po.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                </div>
                {canCreateGRN && (
                    <button
                        onClick={() => router.push(`/dashboard/inventory/orders/${po.id}/grn`)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95 uppercase tracking-wide"
                    >
                        <Plus size={16} strokeWidth={3} />
                        Log Stock Receipt
                    </button>
                )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[po.po_status]}`}
                    >
                        {po.po_status.replace(/_/g, ' ')}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Finance</p>
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase">
                        {po.payment_status?.replace(/_/g, ' ') || 'UNPAID'}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Value</p>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{po.total_po_value?.toLocaleString()}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expected</p>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                        {po.expected_delivery_date ? format(new Date(po.expected_delivery_date), 'dd MMM yyyy') : '—'}
                    </span>
                </div>
            </div>

            {/* Logistics */}
            {(po.transporter_name || po.docket_number) && (
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex items-center gap-8">
                    <Truck size={24} className="text-indigo-500 shrink-0" />
                    <div className="flex gap-8">
                        {po.transporter_name && (
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Transporter
                                </p>
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                                    {po.transporter_name}
                                </p>
                            </div>
                        )}
                        {po.docket_number && (
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    LR / Docket
                                </p>
                                <p className="text-xs font-black text-slate-900 dark:text-white">{po.docket_number}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Items Summary (Single SKU per PO in strict relational) */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden p-8">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ordered Product</p>
                    <span className="text-[10px] font-black text-indigo-500 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                        {po.request?.display_id || 'REQ-ID'}
                    </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">{skuName}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">SKU ID: {po.request?.sku_id}</p>
            </div>

            {/* Stock / GRN Audit */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        Unit Tracking
                    </h2>
                </div>
                <div className="p-6">
                    {po.stock && po.stock.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {po.stock.map(unit => (
                                <div
                                    key={unit.id}
                                    className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">
                                            CHASSIS: {unit.chassis_number}
                                        </span>
                                        <span
                                            className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase ${
                                                unit.qc_status === 'PASSED'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}
                                        >
                                            QC: {unit.qc_status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                                        ENGINE: {unit.engine_number}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">
                                        STATUS: {unit.status}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-xs font-bold text-slate-400 uppercase">
                                No units logged yet. Log receipt once vehicle arrives.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
