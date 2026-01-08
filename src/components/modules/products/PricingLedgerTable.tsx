'use client';

import React, { useState, useMemo } from 'react';
import { Landmark, Sparkles, TrendingUp, Info, Save, CheckCircle2, Car } from 'lucide-react';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';
import { RegistrationRule } from '@/types/registration';
import { VehicleModel, ModelColor, ModelVariant } from '@/types/productMaster';

interface SKUPriceRow {
    id: string;
    brand: string;
    model: string;
    variant: string;
    color: string;
    engineCc: string | number;
    exShowroom: number;
    hsnCode?: string;
    gstRate?: number;
}

interface PricingLedgerTableProps {
    initialSkus: SKUPriceRow[];
    activeRule: RegistrationRule | null;
    onUpdatePrice: (skuId: string, price: number) => void;
    onSaveAll?: () => void;
    // New Filter Props
    states: RegistrationRule[];
    selectedStateId: string;
    onStateChange: (id: string) => void;
    brands: string[];
    selectedBrand: string;
    onBrandChange: (brand: string) => void;
}

export default function PricingLedgerTable({
    initialSkus,
    activeRule,
    onUpdatePrice,
    onSaveAll,
    states,
    selectedStateId,
    onStateChange,
    brands,
    selectedBrand,
    onBrandChange
}: PricingLedgerTableProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        if (onSaveAll) await onSaveAll();
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in duration-700">
            {/* Filter Toolbar (Replacing Search Bar) */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* State Selector */}
                    <div className="flex flex-col">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">State</label>
                        <select
                            value={selectedStateId}
                            onChange={(e) => onStateChange(e.target.value)}
                            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer min-w-[100px]"
                        >
                            {states.map(s => (
                                <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">{s.stateCode || s.ruleName.split(' ')[0]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Brand Selector */}
                    <div className="flex flex-col">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Focus Entity</label>
                        <select
                            value={selectedBrand}
                            onChange={(e) => onBrandChange(e.target.value)}
                            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer min-w-[150px]"
                        >
                            <option value="ALL">ALL BRANDS</option>
                            {brands.map(b => (
                                <option key={b} value={b} className="bg-white dark:bg-slate-900">{b.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 self-end h-full">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl active:scale-95 ${showSuccess
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                            }`}
                    >
                        {showSuccess ? (
                            <>
                                <CheckCircle2 size={16} /> Data Preserved
                            </>
                        ) : (
                            <>
                                <Save size={16} /> {isSaving ? 'Processing...' : 'Save Changes'}
                            </>
                        )}
                    </button>
                    <div className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                        <TrendingUp size={14} /> Integrity Verified
                    </div>
                </div>
            </div>

            {/* High-Density Ledger Table */}
            <div className="flex-1 bg-white dark:bg-slate-950/80 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden flex flex-col">
                <div className="overflow-auto scrollbar-thin flex-1">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-5 w-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-white/10 pl-8">#</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10">Vehicle Profile (SKU)</th>
                                <th className="px-6 py-5 text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 bg-blue-500/5">Ex-Showroom</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10">RTO (State)</th>
                                <th className="px-6 py-5 text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 bg-amber-500/5">Insurance</th>
                                <th className="px-8 py-5 text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 text-right">On-Road price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {initialSkus.map((sku, skuIdx) => {
                                const calcs = activeRule
                                    ? calculateOnRoad(sku.exShowroom, sku.engineCc, activeRule)
                                    : null;

                                const gstRate = sku.gstRate || 28;
                                const basePrice = sku.exShowroom / (1 + gstRate / 100);
                                const totalGst = sku.exShowroom - basePrice;
                                const cgst = totalGst / 2;
                                const sgst = totalGst / 2;

                                return (
                                    <tr key={sku.id} className="group hover:bg-blue-600/5 transition-colors">
                                        <td className="px-6 py-4 pl-8 text-[10px] font-mono font-bold text-slate-500 group-hover:text-indigo-500 transition-colors">
                                            {(skuIdx + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center p-1.5 shadow-sm border border-slate-100 dark:border-white/10 transition-transform group-hover:scale-110">
                                                    <Car size={16} className="text-slate-700 dark:text-slate-300" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-[12px] text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors uppercase tracking-tight italic">
                                                        {sku.brand} {sku.model}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                                                        {sku.variant} • {sku.color} • {sku.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group/input">
                                                <input
                                                    type="number"
                                                    value={sku.exShowroom}
                                                    onChange={(e) => onUpdatePrice(sku.id, Number(e.target.value))}
                                                    className="w-32 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-right"
                                                />
                                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within/input:text-blue-500">₹</div>

                                                {/* Reverse GST Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 border border-white/10 rounded-xl text-[9px] font-bold text-white uppercase tracking-wider hidden group-hover/input:block z-50 pointer-events-none shadow-2xl">
                                                    <div className="flex justify-between items-center mb-1 pb-1 border-b border-white/5">
                                                        <span className="text-slate-400">Ex-Showroom (Incl.)</span>
                                                        <span className="text-blue-400 font-black">₹{sku.exShowroom.toLocaleString()}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-500 italic">Base Price</span>
                                                            <span className="text-slate-200">₹{Math.round(basePrice).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-500 italic text-[8px]">CGST ({gstRate / 2}%)</span>
                                                            <span className="text-slate-400">₹{Math.round(cgst).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-500 italic text-[8px]">SGST ({gstRate / 2}%)</span>
                                                            <span className="text-slate-400">₹{Math.round(sgst).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[7px] text-slate-500 text-center uppercase tracking-tighter">
                                                        Auto Reverse Calculated from {gstRate}% GST
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 group/cell relative">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-xs text-slate-600 dark:text-slate-400 italic">₹{calcs?.rtoState.total.toLocaleString() || '--'}</span>
                                                {calcs && (
                                                    <div className="relative group/tip">
                                                        <Info size={10} className="text-slate-400 cursor-help opacity-50 group-hover/cell:opacity-100 transition-opacity" />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 border border-white/10 rounded-xl text-[9px] font-bold text-white uppercase tracking-wider hidden group-hover/tip:block z-50 pointer-events-none shadow-2xl">
                                                            <div className="space-y-1.5">
                                                                {calcs.rtoState.items.map((item: any, idx: number) => (
                                                                    <div key={idx} className="flex flex-col gap-0.5 border-b border-white/5 pb-1.5 last:border-0 mb-1.5">
                                                                        <div className="flex justify-between items-center gap-4">
                                                                            <span className="text-slate-400 whitespace-nowrap">{item.label}</span>
                                                                            <span className="text-blue-400 italic font-black">₹{item.amount.toLocaleString()}</span>
                                                                        </div>
                                                                        {item.detail && <span className="text-[7px] text-slate-500 tracking-tighter normal-case font-medium">{item.detail}</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 bg-amber-500/[0.02] group/cell relative">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-xs text-amber-600 dark:text-amber-400 italic">₹{calcs?.insuranceComp.total.toLocaleString() || '--'}</span>
                                                {calcs && (
                                                    <div className="relative group/tip">
                                                        <Info size={10} className="text-amber-400 cursor-help opacity-50 group-hover/cell:opacity-100 transition-opacity" />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 border border-white/10 rounded-xl text-[9px] font-bold text-white uppercase tracking-wider hidden group-hover/tip:block z-50 pointer-events-none shadow-2xl">
                                                            <div className="space-y-1.5">
                                                                {calcs.insuranceComp.items.map((item: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center gap-4">
                                                                        <span className="text-slate-400 whitespace-nowrap">{item.label}</span>
                                                                        <span className="text-amber-400 italic">₹{item.amount.toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 italic tracking-tighter">₹{calcs?.onRoadTotal.toLocaleString() || '--'}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Insight */}
                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-400">
                        <Info size={16} />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">
                            All statutory charges are auto-calculated based on {activeRule?.ruleName || 'unclassified'} regulatory rules.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
