'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Search, Zap, MapPin, ArrowUpRight, Play, Star } from 'lucide-react';
export function StoreDesktop() {
    return (
        <div className="flex flex-col pb-40 transition-colors duration-300">
            {/* Premium Photography Hero Section */}
            <section className="relative flex flex-col justify-end overflow-hidden bg-white dark:bg-[#020617] isolate transition-colors duration-500 pt-32 pb-20">
                <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50">
                    <Image
                        src="/images/hero/lifestyle_1.png"
                        alt="Premium Superbike Lifestyle"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white dark:from-[#020617] dark:via-[#020617]/40 dark:to-[#020617]" />
                </div>

                <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10 w-full text-center pt-12 pb-8">
                    <div className="space-y-10 md:space-y-12">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/10 dark:border-brand-primary/20 text-brand-primary dark:text-brand-primary rounded-full text-[11px] font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-ping" />
                                India’s Lowest EMI Guarantee
                            </div>

                            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[8.5rem] font-black italic uppercase tracking-tight md:tracking-tighter lg:tracking-[-0.04em] leading-[0.9]">
                                <span className="text-slate-900 dark:text-white transition-colors">Your Next</span>{' '}
                                <br />
                                <span className="text-[#F4B000] drop-shadow-md transition-all">Legend Awaits.</span>
                            </h1>

                            <p className="max-w-[60ch] mx-auto text-lg sm:text-xl font-medium text-slate-700 dark:text-slate-300 leading-relaxed tracking-wide drop-shadow-sm">
                                Unified prices from verified dealers. Instant quotes. Lowest EMI guarantee.
                            </p>
                        </div>

                        {/* Search + Drive Cluster */}
                        <div className="w-full max-w-2xl mx-auto space-y-8 relative z-50">
                            <div className="flex flex-col items-center gap-6">
                                <Link
                                    href="/store/catalog"
                                    className="h-20 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center gap-4 px-12 hover:bg-brand-primary dark:hover:bg-brand-primary hover:text-black dark:hover:text-black transition-all shadow-[0_20px_40px_rgba(244,176,0,0.25)] hover:shadow-[0_24px_60px_rgba(244,176,0,0.35)] group/btn overflow-hidden relative min-w-[280px] sm:min-w-[320px]"
                                >
                                    <div className="relative z-10 flex items-center gap-3">
                                        <Search size={22} className="opacity-80 relative -top-[1px]" />
                                        <span className="text-lg font-black uppercase tracking-[0.15em] leading-none">
                                            Search Bikes & Scooters
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-brand-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                                </Link>
                            </div>
                        </div>

                        {/* Metrics Section */}
                        <div className="w-full max-w-5xl mx-auto grid grid-cols-3 gap-4 md:gap-0 py-6 border-t border-slate-200/50 dark:border-white/5 transition-colors mt-8">
                            <div className="text-center group cursor-default space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {'>'} Models
                                </p>
                                <p className="text-4xl md:text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter">
                                    500+
                                </p>
                            </div>
                            <div className="text-center group cursor-default space-y-1 relative">
                                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-slate-200/70 dark:bg-white/10" />
                                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-slate-200/70 dark:bg-white/10" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Avg savings vs market quote
                                </p>
                                <p className="text-4xl md:text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter">
                                    ₹12k+
                                </p>
                            </div>
                            <div className="text-center group cursor-default space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Fast delivery options available
                                </p>
                                <p className="text-4xl md:text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter underline decoration-brand-primary decoration-4 underline-offset-4">
                                    48h
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Brand Directory */}
            <section className="py-16 md:py-24 lg:py-32 bg-white dark:bg-[#020617] transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

                <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-24">
                        <div className="space-y-4">
                            <p className="text-[12px] font-black text-brand-primary dark:text-brand-primary uppercase tracking-[0.5em] leading-none italic">
                                Partner Ecosystem
                            </p>
                            <h2 className="text-7xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white transition-colors">
                                The Manufacturers
                            </h2>
                        </div>
                        <Link
                            href="/store/catalog"
                            className="group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-primary transition-all"
                        >
                            View Full Directory{' '}
                            <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary group-hover:text-black transition-all">
                                <ArrowRight size={14} />
                            </div>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-8 md:gap-12">
                        {['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'SUZUKI', 'YAMAHA'].map(brand => (
                            <Link
                                key={brand}
                                href={`/store/catalog?search=${brand.toLowerCase()}`}
                                className="group flex items-center justify-center p-4"
                            >
                                <div className="relative w-24 h-24 transition-all duration-300 transform group-hover:scale-110">
                                    <Image
                                        src={`/images/brands/${brand.toLowerCase()}.svg`}
                                        alt={brand}
                                        fill
                                        className="object-contain filter dark:invert dark:brightness-200"
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            {/* How it Works */}
            <section className="py-16 md:py-24 lg:py-32 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#FFD700,transparent_70%)]" />
                </div>

                <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
                    <div className="grid grid-cols-12 gap-24 items-center">
                        <div className="col-span-5 space-y-12">
                            <div className="space-y-6">
                                <p className="text-[12px] font-black text-brand-primary uppercase tracking-[0.5em] italic">
                                    The Protocol
                                </p>
                                <h2 className="text-8xl font-black uppercase tracking-tighter italic leading-[0.9]">
                                    Select.
                                    <br />
                                    Quote.
                                    <br />
                                    Conquer.
                                </h2>
                            </div>
                            <p className="text-xl text-slate-400 font-medium italic leading-relaxed">
                                We’ve digitized the dealership floor. <br />
                                Transparent, instant, and absolute.
                            </p>
                        </div>

                        <div className="col-span-7 grid grid-cols-3 gap-4">
                            {[
                                {
                                    step: '01',
                                    title: 'Select',
                                    desc: 'Browse 500+ models with unified dealer pricing.',
                                    icon: <Search size={24} />,
                                },
                                {
                                    step: '02',
                                    title: 'Quote',
                                    desc: 'Get an instant, on-road quote for your exact location.',
                                    icon: <MapPin size={24} />,
                                },
                                {
                                    step: '03',
                                    title: 'Own',
                                    desc: 'Secure the lowest EMI & get delivery in 48 hours.',
                                    icon: <Zap size={24} />,
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="group p-10 bg-white/5 border border-white/5 rounded-[3rem] space-y-8 hover:bg-white/10 transition-all duration-500"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">
                                                {item.step}
                                            </span>
                                            <div className="h-[1px] flex-1 bg-white/10" />
                                        </div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Categories */}
            <section className="py-16 md:py-24 lg:py-32 bg-slate-50 dark:bg-[#020617] transition-colors">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
                    <div className="text-center max-w-3xl mx-auto mb-20 md:mb-32 space-y-6">
                        <p className="text-[12px] font-black text-brand-primary dark:text-brand-primary uppercase tracking-[0.5em] italic">
                            Curated Collections
                        </p>
                        <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white transition-colors">
                            Select Your Vibe
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
                        {[
                            {
                                title: 'Scooters',
                                subtitle: 'Urban.',
                                desc: 'Agile & Efficient.',
                                img: '/images/categories/scooter_nobg.png',
                                color: 'from-cyan-500/20',
                                link: '/store/catalog?category=SCOOTER',
                            },
                            {
                                title: 'Motorcycles',
                                subtitle: 'Racing.',
                                desc: 'High Performance.',
                                img: '/images/categories/motorcycle_nobg.png',
                                color: 'from-rose-500/20',
                                link: '/store/catalog?category=MOTORCYCLE',
                            },
                            {
                                title: 'Mopeds',
                                subtitle: 'Utility.',
                                desc: 'Heavy Duty.',
                                img: '/images/categories/moped_nobg.png',
                                color: 'from-amber-500/20',
                                link: '/store/catalog?category=MOPED',
                            },
                            {
                                title: 'Electric',
                                subtitle: 'Future.',
                                desc: 'Eco Friendly.',
                                img: '/images/categories/scooter_nobg.png',
                                color: 'from-emerald-500/20',
                                link: '/store/catalog?category=ELECTRIC',
                            },
                        ].map((cat, i) => (
                            <Link
                                key={i}
                                href={cat.link}
                                className="group relative h-[520px] overflow-hidden rounded-[4rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 flex flex-col justify-end p-10 hover:shadow-3xl transition-all duration-700"
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-b ${cat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                                />

                                <div className="relative z-20 space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] italic">
                                            {cat.subtitle}
                                        </p>
                                        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                                            {cat.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                                            {cat.desc}
                                        </p>
                                    </div>
                                    <div className="pt-4 overflow-hidden">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                                            Explore Now <ArrowRight size={14} className="text-brand-primary" />
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center opacity-100 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-1000 pointer-events-none">
                                    <Image
                                        src={cat.img}
                                        alt={cat.title}
                                        fill
                                        className="object-contain filter drop-shadow-[0_50px_100px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_20px_100px_rgba(255,255,255,0.05)]"
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
