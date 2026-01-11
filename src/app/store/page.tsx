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
            <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-white dark:bg-[#020617] isolate transition-colors duration-500">
                {/* 1. Cinematic Background Image */}
                <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50">
                    <img
                        src="/images/hero/lifestyle_1.png"
                        alt="Premium Superbike Lifestyle"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white dark:from-[#020617] dark:via-[#020617]/40 dark:to-[#020617]" />
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full text-center pt-32">
                    <div className="space-y-16 md:space-y-24">
                        <div className="space-y-10">
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/10 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-[11px] font-black uppercase tracking-[0.3em] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                                India’s Lowest EMI Guarantee
                            </div>

                            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[8.5rem] font-black italic uppercase tracking-tighter leading-[0.85] animate-in fade-in zoom-in-95 duration-1000">
                                <span className="text-slate-900 dark:text-white transition-colors">Your Next</span> <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-600 transition-all">Legend Awaits.</span>
                            </h1>

                            <p className="max-w-3xl mx-auto text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 transition-colors leading-relaxed italic">
                                Stop Negotiating. Start Riding. India’s Best On-Road Price. <br className="hidden md:block" />
                                Unified rates from verified dealers. Instant location-based quotes. The industry's lowest EMIs, unlocked.
                            </p>
                        </div>

                        {/* Search + Drive Cluster */}
                        <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 relative z-50">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-8 group relative" ref={searchRef}>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1.5 rounded-[2rem] shadow-2xl shadow-blue-900/10 transition-all focus-within:shadow-blue-600/20 focus-within:border-blue-600/30">
                                        <div className="flex items-center px-6 h-16 bg-slate-50 dark:bg-white/5 rounded-[1.75rem] transition-colors">
                                            <Search className="text-slate-400 group-focus-within:text-blue-600 transition-colors mr-4" size={22} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={handleSearch}
                                                placeholder="Model, Make or Category..."
                                                className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Dropdown UI */}
                                    {showResults && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-4">
                                                {searchResults.map((vehicle) => (
                                                    <Link
                                                        key={vehicle.id}
                                                        href={`/store/catalog?search=${vehicle.model}`}
                                                        className="flex items-center gap-5 p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all group/item mb-1 last:mb-0"
                                                    >
                                                        <div className="w-14 h-14 bg-slate-100 dark:bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black text-slate-400 dark:text-slate-500 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">
                                                            {vehicle.make[0]}
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide group-hover/item:text-blue-600 transition-colors">{vehicle.displayName}</p>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">{vehicle.make} • {vehicle.variant}</p>
                                                        </div>
                                                        <ChevronRight size={16} className="text-slate-300 group-hover/item:translate-x-1 transition-transform" />
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-4 h-full">
                                    <Link href="/store/catalog" className="h-[76px] bg-slate-900 dark:bg-white text-white dark:text-black rounded-[2rem] flex items-center justify-center gap-3 px-8 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-xl group/btn overflow-hidden relative">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] relative z-10">Explore Collection</span>
                                        <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform relative z-10" />
                                        <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                                    </Link>
                                </div>
                            </div>

                            <div className="flex justify-center gap-12 opacity-40">
                                {['Transparency', 'Speed', 'Precision'].map((item) => (
                                    <div key={item} className="flex items-center gap-2">
                                        <Shield size={14} className="text-blue-600" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Updated Metrics Section */}
                        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 py-16 border-t border-slate-200 dark:border-white/5 transition-colors">
                            <div className="text-center group cursor-default space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{">"} Available Models</p>
                                <p className="text-5xl md:text-6xl font-black italic text-slate-900 dark:text-white tracking-tighter">500+</p>
                            </div>
                            <div className="text-center group cursor-default space-y-2 border-x border-slate-200 dark:border-white/5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{">"} Customer Savings</p>
                                <p className="text-5xl md:text-6xl font-black italic text-slate-900 dark:text-white tracking-tighter">₹12k+</p>
                            </div>
                            <div className="text-center group cursor-default space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{">"} Delivery Timeline</p>
                                <p className="text-5xl md:text-6xl font-black italic text-slate-900 dark:text-white tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-[-2px]">48h</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Brand Directory */}
            <section className="py-32 md:py-48 bg-white dark:bg-[#020617] transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-24">
                        <div className="space-y-4">
                            <p className="text-[12px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.5em] leading-none italic">Partner Ecosystem</p>
                            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white transition-colors">The Manufacturers</h2>
                        </div>
                        <Link href="/store/catalog" className="group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-all">
                            View Full Directory <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all"><ArrowRight size={14} /></div>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'SUZUKI', 'YAMAHA'].map((brand) => (
                            <Link
                                key={brand}
                                href={`/store/${brand.toLowerCase()}`}
                                className="group relative h-40 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[2.5rem] flex items-center justify-center hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 overflow-hidden"
                            >
                                <span className={`font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-white group-hover:scale-110 transition-all z-10 ${brand.length > 8 ? 'text-[10px]' : 'text-xs'}`}>{brand}</span>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                                    <Zap size={10} className="text-blue-600" fill="currentColor" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works - Select. Quote. Conquer. */}
            <section className="py-32 md:py-48 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#3b82f6,transparent_70%)]" />
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
                        <div className="lg:col-span-5 space-y-12">
                            <div className="space-y-6">
                                <p className="text-[12px] font-black text-blue-500 uppercase tracking-[0.5em] italic">The Protocol</p>
                                <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.9]">Select.<br />Quote.<br />Conquer.</h2>
                            </div>
                            <p className="text-xl text-slate-400 font-medium italic leading-relaxed">
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
                                    <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.step}</span>
                                            <div className="h-[1px] flex-1 bg-white/10" />
                                        </div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">{item.title}</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Categories */}
            <section className="py-32 md:py-48 bg-slate-50 dark:bg-[#020617] transition-colors">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-32 space-y-6">
                        <p className="text-[12px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.5em] italic">Curated Collections</p>
                        <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white transition-colors">Select Your Vibe</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'Scooters', subtitle: 'Urban.', desc: 'Agile & Efficient.', img: '/images/categories/scooter_nobg.png', color: 'from-cyan-500/20', link: '/store/catalog?category=SCOOTER' },
                            { title: 'Motorcycles', subtitle: 'Racing.', desc: 'High Performance.', img: '/images/categories/motorcycle_nobg.png', color: 'from-rose-500/20', link: '/store/catalog?category=MOTORCYCLE' },
                            { title: 'Mopeds', subtitle: 'Utility.', desc: 'Heavy Duty.', img: '/images/categories/moped_nobg.png', color: 'from-amber-500/20', link: '/store/catalog?category=MOPED' },
                            { title: 'Electric', subtitle: 'Future.', desc: 'Eco Friendly.', img: '/images/categories/scooter_nobg.png', color: 'from-emerald-500/20', link: '/store/catalog?category=ELECTRIC' },
                        ].map((cat, i) => (
                            <Link key={i} href={cat.link} className="group relative h-[600px] overflow-hidden rounded-[4rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 flex flex-col justify-end p-10 hover:shadow-3xl transition-all duration-700">
                                <div className={`absolute inset-0 bg-gradient-to-b ${cat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                                <div className="relative z-20 space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] italic">{cat.subtitle}</p>
                                        <h3 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">{cat.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">{cat.desc}</p>
                                    </div>
                                    <div className="pt-4 overflow-hidden">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                                            Explore Now <ArrowRight size={14} className="text-blue-600" />
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

            {/* Legend Spotlight */}
            <section className="relative h-screen flex items-center overflow-hidden bg-black text-white py-32 md:py-0">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
                    <img
                        src="/images/hero/lifestyle_1.png"
                        alt="Spotlight Legend"
                        className="w-full h-full object-cover opacity-60 scale-110"
                    />
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <p className="text-[12px] font-black text-rose-600 uppercase tracking-[0.6em] italic animate-pulse">Now Premiering</p>
                            <h2 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter italic leading-[0.8]">The<br />ZX-10R.</h2>
                            <p className="text-xl text-slate-400 font-medium italic max-w-lg">
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
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-3xl font-black italic">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <Link href="/store/kawasaki/ninja/zx-10r" className="inline-flex items-center gap-4 px-10 py-5 bg-rose-600 text-white rounded-full font-black uppercase italic tracking-widest hover:bg-rose-700 hover:scale-105 transition-all shadow-2xl shadow-rose-600/30">
                            Configure Legend <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Member Experience Section */}
            <section className="py-32 md:py-64 bg-[#020617] text-white overflow-hidden relative">
                {/* Background Watermark */}
                <div className="absolute top-12 left-6 right-6 pointer-events-none select-none overflow-hidden h-64 md:h-96 flex items-center justify-center">
                    <h2 className="text-[8rem] md:text-[18rem] font-black italic uppercase tracking-tighter leading-none text-white opacity-[0.03] whitespace-nowrap select-none">
                        Member Experience
                    </h2>
                </div>

                <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24">
                        <div className="max-w-xl">
                            <p className="text-lg md:text-2xl text-slate-400 font-medium italic leading-relaxed">
                                Hear from the select few who have secured access.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all group">
                                <ChevronRight size={24} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <button className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-all group border border-white shadow-xl shadow-white/5">
                                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-12 md:gap-20">
                        <div className="relative group overflow-hidden">
                            <div className="flex animate-marquee gap-8 whitespace-nowrap py-10 w-max pr-8">
                                {[
                                    { name: 'Arjun', city: 'Bengaluru', bike: 'Pulsar NS200', quote: 'Showroom me 2 mahine ki waiting thi, yahan 5 din me mil gayi. Transparent breakdown best hai.' },
                                    { name: 'Priya', city: 'Pune', bike: 'Honda Activa 6G', quote: 'Online buying me darr tha par Lowest EMI guarantee ne 4k bachaye. Delivery team 10/10.' },
                                    { name: 'Rahul', city: 'Delhi', bike: 'Apache RTR 160', quote: 'EMI approve ho gayi 10 minutes me. No hidden charges. Total peace of mind.' },
                                    { name: 'Sneha', city: 'Mumbai', bike: 'TVS Jupiter 125', quote: 'BMB handled everything—subsidies, taxes, registration. Booking made easy.' },
                                    { name: 'Karthik', city: 'Chennai', bike: 'Yamaha FZ-S V4', quote: 'Got the Racing Blue variant when it was out of stock everywhere. Massive network.' },
                                    { name: 'Amit', city: 'Ahmedabad', bike: 'Hero Splendor Plus', quote: 'Daily commute ke liye bike chahiye thi fast. Zero hidden costs. Delivered to office.' },
                                    { name: 'Vikram', city: 'Hyderabad', bike: 'Suzuki Access 125', quote: 'Concierge team is very professional. Professional help with documentation.' },
                                    { name: 'Anjali', city: 'Kolkata', bike: 'TVS Raider 125', quote: 'Everything from insurance to registration was handled in the app. Smooth digital process.' },
                                    { name: 'Siddharth', city: 'Gurgaon', bike: 'Bajaj Dominar 250', quote: 'Elite Circle privileges are real. Priority delivery and premium kit was a surprise.' },
                                    { name: 'Neha', city: 'Chandigarh', bike: 'Suzuki Burgman', quote: 'Found the specific color no local dealer had. Delivered in pristine condition.' },
                                    { name: 'Manish', city: 'Jaipur', bike: 'Hero Xpulse 200T', quote: 'EMI calculator is spot on. No processing fee surprises. Paid what was shown.' },
                                    { name: 'Rohan', city: 'Indore', bike: 'Honda Hornet 2.0', quote: 'Unified pricing across dealers stopped the showroom haggling immediately.' },
                                    { name: 'Deepak', city: 'Lucknow', bike: 'TVS Ronin', quote: 'On-road price in UP was lower than local dealers. Verified by evening.' },
                                    { name: 'Suresh', city: 'Kochi', bike: 'Yamaha RayZR 125', quote: 'Smooth experience. Best for busy professionals who dont want to waste weekends.' },
                                    { name: 'Megha', city: 'Nagpur', bike: 'Yamaha MT-15 V2', quote: 'Loved the UI. Seeing every variant in high-res helped me decide. 100% happy.' },
                                ].concat([
                                    { name: 'Arjun', city: 'Bengaluru', bike: 'Pulsar NS200', quote: 'Showroom me 2 mahine ki waiting thi, yahan 5 din me mil gayi. Transparent breakdown best hai.' },
                                    { name: 'Priya', city: 'Pune', bike: 'Honda Activa 6G', quote: 'Online buying me darr tha par Lowest EMI guarantee ne 4k bachaye. Delivery team 10/10.' },
                                    { name: 'Rahul', city: 'Delhi', bike: 'Apache RTR 160', quote: 'EMI approve ho gayi 10 minutes me. No hidden charges. Total peace of mind.' },
                                    { name: 'Sneha', city: 'Mumbai', bike: 'TVS Jupiter 125', quote: 'BMB handled everything—subsidies, taxes, registration. Booking made easy.' },
                                    { name: 'Karthik', city: 'Chennai', bike: 'Yamaha FZ-S V4', quote: 'Got the Racing Blue variant when it was out of stock everywhere. Massive network.' },
                                    { name: 'Amit', city: 'Ahmedabad', bike: 'Hero Splendor Plus', quote: 'Daily commute ke liye bike chahiye thi fast. Zero hidden costs. Delivered to office.' },
                                    { name: 'Vikram', city: 'Hyderabad', bike: 'Suzuki Access 125', quote: 'Concierge team is very professional. Professional help with documentation.' },
                                    { name: 'Anjali', city: 'Kolkata', bike: 'TVS Raider 125', quote: 'Everything from insurance to registration was handled in the app. Smooth digital process.' },
                                    { name: 'Siddharth', city: 'Gurgaon', bike: 'Bajaj Dominar 250', quote: 'Elite Circle privileges are real. Priority delivery and premium kit was a surprise.' },
                                    { name: 'Neha', city: 'Chandigarh', bike: 'Suzuki Burgman', quote: 'Found the specific color no local dealer had. Delivered in pristine condition.' },
                                    { name: 'Manish', city: 'Jaipur', bike: 'Hero Xpulse 200T', quote: 'EMI calculator is spot on. No processing fee surprises. Paid what was shown.' },
                                    { name: 'Rohan', city: 'Indore', bike: 'Honda Hornet 2.0', quote: 'Unified pricing across dealers stopped the showroom haggling immediately.' },
                                    { name: 'Deepak', city: 'Lucknow', bike: 'TVS Ronin', quote: 'On-road price in UP was lower than local dealers. Verified by evening.' },
                                    { name: 'Suresh', city: 'Kochi', bike: 'Yamaha RayZR 125', quote: 'Smooth experience. Best for busy professionals who dont want to waste weekends.' },
                                    { name: 'Megha', city: 'Nagpur', bike: 'Yamaha MT-15 V2', quote: 'Loved the UI. Seeing every variant in high-res helped me decide. 100% happy.' },
                                ])
                                    .map((m, i) => (
                                        <div key={i} className="inline-block w-[350px] md:w-[450px] p-6 md:p-10 bg-white/[0.03] border border-white/5 rounded-[2rem] md:rounded-[3rem] space-y-4 md:space-y-6 hover:bg-white/[0.05] transition-all duration-500 relative whitespace-normal flex-shrink-0">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className="text-white fill-white" />)}
                                            </div>
                                            <p className="text-sm md:text-lg font-medium text-white dark:text-gray-100 leading-relaxed italic">"{m.quote}"</p>
                                            <div className="pt-4 md:pt-6 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-800 flex items-center justify-center font-black text-[10px] md:text-xs text-slate-500">{m.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">{m.name}</p>
                                                        <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-blue-500 italic">{m.bike}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#020617] to-transparent z-10" />
                            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#020617] to-transparent z-10" />
                        </div>

                        {/* Second Row Opposite Direction */}
                        <div className="relative overflow-hidden">
                            <div className="flex animate-marquee-reverse gap-8 whitespace-nowrap py-10 w-max pr-8">
                                {[
                                    { name: 'Abhishek', city: 'Patna', bike: 'Hero XPulse 200', quote: 'Village delivery was surprising but they managed it. Trustworthy service for Bihar.' },
                                    { name: 'Divya', city: 'Surat', bike: 'Suzuki Burgman', quote: 'White glove delivery is legit. They even helped me with temporary reg plate.' },
                                    { name: 'Ishaan', city: 'Bhubaneswar', bike: 'Bajaj Pulsar 150', quote: 'Fastest finance approval. Document upload to approval took less than 15 mins.' },
                                    { name: 'Rajesh', city: 'Ludhiana', bike: 'Honda Shine 125', quote: 'Verified status of dealers gives confidence. Professional and quick.' },
                                    { name: 'Pooja', city: 'Raipur', bike: 'TVS Jupiter', quote: 'Simple, fast, and secure. Made the perfect gift for my brother birthday.' },
                                    { name: 'Nitin', city: 'Dehradun', bike: 'Suzuki Gixxer SF', quote: 'Mountain delivery was on time. Bike came in a closed truck, no scratches.' },
                                    { name: 'Shubham', city: 'Ghaziabad', bike: 'Yamaha FZ', quote: 'Comparing EMIs of 4 banks in one screen saved me at least 1% interest rate.' },
                                    { name: 'Anita', city: 'Bhopal', bike: 'Honda Dio', quote: 'The member dashboard shows my booking status live. Very helpful.' },
                                    { name: 'Varun', city: 'Vizag', bike: 'Bajaj Pulsar N250', quote: 'Early access for members helped me get into the first batch. Worth it.' },
                                    { name: 'Alok', city: 'Jamshedpur', bike: 'Hero Glamour', quote: 'Simple Hinglish support made the process very easy for my father.' },
                                    { name: 'Tanvi', city: 'Mysore', bike: 'TVS NTORQ 125', quote: 'Eco-friendly process. No paperwork, just digital signatures. The way forward.' },
                                    { name: 'Jatin', city: 'Amritsar', bike: 'Hero Passion Pro', quote: 'Great price, great service. Sat Sri Akal! Highly recommended.' },
                                    { name: 'Kavita', city: 'Madurai', bike: 'TVS XL100', quote: 'Bought for my business delivery. Helped me get bulk registration handled.' },
                                    { name: 'Sameer', city: 'Jammu', bike: 'Suzuki Gixxer 150', quote: 'Got delivery even during light snow. The team is dedicated to the rider.' },
                                    { name: 'Ritu', city: 'Guwahati', bike: 'Honda Shine', quote: 'North East delivery was very clear about the timeline. Bike arrived today!' },
                                ].concat([
                                    { name: 'Abhishek', city: 'Patna', bike: 'Hero XPulse 200', quote: 'Village delivery was surprising but they managed it. Trustworthy service for Bihar.' },
                                    { name: 'Divya', city: 'Surat', bike: 'Suzuki Burgman', quote: 'White glove delivery is legit. They even helped me with temporary reg plate.' },
                                    { name: 'Ishaan', city: 'Bhubaneswar', bike: 'Bajaj Pulsar 150', quote: 'Fastest finance approval. Document upload to approval took less than 15 mins.' },
                                    { name: 'Rajesh', city: 'Ludhiana', bike: 'Honda Shine 125', quote: 'Verified status of dealers gives confidence. Professional and quick.' },
                                    { name: 'Pooja', city: 'Raipur', bike: 'TVS Jupiter', quote: 'Simple, fast, and secure. Made the perfect gift for my brother birthday.' },
                                    { name: 'Nitin', city: 'Dehradun', bike: 'Suzuki Gixxer SF', quote: 'Mountain delivery was on time. Bike came in a closed truck, no scratches.' },
                                    { name: 'Shubham', city: 'Ghaziabad', bike: 'Yamaha FZ', quote: 'Comparing EMIs of 4 banks in one screen saved me at least 1% interest rate.' },
                                    { name: 'Anita', city: 'Bhopal', bike: 'Honda Dio', quote: 'The member dashboard shows my booking status live. Very helpful.' },
                                    { name: 'Varun', city: 'Vizag', bike: 'Bajaj Pulsar N250', quote: 'Early access for members helped me get into the first batch. Worth it.' },
                                    { name: 'Alok', city: 'Jamshedpur', bike: 'Hero Glamour', quote: 'Simple Hinglish support made the process very easy for my father.' },
                                    { name: 'Tanvi', city: 'Mysore', bike: 'TVS NTORQ 125', quote: 'Eco-friendly process. No paperwork, just digital signatures. The way forward.' },
                                    { name: 'Jatin', city: 'Amritsar', bike: 'Hero Passion Pro', quote: 'Great price, great service. Sat Sri Akal! Highly recommended.' },
                                    { name: 'Kavita', city: 'Madurai', bike: 'TVS XL100', quote: 'Bought for my business delivery. Helped me get bulk registration handled.' },
                                    { name: 'Sameer', city: 'Jammu', bike: 'Suzuki Gixxer 150', quote: 'Got delivery even during light snow. The team is dedicated to the rider.' },
                                    { name: 'Ritu', city: 'Guwahati', bike: 'Honda Shine', quote: 'North East delivery was very clear about the timeline. Bike arrived today!' },
                                ])
                                    .map((m, i) => (
                                        <div key={i} className="inline-block w-[350px] md:w-[450px] p-6 md:p-10 bg-white/[0.03] border border-white/5 rounded-[2rem] md:rounded-[3rem] space-y-4 md:space-y-6 hover:bg-white/[0.05] transition-all duration-500 relative whitespace-normal flex-shrink-0">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className="text-white fill-white" />)}
                                            </div>
                                            <p className="text-sm md:text-lg font-medium text-slate-300 leading-relaxed italic">"{m.quote}"</p>
                                            <div className="pt-4 md:pt-6 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-800 flex items-center justify-center font-black text-[10px] md:text-xs text-slate-500">{m.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">{m.name}</p>
                                                        <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-blue-500 italic">{m.bike}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#020617] to-transparent z-10" />
                            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#020617] to-transparent z-10" />
                        </div>
                    </div>
                </div>

                {/* Bottom Red Bar like Mockup */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-red-600 z-[-1] opacity-90 blur-[100px] pointer-events-none translate-y-20" />
            </section>



        </div>
    );
}
