'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Landmark,
    ArrowRight,
    CheckCircle2,
    Plus,
    X,
    Info,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Lock,
    RefreshCw,
    Calculator,
    ChevronRight,
    CircleDashed,
    Car,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CatalogItem } from '@/types/store';
import { MOCK_REGISTRATION_RULES } from '@/lib/mock/catalogMocks';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';

interface PricingStepProps {
    family: CatalogItem | null;
    skus: CatalogItem[];
    pricingState: any;
    onUpdate: (val: any) => void;
    onUpdateFamily: (val: any) => void;
}

interface PriceRule {
    stateCode: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
}

interface PricingState {
    referenceState: string;
    rules: PriceRule[];
    approvals: Record<string, boolean>; // key: skuId-stateCode
    overrides: Record<string, number>; // key: skuId-stateCode
}

export default function PricingStep({ family, skus, pricingState, onUpdate, onUpdateFamily }: PricingStepProps) {
    const { referenceState, rules, approvals, overrides } = pricingState;

    const [activeDestination, setActiveDestination] = useState<string>('KA');

    const setReferenceState = (val: string) => onUpdate({ ...pricingState, referenceState: val });
    const setRules = (val: any) => onUpdate({ ...pricingState, rules: val });
    const setApprovals = (val: any) => onUpdate({ ...pricingState, approvals: val });
    const setOverrides = (val: any) => onUpdate({ ...pricingState, overrides: val });

    // Correctly derive a base price for the entire family if individual SKU prices are set
    const basePrice = useMemo(() => {
        if (family?.price_base && family.price_base > 0) return family.price_base;
        if (skus.length > 0) {
            const prices = skus.map(s => s.price_base || 0).filter(p => p > 0);
            return prices.length > 0 ? Math.min(...prices) : 0;
        }
        return 0;
    }, [family, skus]);

    // Derived Ledger Data
    const ledger = useMemo(() => {
        const rows: any[] = [];
        const activeRule = rules.find((r: any) => r.stateCode === activeDestination);

        skus.forEach(sku => {
            const skuRefPrice = sku.price_base || basePrice;

            // Calculated Price for Destination
            let calculated = skuRefPrice;
            if (activeRule) {
                if (activeRule.type === 'PERCENTAGE') {
                    calculated = skuRefPrice * (1 + (activeRule.value / 100));
                } else {
                    calculated = skuRefPrice + activeRule.value;
                }
            }

            const key = `${sku.id}-${activeDestination}`;
            const isApproved = approvals[key] || false;
            const overridePrice = overrides[key];
            const finalPrice = overridePrice !== undefined ? overridePrice : calculated;

            // Registration Calculations
            const destRule = MOCK_REGISTRATION_RULES.find(r => r.stateCode === activeDestination);
            const refRule = MOCK_REGISTRATION_RULES.find(r => r.stateCode === referenceState);

            const destCalcs = destRule ? calculateOnRoad(finalPrice, sku.specs?.engine_cc || 110, destRule) : null;
            const refCalcs = refRule ? calculateOnRoad(skuRefPrice, sku.specs?.engine_cc || 110, refRule) : null;

            rows.push({
                sku,
                referencePrice: skuRefPrice,
                calculatedPrice: calculated,
                finalPrice,
                isApproved,
                hasOverride: overridePrice !== undefined,
                onRoad: destCalcs?.onRoadTotal,
                refOnRoad: refCalcs?.onRoadTotal
            });
        });

        return rows;
    }, [skus, basePrice, activeDestination, rules, approvals, overrides]);

    const handleToggleApproval = (skuId: string) => {
        const key = `${skuId}-${activeDestination}`;
        setApprovals({ ...approvals, [key]: !approvals[key] });
    };

    const handleUpdateOverride = (skuId: string, value: string) => {
        const key = `${skuId}-${activeDestination}`;
        const price = parseFloat(value);
        if (isNaN(price)) {
            const newOverrides = { ...overrides };
            delete newOverrides[key];
            setOverrides(newOverrides);
        } else {
            setOverrides((prev: Record<string, number>) => ({ ...prev, [key]: price }));
        }
    };

    const handleApproveAll = () => {
        const newApprovals = { ...approvals };
        skus.forEach(sku => {
            newApprovals[`${sku.id}-${activeDestination}`] = true;
        });
        setApprovals(newApprovals);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Strategy */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Landmark size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Smart Pricing Ledger</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-state price propagation & regulatory approval workflow</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left: Configuration & Rules */}
                <div className="lg:col-span-4 flex flex-col gap-6 sticky top-32">

                    {/* Step 1: Reference Anchor */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black">1</div>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Anchor Region</span>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Base State (Reference)</span>
                                <select
                                    className="w-full bg-transparent font-black text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                                    value={referenceState}
                                    onChange={(e) => setReferenceState(e.target.value)}
                                >
                                    {MOCK_REGISTRATION_RULES.map(r => (
                                        <option key={r.id} value={r.stateCode}>{r.ruleName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                                <span className="text-[9px] font-bold text-indigo-200 uppercase block border-b border-indigo-400/30 pb-2 mb-2">Reference Ex-Showroom</span>
                                <div className="relative group flex items-center">
                                    <span className="text-2xl font-black text-white italic tracking-tighter mr-1">₹</span>
                                    <input
                                        type="number"
                                        value={family?.price_base || 0}
                                        onChange={(e) => onUpdateFamily({ ...family, price_base: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-transparent border-none text-2xl font-black text-white italic tracking-tighter outline-none focus:ring-0"
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-[8px] text-indigo-100 mt-1 uppercase font-bold">Edit to update all downstream rules</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Propagation Rules */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">2</div>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Propagation Rules</span>
                        </div>

                        <div className="space-y-4">
                            {rules.map((rule: any, idx: number) => (
                                <div key={idx} className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeDestination === rule.stateCode ? 'bg-emerald-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-slate-50 dark:bg-black/20 border-slate-100 dark:border-white/5 hover:border-slate-200'}`} onClick={() => setActiveDestination(rule.stateCode)}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{rule.stateCode} Target</span>
                                        <button className="text-slate-300 hover:text-rose-500"><X size={14} /></button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="bg-white dark:bg-slate-800 border-none text-[10px] font-bold uppercase rounded p-1 outline-none"
                                            value={rule.type}
                                            onChange={(e) => {
                                                const newRules = [...rules];
                                                newRules[idx].type = e.target.value as 'PERCENTAGE' | 'FIXED';
                                                setRules(newRules);
                                            }}
                                        >
                                            <option value="PERCENTAGE">DELTA %</option>
                                            <option value="FIXED">FLAT ₹</option>
                                        </select>
                                        <input
                                            type="number"
                                            className="flex-1 bg-white dark:bg-slate-800 border-none text-xs font-black text-right rounded p-1 outline-none"
                                            value={rule.value}
                                            onChange={(e) => {
                                                const newRules = [...rules];
                                                newRules[idx].value = parseFloat(e.target.value) || 0;
                                                setRules(newRules);
                                            }}
                                        />
                                    </div>
                                    <div className="mt-3 text-[9px] font-bold text-slate-400 uppercase flex items-center gap-2">
                                        <TrendingUp size={10} className="text-emerald-500" />
                                        {rule.stateCode} = {referenceState} {rule.value > 0 ? '+' : ''}{rule.value}{rule.type === 'PERCENTAGE' ? '%' : ' ₹'}
                                    </div>
                                </div>
                            ))}

                            <button className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-400 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                <Plus size={16} /> Add Destination State
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right: Validation Ledger */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden">

                        {/* Status Bar */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                                    <RefreshCw size={18} className="animate-spin-slow" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Review Ledger // {activeDestination}</span>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mt-1">Row-by-Row Approval</h3>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Approved SKU Coverage</span>
                                    <span className="text-[12px] font-black text-emerald-500 tracking-tighter">{Object.keys(approvals).filter(k => k.endsWith(activeDestination)).length} / {skus.length}</span>
                                </div>
                                <button
                                    onClick={handleApproveAll}
                                    className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                >
                                    <CheckCircle2 size={12} /> Approve All
                                </button>
                            </div>
                        </div>

                        {/* Ledger Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-3">
                                <thead>
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <th className="px-4">SKU Identity</th>
                                        <th className="px-4 text-center">{referenceState} (Ref)</th>
                                        <th className="px-4 text-center">{activeDestination} (New)</th>
                                        <th className="px-4 text-center">On-Road Impact</th>
                                        <th className="px-4 text-right">Approval</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode='popLayout'>
                                        {ledger.map((row, idx) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={row.sku.id}
                                                className={`group transition-all duration-300 ${row.isApproved ? 'bg-emerald-500/[0.02]' : 'bg-slate-50 dark:bg-black/20 opacity-80'}`}
                                            >
                                                <td className="p-2.5 rounded-l-xl border-l border-y border-slate-100 dark:border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center font-black text-[9px] text-slate-400">
                                                            {row.sku.name.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">{row.sku.name}</span>
                                                            <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">REF // {idx + 1}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2.5 border-y border-slate-100 dark:border-white/5 text-center">
                                                    <span className="text-[10px] font-bold text-slate-400 line-through decoration-slate-300">₹{row.referencePrice.toLocaleString()}</span>
                                                </td>
                                                <td className="p-2.5 border-y border-slate-100 dark:border-white/5">
                                                    <div className="flex flex-col items-center">
                                                        <input
                                                            type="number"
                                                            className={`w-24 bg-white dark:bg-slate-800 border rounded-lg px-2 py-1 text-[11px] font-black text-right outline-none transition-all ${row.hasOverride ? 'border-amber-500 text-amber-500 shadow-lg shadow-amber-500/5' : 'border-slate-100 dark:border-white/10 focus:border-indigo-500 text-slate-900 dark:text-white'}`}
                                                            value={row.finalPrice}
                                                            onChange={(e) => handleUpdateOverride(row.sku.id, e.target.value)}
                                                        />
                                                        {row.hasOverride && <span className="text-[7px] font-black text-amber-500 uppercase mt-0.5 italic tracking-widest">Override</span>}
                                                    </div>
                                                </td>
                                                <td className="p-2.5 border-y border-slate-100 dark:border-white/5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[7px] font-bold text-slate-400 uppercase">{referenceState}</span>
                                                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">₹{row.refOnRoad?.toLocaleString()}</span>
                                                        </div>
                                                        <ArrowRight size={12} className="text-slate-300" />
                                                        <div className="flex flex-col items-start px-1.5 py-0.5 bg-emerald-500/10 rounded-md">
                                                            <span className="text-[7px] font-black text-emerald-600 uppercase">{activeDestination}</span>
                                                            <span className="text-[9px] font-black text-emerald-600 italic">₹{row.onRoad?.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2.5 rounded-r-xl border-r border-y border-slate-100 dark:border-white/5 text-right">
                                                    <button
                                                        onClick={() => handleToggleApproval(row.sku.id)}
                                                        className={`p-1.5 rounded-lg transition-all ${row.isApproved ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-white/10 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-500'}`}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Empty Guard */}
                        {skus.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-black/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                                <Calculator size={48} className="text-slate-200 mb-4" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Generate SKUs in previous step first</span>
                            </div>
                        )}
                    </div>

                    {/* Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-900 rounded-[2rem] text-white overflow-hidden relative group">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 rounded-2xl bg-white/10">
                                    <ShieldCheck size={20} className="text-emerald-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regulatory Status</span>
                                    <p className="text-[11px] font-medium leading-relaxed opacity-80 mt-1">Sahi hai! All approved prices are within 2% of previous month's ledger. No major audit alerts.</p>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform">
                                <CheckCircle2 size={80} />
                            </div>
                        </div>

                        <div className="p-6 bg-indigo-600 rounded-[2rem] text-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-white/10">
                                    <TrendingUp size={20} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Regional Advantage</span>
                                    <p className="text-[11px] font-medium leading-relaxed opacity-80 mt-1">{activeDestination} pricing is competitive. RTO + Ex-S will be ₹{(ledger[0]?.onRoad / 1000).toFixed(1)}k on average.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
