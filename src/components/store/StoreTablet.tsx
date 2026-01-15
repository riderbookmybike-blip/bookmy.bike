'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

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

                <div className="max-w-4xl mx-auto relative z-10 w-full text-center py-20">
                    <div className="space-y-10">
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
            <section className="py-24 bg-white dark:bg-[#020617] px-8">
                <div className="flex flex-col gap-6 mb-12">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] italic">
                        Partner Ecosystem
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        The Manufacturers
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'SUZUKI', 'YAMAHA'].map(brand => (
                        <Link
                            key={brand}
                            href={`/store/catalog?search=${brand.toLowerCase()}`}
                            className="h-28 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[1.5rem] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                        >
                            <span className="font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 text-xs">
                                {brand}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Tablet Protocol */}
            <section className="py-24 bg-slate-900 text-white px-8">
                <div className="space-y-12">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] italic">
                            The Protocol
                        </p>
                        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
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
                                className="p-8 bg-white/5 border border-white/5 rounded-[2rem] flex items-center gap-6"
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
            <section className="py-24 bg-slate-50 dark:bg-[#020617] px-8">
                <div className="mb-12 space-y-4">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] italic">
                        Curated Collections
                    </p>
                    <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        Select Your Vibe
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {[
                        { title: 'Scooters', img: '/images/categories/scooter_nobg.png' },
                        { title: 'Motorcycles', img: '/images/categories/motorcycle_nobg.png' },
                        { title: 'Mopeds', img: '/images/categories/moped_nobg.png' },
                        { title: 'Electric', img: '/images/categories/scooter_nobg.png' },
                    ].map((cat, i) => (
                        <Link
                            key={i}
                            href="/store/catalog"
                            className="relative h-80 overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 flex flex-col justify-end p-8 hover:shadow-xl transition-shadow"
                        >
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                                    {cat.title}
                                </h3>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-brand-primary">
                                    Explore <ArrowRight size={14} />
                                </div>
                            </div>
                            <Image
                                src={cat.img}
                                alt={cat.title}
                                width={420}
                                height={320}
                                className="absolute top-1/4 right-0 w-[90%] opacity-80 object-contain"
                            />
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
