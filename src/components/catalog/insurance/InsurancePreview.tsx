'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { InsuranceRule, InsuranceCalculationContext, InsuranceCalculationResult } from '@/types/insurance';
import { calculateInsurance } from '@/lib/aums/insuranceEngine';
import { runInsuranceTests } from '@/lib/insuranceTestCases';
import { Calculator, RefreshCw, Shield, Lock, Zap, Check } from 'lucide-react';

interface InsurancePreviewProps {
    rule: InsuranceRule;
    onValidCalculation: (isValid: boolean) => void;
}

export default function InsurancePreview({ rule, onValidCalculation }: InsurancePreviewProps) {
    const [inputs, setInputs] = useState({
        exShowroom: 100000,
        engineCc: 110,
        fuelType: 'PETROL',
        customIdv: undefined as number | undefined,
    });

    const [result, setResult] = useState<InsuranceCalculationResult | null>(null);
    const [loggedTests, setLoggedTests] = useState(false);
    // Track selected addon indices — all selected by default
    const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new Set());

    const ruleJson = JSON.stringify(rule);
    useEffect(() => {
        handleCalculate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputs, ruleJson]);

    // When addons change, select all by default
    useEffect(() => {
        if (result) {
            setSelectedAddons(new Set(result.addonBreakdown.map((_, i) => i)));
        }
    }, [result?.addonBreakdown.length]);

    useEffect(() => {
        if (process.env.NODE_ENV !== 'development' || loggedTests) return;
        const results = runInsuranceTests();
        console.table(results);
        setLoggedTests(true);
    }, [loggedTests]);

    const handleCalculate = () => {
        try {
            const ctx: InsuranceCalculationContext = {
                exShowroom: inputs.exShowroom,
                engineCc: inputs.engineCc,
                fuelType: inputs.fuelType,
                customIdv: inputs.customIdv,
                odTenure: (rule.tenureConfig?.od?.default || 1) as 1 | 3 | 5,
                tpTenure: (rule.tenureConfig?.tp?.default || 5) as 1 | 5,
            };

            const res = calculateInsurance(rule, ctx);
            setResult(res);
            onValidCalculation(true);
        } catch (e) {
            console.error('Insurance Calculation Error', e);
            onValidCalculation(false);
        }
    };

    const toggleAddon = (idx: number) => {
        setSelectedAddons(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    // Derived calculations
    const gstPct = rule.gstPercentage || 18;
    const odTenure = result?.tenures?.od ?? 1;
    const tpTenure = result?.tenures?.tp ?? 1;
    const addonTenure = result?.tenures?.addons ?? 1;

    const mandatoryBase = (result?.odTotal ?? 0) + (result?.tpTotal ?? 0);
    const mandatoryGst = Math.round(mandatoryBase * (gstPct / 100));
    const mandatoryNet = mandatoryBase + mandatoryGst;

    // Per-addon GST-inclusive prices (tenure-applied)
    const addonPrices = useMemo(() => {
        if (!result) return [];
        return result.addonBreakdown.map(item => {
            const base = item.amount * addonTenure;
            const gst = Math.round(base * (gstPct / 100));
            return { base, gst, inclusive: base + gst };
        });
    }, [result, addonTenure, gstPct]);

    const selectedAddonTotal = addonPrices.reduce((sum, p, i) => sum + (selectedAddons.has(i) ? p.inclusive : 0), 0);

    const payablePremium = mandatoryNet + selectedAddonTotal;

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-120px)] bg-white/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-200/60 shadow-xl ring-1 ring-black/5">
            {/* Header with inputs */}
            <div className="bg-white/80 px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                <div className="bg-blue-600 p-1 rounded-md shadow-md shadow-blue-500/20 text-white shrink-0">
                    <Calculator size={12} />
                </div>
                <div className="shrink-0">
                    <h3 className="font-black text-slate-900 text-[10px] tracking-tight italic uppercase">Simulator</h3>
                    <p className="text-[6px] text-slate-400 font-black uppercase tracking-widest">Real-time</p>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                    <div className="flex items-center gap-1">
                        <label className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Ex-S</label>
                        <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">
                                ₹
                            </span>
                            <input
                                type="number"
                                className="w-[70px] bg-white border border-slate-200 rounded-md pl-4 pr-1 py-0.5 text-[10px] font-black text-slate-900 focus:ring-1 focus:ring-blue-500/20 outline-none"
                                value={inputs.exShowroom}
                                onChange={e => setInputs({ ...inputs, exShowroom: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <label className="text-[6px] font-black text-slate-400 uppercase tracking-widest">CC</label>
                        <input
                            type="number"
                            className="w-10 bg-white border border-slate-200 rounded-md px-1 py-0.5 text-[10px] font-black text-slate-900 focus:ring-1 focus:ring-blue-500/20 outline-none"
                            value={inputs.engineCc}
                            onChange={e => setInputs({ ...inputs, engineCc: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <button
                        onClick={handleCalculate}
                        className="text-slate-400 hover:text-blue-600 transition-all p-0.5 hover:bg-slate-50 rounded active:scale-95"
                    >
                        <RefreshCw size={10} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {result && (
                    <>
                        {/* ═══ MANDATORY: OD + TP ═══ */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <span className="text-[7px] font-black text-white bg-slate-800 px-1.5 py-px rounded uppercase tracking-widest">
                                    Mandatory
                                </span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>

                            {/* OD */}
                            <div className="space-y-1 pl-1">
                                <div className="flex items-center gap-1">
                                    <Shield size={9} className="text-blue-500" />
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                        OD
                                    </span>
                                    {odTenure > 1 && (
                                        <span className="text-[6px] font-black text-blue-500 bg-blue-50 px-1 rounded">
                                            ×{odTenure}yr
                                        </span>
                                    )}
                                </div>
                                {result.odBreakdown.map((item, id) => (
                                    <div key={id} className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-tighter leading-tight">
                                                {item.label}
                                            </p>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter italic">
                                                {item.meta}
                                            </p>
                                        </div>
                                        <p
                                            className={`font-mono font-black text-[9px] leading-none ${
                                                (result.ncbDiscount ?? 0) > 0 || (result.discountAmount ?? 0) > 0
                                                    ? 'text-slate-400 line-through'
                                                    : 'text-slate-800'
                                            }`}
                                        >
                                            ₹{(item.amount * odTenure).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                {/* NCB & OD Discount */}
                                {((result.ncbDiscount ?? 0) > 0 || (result.discountAmount ?? 0) > 0) && (
                                    <div className="border-t border-dashed border-slate-200 pt-1 space-y-0.5">
                                        {(result.ncbDiscount ?? 0) > 0 && (
                                            <div className="flex justify-between">
                                                <p className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter">
                                                    NCB
                                                </p>
                                                <p className="font-mono font-black text-[8px] text-emerald-600">
                                                    −₹{result.ncbDiscount!.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {(result.discountAmount ?? 0) > 0 && (
                                            <div className="flex justify-between">
                                                <p className="text-[7px] font-black text-pink-600 uppercase tracking-tighter">
                                                    OD Disc
                                                </p>
                                                <p className="font-mono font-black text-[8px] text-pink-600">
                                                    −₹{result.discountAmount!.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <p className="text-[7px] font-black text-blue-600 uppercase tracking-tighter">
                                                Net OD
                                            </p>
                                            <p className="font-mono font-black text-[9px] text-blue-600">
                                                ₹{result.odTotal.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* TP */}
                            <div className="space-y-1 pl-1">
                                <div className="flex items-center gap-1">
                                    <Lock size={9} className="text-indigo-500" />
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                        TP
                                    </span>
                                    {tpTenure > 1 && (
                                        <span className="text-[6px] font-black text-indigo-500 bg-indigo-50 px-1 rounded">
                                            ×{tpTenure}yr
                                        </span>
                                    )}
                                </div>
                                {result.tpBreakdown.map((item, id) => (
                                    <div key={id} className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-tighter leading-tight">
                                                {item.label}
                                            </p>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter italic">
                                                {item.meta}
                                            </p>
                                        </div>
                                        <p className="font-mono font-black text-[9px] text-slate-800 leading-none">
                                            ₹{(item.amount * tpTenure).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Mandatory Subtotal */}
                            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 space-y-0.5 border border-slate-100">
                                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    <span>OD + TP</span>
                                    <span>₹{mandatoryBase.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>GST ({gstPct}%)</span>
                                    <span>₹{mandatoryGst.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-slate-900 uppercase tracking-tight border-t border-slate-200 pt-1 mt-0.5">
                                    <span>Net Premium</span>
                                    <span className="font-mono">₹{mandatoryNet.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* ═══ OPTIONAL: Add-ons ═══ */}
                        {result.addonBreakdown.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-black text-white bg-amber-500 px-1.5 py-px rounded uppercase tracking-widest">
                                        Optional
                                    </span>
                                    <Zap size={9} className="text-amber-500" />
                                    {addonTenure > 1 && (
                                        <span className="text-[6px] font-black text-amber-600 bg-amber-50 px-1 rounded">
                                            ×{addonTenure}yr
                                        </span>
                                    )}
                                    <div className="flex-1 h-px bg-slate-200" />
                                    <span className="text-[7px] font-black text-slate-400">
                                        {selectedAddons.size}/{result.addonBreakdown.length}
                                    </span>
                                </div>

                                {result.addonBreakdown.map((item, id) => {
                                    const isSelected = selectedAddons.has(id);
                                    const price = addonPrices[id];
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => toggleAddon(id)}
                                            className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left transition-all ${
                                                isSelected
                                                    ? 'bg-amber-50/50 border-amber-200'
                                                    : 'bg-white/50 border-slate-100 opacity-50'
                                            }`}
                                        >
                                            <div
                                                className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors ${
                                                    isSelected
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-slate-100 text-transparent'
                                                }`}
                                            >
                                                <Check size={8} strokeWidth={3} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-tighter leading-tight truncate">
                                                    {item.label}
                                                </p>
                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter italic truncate">
                                                    {item.meta}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-mono font-black text-[9px] text-slate-800 leading-none">
                                                    ₹{price?.inclusive.toLocaleString()}
                                                </p>
                                                <p className="text-[6px] font-bold text-slate-400 font-mono">
                                                    ₹{price?.base.toLocaleString()}+₹{price?.gst.toLocaleString()}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}

                                {selectedAddons.size > 0 && (
                                    <div className="flex justify-between px-2 text-[8px] font-black text-amber-600 uppercase tracking-widest">
                                        <span>Selected Add-ons</span>
                                        <span className="font-mono">₹{selectedAddonTotal.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ═══ PAYABLE — sticky footer ═══ */}
            {result && (
                <div className="bg-white border-t border-blue-100 px-3 py-2.5 shrink-0">
                    <div className="flex items-center gap-3 text-[7px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        <span>Mandatory ₹{mandatoryNet.toLocaleString()}</span>
                        {selectedAddons.size > 0 && (
                            <>
                                <span>+</span>
                                <span>
                                    Add-ons({selectedAddons.size}) ₹{selectedAddonTotal.toLocaleString()}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[6px] font-black text-blue-600 uppercase tracking-widest">
                                Payable Premium
                            </p>
                            <p className="text-lg font-black tracking-tighter italic leading-none text-slate-900">
                                ₹{payablePremium.toLocaleString()}
                            </p>
                        </div>
                        <div className="px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200 text-[6px] font-black uppercase tracking-widest text-emerald-600">
                            Validated
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
