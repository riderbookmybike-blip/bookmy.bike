import React, { useState, useEffect } from 'react';
import { BankPartner, SchemeCharge, PremiumTableCell } from '@/types/bankPartner';
import {
    CreditCard,
    Plus,
    Trash2,
    Edit3,
    Settings,
    Info,
    Tag,
    Percent,
    IndianRupee,
    X,
    Save,
    Loader2,
    Grid3X3,
} from 'lucide-react';
import { updateBankChargesMaster } from '../actions';

export default function ChargesTab({
    partner,
    onSaveSuccess,
}: {
    partner: BankPartner;
    onSaveSuccess?: (charges: SchemeCharge[]) => void;
}) {
    const [charges, setCharges] = useState<SchemeCharge[]>(partner.chargesMaster || []);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
    const [newCharge, setNewCharge] = useState<Partial<SchemeCharge>>({
        name: '',
        type: 'FIXED',
        calculationBasis: 'LOAN_AMOUNT',
        impact: 'UPFRONT',
        value: 0,
        taxStatus: 'NOT_APPLICABLE',
    });

    // Matrix state for TABLE type
    const [tenures, setTenures] = useState<number[]>([12, 24, 36]);
    const [laRanges, setLaRanges] = useState<{ min: number; max: number }[]>([
        { min: 30000, max: 80000 },
        { min: 80001, max: 150000 },
        { min: 150001, max: 300000 },
    ]);
    const [matrixValues, setMatrixValues] = useState<Record<string, number>>({});
    const [newTenure, setNewTenure] = useState('');
    const [newLAMin, setNewLAMin] = useState('');
    const [newLAMax, setNewLAMax] = useState('');

    useEffect(() => {
        setCharges(partner.chargesMaster || []);
    }, [partner.chargesMaster]);

    const handleSaveMaster = async () => {
        setIsSaving(true);
        try {
            const res = await updateBankChargesMaster(partner.id, charges);
            if (!res.success) {
                alert('Error saving charges master: ' + res.error);
            } else {
                onSaveSuccess?.(charges);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddCharge = () => {
        if (!newCharge.name) return;
        if (newCharge.type !== 'TABLE' && newCharge.value === undefined) return;

        // Build premiumTable from matrix state
        let premiumTable: PremiumTableCell[] | undefined;
        if (newCharge.type === 'TABLE') {
            premiumTable = [];
            for (const t of tenures) {
                for (const la of laRanges) {
                    const key = `${t}_${la.min}_${la.max}`;
                    premiumTable.push({
                        tenure: t,
                        minLA: la.min,
                        maxLA: la.max,
                        value: matrixValues[key] || 0,
                    });
                }
            }
        }

        if (editingChargeId) {
            setCharges(
                charges.map(c =>
                    c.id === editingChargeId
                        ? {
                              ...c,
                              name: newCharge.name!,
                              type: newCharge.type as any,
                              calculationBasis: newCharge.calculationBasis as any,
                              impact: newCharge.impact as any,
                              value: Number(newCharge.value || 0),
                              taxStatus: (newCharge.taxStatus || 'NOT_APPLICABLE') as any,
                              taxRate: newCharge.taxRate,
                              premiumTable,
                          }
                        : c
                )
            );
        } else {
            const charge: SchemeCharge = {
                id: `c${Date.now()}`,
                name: newCharge.name,
                type: newCharge.type as any,
                calculationBasis: newCharge.calculationBasis as any,
                impact: newCharge.impact as any,
                value: Number(newCharge.value || 0),
                taxStatus: (newCharge.taxStatus || 'NOT_APPLICABLE') as any,
                taxRate: newCharge.taxRate,
                premiumTable,
            };
            setCharges([...charges, charge]);
        }

        setIsModalOpen(false);
        setEditingChargeId(null);
        setNewCharge({
            name: '',
            type: 'FIXED',
            calculationBasis: 'LOAN_AMOUNT',
            impact: 'UPFRONT',
            value: 0,
            taxStatus: 'NOT_APPLICABLE',
        });
        setMatrixValues({});
    };

    return (
        <div className="p-12 pt-4">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                        <CreditCard size={32} className="text-blue-500" />
                        Charges Master
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 ml-12">
                        Standardized Global Fee Templates
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSaveMaster}
                        disabled={isSaving}
                        className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 shadow-sm"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {isSaving ? 'Saving...' : 'Save Master Changes'}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={16} /> New Charge Template
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Main List */}
                <div className="col-span-12 lg:col-span-8 space-y-4">
                    {charges.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[40px] p-20 text-center">
                            <Tag size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-6" />
                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs mb-6">
                                No master charges defined for this partner
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-blue-500 font-black uppercase tracking-widest text-[10px] hover:underline"
                            >
                                Define common charges like PF, Doc, Stamping
                            </button>
                        </div>
                    ) : (
                        charges.map(charge => (
                            <div
                                key={charge.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-blue-500/50 transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-black/40 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-white/5">
                                        {charge.type === 'PERCENTAGE' ? (
                                            <Percent size={24} />
                                        ) : (
                                            <IndianRupee size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg">
                                            {charge.name}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">
                                                {charge.type === 'TABLE'
                                                    ? 'MATRIX'
                                                    : charge.type === 'MONTHLY_FIXED'
                                                      ? 'MONTHLY'
                                                      : charge.type}{' '}
                                                • {charge.calculationBasis.replace(/_/g, ' ')}
                                            </span>
                                            <span
                                                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                    charge.impact === 'UPFRONT'
                                                        ? 'bg-amber-500/10 text-amber-600'
                                                        : charge.impact === 'MONTHLY'
                                                          ? 'bg-violet-500/10 text-violet-600'
                                                          : 'bg-emerald-500/10 text-emerald-600'
                                                }`}
                                            >
                                                {charge.impact === 'MONTHLY' ? 'EMI ADD-ON' : charge.impact}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            {charge.type === 'TABLE' ? (
                                                <span className="flex items-center gap-1">
                                                    <Grid3X3 size={18} /> Matrix
                                                </span>
                                            ) : charge.type === 'MONTHLY_FIXED' ? (
                                                `₹${charge.value.toLocaleString()}/mo`
                                            ) : charge.type === 'PERCENTAGE' ? (
                                                `${charge.value}%`
                                            ) : (
                                                `₹${charge.value.toLocaleString()}`
                                            )}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            Default Value
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingChargeId(charge.id);
                                                setNewCharge({
                                                    name: charge.name,
                                                    type: charge.type,
                                                    calculationBasis: charge.calculationBasis,
                                                    impact: charge.impact,
                                                    value: charge.value,
                                                    taxStatus: charge.taxStatus || 'NOT_APPLICABLE',
                                                    taxRate: charge.taxRate,
                                                });
                                                // Restore matrix state from premiumTable
                                                if (charge.type === 'TABLE' && charge.premiumTable?.length) {
                                                    const t = [...new Set(charge.premiumTable.map(c => c.tenure))].sort(
                                                        (a, b) => a - b
                                                    );
                                                    const ranges: { min: number; max: number }[] = [];
                                                    const seen = new Set<string>();
                                                    charge.premiumTable.forEach(c => {
                                                        const k = `${c.minLA}_${c.maxLA}`;
                                                        if (!seen.has(k)) {
                                                            seen.add(k);
                                                            ranges.push({ min: c.minLA, max: c.maxLA });
                                                        }
                                                    });
                                                    const vals: Record<string, number> = {};
                                                    charge.premiumTable.forEach(c => {
                                                        vals[`${c.tenure}_${c.minLA}_${c.maxLA}`] = c.value;
                                                    });
                                                    setTenures(t);
                                                    setLaRanges(ranges);
                                                    setMatrixValues(vals);
                                                } else {
                                                    setTenures([12, 24, 36]);
                                                    setLaRanges([
                                                        { min: 30000, max: 80000 },
                                                        { min: 80001, max: 150000 },
                                                        { min: 150001, max: 300000 },
                                                    ]);
                                                    setMatrixValues({});
                                                }
                                                setIsModalOpen(true);
                                            }}
                                            className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                                            title="Edit charge"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setCharges(charges.filter(c => c.id !== charge.id))}
                                            className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                            title="Delete charge"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Sidebar context */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 space-y-6 text-slate-600 dark:text-slate-400">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Settings size={16} className="text-slate-400" />
                            Configuration Rules
                        </h4>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <p className="text-[10px] font-medium leading-relaxed italic">
                                    Master charges serve as blueprints. Updating a master charge will propagate defaults
                                    to all newly created schemes.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <p className="text-[10px] font-medium leading-relaxed italic">
                                    Marketplace vs Backend: Charges defined here are active at the DB level even if
                                    hidden from retail users.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-[32px] p-6 space-y-4 shadow-xl shadow-yellow-500/5">
                        <div className="flex items-center gap-2">
                            <Info size={16} className="text-yellow-600 dark:text-yellow-400" />
                            <span className="text-[10px] font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">
                                Financial Safety
                            </span>
                        </div>
                        <p className="text-xs font-bold leading-tight text-yellow-800 dark:text-yellow-400/80">
                            "Charges marked as 'UPFRONT' will increase the Customer Outflow (Downpayment) without
                            affecting the Loan Amount."
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] overflow-y-auto">
                        <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/20">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {editingChargeId ? 'Edit Master Charge' : 'Create Master Charge'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {editingChargeId
                                        ? 'Modify existing fee template'
                                        : 'Definition of a standard fee template'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingChargeId(null);
                                    setNewCharge({
                                        name: '',
                                        type: 'FIXED',
                                        calculationBasis: 'LOAN_AMOUNT',
                                        impact: 'UPFRONT',
                                        value: 0,
                                        taxStatus: 'NOT_APPLICABLE',
                                    });
                                }}
                                className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Charge Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Processing Fee"
                                    value={newCharge.name}
                                    onChange={e => setNewCharge({ ...newCharge, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        Type
                                    </label>
                                    <select
                                        value={newCharge.type}
                                        onChange={e => {
                                            const type = e.target.value as any;
                                            const updates: any = { type };
                                            if (type === 'MONTHLY_FIXED') updates.impact = 'MONTHLY';
                                            setNewCharge({ ...newCharge, ...updates });
                                        }}
                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:border-blue-500 transition-all appearance-none"
                                    >
                                        <option value="FIXED">Fixed Amount (₹)</option>
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="MONTHLY_FIXED">Monthly Fixed (₹/mo in EMI)</option>
                                        <option value="TABLE">Matrix (Premium Table)</option>
                                    </select>
                                </div>
                                {newCharge.type !== 'TABLE' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                            Default Value
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newCharge.value}
                                            onChange={e =>
                                                setNewCharge({ ...newCharge, value: Number(e.target.value) })
                                            }
                                            className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Matrix Grid — shown only for TABLE type */}
                            {newCharge.type === 'TABLE' && (
                                <div className="space-y-6">
                                    {/* ── Section 1: Tenure Builder ── */}
                                    <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            📅 Tenures (months)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {tenures.map((t, i) => (
                                                <span
                                                    key={t}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-full text-xs font-black"
                                                >
                                                    {t} mo
                                                    <button
                                                        onClick={() => setTenures(tenures.filter((_, j) => j !== i))}
                                                        className="hover:text-red-500 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                            {tenures.length === 0 && (
                                                <span className="text-[10px] text-slate-400 italic">
                                                    No tenures defined
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <input
                                                type="number"
                                                placeholder="e.g. 48"
                                                value={newTenure}
                                                onChange={e => setNewTenure(e.target.value)}
                                                className="w-24 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                            />
                                            <button
                                                onClick={() => {
                                                    const t = Number(newTenure);
                                                    if (t > 0 && !tenures.includes(t)) {
                                                        setTenures([...tenures, t].sort((a, b) => a - b));
                                                        setNewTenure('');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── Section 2: LA Range Builder ── */}
                                    <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            💰 Loan Amount Ranges
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {laRanges.map((la, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-black"
                                                >
                                                    ₹{(la.min / 1000).toFixed(0)}K – ₹{(la.max / 1000).toFixed(0)}K
                                                    <button
                                                        onClick={() => setLaRanges(laRanges.filter((_, j) => j !== i))}
                                                        className="hover:text-red-500 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                            {laRanges.length === 0 && (
                                                <span className="text-[10px] text-slate-400 italic">
                                                    No ranges defined
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <input
                                                type="number"
                                                placeholder="Min ₹"
                                                value={newLAMin}
                                                onChange={e => setNewLAMin(e.target.value)}
                                                className="w-24 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                            />
                                            <span className="text-xs text-slate-400 font-bold">–</span>
                                            <input
                                                type="number"
                                                placeholder="Max ₹"
                                                value={newLAMax}
                                                onChange={e => setNewLAMax(e.target.value)}
                                                className="w-24 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                            />
                                            <button
                                                onClick={() => {
                                                    const mn = Number(newLAMin);
                                                    const mx = Number(newLAMax);
                                                    if (mn > 0 && mx > mn) {
                                                        setLaRanges([...laRanges, { min: mn, max: mx }]);
                                                        setNewLAMin('');
                                                        setNewLAMax('');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── Section 3: Auto-Fill Helper ── */}
                                    {tenures.length > 0 && laRanges.length > 0 && (
                                        <div className="space-y-3 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-200/50 dark:border-amber-500/10">
                                            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                                ⚡ Quick Fill — Auto-increment per month
                                            </label>
                                            <p className="text-[10px] text-amber-500/80">
                                                Set a base amount and monthly increment. Amounts = Base + (Tenure ×
                                                Increment)
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-amber-500 uppercase">
                                                        Base ₹
                                                    </span>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 200"
                                                        id="autofill-base"
                                                        className="w-24 bg-white dark:bg-black/40 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-amber-500 uppercase">
                                                        +₹/month
                                                    </span>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 50"
                                                        id="autofill-increment"
                                                        className="w-24 bg-white dark:bg-black/40 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const baseEl = document.getElementById(
                                                            'autofill-base'
                                                        ) as HTMLInputElement;
                                                        const incEl = document.getElementById(
                                                            'autofill-increment'
                                                        ) as HTMLInputElement;
                                                        const base = Number(baseEl?.value || 0);
                                                        const inc = Number(incEl?.value || 0);
                                                        if (base <= 0) return;
                                                        const newVals = { ...matrixValues };
                                                        for (const t of tenures) {
                                                            for (const la of laRanges) {
                                                                newVals[`${t}_${la.min}_${la.max}`] = base + t * inc;
                                                            }
                                                        }
                                                        setMatrixValues(newVals);
                                                    }}
                                                    className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all"
                                                >
                                                    Fill All
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Section 4: The Matrix Table ── */}
                                    {tenures.length > 0 && laRanges.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <Grid3X3 size={14} /> Charge Matrix — enter ₹ amounts
                                            </label>
                                            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-slate-50 dark:bg-black/20">
                                                            <th className="px-3 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-white/10 whitespace-nowrap">
                                                                LA Range ↓ / Tenure →
                                                            </th>
                                                            {tenures.map(t => (
                                                                <th
                                                                    key={t}
                                                                    className="px-3 py-3 text-center text-[10px] font-black text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-white/10 last:border-r-0 whitespace-nowrap"
                                                                >
                                                                    {t} mo
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {laRanges.map((la, ri) => (
                                                            <tr
                                                                key={ri}
                                                                className="border-t border-slate-100 dark:border-white/5"
                                                            >
                                                                <td className="px-3 py-2 border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/10 whitespace-nowrap">
                                                                    <span className="font-black text-[10px] text-slate-600 dark:text-slate-300">
                                                                        ₹{(la.min / 1000).toFixed(0)}K – ₹
                                                                        {(la.max / 1000).toFixed(0)}K
                                                                    </span>
                                                                </td>
                                                                {tenures.map(t => {
                                                                    const key = `${t}_${la.min}_${la.max}`;
                                                                    return (
                                                                        <td
                                                                            key={t}
                                                                            className="px-1 py-1 border-r border-slate-100 dark:border-white/5 last:border-r-0"
                                                                        >
                                                                            <input
                                                                                type="number"
                                                                                placeholder="₹"
                                                                                value={matrixValues[key] || ''}
                                                                                onChange={e =>
                                                                                    setMatrixValues({
                                                                                        ...matrixValues,
                                                                                        [key]: Number(e.target.value),
                                                                                    })
                                                                                }
                                                                                className="w-full bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-lg px-2 py-2 text-xs font-mono font-bold text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {tenures.length === 0 && laRanges.length === 0 && (
                                        <div className="text-center py-8 text-slate-400">
                                            <Grid3X3 size={32} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-xs font-bold">
                                                Add tenures and loan amount ranges above to build the matrix
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Customer Impact
                                    {newCharge.type === 'MONTHLY_FIXED' && (
                                        <span className="ml-2 text-violet-500 normal-case tracking-normal font-bold">
                                            (auto-set to Monthly for this type)
                                        </span>
                                    )}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setNewCharge({ ...newCharge, impact: 'UPFRONT' })}
                                        disabled={newCharge.type === 'MONTHLY_FIXED'}
                                        className={`px-4 py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-30 disabled:cursor-not-allowed ${newCharge.impact === 'UPFRONT' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-500 hover:border-blue-500'}`}
                                    >
                                        Upfront
                                    </button>
                                    <button
                                        onClick={() => setNewCharge({ ...newCharge, impact: 'FUNDED' })}
                                        disabled={newCharge.type === 'MONTHLY_FIXED'}
                                        className={`px-4 py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-30 disabled:cursor-not-allowed ${newCharge.impact === 'FUNDED' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-500 hover:border-blue-500'}`}
                                    >
                                        Funded
                                    </button>
                                    <button
                                        onClick={() => setNewCharge({ ...newCharge, impact: 'MONTHLY' })}
                                        className={`px-4 py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all ${newCharge.impact === 'MONTHLY' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-500 hover:border-violet-500'}`}
                                    >
                                        EMI Add-On
                                    </button>
                                </div>
                            </div>

                            {/* GST Configuration */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    GST Settings
                                </label>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={newCharge.taxStatus || 'NOT_APPLICABLE'}
                                        onChange={e =>
                                            setNewCharge({
                                                ...newCharge,
                                                taxStatus: e.target.value as any,
                                                taxRate:
                                                    e.target.value === 'EXCLUSIVE'
                                                        ? newCharge.taxRate || 18
                                                        : newCharge.taxRate,
                                            })
                                        }
                                        className="flex-1 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:border-blue-500 transition-all appearance-none"
                                    >
                                        <option value="NOT_APPLICABLE">Not Applicable</option>
                                        <option value="INCLUSIVE">GST Inclusive</option>
                                        <option value="EXCLUSIVE">GST Exclusive</option>
                                    </select>

                                    {newCharge.taxStatus && newCharge.taxStatus !== 'NOT_APPLICABLE' && (
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-4">
                                            <input
                                                type="number"
                                                value={newCharge.taxRate || 0}
                                                onChange={e =>
                                                    setNewCharge({ ...newCharge, taxRate: Number(e.target.value) })
                                                }
                                                className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs font-mono font-black text-slate-900 dark:text-white outline-none"
                                                placeholder="18"
                                            />
                                            <span className="text-xs font-black text-slate-500">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleAddCharge}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] py-6 rounded-[24px] shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                            >
                                Add Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
