'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Zap, Play, Shield, Star, Trophy, Search, MapPin } from 'lucide-react';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { Logo } from '@/components/brand/Logo';

export default function StorePageNoir() {
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
        <div className="flex flex-col pb-40 transition-colors duration-300 bg-white dark:bg-black selection:bg-black selection:text-white">

            {/* Minimal Noir Header (Custom for concept) */}
            <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                <Logo mode="auto" size={24} variant="full" />
                <div className="flex gap-8 items-center">
                    <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-50 transition-opacity">Login</Link>
                    <Link href="/store/catalog" className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:scale-105 transition-transform">Explore</Link>
                </div>
            </nav>

            {/* Premium Photography Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white dark:bg-black isolate transition-colors duration-500 pt-20">
                {/* 1. Cinematic Background Image (GRAYSCALE) */}
                <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30">
                    <img
                        src="/images/hero/lifestyle_1.png"
                        alt="Premium Superbike Lifestyle"
                        className="w-full h-full object-cover grayscale contrast-125 brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/60 to-white dark:from-black dark:via-black/60 dark:to-black" />
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full text-center pt-24">
                    <div className="space-y-12 md:space-y-16">
                        <div className="space-y-10">
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-black dark:text-white rounded-full text-[11px] font-black uppercase tracking-[0.3em] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <span className="flex h-2 w-2 rounded-full bg-black dark:bg-white animate-ping" />
                                India’s Lowest EMI Guarantee
                            </div>

                            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[8.5rem] font-black italic uppercase tracking-tighter leading-[0.85] animate-in fade-in zoom-in-95 duration-1000 text-black dark:text-white">
                                Your Next <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-slate-500 to-black dark:from-white dark:via-slate-400 dark:to-white transition-all">Legend Awaits.</span>
                            </h1>

                            <p className="max-w-3xl mx-auto text-base md:text-xl text-black/60 dark:text-white/60 font-medium tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 transition-colors leading-relaxed italic">
                                Stop Negotiating. Start Riding. India’s Best On-Road Price. <br className="hidden md:block" />
                                Unified rates from verified dealers. Instant location-based quotes. The industry's lowest EMIs, unlocked.
                            </p>
                        </div>

                        {/* Search + Drive Cluster */}
                        <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 relative z-50">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-8 group relative" ref={searchRef}>
                                    <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 p-1.5 rounded-[2rem] shadow-2xl transition-all focus-within:border-black/30 dark:focus-within:border-white/30">
                                        <div className="flex items-center px-6 h-16 bg-black/5 dark:bg-white/5 rounded-[1.75rem] transition-colors">
                                            <Search className="text-black/40 dark:text-white/40 group-focus-within:text-black dark:group-focus-within:text-white transition-colors mr-4" size={22} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={handleSearch}
                                                placeholder="Model, Make or Category..."
                                                className="w-full bg-transparent border-none outline-none text-black dark:text-white placeholder:text-black/40 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Dropdown UI */}
                                    {showResults && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-black/95 backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-4 text-black dark:text-white">
                                                {searchResults.map((vehicle) => (
                                                    <Link
                                                        key={vehicle.id}
                                                        href={`/store/catalog?search=${vehicle.model}`}
                                                        className="flex items-center gap-5 p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all group/item mb-1 last:mb-0"
                                                    >
                                                        <div className="w-14 h-14 bg-black/5 dark:bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black text-black/20 dark:text-white/20 group-hover/item:bg-black dark:group-hover/item:bg-white group-hover/item:text-white dark:group-hover/item:text-black transition-all">
                                                            {vehicle.make[0]}
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className="text-sm font-black uppercase tracking-wide group-hover/item:text-black dark:group-hover/item:text-white transition-colors">{vehicle.displayName}</p>
                                                            <p className="text-[10px] opacity-40 uppercase tracking-widest mt-1 font-bold">{vehicle.make} • {vehicle.variant}</p>
                                                        </div>
                                                        <ChevronRight size={16} className="opacity-20 group-hover/item:translate-x-1 transition-transform" />
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-4 h-full">
                                    <Link href="/store/catalog" className="h-[76px] bg-black dark:bg-white text-white dark:text-black rounded-[2rem] flex items-center justify-center gap-3 px-8 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-xl group/btn overflow-hidden relative">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] relative z-10">Explore Collection</span>
                                        <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform relative z-10" />
                                    </Link>
                                </div>
                            </div>

                            <div className="flex justify-center gap-12 opacity-30 text-black dark:text-white">
                                {['Transparency', 'Speed', 'Precision'].map((item) => (
                                    <div key={item} className="flex items-center gap-2">
                                        <Shield size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Metrics Section */}
                        <div className="w-full max-w-5xl mx-auto grid grid-cols-3 gap-4 md:gap-0 py-8 border-t border-black/5 dark:border-white/5">
                            <div className="text-center space-y-1">
                                <p className="text-[9px] md:text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">{">"} Models</p>
                                <p className="text-3xl md:text-5xl font-black italic text-black dark:text-white tracking-tighter">500+</p>
                            </div>
                            <div className="text-center space-y-1 border-x border-black/5 dark:border-white/5">
                                <p className="text-[9px] md:text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">{">"} Savings</p>
                                <p className="text-3xl md:text-5xl font-black italic text-black dark:text-white tracking-tighter">₹12k+</p>
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-[9px] md:text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">{">"} Delivery</p>
                                <p className="text-3xl md:text-5xl font-black italic text-black dark:text-white tracking-tighter underline decoration-black dark:decoration-white decoration-4 md:decoration-8 underline-offset-[-2px]">48h</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Brand Directory (GRAYSCALE) */}
            <section className="py-32 md:py-48 bg-white dark:bg-black transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />

                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-24">
                        <div className="space-y-4 text-black dark:text-white">
                            <p className="text-[12px] font-black uppercase tracking-[0.5em] leading-none italic opacity-40">Partner Ecosystem</p>
                            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">The Manufacturers</h2>
                        </div>
                        <Link href="/store/catalog" className="group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-all">
                            View Full Directory <div className="w-10 h-10 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all"><ArrowRight size={14} /></div>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'SUZUKI', 'YAMAHA'].map((brand) => (
                            <Link
                                key={brand}
                                href={`/store/${brand.toLowerCase()}`}
                                className="group relative h-40 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[2.5rem] flex items-center justify-center hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black shadow-2xl transition-all duration-500 overflow-hidden"
                            >
                                <span className={`font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all z-10 ${brand.length > 8 ? 'text-[10px]' : 'text-xs'}`}>{brand}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works - Gray Contrast */}
            <section className="py-32 md:py-48 bg-black text-white relative overflow-hidden">
                <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
                        <div className="lg:col-span-5 space-y-12">
                            <div className="space-y-6">
                                <p className="text-[12px] font-black opacity-40 uppercase tracking-[0.5em] italic">The Protocol</p>
                                <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.9]">Select.<br />Quote.<br />Conquer.</h2>
                            </div>
                            <p className="text-xl text-white/40 font-medium italic leading-relaxed">
                                We’ve digitized the dealership floor. <br />
                                Transparent, instant, and absolute.
                            </p>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
                            {[
                                { step: '01', title: 'Select', desc: 'Browse 500+ models with unified dealer pricing.', icon: <Search size={24} /> },
                                { step: '02', title: 'Quote', desc: 'Get an instant, on-road quote for your exact location.', icon: <MapPin size={24} /> },
                                { step: '03', title: 'Own', desc: 'Secure the lowest EMI & get delivery in 48 hours.', icon: <Zap size={24} /> }
                            ].map((item, i) => (
                                <div key={i} className="group p-8 md:p-10 bg-white/5 border border-white/5 rounded-[3rem] space-y-8 hover:bg-white/10 transition-all duration-500">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{item.step}</span>
                                            <div className="h-[1px] flex-1 bg-white/10" />
                                        </div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">{item.title}</h3>
                                        <p className="text-sm text-white/40 font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Categories - Grayscale images */}
            <section className="py-32 md:py-48 bg-white dark:bg-black transition-colors">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-32 space-y-6">
                        <p className="text-[12px] font-black uppercase tracking-[0.5em] italic opacity-40">Curated Collections</p>
                        <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-black dark:text-white">Select Your Vibe</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'Scooters', subtitle: 'Urban.', desc: 'Agile & Efficient.', img: '/images/categories/scooter_nobg.png', color: 'from-black/5', link: '/store/catalog?category=SCOOTER' },
                            { title: 'Motorcycles', subtitle: 'Racing.', desc: 'High Performance.', img: '/images/categories/motorcycle_nobg.png', color: 'from-black/5', link: '/store/catalog?category=MOTORCYCLE' },
                            { title: 'Mopeds', subtitle: 'Utility.', desc: 'Heavy Duty.', img: '/images/categories/moped_nobg.png', color: 'from-black/5', link: '/store/catalog?category=MOPED' },
                            { title: 'Electric', subtitle: 'Future.', desc: 'Eco Friendly.', img: '/images/categories/scooter_nobg.png', color: 'from-black/5', link: '/store/catalog?category=ELECTRIC' },
                        ].map((cat, i) => (
                            <Link key={i} href={cat.link} className="group relative h-[600px] overflow-hidden rounded-[4rem] border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex flex-col justify-end p-10 hover:shadow-3xl transition-all duration-700">
                                <div className="relative z-20 space-y-6 text-black dark:text-white">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40">{cat.subtitle}</p>
                                        <h3 className="text-4xl font-black uppercase tracking-tighter italic">{cat.title}</h3>
                                        <p className="text-xs opacity-40 font-medium tracking-wide">{cat.desc}</p>
                                    </div>
                                    <div className="pt-4 overflow-hidden">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                                            Explore Now <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center opacity-100 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-1000 pointer-events-none">
                                    <img
                                        src={cat.img}
                                        alt={cat.title}
                                        className="w-[90%] h-auto object-contain grayscale brightness-110 drop-shadow-2xl"
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Legend Spotlight (GRAYSCALE) */}
            <section className="relative h-screen flex items-center overflow-hidden bg-black text-white py-32 md:py-0">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
                    <img
                        src="/images/hero/lifestyle_1.png"
                        alt="Spotlight Legend"
                        className="w-full h-full object-cover grayscale opacity-40 scale-110"
                    />
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <p className="text-[12px] font-black opacity-40 uppercase tracking-[0.6em] italic">Now Premiering</p>
                            <h2 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter italic leading-[0.8]">The<br />ZX-10R.</h2>
                            <p className="text-xl text-white/40 font-medium italic max-w-lg">
                                Born on the track. Refined for the streets. The pinnacle of Kawasaki engineering is now available for booking.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-8 pt-8">
                            {[
                                { label: 'Top Speed', value: '299' },
                                { label: 'Power', value: '203hp' },
                                { label: '0-100', value: '2.9s' }
                            ].map((stat, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-3xl font-black italic">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <Link href="/store/kawasaki/ninja/zx-10r" className="inline-flex items-center gap-4 px-10 py-5 bg-white text-black rounded-full font-black uppercase italic tracking-widest hover:scale-105 transition-all">
                            Configure Legend <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer Noir */}
            <footer className="py-20 bg-white dark:bg-black border-t border-black/5 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
                    <Logo mode="auto" size={24} variant="full" />
                    <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-black dark:text-white">
                        <span>Pincode Secure</span>
                        <span>© 2026 BMB NOIR</span>
                        <span>Mumbai, IN</span>
                    </div>
                </div>
            </footer>

        </div>
    );
}
