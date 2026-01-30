import React, { useState, useEffect } from 'react';
import { BankPartner, SchemeCharge } from '@/types/bankPartner';
import { CreditCard, Plus, Trash2, Edit3, Settings, Info, Tag, Percent, IndianRupee, X, Save, Loader2 } from 'lucide-react';
import { updateBankChargesMaster } from '../actions';

export default function ChargesTab({ partner, onSaveSuccess }: { partner: BankPartner; onSaveSuccess?: (charges: SchemeCharge[]) => void }) {
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
        taxStatus: 'NOT_APPLICABLE'
    });

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
        if (!newCharge.name || newCharge.value === undefined) return;

        if (editingChargeId) {
            // Update existing charge
            setCharges(charges.map(c => c.id === editingChargeId ? {
                ...c,
                name: newCharge.name!,
                type: newCharge.type as any,
                calculationBasis: newCharge.calculationBasis as any,
                impact: newCharge.impact as any,
                value: Number(newCharge.value),
                taxStatus: (newCharge.taxStatus || 'NOT_APPLICABLE') as any,
                taxRate: newCharge.taxRate
            } : c));
        } else {
            // Add new charge
            const charge: SchemeCharge = {
                id: `c${Date.now()}`,
                name: newCharge.name,
                type: newCharge.type as any,
                calculationBasis: newCharge.calculationBasis as any,
                impact: newCharge.impact as any,
                value: Number(newCharge.value),
                taxStatus: (newCharge.taxStatus || 'NOT_APPLICABLE') as any,
                taxRate: newCharge.taxRate
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
            taxStatus: 'NOT_APPLICABLE'
        });
    };

    return (
        <div className="p-12 pt-4">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                        <CreditCard size={32} className="text-blue-500" />
                        Charges Master
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 ml-12">Standardized Global Fee Templates</p>
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
                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs mb-6">No master charges defined for this partner</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-blue-500 font-black uppercase tracking-widest text-[10px] hover:underline"
                            >Define common charges like PF, Doc, Stamping</button>
                        </div>
                    ) : (
                        charges.map(charge => (
                            <div key={charge.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-blue-500/50 transition-all shadow-sm">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-black/40 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-white/5">
                                        {charge.type === 'PERCENTAGE' ? <Percent size={24} /> : <IndianRupee size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg">{charge.name}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">
                                                {charge.type} • {charge.calculationBasis.replace(/_/g, ' ')}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${charge.impact === 'UPFRONT' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                                                }`}>
                                                {charge.impact}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            {charge.type === 'PERCENTAGE' ? `${charge.value}%` : `₹${charge.value.toLocaleString()}`}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Default Value</p>
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
                                                    taxRate: charge.taxRate
                                                });
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
                                <p className="text-[10px] font-medium leading-relaxed italic">Master charges serve as blueprints. Updating a master charge will propagate defaults to all newly created schemes.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <p className="text-[10px] font-medium leading-relaxed italic">Marketplace vs Backend: Charges defined here are active at the DB level even if hidden from retail users.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-[32px] p-6 space-y-4 shadow-xl shadow-yellow-500/5">
                        <div className="flex items-center gap-2">
                            <Info size={16} className="text-yellow-600 dark:text-yellow-400" />
                            <span className="text-[10px] font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">Financial Safety</span>
                        </div>
                        <p className="text-xs font-bold leading-tight text-yellow-800 dark:text-yellow-400/80">"Charges marked as 'UPFRONT' will increase the Customer Outflow (Downpayment) without affecting the Loan Amount."</p>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-white/10">
                        <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/20">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {editingChargeId ? 'Edit Master Charge' : 'Create Master Charge'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {editingChargeId ? 'Modify existing fee template' : 'Definition of a standard fee template'}
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
                                        taxStatus: 'NOT_APPLICABLE'
                                    });
                                }}
                                className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Charge Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Processing Fee"
                                    value={newCharge.name}
                                    onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
                                    <select
                                        value={newCharge.type}
                                        onChange={(e) => setNewCharge({ ...newCharge, type: e.target.value as any })}
                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:border-blue-500 transition-all appearance-none"
                                    >
                                        <option value="FIXED">Fixed Amount (₹)</option>
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="TABLE">Matrix (Premium Table)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Default Value</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newCharge.value}
                                        onChange={(e) => setNewCharge({ ...newCharge, value: Number(e.target.value) })}
                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer Impact</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setNewCharge({ ...newCharge, impact: 'UPFRONT' })}
                                        className={`px-6 py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all ${newCharge.impact === 'UPFRONT' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-500 hover:border-blue-500'}`}
                                    >
                                        Upfront Payment
                                    </button>
                                    <button
                                        onClick={() => setNewCharge({ ...newCharge, impact: 'FUNDED' })}
                                        className={`px-6 py-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all ${newCharge.impact === 'FUNDED' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-500 hover:border-blue-500'}`}
                                    >
                                        Funded in Loan
                                    </button>
                                </div>
                            </div>

                            {/* GST Configuration */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GST Settings</label>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={newCharge.taxStatus || 'NOT_APPLICABLE'}
                                        onChange={(e) => setNewCharge({
                                            ...newCharge,
                                            taxStatus: e.target.value as any,
                                            taxRate: e.target.value === 'EXCLUSIVE' ? (newCharge.taxRate || 18) : newCharge.taxRate
                                        })}
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
                                                onChange={(e) => setNewCharge({ ...newCharge, taxRate: Number(e.target.value) })}
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
