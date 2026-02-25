'use client';

import React from 'react';
import { FormulaComponent, ComponentType } from '@/types/registration';
import { InsuranceRuleTenureConfig, TenureConfig } from '@/types/insurance';
import {
    Calculator,
    Plus,
    Shield,
    Zap,
    Lock,
    Banknote,
    Clock,
    Pencil,
    ShieldCheck,
    Scale,
    Heart,
    TrendingDown,
    Receipt,
    Wrench,
    Cog,
    LifeBuoy,
} from 'lucide-react';
import { FormulaBlock } from '../registration/FormulaBuilder';

// Default tenure config if not provided
const DEFAULT_TENURE_CONFIG: InsuranceRuleTenureConfig = {
    od: { min: 1, max: 5, default: 1, allowed: [1] },
    tp: { min: 1, max: 5, default: 5, allowed: [5] },
    addons: { min: 1, max: 5, default: 1, allowed: [1], linkedTo: 'OD' },
};

interface InsuranceFormulaBuilderProps {
    odComponents: FormulaComponent[];
    tpComponents: FormulaComponent[];
    addons: FormulaComponent[];
    idvPercentage: number;
    ncbPercentage?: number;
    discountPercentage?: number;
    tenureConfig?: InsuranceRuleTenureConfig;
    onIdvChange: (val: number) => void;
    onNcbChange?: (val: number) => void;
    onDiscountChange?: (val: number) => void;
    onTenureChange?: (config: InsuranceRuleTenureConfig) => void;
    onChange: (section: 'od' | 'tp' | 'addons', components: FormulaComponent[]) => void;
    readOnly?: boolean;
    forceEdit?: boolean;
}

