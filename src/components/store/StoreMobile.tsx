import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, Search, MapPin, Zap } from 'lucide-react';
import { BRANDS, CATEGORIES, MARKET_METRICS } from '@/config/market';
import { RiderPulse } from '@/components/store/RiderPulse';
import { createClient } from '@/lib/supabase/client';

type BrandRecord = {
    name: string;
    logo_svg?: string | null;
};

export function StoreMobile() {
    const [activeBrands, setActiveBrands] = useState<BrandRecord[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchBrands = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('brands').select('name, logo_svg').eq('is_active', true);

            if (data && isMounted) {
                setActiveBrands(data as BrandRecord[]);
            }
        };
        fetchBrands();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="flex flex-col transition-colors duration-300 w-full max-w-[100vw] overflow-x-hidden">
            {/* Mobile Portrait Hero - Premium Cinematic Design */}
            <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black isolate">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image src="/images/hero/lifestyle_1.png" alt="Hero" fill className="object-cover opacity-60 scale-110" priority />
                    {/* 1. Cinematic 3-Layer Gradient System */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/85" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
                    {/* Top vignette for header */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
                </div>

                {/* Content with Premium Spacing */}
                <div className="relative z-10 w-full text-center max-w-sm mx-auto px-6 mt-10">
                    {/* Badge - Premium with Glow */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5B301]/10 border border-[#F5B301]/25 text-[#F5B301] rounded-full text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur-md shadow-[0_0_25px_rgba(245,179,1,0.12)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F5B301] animate-pulse" />
                        Lowest EMI Guarantee
                    </div>

                    {/* 2. Luxury Typography Headline - Larger */}
                    <h1 className="mt-5 text-[56px] font-black uppercase tracking-[-0.04em] leading-[0.92] text-white">
                        Your<br />
                        Next <span className="text-[#F5B301] drop-shadow-[0_8px_20px_rgba(245,179,1,0.25)]">Ride</span><br />
                        Awaits.
                    </h1>

                    {/* Subtext */}
                    <p className="mt-4 text-[13px] leading-[1.4] text-white/70 px-2">
                        Unified prices from verified dealers. Instant quotes. Lowest EMI guarantee.
                    </p>

                    {/* 3. Premium CTA */}
                    <div className="mt-6 w-full max-w-[260px] mx-auto">
                        <Link
                            href="/store/catalog"
                            className="w-full h-12 rounded-full px-6 bg-[#F5B301] text-black font-semibold flex items-center justify-center gap-2 text-[12px] tracking-[0.18em] uppercase shadow-[0_14px_35px_rgba(245,179,1,0.28)] ring-1 ring-white/15 active:scale-95 transition-all"
                        >
                            <Search size={16} />
                            Search Bikes
                        </Link>
                    </div>
                </div>

                {/* 4. Glass Stats Card */}
                <div className="relative z-10 mt-6 w-full max-w-sm mx-auto px-4 pb-10">
                    <div className="rounded-2xl p-3 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_18px_55px_rgba(0,0,0,0.45)]">
                        <div className="grid grid-cols-3 divide-x divide-white/10">
                            <div className="text-center px-2">
                                <p className="text-[10px] text-white/55 tracking-[0.22em] uppercase mb-1">Customers</p>
                                <p className="text-[18px] font-bold text-white">683k+</p>
                            </div>
                            <div className="text-center px-2">
                                <p className="text-[10px] text-white/55 tracking-[0.22em] uppercase mb-1">Savings</p>
                                <p className="text-[18px] font-bold text-white">₹12k+</p>
                            </div>
                            <div className="text-center px-2">
                                <p className="text-[10px] text-white/55 tracking-[0.22em] uppercase mb-1">Delivery</p>
                                <p className="text-[18px] font-bold text-white">4 hr</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile Horizontal Carousel: Manufacturers */}
            <section className="py-16 bg-white dark:bg-black">
                <div className="px-4 mb-8">
                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest italic mb-2">
                        Partner Ecosystem
                    </p>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        Manufacturers
                    </h2>
                </div>

                <div className="flex overflow-x-auto gap-12 px-4 pb-12 no-scrollbar scroll-smooth snap-x">
                    {activeBrands.slice(0, 10).map(brand => (
                        <Link
                            key={brand.name}
                            href={`/store/catalog?brand=${brand.name.toUpperCase()}`}
                            className="flex-shrink-0 snap-center"
                        >
                            <h3 className="text-6xl font-black uppercase italic tracking-tighter text-slate-200 dark:text-white/10 active:text-brand-primary transition-colors">
                                {brand.name}
                            </h3>
                        </Link>
                    ))}
                    <div className="flex-shrink-0 w-8" />
                </div>
            </section>

            {/* Mobile Protocol */}
            <section className="py-16 bg-black text-white px-4">
                <div className="space-y-12">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">The Protocol</h2>
                    <div className="space-y-4">
                        {[
                            { step: '01', title: 'Select', icon: <Search size={20} /> },
                            { step: '02', title: 'Quote', icon: <MapPin size={20} /> },
                            { step: '03', title: 'Own', icon: <Zap size={20} /> },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="p-6 bg-white/5 rounded-2xl flex items-center gap-6 border border-white/5"
                            >
                                <div className="text-brand-primary">{item.icon}</div>
                                <h3 className="text-xl font-black uppercase italic tracking-widest">{item.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mobile Horizontal Carousel: Vibe - Matching Desktop Design */}
            <section className="py-12 bg-slate-50 dark:bg-black">
                <div className="px-4 mb-6">
                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-1">
                        Curated Collections
                    </p>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        Select Your Vibe
                    </h2>
                </div>

                <div className="flex overflow-x-auto gap-4 px-4 pb-8 no-scrollbar snap-x">
                    {CATEGORIES.map((cat, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 w-[85vw] bg-white dark:bg-zinc-900 rounded-3xl p-6 relative overflow-hidden snap-center border border-slate-200 dark:border-white/10 flex flex-col"
                        >
                            {/* Badge */}
                            <div className="mb-4">
                                <span className="inline-block px-3 py-1.5 bg-slate-100 dark:bg-white/10 rounded-full text-[8px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                    {cat.features[0]}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">
                                {cat.title}
                            </h3>

                            {/* Product Image */}
                            <div className="relative h-[180px] my-4">
                                <Image
                                    src={cat.img}
                                    alt={cat.title}
                                    fill
                                    loading="lazy"
                                    sizes="85vw"
                                    className="object-contain drop-shadow-xl"
                                />
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                                {cat.desc}
                            </p>

                            {/* CTA Button */}
                            <Link
                                href={cat.link}
                                className="w-full h-12 bg-gradient-to-r from-[#F4B000] to-[#FFD700] text-slate-900 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-[0_4px_20px_rgba(244,176,0,0.3)] active:scale-95 transition-all mt-auto"
                            >
                                Explore {cat.title}
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    ))}
                    <div className="flex-shrink-0 w-4" />
                </div>
            </section>

            {/* Restored Rider Pulse (Reviews) Section */}
            <RiderPulse />
        </div>
    );
}
