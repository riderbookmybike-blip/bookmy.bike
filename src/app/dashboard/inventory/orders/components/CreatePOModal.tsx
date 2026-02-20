'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, CheckCircle2, Truck, Building2, Calendar, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createPurchaseOrder } from '@/actions/inventory';
import { toast } from 'sonner';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tenantId: string;
}

interface ReqItem {
    id: string;
    sku_id: string;
    quantity: number;
    notes: string | null;
    status: string;
    requisition_id: string;
    inv_requisitions: {
        id: string;
        customer_name: string | null;
        status: string;
        created_at: string;
    };
    // Selected quote for unit_cost
    selected_quote?: {
        landed_cost: number;
    } | null;
}

export default function CreatePOModal({ isOpen, onClose, onSuccess, tenantId }: ModalProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [fetchingReqs, setFetchingReqs] = useState(false);

    // Data
    const [requisitions, setRequisitions] = useState<ReqItem[]>([]);
    const [skuNames, setSkuNames] = useState<Record<string, string>>({});
    const [selectedReqItems, setSelectedReqItems] = useState<Set<string>>(new Set());

    // Form State
    const [vendorName, setVendorName] = useState('');
    const [transporterName, setTransporterName] = useState('');
    const [docketNumber, setDocketNumber] = useState('');
    const [expectedDate, setExpectedDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchPendingRequisitions();
        }
    }, [isOpen]);

    const fetchPendingRequisitions = async () => {
        setFetchingReqs(true);
        try {
            // Fetch SUBMITTED requisition items — no broken vehicle_colors join
            const { data, error } = await (supabase as any)
                .from('inv_requisition_items')
                .select(
                    `
                    id, sku_id, quantity, notes, status, requisition_id,
                    inv_requisitions!inner (
                        id, customer_name, status, created_at
                    )
                `
                )
                .eq('inv_requisitions.status', 'SUBMITTED')
                .eq('status', 'OPEN');

            if (error) throw error;

            const items: ReqItem[] = data || [];
            setRequisitions(items);

            // Resolve SKU names
            const skuIds = items.map(i => i.sku_id).filter(Boolean);
            if (skuIds.length) {
                const { data: skus } = await supabase.from('cat_skus').select('id, sku_code').in('id', skuIds);
                if (skus) {
                    const map: Record<string, string> = {};
                    skus.forEach((s: any) => (map[s.id] = s.sku_code || s.id.slice(0, 8)));
                    setSkuNames(map);
                }
            }

            // Fetch selected procurement quotes for unit_cost
            for (const item of items) {
                const { data: quote } = await (supabase as any)
                    .from('inv_procurement_quotes')
                    .select('landed_cost')
                    .eq('requisition_item_id', item.id)
                    .eq('status', 'SELECTED')
                    .maybeSingle();
                item.selected_quote = quote || null;
            }
            setRequisitions([...items]);
        } catch (err) {
            console.error('Error fetching reqs:', err);
        } finally {
            setFetchingReqs(false);
        }
    };

    const toggleReqItem = (id: string) => {
        const next = new Set(selectedReqItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedReqItems(next);
    };

    const handleSubmit = async () => {
        if (!tenantId || selectedReqItems.size === 0) return;
        setLoading(true);

        try {
            const selectedData = requisitions.filter(r => selectedReqItems.has(r.id));

            // Group by requisition — use the first requisition's ID
            const reqIds = Array.from(new Set(selectedData.map(r => r.requisition_id)));

            const result = await createPurchaseOrder({
                tenant_id: tenantId,
                requisition_id: reqIds[0] || undefined,
                vendor_name: vendorName,
                transporter_name: transporterName || undefined,
                docket_number: docketNumber || undefined,
                expected_date: expectedDate || undefined,
                items: selectedData.map(item => ({
                    sku_id: item.sku_id,
                    ordered_qty: item.quantity,
                    unit_cost: item.selected_quote?.landed_cost,
                    requisition_item_id: item.id,
                })),
            });

            if (result.success) {
                toast.success(`Purchase Order ${result.data?.order_number} created`);
                onSuccess();
                onClose();
                // Reset
                setSelectedReqItems(new Set());
                setVendorName('');
                setTransporterName('');
                setDocketNumber('');
                setExpectedDate('');
            } else {
                toast.error(result.message || 'Failed to create PO');
            }
        } catch (err) {
            console.error('PO Creation Error:', err);
            toast.error('Failed to create PO');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedData = requisitions.filter(r => selectedReqItems.has(r.id));
    const totalUnits = selectedData.reduce((sum, r) => sum + r.quantity, 0);
    const totalCost = selectedData.reduce((sum, r) => sum + (r.selected_quote?.landed_cost || 0) * r.quantity, 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-white/5 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                Initiate Purchase Order
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Create PO from pending requisition items
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Side: Select Requisition Items */}
                    <div className="flex-1 overflow-y-auto p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/1 scrollbar-none">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Package size={16} className="text-purple-500" />
                                1. Select Demand Items
                            </h3>
                            <span className="text-[10px] font-black text-indigo-500 uppercase">
                                {selectedReqItems.size} Selected
                            </span>
                        </div>

                        {fetchingReqs ? (
                            <div className="py-12 flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Scanning Demand...
                                </span>
                            </div>
                        ) : requisitions.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed font-black">
                                    No Pending Requisitions Found
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {requisitions.map(req => {
                                    const isSelected = selectedReqItems.has(req.id);
                                    return (
                                        <button
                                            key={req.id}
                                            onClick={() => toggleReqItem(req.id)}
                                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group
                                                ${
                                                    isSelected
                                                        ? 'bg-indigo-600 border-transparent shadow-lg shadow-indigo-500/20'
                                                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-white/70' : 'text-slate-400'}`}
                                                    >
                                                        REQ-{req.inv_requisitions.id.slice(0, 8).toUpperCase()}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
                                                    >
                                                        {req.inv_requisitions.customer_name || 'Generic'}
                                                    </span>
                                                </div>
                                                <h4
                                                    className={`text-[11px] font-black uppercase truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}
                                                >
                                                    {skuNames[req.sku_id] || req.sku_id.slice(0, 12) + '...'}
                                                </h4>
                                                {req.selected_quote && (
                                                    <p
                                                        className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-white/60' : 'text-emerald-500'}`}
                                                    >
                                                        ₹{req.selected_quote.landed_cost.toLocaleString()} / unit
                                                    </p>
                                                )}
                                            </div>
                                            <div
                                                className={`text-right ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}
                                            >
                                                <span className="text-sm font-black italic">x{req.quantity}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Side: PO Details */}
                    <div className="flex-1 p-8 overflow-y-auto scrollbar-none">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-8">
                            <Truck size={16} className="text-indigo-500" />
                            2. Supply & Logistics Info
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                    <Building2 size={12} className="text-indigo-500" /> Vendor Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="EX: TVS MOTOR COMPANY..."
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase tracking-widest"
                                    value={vendorName}
                                    onChange={e => setVendorName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                        Transporter
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="EX: SAFEXPRESS..."
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase tracking-widest"
                                        value={transporterName}
                                        onChange={e => setTransporterName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                        LR / Docket No
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="EX: 876251..."
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase tracking-widest"
                                        value={docketNumber}
                                        onChange={e => setDocketNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                    <Calendar size={12} className="text-indigo-500" /> Expected arrival
                                </label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase tracking-widest"
                                    value={expectedDate}
                                    onChange={e => setExpectedDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Summary Block */}
                        <div className="mt-12 p-6 bg-slate-50 dark:bg-white/2 rounded-3xl border border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Total Units
                                </span>
                                <span className="text-xl font-black text-slate-900 dark:text-white italic">
                                    {totalUnits} Units
                                </span>
                            </div>
                            {totalCost > 0 && (
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Est. Landed Cost
                                    </span>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                        ₹{totalCost.toLocaleString()}
                                    </span>
                                </div>
                            )}
                            <p className="text-[10px] font-bold text-slate-500 uppercase leading-snug tracking-tighter">
                                By converting these requisitions, stock will be marked as{' '}
                                <span className="text-indigo-500">ORDERED</span> in your inventory.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-5 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all flex items-center justify-center"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || selectedReqItems.size === 0 || !vendorName}
                        className="flex-[2] px-8 py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3 italic"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        {loading ? 'Processing Orders...' : 'Convert to Purchase Order'}
                    </button>
                </div>
            </div>
        </div>
    );
}
