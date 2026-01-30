'use client';

import React, { useState } from 'react';
import { BankPartner } from '@/types/bankPartner';
import { Target, Plus, TrendingUp, Award, Calendar, ChevronRight, BarChart3, Edit2, X, Trash2, Check, AlertCircle } from 'lucide-react';

interface TargetSlab {
    id: string;
    minAmount: number;
    maxAmount?: number;
    benefitValue: number;
    benefitType: 'PERCENTAGE' | 'FIXED';
}

interface PerformanceTarget {
    id: string;
    type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    period: string; // e.g., "Oct 2024"
    amount: number;
    actual: number;
    slabs: TargetSlab[];
}

export default function TargetsTab({ partner }: { partner: BankPartner }) {
    const [targets, setTargets] = useState<PerformanceTarget[]>([
        {
            id: 't1',
            type: 'MONTHLY',
            period: 'Jan 2024',
            amount: 5000000,
            actual: 3200000,
            slabs: [
                { id: 's1', minAmount: 5000000, benefitValue: 0.1, benefitType: 'PERCENTAGE' },
                { id: 's2', minAmount: 10000000, benefitValue: 0.25, benefitType: 'PERCENTAGE' }
            ]
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState<PerformanceTarget | null>(null);
    const [formData, setFormData] = useState<Partial<PerformanceTarget>>({
        type: 'MONTHLY',
        period: '',
        amount: 0,
        actual: 0,
        slabs: []
    });

    const openModal = (target?: PerformanceTarget) => {
        if (target) {
            setEditingTarget(target);
            setFormData(target);
        } else {
            setEditingTarget(null);
            setFormData({
                type: 'MONTHLY',
                period: '',
                amount: 0,
                actual: 0,
                slabs: [{ id: 's1', minAmount: 0, benefitValue: 0, benefitType: 'PERCENTAGE' }]
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.period || !formData.amount) {
            alert('Please fill in required fields');
            return;
        }

        if (editingTarget) {
            setTargets(prev => prev.map(t => t.id === editingTarget.id ? { ...t, ...formData as PerformanceTarget } : t));
        } else {
            const newTarget: PerformanceTarget = {
                id: `t${Date.now()}`,
                ...(formData as Omit<PerformanceTarget, 'id'>)
            };
            setTargets(prev => [newTarget, ...prev]);
        }
        setIsModalOpen(false);
    };

    const addSlab = () => {
        setFormData(prev => ({
            ...prev,
            slabs: [...(prev.slabs || []), { id: `s${Date.now()}`, minAmount: 0, benefitValue: 0, benefitType: 'PERCENTAGE' }]
        }));
    };

    const updateSlab = (id: string, updates: Partial<TargetSlab>) => {
        setFormData(prev => ({
            ...prev,
            slabs: prev.slabs?.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
    };

    const removeSlab = (id: string) => {
        setFormData(prev => ({
            ...prev,
            slabs: prev.slabs?.filter(s => s.id !== id)
        }));
    };

    return (
        <div className="p-12 pt-4">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                        <Target size={32} className="text-blue-500" />
                        Performance Targets
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 ml-12">Define Slabs & Incentive Brackets</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={16} /> New Target Period
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {targets.map(target => (
                    <div key={target.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[40px] p-10 shadow-sm overflow-hidden relative group">
                        {/* Progress Bar Background */}
                        <div className="absolute bottom-0 left-0 h-1.5 bg-slate-100 dark:bg-white/5 w-full">
                            <div
                                className="h-full bg-blue-600 transition-all duration-1000"
                                style={{ width: `${Math.min((target.actual / target.amount) * 100, 100)}%` }}
                            />
                        </div>

                        {/* Edit Float Button */}
                        <button
                            onClick={() => openModal(target)}
                            className="absolute top-6 right-6 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500/50 hover:shadow-xl transition-all opacity-0 group-hover:opacity-100 z-10"
                        >
                            <Edit2 size={18} />
                        </button>

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-[24px] flex items-center justify-center text-blue-600 border border-blue-500/20">
                                    <Calendar size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">
                                            {target.type}
                                        </span>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{target.period}</h4>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Target Window</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-16">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Amount</p>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{(target.amount / 100000).toFixed(1)}L</div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Actual Disbursal</p>
                                    <div className="text-3xl font-black text-blue-600 tracking-tighter italic">₹{(target.actual / 100000).toFixed(1)}L</div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Achievement</p>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                                        {Math.round((target.actual / target.amount) * 100)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {target.slabs.map((slab, idx) => (
                                <div key={slab.id} className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Benefit Slab {idx + 1}</p>
                                            <h5 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">If &gt; ₹{(slab.minAmount / 100000).toFixed(0)}L</h5>
                                        </div>
                                        <Award className={`text-blue-500 ${target.actual >= slab.minAmount ? 'opacity-100' : 'opacity-20'}`} size={24} />
                                    </div>
                                    <div className="mt-4 flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-blue-600 tracking-tighter italic">
                                            {slab.benefitType === 'PERCENTAGE' ? `+${slab.benefitValue}%` : `+₹${slab.benefitValue}`}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Added to Payout</span>
                                    </div>
                                    {target.actual >= slab.minAmount && (
                                        <div className="absolute top-0 right-0 p-2">
                                            <div className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/20">Achieved</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Target Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />

                    <div className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[48px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-12 py-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                                    {editingTarget ? 'Edit Target Period' : 'New Target Period'}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Configure Period, Target & Benefit Slabs</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-10">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Period (e.g. JAN 2024)</label>
                                    <input
                                        type="text"
                                        value={formData.period}
                                        onChange={e => setFormData({ ...formData, period: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                        placeholder="Enter month & year"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="QUARTERLY">Quarterly</option>
                                        <option value="ANNUAL">Annual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Overall Target Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. 5000000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Disbursal (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.actual}
                                        onChange={e => setFormData({ ...formData, actual: Number(e.target.value) })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Current performance"
                                    />
                                </div>
                            </div>

                            {/* Slabs Section */}
                            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Benefit Slabs</h5>
                                    <button
                                        onClick={addSlab}
                                        className="bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <Plus size={14} /> Add Slab
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.slabs?.map((slab, idx) => (
                                        <div key={slab.id} className="grid grid-cols-12 gap-4 items-end p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 relative group">
                                            <div className="col-span-4 space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">If Achieved &gt; (₹)</label>
                                                <input
                                                    type="number"
                                                    value={slab.minAmount}
                                                    onChange={e => updateSlab(slab.id, { minAmount: Number(e.target.value) })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="col-span-3 space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Incentive Type</label>
                                                <select
                                                    value={slab.benefitType}
                                                    onChange={e => updateSlab(slab.id, { benefitType: e.target.value as any })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="PERCENTAGE">% Percentage</option>
                                                    <option value="FIXED">₹ Fixed Amt</option>
                                                </select>
                                            </div>
                                            <div className="col-span-4 space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Value</label>
                                                <input
                                                    type="number"
                                                    value={slab.benefitValue}
                                                    onChange={e => updateSlab(slab.id, { benefitValue: Number(e.target.value) })}
                                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="col-span-1 pb-1 flex justify-center">
                                                <button
                                                    onClick={() => removeSlab(slab.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-12 py-10 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-[10px] font-black text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-all"
                            >
                                Cancel & Discard
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[24px] text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 shadow-xl shadow-blue-500/30"
                            >
                                <Check size={18} /> {editingTarget ? 'Update Target' : 'Create Target'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2563eb33;
                    border-radius: 10px;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
