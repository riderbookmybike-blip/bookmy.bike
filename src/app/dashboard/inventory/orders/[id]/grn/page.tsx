'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Plus, Trash2, CheckCircle2, Package, AlertTriangle } from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createGRN, confirmGRN as confirmGRNAction } from '@/actions/inventory';
import { toast } from 'sonner';

interface POItem {
    id: string;
    sku_id: string;
    ordered_qty: number;
    received_qty: number;
}

interface VehicleEntry {
    chassis_number: string;
    engine_number: string;
    key_number: string;
    manufacturing_date: string;
}

interface GRNItemEntry {
    po_item_id: string;
    sku_id: string;
    sku_name: string;
    ordered_qty: number;
    already_received: number;
    pending: number;
    accepted: number;
    rejected: number;
    vehicles: VehicleEntry[];
}

export default function GRNEntryPage() {
    const params = useParams();
    const router = useRouter();
    const { tenantId } = useTenant();
    const poId = params.id as string;

    const [poItems, setPOItems] = useState<POItem[]>([]);
    const [skuNames, setSkuNames] = useState<Record<string, string>>({});
    const [grnItems, setGRNItems] = useState<GRNItemEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchPOItems = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
            .from('inv_purchase_order_items')
            .select('id, sku_id, ordered_qty, received_qty')
            .eq('po_id', poId);

        if (error) {
            console.error('Error fetching PO items:', error);
            setLoading(false);
            return;
        }

        const items = (data || []) as POItem[];
        setPOItems(items);

        // Resolve SKUs
        const skuIds = items.map(i => i.sku_id).filter(Boolean);
        if (skuIds.length) {
            const { data: skus } = await supabase.from('cat_skus').select('id, sku_code').in('id', skuIds);
            if (skus) {
                const map: Record<string, string> = {};
                skus.forEach((s: any) => (map[s.id] = s.sku_code || s.id.slice(0, 8)));
                setSkuNames(map);
            }
        }

        // Build GRN item entries from PO items
        const entries: GRNItemEntry[] = items.map(item => {
            const pending = item.ordered_qty - (item.received_qty || 0);
            return {
                po_item_id: item.id,
                sku_id: item.sku_id,
                sku_name: '',
                ordered_qty: item.ordered_qty,
                already_received: item.received_qty || 0,
                pending,
                accepted: pending > 0 ? pending : 0,
                rejected: 0,
                vehicles:
                    pending > 0
                        ? Array.from({ length: pending }, () => ({
                              chassis_number: '',
                              engine_number: '',
                              key_number: '',
                              manufacturing_date: '',
                          }))
                        : [],
            };
        });

        setGRNItems(entries);
        setLoading(false);
    }, [poId]);

    useEffect(() => {
        fetchPOItems();
    }, [fetchPOItems]);

    const updateAccepted = (index: number, value: number) => {
        const updated = [...grnItems];
        const item = updated[index];
        const maxAccept = item.pending;
        const accepted = Math.min(Math.max(0, value), maxAccept);
        item.accepted = accepted;
        item.rejected = maxAccept - accepted;

        // Adjust vehicles array to match accepted count
        while (item.vehicles.length < accepted) {
            item.vehicles.push({ chassis_number: '', engine_number: '', key_number: '', manufacturing_date: '' });
        }
        while (item.vehicles.length > accepted) {
            item.vehicles.pop();
        }

        setGRNItems(updated);
    };

    const updateVehicle = (itemIdx: number, vehIdx: number, field: keyof VehicleEntry, value: string) => {
        const updated = [...grnItems];
        updated[itemIdx].vehicles[vehIdx][field] = value;
        setGRNItems(updated);
    };

    const handleSubmitAndConfirm = async () => {
        if (!tenantId) return;

        // Validate: at least one accepted item with vehicle details
        const hasItems = grnItems.some(i => i.accepted > 0);
        if (!hasItems) {
            toast.error('No items to receive');
            return;
        }

        // Validate vehicle details for accepted items
        for (const item of grnItems) {
            for (let v = 0; v < item.vehicles.length; v++) {
                const veh = item.vehicles[v];
                if (!veh.chassis_number || !veh.engine_number) {
                    toast.error(
                        `Missing chassis/engine number for vehicle ${v + 1} of ${skuNames[item.sku_id] || 'item'}`
                    );
                    return;
                }
            }
        }

        setSubmitting(true);
        try {
            // 1. Create draft GRN
            const grnResult = await createGRN({
                tenant_id: tenantId,
                purchase_order_id: poId,
                items: grnItems
                    .filter(i => i.accepted > 0 || i.rejected > 0)
                    .map(i => ({
                        purchase_order_item_id: i.po_item_id,
                        sku_id: i.sku_id,
                        received: i.accepted + i.rejected,
                        accepted: i.accepted,
                        rejected: i.rejected,
                        vehicles: i.vehicles.map(v => ({
                            chassis_number: v.chassis_number,
                            engine_number: v.engine_number,
                            key_number: v.key_number || undefined,
                            manufacturing_date: v.manufacturing_date || undefined,
                        })),
                    })),
            });

            if (!grnResult.success) {
                toast.error(grnResult.message || 'Failed to create GRN');
                setSubmitting(false);
                return;
            }

            // 2. Confirm → posts stock
            const confirmResult = await confirmGRNAction(grnResult.data.id);

            if (confirmResult.success) {
                toast.success(`GRN confirmed — ${confirmResult.stock_posted} units posted to stock`);
                router.push(`/dashboard/inventory/orders/${poId}`);
            } else {
                toast.error(confirmResult.message || 'GRN created but confirmation failed');
                router.push(`/dashboard/inventory/orders/${poId}`);
            }
        } catch (err) {
            console.error('GRN Error:', err);
            toast.error('Failed to process GRN');
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

    return (
        <div className="space-y-8 pb-20 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push(`/dashboard/inventory/orders/${poId}`)}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Goods Receipt Note
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        Record incoming vehicles and confirm stock
                    </p>
                </div>
            </div>

            {/* Items */}
            {grnItems.map((item, itemIdx) => {
                const name = skuNames[item.sku_id] || item.sku_id.slice(0, 12) + '...';

                return (
                    <div
                        key={item.po_item_id}
                        className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden"
                    >
                        {/* Item Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">{name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                    Ordered: {item.ordered_qty} · Already Received: {item.already_received} · Pending:{' '}
                                    {item.pending}
                                </p>
                            </div>
                            {item.pending === 0 ? (
                                <span className="px-3 py-1.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">
                                    Fully Received
                                </span>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Accept</p>
                                        <input
                                            type="number"
                                            min={0}
                                            max={item.pending}
                                            value={item.accepted}
                                            onChange={e => updateAccepted(itemIdx, parseInt(e.target.value) || 0)}
                                            className="w-16 text-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl py-2 text-sm font-black text-emerald-700 dark:text-emerald-400 focus:outline-none"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Reject</p>
                                        <div className="w-16 text-center bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl py-2 text-sm font-black text-rose-700 dark:text-rose-400">
                                            {item.rejected}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Vehicle Details */}
                        {item.vehicles.length > 0 && (
                            <div className="p-6 space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Vehicle Details ({item.vehicles.length})
                                </p>
                                {item.vehicles.map((veh, vehIdx) => (
                                    <div
                                        key={vehIdx}
                                        className="bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4"
                                    >
                                        <p className="text-[9px] font-black text-indigo-500 uppercase mb-3">
                                            Unit {vehIdx + 1}
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                                                    Chassis No *
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="MBLHAA..."
                                                    value={veh.chassis_number}
                                                    onChange={e =>
                                                        updateVehicle(
                                                            itemIdx,
                                                            vehIdx,
                                                            'chassis_number',
                                                            e.target.value.toUpperCase()
                                                        )
                                                    }
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                                                    Engine No *
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="HA4EA..."
                                                    value={veh.engine_number}
                                                    onChange={e =>
                                                        updateVehicle(
                                                            itemIdx,
                                                            vehIdx,
                                                            'engine_number',
                                                            e.target.value.toUpperCase()
                                                        )
                                                    }
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                                                    Key No
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Optional"
                                                    value={veh.key_number}
                                                    onChange={e =>
                                                        updateVehicle(
                                                            itemIdx,
                                                            vehIdx,
                                                            'key_number',
                                                            e.target.value.toUpperCase()
                                                        )
                                                    }
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                                                    Mfg. Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={veh.manufacturing_date}
                                                    onChange={e =>
                                                        updateVehicle(
                                                            itemIdx,
                                                            vehIdx,
                                                            'manufacturing_date',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-[11px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Summary + Submit */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">GRN Summary</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            Accepting: {grnItems.reduce((s, i) => s + i.accepted, 0)} units · Rejecting:{' '}
                            {grnItems.reduce((s, i) => s + i.rejected, 0)} units
                        </p>
                    </div>
                    {grnItems.reduce((s, i) => s + i.rejected, 0) > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                            <AlertTriangle size={12} /> Rejected units will not be posted to stock
                        </span>
                    )}
                </div>

                <button
                    onClick={handleSubmitAndConfirm}
                    disabled={submitting || grnItems.every(i => i.accepted === 0)}
                    className="w-full py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Processing GRN...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={20} />
                            Confirm GRN & Post Stock
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
