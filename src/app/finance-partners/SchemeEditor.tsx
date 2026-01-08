'use client';

import React, { useState, useEffect } from 'react';
import { BankScheme, SchemeCharge, InterestType, ChargeType, ChargeCalculationBasis, ChargeImpact } from '@/types/bankPartner';
import { Plus, Trash2, Save, Calculator, ArrowRight, RotateCcw } from 'lucide-react';

interface SchemeEditorProps {
    initialScheme?: BankScheme;
    onSave: (scheme: BankScheme) => void;
    onCancel: () => void;
}

const EMPTY_SCHEME: BankScheme = {
    id: `new-${Date.now()}`,
    name: 'New Scheme',
    isActive: true,
    minTenure: 12,
    maxTenure: 36,
    minLoanAmount: 30000,
    maxLoanAmount: 150000,
    maxLTV: 85,
    interestRate: 10.5,
    interestType: 'REDUCING',
    payout: 0,
    payoutType: 'PERCENTAGE',
    charges: [
        { id: 'ch1', name: 'Processing Fee', type: 'PERCENTAGE', value: 2.0, calculationBasis: 'GROSS_LOAN_AMOUNT', impact: 'UPFRONT' }
    ]
};

export default function SchemeEditor({ initialScheme, onSave, onCancel }: SchemeEditorProps) {
    const [scheme, setScheme] = useState<BankScheme>(initialScheme || EMPTY_SCHEME);

    // Calculator State for "Test Drive"
    const [testPrice, setTestPrice] = useState(100000);
    const [testLoan, setTestLoan] = useState(80000);
    const [testAge, setTestAge] = useState(25); // New Input: Applicant Age
    const [newTenureValue, setNewTenureValue] = useState<string>('');
    const [showTenureInput, setShowTenureInput] = useState<string | null>(null); // chargeId
    const [debugResult, setDebugResult] = useState<any>(null);

    // Dynamic Charge Handlers
    const addCharge = () => {
        const newCharge: SchemeCharge = {
            id: `c-${Date.now()}`,
            name: 'New Charge',
            type: 'FIXED',
            value: 0,
            calculationBasis: 'FIXED', // Default for fixed
            impact: 'UPFRONT',
            tableData: [] // Initialize for Table support
        };
        setScheme({ ...scheme, charges: [...scheme.charges, newCharge] });
    };

    const removeCharge = (id: string) => {
        setScheme({ ...scheme, charges: scheme.charges.filter(c => c.id !== id) });
    };

    const updateCharge = (id: string, updates: Partial<SchemeCharge>) => {
        setScheme({
            ...scheme,
            charges: scheme.charges.map(c => c.id === id ? { ...c, ...updates } : c)
        });
    };

    // Helper: Add Rate Rule to a Table Charge
    const addTableRule = (chargeId: string) => {
        const charge = scheme.charges.find(c => c.id === chargeId);
        if (!charge) return;

        const newRule: any = { minAge: 18, maxAge: 60, tenure: scheme.maxTenure, rate: 0 };
        updateCharge(chargeId, { tableData: [...(charge.tableData || []), newRule] });
    };

    const updateTableRule = (chargeId: string, index: number, field: string, val: number) => {
        const charge = scheme.charges.find(c => c.id === chargeId);
        if (!charge || !charge.tableData) return;

        const newTableData = [...charge.tableData];
        newTableData[index] = { ...newTableData[index], [field]: val };
        updateCharge(chargeId, { tableData: newTableData });
    };

    const removeTableRule = (chargeId: string, index: number) => {
        const charge = scheme.charges.find(c => c.id === chargeId);
        if (!charge || !charge.tableData) return;
        updateCharge(chargeId, { tableData: charge.tableData.filter((_, i) => i !== index) });
    };


    // Live Calculation Logic (Multi-Tenure Support)
    useEffect(() => {
        // Find all unique tenures defined in Rate Matrix, or use defaults
        const tenuresFromMatrix = Array.from(new Set(
            scheme.charges
                .filter(ch => ch.type === 'TABLE' && ch.tableData)
                .flatMap(ch => ch.tableData?.map(r => r.tenure) || [])
        ));

        const tenuresToCalculate = tenuresFromMatrix.length > 0
            ? tenuresFromMatrix.sort((a, b) => a - b)
            : [12, 18, 24, 30, 36, 48, 60].filter(t => t >= scheme.minTenure && t <= scheme.maxTenure);

        if (tenuresToCalculate.length === 0) tenuresToCalculate.push(scheme.maxTenure);

        const emiResults = tenuresToCalculate.map(n => {
            let fundedChargesTotal = 0;
            let upfrontChargesTotal = 0;

            scheme.charges.forEach(ch => {
                let amount = 0;
                let basis = 0;

                // Determine Basis
                if (ch.calculationBasis === 'VEHICLE_PRICE') basis = testPrice;
                else if (ch.calculationBasis === 'GROSS_LOAN_AMOUNT') basis = testLoan + fundedChargesTotal;
                else if (ch.calculationBasis === 'LOAN_AMOUNT') basis = testLoan;

                if (ch.type === 'FIXED') {
                    amount = ch.value;
                } else if (ch.type === 'PERCENTAGE') {
                    amount = (basis * ch.value) / 100;
                } else if (ch.type === 'TABLE' && ch.tableData) {
                    const rule = ch.tableData.find(r =>
                        testLoan >= (r.minAge || 0) &&
                        testLoan <= (r.maxAge || 9999999) &&
                        r.tenure === n
                    );
                    if (rule) amount = rule.rate;
                }

                if (ch.impact === 'FUNDED') fundedChargesTotal += amount;
                else upfrontChargesTotal += amount;
            });

            const grossLoanAmount = testLoan + fundedChargesTotal;
            const marginMoney = testPrice - testLoan;
            const totalDownpayment = marginMoney + upfrontChargesTotal;

            // EMI Calculation
            const rRate = scheme.interestRate / 12 / 100;
            let emi = 0;

            if (scheme.interestType === 'FLAT') {
                const totalInterest = (grossLoanAmount * scheme.interestRate * (n / 12)) / 100;
                emi = (grossLoanAmount + totalInterest) / n;
            } else {
                if (rRate === 0) emi = grossLoanAmount / n;
                else emi = (grossLoanAmount * rRate * Math.pow(1 + rRate, n)) / (Math.pow(1 + rRate, n) - 1);
            }

            return {
                tenure: n,
                emi: Math.round(emi),
                grossLoan: grossLoanAmount,
                downpayment: totalDownpayment,
                fundedCharges: fundedChargesTotal,
                upfrontCharges: upfrontChargesTotal
            };
        });

        // Set result (we'll display all, but use the first one/max one for default summary if needed)
        setDebugResult(emiResults);

    }, [scheme, testPrice, testLoan, testAge]);


    return (
        <div className="flex flex-col xl:flex-row gap-8 h-full">
            {/* LEFT: FORM Form */}
            <div className="flex-1 space-y-8 pb-20 overflow-y-auto px-1">

                {/* 1. Core Details */}
                <section className="bg-slate-900 border border-white/5 rounded-[32px] p-8 mt-0 shadow-2xl shadow-black/20">
                    <h3 className="text-white font-black text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">1</span>
                        Scheme Basics
                    </h3>
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="col-span-2">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Scheme Name</label>
                            <input
                                type="text"
                                value={scheme.name}
                                onChange={e => setScheme({ ...scheme, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-3 text-white font-bold focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Valid From</label>
                            <input type="date" className="w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-3 text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Valid To</label>
                            <input type="date" className="w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-3 text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                        </div>
                    </div>
                </section>

                {/* 2. Lending Criteria */}
                <section className="bg-slate-900 border border-white/5 rounded-[32px] p-8 mt-8 shadow-2xl shadow-black/20">
                    <h3 className="text-white font-black text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 text-xs flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">2</span>
                        Lending Criteria
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">ROI (%)</label>
                            <input
                                type="number"
                                value={scheme.interestRate}
                                onChange={e => setScheme({ ...scheme, interestRate: Number(e.target.value) })}
                                className="w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-3 text-white font-mono font-bold focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Type</label>
                            <select
                                value={scheme.interestType}
                                onChange={e => setScheme({ ...scheme, interestType: e.target.value as InterestType })}
                                className="w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-3 text-white font-bold outline-none appearance-none focus:border-blue-500/50 transition-all"
                            >
                                <option value="REDUCING">Reducing</option>
                                <option value="FLAT">Flat</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Max LTV (%)</label>
                            <input
                                type="number"
                                value={scheme.maxLTV}
                                onChange={e => setScheme({ ...scheme, maxLTV: Number(e.target.value) })}
                                className="w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-3 text-white font-mono font-bold outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Min Tenure</label>
                            <input
                                type="number"
                                value={scheme.minTenure}
                                onChange={e => setScheme({ ...scheme, minTenure: Number(e.target.value) })}
                                className="w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-3 text-white font-mono font-bold outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Max Tenure</label>
                            <input
                                type="number"
                                value={scheme.maxTenure}
                                onChange={e => setScheme({ ...scheme, maxTenure: Number(e.target.value) })}
                                className="w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-3 text-white font-mono font-bold outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Dealer Payout</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={scheme.payout}
                                    onChange={e => setScheme({ ...scheme, payout: Number(e.target.value) })}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-[14px] px-4 py-3 text-white font-mono font-bold outline-none focus:border-blue-500/50 transition-all"
                                />
                                <select className="bg-black/40 border border-white/10 rounded-[14px] px-3 font-bold text-xs text-slate-400 outline-none appearance-none">
                                    <option>%</option>
                                    <option>₹</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Dynamic Charges Table */}
                <section className="bg-slate-900 border border-white/5 rounded-[32px] p-8 mt-8 shadow-2xl shadow-black/20">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/10">3</span>
                            Charges & Fees
                        </h3>
                        <button onClick={addCharge} className="text-[10px] flex items-center gap-2 text-white bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all font-black uppercase tracking-widest active:scale-95">
                            <Plus size={14} /> Add Charge
                        </button>
                    </div>

                    <div className="space-y-3">
                        {scheme.charges.map((charge, idx) => (
                            <div key={charge.id} className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                {/* Charge Header Row */}
                                <div className="grid grid-cols-12 gap-3 items-center mb-4">
                                    {/* Name */}
                                    <div className="col-span-3">
                                        <input
                                            type="text"
                                            placeholder="Charge Name"
                                            value={charge.name}
                                            onChange={(e) => updateCharge(charge.id, { name: e.target.value })}
                                            className="w-full bg-transparent text-sm font-bold text-white placeholder-slate-600 outline-none"
                                        />
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => updateCharge(charge.id, { impact: 'UPFRONT' })}
                                                className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border ${charge.impact === 'UPFRONT' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'text-slate-600 border-transparent hover:text-slate-400'}`}
                                            >
                                                Upfront
                                            </button>
                                            <button
                                                onClick={() => updateCharge(charge.id, { impact: 'FUNDED' })}
                                                className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border ${charge.impact === 'FUNDED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'text-slate-600 border-transparent hover:text-slate-400'}`}
                                            >
                                                Funded
                                            </button>
                                        </div>
                                    </div>

                                    {/* Type Selection */}
                                    <div className="col-span-3">
                                        <select
                                            value={charge.type}
                                            onChange={(e) => updateCharge(charge.id, { type: e.target.value as ChargeType })}
                                            className="bg-slate-800 border border-white/10 rounded-lg text-xs text-slate-300 px-3 py-2 outline-none w-full appearance-none"
                                        >
                                            <option value="PERCENTAGE">% Percentage</option>
                                            <option value="FIXED">₹ Fixed Amount</option>
                                            <option value="TABLE">Rate Matrix (Amount x Tenure)</option>
                                        </select>
                                    </div>

                                    {/* Value OR Basis */}
                                    <div className="col-span-5 pl-2">
                                        {charge.type !== 'TABLE' ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={charge.value}
                                                    onChange={(e) => updateCharge(charge.id, { value: Number(e.target.value) })}
                                                    className="w-24 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none focus:border-blue-500/30"
                                                />
                                                {charge.type === 'PERCENTAGE' && (
                                                    <select
                                                        value={charge.calculationBasis}
                                                        onChange={(e) => updateCharge(charge.id, { calculationBasis: e.target.value as ChargeCalculationBasis })}
                                                        className="bg-slate-800 border border-white/10 rounded-lg text-[10px] text-slate-300 px-3 py-2 outline-none flex-1 appearance-none"
                                                    >
                                                        <option value="LOAN_AMOUNT">on Loan Amount</option>
                                                        <option value="GROSS_LOAN_AMOUNT">on Gross Loan</option>
                                                        <option value="VEHICLE_PRICE">on Ex-Showroom</option>
                                                    </select>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-2 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                                                <Calculator size={14} />
                                                Rate Matrix Configured Below
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete */}
                                    <div className="col-span-1 flex justify-end">
                                        <button onClick={() => removeCharge(charge.id)} className="w-8 h-8 rounded-lg bg-red-500/5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* MATRIX EDITOR (Spreadsheet Style) */}
                                {charge.type === 'TABLE' && (
                                    <div className="mt-4 bg-slate-900/50 rounded-2xl p-5 border border-white/5 shadow-inner">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                    Premium Rate Matrix
                                                </h4>
                                                <p className="text-[9px] text-slate-600 mt-1 uppercase font-black tracking-wider">Configure fixed premiums by loan amount & tenure</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {showTenureInput === charge.id ? (
                                                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-right-2 duration-300">
                                                        <input
                                                            autoFocus
                                                            type="number"
                                                            placeholder="Tenure (m)"
                                                            value={newTenureValue}
                                                            onChange={(e) => setNewTenureValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    const t = Number(newTenureValue);
                                                                    if (!isNaN(t) && t > 0) {
                                                                        const ranges: { min: number, max: number }[] = [];
                                                                        charge.tableData?.forEach(r => {
                                                                            if (!ranges.some(rg => rg.min === r.minAge && rg.max === r.maxAge)) {
                                                                                ranges.push({ min: r.minAge, max: r.maxAge });
                                                                            }
                                                                        });
                                                                        const newRules = ranges.length > 0 ? ranges.map(range => ({
                                                                            minAge: range.min,
                                                                            maxAge: range.max,
                                                                            tenure: t,
                                                                            rate: 0
                                                                        })) : [{ minAge: 0, maxAge: 0, tenure: t, rate: 0 }];
                                                                        updateCharge(charge.id, { tableData: [...(charge.tableData || []), ...newRules] });
                                                                        setNewTenureValue('');
                                                                        setShowTenureInput(null);
                                                                    }
                                                                }
                                                                if (e.key === 'Escape') setShowTenureInput(null);
                                                            }}
                                                            className="w-24 bg-black/40 border-none rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                                                        />
                                                        <button
                                                            onClick={() => setShowTenureInput(null)}
                                                            className="p-1 px-2 text-[10px] font-black uppercase text-slate-500 hover:text-white"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowTenureInput(charge.id)}
                                                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all border border-white/5 active:scale-95"
                                                    >
                                                        + Add Tenure
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        const currentTenures = Array.from(new Set(charge.tableData?.map(r => r.tenure) || [12, 24, 36, 48, 60]));
                                                        const newRange = { min: 0, max: 0 };
                                                        const newRules = currentTenures.map(t => ({
                                                            minAge: newRange.min,
                                                            maxAge: newRange.max,
                                                            tenure: t,
                                                            rate: 0
                                                        }));
                                                        updateCharge(charge.id, { tableData: [...(charge.tableData || []), ...newRules] });
                                                    }}
                                                    className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                                >
                                                    + Add Range
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-white/5">
                                                <thead>
                                                    <tr className="bg-white/5">
                                                        <th className="p-2 border border-white/5 text-[9px] uppercase font-black text-slate-500 w-24">Min Amount</th>
                                                        <th className="p-2 border border-white/5 text-[9px] uppercase font-black text-slate-500 w-24">Max Amount</th>
                                                        {Array.from(new Set(charge.tableData?.map(r => r.tenure) || [12, 24, 36, 48, 60]))
                                                            .sort((a, b) => a - b)
                                                            .map(t => (
                                                                <th key={t} className="p-2 border border-white/5 text-[9px] uppercase font-black text-blue-400 group relative">
                                                                    {t} Months
                                                                    <button
                                                                        onClick={() => {
                                                                            const newData = charge.tableData?.filter(r => r.tenure !== t);
                                                                            updateCharge(charge.id, { tableData: newData });
                                                                        }}
                                                                        className="absolute -top-1 -right-1 text-slate-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5"
                                                                    >
                                                                        <Plus size={8} className="rotate-45" />
                                                                    </button>
                                                                </th>
                                                            ))}
                                                        <th className="p-2 border border-white/5 text-[9px] uppercase font-black text-slate-500 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        // Group rules by range
                                                        const ranges: { min: number, max: number }[] = [];
                                                        charge.tableData?.forEach(r => {
                                                            if (!ranges.some(rg => rg.min === r.minAge && rg.max === r.maxAge)) {
                                                                ranges.push({ min: r.minAge, max: r.maxAge });
                                                            }
                                                        });

                                                        const sortedTenures = Array.from(new Set(charge.tableData?.map(r => r.tenure) || [12, 24, 36, 48, 60])).sort((a, b) => a - b);

                                                        return ranges.map((range, rgIdx) => (
                                                            <tr key={rgIdx} className="hover:bg-white/[0.02] transition-colors">
                                                                <td className="p-1 border border-white/5">
                                                                    <input
                                                                        type="number"
                                                                        value={range.min}
                                                                        onChange={(e) => {
                                                                            const val = Number(e.target.value);
                                                                            const newData = charge.tableData?.map(r =>
                                                                                (r.minAge === range.min && r.maxAge === range.max) ? { ...r, minAge: val } : r
                                                                            );
                                                                            updateCharge(charge.id, { tableData: newData });
                                                                        }}
                                                                        className="w-full bg-transparent p-2 text-xs text-white font-mono text-center outline-none focus:bg-white/5"
                                                                        placeholder="Min ₹"
                                                                    />
                                                                </td>
                                                                <td className="p-1 border border-white/5">
                                                                    <input
                                                                        type="number"
                                                                        value={range.max}
                                                                        onChange={(e) => {
                                                                            const val = Number(e.target.value);
                                                                            const newData = charge.tableData?.map(r =>
                                                                                (r.minAge === range.min && r.maxAge === range.max) ? { ...r, maxAge: val } : r
                                                                            );
                                                                            updateCharge(charge.id, { tableData: newData });
                                                                        }}
                                                                        className="w-full bg-transparent p-2 text-xs text-white font-mono text-center outline-none focus:bg-white/5"
                                                                        placeholder="Max ₹"
                                                                    />
                                                                </td>
                                                                {sortedTenures.map(t => {
                                                                    const rule = charge.tableData?.find(r => r.minAge === range.min && r.maxAge === range.max && r.tenure === t);
                                                                    return (
                                                                        <td key={t} className="p-1 border border-white/5 bg-emerald-500/[0.02]">
                                                                            <input
                                                                                type="number"
                                                                                value={rule?.rate || 0}
                                                                                onChange={(e) => {
                                                                                    const val = Number(e.target.value);
                                                                                    if (rule) {
                                                                                        const newData = charge.tableData?.map(r =>
                                                                                            (r === rule) ? { ...r, rate: val } : r
                                                                                        );
                                                                                        updateCharge(charge.id, { tableData: newData });
                                                                                    } else {
                                                                                        const newRule = { minAge: range.min, maxAge: range.max, tenure: t, rate: val };
                                                                                        updateCharge(charge.id, { tableData: [...(charge.tableData || []), newRule] });
                                                                                    }
                                                                                }}
                                                                                className="w-full bg-transparent p-2 text-xs text-emerald-400 font-black text-center outline-none focus:bg-emerald-500/10 transition-colors"
                                                                                placeholder="₹"
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="p-1 border border-white/5 text-center">
                                                                    <button
                                                                        onClick={() => {
                                                                            const newData = charge.tableData?.filter(r => !(r.minAge === range.min && r.maxAge === range.max));
                                                                            updateCharge(charge.id, { tableData: newData });
                                                                        }}
                                                                        className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <Plus size={14} className="rotate-45" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })()}
                                                    {(!charge.tableData || charge.tableData.length === 0) && (
                                                        <tr>
                                                            <td colSpan={10} className="text-center py-10 bg-black/10">
                                                                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Spreadsheet Empty</p>
                                                                <p className="text-[9px] text-slate-700 mt-1">Click "+ Add Range" or "+ Add Tenure" to start.</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <button onClick={() => onSave(scheme)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                        <Save size={18} /> Save Scheme
                    </button>
                    <button onClick={onCancel} className="px-8 bg-slate-800 border border-white/10 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all">
                        Cancel
                    </button>
                </div>
            </div>

            {/* RIGHT: LIVE CALCULATOR PREVIEW */}
            <div className="xl:w-[450px] space-y-8">
                <div className="sticky top-8 bg-slate-900 border border-white/5 rounded-[32px] p-8 shadow-2xl shadow-black/40 flex flex-col">
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-black italic text-white flex items-center gap-3">
                                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                    <Calculator size={24} />
                                </span>
                                SIMULATION
                            </h2>
                            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Engine</span>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-12">Real-time behavior analysis</p>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-6 bg-black/20 p-8 rounded-[24px] border border-white/5 mb-8">
                        <div>
                            <div className="flex justify-between mb-2 px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vehicle Price</label>
                                <span className="text-[10px] font-mono font-black text-emerald-500">MAX LTV: {scheme.maxLTV}%</span>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={testPrice}
                                    onChange={e => setTestPrice(Number(e.target.value))}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-[16px] pl-8 pr-4 py-4 font-mono text-xl text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all group-hover:border-white/20"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2 px-1">Requested Loan</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={testLoan}
                                        onChange={e => setTestLoan(Number(e.target.value))}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-[16px] pl-8 pr-4 py-4 font-mono text-lg text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all group-hover:border-white/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2 px-1">Applicant Age</label>
                                <input
                                    type="number"
                                    value={testAge}
                                    onChange={e => setTestAge(Number(e.target.value))}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-[16px] px-4 py-4 font-mono text-lg text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all group-hover:border-white/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Results Card */}
                    {debugResult && Array.isArray(debugResult) && debugResult.length > 0 && (
                        <div className="space-y-6">
                            {/* Summary using first result (or appropriate default) */}
                            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500/30 rounded-[28px] p-8 relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -z-0" />
                                <div className="relative z-10">
                                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] block mb-2">Customer Pays</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-white tracking-tighter italic">₹{debugResult[0].downpayment.toLocaleString()}</span>
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">Upfront</span>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200/50">
                                            <span>Margin Money</span>
                                            <span className="text-white font-mono">₹{(testPrice - testLoan).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200/50">
                                            <span>Charges & Addons</span>
                                            <span className="text-white font-mono">+ ₹{debugResult[0].upfrontCharges.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tenure Matrix Results */}
                            <div className="bg-white/5 border border-white/5 rounded-[28px] overflow-hidden">
                                <div className="p-6 border-b border-white/5">
                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500">EMI Scenarios by Tenure</h4>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {debugResult.map((res: any) => (
                                        <div key={res.tenure} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors">
                                            <div>
                                                <div className="text-xs font-black text-white italic tracking-tight">{res.tenure} Months</div>
                                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">₹{res.grossLoan.toLocaleString()} Loan</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-emerald-400 tracking-tighter">₹{res.emi.toLocaleString()}</div>
                                                <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Calculated EMI</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payout */}
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[28px] p-6 flex items-center justify-between shadow-lg shadow-emerald-500/5">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Dealer Payout Est.</span>
                                <div className="text-right">
                                    <span className="font-mono font-black text-emerald-400 text-lg">
                                        {scheme.payoutType === 'PERCENTAGE'
                                            ? `₹${Math.round((debugResult[0].grossLoan * scheme.payout) / 100).toLocaleString()}`
                                            : `₹${scheme.payout.toLocaleString()}`
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
