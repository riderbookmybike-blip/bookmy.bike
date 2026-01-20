'use client';

import React, { useState, useEffect } from 'react';
import { InsuranceRule, InsuranceCalculationContext, InsuranceCalculationResult } from '@/types/insurance';
import { calculateInsurance } from '@/lib/insuranceEngine';
import { runInsuranceTests } from '@/lib/insuranceTestCases';
import { Calculator, RefreshCw, Shield, Zap, Lock, DollarSign } from 'lucide-react';

interface InsurancePreviewProps {
    rule: InsuranceRule;
    onValidCalculation: (isValid: boolean) => void;
}

export default function InsurancePreview({ rule, onValidCalculation }: InsurancePreviewProps) {
    const [inputs, setInputs] = useState({
        exShowroom: 100000,
        engineCc: 110,
        fuelType: 'PETROL',
        customIdv: undefined as number | undefined
    });

    const [result, setResult] = useState<InsuranceCalculationResult | null>(null);
    const [loggedTests, setLoggedTests] = useState(false);

    useEffect(() => {
        handleCalculate();
    }, [inputs, rule.odComponents, rule.tpComponents, rule.addons, rule.idvPercentage, rule.gstPercentage]);

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
                customIdv: inputs.customIdv
            };

            const res = calculateInsurance(rule, ctx);
            setResult(res);
            onValidCalculation(true);
        } catch (e) {
            console.error("Insurance Calculation Error", e);
            onValidCalculation(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/40 dark:border-white/5 shadow-2xl ring-1 ring-black/5">
            {/* Header */}
            <div className="bg-white/60 dark:bg-slate-800/60 p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center transition-colors">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight italic uppercase">Premium Simulator</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Real-time Validation</p>
                    </div>
                </div>
                <button onClick={handleCalculate} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl active:scale-95">
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Inputs Overlay */}
                <div className="bg-white/50 dark:bg-white/5 p-6 rounded-[2rem] border border-white dark:border-white/10 shadow-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Ex-Showroom Cost</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300 text-sm font-black">₹</span>
                                <input
                                    type="number"
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    value={inputs.exShowroom}
                                    onChange={e => setInputs({ ...inputs, exShowroom: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Engine Capacity</label>
                            <input
                                type="number"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                value={inputs.engineCc}
                                onChange={e => setInputs({ ...inputs, engineCc: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/30 flex justify-between items-center transition-all">
                        <div>
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none mb-1">Derived IDV (Insured Declared Value)</p>
                            <p className="text-xl font-black text-blue-700 dark:text-blue-300 tracking-tighter italic">₹{result?.idv.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest leading-none mb-1">Logic</p>
                            <p className="text-[12px] font-black text-blue-600/80 dark:text-blue-400 uppercase italic leading-none">{rule.idvPercentage}% OF EX-S</p>
                        </div>
                    </div>
                </div>

                {/* Breakdown */}
                {result && (
                    <div className="space-y-6 px-2">
                        {/* OD Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield size={14} className="text-blue-500" />
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Own Damage</span>
                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/10" />
                            </div>
                            {result.odBreakdown.map((item, id) => (
                                <div key={id} className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter">{item.label}</p>
                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter italic">{item.meta}</p>
                                    </div>
                                    <p className="font-mono font-black text-xs text-slate-900 dark:text-white leading-none">₹{item.amount.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        {/* TP Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                                <Lock size={14} className="text-indigo-500" />
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Third Party</span>
                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/10" />
                            </div>
                            {result.tpBreakdown.map((item, id) => (
                                <div key={id} className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter">{item.label}</p>
                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter italic">{item.meta}</p>
                                    </div>
                                    <p className="font-mono font-black text-xs text-slate-900 dark:text-white leading-none">₹{item.amount.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        {/* Add-ons */}
                        {result.addonBreakdown.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap size={14} className="text-amber-500" />
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Add-on Covers</span>
                                    <div className="flex-1 h-px bg-slate-100 dark:bg-white/10" />
                                </div>
                                {result.addonBreakdown.map((item, id) => (
                                    <div key={id} className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase italic tracking-tighter">{item.label}</p>
                                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter italic">{item.meta}</p>
                                        </div>
                                        <p className="font-mono font-black text-xs text-slate-900 dark:text-white leading-none">₹{item.amount.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Totals Card */}
                        <div className="mt-8 bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-indigo-950 dark:to-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest opacity-60">
                                    <span>Net Premium</span>
                                    <span>₹{result.netPremium.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest opacity-60">
                                    <span>GST ({rule.gstPercentage}%)</span>
                                    <span>₹{result.gstAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Payable Premium</p>
                                    <p className="text-4xl font-black tracking-tighter italic leading-none">₹{result.totalPremium.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-[8px] font-black uppercase tracking-widest">Studio Validated</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
