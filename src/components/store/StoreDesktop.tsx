'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Zap, Shield, Star, Search, MapPin } from 'lucide-react';
import { MOCK_VEHICLES } from '@/types/productMaster';

export function StoreDesktop() {
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
            const filtered = MOCK_VEHICLES.filter(
                v =>
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
            <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-white dark:bg-[#020617] isolate transition-colors duration-500">
                <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50">
                    <img
                        src="/images/hero/lifestyle_1.png"
                        alt="Premium Superbike Lifestyle"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white dark:from-[#020617] dark:via-[#020617]/40 dark:to-[#020617]" />
                </div>

                <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20 relative z-10 w-full text-center pt-16">
                    <div className="space-y-12 md:space-y-16">
                        <div className="space-y-10">
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/10 dark:border-brand-primary/20 text-brand-primary dark:text-brand-primary rounded-full text-[11px] font-black uppercase tracking-[0.3em] mb-4">
                                <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-ping" />
                                India’s Lowest EMI Guarantee
                            </div>

                            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[8.5rem] font-black italic uppercase tracking-tighter leading-[0.85]">
                                <span className="text-slate-900 dark:text-white transition-colors">Your Next</span>{' '}
                                <br />
                                <span className="text-[#FFD700] drop-shadow-md transition-all">Legend Awaits.</span>
                            </h1>

                            <p className="max-w-3xl mx-auto text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium tracking-wide transition-colors leading-relaxed italic">
                                Stop Negotiating. Start Riding. India&apos;s Best On-Road Price.{' '}
                                <br className="hidden md:block" />
                                Unified rates from verified dealers. Instant location-based quotes. The industry&apos;s
                                lowest EMIs, unlocked.
                            </p>
                        </div>

                        {/* Search + Drive Cluster */}
                        <div className="w-full max-w-4xl mx-auto space-y-10 relative z-50">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-8 group relative" ref={searchRef}>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1.5 rounded-[2rem] shadow-2xl shadow-black/5 transition-all focus-within:shadow-brand-primary/20 focus-within:border-brand-primary/30">
                                        <div className="flex items-center px-6 h-16 bg-slate-50 dark:bg-white/5 rounded-[1.75rem] transition-colors">
                                            <Search
                                                className="text-slate-400 group-focus-within:text-brand-primary transition-colors mr-4"
                                                size={22}
                                            />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={handleSearch}
                                                placeholder="Model, Make or Category..."
                                                className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs"
                                            />
                                        </div>
                                    </div>

                                    {showResults && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl z-[100]">
                                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-4">
                                                {searchResults.map(vehicle => (
                                                    <Link
                                                        key={vehicle.id}
                                                        href={`/store/catalog?search=${vehicle.model}`}
                                                        className="flex items-center gap-5 p-4 hover:bg-white dark:hover:bg-white/5 rounded-2xl transition-all group/item mb-1 last:mb-0"
                                                    >
                                                        <div className="w-14 h-14 bg-slate-100 dark:bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black text-slate-400 dark:text-slate-500 group-hover/item:bg-brand-primary group-hover/item:text-black transition-all">
                                                            {vehicle.make[0]}
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide group-hover/item:text-brand-primary transition-colors">
                                                                {vehicle.displayName}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">
                                                                {vehicle.make} • {vehicle.variant}
                                                            </p>
                                                        </div>
                                                        <ChevronRight
                                                            size={16}
                                                            className="text-slate-300 group-hover/item:translate-x-1 transition-transform"
                                                        />
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-4 h-full">
                                    <Link
                                        href="/store/catalog"
                                        className="h-[76px] bg-slate-900 dark:bg-white text-white dark:text-black rounded-[2rem] flex items-center justify-center gap-3 px-8 hover:bg-brand-primary dark:hover:bg-brand-primary hover:text-black dark:hover:text-black transition-all shadow-xl group/btn overflow-hidden relative"
                                    >
                                        <span className="text-xs font-black uppercase tracking-[0.2em] relative z-10">
                                            Explore Collection
                                        </span>
                                        <ArrowRight
                                            size={18}
                                            className="group-hover/btn:translate-x-2 transition-transform relative z-10"
                                        />
                                        <div className="absolute inset-0 bg-brand-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                                    </Link>
                                </div>
                            </div>

                            <div className="flex justify-center gap-12 opacity-40">
                                {['Transparency', 'Speed', 'Precision'].map(item => (
                                    <div key={item} className="flex items-center gap-2">
                                        <Shield size={14} className="text-brand-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Metrics Section */}
                        <div className="w-full max-w-5xl mx-auto grid grid-cols-3 gap-4 md:gap-0 py-8 border-t border-slate-200 dark:border-white/5 transition-colors">
                            <div className="text-center group cursor-default space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {'>'} Models
                                </p>
                                <p className="text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter">
                                    500+
                                </p>
                            </div>
                            <div className="text-center group cursor-default space-y-1 border-x border-slate-200 dark:border-white/5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {'>'} Savings
                                </p>
                                <p className="text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter">
                                    ₹12k+
                                </p>
                            </div>
                            <div className="text-center group cursor-default space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {'>'} Delivery
                                </p>
                                <p className="text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter underline decoration-brand-primary decoration-8 underline-offset-[-2px]">
                                    48h
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Brand Directory */}
            <section className="py-48 bg-white dark:bg-[#020617] transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

                <div className="max-w-[1400px] mx-auto px-6">
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

                    <div className="grid grid-cols-6 gap-6">
                        {['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'SUZUKI', 'YAMAHA'].map(brand => (
                            <Link key={brand} href={`/store/catalog?search=${brand.toLowerCase()}`}>
                                <span
                                    className={`font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 group-hover:text-brand-primary dark:group-hover:text-brand-primary group-hover:scale-110 transition-all z-10 text-xs`}
                                >
                                    {brand}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                                    <Zap size={10} className="text-brand-primary" fill="currentColor" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            {/* How it Works */}
            <section className="py-48 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#FFD700,transparent_70%)]" />
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-10">
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
            <section className="py-48 bg-slate-50 dark:bg-[#020617] transition-colors">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-32 space-y-6">
                        <p className="text-[12px] font-black text-brand-primary dark:text-brand-primary uppercase tracking-[0.5em] italic">
                            Curated Collections
                        </p>
                        <h2 className="text-8xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white transition-colors">
                            Select Your Vibe
                        </h2>
                    </div>

                    <div className="grid grid-cols-4 gap-8">
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
                                className="group relative h-[600px] overflow-hidden rounded-[4rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 flex flex-col justify-end p-10 hover:shadow-3xl transition-all duration-700"
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-b ${cat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                                />

                                <div className="relative z-20 space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] italic">
                                            {cat.subtitle}
                                        </p>
                                        <h3 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
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
                                    <img
                                        src={cat.img}
                                        alt={cat.title}
                                        className="w-[90%] h-auto object-contain filter drop-shadow-[0_50px_100px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_20px_100px_rgba(255,255,255,0.05)]"
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
