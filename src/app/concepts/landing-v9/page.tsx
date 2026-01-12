'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Timer, ArrowRight, TrendingDown, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

const NEON_GOLD = '#FFD700'; // Brighter Gold for Neon effect

export default function LandingV9Page() {
    const [timeLeft, setTimeLeft] = useState({ m: 14, s: 59 });

    // Flash Sale Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.s === 0) return { m: prev.m - 1, s: 59 };
                return { ...prev, s: prev.s - 1 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-black text-white min-h-screen font-sans selection:bg-[#FFD700] selection:text-black overflow-x-hidden">

            {/* ════════════ FLASH HEADER ════════════ */}
            <div className="bg-[#FFD700] text-black text-xs font-black uppercase tracking-widest py-1 text-center animate-pulse">
                ⚡ Flash Finance Festival Live Now ⚡
            </div>

            <nav className="absolute top-8 w-full z-50 px-6 md:px-12 flex justify-between items-center">
                <Logo mode="dark" size={32} variant="full" />
                <Link href="/login" className="hidden md:block text-sm font-bold uppercase tracking-widest hover:text-[#FFD700] transition-colors">
                    Login
                </Link>
            </nav>


            {/* ════════════ HIGH VOLTAGE HERO ════════════ */}
            <section className="relative h-screen w-full flex flex-col justify-center items-center overflow-hidden">

                {/* Dynamic Lightning Background */}
                <div className="absolute inset-0 z-0 bg-[#050505]">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,#FFD700_49%,transparent_51%)] opacity-10 bg-[length:200%_200%] animate-shine" />
                    <img
                        src="/images/hero/blurred_bike_hero.png"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen scale-125 grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-5xl">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                    >
                        {/* Flash Badge */}
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-400/10 border border-yellow-400/50 rounded-full text-[#FFD700] mb-8 backdrop-blur-md">
                            <Zap size={16} className="fill-current" />
                            <span className="text-xs font-black uppercase tracking-widest">Instant Approval Engine</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-none mb-6 relative">
                            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500">
                                LIGHTNING
                            </span>
                            <br />
                            <span className="text-[#FFD700] drop-shadow-[0_0_35px_rgba(255,215,0,0.5)]">
                                FAST.
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-12 font-medium">
                            From dream to delivery in <span className="text-white border-b border-[#FFD700]">48 hours</span>.
                            <br />No paperwork. No waiting. Just ride.
                        </p>

                        {/* CTA Cluster */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                            <Link
                                href="/store/catalog"
                                className="relative group px-12 py-5 bg-[#FFD700] text-black text-lg font-black uppercase tracking-wider skew-x-[-10deg] hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:shadow-[0_0_50px_rgba(255,215,0,0.6)]"
                            >
                                <span className="block skew-x-[10deg]">Get Approved Now</span>
                            </Link>
                            <div className="flex items-center gap-4 text-sm font-bold skew-x-[-10deg] px-8 py-5 border border-white/20 hover:bg-white/5 transition-colors cursor-pointer">
                                <span className="skew-x-[10deg] flex items-center gap-2">
                                    <Timer size={18} className="text-[#FFD700]" />
                                    <span>Approval in 10m</span>
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* ════════════ FLASH CARDS ════════════ */}
            <section className="py-24 px-6 md:px-12 max-w-8xl mx-auto bg-[#0a0a0a]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-32 relative z-20">
                    {[
                        {
                            title: "Lowest ROI",
                            val: "9.5%",
                            sub: "Interest Rate",
                            icon: <TrendingDown size={32} />
                        },
                        {
                            title: "Zero Cost",
                            val: "₹0",
                            sub: "Processing Fee",
                            icon: <ShieldCheck size={32} />
                        },
                        {
                            title: "Cashback",
                            val: "₹5000",
                            sub: "On First EMI",
                            icon: <Zap size={32} />
                        },
                    ].map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 50, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#111] border border-white/10 p-8 hover:border-[#FFD700] transition-colors group relative overflow-hidden"
                        >
                            {/* Hover Flash Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine" />

                            <div className="flex justify-between items-start mb-6">
                                <span className="text-white/40 font-bold uppercase tracking-wider text-sm">{card.title}</span>
                                <div className="text-[#FFD700]">{card.icon}</div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-6xl font-black italic tracking-tighter text-white group-hover:text-[#FFD700] transition-colors">
                                    {card.val}
                                </h3>
                            </div>
                            <p className="mt-2 text-white/40 font-mono text-sm">{card.sub}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ════════════ URGENCY FOOTER ════════════ */}
            <section className="py-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[#FFD700] opacity-5 -skew-y-3 z-0" />
                <div className="relative z-10">
                    <p className="text-[#FFD700] font-black uppercase tracking-widest mb-4 animate-pulse">
                        Offer Ends In
                    </p>
                    <div className="text-5xl md:text-8xl font-black tabular-nums tracking-tighter mb-12">
                        00 : {timeLeft.m.toString().padStart(2, '0')} : {timeLeft.s.toString().padStart(2, '0')}
                    </div>
                    <Link href="/store/catalog" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-sm font-bold border-b border-white/20 pb-1 hover:border-white">
                        Don't Miss Out <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

        </div>
    );
}
