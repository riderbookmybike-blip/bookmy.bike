'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, Package, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { receiveStock, updatePurchaseOrder } from '@/actions/inventory';

type PurchaseOrderForGrn = {
    id: string;
    display_id: string | null;
    po_status: 'DRAFT' | 'SENT' | 'SHIPPED' | 'RECEIVED';
    request: {
        id: string;
        display_id: string | null;
        sku_id: string;
        tenant_id: string;
        delivery_branch_id: string | null;
    } | null;
    stock: Array<{ id: string }>;
};

type BranchOption = {
    id: string;
    name: string;
    city: string | null;
    district: string | null;
};

export default function GRNEntryPage() {
    const params = useParams<{ id?: string; slug?: string }>();
    const router = useRouter();
    const supabase = createClient();

    const poId = params.id as string;
    const slug = typeof params?.slug === 'string' ? params.slug : undefined;
    const ordersBasePath = slug ? `/app/${slug}/dashboard/inventory/orders` : '/dashboard/inventory/orders';
    const stockBasePath = slug ? `/app/${slug}/dashboard/inventory/stock` : '/dashboard/inventory/stock';

    const [po, setPO] = useState<PurchaseOrderForGrn | null>(null);
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [markShippedFirst, setMarkShippedFirst] = useState(true);

    const [branchId, setBranchId] = useState('');
    const [chassisNumber, setChassisNumber] = useState('');
    const [engineNumber, setEngineNumber] = useState('');
    const [batteryMake, setBatteryMake] = useState('');
    const [chassisMedia, setChassisMedia] = useState('');
    const [engineMedia, setEngineMedia] = useState('');
    const [stickerMedia, setStickerMedia] = useState('');
    const [videoMedia, setVideoMedia] = useState('');
    const [qcNotes, setQcNotes] = useState('');

    const fetchData = useCallback(async () => {
        if (!poId) return;
        setLoading(true);
        try {
            const { data: poData, error: poErr } = await supabase
                .from('inv_purchase_orders')
                .select(
                    `
                    id, display_id, po_status,
                    request:inv_requests!inner(
                        id, display_id, sku_id, tenant_id, delivery_branch_id
                    ),
                    stock:inv_stock(id)
                    `
                )
                .eq('id', poId)
                .single();

            if (poErr || !poData) throw new Error(poErr?.message || 'PO not found');

            const castedPO = poData as unknown as PurchaseOrderForGrn;
            if (!castedPO.request) {
                throw new Error('Request context missing for this PO');
            }

            setPO(castedPO);

            const { data: branchData, error: branchErr } = await supabase
                .from('id_locations')
                .select('id, name, city, district')
                .eq('tenant_id', castedPO.request.tenant_id)
                .eq('is_active', true)
                .order('name');

            if (branchErr) throw new Error(branchErr.message);

            const resolvedBranches = (branchData || []) as BranchOption[];
            setBranches(resolvedBranches);

            if (castedPO.request.delivery_branch_id) {
                setBranchId(castedPO.request.delivery_branch_id);
            } else if (resolvedBranches.length > 0) {
                setBranchId(resolvedBranches[0].id);
            }

            if (castedPO.po_status === 'SHIPPED' || castedPO.po_status === 'RECEIVED') {
                setMarkShippedFirst(false);
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to load PO');
        } finally {
            setLoading(false);
        }
    }, [poId, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const unitsReceived = useMemo(() => po?.stock?.length || 0, [po?.stock]);

    const handleSubmit = async () => {
        if (!po?.request) {
            toast.error('PO context missing');
            return;
        }

        if (!branchId) {
            toast.error('Select receiving branch');
            return;
        }

        if (!chassisNumber.trim() || !engineNumber.trim()) {
            toast.error('Chassis and engine number are mandatory');
            return;
        }

        if (!chassisMedia.trim() || !engineMedia.trim() || !videoMedia.trim()) {
            toast.error('Chassis photo, engine photo and QC video links are mandatory');
            return;
        }

        setSubmitting(true);
        try {
            if (markShippedFirst && po.po_status === 'DRAFT') {
                const sentResult = await updatePurchaseOrder({ po_id: po.id, po_status: 'SENT' });
                if (!sentResult.success) {
                    toast.error(sentResult.message || 'Failed to mark PO sent');
                    return;
                }
            }

            if (markShippedFirst && (po.po_status === 'DRAFT' || po.po_status === 'SENT')) {
                const shippedResult = await updatePurchaseOrder({ po_id: po.id, po_status: 'SHIPPED' });
                if (!shippedResult.success) {
                    toast.error(shippedResult.message || 'Failed to mark PO shipped');
                    return;
                }
            }

            const result = await receiveStock({
                po_id: po.id,
                tenant_id: po.request.tenant_id,
                sku_id: po.request.sku_id,
                branch_id: branchId,
                chassis_number: chassisNumber.trim().toUpperCase(),
                engine_number: engineNumber.trim().toUpperCase(),
                battery_make: batteryMake.trim() || undefined,
                media_chassis_url: chassisMedia.trim(),
                media_engine_url: engineMedia.trim(),
                media_sticker_url: stickerMedia.trim() || undefined,
                media_qc_video_url: videoMedia.trim(),
                qc_notes: qcNotes.trim() || undefined,
            });

            if (!result.success) {
                toast.error(result.message || 'Failed to receive stock');
                return;
            }

            toast.success(result.message || 'Stock received');
            const stockId = (result.data as { id?: string } | undefined)?.id;
            if (stockId) {
                router.push(`${stockBasePath}/${stockId}`);
            } else {
                router.push(`${ordersBasePath}/${po.id}`);
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to receive stock');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    if (!po) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
                <Package size={40} className="text-amber-500" />
                <p className="text-base font-black text-slate-900 dark:text-white uppercase">PO not found</p>
                <button
                    onClick={() => router.push(ordersBasePath)}
                    className="text-sm font-bold text-indigo-500 hover:underline"
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    const poLabel = po.display_id || `PO-${po.id.slice(0, 8).toUpperCase()}`;
    const requestLabel = po.request?.display_id || `REQ-${po.request?.id.slice(0, 8).toUpperCase()}`;

    return (
        <div className="space-y-8 pb-20 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push(`${ordersBasePath}/${po.id}`)}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        GRN Entry • {poLabel}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Requisition {requestLabel} • Units already received: {unitsReceived}
                    </p>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Vehicle QC & Receipt
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Receiving Branch
                        </label>
                        <select
                            value={branchId}
                            onChange={e => setBranchId(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white"
                        >
                            <option value="">Select branch</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                    {branch.city ? ` • ${branch.city}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <label className="inline-flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            <input
                                type="checkbox"
                                checked={markShippedFirst}
                                onChange={e => setMarkShippedFirst(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300"
                            />
                            Auto-mark PO as shipped before receive
                        </label>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Chassis Number
                        </label>
                        <input
                            type="text"
                            value={chassisNumber}
                            onChange={e => setChassisNumber(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white uppercase"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Engine Number
                        </label>
                        <input
                            type="text"
                            value={engineNumber}
                            onChange={e => setEngineNumber(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white uppercase"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Battery Make (optional)
                        </label>
                        <input
                            type="text"
                            value={batteryMake}
                            onChange={e => setBatteryMake(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            QC Notes (optional)
                        </label>
                        <input
                            type="text"
                            value={qcNotes}
                            onChange={e => setQcNotes(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-black text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Chassis Photo URL
                        </label>
                        <input
                            type="url"
                            value={chassisMedia}
                            onChange={e => setChassisMedia(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Engine Photo URL
                        </label>
                        <input
                            type="url"
                            value={engineMedia}
                            onChange={e => setEngineMedia(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Sticker Photo URL (optional)
                        </label>
                        <input
                            type="url"
                            value={stickerMedia}
                            onChange={e => setStickerMedia(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            QC Video URL
                        </label>
                        <input
                            type="url"
                            value={videoMedia}
                            onChange={e => setVideoMedia(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={() => router.push(`${ordersBasePath}/${po.id}`)}
                        className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        {submitting ? 'Saving...' : 'Mark Received'}
                    </button>
                </div>
            </div>
        </div>
    );
}
