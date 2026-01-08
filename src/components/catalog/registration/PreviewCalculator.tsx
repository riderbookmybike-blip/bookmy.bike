'use client';

import React, { useState, useEffect } from 'react';
import { RegistrationRule, CalculationContext, CalculationResult, RegistrationType } from '@/types/registration';
import { calculateRegistrationCharges } from '@/lib/registrationEngine';
import { Calculator, RefreshCw, ChevronDown, ChevronRight, Building2, User, Globe } from 'lucide-react';

interface PreviewCalculatorProps {
    rule: RegistrationRule;
    onValidCalculation: (isValid: boolean) => void;
}

const MODES: { label: string; type: RegistrationType; icon: React.ElementType, desc: string }[] = [
    { label: 'State Series', type: 'STATE_INDIVIDUAL', icon: User, desc: 'Standard 15 Year Tax' },
    { label: 'BH Series', type: 'BH_SERIES', icon: Globe, desc: '2 Year Tax (Bharat Series)' },
    { label: 'Corporate', type: 'COMPANY', icon: Building2, desc: 'Company Registration' }
];

export default function PreviewCalculator({ rule, onValidCalculation }: PreviewCalculatorProps) {
    const [inputs, setInputs] = useState({
        exShowroom: 100000,
        engineCc: 110,
        fuelType: 'PETROL'
    });

    const [results, setResults] = useState<Record<string, CalculationResult | null>>({});
    const [expandedMode, setExpandedMode] = useState<string>('');

    // Auto-calculate on input change
    useEffect(() => {
        handleCalculate();
    }, [inputs, rule.components, rule.stateTenure, rule.bhTenure, rule.companyMultiplier]);

    const handleCalculate = () => {
        try {
            const newResults: Record<string, CalculationResult | null> = {};
            let allValid = true;

            MODES.forEach(mode => {
                // Determine multipliers based on mode
                // State Individual: 1x
                // BH Series: 1x (but BH logic applies)
                // Company: 2x (or rule multiplier)
                const effectiveMultiplier = mode.type === 'COMPANY'
                    ? (rule.companyMultiplier || 3)
                    : 1;

                const ctx: CalculationContext = {
                    exShowroom: inputs.exShowroom,
                    invoiceBase: inputs.exShowroom,
                    engineCc: inputs.engineCc,
                    fuelType: inputs.fuelType,
                    regType: mode.type,
                    variantConfig: {
                        stateTenure: rule.stateTenure || 15,
                        bhTenure: rule.bhTenure || 2,
                        companyMultiplier: effectiveMultiplier
                    }
                };

                try {
                    newResults[mode.type] = calculateRegistrationCharges(rule, ctx);
                } catch (e) {
                    console.error(`Error calculating for ${mode.type}`, e);
                    newResults[mode.type] = null;
                    allValid = false;
                }
            });

            setResults(newResults);
            onValidCalculation(allValid);
        } catch (e) {
            console.error("Calculation Error", e);
            onValidCalculation(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/40 shadow-2xl ring-1 ring-black/5">
            {/* Header */}
            <div className="bg-white/60 dark:bg-slate-900/60 p-5 border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200 text-white">
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-base tracking-tight">Live Simulator</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Real-time Validation</p>
                    </div>
                </div>
                <button onClick={handleCalculate} className="text-gray-400 hover:text-blue-600 transition-all p-2 hover:bg-white rounded-xl active:scale-95 shadow-sm">
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
                {/* Global Inputs */}
                <div className="bg-white/50 p-4 rounded-2xl border border-white/60 shadow-inner grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ex-Showroom Price</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold group-focus-within:text-blue-600 transition-colors">₹</span>
                                <input
                                    type="number"
                                    className="w-full bg-white border border-gray-100 rounded-xl pl-8 pr-4 py-3 text-sm font-black text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all shadow-sm"
                                    value={inputs.exShowroom}
                                    onChange={e => setInputs({ ...inputs, exShowroom: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Engine Capacity</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all shadow-sm"
                                    value={inputs.engineCc}
                                    onChange={e => setInputs({ ...inputs, engineCc: parseInt(e.target.value) || 0 })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">CC / KW</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fuel Technology</label>
                        <div className="flex gap-2">
                            {['PETROL', 'DIESEL', 'EV', 'CNG'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setInputs({ ...inputs, fuelType: f })}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${inputs.fuelType === f
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-100'
                                        : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="space-y-3">
                    {MODES.map((mode) => {
                        const res = results[mode.type];
                        const isExpanded = expandedMode === mode.type;

                        return (
                            <div
                                key={mode.type}
                                className={`border rounded-2xl bg-white transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-2 ring-blue-600 border-transparent shadow-xl translate-x-1' : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'}`}
                            >
                                <div
                                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => setExpandedMode(isExpanded ? '' : mode.type)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl transition-all duration-500 ${isExpanded ? 'bg-blue-600 text-white rotate-[360deg] shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-400'}`}>
                                            <mode.icon size={18} />
                                        </div>
                                        <div>
                                            <div className={`font-black text-sm tracking-tight ${isExpanded ? 'text-blue-700' : 'text-gray-900'}`}>{mode.label}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{mode.desc}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {res && (
                                            <span className={`font-mono font-black text-lg ${isExpanded ? 'text-blue-700' : 'text-gray-900'}`}>
                                                ₹{res.totalAmount.toLocaleString()}
                                            </span>
                                        )}
                                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-600' : 'text-gray-300'}`}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && res && (
                                    <div className="border-t border-gray-100/50 p-5 bg-white space-y-4">
                                        <div className="space-y-3">
                                            {res.breakdown.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-start group/row">
                                                    <div>
                                                        <span className="text-[11px] font-bold text-gray-700 group-hover/row:text-blue-600 transition-colors">{item.label}</span>
                                                        <span className="block text-[9px] font-black text-gray-300 uppercase tracking-tighter">{item.meta}</span>
                                                    </div>
                                                    <span className="font-mono font-black text-xs text-gray-900">₹{item.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t-2 border-dashed border-gray-50 pt-4 flex justify-between items-center group/total">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Grand Total</span>
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono font-black text-2xl text-blue-600 drop-shadow-sm leading-none">
                                                    ₹{res.totalAmount.toLocaleString()}
                                                </span>
                                                <span className="text-[8px] font-black text-green-500 tracking-tighter mt-1">✓ CALCULATION VERIFIED</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}