'use client';

import React from 'react';
import Link from 'next/link';

import Image from 'next/image';
import { ArrowRight, Search, Zap, MapPin } from 'lucide-react';
import { CATEGORIES, MARKET_METRICS, BRANDS } from '@/config/market';
import { useState } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { RiderPulse } from '@/components/store/RiderPulse';

interface StoreDesktopProps {
    variant?: 'default' | 'tv';
}

export function MasterLayout({ variant: _variant = 'default' }: StoreDesktopProps) {
    const { items, skuCount } = useCatalog();
    const totalSkus = skuCount || items.length || 500; // Fallback to 500 if loading or empty
    const isTv = false; // TV logic moved to dedicated StoreTV component



    // Hero Template: Night City (Chosen by User)
    const heroImage = '/images/templates/t3_night.png';

    return (
        <div className="flex flex-col pb-0 transition-colors duration-300">
            {/* Premium Photography Hero Section */}
            <section
                className={`relative flex flex-col justify-end overflow-hidden bg-white dark:bg-[#0b0d10] isolate transition-colors duration-500 ${isTv ? 'pt-16 pb-10' : 'pt-20 pb-12'}`}
            >
                <div className="absolute inset-0 z-0 pointer-events-none bg-slate-50 dark:bg-[#0B0D10] transition-all duration-700">
                    <img
                        src={heroImage}
                        alt="BookMyBike Hero"
                        className="w-full h-full object-cover object-center opacity-100 dark:opacity-40 animate-in fade-in duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/20 to-white/90 dark:from-[#0B0D10]/90 dark:via-[#0B0D10]/40 dark:to-[#0B0D10] mix-blend-normal transition-all duration-700" />
                    {/* Extra contrast layer for text readability */}
                    <div className="absolute inset-0 bg-black/10 dark:bg-black/40 pointer-events-none" />
                </div>

                <div className="mx-auto relative z-10 w-full text-center max-w-[1600px] px-6 md:px-12 lg:px-20 pt-12 pb-10">
                    <div className="space-y-6">
                        <div className="space-y-5">
                            {/* Confidence Chip Badge - Subtle Fill, No Outline */}
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-8 bg-emerald-950/30 backdrop-blur-md shadow-sm border border-emerald-500/20 shadow-emerald-900/20">
                                India&apos;s Lowest EMI Guarantee
                            </div>

                            <h1 className="pb-8 font-black uppercase tracking-tighter leading-[0.9] text-center">
                                {/* Top: "Redefining" - Medium Strong */}
                                <span className="block text-3xl sm:text-4xl md:text-5xl text-slate-300 font-extrabold tracking-[0.15em] mb-2 drop-shadow-lg">
                                    Redefining
                                </span>

                                {/* Middle: "How India Buys" - Large */}
                                <span className="block text-5xl sm:text-6xl md:text-7xl text-white mb-2 drop-shadow-xl">
                                    How India Buys
                                </span>

                                {/* Bottom: "Motorcycles" - Massive/Explosive */}
                                <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8rem] text-[#F4B000] drop-shadow-xl scale-y-110 origin-bottom">
                                    Motorcycles
                                </span>
                            </h1>

                            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-center items-center gap-2 md:gap-8 text-slate-200 text-lg sm:text-xl font-medium tracking-wide drop-shadow-md uppercase whitespace-nowrap">
                                <span>Transparent prices.</span>
                                <span>Verified dealers.</span>
                                <span>Lowest EMI guarantee.</span>
                            </div>
                        </div>

                        {/* Search + Drive Cluster */}
                        <div className="w-full max-w-2xl mx-auto relative z-50 space-y-6 mt-2">
                            <div className="flex flex-col items-center gap-4">
                                <Link
                                    href="/store/catalog"
                                    className="h-14 w-full max-w-xl px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                                >
                                    <Search size={18} />
                                    <span className="text-sm font-bold uppercase tracking-[0.15em]">
                                        Search Motorcycle
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Metrics Section - Enhanced Visibility */}
                        <div className="w-full max-w-5xl mx-auto grid grid-cols-3 gap-4 md:gap-0 border-t border-white/10 transition-colors py-6 mt-6 bg-black/40 backdrop-blur-md rounded-full">
                            <div className="text-center group cursor-default space-y-1">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">
                                    Models
                                </p>
                                <p className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                                    {totalSkus}+
                                </p>
                            </div>
                            <div className="text-center group cursor-default space-y-1 relative">
                                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-white/10" />
                                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-white/10" />
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">
                                    Avg Savings
                                </p>
                                <p className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                                    {MARKET_METRICS.avgSavings}
                                </p>
                            </div>
                            <div className="text-center group cursor-default space-y-1">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">
                                    Delivery
                                </p>
                                <p className="text-3xl md:text-4xl font-black text-white tracking-tight underline cursor-pointer decoration-brand-primary/50 hover:decoration-brand-primary decoration-4 underline-offset-4 transition-all drop-shadow-sm">
                                    {MARKET_METRICS.deliveryTime}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section className="py-12 md:py-16 lg:py-20 bg-white dark:bg-[#0b0d10] transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

                <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-4 2xl:mb-3">
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
                            className="group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 hover:text-brand-primary transition-all"
                        >
                            View Full Directory{' '}
                            <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary group-hover:text-black transition-all">
                                <ArrowRight size={14} />
                            </div>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 2xl:gap-8">
                        {BRANDS.slice(0, 9).map(brandName => (
                            <Link
                                key={brandName}
                                href={`/store/catalog?brand=${brandName}`}
                                className="group flex items-center justify-start border-b border-slate-100 dark:border-white/5 pb-6 hover:border-brand-primary transition-all duration-500"
                            >
                                <div className="space-y-4">
                                    <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-300 dark:text-zinc-700 group-hover:text-brand-primary transition-colors duration-500">
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
            <section className="py-12 md:py-16 lg:py-20 bg-[#0b0d10] text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#FFD700,transparent_70%)]" />
                </div>

                <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
                    <div className="grid grid-cols-12 gap-12 items-center">
                        <div className="col-span-5 space-y-6">
                            <div className="space-y-4">
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
                            <p className="text-xl text-zinc-400 font-medium italic leading-relaxed">
                                We’ve digitized the dealership floor. <br />
                                Transparent, instant, and absolute.
                            </p>
                        </div>

                        <div className="col-span-7 grid grid-cols-3 gap-3">
                            {[
                                {
                                    step: '01',
                                    title: 'Select',
                                    desc: `Browse ${totalSkus}+ SKU with unified dealer pricing.`,
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
                                    className="group p-7 bg-white/5 border border-white/5 rounded-[3rem] space-y-5 hover:bg-white/10 transition-all duration-500"
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
                                        <p className="text-sm text-zinc-400 font-medium leading-relaxed">
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
            <section className="pt-10 pb-8 bg-slate-50 dark:bg-[#0b0d10] transition-colors">
                <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-8 xl:px-20">
                    <div className="text-center max-w-3xl mx-auto mb-5 space-y-3">
                        <p className="text-[12px] font-black text-brand-primary dark:text-brand-primary uppercase tracking-[0.5em] italic">
                            Curated Collections
                        </p>
                        <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white transition-colors">
                            Select Your Vibe
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-5">
                        {CATEGORIES.map((cat, i) => (
                            <Link
                                key={i}
                                href={cat.link}
                                className="group relative h-[640px] overflow-hidden rounded-[3.5rem] bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 flex flex-col justify-end px-8 pt-10 pb-8 xl:px-10 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)] transition-all duration-700 isolate"
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
                                        <h3 className="text-4xl lg:text-4xl xl:text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-400 dark:group-hover:from-white dark:group-hover:to-zinc-400">
                                            {cat.title}
                                        </h3>
                                        <div className="flex" />
                                        <p className="text-sm text-slate-700 dark:text-zinc-300 font-sans font-medium leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity max-w-[90%] line-clamp-3">
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
