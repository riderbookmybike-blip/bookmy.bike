'use client';

import React from 'react';
import { FormulaComponent, ComponentType } from '@/types/registration';
import {
    Calculator,
    Plus,
    Shield,
    Zap,
    Lock,
    Banknote
} from 'lucide-react';
import { FormulaBlock } from '../registration/FormulaBuilder';

interface InsuranceFormulaBuilderProps {
    odComponents: FormulaComponent[];
    tpComponents: FormulaComponent[];
    addons: FormulaComponent[];
    idvPercentage: number;
    onIdvChange: (val: number) => void;
    onChange: (section: 'od' | 'tp' | 'addons', components: FormulaComponent[]) => void;
    readOnly?: boolean;
    forceEdit?: boolean;
}

export default function InsuranceFormulaBuilder({
    odComponents,
    tpComponents,
    addons,
    idvPercentage,
    onIdvChange,
    onChange,
    readOnly = false,
    forceEdit = false
}: InsuranceFormulaBuilderProps) {

    const handleAdd = (section: 'od' | 'tp' | 'addons', components: FormulaComponent[], type: ComponentType) => {
        const newComp: FormulaComponent = {
            id: crypto.randomUUID(),
            type,
            label: type === 'PERCENTAGE' ? 'New Percentage Charge' : (type === 'SLAB' ? 'New Slab Table' : 'New Fixed Charge'),
            percentage: type === 'PERCENTAGE' ? 0 : undefined,
            amount: type === 'FIXED' ? 0 : undefined,
            basis: 'IDV',
            ranges: type === 'SLAB' ? [{ id: crypto.randomUUID(), min: 0, max: null, percentage: 0 }] : undefined
        };
        onChange(section, [...components, newComp]);
    };

    const handleQuickAdd = (label: string, percentage: number = 0, amount?: number) => {
        const newComp: FormulaComponent = {
            id: crypto.randomUUID(),
            type: amount !== undefined ? 'FIXED' : 'PERCENTAGE',
            label,
            percentage: amount !== undefined ? undefined : percentage,
            amount: amount,
            basis: 'IDV'
        };
        onChange('addons', [...addons, newComp]);
    };

    const handleUpdate = (section: 'od' | 'tp' | 'addons', components: FormulaComponent[], updated: FormulaComponent) => {
        onChange(section, components.map(c => c.id === updated.id ? updated : c));
    };

    const handleDelete = (section: 'od' | 'tp' | 'addons', components: FormulaComponent[], id: string) => {
        onChange(section, components.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-12 pb-24">
            {/* IDV Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                    <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                        <Calculator size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">IDV Logic</h3>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Insured Declared Value derivation</p>
                    </div>
                </div>

                <div className="mx-4 p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-2xl transition-all duration-500">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Depreciation Percentage of Ex-Showroom</label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-48 group">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-blue-500 dark:text-blue-400 opacity-60">%</span>
                                <input
                                    type="number"
                                    value={idvPercentage}
                                    onChange={(e) => onIdvChange(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-2xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner tracking-tighter"
                                    readOnly={readOnly}
                                />
                            </div>
                            <div className="flex-1 p-4 bg-blue-50/50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                <p className="text-[11px] font-black text-blue-700 dark:text-blue-300 uppercase italic tracking-tight">Standard IDV is typically 95% for new vehicles.</p>
                                <p className="text-[10px] font-medium text-blue-400 dark:text-blue-500 mt-1 uppercase tracking-widest">Current Logic: {idvPercentage}% of Ex-Showroom</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* OD Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
                            <Shield size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">Own Damage (OD)</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Calculated primarily on IDV</p>
                        </div>
                    </div>
                    {!readOnly && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAdd('od', odComponents, 'PERCENTAGE')}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <Banknote size={14} className="text-blue-500" /> + % OD Rate
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {odComponents.map(comp => (
                        <FormulaBlock
                            key={comp.id}
                            component={comp}
                            onChange={(c: FormulaComponent) => handleUpdate('od', odComponents, c)}
                            onDelete={() => handleDelete('od', odComponents, comp.id)}
                            readOnly={readOnly}
                            availableTargets={[]}
                            forceEdit={forceEdit}
                        />
                    ))}
                    {odComponents.length === 0 && (
                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No OD components defined</p>
                        </div>
                    )}
                </div>
            </section>

            {/* TP Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
                            <Lock size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">Third Party (TP)</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fixed liability based on engine capacity</p>
                        </div>
                    </div>
                    {!readOnly && (
                        <button
                            onClick={() => handleAdd('tp', tpComponents, 'SLAB')}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <Calculator size={14} className="text-indigo-500" /> + TP Slab Table
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {tpComponents.map(comp => (
                        <FormulaBlock
                            key={comp.id}
                            component={comp}
                            onChange={(c: FormulaComponent) => handleUpdate('tp', tpComponents, c)}
                            onDelete={() => handleDelete('tp', tpComponents, comp.id)}
                            readOnly={readOnly}
                            availableTargets={[]}
                            slabValueLabel="Premium"
                            showSlabValueTypeToggle
                            defaultSlabValueType="FIXED"
                            forceEdit={forceEdit}
                        />
                    ))}
                </div>
            </section>

            {/* Add-ons Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-2xl">
                            <Zap size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">Add-on Covers</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Zero Dep, RTI, and other consumables</p>
                        </div>
                    </div>
                    {!readOnly && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleQuickAdd('Zero Depreciation', 0.15)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                            >
                                <Zap size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> + Zero Dep
                            </button>
                            <button
                                onClick={() => handleQuickAdd('Return to Invoice (RTI)', 0.1)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                            >
                                <Lock size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> + RTI
                            </button>
                            <button
                                onClick={() => handleQuickAdd('Consumables Cover', 0.05)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                            >
                                <Zap size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> + Consumables
                            </button>
                            <button
                                onClick={() => handleQuickAdd('Engine Protection', 0.08)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                            >
                                <Shield size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> + Engine Protect
                            </button>
                            <button
                                onClick={() => handleQuickAdd('Roadside Assistance (RSA)', 0, 150)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                            >
                                <Calculator size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> + RSA (Fixed)
                            </button>
                            <button
                                onClick={() => handleQuickAdd('Personal Accident (PA) Cover', 0, 375)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                            >
                                <Lock size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> + PA Cover
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-2" />
                            <button
                                onClick={() => handleAdd('addons', addons, 'PERCENTAGE')}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                                <Plus size={14} className="text-amber-500" /> Custom Add-on
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {addons.map(comp => (
                        <FormulaBlock
                            key={comp.id}
                            component={comp}
                            onChange={(c: FormulaComponent) => handleUpdate('addons', addons, c)}
                            onDelete={() => handleDelete('addons', addons, comp.id)}
                            readOnly={readOnly}
                            availableTargets={[]}
                            forceEdit={forceEdit}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
