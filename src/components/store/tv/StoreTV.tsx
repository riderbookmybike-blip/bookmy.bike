'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Zap } from 'lucide-react';
import { MARKET_METRICS, BRANDS } from '@/config/market';
import { useCatalog } from '@/hooks/useCatalog';

/**
 * Tier 5: TV / Ultra-Wide Platform Component
 * Optimized for 10-foot viewing and extreme vertical compression (540px logical height).
 */
export function StoreTV() {
    const { items } = useCatalog();
    const totalModels = items.length || 500;

    return (
        <div className="flex flex-col pb-20 bg-white dark:bg-[#020617] transition-colors duration-500 overflow-hidden">
            {/* Ultra-Compressed TV Hero */}
            <section className="relative h-[85vh] min-h-[480px] max-h-[600px] flex flex-col justify-center overflow-hidden isolate">
                <div className="absolute inset-0 z-0 opacity-30 dark:opacity-40">
                    <Image
                        src="/images/hero/lifestyle_1.png"
                        alt="Premium Superbike"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/20 to-white dark:from-[#020617] dark:via-[#020617]/20 dark:to-[#020617]" />
                </div>

                <div className="mx-auto relative z-10 w-full text-center max-w-[1440px] px-6 md:px-12 lg:px-20 pt-12 pb-8">
                    <div className="space-y-6">
                        {/* Elite Badge */}
                        <div className="inline-flex items-center gap-3 px-5 py-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md shadow-sm mb-4">
                            <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-ping" />
                            India’s Lowest EMI Guarantee
                        </div>

                        {/* High-Impact Headline */}
                        <h1 className="text-7xl lg:text-8xl xl:text-9xl font-black italic uppercase tracking-tighter leading-[0.85] pb-2">
                            <span className="text-slate-900 dark:text-white">Your Next</span>
                            <br />
                            <span className="text-[#F4B000] drop-shadow-2xl">Legend Awaits.</span>
                        </h1>

                        <p className="max-w-[45ch] mx-auto font-bold text-slate-700 dark:text-slate-300 text-lg lg:text-xl tracking-tight opacity-90 pb-2">
                            Unified prices from verified dealers. Instant quotes.
                        </p>

                        {/* Primary TV CTA - Extra Large for Remote Selection */}
                        <div className="pt-4 flex justify-center">
                            <Link
                                href="/store/catalog"
                                className="h-20 px-16 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center gap-6 hover:bg-brand-primary dark:hover:bg-brand-primary hover:text-black dark:hover:text-black transition-all shadow-[0_24px_50px_rgba(244,176,0,0.3)] hover:scale-105 active:scale-95 group overflow-hidden relative border-4 border-transparent hover:border-brand-primary/40"
                            >
                                <Search size={24} className="group-hover:rotate-12 transition-transform" />
                                <span className="text-xl font-black uppercase tracking-[0.2em]">Start Riding</span>
                            </Link>
                        </div>

                        {/* TV Optimized Stats - Single Row */}
                        <div className="w-full max-w-4xl mx-auto grid grid-cols-3 gap-8 py-6 mt-6 border-t border-slate-200/40 dark:border-white/5">
                            <div className="text-center group space-y-0.5">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Models</p>
                                <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">
                                    {totalModels}+
                                </p>
                            </div>
                            <div className="text-center group space-y-0.5 relative">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6 bg-slate-200 dark:bg-white/10" />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-slate-200 dark:bg-white/10" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Savings
                                </p>
                                <p className="text-3xl font-black italic text-brand-primary tracking-tighter">
                                    {MARKET_METRICS.avgSavings}
                                </p>
                            </div>
                            <div className="text-center group space-y-0.5">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Delivery
                                </p>
                                <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter underline decoration-brand-primary decoration-4 underline-offset-4">
                                    {MARKET_METRICS.deliveryTime}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Manufacturer Row - High Contrast */}
            <section className="py-12 bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-white/5">
                <div className="max-w-[1440px] mx-auto px-12">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                            Manufacturers
                        </h2>
                        <div className="h-px flex-1 mx-12 bg-gradient-to-r from-slate-200 via-slate-200 to-transparent dark:from-white/10 dark:via-white/10 dark:to-transparent" />
                    </div>
                    <div className="grid grid-cols-4 gap-6">
                        {BRANDS.slice(0, 8).map(brand => (
                            <Link
                                key={brand}
                                href={`/store/catalog?brand=${brand}`}
                                className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-brand-primary hover:bg-white dark:hover:bg-white/10 transition-all group"
                            >
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-400 group-hover:text-brand-primary transition-colors">
                                    {brand}
                                </h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Protocol Row - Logic for TV */}
            <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
                <div className="max-w-[1440px] mx-auto px-12 relative z-10 flex items-center gap-20">
                    <div className="w-1/3">
                        <h2 className="text-8xl font-black uppercase italic tracking-tighter leading-[0.85] text-[#F4B000]">
                            Select.
                            <br />
                            Quote.
                            <br />
                            Ride.
                        </h2>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-6">
                        {[
                            { title: 'Select', icon: <Search size={32} />, step: '01' },
                            { title: 'Quote', icon: <MapPin size={32} />, step: '02' },
                            { title: 'Own', icon: <Zap size={32} />, step: '03' },
                        ].map((item, i) => (
                            <div key={i} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6">
                                <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                                    {item.icon}
                                </div>
                                <h3 className="text-3xl font-black uppercase italic">{item.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
