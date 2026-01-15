'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Search, Zap, MapPin } from 'lucide-react';
import { CATEGORIES, MARKET_METRICS, BRANDS } from '@/config/market';
import { useCatalog } from '@/hooks/useCatalog';
import { RiderPulse } from '@/components/store/RiderPulse';

interface StoreDesktopProps {
    variant?: 'default' | 'tv';
}

export function StoreDesktop({ variant = 'default' }: StoreDesktopProps) {
    const { items } = useCatalog();
    const totalModels = items.length || 500; // Fallback to 500 if loading or empty
    const isTv = variant === 'tv';

    return (
        <div className="flex flex-col pb-40 transition-colors duration-300">
            {/* Premium Photography Hero Section */}
            <section
                className={`relative flex flex-col justify-end overflow-hidden bg-white dark:bg-[#020617] isolate transition-colors duration-500 ${isTv ? 'pt-20 pb-12' : 'pt-32 pb-20'}`}
            >
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

                <div
                    className={`mx-auto px-6 md:px-12 lg:px-20 relative z-10 w-full text-center ${isTv ? 'max-w-[1680px] pt-6 pb-4' : 'max-w-[1440px] pt-12 pb-8'}`}
                >
                    <div className={isTv ? 'space-y-8' : 'space-y-10 md:space-y-12'}>
                        <div className={isTv ? 'space-y-4' : 'space-y-6'}>
                            <div
                                className={`inline-flex items-center gap-3 px-6 py-3 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/10 dark:border-brand-primary/20 text-brand-primary dark:text-brand-primary rounded-full text-[11px] font-black uppercase tracking-[0.3em] backdrop-blur-md shadow-sm ${isTv ? 'mb-6' : 'mb-8'}`}
                            >
                                <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-ping" />
                                India’s Lowest EMI Guarantee
                            </div>

                            <h1
                                className={`${isTv ? 'text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6rem] 2xl:text-[6.5rem] pb-2' : 'text-6xl sm:text-7xl md:text-8xl lg:text-8xl xl:text-[7rem] 2xl:text-[7.5rem] pb-4'} font-black italic uppercase tracking-tight md:tracking-tighter lg:tracking-[-0.04em] leading-none xl:leading-[0.9] 2xl:leading-tight`}
                            >
                                <span className="text-slate-900 dark:text-white transition-colors">Your Next</span>{' '}
                                <br />
                                <span className="text-[#F4B000] drop-shadow-md transition-all">Legend Awaits.</span>
                            </h1>

                            <p
                                className={`max-w-[60ch] mx-auto font-medium text-slate-700 dark:text-slate-300 leading-relaxed tracking-wide drop-shadow-sm ${isTv ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}
                            >
                                Unified prices from verified dealers. Instant quotes. Lowest EMI guarantee.
                            </p>
                        </div>

                        {/* Search + Drive Cluster */}
                        <div className={`w-full max-w-2xl mx-auto relative z-50 ${isTv ? 'space-y-6' : 'space-y-8'}`}>
                            <div className="flex flex-col items-center gap-6">
                                <Link
                                    href="/store/catalog"
                                    className={`${isTv ? 'h-16 px-10 min-w-[240px] sm:min-w-[280px]' : 'h-20 px-12 min-w-[280px] sm:min-w-[320px]'} bg-slate-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center gap-4 hover:bg-brand-primary dark:hover:bg-brand-primary hover:text-black dark:hover:text-black transition-all shadow-[0_20px_40px_rgba(244,176,0,0.25)] hover:shadow-[0_24px_60px_rgba(244,176,0,0.35)] group/btn overflow-hidden relative`}
                                >
                                    <div className="relative z-10 flex items-center gap-3">
                                        <Search size={isTv ? 18 : 22} className="opacity-80 relative -top-[1px]" />
                                        <span
                                            className={`${isTv ? 'text-base' : 'text-lg'} font-black uppercase tracking-[0.15em] leading-none`}
                                        >
                                            Search Bikes & Scooters
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-brand-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                                </Link>
                            </div>
                        </div>

                        {/* Metrics Section */}
                        <div
                            className={`w-full max-w-5xl mx-auto grid grid-cols-3 gap-4 md:gap-0 border-t border-slate-200/50 dark:border-white/5 transition-colors ${isTv ? 'py-4 mt-6' : 'py-6 mt-8'}`}
                        >
                            <div className="text-center group cursor-default space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {'>'} Models
                                </p>
                                <p
                                    className={`${isTv ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'} font-black italic text-slate-900 dark:text-white tracking-tighter`}
                                >
                                    {totalModels}+
                                </p>
                            </div>
                            <div className="text-center group cursor-default space-y-1 relative">
                                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-slate-200/70 dark:bg-white/10" />
                                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-slate-200/70 dark:bg-white/10" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Avg savings vs market quote
                                </p>
                                <p
                                    className={`${isTv ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'} font-black italic text-slate-900 dark:text-white tracking-tighter`}
                                >
                                    {MARKET_METRICS.avgSavings}
                                </p>
                            </div>
                            <div className="text-center group cursor-default space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Fast delivery options available
                                </p>
                                <p
                                    className={`${isTv ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'} font-black italic text-slate-900 dark:text-white tracking-tighter underline decoration-brand-primary decoration-4 underline-offset-4`}
                                >
                                    {MARKET_METRICS.deliveryTime}
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
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 2xl:mb-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-20 2xl:gap-12">
                        {BRANDS.slice(0, 9).map(brandName => (
                            <Link
                                key={brandName}
                                href={`/store/catalog?brand=${brandName}`}
                                className="group flex items-center justify-start border-b border-slate-100 dark:border-white/5 pb-8 hover:border-brand-primary transition-all duration-500"
                            >
                                <div className="space-y-4">
                                    <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-300 dark:text-slate-800 group-hover:text-brand-primary transition-colors duration-500">
                                        {brandName}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                        View Collection <ArrowRight size={14} className="text-brand-primary" />
                                    </div>
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
                                    desc: `Browse ${totalModels}+ models with unified dealer pricing.`,
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
                                    desc: `Secure the lowest EMI & get delivery in ${MARKET_METRICS.deliveryTime}.`,
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
            <section className="pt-16 pb-10 bg-slate-50 dark:bg-[#020617] transition-colors">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-8 xl:px-20">
                    <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
                        <p className="text-[12px] font-black text-brand-primary dark:text-brand-primary uppercase tracking-[0.5em] italic">
                            Curated Collections
                        </p>
                        <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white transition-colors">
                            Select Your Vibe
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                        {CATEGORIES.map((cat, i) => (
                            <Link
                                key={i}
                                href={cat.link}
                                className="group relative h-[640px] overflow-hidden rounded-[3.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex flex-col justify-end px-8 pt-10 pb-8 xl:px-10 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)] transition-all duration-700 isolate"
                            >
                                {/* Immersive Mesh Gradient - Hover State */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${cat.color} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 z-0 scale-150 group-hover:scale-100 blur-3xl`}
                                />

                                {/* Glass Shell Inner Border */}
                                <div className="absolute inset-0 border-[1px] border-white/20 dark:border-white/5 rounded-[3.5rem] z-10 pointer-events-none" />

                                {/* Top Left Feature Label */}
                                <div className="absolute top-10 left-10 z-20">
                                    {cat.features.slice(0, 1).map((feature, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-block px-4 py-2 rounded-full border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>

                                {/* Vertical Background Text (Magazine Style) */}
                                <span
                                    className="absolute top-0 right-0 h-full w-24 flex items-center justify-center font-black text-[88px] uppercase tracking-widest opacity-10 dark:opacity-10 italic text-slate-900 dark:text-white select-none whitespace-nowrap z-0 pointer-events-none rotate-180 scale-y-[1.35] origin-center"
                                    style={{ writingMode: 'vertical-rl' }}
                                >
                                    {cat.subtitle.replace('.', '')}
                                </span>

                                <div className="relative z-20 space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-4xl lg:text-4xl xl:text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-400 dark:group-hover:from-white dark:group-hover:to-slate-500">
                                            {cat.title}
                                        </h3>
                                        <div className="flex" />
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-sans font-medium leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity max-w-[90%] line-clamp-3">
                                            {cat.desc}
                                        </p>
                                    </div>
                                    <div className="pt-4 overflow-hidden w-full">
                                        <div className="flex w-full items-center justify-center gap-3 px-6 py-4 bg-[#F4B000] rounded-full text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-[0_0_20px_rgba(244,176,0,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(244,176,0,0.5)] hover:scale-[1.02]">
                                            EXPLORE {cat.title} <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Bike Image with Dynamic Shadow */}
                                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center z-10 pointer-events-none transition-all duration-1000">
                                    <div className="relative w-[100%] h-[100%] transition-all duration-1000">
                                        <Image
                                            src={cat.img}
                                            alt={cat.title}
                                            fill
                                            className="object-contain filter drop-shadow-[0_40px_50px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_20px_60px_rgba(255,255,255,0.05)] transition-all duration-1000"
                                        />
                                        {/* Dynamic Ground Glow/Shadow */}
                                        <div
                                            className={`absolute bottom-1/4 left-1/2 -translate-x-1/2 w-2/3 h-6 bg-gradient-to-r ${cat.color} to-transparent blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000 -z-10`}
                                        />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Restored Rider Pulse (Reviews) Section */}
            <RiderPulse />
        </div>
    );
}
