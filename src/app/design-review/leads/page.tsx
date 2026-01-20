'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronRight, Sparkles, Layout, Palette, Zap, Box, Send } from 'lucide-react';

const options = [
    {
        id: 1,
        name: 'Neo-Minimalist',
        description: 'Ultra-thin lines, airy spacing, and refined italicized black typography. Feels like a high-end fashion or architect dashboard.',
        image: '/images/mockups/option-1.png',
        tag: 'Current Baseline',
        stats: { spacing: 'High', contrast: 'Executive', feel: 'Architectural' }
    },
    {
        id: 2,
        name: 'Glassmorphic',
        description: 'Translucent panels, soft backdrop blurs, and vibrant accent glows. Provides a multi-layered, futuristic appearance.',
        image: '/images/mockups/option-2.png',
        tag: 'Futuristic',
        stats: { spacing: 'Fluid', contrast: 'Vibrant', feel: 'Layered' }
    },
    {
        id: 3,
        name: 'Monochrome Executive',
        description: 'High-contrast black & white palette with bold serif-style sans headings. Focuses on authority and high-density information.',
        image: '/images/mockups/option-3.png',
        tag: 'Authoritative',
        stats: { spacing: 'Dense', contrast: 'Extreme', feel: 'Editorial' }
    },
    {
        id: 4,
        name: 'Brutalist Premium',
        description: 'Raw, unpolished borders, large experimental typography, and intentional spacing. A "DTC-Brand" look for the bold and modern.',
        image: '/images/mockups/option-4.png',
        tag: 'Experimental',
        stats: { spacing: 'Raw', contrast: 'Bold', feel: 'Direct' }
    },
    {
        id: 5,
        name: 'Modern SaaS Pro',
        description: 'The "Linear-style" polished aesthetic. Clean gradients, subtle rounding, and a highly functional, dependable professional feel.',
        image: '/images/mockups/option-5.png',
        tag: 'SaaS Standard',
        stats: { spacing: 'Optimized', contrast: 'Balanced', feel: 'Polished' }
    }
];

export default function DesignReviewPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-slate-900 selection:text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-b border-slate-50 dark:border-white/10 px-12 py-8">
                <div className="max-w-7xl mx-auto flex justify-between items-end">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">
                            <Sparkles size={14} className="text-slate-900 dark:text-white" /> Executive Design Lab
                        </div>
                        <h1 className="text-5xl font-black tracking-[-0.08em] italic uppercase leading-none">
                            Identity<br />Interface v2.0
                        </h1>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Project Phase</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter italic uppercase mt-2">Leads Revamp</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-12 pt-56 pb-32">
                <div className="space-y-32">
                    {options.map((option, idx) => (
                        <section key={option.id} className="relative group">
                            <div className="grid grid-cols-12 gap-16 items-start">
                                {/* Text Content */}
                                <div className="col-span-12 lg:col-span-4 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-px bg-slate-900" />
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] italic">Option 0{option.id}</span>
                                        </div>
                                        <h2 className="text-4xl font-black tracking-[-0.06em] uppercase italic leading-none">{option.name}</h2>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-tight leading-relaxed opacity-80">{option.description}</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-50">
                                        {Object.entries(option.stats).map(([key, value]) => (
                                            <div key={key} className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{key}</p>
                                                <p className="text-[11px] font-black text-slate-900 uppercase italic">{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-8">
                                        <button className="group/btn flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 hover:text-indigo-600 transition-colors">
                                            Select Direction <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                {/* Mockup Preview */}
                                <div className="col-span-12 lg:col-span-8 relative">
                                    <div className="relative aspect-[16/10] bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl group-hover:shadow-[0_40px_100px_-15px_rgba(0,0,0,0.1)] transition-all duration-700">
                                        <Image
                                            src={option.image}
                                            alt={option.name}
                                            fill
                                            className="object-cover object-top scale-100 group-hover:scale-[1.02] transition-transform duration-1000"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute -top-6 -right-6 flex flex-col gap-4">
                                        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl italic font-black text-[10px] uppercase tracking-widest transform -rotate-1 group-hover:rotate-0 transition-transform duration-500">
                                            {option.tag}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            {/* Footer / Selection CTA */}
            <footer className="border-t border-slate-100 py-32 px-12 bg-slate-50/50">
                <div className="max-w-3xl mx-auto text-center space-y-12">
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black tracking-tighter uppercase italic">Ready to decide?</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mention the Option Number or Name to finalize the implementation.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6">
                        {options.map((opt) => (
                            <button key={opt.id} className="bg-white dark:bg-slate-900 px-8 py-5 rounded-3xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:border-slate-900 dark:hover:border-white/30 hover:shadow-xl transition-all">
                                Option {opt.id}: {opt.name}
                            </button>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
