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
        <div className="flex flex-col pb-40 transition-colors duration-300 w-full max-w-[100vw] overflow-x-hidden">
            {/* Mobile Portrait Hero */}
            <section className="relative min-h-[65vh] flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-[#020617] isolate px-4 pt-20 pb-12">
                <div className="absolute inset-0 z-0 opacity-30">
                    <Image src="/images/hero/lifestyle_1.png" alt="Hero" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white dark:from-[#020617] dark:via-[#020617]/80 dark:to-[#020617]" />
                </div>

                <div className="relative z-10 w-full text-center space-y-6 max-w-xs mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/5 border border-brand-primary/10 text-brand-primary rounded-full text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-sm whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                        {MARKET_METRICS.avgSavings} Savings Guaranteed
                    </div>

                    <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-[0.85] text-slate-900 dark:text-white break-words">
                        Your Next <br />
                        <span className="text-[#F4B000]">
                            Legend <br /> Awaits.
                        </span>
                    </h1>

                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed px-2 max-w-[85%] mx-auto">
                        Stop Negotiating. Start Riding. India’s Best On-Road Price.
                    </p>

                    <div className="pt-8 w-full max-w-[280px] mx-auto">
                        <Link
                            href="/store/catalog"
                            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
                        >
                            Explore Collection <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 opacity-70">
                    {['Transparency', 'Speed', 'Precision'].map(item => (
                        <div key={item} className="flex items-center gap-1.5">
                            <Shield size={10} className="text-brand-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {item}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mobile Horizontal Carousel: Manufacturers */}
            <section className="py-16 bg-white dark:bg-[#020617]">
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
            <section className="py-16 bg-slate-900 text-white px-4">
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

            {/* Mobile Horizontal Carousel: Vibe */}
            <section className="py-16 bg-slate-50 dark:bg-[#020617]">
                <div className="px-4 mb-8">
                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest italic mb-2">
                        Curated Collections
                    </p>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                        Select Your Vibe
                    </h2>
                </div>

                <div className="flex overflow-x-auto gap-6 px-4 pb-12 no-scrollbar snap-x">
                    {CATEGORIES.map((cat, i) => (
                        <Link
                            key={i}
                            href={cat.link}
                            className={`flex-shrink-0 w-[85vw] h-[480px] bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 relative overflow-hidden snap-center border border-slate-200 dark:border-white/5 flex flex-col justify-between group isolate`}
                        >
                            {/* Subdued Mesh Gradient Background */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${cat.color} to-transparent opacity-30 z-0 blur-3xl`}
                            />

                            {/* Top Left Feature Label */}
                            <div className="absolute top-8 left-8 z-20">
                                {cat.features.slice(0, 1).map((feature, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-block px-3 py-1.5 rounded-full border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            <div className="relative z-10 space-y-3">
                                <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em] italic leading-none">
                                    {cat.subtitle}
                                </p>
                                <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                    {cat.title}
                                </h3>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                    EXPLORE {cat.title} <ArrowRight size={14} className="text-brand-primary" />
                                </div>
                            </div>

                            <div className="absolute top-[35%] left-[10%] w-[90%] h-[70%] z-10 pointer-events-none">
                                <Image
                                    src={cat.img}
                                    alt={cat.title}
                                    fill
                                    className="object-contain filter drop-shadow-[0_30px_40px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_20px_50px_rgba(255,255,255,0.05)]"
                                />
                            </div>
                        </Link>
                    ))}
                    <div className="flex-shrink-0 w-4" />
                </div>
            </section>

            {/* Restored Rider Pulse (Reviews) Section */}
            <RiderPulse />
        </div>
    );
}
