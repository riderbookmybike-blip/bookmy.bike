'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, Search, MapPin, Zap } from 'lucide-react';

export function StoreMobile() {
    return (
        <div className="flex flex-col pb-40 transition-colors duration-300 w-full max-w-[100vw] overflow-x-hidden">
            {/* Mobile Portrait Hero */}
            <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-[#020617] isolate px-4 pt-20 pb-12">
                <div className="absolute inset-0 z-0 opacity-30">
                    <Image src="/images/hero/lifestyle_1.png" alt="Hero" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white dark:from-[#020617] dark:via-[#020617]/80 dark:to-[#020617]" />
                </div>

                <div className="relative z-10 w-full text-center space-y-6 max-w-xs mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/5 border border-brand-primary/10 text-brand-primary rounded-full text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-sm whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                        Lowest EMI Guaranteed
                    </div>

                    <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-[0.85] text-slate-900 dark:text-white break-words">
                        Your Next <br />
                        <span className="text-[#F4B000]">
                            Legend <br /> Awaits.
                        </span>
                    </h1>

                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed px-2 max-w-[85%] mx-auto">
                        Stop Negotiating. Start Riding. India’s Best On-Road Price.
                    </p>

                    <div className="space-y-4 pt-4 w-full max-w-sm mx-auto">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-2xl shadow-xl">
                            <div className="flex items-center px-4 h-12 bg-slate-50 dark:bg-white/5 rounded-xl">
                                <Search className="text-slate-400 mr-3" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search Bike or Scooter..."
                                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white w-full placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <Link
                            href="/store/catalog"
                            className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/20"
                        >
                            Explore Collection <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 opacity-70">
                    {['Transparency', 'Speed', 'Precision'].map(item => (
                        <div key={item} className="flex items-center gap-1.5">
                            <Shield size={10} className="text-brand-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {item}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mobile Horizontal Carousel: Manufacturers */}
            <section className="py-16 bg-white dark:bg-[#020617]">
                <div className="px-4 mb-8">
                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest italic mb-2">
                        Partner Ecosystem
                    </p>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        Manufacturers
                    </h2>
                </div>

                <div className="flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar scroll-smooth snap-x">
                    {['HONDA', 'TVS', 'RE', 'BAJAJ', 'SUZUKI', 'YAMAHA'].map(brand => (
                        <Link
                            key={brand}
                            href={`/store/catalog?search=${brand.toLowerCase()}`}
                            className="flex-shrink-0 w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center snap-center border border-slate-100 dark:border-white/5"
                        >
                            <span className="font-black text-[10px] tracking-widest text-slate-400">{brand}</span>
                        </Link>
                    ))}
                    <div className="flex-shrink-0 w-1" /> {/* Spacer */}
                </div>
            </section>

            {/* Mobile Protocol */}
            <section className="py-16 bg-slate-900 text-white px-4">
                <div className="space-y-12">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">The Protocol</h2>
                    <div className="space-y-4">
                        {[
                            { step: '01', title: 'Select', icon: <Search size={20} /> },
                            { step: '02', title: 'Quote', icon: <MapPin size={20} /> },
                            { step: '03', title: 'Own', icon: <Zap size={20} /> },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="p-6 bg-white/5 rounded-2xl flex items-center gap-6 border border-white/5"
                            >
                                <div className="text-brand-primary">{item.icon}</div>
                                <h3 className="text-xl font-black uppercase italic tracking-widest">{item.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mobile Horizontal Carousel: Vibe */}
            <section className="py-16 bg-slate-50 dark:bg-[#020617]">
                <div className="px-4 mb-8">
                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest italic mb-2">
                        Curated Collections
                    </p>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        Select Your Vibe
                    </h2>
                </div>

                <div className="flex overflow-x-auto gap-4 px-4 pb-12 no-scrollbar snap-x">
                    {[
                        { title: 'Scooters', img: '/images/categories/scooter_nobg.png' },
                        { title: 'Bikes', img: '/images/categories/motorcycle_nobg.png' },
                        { title: 'Electric', img: '/images/categories/scooter_nobg.png' },
                    ].map((cat, i) => (
                        <Link
                            key={i}
                            href="/store/catalog"
                            className="flex-shrink-0 w-[80vw] h-[400px] bg-white dark:bg-slate-900 rounded-[3rem] p-8 relative overflow-hidden snap-center border border-slate-200 dark:border-white/10"
                        >
                            <h3 className="text-3xl font-black uppercase tracking-tighter italic relative z-10">
                                {cat.title}
                            </h3>
                            <Image
                                src={cat.img}
                                alt={cat.title}
                                width={300}
                                height={300}
                                className="absolute bottom-0 right-0 w-[90%] opacity-90 object-contain"
                            />
                        </Link>
                    ))}
                    <div className="flex-shrink-0 w-1" />
                </div>
            </section>
        </div>
    );
}
