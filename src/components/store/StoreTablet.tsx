'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { BRANDS, CATEGORIES } from '@/config/market';
import { RiderPulse } from '@/components/store/RiderPulse';

export function StoreTablet() {
    return (
        <div className="flex flex-col pb-40 transition-colors duration-300 w-full max-w-[100vw] overflow-x-hidden">
            {/* Tablet Optimized Hero */}
            <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-white dark:bg-[#020617] isolate px-8">
                <div className="absolute inset-0 z-0 opacity-40">
                    <Image
                        src="/images/hero/lifestyle_1.png"
                        alt="Superbike Lifestyle"
                        fill
                        className="object-cover"
                        sizes="100vw"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/60 to-white dark:from-[#020617] dark:via-[#020617]/60 dark:to-[#020617]" />
                </div>

                <div className="max-w-4xl mx-auto relative z-10 w-full text-center py-12">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
                            India’s Lowest EMI Guarantee
                        </div>

                        <h1 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] drop-shadow-sm">
                            <span className="text-slate-900 dark:text-white">Your Next</span> <br />
                            <span className="text-[#F4B000]">Legend Awaits.</span>
                        </h1>

                        <p className="max-w-xl mx-auto text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium tracking-wide italic leading-relaxed">
                            Stop Negotiating. Start Riding. India’s Best On-Road Price. Unified rates from verified
                            dealers. Instant location-based quotes.
                        </p>

                        <div className="flex flex-col items-stretch max-w-sm mx-auto gap-4 mt-8">
                            <Link
                                href="/store/catalog"
                                className="h-14 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center gap-3 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-transform"
                            >
                                Explore Collection <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tablet Grid: Branding */}
            <section className="py-24 bg-white dark:bg-[#020617] px-12 border-t border-slate-100 dark:border-white/5">
                <div className="flex flex-col gap-6 mb-16">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] italic leading-none">
                        Partner Ecosystem
                    </p>
                    <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        The Manufacturers
                    </h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
                    {BRANDS.slice(0, 9).map(brand => (
                        <Link
                            key={brand}
                            href={`/store/catalog?brand=${brand}`}
                            className="group border-b border-slate-100 dark:border-white/5 pb-8 hover:border-brand-primary transition-all duration-500"
                        >
                            <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-300 dark:text-slate-800 group-hover:text-brand-primary transition-colors duration-500">
                                {brand}
                            </h3>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Tablet Protocol */}
            <section className="py-24 bg-slate-900 text-white px-12">
                <div className="space-y-12">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] italic">
                            The Protocol
                        </p>
                        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
                            Select. Quote. Conquer.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: '01', title: 'Select', desc: 'Browse 500+ models with unified dealer pricing.' },
                            { step: '02', title: 'Quote', desc: 'Get an instant, on-road quote for your location.' },
                            { step: '03', title: 'Own', desc: 'Secure the lowest EMI & get delivery in 48 hours.' },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col gap-6 justify-between"
                            >
                                <div className="text-3xl font-black italic text-brand-primary opacity-50 shrink-0">
                                    {item.step}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black uppercase italic">{item.title}</h3>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tablet Categories */}
            <section className="py-24 bg-slate-50 dark:bg-[#020617] px-12">
                <div className="mb-16 space-y-4 text-center">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] italic">
                        Curated Collections
                    </p>
                    <h2 className="text-6xl md:text-7xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        Select Your Vibe
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {CATEGORIES.map((cat, i) => (
                        <Link
                            key={i}
                            href={cat.link}
                            className="relative h-[520px] overflow-hidden rounded-[3.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 flex flex-col justify-end p-10 group isolate transition-all duration-700"
                        >
                            {/* Immersive Mesh Gradient - Hover State */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${cat.color} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 z-0 scale-150 group-hover:scale-100 blur-3xl`}
                            />

                            {/* Top Left Feature Label */}
                            <div className="absolute top-8 left-8 z-20">
                                {cat.features.slice(0, 1).map((feature, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-block px-3 py-1.5 rounded-full border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            <div className="relative z-20 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.4em] italic">
                                        {cat.subtitle}
                                    </p>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                        {cat.title}
                                    </h3>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-0 group-hover:opacity-100 transition-all duration-500">
                                    EXPLORE {cat.title} <ArrowRight size={14} />
                                </div>
                            </div>

                            {/* Floating Bike Image */}
                            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center z-10 pointer-events-none">
                                <div className="relative w-[110%] h-[110%] transition-all duration-1000">
                                    <Image
                                        src={cat.img}
                                        alt={cat.title}
                                        fill
                                        className="object-contain filter drop-shadow-[0_30px_50px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_20px_60px_rgba(255,255,255,0.05)] transition-all duration-1000"
                                    />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Restored Rider Pulse (Reviews) Section */}
            <RiderPulse />
        </div>
    );
}
