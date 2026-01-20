'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronRight } from 'lucide-react';
import { MARKET_METRICS } from '@/config/market';
import { useCatalog } from '@/hooks/useCatalog';

/**
 * StoreTV: Minimalist Luxury TV Hero
 * Optimized for 1129x635 viewport signature.
 * Feature: Clean Showroom Aesthetics with Bottom Glass Dock.
 */
export function StoreTV() {
    const { items, skuCount } = useCatalog();
    const totalSkus = skuCount || items.length || 500;

    return (
        <div className="flex flex-col bg-white dark:bg-[#020617] transition-colors duration-700 overflow-hidden font-sans selection:bg-brand-primary selection:text-black">
            {/* Immersive TV Hero - Showroom Layout */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Visual Layer */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/hero/lifestyle_1.png"
                        alt="Luxurious Machine"
                        fill
                        className="object-cover scale-105 brightness-[0.9] dark:brightness-[0.6] contrast-[1.1] transition-all duration-700"
                        priority
                    />
                    {/* Soft Vignette and Depth Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-white/60 dark:from-[#020617] dark:via-transparent dark:to-[#020617]/40 z-10 transition-colors duration-700" />
                    <div className="absolute inset-0 bg-white/20 dark:bg-black/30 z-10 transition-colors duration-700" />
                </div>

                {/* Main Content Area */}
                <div className="container mx-auto relative z-30 flex flex-col items-center justify-start h-full px-12 pt-36">
                    <div className="flex flex-col items-center text-center space-y-4 max-w-[900px]">
                        {/* Elegant Minimal Badge */}
                        <div className="flex items-center gap-4 px-6 py-2 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-full backdrop-blur-3xl animate-in fade-in slide-in-from-top-4 duration-1000">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-primary">
                                Lowest EMI Guarantee
                            </span>
                        </div>

                        {/* Clean High-End Typography */}
                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-1000 delay-200">
                            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-[-0.04em] leading-[0.9] text-slate-950 dark:text-white transition-colors duration-500">
                                Find Your <span className="text-brand-primary">Legend.</span>
                            </h1>
                            <p className="text-base lg:text-lg text-slate-700 dark:text-white/60 font-medium tracking-tight max-w-[45ch] mx-auto italic transition-colors duration-500">
                                India&apos;s most exclusive inventory, now at your fingertips.
                            </p>
                        </div>

                        <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            <Link
                                href="/store/catalog"
                                className="group relative z-40 flex items-center justify-center gap-4 px-16 py-6 bg-white dark:bg-white text-black rounded-full transition-all duration-500 shadow-2xl hover:scale-105 active:scale-95 border border-slate-200 dark:border-transparent overflow-hidden"
                            >
                                <Search size={22} className="relative z-10 text-black" strokeWidth={3} />
                                <span className="text-2xl font-black uppercase tracking-widest italic relative z-10 text-black">
                                    Start Riding
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Bottom Glass Dock - The "Stat Pill" */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-[1000px] px-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
                        <div className="grid grid-cols-3 bg-white/80 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-[3rem] backdrop-blur-3xl overflow-hidden shadow-2xl transition-colors duration-700">
                            <div className="px-10 py-8 flex flex-col items-center text-center gap-1 border-r border-slate-900/5 dark:border-white/5">
                                <span className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest transition-colors">
                                    SKU Available
                                </span>
                                <span className="text-4xl font-black text-slate-950 dark:text-white transition-colors">
                                    {totalSkus}+
                                </span>
                            </div>
                            <div className="px-10 py-8 flex flex-col items-center text-center gap-1 border-r border-slate-900/5 dark:border-white/5">
                                <span className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest transition-colors">
                                    EMI Starting
                                </span>
                                <span className="text-4xl font-black text-brand-primary italic transition-colors">
                                    ₹2,499
                                </span>
                            </div>
                            <div className="px-10 py-8 flex flex-col items-center text-center gap-1">
                                <span className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest transition-colors">
                                    Global Delivery
                                </span>
                                <span className="text-4xl font-black text-slate-950 dark:text-white uppercase italic transition-colors">
                                    {MARKET_METRICS.deliveryTime}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Manufacturer View: Minimal & Clean */}
            <section className="py-32 bg-white dark:bg-[#020617] px-12">
                <div className="max-w-[1440px] mx-auto space-y-20">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.5em]">
                            Curated Inventory
                        </span>
                        <h2 className="text-6xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                            The Lineup
                        </h2>
                    </div>

                    <div className="grid grid-cols-4 gap-8">
                        {['HONDA', 'YAMAHA', 'KAWASAKI', 'SUZUKI'].map((brand, i) => (
                            <Link
                                key={brand}
                                href={`/store/catalog?brand=${brand}`}
                                className="group h-56 flex flex-col items-center justify-center bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[4rem] hover:bg-brand-primary transition-all duration-700 hover:scale-[1.03] active:scale-95"
                            >
                                <span className="text-4xl font-black uppercase italic tracking-tighter text-slate-400 dark:text-white/20 group-hover:text-black transition-colors duration-500">
                                    {brand}
                                </span>
                                <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <span className="text-[10px] font-black text-black uppercase tracking-widest">
                                        Explore
                                    </span>
                                    <Search size={14} className="text-black" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
