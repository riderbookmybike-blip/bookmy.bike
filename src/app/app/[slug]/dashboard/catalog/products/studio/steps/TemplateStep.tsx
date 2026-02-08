'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Fingerprint, Bike, ShieldCheck, Wrench } from 'lucide-react';

const TEMPLATE_CATEGORIES = [
    { value: 'ALL', label: 'All', icon: null },
    { value: 'VEHICLE', label: 'Vehicles', icon: Bike, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    {
        value: 'ACCESSORY',
        label: 'Accessories',
        icon: ShieldCheck,
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
    },
    {
        value: 'SERVICE',
        label: 'Services',
        icon: Wrench,
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
    },
];

interface TemplateStepProps {
    templates: any[];
    selectedTemplate: string | null;
    onSelectTemplate: (templateId: string) => void;
}

export default function TemplateStep({ templates, selectedTemplate, onSelectTemplate }: TemplateStepProps) {
    const [activeCategory, setActiveCategory] = useState('ALL');

    // Filter templates by selected category
    const filteredTemplates = useMemo(() => {
        if (activeCategory === 'ALL') return templates;
        return templates.filter(t => t.category === activeCategory);
    }, [templates, activeCategory]);

    // Get category counts for badges
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { ALL: templates.length };
        templates.forEach(t => {
            const cat = t.category || 'VEHICLE';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [templates]);

    const getCategoryStyle = (category: string) => {
        switch (category) {
            case 'VEHICLE':
                return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case 'ACCESSORY':
                return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
            case 'SERVICE':
                return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
            default:
                return 'text-slate-500 bg-slate-100 dark:bg-slate-800';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {TEMPLATE_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const count = categoryCounts[cat.value] || 0;
                    const isActive = activeCategory === cat.value;

                    return (
                        <button
                            key={cat.value}
                            onClick={() => setActiveCategory(cat.value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:border-indigo-500 hover:text-indigo-600'
                            }`}
                        >
                            {Icon && <Icon size={14} />}
                            {cat.label}
                            <span
                                className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
                                    isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10'
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Template Selection */}
            <div className="space-y-6">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">
                    {activeCategory === 'ALL' ? 'All Templates' : `${activeCategory} Templates`}
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredTemplates.map((tmpl: any) => (
                        <button
                            key={tmpl.id}
                            onClick={() => onSelectTemplate(tmpl.id)}
                            className={`group relative p-6 rounded-[2rem] border-2 transition-all duration-500 text-left overflow-hidden h-full flex flex-col items-center gap-4 ${
                                selectedTemplate === tmpl.id
                                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20 dark:border-indigo-500/50'
                                    : 'border-slate-100 bg-white dark:bg-white/5 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                            }`}
                        >
                            {/* Category Badge - Top Left */}
                            <span
                                className={`absolute top-3 left-3 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getCategoryStyle(tmpl.category)}`}
                            >
                                {tmpl.category || 'VEHICLE'}
                            </span>

                            <div className="w-16 h-16 rounded-[2rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm mt-2">
                                <Fingerprint size={32} />
                            </div>
                            <div className="text-center w-full">
                                <h4 className="font-black text-slate-900 dark:text-white uppercase italic leading-none text-lg">
                                    {tmpl.name}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2 leading-tight">
                                    {tmpl.hierarchy_config?.l1 || 'Variant'} → {tmpl.hierarchy_config?.l2 || 'Color'}
                                </p>
                            </div>

                            {selectedTemplate === tmpl.id && (
                                <div className="absolute top-4 right-4 text-emerald-500 scale-125 animate-in zoom-in duration-300">
                                    <CheckCircle2
                                        size={24}
                                        fill="currentColor"
                                        strokeWidth={1}
                                        className="text-white"
                                    />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">
                            No {activeCategory.toLowerCase()} templates found
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
