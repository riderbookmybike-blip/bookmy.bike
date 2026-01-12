'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Shield, Search, MapPin } from 'lucide-react';

export function StoreTablet() {
    return (
        <div className="flex flex-col pb-40 transition-colors duration-300">
            {/* Tablet Optimized Hero */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-white dark:bg-[#020617] isolate px-12">
                <div className="absolute inset-0 z-0 opacity-40">
                    <img
                        src="/images/hero/lifestyle_1.png"
                        alt="Superbike Lifestyle"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/60 to-white dark:from-[#020617] dark:via-[#020617]/60 dark:to-[#020617]" />
                </div>

                <div className="max-w-4xl mx-auto relative z-10 w-full text-center pt-20">
                    <div className="space-y-10">
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                            India’s Lowest EMI Guarantee
                        </div>

                        <h1 className="text-7xl font-black italic uppercase tracking-tighter leading-[0.9]">
                            <span className="text-slate-900 dark:text-white">Your Next</span> <br />
                            <span className="text-[#F4B000]">Legend Awaits.</span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium tracking-wide italic leading-relaxed">
                            Stop Negotiating. Start Riding. India’s Best On-Road Price. Unified rates from verified
                            dealers. Instant location-based quotes.
                        </p>

                        <div className="flex flex-col items-stretch max-w-lg mx-auto gap-4 mt-8">
                            <Link
                                href="/store/catalog"
                                className="h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl"
                            >
                                Explore Collection <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tablet Grid: Branding */}
            <section className="py-32 bg-white dark:bg-[#020617] px-12">
                <div className="flex flex-col gap-6 mb-16">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] italic">
                        Partner Ecosystem
                    </p>
                    <h2 className="text-5xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        The Manufacturers
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'SUZUKI', 'YAMAHA'].map(brand => (
                        <Link
                            key={brand}
                            href={`/store/catalog?search=${brand.toLowerCase()}`}
                            className="h-32 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[2rem] flex items-center justify-center"
                        >
                            <span className="font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 text-xs">
                                {brand}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Tablet Protocol */}
            <section className="py-32 bg-slate-900 text-white px-12">
                <div className="space-y-16">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] italic">
                            The Protocol
                        </p>
                        <h2 className="text-6xl font-black uppercase tracking-tighter italic leading-none">
                            Select. Quote. Conquer.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { step: '01', title: 'Select', desc: 'Browse 500+ models with unified dealer pricing.' },
                            { step: '02', title: 'Quote', desc: 'Get an instant, on-road quote for your location.' },
                            { step: '03', title: 'Own', desc: 'Secure the lowest EMI & get delivery in 48 hours.' },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center gap-8"
                            >
                                <div className="text-3xl font-black italic text-brand-primary opacity-50">
                                    {item.step}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase italic">{item.title}</h3>
                                    <p className="text-sm text-slate-400 font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tablet Categories */}
            <section className="py-32 bg-slate-50 dark:bg-[#020617] px-12">
                <div className="mb-16 space-y-4">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] italic">
                        Curated Collections
                    </p>
                    <h2 className="text-6xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        Select Your Vibe
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {[
                        { title: 'Scooters', img: '/images/categories/scooter_nobg.png' },
                        { title: 'Motorcycles', img: '/images/categories/motorcycle_nobg.png' },
                        { title: 'Mopeds', img: '/images/categories/moped_nobg.png' },
                        { title: 'Electric', img: '/images/categories/scooter_nobg.png' },
                    ].map((cat, i) => (
                        <Link
                            key={i}
                            href="/store/catalog"
                            className="relative h-96 overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 flex flex-col justify-end p-8"
                        >
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                                    {cat.title}
                                </h3>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-brand-primary">
                                    Explore <ArrowRight size={14} />
                                </div>
                            </div>
                            <img
                                src={cat.img}
                                alt={cat.title}
                                className="absolute top-1/4 left-1/4 w-[80%] opacity-80"
                            />
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
