'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShieldCheck, Zap, Star, ChevronRight } from 'lucide-react';
import { BRANDS } from '@/lib/data/brands';

export default function BrandPage() {
    const params = useParams();
    const make = params.make as string;
    const brandData = BRANDS[make.toLowerCase()];

    // Fallback if brand data is missing
    const brandName = brandData?.name || make.toUpperCase();
    const brandTagline = brandData?.tagline || 'Leading the way in mobility.';
    const brandDesc =
        brandData?.description || 'Explore the complete range of vehicles engineered for performance and reliability.';

    return (
        <div className="min-h-screen bg-white dark:bg-[#0b0d10] transition-colors">
            <main>
                {/* Hero Section */}
                <section className="relative min-h-[60vh] flex flex-col pt-28 pb-16 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10" />
                        <div className="absolute inset-0 bg-slate-100 dark:bg-[#0f1115] transition-colors" />
                        {/* Background Text Overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none opacity-[0.03] dark:opacity-[0.05]">
                            <h1 className="text-[30rem] font-black uppercase italic tracking-tighter leading-none">
                                {brandName}
                            </h1>
                        </div>
                    </div>

                    <div className="page-container relative z-20">
                        <div className="max-w-3xl space-y-8">
                            <Link
                                href="/store"
                                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 hover:gap-4 transition-all"
                            >
                                <ArrowLeft size={14} /> Back to Store
                            </Link>

                            <div className="space-y-4">
                                <p className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.5em] italic">
                                    Premier Selection
                                </p>
                                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter italic leading-[0.8] text-slate-900 dark:text-white">
                                    {brandName}
                                </h1>
                                <p className="text-xl md:text-2xl font-bold text-slate-600 dark:text-slate-300 tracking-tight italic">
                                    {brandTagline}
                                </p>
                            </div>

                            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl font-medium leading-relaxed">
                                {brandDesc}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
                                <Link
                                    href={`/store/catalog?brand=${brandName.toUpperCase()}`}
                                    className="w-full sm:w-auto px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                                >
                                    Browse Lineup <ArrowRight size={18} />
                                </Link>
                                <button className="w-full sm:w-auto px-10 py-5 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white transition-all backdrop-blur-md">
                                    Brand Story
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Placeholder for Flagship Image */}
                    <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-1/2 h-full hidden lg:flex items-center justify-center">
                        <div className="w-full aspect-square bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
                        {/* We will ideally put a transparent bike image here focused on the brand */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 dark:opacity-40">
                            <h2 className="text-[20rem] font-black italic select-none">{brandName[0]}</h2>
                        </div>
                    </div>
                </section>

                {/* Features / Why This Brand */}
                <section className="py-24 bg-slate-50 dark:bg-white/[0.02] border-y border-slate-200 dark:border-white/10 transition-colors">
                    <div className="page-container">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="text-blue-600" size={24} />
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                                    Built To Last
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {brandName} is known for exceptional build quality and mechanical endurance.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                    <Zap className="text-emerald-500" size={24} />
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                                    Smart Tech
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Integrated connectivity and the latest engine technology for the modern rider.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                                    <Star className="text-amber-500" size={24} />
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                                    High Resale
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Market-leading valuation retention across all {brandName} models in India.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Featured Models Section */}
                <section className="py-24 md:py-32 bg-white dark:bg-[#0b0d10] transition-colors">
                    <div className="page-container">
                        <div className="text-center mb-20 space-y-4">
                            <p className="text-[12px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.5em] italic">
                                The Lineup
                            </p>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white transition-colors">
                                Featured {brandName} Models
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6">
                            {[
                                {
                                    title: 'Scooters',
                                    subtitle: 'Urban Mobility.',
                                    desc: 'Daily commute perfected.',
                                    img: '/images/categories/scooter_nobg.png',
                                    color: 'bg-cyan-500',
                                    link: `/store/catalog?category=SCOOTER&brand=${brandName.toUpperCase()}`,
                                },
                                {
                                    title: 'Motorcycles',
                                    subtitle: 'Power & Performance.',
                                    desc: 'Engineered for the open road.',
                                    img: '/images/categories/motorcycle_nobg.png',
                                    color: 'bg-rose-500',
                                    link: `/store/catalog?category=MOTORCYCLE&brand=${brandName.toUpperCase()}`,
                                },
                                {
                                    title: 'Mopeds',
                                    subtitle: 'Utility & Efficiency.',
                                    desc: 'Heavy-duty performance.',
                                    img: '/images/categories/moped_nobg.png',
                                    color: 'bg-amber-500',
                                    link: `/store/catalog?category=MOPED&brand=${brandName.toUpperCase()}`,
                                },
                                {
                                    title: 'Electric',
                                    subtitle: 'Zero Emissions.',
                                    desc: 'The future of clean energy.',
                                    img: '/images/categories/scooter_nobg.png',
                                    color: 'bg-emerald-500',
                                    link: `/store/catalog?category=ELECTRIC&brand=${brandName.toUpperCase()}`,
                                },
                            ].map((cat, i) => (
                                <div
                                    key={i}
                                    className="group relative h-[550px] overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1115] flex flex-col items-center justify-end p-6 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-100/20 to-transparent dark:from-slate-950 dark:via-slate-950/20 dark:to-transparent z-10 transition-colors" />
                                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 scale-100 group-hover:scale-110 transition-transform duration-1000 opacity-50" />

                                    <div className="relative z-20 space-y-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 w-full text-center">
                                        <div className="space-y-4">
                                            <div className={`w-12 h-1.5 ${cat.color} rounded-full mx-auto`} />
                                            <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white transition-colors">
                                                {cat.title}
                                            </h3>
                                            <div className="space-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <p className="text-sm text-slate-700 dark:text-white font-bold uppercase tracking-widest transition-colors">
                                                    {cat.subtitle}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed transition-colors">
                                                    {cat.desc}
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={cat.link}
                                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl"
                                        >
                                            View Collection
                                        </Link>
                                    </div>

                                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center opacity-100 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                        <img
                                            src={cat.img}
                                            alt={cat.title}
                                            className="w-[95%] max-w-none h-auto object-contain filter contrast-110 drop-shadow-[0_40px_80px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_20px_100px_rgba(255,255,255,0.08)]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 md:py-32 relative overflow-hidden bg-slate-900 dark:bg-[#050505] text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
                    <div className="page-container text-center space-y-12 relative z-10">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                                Your Perfect {brandName} <br /> Is Just A Click Away.
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
                                Get instant quotes, customized finance plans, and doorstep delivery for all {brandName}{' '}
                                models.
                            </p>
                        </div>
                        <Link
                            href={`/store/catalog?brand=${brandName.toUpperCase()}`}
                            className="inline-flex h-20 px-12 bg-white dark:bg-white text-black hover:bg-blue-500 hover:text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all items-center justify-center gap-4 group"
                        >
                            Explore The Collection{' '}
                            <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
