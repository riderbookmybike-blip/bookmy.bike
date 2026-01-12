'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Activity, Percent, Clock, FileCheck, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

const BRAND_GOLD = '#F4B000';

export default function LandingV7Page() {
    const { scrollY } = useScroll();
    const [emi, setEmi] = useState(2500);

    // Dynamic EMI Slider Logic
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmi(parseInt(e.target.value));
    };

    return (
        <div className="bg-black text-white min-h-screen font-sans selection:bg-[#F4B000] selection:text-black overflow-x-hidden">

            {/* ════════════ HEADER ════════════ */}
            <header className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
                <Logo mode="dark" size={28} variant="full" />
                <div className="flex gap-4">
                    <Link href="/login" className="px-5 py-2 text-sm font-bold uppercase tracking-widest hover:text-[#F4B000] transition-colors">
                        Login
                    </Link>
                    <Link href="/store/catalog" className="px-6 py-2 bg-[#F4B000] text-black text-sm font-bold uppercase tracking-widest rounded-full hover:bg-white transition-colors">
                        Get Started
                    </Link>
                </div>
            </header>

            {/* ════════════ HERO: THE PULSE ════════════ */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                {/* Abstract Background - Generic & Blurred */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero/blurred_bike_hero.png"
                        alt=""
                        className="w-full h-full object-cover opacity-30 blur-sm scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                </div>

                <div className="relative z-10 w-full max-w-5xl px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-[#F4B000] animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Live Finance Engine</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9]">
                            SPEED OF <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4B000] to-yellow-200">
                                APPROVAL.
                            </span>
                        </h1>

                        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-12">
                            The fastest way to own a two-wheeler in India.
                            <br className="hidden md:block" />
                            No banks visits. No paperwork piles. Just ride.
                        </p>

                        {/* Interactive EMI Pulse */}
                        <div className="max-w-xl mx-auto bg-[#111] border border-white/10 p-6 rounded-3xl shadow-2xl shadow-[#F4B000]/10">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Adjust Budget</span>
                                <div className="text-right">
                                    <span className="text-4xl font-black text-[#F4B000]">₹{emi.toLocaleString()}</span>
                                    <span className="text-sm text-white/40 ml-1">/mo</span>
                                </div>
                            </div>

                            <input
                                type="range"
                                min="999"
                                max="8000"
                                step="100"
                                value={emi}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#F4B000] hover:accent-white transition-all"
                            />

                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-xs text-white/40 mb-1">Down Payment</p>
                                    <p className="font-bold">₹{(emi * 1.5).toLocaleString()}</p>
                                </div>
                                <Link
                                    href="/store/catalog"
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-wide text-xs hover:bg-[#F4B000] transition-colors"
                                >
                                    View Bikes <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* ════════════ LIVE TICKER ════════════ */}
            <div className="bg-[#F4B000] text-black py-4 overflow-hidden border-y border-white/10 relative z-20">
                <div className="flex animate-marquee whitespace-nowrap">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center mx-8 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                            <span className="font-black text-xl">LOWEST RATES</span>
                            <Activity size={18} />
                            <span className="font-mono font-bold">9.5% INTEREST</span>
                            <span className="w-2 h-2 bg-black rounded-full" />
                            <span className="font-black text-xl">INSTANT APPROVAL</span>
                            <Clock size={18} />
                            <span className="font-mono font-bold">10 MINS</span>
                            <span className="w-2 h-2 bg-black rounded-full" />
                        </div>
                    ))}
                </div>
            </div>


            {/* ════════════ VALUE GRID ════════════ */}
            <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Percent size={32} />,
                            title: "Zero Processing Fee",
                            badge: "LIMITED OFFER",
                            desc: "Keep your money for the road. We charge absolutely nothing to process your loan application."
                        },
                        {
                            icon: <Clock size={32} />,
                            title: "10-Min Decision",
                            badge: "AI POWERED",
                            desc: "Our advanced algorithm analyzes your basic details instantly. No waiting days for approval."
                        },
                        {
                            icon: <FileCheck size={32} />,
                            title: "Minimal Docs",
                            badge: "PAPERLESS",
                            desc: "Just your Aadhaar and PAN. Upload digitally and you're good to go. Physical visits are history."
                        }
                    ].map((item, i) => (
                        <div key={i} className="group p-10 rounded-[2rem] bg-[#0A0A0A] border border-white/5 hover:border-[#F4B000]/30 transition-all duration-300 hover:-translate-y-2">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-[#F4B000] group-hover:bg-[#F4B000] group-hover:text-black transition-colors">
                                    {item.icon}
                                </div>
                                <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:border-[#F4B000]/30 transition-colors">
                                    {item.badge}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                            <p className="text-white/40 leading-relaxed text-sm">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>


            {/* ════════════ BIG CTA ════════════ */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto relative rounded-[3rem] overflow-hidden bg-[#111] border border-white/10">
                    <div className="absolute inset-0 bg-[url('/images/hero/blurred_bike_hero.png')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                    <div className="relative z-10 px-6 py-24 md:py-32 text-center">
                        <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
                            DON'T JUST DREAM. <br />
                            <span className="text-[#F4B000]">OWN IT.</span>
                        </h2>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link href="/store/catalog" className="flex items-center gap-3 px-10 py-5 bg-[#F4B000] text-black rounded-full font-bold uppercase tracking-widest hover:bg-white transition-colors hover:scale-105 transform duration-300">
                                View Marketplace <ArrowRight size={20} />
                            </Link>
                            <Link href="/login" className="px-10 py-5 border border-white/10 bg-white/5 rounded-full font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                                Check Eligibility
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════ FOOTER ════════════ */}
            <footer className="py-12 text-center border-t border-white/5">
                <Logo mode="dark" size={24} variant="icon" />
                <p className="mt-4 text-xs text-white/20 uppercase tracking-widest">© 2026 BookMy.Bike Finance</p>
            </footer>

        </div>
    );
}
