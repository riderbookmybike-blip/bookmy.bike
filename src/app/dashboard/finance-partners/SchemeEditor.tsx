'use client';

import React, { useState, useEffect } from 'react';
import {
    BankScheme,
    SchemeCharge,
    InterestType,
    ChargeType,
    ChargeCalculationBasis,
    ChargeImpact,
} from '@/types/bankPartner';
import { Plus, Trash2, Save, Calculator, ArrowRight, RotateCcw, Tag, Copy, Zap, Minus, Settings } from 'lucide-react';
import { generateDisplayId, formatDisplayIdForUI } from '@/lib/displayId';

interface SchemeEditorProps {
    initialScheme?: BankScheme;
    onSave: (scheme: BankScheme) => void;
    onCancel: () => void;
    chargesMaster?: SchemeCharge[];
    bankId?: string;
}

const EMPTY_SCHEME: BankScheme = {
    id: generateDisplayId(),
    name: 'New Scheme',
    isActive: true,
    minTenure: 3,
    maxTenure: 60,
    minLoanAmount: 30000,
    maxLoanAmount: 300000,
    maxLTV: 100,
    interestRate: 10.5,
    interestType: 'REDUCING',
    payout: 0,
    payoutType: 'PERCENTAGE',
    charges: [
        {
            id: generateDisplayId(),
            name: 'Processing Fee',
            type: 'PERCENTAGE',
            value: 2.0,
            calculationBasis: 'GROSS_LOAN_AMOUNT',
            impact: 'UPFRONT',
            taxStatus: 'NOT_APPLICABLE',
        },
    ],
    applicability: {
        brands: 'ALL',
        models: 'ALL',
        dealerships: 'ALL',
    },
};

