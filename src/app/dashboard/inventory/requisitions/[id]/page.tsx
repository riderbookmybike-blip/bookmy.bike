'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    ArrowLeft,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRightCircle,
    Bookmark,
    Zap,
    ShieldAlert,
    Loader2,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { updateRequisitionStatus } from '@/actions/inventory';
import { toast } from 'sonner';
import QuotePanel from './components/QuotePanel';
import { useTenant } from '@/lib/tenant/tenantContext';

interface RequisitionItem {
    id: string;
    sku_id: string;
    quantity: number;
    notes: string | null;
    status: string;
    quotes: Array<{
        id: string;
        supplier_id: string;
        unit_cost: number;
        tax_amount: number;
        freight_amount: number;
        landed_cost: number;
        lead_time_days: number | null;
        valid_till: string | null;
        status: string;
        selection_reason: string | null;
        quoted_at: string;
    }>;
}

interface RequisitionDetail {
    id: string;
    display_id: string | null;
    tenant_id: string;
    customer_name: string | null;
    status: string;
    source_type: string;
    priority: string;
    booking_id: string | null;
    request_branch_id: string | null;
    delivery_branch_id: string | null;
    requested_by_user_id: string | null;
    assigned_to_user_id: string | null;
    created_at: string;
    updated_at: string;
    items: RequisitionItem[];
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    PENDING:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    SUBMITTED:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    IN_PROCUREMENT:
        'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    FULFILLED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    CANCELLED:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['SUBMITTED'],
    PENDING: ['SUBMITTED', 'IN_PROCUREMENT', 'CANCELLED'],
    SUBMITTED: ['IN_PROCUREMENT', 'CANCELLED'],
    IN_PROCUREMENT: ['FULFILLED', 'CANCELLED'],
};

export default function RequisitionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { tenantId } = useTenant();
    const requisitionId = params.id as string;

    const [requisition, setRequisition] = useState<RequisitionDetail | null>(null);
    const [skuNames, setSkuNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [transitioning, setTransitioning] = useState(false);

    const fetchRequisition = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
            .from('inv_requisitions')
            .select(
                `
                *,
                items:inv_requisition_items (
                    id, sku_id, quantity, notes, status,
                    quotes:inv_procurement_quotes (
                        id, supplier_id, unit_cost, tax_amount, freight_amount,
                        landed_cost, lead_time_days, valid_till, status,
                        selection_reason, quoted_at
                    )
                )
            `
            )
            .eq('id', requisitionId)
            .single();

        if (error) {
            console.error('Error fetching requisition:', error);
            setLoading(false);
            return;
        }

        setRequisition(data as RequisitionDetail);

        // Resolve SKU names
        if (data?.items?.length) {
            const skuIds = data.items.map((i: any) => i.sku_id).filter(Boolean);
            if (skuIds.length) {
                const { data: skus } = await supabase.from('cat_skus').select('id, sku_code').in('id', skuIds);
                if (skus) {
                    const map: Record<string, string> = {};
                    skus.forEach((s: any) => (map[s.id] = s.sku_code || s.id.slice(0, 8)));
                    setSkuNames(map);
                }
            }
        }

        setLoading(false);
    }, [requisitionId]);

    useEffect(() => {
        fetchRequisition();
    }, [fetchRequisition]);

    const handleStatusTransition = async (newStatus: string) => {
        if (!requisition) return;
        setTransitioning(true);
        const result = await updateRequisitionStatus(requisition.id, newStatus);
        if (result.success) {
            toast.success(`Status updated to ${newStatus}`);
            fetchRequisition();
        } else {
            toast.error(result.message || 'Failed to update status');
        }
        setTransitioning(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    if (!requisition) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertTriangle size={48} className="text-amber-500" />
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase">Requisition Not Found</p>
                <button
                    onClick={() => router.push('/dashboard/inventory/requisitions')}
                    className="text-sm font-bold text-indigo-500 hover:underline"
                >
                    Back to List
                </button>
            </div>
        );
    }

    const nextStatuses = VALID_TRANSITIONS[requisition.status] || [];

    return (
        <div className="space-y-8 pb-20 max-w-6xl mx-auto">
            {/* Back + Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/dashboard/inventory/requisitions')}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {requisition.display_id || `REQ-${requisition.id.slice(0, 8).toUpperCase()}`}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        Created {format(new Date(requisition.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Status */}
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[requisition.status] || STATUS_COLORS.DRAFT}`}
                    >
                        {requisition.status === 'FULFILLED' ? (
                            <CheckCircle2 size={14} />
                        ) : requisition.status === 'CANCELLED' ? (
                            <XCircle size={14} />
                        ) : requisition.status === 'IN_PROCUREMENT' ? (
                            <Package size={14} />
                        ) : (
                            <Clock size={14} />
                        )}
                        {requisition.status.replace('_', ' ')}
                    </span>
                </div>

                {/* Source */}
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Source</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-white uppercase">
                        {requisition.source_type === 'BOOKING' ? (
                            <Bookmark size={16} className="text-purple-500" />
                        ) : (
                            <Zap size={16} className="text-sky-500" />
                        )}
                        {requisition.source_type}
                    </span>
                    {requisition.booking_id && (
                        <a
                            href={`/dashboard/bookings/${requisition.booking_id}`}
                            className="flex items-center gap-1 mt-1 text-[10px] font-bold text-indigo-500 hover:underline"
                        >
                            <ExternalLink size={10} /> View Booking
                        </a>
                    )}
                </div>

                {/* Priority */}
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-white uppercase">
                        {requisition.priority === 'URGENT' && <ShieldAlert size={16} className="text-rose-500" />}
                        {requisition.priority}
                    </span>
                </div>

                {/* Customer */}
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer</p>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                        {requisition.customer_name || '—'}
                    </span>
                </div>
            </div>

            {/* Status Transition Buttons */}
            {nextStatuses.length > 0 && (
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transition:</span>
                    {nextStatuses.map(ns => (
                        <button
                            key={ns}
                            onClick={() => handleStatusTransition(ns)}
                            disabled={transitioning}
                            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 border ${
                                ns === 'CANCELLED'
                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100'
                                    : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100'
                            }`}
                        >
                            {transitioning ? <Loader2 size={12} className="animate-spin" /> : null}→{' '}
                            {ns.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}

            {/* Items Table */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Items ({requisition.items?.length || 0})
                    </h2>
                </div>

                {requisition.items?.length ? (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {requisition.items.map(item => (
                            <div key={item.id} className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {skuNames[item.sku_id] || item.sku_id.slice(0, 12) + '...'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            Qty: {item.quantity} • Status: {item.status}
                                        </p>
                                        {item.notes && (
                                            <p className="text-xs text-slate-500 mt-1 italic">{item.notes}</p>
                                        )}
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${
                                            item.status === 'FULFILLED'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        {item.status}
                                    </span>
                                </div>

                                {/* Procurement Quotes Panel */}
                                <QuotePanel item={item} tenantId={requisition.tenant_id} onRefresh={fetchRequisition} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-sm text-slate-400 font-bold uppercase">No items</p>
                    </div>
                )}
            </div>
        </div>
    );
}
