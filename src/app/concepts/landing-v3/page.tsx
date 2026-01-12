'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

/**
 * Landing Page V3 - Premium Cinematic Design
 * Updated with blurred hero background
 */
export default function LandingV3Page() {
    const scrollToContent = () => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    };

    return (
        <div className="bg-black text-white overflow-x-hidden">

            {/* =============== HERO - FULL SCREEN CINEMATIC =============== */}
            <section className="relative h-screen flex flex-col">

                {/* Background - Blurred Bike Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero/blurred_bike_hero.png"
                        alt=""
                        className="w-full h-full object-cover"
                    />
                    {/* Cinematic Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
                </div>

                {/* Minimal Header */}
                <header className="relative z-20 flex items-center justify-between px-8 md:px-16 py-6">
                    <Logo mode="dark" size={36} variant="full" />
                    <nav className="hidden md:flex items-center gap-12">
                        {['Models', 'Compare', 'Finance', 'About'].map((item) => (
                            <Link
                                key={item}
                                href={`/${item.toLowerCase()}`}
                                className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>
                    <Link
                        href="/store/catalog"
                        className="text-[11px] font-bold uppercase tracking-[0.15em] text-white border border-white/20 px-6 py-3 rounded-full hover:bg-white hover:text-black transition-all"
                    >
                        Shop All
                    </Link>
                </header>

                {/* Hero Content - Bottom Aligned */}
                <div className="relative z-10 flex-1 flex flex-col justify-end px-8 md:px-16 pb-24 md:pb-32">
                    <div className="max-w-3xl space-y-6">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                            India's #1 Two-Wheeler Marketplace
                        </p>
                        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9]">
                            Your Next<br />Legend Awaits.
                        </h1>
                        <p className="text-xl md:text-2xl text-white/70 font-light tracking-wide">
                            500+ models. Lowest EMI. 48-hour delivery.
                        </p>
                        <div className="flex items-center gap-8 pt-4">
                            <Link
                                href="/store/catalog"
                                className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-sm uppercase tracking-wider hover:bg-slate-100 transition-colors"
                            >
                                Explore Collection
                                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <button
                    onClick={scrollToContent}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-white/40 hover:text-white transition-colors animate-bounce"
                >
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] mb-2">Scroll</span>
                    <ChevronDown size={20} />
                </button>
            </section>


            {/* =============== VALUE PROPS - MINIMAL STRIPE =============== */}
            <section className="bg-[#0a0a0a] py-20 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-8 md:px-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 text-center md:text-left">
                        {[
                            { value: '500+', label: 'Models Available' },
                            { value: '₹12K', label: 'Average Savings' },
                            { value: '48hr', label: 'Doorstep Delivery' },
                            { value: '15K+', label: 'Happy Riders' },
                        ].map((stat, i) => (
                            <div key={i} className="space-y-2">
                                <p className="text-4xl md:text-5xl font-black tracking-tight">{stat.value}</p>
                                <p className="text-sm text-white/40 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* =============== FEATURED CATEGORIES - GRID =============== */}
            <section className="py-32 bg-black">
                <div className="max-w-7xl mx-auto px-8 md:px-16">
                    <div className="flex items-end justify-between mb-16">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-4">Browse By</p>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tight">Categories</h2>
                        </div>
                        <Link href="/store/catalog" className="hidden md:flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { name: 'Scooters', count: '150+', color: 'from-cyan-600/20' },
                            { name: 'Motorcycles', count: '200+', color: 'from-red-600/20' },
                            { name: 'Electric', count: '80+', color: 'from-emerald-600/20' },
                            { name: 'Premium', count: '50+', color: 'from-amber-600/20' },
                        ].map((cat, i) => (
                            <Link
                                key={i}
                                href={`/store/catalog?category=${cat.name.toUpperCase()}`}
                                className={`group relative h-80 rounded-3xl overflow-hidden bg-gradient-to-b ${cat.color} to-transparent border border-white/5 hover:border-white/20 transition-all`}
                            >
                                <div className="absolute inset-x-0 bottom-0 p-8">
                                    <p className="text-3xl font-black">{cat.name}</p>
                                    <p className="text-sm text-white/50 mt-1">{cat.count} models</p>
                                </div>
                                <div className="absolute top-6 right-6 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                                    <ArrowRight size={16} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>


            {/* =============== BRAND SHOWCASE =============== */}
            <section className="py-24 bg-[#0a0a0a] overflow-hidden">
                <div className="max-w-7xl mx-auto px-8 md:px-16 mb-12">
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-4">Our Partners</p>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight">Official Manufacturers</h2>
                </div>

                <div className="flex gap-8 animate-marquee whitespace-nowrap py-8">
                    {['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'YAMAHA', 'SUZUKI', 'HERO', 'KTM', 'KAWASAKI', 'BMW'].concat(['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'YAMAHA', 'SUZUKI', 'HERO', 'KTM', 'KAWASAKI', 'BMW']).map((brand, i) => (
                        <Link
                            key={i}
                            href={`/store/${brand.toLowerCase()}`}
                            className="flex-shrink-0 px-12 py-8 border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all"
                        >
                            <span className="text-2xl font-black tracking-widest text-white/30 hover:text-white transition-colors">{brand}</span>
                        </Link>
                    ))}
                </div>
            </section>


            {/* =============== FINAL CTA =============== */}
            <section className="relative py-40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
                <div className="absolute inset-0 opacity-30">
                    <img src="/images/hero/blurred_bike_hero.png" alt="" className="w-full h-full object-cover" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
                        Find Your Legend
                    </h2>
                    <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
                        Join 15,000+ riders who found their dream two-wheeler at India's best price.
                    </p>
                    <Link
                        href="/store/catalog"
                        className="inline-flex items-center gap-4 px-12 py-6 bg-white text-black rounded-full font-bold text-sm uppercase tracking-wider hover:bg-slate-100 transition-all group"
                    >
                        Start Exploring
                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>
            </section>


            {/* =============== FOOTER =============== */}
            <footer className="bg-black py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-8 md:px-16">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <Logo mode="dark" size={32} variant="full" />
                        <div className="flex items-center gap-8">
                            {['Privacy', 'Terms', 'Help'].map((link) => (
                                <Link key={link} href={`/${link.toLowerCase()}`} className="text-sm text-white/40 hover:text-white transition-colors">
                                    {link}
                                </Link>
                            ))}
                        </div>
                        <p className="text-sm text-white/30">© 2026 BookMy.Bike</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}
