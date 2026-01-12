'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Shield, Star, Search, MapPin, Zap, Check, Play, BadgeCheck, Award, TrendingUp, Calculator, Bike } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { MOCK_VEHICLES } from '@/types/productMaster';

/**
 * Landing Page V2 - Redesigned based on expert research
 * 
 * Key Changes:
 * 1. Trust-first above the fold (partner logos, metrics visible immediately)
 * 2. Single clear CTA
 * 3. Benefits-focused copy
 * 4. Social proof prominent
 * 5. Mobile-first responsive
 */
export default function LandingV2Page() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<typeof MOCK_VEHICLES>([]);
    const [showResults, setShowResults] = React.useState(false);
    const searchRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 1) {
            const filtered = MOCK_VEHICLES.filter(v =>
                v.displayName?.toLowerCase().includes(query.toLowerCase()) ||
                v.make.toLowerCase().includes(query.toLowerCase()) ||
                v.model.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(filtered);
            setShowResults(true);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] transition-colors">

            {/* ==================== HERO SECTION ==================== */}
            <section className="relative min-h-[100svh] flex flex-col">

                {/* Trust Bar - Immediately Visible */}
                <div className="bg-slate-900 dark:bg-black py-3 px-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-8 overflow-x-auto">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 whitespace-nowrap">
                            <BadgeCheck size={14} className="text-emerald-500" />
                            <span>500+ Verified Models</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-white/60 whitespace-nowrap">
                            <Shield size={14} className="text-blue-500" />
                            <span>Lowest EMI Guarantee</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-white/60 whitespace-nowrap">
                            <Zap size={14} className="text-amber-500" />
                            <span>48hr Delivery</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 whitespace-nowrap">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span>4.9/5 (2,400+ Reviews)</span>
                        </div>
                    </div>
                </div>

                {/* Main Hero Content */}
                <div className="flex-1 flex items-center relative overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/images/hero/lifestyle_1.png"
                            alt="Premium Two-Wheeler"
                            className="w-full h-full object-cover opacity-20 dark:opacity-30"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white dark:from-[#020617] dark:via-[#020617]/80 dark:to-[#020617]" />
                    </div>

                    <div className="max-w-6xl mx-auto px-6 py-16 relative z-10 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                            {/* Left Column - Value Proposition */}
                            <div className="space-y-8">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full">
                                    <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                                        India's #1 Two-Wheeler Marketplace
                                    </span>
                                </div>

                                {/* Main Headline */}
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                                    <span className="text-slate-900 dark:text-white">Stop Haggling.</span>
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                        Start Riding.
                                    </span>
                                </h1>

                                {/* Subheadline - Benefit focused */}
                                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                                    Get <strong className="text-slate-900 dark:text-white">India's best on-road price</strong> with
                                    transparent quotes, instant EMI approval, and doorstep delivery.
                                    <span className="text-blue-600 font-semibold"> No hidden costs. Ever.</span>
                                </p>

                                {/* Primary CTA - Single Focus */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        href="/store/catalog"
                                        className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-2xl font-bold text-sm uppercase tracking-wide hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 group"
                                    >
                                        Explore 500+ Models
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <button className="inline-flex items-center justify-center gap-3 px-6 py-5 border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-2xl font-bold text-sm uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                        <Play size={16} className="text-blue-600" fill="currentColor" />
                                        Watch How It Works
                                    </button>
                                </div>

                                {/* Quick Stats - Trust Elements */}
                                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 dark:border-white/10">
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-slate-900 dark:text-white">₹12K+</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Avg. Savings</p>
                                    </div>
                                    <div className="text-center border-x border-slate-200 dark:border-white/10">
                                        <p className="text-3xl font-black text-slate-900 dark:text-white">48h</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Delivery</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-slate-900 dark:text-white">15K+</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Happy Riders</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Search & Quick Actions */}
                            <div className="space-y-6">
                                {/* Search Box */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-2xl border border-slate-200 dark:border-white/10" ref={searchRef}>
                                    <div className="flex items-center px-6 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                                        <Search size={20} className="text-slate-400 mr-4" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearch}
                                            placeholder="Search by model, make or category..."
                                            className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                                        />
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {showResults && searchResults.length > 0 && (
                                        <div className="mt-2 max-h-[250px] overflow-y-auto">
                                            {searchResults.slice(0, 5).map((vehicle) => (
                                                <Link
                                                    key={vehicle.id}
                                                    href={`/store/catalog?search=${vehicle.model}`}
                                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all"
                                                >
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center font-bold text-slate-400">
                                                        {vehicle.make[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{vehicle.displayName}</p>
                                                        <p className="text-xs text-slate-500">{vehicle.make} • {vehicle.variant}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Categories */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: <Bike size={24} />, label: 'Scooters', count: '150+', href: '/store/catalog?category=SCOOTER' },
                                        { icon: <Zap size={24} />, label: 'Electric', count: '80+', href: '/store/catalog?category=ELECTRIC' },
                                        { icon: <TrendingUp size={24} />, label: 'Motorcycles', count: '200+', href: '/store/catalog?category=MOTORCYCLE' },
                                        { icon: <Calculator size={24} />, label: 'EMI Calculator', count: '', href: '/calculator' },
                                    ].map((cat, i) => (
                                        <Link
                                            key={i}
                                            href={cat.href}
                                            className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-white/10 hover:shadow-lg transition-all group"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {cat.icon}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{cat.label}</p>
                                                {cat.count && <p className="text-xs text-slate-500">{cat.count} models</p>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Partner Logos - Immediately visible */}
                <div className="border-t border-slate-200 dark:border-white/5 py-8 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-sm">
                    <div className="max-w-6xl mx-auto px-6">
                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Trusted Partners</p>
                        <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap opacity-50">
                            {['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'YAMAHA', 'SUZUKI'].map((brand) => (
                                <span key={brand} className="text-[10px] md:text-xs font-black text-slate-500 tracking-widest">{brand}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* ==================== WHY US SECTION ==================== */}
            <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-4">Why BookMy.Bike</p>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                            The Smarter Way to Buy
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Shield size={32} />,
                                title: 'Transparent Pricing',
                                desc: 'No hidden charges. The price you see is the price you pay. Verified dealer quotes.',
                                color: 'bg-emerald-500'
                            },
                            {
                                icon: <Zap size={32} />,
                                title: 'Instant EMI Approval',
                                desc: 'Compare EMIs from 10+ banks in seconds. Get approved in under 15 minutes.',
                                color: 'bg-blue-600'
                            },
                            {
                                icon: <Award size={32} />,
                                title: 'Doorstep Delivery',
                                desc: 'Your new ride delivered to your home within 48 hours. White-glove service.',
                                color: 'bg-amber-500'
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-white/5 hover:shadow-xl transition-all group">
                                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ==================== SOCIAL PROOF SECTION ==================== */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="max-w-6xl mx-auto px-6 mb-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-4">Member Stories</p>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                                15,000+ Happy Riders
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} className="text-yellow-500 fill-yellow-500" />)}
                            <span className="ml-2 text-sm font-bold text-slate-400">4.9/5 from 2,400+ reviews</span>
                        </div>
                    </div>
                </div>

                {/* Testimonial Carousel */}
                <div className="relative">
                    <div className="flex gap-6 animate-marquee whitespace-nowrap py-4">
                        {[
                            { name: 'Arjun K.', bike: 'Pulsar NS200', quote: 'Saved ₹8,000 compared to showroom. Transparent process.' },
                            { name: 'Priya S.', bike: 'Activa 6G', quote: 'EMI approved in 10 minutes. Delivery in 2 days!' },
                            { name: 'Rahul M.', bike: 'Apache RTR', quote: 'No hidden charges. Best price guaranteed.' },
                            { name: 'Sneha R.', bike: 'Jupiter 125', quote: 'Professional delivery team. Perfect condition.' },
                            { name: 'Karthik P.', bike: 'FZ-S V4', quote: 'Got the exact color no dealer had in stock.' },
                        ].concat([
                            { name: 'Arjun K.', bike: 'Pulsar NS200', quote: 'Saved ₹8,000 compared to showroom. Transparent process.' },
                            { name: 'Priya S.', bike: 'Activa 6G', quote: 'EMI approved in 10 minutes. Delivery in 2 days!' },
                            { name: 'Rahul M.', bike: 'Apache RTR', quote: 'No hidden charges. Best price guaranteed.' },
                            { name: 'Sneha R.', bike: 'Jupiter 125', quote: 'Professional delivery team. Perfect condition.' },
                            { name: 'Karthik P.', bike: 'FZ-S V4', quote: 'Got the exact color no dealer had in stock.' },
                        ]).map((m, i) => (
                            <div key={i} className="inline-block w-[350px] p-6 bg-white/5 border border-white/10 rounded-2xl whitespace-normal flex-shrink-0">
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="text-yellow-500 fill-yellow-500" />)}
                                </div>
                                <p className="text-white/90 mb-4 leading-relaxed">"{m.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">{m.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-bold text-sm">{m.name}</p>
                                        <p className="text-xs text-slate-400">{m.bike}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-slate-900 to-transparent" />
                    <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-slate-900 to-transparent" />
                </div>
            </section>


            {/* ==================== FINAL CTA SECTION ==================== */}
            <section className="py-24 bg-blue-600 text-white text-center">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                        Ready to Find Your Legend?
                    </h2>
                    <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
                        Join 15,000+ riders who saved time and money buying their dream two-wheeler.
                    </p>
                    <Link
                        href="/store/catalog"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-sm uppercase tracking-wide hover:bg-slate-100 transition-all shadow-xl group"
                    >
                        Start Exploring Now
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

        </div>
    );
}
