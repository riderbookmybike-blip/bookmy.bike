'use client';

import React from 'react';
import { Bike, ShieldCheck, Wrench, ArrowRight } from 'lucide-react';

const CATEGORIES = [
    {
        id: 'VEHICLE',
        title: 'Vehicles',
        description: 'Bikes, Scooters, and other two-wheeled vehicles.',
        icon: Bike,
        color: 'text-blue-500',
        borderColor: 'hover:border-blue-500',
        bgColor: 'bg-blue-50/50',
    },
    {
        id: 'ACCESSORY',
        title: 'Accessories',
        description: 'Helmets, safety gear, and performance parts.',
        icon: ShieldCheck,
        color: 'text-amber-500',
        borderColor: 'hover:border-amber-500',
        bgColor: 'bg-amber-50/50',
    },
    {
        id: 'SERVICE',
        title: 'Services',
        description: 'Extended warranty, roadside assistance, and AMC.',
        icon: Wrench,
        color: 'text-emerald-500',
        borderColor: 'hover:border-emerald-500',
        bgColor: 'bg-emerald-50/50',
    }
];

interface CategoryStepProps {
    selectedCategory: string | null;
    onSelectCategory: (categoryId: string) => void;
}

export default function CategoryStep({ selectedCategory, onSelectCategory }: CategoryStepProps) {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                    Select <span className="text-indigo-600">Product Category</span>
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Choose the type of product you want to create in the unified database.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelectCategory(cat.id)}
                            className={`group relative p-10 rounded-[3rem] border-2 transition-all duration-500 text-left flex flex-col items-center gap-6 ${isSelected
                                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/20'
                                    : `border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 hover:shadow-2xl shadow-slate-200/50 ${cat.borderColor}`
                                }`}
                        >
                            <div className={`w-24 h-24 rounded-[2.5rem] ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
                                <Icon size={48} strokeWidth={1.5} />
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className={`text-2xl font-black uppercase italic tracking-tighter transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-900 dark:text-white'}`}>
                                    {cat.title}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-4">
                                    {cat.description}
                                </p>
                            </div>

                            <div className={`mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isSelected ? 'text-indigo-600 opacity-100 translate-y-0' : 'text-slate-300 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                                <span>Get Started</span>
                                <ArrowRight size={14} />
                            </div>

                            {/* Decorative background glow */}
                            <div className={`absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 transition-opacity duration-500 rounded-[3rem] ${isSelected ? 'opacity-100' : 'group-hover:opacity-100'}`} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
