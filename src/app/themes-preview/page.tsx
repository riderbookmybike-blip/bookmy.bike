'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Zap, Search, Shield, Trophy, Layout, Palette, Sparkles } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { AppHeaderShell } from '@/components/layout/AppHeaderShell';

type ThemeType = 'midnight' | 'carbon' | 'luxe';

export default function ThemesPreviewPage() {
    const [theme, setTheme] = useState<ThemeType>('midnight');

    const themes = {
        midnight: {
            name: 'Midnight Velocity',
            container: 'bg-[#020617] text-white',
            heroBg: 'bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.15)_0%,rgba(0,0,0,0)_50%)]',
            primary: 'text-cyan-400',
            accent: 'bg-cyan-500',
            button: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]',
            card: 'bg-slate-900/40 border-indigo-500/20 backdrop-blur-xl',
            badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
            glow: 'bg-cyan-500/10',
            logoMode: 'auto' as const
        },
        carbon: {
            name: 'Carbon Performance',
            container: 'bg-[#0f172a] text-slate-100',
            heroBg: 'bg-[linear-gradient(180deg,rgba(220,38,38,0.05)_0%,rgba(0,0,0,0)_100%)]',
            primary: 'text-red-500',
            accent: 'bg-red-600',
            button: 'bg-slate-100 hover:bg-white text-black font-black uppercase tracking-widest',
            card: 'bg-slate-900 border-slate-800 hover:border-red-600/50',
            badge: 'bg-red-500/10 border-red-500/30 text-red-500',
            glow: 'bg-red-600/5',
            logoMode: 'dark' as const
        },
        luxe: {
            name: 'Luxe Horizon',
            container: 'bg-[#0B1A12] text-[#E5E7EB]',
            heroBg: 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,rgba(0,0,0,0)_70%)]',
            primary: 'text-amber-400',
            accent: 'bg-amber-500',
            button: 'bg-[#C5A059] hover:bg-[#D4B475] text-white shadow-xl',
            card: 'bg-[#0D2418] border-amber-500/10 hover:border-amber-500/40',
            badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
            glow: 'bg-amber-500/5',
            logoMode: 'gold' as const
        }
    };

    const active = themes[theme];

    return (
        <div className={`min-h-screen transition-all duration-700 font-inter ${active.container}`}>
            {/* Theme Selector UI */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
                {(Object.keys(themes) as ThemeType[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${theme === t
                            ? 'bg-white text-black shadow-lg scale-105'
                            : 'text-white/40 hover:text-white/80'
                            }`}
                    >
                        {themes[t].name}
                    </button>
                ))}
            </div>

            <AppHeaderShell
                left={<Logo monochrome={theme === 'luxe' ? 'gold' : 'none'} mode="auto" size={32} />}
                center={
                    <nav className="flex items-center gap-10">
                        {['Collection', 'Ecosystem', 'MediaKit', 'About'].map((item) => (
                            <span key={item} className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 cursor-pointer transition-opacity">
                                {item}
                            </span>
                        ))}
                    </nav>
                }
                right={
                    <div className="flex items-center gap-4">
                        <button className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${active.button}`}>
                            Select Bike
                        </button>
                    </div>
                }
                className="transition-colors duration-700"
            />

            <main className="relative overflow-hidden">
                {/* Hero section */}
                <section className={`relative min-h-[90vh] flex items-center justify-center overflow-hidden transition-colors duration-700 isolate ${active.heroBg}`}>
                    {/* Atmospheric Glows */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${active.glow} blur-[150px] rounded-full animate-pulse-slow`} />

                    <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full text-center space-y-12">
                        <div className="space-y-8">
                            <div className={`inline-flex items-center gap-2 px-5 py-2 border rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4 transition-all duration-700 ${active.badge}`}>
                                <Zap size={12} fill="currentColor" className="animate-pulse" />
                                Lowest EMI Guaranteed
                            </div>

                            <h1 className="text-6xl md:text-[8rem] font-black italic uppercase tracking-tighter leading-[0.8] animate-in fade-in zoom-in-95 duration-1000">
                                <span className="drop-shadow-2xl">Unleash The</span> <br />
                                <span className={`text-transparent bg-clip-text bg-gradient-to-r transition-all duration-700 ${theme === 'midnight' ? 'from-indigo-400 via-cyan-400 to-purple-400' :
                                    theme === 'carbon' ? 'from-red-600 via-white to-slate-500' :
                                        'from-amber-300 via-white to-amber-600'
                                    }`}>Pure Performance</span>
                            </h1>

                            <p className="max-w-3xl mx-auto text-sm md:text-xl opacity-60 font-medium tracking-wide leading-relaxed italic">
                                India's premier mobility portal for the elite rider. <br className="hidden md:block" />
                                Precision-engineered quotes for over 500+ legendary machines.
                            </p>
                        </div>

                        <div className="w-full max-w-2xl mx-auto">
                            <div className={`p-1 rounded-3xl transition-all duration-700 ${active.card}`}>
                                <div className="flex items-center px-6 h-16 rounded-2xl bg-white/5 border border-white/5">
                                    <Search className="opacity-40 mr-4" size={20} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH YOUR NEXT LEGEND..."
                                        className="w-full bg-transparent border-none outline-none placeholder:opacity-30 font-black uppercase tracking-widest text-xs"
                                        readOnly
                                    />
                                    <button className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest ${active.button}`}>
                                        Compare
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Brands Grid */}
                <section className="py-32 px-6">
                    <div className="max-w-[1400px] mx-auto">
                        <div className="flex items-end justify-between mb-20">
                            <div>
                                <p className={`text-[12px] font-black uppercase tracking-[0.5em] mb-4 italic ${active.primary}`}>Partner Ecosystem</p>
                                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">World-Class Brands</h2>
                            </div>
                            <div className="flex items-center gap-2 opacity-40 font-black uppercase text-[10px] tracking-widest">
                                Discover All <ArrowRight size={14} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {['HONDA', 'TVS', 'Enfield', 'BAJAJ', 'SUZUKI', 'YAMAHA'].map((brand) => (
                                <div key={brand} className={`h-32 rounded-[2rem] border transition-all duration-500 flex items-center justify-center group cursor-pointer ${active.card}`}>
                                    <span className="font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">{brand}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Performance Metrics */}
                <section className="py-20 border-y border-white/5">
                    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Locations Covered</p>
                            <p className="text-5xl font-black italic tracking-tighter">24+ Cities</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Direct-to-Home</p>
                            <p className="text-5xl font-black italic tracking-tighter">48 Hours</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Trust Factor</p>
                            <p className={`text-5xl font-black italic tracking-tighter ${active.primary}`}>#1 Rated</p>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-40 px-6 text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 blur-[120px] rounded-full ${active.glow}`} />
                    <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                        <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">Ready to <br /> <span className={active.primary}>Elevate?</span></h2>
                        <p className="text-lg opacity-60 font-medium italic">Experience the future of bike procurement today.</p>
                        <button className={`px-12 py-6 rounded-full text-xs font-black uppercase tracking-[0.3em] transition-all shadow-2xl ${active.button}`}>
                            Launch Configurator
                        </button>
                    </div>
                </section>
            </main>

            <footer className="py-20 px-6 border-t border-white/5">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <Logo monochrome={theme === 'luxe' ? 'gold' : 'none'} mode="auto" size={24} />
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest opacity-40">
                        <span>Terms</span>
                        <span>Privacy</span>
                        <span>Contact</span>
                    </div>
                    <p className="text-[10px] font-bold opacity-30 mt-4 md:mt-0">© 2026 BOOKMYBIKE. ALL LEGENDS RESERVED.</p>
                </div>
            </footer>
        </div>
    );
}
