'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Loader2,
    CheckCircle2,
    Truck,
    Building2,
    Hash,
    ShieldCheck,
    ArrowRight,
    ShoppingBag,
    Package,
    User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tenantId: string;
}

interface POItem {
    id: string;
    sku_id: string;
    ordered_qty: number;
    received_qty: number;
    vehicle_colors: {
        name: string;
        vehicle_variants: {
            name: string;
            vehicle_models: {
                name: string;
                brands: { name: string };
            };
        };
    };
}

interface UnitDetail {
    sku_id: string;
    chassis: string;
    engine: string;
    requisition_id: string; // Associated customer demand
}

export default function InwardStockModal({ isOpen, onClose, onSuccess, tenantId }: ModalProps) {
    const supabase = createClient();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetchingPOs, setFetchingPOs] = useState(false);

    // Data
    const [activePOs, setActivePOs] = useState<any[]>([]);
    const [selectedPO, setSelectedPO] = useState<any | null>(null);
    const [unitDetails, setUnitDetails] = useState<UnitDetail[]>([]);
    const [skuRequisitions, setSkuRequisitions] = useState<Record<string, any[]>>({});

    useEffect(() => {
        if (isOpen) {
            fetchActivePOs();
            setStep(1);
            setSelectedPO(null);
            setUnitDetails([]);
        }
    }, [isOpen]);

    const fetchActivePOs = async () => {
        setFetchingPOs(true);
        try {
            const { data, error } = await (supabase as any)
                .from('purchase_orders')
                .select(
                    `
                    *,
                    items:purchase_order_items (
                        *,
                        vehicle_colors (
                            id,
                            name,
                            vehicle_variants (
                                id,
                                name,
                                vehicle_models (
                                    id,
                                    name,
                                    brands (name)
                                )
                            )
                        )
                    )
                `
                )
                .in('status', ['ORDERED', 'PARTIALLY_RECEIVED'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setActivePOs(data || []);
        } catch (err) {
            console.error('Error fetching POs:', err);
        } finally {
            setFetchingPOs(false);
        }
    };

    const handlePOSelect = async (po: any) => {
        setLoading(true);
        setSelectedPO(po);

        // Fetch pending requisitions for these SKUs to allow allocation
        const skuIds = po.items.map((i: any) => i.sku_id);
        const { data: reqs } = await (supabase as any)
            .from('purchase_requisitions')
            .select(
                `
                *,
                items:purchase_requisition_items!inner(*)
            `
            )
            .in('items.sku_id', skuIds)
            .eq('status', 'CONVERTED');

        const reqMap: Record<string, any[]> = {};
        (reqs as any[] | null)?.forEach(r => {
            r.items.forEach((item: any) => {
                if (!reqMap[item.sku_id]) reqMap[item.sku_id] = [];
                // Add one entry per quantity ordered
                for (let i = 0; i < item.quantity; i++) {
                    reqMap[item.sku_id].push({
                        ...r,
                        item_id: item.id,
                    });
                }
            });
        });
        setSkuRequisitions(reqMap);

        // Prepare unit entry fields for each unit in the PO that isn't yet received
        const details: UnitDetail[] = [];
        po.items.forEach((item: any) => {
            const remaining = item.ordered_qty - (item.received_qty || 0);
            for (let i = 0; i < remaining; i++) {
                details.push({
                    sku_id: item.sku_id,
                    chassis: '',
                    engine: '',
                    requisition_id: '',
                });
            }
        });

        setUnitDetails(details);
        setLoading(false);
        setStep(2);
    };

    const updateUnitDetail = (index: number, field: keyof UnitDetail, value: string) => {
        const next = [...unitDetails];
        next[index] = { ...next[index], [field]: field === 'requisition_id' ? value : value.toUpperCase() };
        setUnitDetails(next);
    };

    const handleSubmit = async () => {
        if (!tenantId || !selectedPO) return;

        // Validation: All chassis numbers must be present
        if (unitDetails.some(u => !u.chassis || !u.engine)) {
            alert('Please fill Chassis and Engine numbers for all units.');
            return;
        }

        setLoading(true);
        try {
            // 1. Insert into vehicle_inventory
            const inventoryEntries = unitDetails.map(u => ({
                current_owner_id: tenantId,
                sku_id: u.sku_id,
                chassis_number: u.chassis,
                engine_number: u.engine,
                status: u.requisition_id ? 'BOOKED' : 'AVAILABLE',
                allocated_to_requisition_id: u.requisition_id || null,
            }));

            const { data: insertedItems, error: invErr } = await (supabase as any)
                .from('vehicle_inventory')
                .insert(inventoryEntries)
                .select();

            if (invErr) throw invErr;

            // 2. Create Ledger Entries
            const ledgerEntries = (insertedItems as any[]).map(item => ({
                inventory_id: item.id,
                transaction_type: 'INWARD',
                from_status: null,
                to_status: 'AVAILABLE',
                reference_id: selectedPO.id,
                reference_type: 'PURCHASE_ORDER',
                notes: `Inwarded from PO ${selectedPO.order_number}`,
            }));

            const { error: ledgerErr } = await (supabase as any).from('inventory_ledger').insert(ledgerEntries);
            if (ledgerErr) throw ledgerErr;

            // 3. Update PO Items received_qty
            for (const item of selectedPO.items) {
                const inwardedForThisSKU = unitDetails.filter(u => u.sku_id === item.sku_id).length;
                const newQty = (item.received_qty || 0) + inwardedForThisSKU;

                const { error: poItemErr } = await (supabase as any)
                    .from('purchase_order_items')
                    .update({ received_qty: newQty })
                    .eq('id', item.id);

                if (poItemErr) throw poItemErr;
            }

            // 4. Update PO Status to COMPLETED
            const { error: poStatusErr } = await (supabase as any)
                .from('purchase_orders')
                .update({ status: 'COMPLETED' })
                .eq('id', selectedPO.id);

            if (poStatusErr) throw poStatusErr;

            onSuccess();
            onClose();
        } catch (err) {
            console.error('GRN Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-white/5 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                            <ArrowRight size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                Goods Received Note (GRN)
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Record physical asset identification
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

                <div className="flex-1 overflow-y-auto p-8 scrollbar-none">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <ShoppingBag size={16} className="text-indigo-500" />
                                Select Active Purchase Order
                            </h3>

                            {fetchingPOs ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <Loader2 className="animate-spin text-emerald-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Scanning Active POs...
                                    </span>
                                </div>
                            ) : activePOs.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                        No Active Orders found to inward.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activePOs.map(po => (
                                        <button
                                            key={po.id}
                                            onClick={() => handlePOSelect(po)}
                                            className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-3xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                                    #{po.order_number}
                                                </span>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase">
                                                    {po.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 mb-4">
                                                <Building2 size={12} />
                                                <span className="text-[10px] font-bold uppercase">
                                                    {po.vendor_name}
                                                </span>
                                            </div>
                                            <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {po.items.reduce((sum: number, i: any) => sum + i.ordered_qty, 0)}{' '}
                                                    Units to inward
                                                </span>
                                                <ArrowRight
                                                    className="text-slate-300 group-hover:text-emerald-500 transition-all"
                                                    size={16}
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <Hash size={16} className="text-emerald-500" />
                                    Record Unit Identifiers
                                </h3>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-[10px] font-black text-indigo-500 uppercase hover:underline"
                                >
                                    Change PO
                                </button>
                            </div>

                            <div className="space-y-4">
                                {unitDetails.map((unit, idx) => {
                                    const sku = selectedPO.items.find((i: any) => i.sku_id === unit.sku_id);
                                    return (
                                        <div
                                            key={idx}
                                            className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl space-y-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                                        UNIT #{idx + 1} •{' '}
                                                        {sku?.vehicle_colors.vehicle_variants.vehicle_models.name}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                                                        {sku?.vehicle_colors.vehicle_variants.name} •{' '}
                                                        {sku?.vehicle_colors.name}
                                                    </p>
                                                </div>
                                                <Package className="text-slate-200" size={20} />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">
                                                        Chassis Number
                                                    </label>
                                                    <div className="relative">
                                                        <Hash
                                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                                                            size={14}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="EX: MBH230..."
                                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase tracking-widest"
                                                            value={unit.chassis}
                                                            onChange={e =>
                                                                updateUnitDetail(idx, 'chassis', e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">
                                                        Engine Number
                                                    </label>
                                                    <div className="relative">
                                                        <ShieldCheck
                                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                                                            size={14}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="EX: EN761..."
                                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase tracking-widest"
                                                            value={unit.engine}
                                                            onChange={e =>
                                                                updateUnitDetail(idx, 'engine', e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 flex items-center gap-1.5">
                                                    <User size={10} className="text-amber-500" /> Allocate to Customer
                                                    (Optional)
                                                </label>
                                                <select
                                                    className="w-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl py-3 px-4 text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 uppercase tracking-widest"
                                                    value={unit.requisition_id}
                                                    onChange={e =>
                                                        updateUnitDetail(idx, 'requisition_id', e.target.value)
                                                    }
                                                >
                                                    <option value="">Generic Stock (Available for anyone)</option>
                                                    {(skuRequisitions[unit.sku_id] || []).map((req, ridx) => (
                                                        <option key={`${req.id}-${ridx}`} value={req.id}>
                                                            {req.customer_name || 'Unnamed Customer'} (REQ-
                                                            {req.id.slice(0, 5)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-5 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all flex items-center justify-center underline decoration-slate-200 underline-offset-4"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || step === 1 || unitDetails.some(u => !u.chassis || !u.engine)}
                        className="flex-[2] px-8 py-5 rounded-[2rem] bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3 italic"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        {loading ? 'Auditing stock...' : 'Confirm Inwarding'}
                    </button>
                </div>
            </div>
        </div>
    );
}