export default function SchemeEditor({ initialScheme, onSave, onCancel, chargesMaster, bankId }: SchemeEditorProps) {
    const [scheme, setScheme] = useState<BankScheme>(initialScheme || EMPTY_SCHEME);

    // Calculator State for "Test Drive"
    const [testPrice, setTestPrice] = useState(100000);
    const [testLoan, setTestLoan] = useState(100000); // 100% loan by default
    const [testAge, setTestAge] = useState(25); // New Input: Applicant Age
    const [newTenureValue, setNewTenureValue] = useState<string>('');
    const [tenureInputText, setTenureInputText] = useState('');
    const [showTenureInput, setShowTenureInput] = useState<string | null>(null); // chargeId
    const [debugResult, setDebugResult] = useState<any>(null);

    // Dynamic Charge Handlers
    const addCharge = () => {
        const newCharge: SchemeCharge = {
            id: generateDisplayId(),
            name: 'New Charge',
            type: 'FIXED',
            value: 0,
            calculationBasis: 'FIXED', // Default for fixed
            impact: 'UPFRONT',
            taxStatus: 'NOT_APPLICABLE',
            tableData: [], // Initialize for Table support
        };
        setScheme({ ...scheme, charges: [...scheme.charges, newCharge] });
    };

    const removeCharge = (id: string) => {
        setScheme({ ...scheme, charges: scheme.charges.filter(c => c.id !== id) });
    };

    const updateCharge = (id: string, updates: Partial<SchemeCharge>) => {
        setScheme({
            ...scheme,
            charges: scheme.charges.map(c => (c.id === id ? { ...c, ...updates } : c)),
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

    // Helper: Iterative APR Solver
    const calculateAPR = (netDisbursal: number, emi: number, tenure: number) => {
        if (netDisbursal <= 0 || emi <= 0 || tenure <= 0) return 0;
        let low = 0;
        let high = 2.0; // 200% max
        for (let i = 0; i < 20; i++) {
            let mid = (low + high) / 2;
            let r = mid / 12;
            let pv = r === 0 ? emi * tenure : (emi * (1 - Math.pow(1 + r, -tenure))) / r;
            if (pv > netDisbursal) low = mid;
            else high = mid;
        }
        return ((low + high) / 2) * 100;
    };

    // Live Calculation Logic (Multi-Tenure Support)
    useEffect(() => {
        const tenuresFromMatrix = Array.from(
            new Set(
                scheme.charges
                    .filter(ch => ch.type === 'TABLE' && ch.tableData)
                    .flatMap(ch => ch.tableData?.map(r => r.tenure) || [])
                    .sort((a, b) => a - b)
            )
        );

        const tenuresToCalculate =
            scheme.allowedTenures && scheme.allowedTenures.length > 0
                ? [...scheme.allowedTenures].sort((a, b) => a - b)
                : tenuresFromMatrix.length > 0
                  ? tenuresFromMatrix
                  : [3, 12, 18, 24, 36, 48, 60].filter(t => t >= scheme.minTenure && t <= scheme.maxTenure);

        const ltvMaxLoan = (testPrice * scheme.maxLTV) / 100;
        const capMaxLoan = scheme.maxLoanAmount || 0;
        const maxAllowedLoan = Math.min(ltvMaxLoan, capMaxLoan);

        // Actual loan used for calculations (capped by allowed max)
        const activeLoan = Math.min(testLoan, maxAllowedLoan);

        const emiResults = tenuresToCalculate.map(n => {
            let fundedChargesTotal = 0;
            let upfrontChargesTotal = 0;
            let monthlyAddonTotal = 0;

            scheme.charges.forEach(ch => {
                let amount = 0;
                let basis = 0;

                if (ch.calculationBasis === 'VEHICLE_PRICE') basis = testPrice;
                else if (ch.calculationBasis === 'GROSS_LOAN_AMOUNT') basis = activeLoan + fundedChargesTotal;
                else if (ch.calculationBasis === 'LOAN_AMOUNT') basis = activeLoan;

                if (ch.type === 'MONTHLY_FIXED') amount = ch.value;
                else if (ch.type === 'FIXED') amount = ch.value;
                else if (ch.type === 'PERCENTAGE') amount = (basis * ch.value) / 100;
                else if (ch.type === 'TABLE' && ch.tableData) {
                    const sortedRules = [...ch.tableData].sort((a, b) => a.tenure - b.tenure);
                    const rule = sortedRules.find(
                        r => activeLoan >= (r.minAge || 0) && activeLoan <= (r.maxAge || 9999999) && r.tenure >= n
                    );
                    if (rule) amount = rule.rate;
                }

                if (ch.taxStatus === 'EXCLUSIVE' && ch.taxRate) amount = amount + (amount * ch.taxRate) / 100;

                // Route by impact: MONTHLY charges go to EMI addon, not loan or downpayment
                if (ch.impact === 'MONTHLY') monthlyAddonTotal += amount;
                else if (ch.impact === 'FUNDED') fundedChargesTotal += amount;
                else upfrontChargesTotal += amount;
            });

            const grossLoanAmount = activeLoan + fundedChargesTotal;
            const marginMoney = testPrice - activeLoan;
            const totalDownpayment = marginMoney + upfrontChargesTotal;

            const rRate = scheme.interestRate / 12 / 100;
            let emi = 0;
            if (scheme.interestType === 'FLAT') {
                const totalInterest = (grossLoanAmount * scheme.interestRate * (n / 12)) / 100;
                emi = (grossLoanAmount + totalInterest) / n;
            } else {
                if (rRate === 0) emi = grossLoanAmount / n;
                else emi = (grossLoanAmount * rRate * Math.pow(1 + rRate, n)) / (Math.pow(1 + rRate, n) - 1);
            }

            // Add monthly fixed charges ON TOP of base EMI (doesn't affect loan principal)
            emi += monthlyAddonTotal;

            const waiverCount = scheme.emiWaiverCount || 0;
            const adjustedTotalCost = emi * (n - waiverCount) + totalDownpayment;

            // Financial Metrics
            const totalPayout =
                scheme.payoutType === 'PERCENTAGE' ? (grossLoanAmount * scheme.payout) / 100 : scheme.payout;
            const subventionVal = scheme.subvention || 0;
            const totalSubvention =
                scheme.subventionType === 'PERCENTAGE' ? (grossLoanAmount * subventionVal) / 100 : subventionVal;
            const netMargin = totalPayout - totalSubvention;

            // IRR Calculation: Pure interest rate on base loan without charges (reducing balance)
            // Calculate what EMI would be for JUST the activeLoan (no funded charges)
            const rRateBase = scheme.interestRate / 12 / 100;
            let emiBase = 0;
            if (scheme.interestType === 'FLAT') {
                const totalInterest = (activeLoan * scheme.interestRate * (n / 12)) / 100;
                emiBase = (activeLoan + totalInterest) / n;
            } else {
                if (rRateBase === 0) emiBase = activeLoan / n;
                else emiBase = (activeLoan * rRateBase * Math.pow(1 + rRateBase, n)) / (Math.pow(1 + rRateBase, n) - 1);
            }
            // IRR is just the scheme's interest rate for reducing balance
            const irr = scheme.interestRate;

            // APR Calculation: Solve for r where PV(EMIs) = Gross Loan - Upfront Charges
            // This considers ALL charges (upfront + funded) and calculates effective rate
            const effectivePrincipal = grossLoanAmount - upfrontChargesTotal;
            const apr = calculateAPR(effectivePrincipal, emi, n);

            return {
                tenure: n,
                emi: Math.round(emi),
                grossLoan: grossLoanAmount,
                downpayment: totalDownpayment,
                fundedCharges: fundedChargesTotal,
                upfrontCharges: upfrontChargesTotal,
                waiverBenefit: Math.round(emi * waiverCount),
                totalOutflow: Math.round(adjustedTotalCost),
                netMargin,
                irr,
                apr,
                totalInterest: Math.round(emi * n - grossLoanAmount),
            };
        });

        setDebugResult(emiResults);
    }, [scheme, testPrice, testLoan, testAge]);

    return (
        <div className="flex flex-col xl:flex-row gap-8">
            {/* LEFT: FORM Form */}
            <div className="flex-1 space-y-8 pb-20 px-1">
                {/* 1. Core Details */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 mt-0 shadow-sm dark:shadow-2xl shadow-black/20">
                    <h3 className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center border border-blue-500/10 dark:border-blue-500/20 shadow-lg shadow-blue-500/5 dark:shadow-blue-500/10">
                            1
                        </span>
                        Scheme Basics
                    </h3>
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">
                                    Scheme Name
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Scheme CID:
                                    </span>
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                        {formatDisplayIdForUI(scheme.id)}
                                    </span>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={scheme.name}
                                onChange={e => setScheme({ ...scheme, name: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3 text-slate-900 dark:text-white font-bold focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">
                                Valid From
                            </label>
                            <input
                                type="date"
                                value={scheme.validFrom || ''}
                                onChange={e => setScheme({ ...scheme, validFrom: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">
                                Valid To
                            </label>
                            <input
                                type="date"
                                value={scheme.validTo || ''}
                                onChange={e => setScheme({ ...scheme, validTo: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Zap size={18} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                    Platform Primary
                                </h4>
                                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">
                                    Main fallback scheme for marketplace
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setScheme({ ...scheme, isPrimary: !scheme.isPrimary })}
                            className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${scheme.isPrimary ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-white/10'}`}
                        >
                            <div
                                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-all transform ${scheme.isPrimary ? 'translate-x-6' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>
                </section>

                {/* 1.5 Applicability Rules */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 mt-8 shadow-sm dark:shadow-2xl shadow-black/20">
                    <h3 className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-600/20 text-orange-600 dark:text-orange-400 text-xs flex items-center justify-center border border-orange-500/10 dark:border-orange-500/20 shadow-lg shadow-orange-500/5 dark:shadow-orange-500/10">
                            1.5
                        </span>
                        Scheme Applicability
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Brands */}
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">
                                Brand Scope
                            </label>
                            <div className="flex bg-slate-50 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                                <button
                                    onClick={() =>
                                        setScheme({
                                            ...scheme,
                                            applicability: { ...(scheme.applicability || {}), brands: 'ALL' },
                                        })
                                    }
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${scheme.applicability?.brands === 'ALL' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    All Brands
                                </button>
                                <button
                                    onClick={() =>
                                        setScheme({
                                            ...scheme,
                                            applicability: { ...(scheme.applicability || {}), brands: [] },
                                        })
                                    }
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${scheme.applicability?.brands !== 'ALL' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Specific
                                </button>
                            </div>
                            {scheme.applicability?.brands !== 'ALL' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <input
                                        type="text"
                                        placeholder="Add Brand (e.g. Honda)"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (
                                                    val &&
                                                    Array.isArray(scheme.applicability?.brands) &&
                                                    !scheme.applicability?.brands.includes(val)
                                                ) {
                                                    setScheme({
                                                        ...scheme,
                                                        applicability: {
                                                            ...(scheme.applicability || {}),
                                                            brands: [
                                                                ...((scheme.applicability?.brands as string[]) || []),
                                                                val,
                                                            ],
                                                        },
                                                    });
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(scheme.applicability?.brands) &&
                                            scheme.applicability?.brands.map(b => (
                                                <span
                                                    key={b}
                                                    className="bg-blue-500/10 text-blue-500 text-[8px] font-black px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1"
                                                >
                                                    {b}{' '}
                                                    <button
                                                        onClick={() =>
                                                            setScheme({
                                                                ...scheme,
                                                                applicability: {
                                                                    ...(scheme.applicability || {}),
                                                                    brands: (
                                                                        scheme.applicability?.brands as string[]
                                                                    ).filter(x => x !== b),
                                                                },
                                                            })
                                                        }
                                                    >
                                                        <Plus size={8} className="rotate-45" />
                                                    </button>
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Models */}
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">
                                Model Scope
                            </label>
                            <div className="flex bg-slate-50 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                                <button
                                    onClick={() =>
                                        setScheme({
                                            ...scheme,
                                            applicability: { ...(scheme.applicability || {}), models: 'ALL' },
                                        })
                                    }
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${scheme.applicability?.models === 'ALL' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    All Models
                                </button>
                                <button
                                    onClick={() =>
                                        setScheme({
                                            ...scheme,
                                            applicability: { ...(scheme.applicability || {}), models: [] },
                                        })
                                    }
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${scheme.applicability?.models !== 'ALL' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Specific
                                </button>
                            </div>
                            {scheme.applicability?.models !== 'ALL' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <input
                                        type="text"
                                        placeholder="Add Model (e.g. Activa)"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (
                                                    val &&
                                                    Array.isArray(scheme.applicability?.models) &&
                                                    !scheme.applicability?.models.includes(val)
                                                ) {
                                                    setScheme({
                                                        ...scheme,
                                                        applicability: {
                                                            ...(scheme.applicability || {}),
                                                            models: [
                                                                ...((scheme.applicability?.models as string[]) || []),
                                                                val,
                                                            ],
                                                        },
                                                    });
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(scheme.applicability?.models) &&
                                            scheme.applicability?.models.map(m => (
                                                <span
                                                    key={m}
                                                    className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1"
                                                >
                                                    {m}{' '}
                                                    <button
                                                        onClick={() =>
                                                            setScheme({
                                                                ...scheme,
                                                                applicability: {
                                                                    ...(scheme.applicability || {}),
                                                                    models: (
                                                                        scheme.applicability?.models as string[]
                                                                    ).filter(x => x !== m),
                                                                },
                                                            })
                                                        }
                                                    >
                                                        <Plus size={8} className="rotate-45" />
                                                    </button>
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dealerships */}
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">
                                Dealer Scope
                            </label>
                            <div className="flex bg-slate-50 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                                <button
                                    onClick={() =>
                                        setScheme({
                                            ...scheme,
                                            applicability: { ...(scheme.applicability || {}), dealerships: 'ALL' },
                                        })
                                    }
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${scheme.applicability?.dealerships === 'ALL' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Universal
                                </button>
                                <button
                                    onClick={() =>
                                        setScheme({
                                            ...scheme,
                                            applicability: { ...(scheme.applicability || {}), dealerships: [] },
                                        })
                                    }
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${scheme.applicability?.dealerships !== 'ALL' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Specific
                                </button>
                            </div>
                            {scheme.applicability?.dealerships !== 'ALL' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <input
                                        type="text"
                                        placeholder="Search Dealer ID/Name"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (
                                                    val &&
                                                    Array.isArray(scheme.applicability?.dealerships) &&
                                                    !scheme.applicability?.dealerships.includes(val)
                                                ) {
                                                    setScheme({
                                                        ...scheme,
                                                        applicability: {
                                                            ...(scheme.applicability || {}),
                                                            dealerships: [
                                                                ...((scheme.applicability?.dealerships as string[]) ||
                                                                    []),
                                                                val,
                                                            ],
                                                        },
                                                    });
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(scheme.applicability?.dealerships) &&
                                            scheme.applicability?.dealerships.map(d => (
                                                <span
                                                    key={d}
                                                    className="bg-purple-500/10 text-purple-500 text-[8px] font-black px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1"
                                                >
                                                    {d}{' '}
                                                    <button
                                                        onClick={() =>
                                                            setScheme({
                                                                ...scheme,
                                                                applicability: {
                                                                    ...(scheme.applicability || {}),
                                                                    dealerships: (
                                                                        scheme.applicability?.dealerships as string[]
                                                                    ).filter(x => x !== d),
                                                                },
                                                            })
                                                        }
                                                    >
                                                        <Plus size={8} className="rotate-45" />
                                                    </button>
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 2. Lending Criteria */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 mt-8 shadow-sm dark:shadow-2xl shadow-black/20">
                    <h3 className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest mb-8 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center border border-emerald-500/10 dark:border-emerald-500/20 shadow-lg shadow-emerald-500/5 dark:shadow-emerald-500/10">
                            2
                        </span>
                        Lending Criteria
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">
                                ROI (%)
                            </label>
                            <input
                                type="number"
                                value={scheme.interestRate}
                                onChange={e => setScheme({ ...scheme, interestRate: Number(e.target.value) })}
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3 text-slate-900 dark:text-white font-mono font-bold focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">
                                Type
                            </label>
                            <select
                                value={scheme.interestType}
                                onChange={e => setScheme({ ...scheme, interestType: e.target.value as InterestType })}
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3 text-slate-900 dark:text-white font-bold outline-none appearance-none focus:border-blue-500/50 transition-all"
                            >
                                <option value="REDUCING">Reducing</option>
                                <option value="FLAT">Flat</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">
                                Max LTV (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={scheme.maxLTV}
                                    onChange={e => setScheme({ ...scheme, maxLTV: Number(e.target.value) })}
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-blue-500/50 transition-all pr-10"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                    %
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">
                                Max Loan Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    value={scheme.maxLoanAmount}
                                    onChange={e => setScheme({ ...scheme, maxLoanAmount: Number(e.target.value) })}
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[14px] px-10 py-3 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="col-span-3">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block">
                                Tenures (Months)
                            </label>
                            <div className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[14px] p-2 min-h-[48px] flex flex-wrap gap-2 items-center focus-within:border-blue-500/50 transition-all">
                                {scheme.allowedTenures
                                    ?.sort((a, b) => a - b)
                                    .map(t => (
                                        <span
                                            key={t}
                                            className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 group"
                                        >
                                            {t}
                                            <button
                                                onClick={() => {
                                                    const newTenures =
                                                        scheme.allowedTenures?.filter(x => x !== t) || [];
                                                    const updates: Partial<BankScheme> = {
                                                        allowedTenures: newTenures.length > 0 ? newTenures : undefined,
                                                        minTenure: newTenures.length > 0 ? Math.min(...newTenures) : 3,
                                                        maxTenure: newTenures.length > 0 ? Math.max(...newTenures) : 60,
                                                    };
                                                    setScheme({ ...scheme, ...updates });
                                                }}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <Plus size={12} className="rotate-45" />
                                            </button>
                                        </span>
                                    ))}
                                <input
                                    type="text"
                                    placeholder={!scheme.allowedTenures?.length ? 'Type & Enter (e.g. 12)' : ''}
                                    value={tenureInputText}
                                    onChange={e => setTenureInputText(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
                                            e.preventDefault();
                                            const parts = tenureInputText
                                                .split(/[\s,]+/)
                                                .map(s => Number(s.trim()))
                                                .filter(n => !isNaN(n) && n > 0);
                                            if (parts.length > 0) {
                                                const current = scheme.allowedTenures || [];
                                                const combined = Array.from(new Set([...current, ...parts])).sort(
                                                    (a, b) => a - b
                                                );
                                                const updates: Partial<BankScheme> = {
                                                    allowedTenures: combined,
                                                    minTenure: Math.min(...combined),
                                                    maxTenure: Math.max(...combined),
                                                };
                                                setScheme({ ...scheme, ...updates });
                                                setTenureInputText('');
                                            }
                                        }
                                        if (
                                            e.key === 'Backspace' &&
                                            tenureInputText === '' &&
                                            scheme.allowedTenures?.length
                                        ) {
                                            const newTenures = [...(scheme.allowedTenures || [])];
                                            newTenures.pop();
                                            const updates: Partial<BankScheme> = {
                                                allowedTenures: newTenures.length > 0 ? newTenures : undefined,
                                                minTenure: newTenures.length > 0 ? Math.min(...newTenures) : 3,
                                                maxTenure: newTenures.length > 0 ? Math.max(...newTenures) : 60,
                                            };
                                            setScheme({ ...scheme, ...updates });
                                        }
                                    }}
                                    className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white font-mono font-bold text-sm px-2 py-1 min-w-[120px]"
                                />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 italic">
                                Type months and press Enter/Space. Multiple values allowed.
                            </p>
                        </div>
                        <div className="col-span-3 bg-gradient-to-br from-slate-50 to-white dark:from-black/20 dark:to-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-white/5">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-4 flex items-center gap-2 block">
                                Dealer Payout
                                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[8px]">
                                    Commission
                                </span>
                            </label>

                            <div className="grid grid-cols-3 gap-4">
                                {/* Payout Value */}
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                        Value
                                    </label>
                                    <input
                                        type="number"
                                        value={scheme.payout}
                                        onChange={e => setScheme({ ...scheme, payout: Number(e.target.value) })}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono font-bold text-lg outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="2"
                                    />
                                </div>

                                {/* Payout Type (% or ₹) */}
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                        Type
                                    </label>
                                    <select
                                        value={scheme.payoutType}
                                        onChange={e => setScheme({ ...scheme, payoutType: e.target.value as any })}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 font-black text-sm text-slate-600 dark:text-slate-300 outline-none appearance-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    >
                                        <option value="PERCENTAGE">% Perc.</option>
                                        <option value="FIXED">₹ Fixed</option>
                                    </select>
                                </div>

                                {/* Calculation Basis */}
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                        Basis
                                    </label>
                                    <select
                                        value={scheme.payoutBasis || 'LOAN_AMOUNT'}
                                        onChange={e => setScheme({ ...scheme, payoutBasis: e.target.value as any })}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-xs text-slate-600 dark:text-slate-400 outline-none appearance-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        disabled={scheme.payoutType === 'FIXED'}
                                    >
                                        <option value="LOAN_AMOUNT">Loan Amount</option>
                                        <option value="GROSS_LOAN_AMOUNT">Gross Loan</option>
                                        <option value="DISBURSAL_AMOUNT">Disbursal</option>
                                        <option value="FIXED">Fixed Per Case</option>
                                    </select>
                                </div>
                            </div>

                            {/* Example Display */}
                            {scheme.payout > 0 && (
                                <div className="mt-4 px-4 py-3 bg-blue-50 dark:bg-blue-500/5 rounded-xl border border-blue-200 dark:border-blue-500/20">
                                    <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                                        Example:{' '}
                                        {scheme.payoutType === 'PERCENTAGE' ? `${scheme.payout}%` : `₹${scheme.payout}`}
                                        {scheme.payoutType === 'PERCENTAGE' &&
                                            ` of ${
                                                scheme.payoutBasis === 'LOAN_AMOUNT'
                                                    ? 'Loan Amount'
                                                    : scheme.payoutBasis === 'GROSS_LOAN_AMOUNT'
                                                      ? 'Gross Loan'
                                                      : scheme.payoutBasis === 'DISBURSAL_AMOUNT'
                                                        ? 'Disbursal'
                                                        : 'Fixed Per Case'
                                            }`}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                        {scheme.payoutType === 'PERCENTAGE'
                                            ? `On ₹1,00,000 ${scheme.payoutBasis?.replace(/_/g, ' ').toLowerCase() || 'loan'}: ₹${((100000 * scheme.payout) / 100).toLocaleString()}`
                                            : `Every case pays ₹${scheme.payout.toLocaleString()} commission`}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Row 2: EMI Waiver + Subvention */}
                        <div className="col-span-3 grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900/50 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-500/10">
                                <label className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-widest mb-3 flex items-center gap-2 block">
                                    <Tag size={12} /> EMI Waiver
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px]">
                                        Benefit
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Number of EMIs"
                                        value={scheme.emiWaiverCount || ''}
                                        onChange={e =>
                                            setScheme({ ...scheme, emiWaiverCount: Number(e.target.value) || 0 })
                                        }
                                        className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-700 dark:text-emerald-300 font-bold text-lg outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all pr-20"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-500/40 uppercase tracking-widest">
                                        Waived
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-slate-900/50 rounded-2xl p-6 border border-red-200 dark:border-red-500/10">
                                <label className="text-[10px] uppercase font-black text-red-600 dark:text-red-400 tracking-widest mb-3 flex items-center gap-2 block">
                                    <Minus size={12} /> Subvention
                                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 text-[8px]">
                                        Cost
                                    </span>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="Cost to You"
                                            value={scheme.subvention || ''}
                                            onChange={e =>
                                                setScheme({ ...scheme, subvention: Number(e.target.value) || 0 })
                                            }
                                            className="w-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-700 dark:text-red-300 font-bold text-lg outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={scheme.subventionType || 'PERCENTAGE'}
                                            onChange={e =>
                                                setScheme({ ...scheme, subventionType: e.target.value as any })
                                            }
                                            className="w-full h-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-3 font-black text-sm text-red-600 dark:text-red-300 outline-none appearance-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                                        >
                                            <option value="PERCENTAGE">%</option>
                                            <option value="FIXED">₹</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 mt-8 shadow-sm dark:shadow-2xl shadow-black/20">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 text-xs flex items-center justify-center border border-purple-500/10 dark:border-purple-500/20 shadow-lg shadow-purple-500/5 dark:shadow-purple-500/10">
                                    3
                                </span>
                                Charges & Fees
                            </h3>
                            <p className="text-[9px] text-slate-400 mt-1 ml-11 font-medium">
                                Select charges from master templates • All settings managed in Charges tab
                            </p>
                        </div>
                    </div>

                    {chargesMaster && chargesMaster.length > 0 && (
                        <div className="mb-8 p-4 bg-slate-50 dark:bg-white/[0.02] rounded-[24px] border border-slate-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <Settings size={12} className="text-slate-400" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        Master Templates
                                    </span>
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    {chargesMaster.length} Available
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {chargesMaster.map(master => {
                                    const isAlreadyAdded = scheme.charges.some(c => c.masterChargeId === master.id);
                                    return (
                                        <button
                                            key={master.id}
                                            disabled={isAlreadyAdded}
                                            onClick={() => {
                                                const newCharge: SchemeCharge = {
                                                    ...master,
                                                    id: generateDisplayId(),
                                                    masterChargeId: master.id,
                                                };
                                                setScheme({ ...scheme, charges: [...scheme.charges, newCharge] });
                                            }}
                                            className={`text-[9px] font-black uppercase tracking-tight px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                                                isAlreadyAdded
                                                    ? 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent cursor-not-allowed'
                                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm'
                                            }`}
                                        >
                                            {isAlreadyAdded ? (
                                                <Settings size={12} className="opacity-40" />
                                            ) : (
                                                <Plus size={12} />
                                            )}
                                            {master.name}
                                            {!isAlreadyAdded && (
                                                <span className="ml-1 opacity-40 font-bold">
                                                    ({master.value}
                                                    {master.type === 'PERCENTAGE'
                                                        ? '%'
                                                        : master.type === 'MONTHLY_FIXED'
                                                          ? '₹/mo'
                                                          : '₹'}
                                                    )
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {scheme.charges.length === 0 && (
                            <div className="bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center">
                                <Settings size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    No Charges Selected
                                </p>
                                <p className="text-[9px] text-slate-500 mt-1">
                                    {chargesMaster && chargesMaster.length > 0
                                        ? 'Select from master templates above'
                                        : 'Create master charges in Charges tab first'}
                                </p>
                            </div>
                        )}

                        {scheme.charges.map((charge, idx) => (
                            <div
                                key={charge.id}
                                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors shadow-sm"
                            >
                                {/* Read-Only Charge Display */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Charge Name & Source */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {charge.name}
                                            </h4>
                                            {charge.masterChargeId && (
                                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                    Master
                                                </span>
                                            )}
                                        </div>

                                        {/* Charge Details Grid */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Type Badge */}
                                            <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-500/20">
                                                {charge.type === 'PERCENTAGE'
                                                    ? '% Percentage'
                                                    : charge.type === 'FIXED'
                                                      ? '₹ Fixed'
                                                      : charge.type === 'MONTHLY_FIXED'
                                                        ? '₹/mo Fixed'
                                                        : 'Matrix'}
                                            </span>

                                            {/* Value Badge (if not Matrix) */}
                                            {charge.type !== 'TABLE' && (
                                                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-white/10">
                                                    {charge.type === 'PERCENTAGE'
                                                        ? `${charge.value}%`
                                                        : charge.type === 'MONTHLY_FIXED'
                                                          ? `₹${charge.value}/mo`
                                                          : `₹${charge.value}`}
                                                    {charge.type === 'PERCENTAGE' && charge.calculationBasis && (
                                                        <span className="ml-1.5 text-[9px] text-slate-500">
                                                            {charge.calculationBasis === 'LOAN_AMOUNT'
                                                                ? 'on Loan'
                                                                : charge.calculationBasis === 'GROSS_LOAN_AMOUNT'
                                                                  ? 'on Gross'
                                                                  : 'on Ex-Show'}
                                                        </span>
                                                    )}
                                                </span>
                                            )}

                                            {/* Impact Badge */}
                                            <span
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                    charge.impact === 'UPFRONT'
                                                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                                        : charge.impact === 'MONTHLY'
                                                          ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20'
                                                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                }`}
                                            >
                                                {charge.impact === 'UPFRONT'
                                                    ? 'Upfront'
                                                    : charge.impact === 'MONTHLY'
                                                      ? 'EMI Add-On'
                                                      : 'Funded'}
                                            </span>

                                            {/* GST Badge */}
                                            {charge.taxStatus && charge.taxStatus !== 'NOT_APPLICABLE' && (
                                                <span className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase tracking-widest border border-purple-200 dark:border-purple-500/20">
                                                    {charge.taxStatus === 'INCLUSIVE' ? 'GST Inc' : 'GST Exc'}{' '}
                                                    {charge.taxRate}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => removeCharge(charge.id)}
                                        className="ml-4 w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-all flex items-center justify-center border border-transparent"
                                        title="Remove from scheme"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* MATRIX EDITOR (Spreadsheet Style) */}
                                {charge.type === 'TABLE' && (
                                    <div className="mt-4 bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-inner">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                    Premium Rate Matrix
                                                </h4>
                                                <p className="text-[9px] text-slate-600 mt-1 uppercase font-black tracking-wider">
                                                    Configure fixed premiums by loan amount & tenure
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {showTenureInput === charge.id ? (
                                                    <div className="flex flex-col gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl animate-in fade-in slide-in-from-right-2 duration-300 w-64">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                placeholder="e.g. 11, 17, 23"
                                                                value={newTenureValue}
                                                                onChange={e => setNewTenureValue(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        const tenures = newTenureValue
                                                                            .split(',')
                                                                            .map(s => Number(s.trim()))
                                                                            .filter(t => !isNaN(t) && t > 0);
                                                                        if (tenures.length > 0) {
                                                                            const ranges: {
                                                                                min: number;
                                                                                max: number;
                                                                            }[] = [];
                                                                            charge.tableData?.forEach(r => {
                                                                                if (
                                                                                    !ranges.some(
                                                                                        rg =>
                                                                                            rg.min === r.minAge &&
                                                                                            rg.max === r.maxAge
                                                                                    )
                                                                                ) {
                                                                                    ranges.push({
                                                                                        min: r.minAge,
                                                                                        max: r.maxAge,
                                                                                    });
                                                                                }
                                                                            });

                                                                            let allNewRules = [
                                                                                ...(charge.tableData || []),
                                                                            ];
                                                                            tenures.forEach(t => {
                                                                                const exists = charge.tableData?.some(
                                                                                    r => r.tenure === t
                                                                                );
                                                                                if (!exists) {
                                                                                    const newRules =
                                                                                        ranges.length > 0
                                                                                            ? ranges.map(range => ({
                                                                                                  minAge: range.min,
                                                                                                  maxAge: range.max,
                                                                                                  tenure: t,
                                                                                                  rate: 0,
                                                                                              }))
                                                                                            : [
                                                                                                  {
                                                                                                      minAge: 0,
                                                                                                      maxAge: 0,
                                                                                                      tenure: t,
                                                                                                      rate: 0,
                                                                                                  },
                                                                                              ];
                                                                                    allNewRules = [
                                                                                        ...allNewRules,
                                                                                        ...newRules,
                                                                                    ];
                                                                                }
                                                                            });
                                                                            updateCharge(charge.id, {
                                                                                tableData: allNewRules,
                                                                            });
                                                                            setNewTenureValue('');
                                                                            setShowTenureInput(null);
                                                                        }
                                                                    }
                                                                    if (e.key === 'Escape') setShowTenureInput(null);
                                                                }}
                                                                className="flex-1 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none"
                                                            />
                                                            <button
                                                                onClick={() => setShowTenureInput(null)}
                                                                className="text-[10px] font-black uppercase text-slate-500 hover:text-red-500 transition-colors"
                                                            >
                                                                <Plus size={14} className="rotate-45" />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                                Quick Presets
                                                            </p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {[
                                                                    { label: 'Standard', vals: [12, 24, 36, 48, 60] },
                                                                    { label: 'Micro', vals: [3, 6, 9, 12, 18, 24] },
                                                                    { label: 'Odd', vals: [11, 17, 23, 35] },
                                                                    { label: 'Short', vals: [12, 18, 24] },
                                                                ].map(preset => (
                                                                    <button
                                                                        key={preset.label}
                                                                        onClick={() => {
                                                                            const ranges: {
                                                                                min: number;
                                                                                max: number;
                                                                            }[] = [];
                                                                            charge.tableData?.forEach(r => {
                                                                                if (
                                                                                    !ranges.some(
                                                                                        rg =>
                                                                                            rg.min === r.minAge &&
                                                                                            rg.max === r.maxAge
                                                                                    )
                                                                                ) {
                                                                                    ranges.push({
                                                                                        min: r.minAge,
                                                                                        max: r.maxAge,
                                                                                    });
                                                                                }
                                                                            });

                                                                            let allNewRules = [
                                                                                ...(charge.tableData || []),
                                                                            ];
                                                                            preset.vals.forEach(t => {
                                                                                const exists = charge.tableData?.some(
                                                                                    r => r.tenure === t
                                                                                );
                                                                                if (!exists) {
                                                                                    const newRules =
                                                                                        ranges.length > 0
                                                                                            ? ranges.map(range => ({
                                                                                                  minAge: range.min,
                                                                                                  maxAge: range.max,
                                                                                                  tenure: t,
                                                                                                  rate: 0,
                                                                                              }))
                                                                                            : [
                                                                                                  {
                                                                                                      minAge: 0,
                                                                                                      maxAge: 0,
                                                                                                      tenure: t,
                                                                                                      rate: 0,
                                                                                                  },
                                                                                              ];
                                                                                    allNewRules = [
                                                                                        ...allNewRules,
                                                                                        ...newRules,
                                                                                    ];
                                                                                }
                                                                            });
                                                                            updateCharge(charge.id, {
                                                                                tableData: allNewRules,
                                                                            });
                                                                            setShowTenureInput(null);
                                                                        }}
                                                                        className="bg-slate-50 dark:bg-white/5 hover:bg-blue-500 hover:text-white border border-slate-200 dark:border-white/5 rounded-lg py-1.5 px-2 text-[9px] font-bold text-slate-500 dark:text-slate-400 text-left transition-all truncate"
                                                                    >
                                                                        {preset.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('Clear all columns?')) {
                                                                        updateCharge(charge.id, { tableData: [] });
                                                                        setShowTenureInput(null);
                                                                    }
                                                                }}
                                                                className="text-[9px] font-black uppercase text-red-500 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                                                            >
                                                                Clear All
                                                            </button>
                                                            <p className="text-[8px] text-slate-400 italic">
                                                                Comma separated for bulk
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setNewTenureValue('');
                                                            setShowTenureInput(charge.id);
                                                        }}
                                                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all border border-slate-200 dark:border-white/5 active:scale-95"
                                                    >
                                                        + Add Tenure
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        const currentTenures = Array.from(
                                                            new Set(
                                                                charge.tableData?.map(r => r.tenure) || [
                                                                    12, 24, 36, 48, 60,
                                                                ]
                                                            )
                                                        );
                                                        const newRange = { min: 0, max: 0 };
                                                        const newRules = currentTenures.map(t => ({
                                                            minAge: newRange.min,
                                                            maxAge: newRange.max,
                                                            tenure: t,
                                                            rate: 0,
                                                        }));
                                                        updateCharge(charge.id, {
                                                            tableData: [...(charge.tableData || []), ...newRules],
                                                        });
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
                                                    <tr className="bg-slate-50 dark:bg-white/5">
                                                        <th className="p-2 border border-slate-200 dark:border-white/5 text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 w-24">
                                                            Min Amount
                                                        </th>
                                                        <th className="p-2 border border-slate-200 dark:border-white/5 text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 w-24">
                                                            Max Amount
                                                        </th>
                                                        {Array.from(
                                                            new Set(
                                                                charge.tableData?.map(r => r.tenure) || [
                                                                    12, 24, 36, 48, 60,
                                                                ]
                                                            )
                                                        )
                                                            .sort((a, b) => a - b)
                                                            .map(t => (
                                                                <th
                                                                    key={t}
                                                                    className="p-2 border border-white/5 text-[9px] uppercase font-black text-blue-400 group relative"
                                                                >
                                                                    {t} Months
                                                                    <button
                                                                        onClick={() => {
                                                                            const newData = charge.tableData?.filter(
                                                                                r => r.tenure !== t
                                                                            );
                                                                            updateCharge(charge.id, {
                                                                                tableData: newData,
                                                                            });
                                                                        }}
                                                                        className="absolute -top-1 -right-1 text-slate-800 dark:text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 rounded-full p-0.5"
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
                                                        const ranges: { min: number; max: number }[] = [];
                                                        charge.tableData?.forEach(r => {
                                                            if (
                                                                !ranges.some(
                                                                    rg => rg.min === r.minAge && rg.max === r.maxAge
                                                                )
                                                            ) {
                                                                ranges.push({ min: r.minAge, max: r.maxAge });
                                                            }
                                                        });

                                                        const sortedTenures = Array.from(
                                                            new Set(
                                                                charge.tableData?.map(r => r.tenure) || [
                                                                    12, 24, 36, 48, 60,
                                                                ]
                                                            )
                                                        ).sort((a, b) => a - b);

                                                        return ranges.map((range, rgIdx) => (
                                                            <tr
                                                                key={rgIdx}
                                                                className="hover:bg-white/[0.02] transition-colors"
                                                            >
                                                                <td className="p-1 border border-slate-200 dark:border-white/5">
                                                                    <input
                                                                        type="number"
                                                                        value={range.min}
                                                                        onChange={e => {
                                                                            const val = Number(e.target.value);
                                                                            const newData = charge.tableData?.map(r =>
                                                                                r.minAge === range.min &&
                                                                                r.maxAge === range.max
                                                                                    ? { ...r, minAge: val }
                                                                                    : r
                                                                            );
                                                                            updateCharge(charge.id, {
                                                                                tableData: newData,
                                                                            });
                                                                        }}
                                                                        className="w-full bg-transparent p-2 text-xs text-slate-900 dark:text-white font-mono text-center outline-none focus:bg-slate-100 dark:focus:bg-white/5"
                                                                        placeholder="Min ₹"
                                                                    />
                                                                </td>
                                                                <td className="p-1 border border-slate-200 dark:border-white/5">
                                                                    <input
                                                                        type="number"
                                                                        value={range.max}
                                                                        onChange={e => {
                                                                            const val = Number(e.target.value);
                                                                            const newData = charge.tableData?.map(r =>
                                                                                r.minAge === range.min &&
                                                                                r.maxAge === range.max
                                                                                    ? { ...r, maxAge: val }
                                                                                    : r
                                                                            );
                                                                            updateCharge(charge.id, {
                                                                                tableData: newData,
                                                                            });
                                                                        }}
                                                                        className="w-full bg-transparent p-2 text-xs text-slate-900 dark:text-white font-mono text-center outline-none focus:bg-slate-100 dark:focus:bg-white/5"
                                                                        placeholder="Max ₹"
                                                                    />
                                                                </td>
                                                                {sortedTenures.map(t => {
                                                                    const rule = charge.tableData?.find(
                                                                        r =>
                                                                            r.minAge === range.min &&
                                                                            r.maxAge === range.max &&
                                                                            r.tenure === t
                                                                    );
                                                                    return (
                                                                        <td
                                                                            key={t}
                                                                            className="p-1 border border-white/5 bg-emerald-500/[0.02]"
                                                                        >
                                                                            <input
                                                                                type="number"
                                                                                value={rule?.rate || 0}
                                                                                onChange={e => {
                                                                                    const val = Number(e.target.value);
                                                                                    if (rule) {
                                                                                        const newData =
                                                                                            charge.tableData?.map(r =>
                                                                                                r === rule
                                                                                                    ? {
                                                                                                          ...r,
                                                                                                          rate: val,
                                                                                                      }
                                                                                                    : r
                                                                                            );
                                                                                        updateCharge(charge.id, {
                                                                                            tableData: newData,
                                                                                        });
                                                                                    } else {
                                                                                        const newRule = {
                                                                                            minAge: range.min,
                                                                                            maxAge: range.max,
                                                                                            tenure: t,
                                                                                            rate: val,
                                                                                        };
                                                                                        updateCharge(charge.id, {
                                                                                            tableData: [
                                                                                                ...(charge.tableData ||
                                                                                                    []),
                                                                                                newRule,
                                                                                            ],
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                className="w-full bg-transparent p-2 text-xs text-emerald-600 dark:text-emerald-400 font-black text-center outline-none focus:bg-emerald-500/10 transition-colors"
                                                                                placeholder="₹"
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="p-1 border border-white/5 text-center">
                                                                    <button
                                                                        onClick={() => {
                                                                            const newData = charge.tableData?.filter(
                                                                                r =>
                                                                                    !(
                                                                                        r.minAge === range.min &&
                                                                                        r.maxAge === range.max
                                                                                    )
                                                                            );
                                                                            updateCharge(charge.id, {
                                                                                tableData: newData,
                                                                            });
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
                                                            <td
                                                                colSpan={10}
                                                                className="text-center py-10 bg-slate-50 dark:bg-black/10"
                                                            >
                                                                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">
                                                                    Spreadsheet Empty
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 dark:text-slate-700 mt-1">
                                                                    Click "+ Add Range" or "+ Add Tenure" to start.
                                                                </p>
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
                    <button
                        onClick={() => onSave(scheme)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        <Save size={18} /> Save Scheme
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* RIGHT: LIVE CALCULATOR PREVIEW */}
            <div className="xl:w-[450px] space-y-8 sticky top-8 h-fit self-start">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm dark:shadow-2xl shadow-black/40 flex flex-col">
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-black italic text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/10 dark:border-emerald-500/20 shadow-lg shadow-emerald-500/5 dark:shadow-emerald-500/10">
                                    <Calculator size={24} />
                                </span>
                                SIMULATION
                            </h2>
                            <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    Live Engine
                                </span>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-12">
                            Real-time behavior analysis
                        </p>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-6 bg-slate-50 dark:bg-black/20 p-8 rounded-[24px] border border-slate-200 dark:border-white/5 mb-8">
                        <div>
                            <div className="flex justify-between mb-2 px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Vehicle Price
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-500">
                                        MAX LTV: {scheme.maxLTV}%
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/10" />
                                    <span className="text-[10px] font-mono font-black text-purple-600 dark:text-purple-400">
                                        MAX LOAN: ₹{scheme.maxLoanAmount?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <ArrowRight size={10} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    Resolved Limit:{' '}
                                    <span className="text-blue-600 dark:text-blue-400">
                                        ₹
                                        {Math.min(
                                            (testPrice * scheme.maxLTV) / 100,
                                            scheme.maxLoanAmount || 0
                                        ).toLocaleString()}
                                    </span>
                                </span>
                            </div>
                            <div className="flex flex-col mt-4">
                                <h2 className="text-4xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">
                                    {scheme.name || 'Untitled Scheme'}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Scheme CID:
                                    </span>
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                        {formatDisplayIdForUI(scheme.id)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">
                                ₹
                            </span>
                            <input
                                type="number"
                                value={testPrice}
                                onChange={e => setTestPrice(Number(e.target.value))}
                                className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-[16px] pl-8 pr-4 py-4 font-mono text-xl text-slate-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all group-hover:border-slate-300 dark:group-hover:border-white/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2 px-1">
                                Requested Loan
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    value={testLoan}
                                    onChange={e => setTestLoan(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-[16px] pl-8 pr-4 py-4 font-mono text-lg text-slate-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all group-hover:border-slate-300 dark:group-hover:border-white/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2 px-1">
                                Applicant Age
                            </label>
                            <input
                                type="number"
                                value={testAge}
                                onChange={e => setTestAge(Number(e.target.value))}
                                className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-[16px] px-4 py-4 font-mono text-lg text-slate-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all group-hover:border-slate-300 dark:group-hover:border-white/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Results Card */}
                {debugResult && Array.isArray(debugResult) && debugResult.length > 0 && (
                    <div className="space-y-6">
                        {/* Summary using first result (or appropriate default) */}
                        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900 dark:to-purple-900 border border-indigo-100 dark:border-indigo-500/30 rounded-[28px] p-8 relative overflow-hidden shadow-sm dark:shadow-2xl shadow-indigo-500/20">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -z-0" />
                            <div className="relative z-10">
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-[0.2em] block mb-2">
                                    Customer Pays
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                                        ₹{debugResult[0].downpayment.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">
                                        Upfront
                                    </span>
                                </div>
                                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-indigo-200/50">
                                        <span>Margin Money</span>
                                        <span className="text-slate-900 dark:text-white font-mono">
                                            ₹
                                            {(
                                                testPrice -
                                                Math.min(
                                                    testLoan,
                                                    Math.min(
                                                        (testPrice * scheme.maxLTV) / 100,
                                                        scheme.maxLoanAmount || 0
                                                    )
                                                )
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-indigo-200/50">
                                        <span>Charges & Addons</span>
                                        <span className="text-slate-900 dark:text-white font-mono">
                                            + ₹{debugResult[0].upfrontCharges.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tenure Matrix Results */}
                        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[28px] overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-white/5">
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">
                                    EMI Scenarios by Tenure
                                </h4>
                            </div>
                            <div className="divide-y divide-slate-200 dark:divide-white/5">
                                {debugResult.map((res: any) => (
                                    <div
                                        key={res.tenure}
                                        className="flex flex-col p-6 hover:bg-white/[0.02] transition-colors border-b last:border-0 border-slate-200 dark:border-white/5"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <div className="text-xs font-black text-slate-900 dark:text-white italic tracking-tight">
                                                    {res.tenure} Months
                                                </div>
                                                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                                    ₹{res.grossLoan.toLocaleString()} Loan
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                                                    ₹{res.emi.toLocaleString()}
                                                </div>
                                                <div className="text-[9px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">
                                                    Calculated EMI
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                    Outflow & IRR
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                                        ₹{res.totalOutflow.toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                                                        {(res.irr ?? scheme.interestRate ?? 0).toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[8px] font-black text-purple-500 uppercase tracking-[0.2em]">
                                                    APR
                                                </span>
                                                <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded-md">
                                                    {(res.apr ?? 0).toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                                                    Net Margin
                                                </span>
                                                <div className="flex items-center gap-2 justify-end">
                                                    {res.waiverBenefit > 0 && (
                                                        <span className="text-[9px] font-black text-emerald-400">
                                                            -{res.waiverBenefit.toLocaleString()} Benefit
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`text-xs font-mono font-bold ${res.netMargin >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                                                    >
                                                        ₹{Math.round(res.netMargin).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payout & Yield Analysis */}
                        <div className="space-y-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[28px] p-6 flex items-center justify-between shadow-lg shadow-emerald-500/5">
                                <div>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-1">
                                        Your Net Margin
                                    </span>
                                    <p className="text-[9px] text-emerald-600/60 uppercase font-black tracking-widest">
                                        Payout - Subvention
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`font-mono font-black text-lg ${debugResult[0].netMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                    >
                                        ₹{Math.round(debugResult[0].netMargin).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[28px] p-6 flex items-center justify-between shadow-lg shadow-blue-500/5">
                                <div>
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-1">
                                        Customer IRR (APR)
                                    </span>
                                    <p className="text-[9px] text-blue-600/60 uppercase font-black tracking-widest">
                                        Base Analysis ({debugResult[0].tenure}M)
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="font-mono font-black text-blue-400 text-lg">
                                        {debugResult[0].apr.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
