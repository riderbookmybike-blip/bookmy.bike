'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Zap, Play, Shield, Star, Trophy, Search, MapPin } from 'lucide-react';
import { MOCK_VEHICLES } from '@/types/productMaster';

export default function StorePage() {
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
        <div className="flex flex-col pb-40 transition-colors duration-300">
            {/* Premium Photography Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-black isolate transition-colors duration-300">
                {/* 1. Cinematic Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero/lifestyle_1.png"
                        alt="Premium Superbike Lifestyle"
                        className="w-full h-full object-cover opacity-20 dark:opacity-60 scale-100 transition-opacity duration-300"
                    />
                    {/* Atmospheric Lighting Overlays */}
                    <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-slate-50 via-slate-50/40 to-transparent dark:from-black dark:via-black/40 dark:to-transparent transition-colors duration-300" />
                    <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-slate-50 via-slate-50/20 to-transparent dark:from-black dark:via-black/20 dark:to-transparent transition-colors duration-300" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,white_85%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,black_85%)] transition-colors duration-300" />

                    {/* Center Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 dark:bg-blue-500/10 blur-[150px] rounded-full animate-pulse-slow" />
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full text-center pt-20">
                    <div className="space-y-12 md:space-y-16">

                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 dark:bg-blue-600/20 border border-blue-600/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <Zap size={12} fill="currentColor" className="animate-pulse" />
                                Lowest EMI Guaranteed
                            </div>
                            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black italic uppercase tracking-tighter leading-[0.9] animate-in fade-in zoom-in-95 duration-1000">
                                <span className="text-slate-900 dark:text-white drop-shadow-2xl dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors">Unlock The Best</span> <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-slate-800 to-slate-500 dark:from-blue-400 dark:via-white dark:to-slate-400 drop-shadow-sm dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">On-Road Experience</span>
                            </h1>
                            <p className="max-w-3xl mx-auto text-sm md:text-lg text-slate-600 dark:text-slate-300 font-medium tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 transition-colors leading-relaxed">
                                Beyond just a price tag. Get precision-engineered location quotes for <br className="hidden md:block" />
                                500+ premium bikes with India's most transparent mobility platform.
                            </p>
                        </div>

                        {/* Search + Price Bar */}
                        {/* Search Bar with Instant Results */}
                        <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 relative z-50">
                            <div ref={searchRef} className="relative">
                                <div className="bg-white/80 dark:bg-white/10 backdrop-blur-2xl border border-slate-200 dark:border-white/20 p-2 rounded-2xl md:rounded-full shadow-2xl shadow-blue-900/5 dark:shadow-blue-900/20 transition-all">
                                    <div className="flex items-center px-6 h-14 md:h-16 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-full focus-within:bg-white dark:focus-within:bg-white/10 transition-colors group">
                                        <Search className="text-slate-400 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors mr-4" size={20} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearch}
                                            placeholder="CLICK, COMPARE & RIDE YOUR WAY..."
                                            className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Instant Results Dropdown */}
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {searchResults.map((vehicle) => (
                                                <Link
                                                    key={vehicle.id}
                                                    href={`/store/catalog?search=${vehicle.model}`}
                                                    className="flex items-center gap-4 p-4 hover:bg-slate-100 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors group/item"
                                                >
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-xl font-black text-slate-400 dark:text-slate-500 group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">
                                                        {vehicle.make[0]}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">{vehicle.displayName}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{vehicle.make} • {vehicle.variant}</p>
                                                    </div>
                                                    <ArrowRight size={14} className="ml-auto text-slate-400 dark:text-slate-600 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-500 opacity-0 group-hover/item:opacity-100 transition-all" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex justify-center">
                                <Link href="/store/catalog" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                                    Explore The Collection <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>

                        {/* Updated Metrics Section */}
                        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 py-12 md:py-16 border-t border-slate-200 dark:border-white/5 transition-colors">
                            <div className="text-center group cursor-default">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">Premium Models</p>
                                <p className="text-3xl md:text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter transition-colors">500+</p>
                            </div>
                            <div className="w-full md:w-[1px] h-[1px] md:h-16 bg-slate-200 dark:bg-white/5 transition-colors" />
                            <div className="text-center group cursor-default">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">Avg. Savings</p>
                                <p className="text-3xl md:text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter transition-colors">₹12k+</p>
                            </div>
                            <div className="w-full md:w-[1px] h-[1px] md:h-16 bg-slate-200 dark:bg-white/5 transition-colors" />
                            <div className="text-center group cursor-default">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">Express Delivery</p>
                                <p className="text-3xl md:text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter transition-colors">48h</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Brand Directory */}
            <section className="py-24 md:py-32 bg-slate-50 dark:bg-white/[0.02] border-y border-slate-200 dark:border-white/5 transition-colors">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-16 sm:mb-24">
                        <div>
                            <p className="text-[12px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.5em] mb-4 leading-none italic">Partner Ecosystem</p>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white transition-colors">World-Class Brands</h2>
                        </div>
                        <Link href="/store/catalog" className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white flex items-center gap-3 transition-colors">
                            View All Partners <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'SUZUKI', 'YAMAHA'].map((brand) => (
                            <Link
                                key={brand}
                                href={`/store/${brand.toLowerCase()}`}
                                className="group h-32 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-3xl flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-600/10 dark:hover:border-blue-500/30 transition-all relative overflow-hidden shadow-sm hover:shadow-md"
                            >
                                <span className={`font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-blue-900 dark:group-hover:text-white transition-colors z-10 ${brand.length > 8 ? 'text-xs' : 'text-sm'}`}>{brand}</span>
                                <div className="absolute inset-0 bg-blue-500/5 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-3xl" />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight size={10} className="text-blue-500 dark:text-blue-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Categories */}
            <section className="pt-24 md:pt-40 pb-12 md:pb-20">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20 md:mb-32 space-y-6">
                        <p className="text-[12px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.5em] italic">The Collection</p>
                        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white transition-colors">Engineered For Every Soul</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6">
                        {[
                            { title: 'Scooters', subtitle: 'Urban Mobility.', desc: 'Daily commute perfected.', img: '/images/categories/scooter_nobg.png', color: 'bg-cyan-500', link: '/store/catalog?category=SCOOTER' },
                            { title: 'Motorcycles', subtitle: 'Power & Performance.', desc: 'Engineered for the open road.', img: '/images/categories/motorcycle_nobg.png', color: 'bg-rose-500', link: '/store/catalog?category=MOTORCYCLE' },
                            { title: 'Mopeds', subtitle: 'Utility & Efficiency.', desc: 'Heavy-duty performance.', img: '/images/categories/moped_nobg.png', color: 'bg-amber-500', link: '/store/catalog?category=MOPED' },
                            { title: 'Electric', subtitle: 'Zero Emissions.', desc: 'The future of clean energy.', img: '/images/categories/scooter_nobg.png', color: 'bg-emerald-500', link: '/store/catalog?category=ELECTRIC' },
                        ].map((cat, i) => (
                            <div key={i} className="group relative h-[550px] overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col items-center justify-end p-6 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-100/20 to-transparent dark:from-slate-950 dark:via-slate-950/20 dark:to-transparent z-10 transition-colors" />
                                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 scale-100 group-hover:scale-110 transition-transform duration-1000 opacity-50" />

                                <div className="relative z-20 space-y-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 w-full text-center">
                                    <div className="space-y-4">
                                        <div className={`w-12 h-1.5 ${cat.color} rounded-full mx-auto`} />
                                        <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white transition-colors">{cat.title}</h3>
                                        <div className="space-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <p className="text-sm text-slate-700 dark:text-white font-bold uppercase tracking-widest transition-colors">{cat.subtitle}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed transition-colors">{cat.desc}</p>
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



            {/* Fixed Floating Mascot Buddy */}
            <div className="fixed bottom-8 right-8 z-[100] group hidden md:block">
                <div className="absolute bottom-full right-0 mb-6 w-72 p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-3xl opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 pointer-events-none">
                    <p className="text-[12px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-500 mb-3 italic">BMB Buddy</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">"Hey! I'm BMB Buddy. Need help unlocking exclusive dealer prices? Just click the Referral button!"</p>
                    <div className="absolute bottom-0 right-14 translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-white/10 rotate-45" />
                </div>
                <div className="w-24 h-24 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-3 cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-3xl relative overflow-hidden group/mascot">
                    <img
                        src="/images/bmb_mascot.png"
                        alt="BMB Buddy"
                        className="w-full h-full object-contain relative z-10 animate-bounce-slow"
                    />
                    <div className="absolute inset-0 bg-blue-600/5 dark:bg-blue-600/10 blur-2xl group-hover/mascot:bg-blue-600/10 dark:group-hover/mascot:bg-blue-600/20 transition-colors" />
                </div>
            </div>
        </div>
    );
}
