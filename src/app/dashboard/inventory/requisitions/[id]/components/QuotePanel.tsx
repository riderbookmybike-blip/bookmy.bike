'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Check, DollarSign, Truck, Clock, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { createProcurementQuote, selectProcurementQuote, getSupplierTenants } from '@/actions/inventory';
import { toast } from 'sonner';

interface Quote {
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
}

interface RequisitionItem {
    id: string;
    sku_id: string;
    quantity: number;
    notes: string | null;
    status: string;
    quotes: Quote[];
}

interface QuotePanelProps {
    item: RequisitionItem;
    tenantId: string;
    onRefresh: () => void;
}

export default function QuotePanel({ item, tenantId, onRefresh }: QuotePanelProps) {
    const [expanded, setExpanded] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [selectionReason, setSelectionReason] = useState('');
    const [showReasonInput, setShowReasonInput] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        supplier_id: '',
        unit_cost: 0,
        tax_amount: 0,
        freight_amount: 0,
        lead_time_days: 0,
        valid_till: '',
    });

    const sortedQuotes = [...(item.quotes || [])].sort((a, b) => (a.landed_cost || 0) - (b.landed_cost || 0));
    const cheapestId = sortedQuotes.length > 0 ? sortedQuotes[0].id : null;
    const selectedQuote = sortedQuotes.find(q => q.status === 'SELECTED');

    useEffect(() => {
        if (expanded && suppliers.length === 0) {
            loadSuppliers();
        }
    }, [expanded, suppliers.length]);

    const loadSuppliers = async () => {
        const result = await getSupplierTenants();
        setSuppliers(result);
    };

    const computedLandedCost = (formData.unit_cost || 0) + (formData.tax_amount || 0) + (formData.freight_amount || 0);

    const handleAddQuote = async () => {
        if (!formData.supplier_id) {
            toast.error('Please select a supplier');
            return;
        }
        if (formData.unit_cost <= 0) {
            toast.error('Unit cost must be greater than 0');
            return;
        }

        setLoading(true);
        const result = await createProcurementQuote(
            {
                requisition_item_id: item.id,
                supplier_id: formData.supplier_id,
                unit_cost: formData.unit_cost,
                tax_amount: formData.tax_amount,
                freight_amount: formData.freight_amount,
                lead_time_days: formData.lead_time_days || undefined,
                valid_till: formData.valid_till || undefined,
            },
            tenantId
        );

        if (result.success) {
            toast.success('Quote added');
            setShowAddForm(false);
            setFormData({
                supplier_id: '',
                unit_cost: 0,
                tax_amount: 0,
                freight_amount: 0,
                lead_time_days: 0,
                valid_till: '',
            });
            onRefresh();
        } else {
            toast.error(result.message || 'Failed to add quote');
        }
        setLoading(false);
    };

    const handleSelectQuote = async (quoteId: string) => {
        // If not cheapest, need reason
        if (quoteId !== cheapestId && !selectionReason) {
            setShowReasonInput(quoteId);
            return;
        }

        setSelectingId(quoteId);
        const result = await selectProcurementQuote(quoteId, quoteId !== cheapestId ? selectionReason : undefined);

        if (result.success) {
            toast.success('Quote selected');
            setShowReasonInput(null);
            setSelectionReason('');
            onRefresh();
        } else {
            toast.error(result.message || 'Failed to select quote');
        }
        setSelectingId(null);
    };

    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || id.slice(0, 8) + '...';

    return (
        <div className="mt-3 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            {/* Toggle Bar */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                        Procurement Quotes ({item.quotes?.length || 0})
                    </span>
                    {selectedQuote && (
                        <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black rounded-full border border-emerald-200 dark:border-emerald-500/20 uppercase">
                            1 Selected
                        </span>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp size={16} className="text-slate-400" />
                ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                )}
            </button>

            {expanded && (
                <div className="p-4 space-y-4">
                    {/* Existing Quotes Comparison */}
                    {sortedQuotes.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="px-3 py-2 text-left text-[9px] font-black text-slate-400 uppercase">
                                            Supplier
                                        </th>
                                        <th className="px-3 py-2 text-right text-[9px] font-black text-slate-400 uppercase">
                                            Unit
                                        </th>
                                        <th className="px-3 py-2 text-right text-[9px] font-black text-slate-400 uppercase">
                                            Tax
                                        </th>
                                        <th className="px-3 py-2 text-right text-[9px] font-black text-slate-400 uppercase">
                                            Freight
                                        </th>
                                        <th className="px-3 py-2 text-right text-[9px] font-black text-slate-400 uppercase">
                                            Landed
                                        </th>
                                        <th className="px-3 py-2 text-center text-[9px] font-black text-slate-400 uppercase">
                                            Lead
                                        </th>
                                        <th className="px-3 py-2 text-center text-[9px] font-black text-slate-400 uppercase">
                                            Status
                                        </th>
                                        <th className="px-3 py-2 text-right text-[9px] font-black text-slate-400 uppercase">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedQuotes.map((q, idx) => (
                                        <tr
                                            key={q.id}
                                            className={`border-b border-slate-50 dark:border-white/[.03] ${
                                                q.status === 'SELECTED' ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''
                                            }`}
                                        >
                                            <td className="px-3 py-2.5">
                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">
                                                    {getSupplierName(q.supplier_id)}
                                                </span>
                                                {idx === 0 && (
                                                    <span className="ml-1 text-[8px] font-black text-emerald-500">
                                                        ★ BEST
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                ₹{q.unit_cost?.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-slate-500">
                                                ₹{q.tax_amount?.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-slate-500">
                                                ₹{q.freight_amount?.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-black text-slate-900 dark:text-white">
                                                ₹{q.landed_cost?.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2.5 text-center text-slate-500">
                                                {q.lead_time_days ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Truck size={10} /> {q.lead_time_days}d
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase ${
                                                        q.status === 'SELECTED'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                                    }`}
                                                >
                                                    {q.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                {q.status !== 'SELECTED' && (
                                                    <button
                                                        onClick={() => handleSelectQuote(q.id)}
                                                        disabled={selectingId === q.id}
                                                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-100 transition-all disabled:opacity-50"
                                                    >
                                                        {selectingId === q.id ? (
                                                            <Loader2 size={10} className="animate-spin" />
                                                        ) : (
                                                            <Check size={10} />
                                                        )}{' '}
                                                        Select
                                                    </button>
                                                )}
                                                {q.selection_reason && (
                                                    <p className="text-[8px] text-slate-400 mt-1 italic max-w-[120px]">
                                                        {q.selection_reason}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Selection Reason Input (when selecting non-cheapest) */}
                    {showReasonInput && (
                        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                            <AlertCircle size={16} className="text-amber-500 shrink-0" />
                            <input
                                type="text"
                                placeholder="REASON FOR OVERRIDING CHEAPEST QUOTE..."
                                className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none uppercase tracking-widest placeholder:text-amber-400/50"
                                value={selectionReason}
                                onChange={e => setSelectionReason(e.target.value)}
                                onKeyDown={e =>
                                    e.key === 'Enter' && selectionReason && handleSelectQuote(showReasonInput)
                                }
                            />
                            <button
                                onClick={() => handleSelectQuote(showReasonInput)}
                                disabled={!selectionReason}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase disabled:opacity-40"
                            >
                                Confirm
                            </button>
                        </div>
                    )}

                    {/* Add Quote Form */}
                    {showAddForm ? (
                        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-white/5">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="md:col-span-3">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">
                                        Supplier
                                    </label>
                                    <select
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.supplier_id}
                                        onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                                    >
                                        <option value="">— Select Supplier —</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">
                                        Unit Cost (₹)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.unit_cost || ''}
                                        onChange={e => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">
                                        Tax (₹)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.tax_amount || ''}
                                        onChange={e => setFormData({ ...formData, tax_amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">
                                        Freight (₹)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.freight_amount || ''}
                                        onChange={e =>
                                            setFormData({ ...formData, freight_amount: Number(e.target.value) })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">
                                        Lead Time (Days)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.lead_time_days || ''}
                                        onChange={e =>
                                            setFormData({ ...formData, lead_time_days: Number(e.target.value) })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-2">
                                        Valid Till
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.valid_till}
                                        onChange={e => setFormData({ ...formData, valid_till: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Landed Cost Preview */}
                            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                    Landed Cost
                                </span>
                                <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                                    ₹{computedLandedCost.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddQuote}
                                    disabled={loading || !formData.supplier_id || formData.unit_cost <= 0}
                                    className="flex-[2] px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Add Quote
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all"
                        >
                            <Plus size={14} /> Add Supplier Quote
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
