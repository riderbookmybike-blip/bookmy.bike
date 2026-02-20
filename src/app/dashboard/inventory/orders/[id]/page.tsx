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

interface VehicleDetail {
    id: string;
    chassis_number: string;
    engine_number: string;
    key_number: string | null;
    manufacturing_date: string | null;
}

interface GRNItem {
    id: string;
    sku_id: string;
    received: number;
    accepted: number;
    rejected: number;
    vehicle_details: VehicleDetail[];
}

interface GRN {
    id: string;
    status: string;
    created_at: string;
    items: GRNItem[];
}

interface POItem {
    id: string;
    sku_id: string;
    ordered_qty: number;
    received_qty: number;
    unit_cost: number | null;
    status: string;
    requisition_item_id: string | null;
}

interface PODetail {
    id: string;
    order_number: string;
    display_id: string | null;
    tenant_id: string;
    vendor_name: string | null;
    status: string;
    transporter_name: string | null;
    docket_number: string | null;
    expected_date: string | null;
    requisition_id: string | null;
    delivery_branch_id: string | null;
    created_at: string;
    items: POItem[];
    grns: GRN[];
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10',
    ORDERED:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    PARTIALLY_RECEIVED:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    COMPLETED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    CANCELLED:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
};

export default function PODetailPage() {
    const params = useParams();
    const router = useRouter();
    const { tenantId } = useTenant();
    const poId = params.id as string;

    const [po, setPO] = useState<PODetail | null>(null);
    const [skuNames, setSkuNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const fetchPO = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
            .from('inv_purchase_orders')
            .select(
                `
                *,
                items:inv_purchase_order_items (
                    id, sku_id, ordered_qty, received_qty, unit_cost, status, requisition_item_id
                ),
                grns:inv_grn (
                    id, status, created_at,
                    items:inv_grn_items (
                        id, sku_id, received, accepted, rejected,
                        vehicle_details:inv_grn_vehicle_details (
                            id, chassis_number, engine_number, key_number, manufacturing_date
                        )
                    )
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

        setPO(data as PODetail);

        // Resolve SKU names
        const skuIds = (data?.items || []).map((i: any) => i.sku_id).filter(Boolean);
        if (skuIds.length) {
            const { data: skus } = await supabase.from('cat_skus').select('id, sku_code').in('id', skuIds);
            if (skus) {
                const map: Record<string, string> = {};
                skus.forEach((s: any) => (map[s.id] = s.sku_code || s.id.slice(0, 8)));
                setSkuNames(map);
            }
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

    const totalOrdered = po.items?.reduce((s, i) => s + i.ordered_qty, 0) || 0;
    const totalReceived = po.items?.reduce((s, i) => s + (i.received_qty || 0), 0) || 0;
    const totalCost = po.items?.reduce((s, i) => s + (i.unit_cost || 0) * i.ordered_qty, 0) || 0;
    const canCreateGRN = po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED';

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
                        {po.order_number}
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
                        Create GRN
                    </button>
                )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[po.status]}`}
                    >
                        {po.status.replace(/_/g, ' ')}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor</p>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                        {po.vendor_name || '—'}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Progress</p>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                        {totalReceived}/{totalOrdered} received
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Est. Cost</p>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {totalCost > 0 ? `₹${totalCost.toLocaleString()}` : '—'}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expected</p>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                        {po.expected_date ? format(new Date(po.expected_date), 'dd MMM yyyy') : '—'}
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
                    {po.requisition_id && (
                        <a
                            href={`/dashboard/inventory/requisitions/${po.requisition_id}`}
                            className="ml-auto flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:underline"
                        >
                            <ExternalLink size={10} /> View Requisition
                        </a>
                    )}
                </div>
            )}

            {/* Items Table */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Order Items ({po.items?.length || 0})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                <th className="px-6 py-3 text-left text-[9px] font-black text-slate-400 uppercase">
                                    SKU
                                </th>
                                <th className="px-6 py-3 text-center text-[9px] font-black text-slate-400 uppercase">
                                    Ordered
                                </th>
                                <th className="px-6 py-3 text-center text-[9px] font-black text-slate-400 uppercase">
                                    Received
                                </th>
                                <th className="px-6 py-3 text-right text-[9px] font-black text-slate-400 uppercase">
                                    Unit Cost
                                </th>
                                <th className="px-6 py-3 text-center text-[9px] font-black text-slate-400 uppercase">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {po.items?.map(item => (
                                <tr key={item.id} className="border-b border-slate-50 dark:border-white/[.03]">
                                    <td className="px-6 py-3">
                                        <span className="font-black text-slate-900 dark:text-white uppercase text-[10px]">
                                            {skuNames[item.sku_id] || item.sku_id.slice(0, 12) + '...'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center font-black text-slate-900 dark:text-white">
                                        {item.ordered_qty}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span
                                            className={`font-black ${(item.received_qty || 0) >= item.ordered_qty ? 'text-emerald-600' : 'text-slate-400'}`}
                                        >
                                            {item.received_qty || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right text-slate-500">
                                        {item.unit_cost ? `₹${Number(item.unit_cost).toLocaleString()}` : '—'}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase ${STATUS_COLORS[item.status] || STATUS_COLORS.DRAFT}`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* GRN History */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <FileText size={16} className="text-emerald-500" />
                        Goods Receipts ({po.grns?.length || 0})
                    </h2>
                </div>

                {po.grns?.length ? (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {po.grns.map(grn => {
                            const totalAccepted = grn.items?.reduce((s, i) => s + i.accepted, 0) || 0;
                            const totalRejected = grn.items?.reduce((s, i) => s + i.rejected, 0) || 0;
                            const vehicleCount =
                                grn.items?.reduce((s, i) => s + (i.vehicle_details?.length || 0), 0) || 0;

                            return (
                                <div key={grn.id} className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">
                                                GRN-{grn.id.slice(0, 8).toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-slate-400 ml-2">
                                                {format(new Date(grn.created_at), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase ${
                                                grn.status === 'CONFIRMED'
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            {grn.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-6 text-[10px] font-bold text-slate-500">
                                        <span>✅ {totalAccepted} accepted</span>
                                        {totalRejected > 0 && <span>❌ {totalRejected} rejected</span>}
                                        <span>🏍️ {vehicleCount} vehicles logged</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase">
                            No GRNs yet — click "Create GRN" above
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
