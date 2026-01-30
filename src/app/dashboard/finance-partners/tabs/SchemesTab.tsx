import React, { useState, useMemo, useEffect } from 'react';
import { BankScheme, BankPartner } from '@/types/bankPartner';
import { Calculator, Plus, Trash2, Edit3, Briefcase, FileText, ChevronRight, ArrowUpDown, TrendingDown, TrendingUp, IndianRupee, Wallet, HandCoins, Tag, Copy, Loader2 } from 'lucide-react';
import SchemeEditor from '../SchemeEditor';
import { updateBankSchemes } from '../actions';
import { formatDisplayIdForUI } from '@/lib/displayId';

export default function SchemesTab({ schemes: initialSchemes, bankId, chargesMaster, onSchemesUpdated }: { schemes: BankScheme[], bankId: string, chargesMaster: any[]; onSchemesUpdated?: (schemes: BankScheme[]) => void }) {
    const [schemes, setSchemes] = useState<BankScheme[]>(initialSchemes);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingScheme, setEditingScheme] = useState<BankScheme | null>(null);

    // Simulator State
    const [simVehicleCost, setSimVehicleCost] = useState(100000);
    const [simLoanAmount, setSimLoanAmount] = useState(100000);
    const [simTenure, setSimTenure] = useState(36);

    useEffect(() => {
        setSchemes(initialSchemes || []);
    }, [initialSchemes]);

    // Calculation Engine
    const calculateEMI = (principal: number, annualRate: number, months: number, type: 'FLAT' | 'REDUCING') => {
        if (type === 'FLAT') {
            const totalInterest = (principal * (annualRate / 100) * (months / 12));
            return Math.round((principal + totalInterest) / months);
        } else {
            const monthlyRate = annualRate / 12 / 100;
            const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
            return Math.round(emi);
        }
    };

    const calculatedSchemes = useMemo(() => {
        const results = schemes.map(scheme => {
            let n = simTenure;

            // Charges Breakdown
            let fundedChargesTotal = 0;
            let upfrontChargesTotal = 0;

            scheme.charges.forEach(ch => {
                let amount = 0;
                let basis = 0;

                if (ch.calculationBasis === 'VEHICLE_PRICE') basis = simVehicleCost;
                else if (ch.calculationBasis === 'GROSS_LOAN_AMOUNT') basis = simLoanAmount + fundedChargesTotal;
                else if (ch.calculationBasis === 'LOAN_AMOUNT') basis = simLoanAmount;

                if (ch.type === 'FIXED') {
                    amount = ch.value;
                } else if (ch.type === 'PERCENTAGE') {
                    amount = (basis * ch.value) / 100;
                } else if (ch.type === 'TABLE' && ch.tableData) {
                    const sortedRules = [...ch.tableData].sort((a, b) => a.tenure - b.tenure);
                    const rule = sortedRules.find(r => r.tenure >= n);
                    if (rule) amount = rule.rate;
                }

                if (ch.taxStatus === 'EXCLUSIVE' && ch.taxRate) {
                    amount = amount + (amount * ch.taxRate) / 100;
                }

                if (ch.impact === 'FUNDED') fundedChargesTotal += amount;
                else upfrontChargesTotal += amount;
            });

            const grossLoanAmount = simLoanAmount + fundedChargesTotal;
            const downpayment = (simVehicleCost - simLoanAmount) + upfrontChargesTotal;
            const disbursal = simLoanAmount - upfrontChargesTotal;

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

            // Waiver Adjustment
            const waiverCount = scheme.emiWaiverCount || 0;
            const totalOutflow = (emi * (n - waiverCount)) + downpayment;

            // Payout calculation
            const payoutAmount = scheme.payoutType === 'PERCENTAGE'
                ? (disbursal * scheme.payout) / 100
                : scheme.payout;

            return {
                ...scheme,
                simResults: {
                    emi: Math.round(emi),
                    downpayment: Math.round(downpayment),
                    disbursal: Math.round(disbursal),
                    payout: Math.round(payoutAmount),
                    totalOutflow: Math.round(totalOutflow),
                    waiverBenefit: Math.round(emi * waiverCount)
                }
            };
        });

        // Determine Winners
        const sortedByOutflow = [...results].sort((a, b) => a.simResults.totalOutflow - b.simResults.totalOutflow);
        const sortedByPayout = [...results].sort((a, b) => b.simResults.payout - a.simResults.payout);

        const cheapestId = sortedByOutflow[0]?.id;
        const bestPayoutId = sortedByPayout[0]?.id;

        return results.map(r => ({
            ...r,
            isCheapest: r.id === cheapestId && results.length > 1,
            isBestPayout: r.id === bestPayoutId && results.length > 1
        })).sort((a, b) => {
            if (a.isCheapest) return -1;
            if (b.isCheapest) return 1;
            if (a.isBestPayout) return -1;
            if (b.isBestPayout) return 1;
            return 0;
        });
    }, [schemes, simVehicleCost, simLoanAmount, simTenure]);

    if (isEditorOpen) {
        return (
            <div className="p-8 relative min-h-screen">
                {isSaving && (
                    <div className="absolute inset-0 z-[60] bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Saving to Cloud...</span>
                        </div>
                    </div>
                )}
                <div className="max-w-7xl mx-auto">
                    <SchemeEditor
                        onCancel={() => {
                            if (!isSaving) {
                                setIsEditorOpen(false);
                                setEditingScheme(null);
                            }
                        }}
                        onSave={async (updated) => {
                            setIsSaving(true);
                            try {
                                const exists = schemes.find(s => s.id === updated.id);
                                const nextSchemes = exists
                                    ? schemes.map(s => s.id === updated.id ? updated : s)
                                    : [...schemes, updated];

                                const res = await updateBankSchemes(bankId, nextSchemes);
                                if (res.success) {
                                    setSchemes(nextSchemes);
                                    onSchemesUpdated?.(nextSchemes);
                                    setIsEditorOpen(false);
                                    setEditingScheme(null);
                                } else {
                                    alert('Error saving: ' + res.error);
                                }
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                        initialScheme={editingScheme || undefined}
                        bankId={bankId}
                        chargesMaster={chargesMaster}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-12 pt-4">
            <div className="flex flex-col lg:flex-row items-center justify-between mb-12 gap-8">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                        <Calculator size={32} className="text-blue-500" />
                        EMI Simulator
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 ml-12">Live Scenario Analysis & Scheme Comparison</p>
                </div>

                {/* Simulator Controls */}
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-[28px] border border-slate-200 dark:border-white/5 shadow-inner">
                    <div className="flex flex-col gap-1 px-4 border-r border-slate-200 dark:border-white/10">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vehicle Cost</span>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                                type="number"
                                value={simVehicleCost}
                                onChange={(e) => setSimVehicleCost(Number(e.target.value))}
                                className="w-24 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 px-4 border-r border-slate-200 dark:border-white/10">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Loan Amount</span>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                                type="number"
                                value={simLoanAmount}
                                onChange={(e) => setSimLoanAmount(Number(e.target.value))}
                                className="w-24 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 px-4">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tenure (M)</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={simTenure}
                                onChange={(e) => setSimTenure(Number(e.target.value))}
                                className="w-12 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none"
                            />
                            <span className="text-[10px] font-black text-slate-400 uppercase">m</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {schemes.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-[32px] p-20 text-center flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Calculator size={40} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">No Schemes Created</h4>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Start by adding your first financial scheme</p>
                        </div>
                        <button
                            onClick={() => { setEditingScheme(null); setIsEditorOpen(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 shadow-2xl shadow-blue-500/20"
                        >
                            <Plus size={18} /> Add Your First Scheme
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {calculatedSchemes.map((scheme, idx) => (
                                <div
                                    key={scheme.id}
                                    className={`bg-white dark:bg-slate-900 border rounded-[32px] p-8 flex items-center justify-between group transition-all relative overflow-hidden ${scheme.isCheapest ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/5' :
                                        scheme.isBestPayout ? 'border-amber-500/50 shadow-xl shadow-amber-500/5' :
                                            'border-slate-200 dark:border-white/5 shadow-sm'
                                        }`}
                                >
                                    {scheme.isCheapest && (
                                        <div className="absolute top-0 right-0 py-1.5 px-6 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 z-10">
                                            <TrendingDown size={12} /> Most Affordable
                                        </div>
                                    )}
                                    {scheme.isBestPayout && !scheme.isCheapest && (
                                        <div className="absolute top-0 right-0 py-1.5 px-6 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl flex items-center gap-2 shadow-lg shadow-amber-500/20 z-10">
                                            <TrendingUp size={12} /> Best Payout
                                        </div>
                                    )}

                                    <div className="flex items-center gap-12 flex-1">
                                        <div className="flex flex-col min-w-[200px]">
                                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{scheme.name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                                    {formatDisplayIdForUI(scheme.id)}
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{scheme.interestRate}% {scheme.interestType}</span>
                                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{scheme.charges.length} Rules Applied</span>
                                                {scheme.emiWaiverCount ? (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                                            {scheme.emiWaiverCount} EMI Waived
                                                        </span>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-4 flex-1">
                                            <div className="bg-slate-50 dark:bg-white/[0.03] backdrop-blur-md rounded-[20px] p-4 border border-slate-100 dark:border-white/[0.05] flex flex-col items-center">
                                                <div className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                                                    <Wallet size={8} className="text-blue-500" /> EMI
                                                </div>
                                                <div className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">₹{scheme.simResults.emi.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.03] backdrop-blur-md rounded-[20px] p-4 border border-slate-100 dark:border-white/[0.05] flex flex-col items-center">
                                                <div className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Upfront Cost</div>
                                                <div className="text-lg font-black text-slate-700 dark:text-slate-300 tracking-tighter">₹{scheme.simResults.downpayment.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.03] backdrop-blur-md rounded-[20px] p-4 border border-slate-100 dark:border-white/[0.05] flex flex-col items-center">
                                                <div className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Disbursal</div>
                                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">₹{scheme.simResults.disbursal.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-amber-50/50 dark:bg-amber-500/5 backdrop-blur-md rounded-[20px] p-4 border border-amber-100/50 dark:border-amber-500/10 flex flex-col items-center">
                                                <div className="text-[7px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                                                    <HandCoins size={8} /> Payout
                                                </div>
                                                <div className="text-lg font-black text-amber-600 dark:text-amber-500 tracking-tighter">₹{scheme.simResults.payout.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 ml-8">
                                        <button
                                            onClick={() => {
                                                const cloned = { ...scheme, id: `SCH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, name: `${scheme.name} (Copy)` };
                                                setEditingScheme(cloned);
                                                setIsEditorOpen(true);
                                            }}
                                            className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 transition-all text-slate-500 dark:text-slate-400"
                                            title="Clone Scheme"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => { setEditingScheme(scheme); setIsEditorOpen(true); }}
                                            className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-blue-600 hover:text-white border border-slate-100 dark:border-white/5 transition-all text-slate-500 dark:text-slate-400 hover:text-white"
                                            title="Edit Scheme"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-red-500 hover:text-white border border-slate-100 dark:border-white/5 transition-all text-slate-500 dark:text-slate-400 hover:text-white">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center pt-8">
                            <button
                                onClick={() => { setEditingScheme(null); setIsEditorOpen(true); }}
                                className="bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 px-12 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-3 shadow-xl shadow-black/5"
                            >
                                <Plus size={18} className="text-blue-500" /> Add Another Scheme
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