export default function InsuranceFormulaBuilder({
    odComponents,
    tpComponents,
    addons,
    idvPercentage,
    ncbPercentage = 0,
    discountPercentage = 0,
    tenureConfig = DEFAULT_TENURE_CONFIG,
    onIdvChange,
    onNcbChange,
    onDiscountChange,
    onTenureChange,
    onChange,
    readOnly = false,
    forceEdit = false,
}: InsuranceFormulaBuilderProps) {
    const config = tenureConfig || DEFAULT_TENURE_CONFIG;

    const handleTenureChange = (section: 'od' | 'tp' | 'addons', value: number) => {
        if (!onTenureChange) return;
        const newConfig = {
            ...config,
            [section]: {
                ...config[section],
                default: value,
                allowed: [value],
            },
        };
        onTenureChange(newConfig);
    };

    const handleAdd = (section: 'od' | 'tp' | 'addons', components: FormulaComponent[], type: ComponentType) => {
        const newComp: FormulaComponent = {
            id: crypto.randomUUID(),
            type,
            label:
                type === 'PERCENTAGE'
                    ? 'New Percentage Charge'
                    : type === 'SLAB'
                      ? 'New Slab Table'
                      : 'New Fixed Charge',
            percentage: type === 'PERCENTAGE' ? 0 : undefined,
            amount: type === 'FIXED' ? 0 : undefined,
            basis: 'IDV',
            ranges: type === 'SLAB' ? [{ id: crypto.randomUUID(), min: 0, max: null, percentage: 0 }] : undefined,
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
            basis: 'IDV',
        };
        onChange('addons', [...addons, newComp]);
    };

    const handleUpdate = (
        section: 'od' | 'tp' | 'addons',
        components: FormulaComponent[],
        updated: FormulaComponent
    ) => {
        onChange(
            section,
            components.map(c => (c.id === updated.id ? updated : c))
        );
    };

    const handleDelete = (section: 'od' | 'tp' | 'addons', components: FormulaComponent[], id: string) => {
        onChange(
            section,
            components.filter(c => c.id !== id)
        );
    };

    const getInsuranceIcon = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes('own damage') || l.includes('od')) return <ShieldCheck size={16} className="text-blue-500" />;
        if (l.includes('third party') || l.includes('tp')) return <Scale size={16} className="text-indigo-500" />;
        if (l.includes('personal accident') || l.includes('pa')) return <Heart size={16} className="text-rose-500" />;
        if (l.includes('zero dep')) return <TrendingDown size={16} className="text-orange-500" />;
        if (l.includes('return to invoice') || l.includes('rti'))
            return <Receipt size={16} className="text-violet-500" />;
        if (l.includes('consumable')) return <Wrench size={16} className="text-teal-500" />;
        if (l.includes('engine')) return <Cog size={16} className="text-slate-500" />;
        if (l.includes('roadside') || l.includes('rsa')) return <LifeBuoy size={16} className="text-cyan-500" />;
        return <Zap size={16} className="text-amber-500" />;
    };

    const odHeaderPrefix = (
        <div className="flex items-center gap-1.5">
            {/* IDV chip */}
            <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-md px-1.5 py-0.5">
                <Pencil size={8} className="text-blue-500" />
                <span className="text-[7px] font-black text-blue-500 uppercase">IDV</span>
                <input
                    type="number"
                    value={idvPercentage}
                    onChange={e => onIdvChange(parseFloat(e.target.value) || 0)}
                    className="w-10 bg-transparent border-none text-xs font-black text-blue-700 dark:text-blue-300 focus:ring-0 p-0 text-center tracking-tighter outline-none"
                    readOnly={readOnly}
                />
                <span className="text-[8px] font-black text-blue-400">%</span>
            </div>
            {/* NCB chip */}
            <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md px-1.5 py-0.5">
                <span className="text-[7px] font-black text-emerald-600 uppercase">NCB</span>
                <select
                    value={ncbPercentage}
                    onChange={e => onNcbChange?.(Number(e.target.value))}
                    disabled={readOnly}
                    className="bg-transparent border-none text-xs font-black text-emerald-700 dark:text-emerald-300 focus:ring-0 p-0 text-center outline-none cursor-pointer disabled:opacity-70"
                >
                    {[0, 20, 25, 35, 45, 50].map(v => (
                        <option key={v} value={v}>
                            {v}%
                        </option>
                    ))}
                </select>
            </div>
            {/* Discount chip */}
            <div className="flex items-center gap-1 bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 rounded-md px-1.5 py-0.5">
                <span className="text-[7px] font-black text-pink-600 uppercase">OD Disc</span>
                <input
                    type="number"
                    value={discountPercentage}
                    onChange={e => onDiscountChange?.(parseFloat(e.target.value) || 0)}
                    className="w-8 bg-transparent border-none text-xs font-black text-pink-700 dark:text-pink-300 focus:ring-0 p-0 text-center tracking-tighter outline-none"
                    readOnly={readOnly}
                />
                <span className="text-[8px] font-black text-pink-400">%</span>
            </div>
        </div>
    );

    const odHeaderSuffix = (
        <select
            value={config.od.default}
            onChange={e => handleTenureChange('od', Number(e.target.value))}
            disabled={readOnly}
            className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-full tracking-widest border-0 outline-none cursor-pointer disabled:opacity-70"
        >
            {[1, 3, 5].map(y => (
                <option key={y} value={y}>
                    {y} YR
                </option>
            ))}
        </select>
    );

    return (
        <div className="space-y-2 pb-4">
            {/* OD Section */}
            <section className="space-y-2">
                <div className="space-y-2">
                    {odComponents.map(comp => (
                        <FormulaBlock
                            key={comp.id}
                            component={comp}
                            onChange={(c: FormulaComponent) => handleUpdate('od', odComponents, c)}
                            onDelete={() => handleDelete('od', odComponents, comp.id)}
                            readOnly={readOnly}
                            availableTargets={[]}
                            forceEdit={forceEdit}
                            headerPrefix={odHeaderPrefix}
                            headerSuffix={odHeaderSuffix}
                            headerIcon={getInsuranceIcon(comp.label)}
                        />
                    ))}
                    {odComponents.length === 0 && (
                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                No OD components defined
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* TP Section */}
            <section className="space-y-2">
                <div className="space-y-2">
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
                            headerSuffix={
                                <select
                                    value={config.tp.default}
                                    onChange={e => handleTenureChange('tp', Number(e.target.value))}
                                    disabled={readOnly}
                                    className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-full tracking-widest border-0 outline-none cursor-pointer disabled:opacity-70"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {[1, 5].map(y => (
                                        <option key={y} value={y}>
                                            {y} YR
                                        </option>
                                    ))}
                                </select>
                            }
                            headerIcon={getInsuranceIcon(comp.label)}
                        />
                    ))}
                </div>
            </section>

            {/* Add-ons Section */}
            <section className="space-y-2">
                <div className="space-y-2">
                    {addons.map(comp => (
                        <FormulaBlock
                            key={comp.id}
                            component={comp}
                            onChange={(c: FormulaComponent) => handleUpdate('addons', addons, c)}
                            onDelete={() => handleDelete('addons', addons, comp.id)}
                            readOnly={readOnly}
                            availableTargets={[]}
                            forceEdit={forceEdit}
                            headerSuffix={
                                <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full tracking-widest">
                                    {config.od.default} YR
                                </span>
                            }
                            headerIcon={getInsuranceIcon(comp.label)}
                        />
                    ))}
                </div>
                {!readOnly && (
                    <div className="flex flex-wrap gap-2 px-4 pt-1">
                        <button
                            onClick={() => handleQuickAdd('Zero Depreciation', 0.15)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                        >
                            <Zap size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> +
                            Zero Dep
                        </button>
                        <button
                            onClick={() => handleQuickAdd('Return to Invoice (RTI)', 0.1)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                        >
                            <Lock size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> +
                            RTI
                        </button>
                        <button
                            onClick={() => handleQuickAdd('Consumables Cover', 0.05)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                        >
                            <Zap size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> +
                            Consumables
                        </button>
                        <button
                            onClick={() => handleQuickAdd('Engine Protection', 0.08)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                        >
                            <Shield size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> +
                            Engine Protect
                        </button>
                        <button
                            onClick={() => handleQuickAdd('Roadside Assistance (RSA)', 0, 150)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                        >
                            <Calculator
                                size={12}
                                className="text-amber-500 group-hover:scale-125 transition-transform"
                            />{' '}
                            + RSA (Fixed)
                        </button>
                        <button
                            onClick={() => handleQuickAdd('Personal Accident (PA) Cover', 0, 375)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-400 hover:text-amber-600 transition-all flex items-center gap-2 group"
                        >
                            <Lock size={12} className="text-amber-500 group-hover:scale-125 transition-transform" /> +
                            PA Cover
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
            </section>
        </div>
    );
}
