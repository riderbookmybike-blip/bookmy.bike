'use client';

import React, { useState } from 'react';
import {
    Download,
    Share2,
    Heart,
    Zap,
    ShieldCheck,
    ArrowLeft,
    ChevronRight,
    Search,
    MapPin,
    Smartphone,
    CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function FloatingQuoteConcept() {
    const [selectedColor, setSelectedColor] = useState('Obsidian Black');

    // Mock Data
    const vehicle = {
        make: 'HONDA',
        model: 'ACTIVA 6G',
        variant: 'STANDARD',
        onRoad: 96110,
        mrp: 101110,
        discount: 5000,
        emi: 1932,
        colors: [
            { name: 'Obsidian Black', hex: '#000000' },
            { name: 'Pearl Precious White', hex: '#ffffff' },
            { name: 'Rebel Red Metallic', hex: '#dc2626' },
            { name: 'Matte Axis Grey Metallic', hex: '#4b5563' }
        ]
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white pb-60 transition-colors duration-500">
            {/* Header Mock */}
            <header className="px-12 py-6 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-12">
                    <div className="text-2xl font-black italic tracking-tighter text-blue-600">bookmy.bike</div>
                    <nav className="flex gap-8">
                        {['HOME', 'COMPARE', 'ZERO', 'COMMUNITY'].map(item => (
                            <Link key={item} href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">{item}</Link>
                        ))}
                    </nav>
                </div>
                <button className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-slate-200 dark:border-white/10">
                    <Smartphone size={14} /> SIGN IN
                </button>
            </header>

            <main className="max-w-[1400px] mx-auto px-12 py-12 space-y-16">
                {/* Product Section Mockup */}
                <div className="grid grid-cols-2 gap-20">
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                                STORE / {vehicle.make} / <span className="text-blue-600">{vehicle.model}</span>
                            </div>
                            <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none">
                                {vehicle.model} <span className="text-slate-200 dark:text-white/10">- {vehicle.variant}</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full">In Stock</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">READY FOR DELIVERY • {selectedColor}</span>
                            </div>
                        </div>

                        <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] flex items-center justify-center p-20 relative overflow-hidden group border border-slate-200 dark:border-white/5 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-radial from-blue-600/5 to-transparent animate-pulse" />
                            <img
                                src="/images/categories/scooter_nobg.png"
                                alt="bike"
                                className="relative z-10 w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-all duration-1000"
                            />
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-white/50 dark:bg-black/40 backdrop-blur-3xl rounded-full border border-white/20">
                                {vehicle.colors.map(color => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color.name)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.name ? 'border-blue-600 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: color.hex }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-12 py-12">
                        <div className="p-10 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[3rem] space-y-10">
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-widest text-blue-600 italic">Configuration Summary</p>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest max-w-sm">Every element of your legend is being tracked in real-time below.</p>
                            </div>

                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Ex-Showroom Base</span>
                                        <span>₹{vehicle.mrp.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Zap size={14} className="text-amber-500" />
                                            <span className="text-sm font-black italic text-amber-500 uppercase tracking-widest">Special Dealer Benefit</span>
                                        </div>
                                        <span className="text-sm font-black italic text-amber-500">-₹{vehicle.discount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-end">
                                        <span className="text-lg font-black uppercase italic tracking-tighter">Effective Price</span>
                                        <div className="text-right">
                                            <p className="text-4xl font-black italic tracking-tighter text-blue-600 dark:text-white">₹{vehicle.onRoad.toLocaleString()}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final On-Road (Mumbai)</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2rem] space-y-3">
                                <ShieldCheck className="text-blue-600" size={24} />
                                <p className="text-[10px] font-black uppercase tracking-widest">BookMyBike Pure Assurance</p>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest leading-none">Instant Price Unlock</p>
                            </div>
                            <div className="p-8 bg-green-600/5 border border-green-500/20 rounded-[2rem] space-y-3">
                                <CreditCard className="text-green-600" size={24} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Smart EMI Protocol</p>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest leading-none">Powered by HDFC Bank</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* =====================================================================================
                NEW FLOATING QUOTE HUD CONCEPT
               ===================================================================================== */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-[95%] max-w-7xl animate-in slide-in-from-bottom-10 duration-1000">
                <div className="bg-[#0f172a]/95 dark:bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-6 shadow-[0_32px_128px_rgba(0,0,0,0.5)] flex items-center justify-between gap-12 group">

                    {/* 1. Identity Segment */}
                    <div className="flex items-center gap-8 pl-4">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative">
                                <img src="/images/categories/scooter_nobg.png" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" alt="mini" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black italic tracking-tighter text-white leading-none">
                                {vehicle.model}
                                <span className="text-slate-500 ml-2 italic text-sm">{vehicle.variant}</span>
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: vehicle.colors.find(c => c.name === selectedColor)?.hex }} />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">{selectedColor}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-px h-12 bg-white/10" />

                    {/* 2. Financial Ecosystem Segment */}
                    <div className="flex-1 flex items-center justify-center gap-16">
                        <div className="text-center group-hover:scale-105 transition-transform">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic mb-1">On-Road Protocol</p>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-black italic tracking-tighter text-white">₹{vehicle.onRoad.toLocaleString()}</span>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                                    <Zap size={10} className="text-green-500 fill-current" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-green-500">SAVED ₹{vehicle.discount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center group-hover:scale-105 transition-transform delay-75">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 italic mb-1">Smart EMI Protocol</p>
                            <p className="text-2xl font-black italic tracking-tighter text-white">₹{vehicle.emi.toLocaleString()}<span className="text-xs font-bold text-slate-500 ml-2">/mo*</span></p>
                        </div>
                    </div>

                    <div className="w-px h-12 bg-white/10" />

                    {/* 3. Action Ecosystem Segment */}
                    <div className="flex items-center gap-4 pr-4">
                        <button className="w-14 h-14 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 border border-white/10 rounded-2xl flex items-center justify-center text-white transition-all group scale-90 hover:scale-100 active:scale-95" title="Download Quote">
                            <Download size={22} className="group-hover:text-blue-500 transition-colors" />
                        </button>
                        <button className="w-14 h-14 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 border border-white/10 rounded-2xl flex items-center justify-center text-white transition-all group scale-90 hover:scale-100 active:scale-95" title="Share Configuration">
                            <Share2 size={22} className="group-hover:text-blue-500 transition-colors" />
                        </button>
                        <button className="w-14 h-14 bg-white/5 hover:bg-white/10 hover:border-rose-500/50 border border-white/10 rounded-2xl flex items-center justify-center text-white transition-all group scale-90 hover:scale-100 active:scale-95" title="Save to Garage">
                            <Heart size={22} className="group-hover:text-rose-500 transition-colors" />
                        </button>

                        <div className="w-px h-14 bg-white/10 mx-2" />

                        <button className="h-16 px-10 bg-red-600 hover:bg-red-500 active:scale-[0.98] transition-all rounded-3xl shadow-[0_12px_48px_rgba(220,38,38,0.3)] flex items-center gap-4 group/btn">
                            <span className="text-sm font-black uppercase tracking-[0.2em] italic text-white">SECURE MACHINE</span>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:translate-x-2 transition-transform">
                                <ArrowRight size={18} className="text-white" />
                            </div>
                        </button>
                    </div>

                </div>
            </div>

            {/* Background elements to show transparency */}
            <div className="py-40">
                <div className="grid grid-cols-4 gap-8 px-12 opacity-20 grayscale">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="aspect-square bg-slate-200 dark:bg-white/5 rounded-[3rem]" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ArrowRight(props: any) {
    return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
}
