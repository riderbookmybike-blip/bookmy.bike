'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Star, ShieldCheck, Zap, Heart, Gauge } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileFooter } from '../layout/MobileFooter';
import { MobileHeader } from '../layout/MobileHeader';

export const MobileHomeOptionC = () => {
    // State for 'How It Works' Accordion
    const [activeStep, setActiveStep] = useState<number>(0);

    return (
        <div className="bg-[#080808] text-white min-h-screen selection:bg-[#F4B000]/30">
            <MobileHeader />
            {/* 1. LUXURY HERO */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden pt-16">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/templates/t3_night.png"
                        alt="Luxury Bike"
                        fill
                        className="object-cover scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#080808]" />
                </div>

                <div className="relative z-10 px-8 text-center pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-6 px-10 py-2.5 bg-zinc-900/80 border border-white/10 rounded-full mb-8 backdrop-blur-xl"
                    >
                        <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-1.5 h-1.5 rounded-full bg-[#F4B000]"
                        />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">INDIA&apos;S LOWEST EMI GUARANTEE</span>
                        <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-1.5 h-1.5 rounded-full bg-[#F4B000]"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] mb-4"
                    >
                        The Highest Fidelity Marketplace
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, letterSpacing: '0.4em' }}
                        animate={{ opacity: 1, letterSpacing: '0.1em' }}
                        className="text-[clamp(2.5rem,10vw,4.5rem)] font-black text-white italic tracking-tighter leading-[0.85] mb-12 drop-shadow-2xl font-[family-name:var(--font-bruno-ace)]"
                    >
                        MOTORCYCLES
                    </motion.h1>

                    <Link href="/m/store/catalog" className="inline-flex items-center gap-3 px-10 py-5 bg-[#F4B000] text-black rounded-full font-black text-xs uppercase tracking-widest shadow-[0_10px_40px_rgba(244,176,0,0.3)] hover:scale-105 transition-transform active:scale-95">
                        <Search size={18} /> Initialize_Marketplace
                    </Link>

                    {/* Stats Bento (Moved Inside Hero for Above-the-Fold) */}
                    <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-md">
                        <div className="col-span-2 p-8 bg-[#121212] border border-white/5 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative shadow-2xl">
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
                                <Zap size={24} className="text-[#F4B000]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/70 tracking-[0.3em] uppercase mb-1">SKU_Live</p>
                                <h3 className="text-4xl font-black italic">380+</h3>
                                <p className="text-[10px] text-zinc-600 font-bold tracking-widest mt-2 uppercase">active_sourcing</p>
                            </div>
                            <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center">
                                <Gauge size={24} className="text-zinc-700" />
                            </div>
                        </div>

                        <div className="p-8 bg-[#121212] border border-white/5 rounded-[2.5rem] aspect-square flex flex-col justify-center">
                            <p className="text-[10px] font-black text-white/70 tracking-[0.3em] uppercase mb-4">Inventory_Sync</p>
                            <h3 className="text-3xl font-black italic">4H</h3>
                            <p className="text-[10px] text-zinc-600 font-bold tracking-widest mt-2 uppercase px-1">logistics_flow</p>
                        </div>

                        <div className="p-8 bg-[#121212] border border-brand-primary/20 rounded-[2.5rem] aspect-square flex flex-col justify-center shadow-2xl">
                            <p className="text-[10px] font-black text-[#F4B000] tracking-[0.3em] uppercase mb-4">Savings_Calc</p>
                            <h3 className="text-3xl font-black text-white">₹12K</h3>
                            <p className="text-[10px] text-zinc-600 font-bold tracking-widest mt-2 uppercase">dealer_rebate</p>
                        </div>
                    </div>

                    <div className="flex gap-8 opacity-30 text-[8px] font-mono tracking-widest mt-12 justify-center">
                        <span>SECURE_LINK: ENABLED</span>
                        <span>v2.6_OS_CORE</span>
                    </div>
                </div>
            </section>

            {/* 3. ELITE MAKERS (Brand Drum) */}
            <section className="py-24 px-8 overflow-hidden">
                <div className="mb-12">
                    <h2 className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px] mb-4">THE SYNDICATE</h2>
                    <h3 className="text-4xl font-black italic tracking-tighter uppercase font-serif">ELITE MAKERS<span className="text-[#F4B000]">.</span></h3>
                </div>

                <div className="flex gap-8 overflow-x-auto pb-12 scrollbar-hide px-2">
                    {['HONDA', 'YAMAHA', 'KTM', 'TVS', 'BAJAJ', 'SUZUKI'].map((brand, i) => (
                        <div key={i} className="flex-shrink-0 flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full border border-white/5 bg-[#121212] flex items-center justify-center mb-6 group hover:border-[#F4B000]/30 transition-colors shadow-lg">
                                <span className="text-lg font-black italic opacity-40 group-hover:opacity-100 group-hover:text-[#F4B000] transition-opacity font-serif">{brand}</span>
                            </div>
                            <span className="text-[9px] font-black tracking-widest text-zinc-600 uppercase">Authorized</span>
                        </div>
                    ))}
                </div>

                <p className="text-center text-zinc-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                    A curated roster of engineering giants setting global standards. Seamless, elite performance across every brand.
                </p>
            </section>

            {/* 4. HOW IT WORKS (The Monolithic Deck) */}
            <section className="py-24 bg-white/[0.01] border-y border-white/5">
                <div className="px-8 mb-16 space-y-6">
                    <h3 className="text-5xl font-black italic tracking-tighter leading-none mb-6 font-serif">
                        SELECT.<br />QUOTE.<br />RIDE<span className="text-[#F4B000]">.</span>
                    </h3>
                    <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-sm">
                        Experience the future of ownership. <br />
                        <span className="text-white">Seamless. Digital. Instant.</span>
                    </p>
                </div>

                <div className="px-6 space-y-4">
                    {[
                        { title: 'Selection', subtitle: 'LIVE INVENTORY FEED', desc: 'Direct access to regional hubs. 3.8k+ units ready for immediate allocation.' },
                        { title: 'Quotation', subtitle: 'ALGORITHMIC PRICING', desc: 'Zero opacity. Instant, distinct on-road valuation with no hidden dealer margins.' },
                        { title: 'Delivery', subtitle: 'RAPID DEPLOYMENT', desc: 'Digital documentation execution. Asset handover achieved in under 4 hours.' }
                    ].map((step, i) => (
                        <div
                            key={i}
                            onClick={() => setActiveStep(i)}
                            className={`p-10 rounded-[2.5rem] transition-all duration-700 overflow-hidden relative cursor-pointer ${activeStep === i ? 'bg-white text-black shadow-2xl' : 'bg-[#121212] border border-white/5'}`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${activeStep === i ? 'text-zinc-400' : 'text-[#F4B000]'}`}>Step_0{i + 1}</span>
                                {activeStep === i && <ArrowRight size={20} className="text-black" />}
                            </div>
                            <div className="space-y-2">
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeStep === i ? 'text-zinc-500' : 'text-white/20'}`}>
                                    {step.subtitle}
                                </p>
                                <h4 className="text-4xl font-black italic tracking-tighter mb-4 font-serif">{step.title}</h4>
                            </div>
                            <AnimatePresence>
                                {activeStep === i && (
                                    <motion.p
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="text-sm font-medium leading-relaxed font-serif text-zinc-600 mt-4"
                                    >
                                        {step.desc}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. CATEGORIES (Select Your Vibe) */}
            <section className="py-24">
                <div className="px-8 mb-16">
                    <p className="text-sm font-black text-white uppercase tracking-[0.3em] mb-4">Curated Collections</p>
                    <h3 className="text-7xl font-black italic tracking-tighter mb-6 font-serif uppercase leading-none">Select <br /> Your <br /> Vibe</h3>
                    <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-sm">
                        Find your perfect ride. <br />
                        <span className="text-white">Scooter. Motorcycle. Moped.</span>
                    </p>
                </div>

                <div className="flex gap-4 overflow-x-auto px-8 pb-12 scrollbar-hide">
                    {[
                        { title: 'SCOOTERS', img: '/images/categories/scooter_nobg.png', accent: 'emerald' },
                        { title: 'MOTORCYCLES', img: '/images/categories/motorcycle_nobg.png', accent: 'orange' },
                        { title: 'MOPEDS', img: '/images/categories/moped_nobg.png', accent: 'sky' }
                    ].map((vibe, i) => (
                        <div key={i} className="flex-shrink-0 w-[85vw] aspect-[3/4] rounded-[3rem] bg-[#121212] p-10 border border-white/5 relative group overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:text-[#F4B000] transition-colors">
                                <h4 className="text-9xl font-black italic font-serif">{vibe.title[0]}</h4>
                            </div>
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-black text-[#F4B000] tracking-[0.3em] uppercase mb-2 block">Series_0{i + 1}</span>
                                    <h4 className="text-4xl font-black italic tracking-tighter font-serif">{vibe.title}</h4>
                                </div>

                                <div className="relative h-48 w-full scale-125 translate-x-10 translate-y-10 group-hover:translate-y-0 transition-transform duration-700">
                                    <Image src={vibe.img} alt={vibe.title} fill className="object-contain" />
                                </div>

                                <Link
                                    href={`/m/store/catalog?cat=${vibe.title.toLowerCase()}`}
                                    className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform text-center"
                                >
                                    Explore Lineup
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. RIDER PULSE (Reviews) */}
            <section className="py-24 px-8 bg-[#F4B000]/[0.01]">
                <div className="px-8 space-y-6 mb-16">
                    <div className="flex items-center gap-4">
                        <p className="text-sm font-black text-[#F4B000] uppercase tracking-[0.3em]">
                            The Community Pulse
                        </p>
                    </div>
                    <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-[0.85] text-white">
                        Rider <br /> <span className="text-[#F4B000]">Pulse.</span>
                    </h2>
                    <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-sm border-l-2 border-white/10 pl-6">
                        Hear from the riders who defined their own path. <br />
                        <span className="text-white italic">Real stories. Real roads.</span>
                    </p>
                </div>

                <div className="space-y-6">
                    {[
                        {
                            name: 'Arjun Kapoor',
                            handle: 'TVS Jupiter',
                            rating: 5,
                            quote: '"Booking my bike online should be as easy as ordering food. I want to see my on-road price, compare EMIs, and confirm the delivery date—without visiting five different showrooms or decoding hidden charges."'
                        },
                        {
                            name: 'Meera Reddy',
                            handle: 'Honda Activa',
                            rating: 5,
                            quote: '"The transparency is what I loved. No hidden costs, everything upfront. The delivery was right on time as promised. This is exactly what the two-wheeler market needed."'
                        }
                    ].map((rev, i) => (
                        <div key={i} className="p-10 bg-[#121212] border border-white/5 rounded-[3rem] relative shadow-lg">
                            <div className="flex gap-1 mb-6">
                                {[...Array(rev.rating)].map((_, j) => <Star key={j} size={14} className="fill-[#F4B000] text-[#F4B000]" />)}
                            </div>
                            <p className="text-zinc-300 text-base font-bold italic leading-tight mb-8 font-serif">{rev.quote}</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="font-black italic text-lg font-serif">{rev.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#F4B000] animate-pulse" />
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{rev.handle}</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                    <Heart size={16} className="text-zinc-700" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="w-full mt-12 py-6 border border-white/10 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] text-white active:bg-white/5">
                    View Pulse Gallery
                </button>
            </section>

            {/* 7. ELITE CIRCLE */}
            <section className="py-24 px-8">
                <div className="p-12 bg-gradient-to-br from-[#121212] to-black rounded-[4rem] border border-[#F4B000]/20 relative overflow-hidden text-center group">
                    <div className="px-8 space-y-8 mb-16">
                        <div className="flex items-center gap-4">
                            <div className="h-px w-10 bg-[#F4B000]/40" />
                            <h2 className="text-[#F4B000]/80 font-black uppercase tracking-[0.5em] text-[10px]">
                                The Privilege Tier
                            </h2>
                        </div>
                        <h1 className="text-7xl font-black italic uppercase tracking-tighter leading-[0.85] text-white">
                            THE O&apos;<br />
                            <span className="text-[#F4B000]">CIRCLE.</span>
                        </h1>
                        <div className="space-y-4">
                            <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-xs">
                                Exclusive financial engineering for the modern rider.
                            </p>
                            <div className="h-px w-24 bg-white/10" />
                            <p className="text-sm font-bold text-white tracking-widest uppercase italic">
                                Ownership, accelerated.
                            </p>
                        </div>
                    </div>

                    <div className="px-6 space-y-4">
                        {[
                            { title: 'Zero Downpayment', subtitle: 'INSTANT OWNERSHIP', desc: 'Acquire your machine with zero capital upfront. Leverage our institutional partnerships for 100% on-road financing.' },
                            { title: 'Zero Processing Fee', subtitle: 'EFFICIENCY LAYER', desc: 'Eliminate all administrative friction. No hidden processing fees, no management surcharges. Pure value transfer.' },
                            { title: 'Zero Documentation', subtitle: 'DIGITAL ONBOARDING', desc: 'Fully paperless execution via sovereign digital identity. Verified and authorized in under 60 seconds.' }
                        ].map((item, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveStep(i)}
                                className={`p-10 rounded-[3rem] transition-all duration-700 overflow-hidden relative cursor-pointer ${activeStep === i ? 'bg-white text-black shadow-2xl' : 'bg-black/40 border border-white/5'}`}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${activeStep === i ? 'text-zinc-400' : 'text-[#F4B000]'}`}>Tier_0{i + 1}</span>
                                </div>
                                <div className="space-y-2">
                                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeStep === i ? 'text-zinc-500' : 'text-white/20'}`}>
                                        {item.subtitle}
                                    </p>
                                    <h4 className="text-4xl font-black italic tracking-tighter mb-4 font-serif">{item.title}</h4>
                                </div>
                                <AnimatePresence>
                                    {activeStep === i && (
                                        <motion.p
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="text-sm font-medium leading-relaxed font-serif text-zinc-600 mt-4 text-center"
                                        >
                                            {item.desc}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                        <button className="w-full py-6 bg-white text-black font-black uppercase text-xs tracking-[0.5em] rounded-[2rem] active:scale-95 transition-transform shadow-2xl mt-8">
                            Enter Circle
                        </button>
                    </div>
                </div>
            </section>

            {/* 8. FOOTER */}
            <MobileFooter />
        </div>
    );
};
