'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronRight, Star, ShieldCheck, Zap } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

const GOLD = '#F4B000';

export default function LandingV8Page() {
    const { scrollY } = useScroll();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Interactive ambient light effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="bg-[#030303] text-white min-h-screen font-sans overflow-x-hidden selection:bg-[#F4B000] selection:text-black">

            {/* ════════════ HEADER ════════════ */}
            <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference">
                <Logo mode="dark" size={32} variant="full" />
                <div className="hidden md:flex gap-8">
                    {['Catalog', 'Finance', 'Stories'].map((item) => (
                        <Link key={item} href="#" className="text-sm font-medium hover:text-[#F4B000] transition-colors uppercase tracking-widest">
                            {item}
                        </Link>
                    ))}
                </div>
                <Link href="/login" className="px-6 py-2 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                    Sign In
                </Link>
            </nav>

            {/* ════════════ CINEMATIC HERO ════════════ */}
            <section className="relative h-screen w-full flex items-center overflow-hidden">

                {/* Dynamic Background Layer */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.4, 0.5, 0.4]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                        <img
                            src="/images/hero/blurred_bike_hero.png"
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </motion.div>

                    {/* Cinematic Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

                    {/* Interactive Gold Glow */}
                    <div
                        className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-20 pointer-events-none transition-transform duration-100 ease-out"
                        style={{
                            background: GOLD,
                            left: '50%',
                            top: '50%',
                            transform: `translate(${mousePosition.x * 50}px, ${mousePosition.y * 50}px) translate(-50%, -50%)`
                        }}
                    />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left: Manifesto */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-12 h-[1px] bg-[#F4B000]" />
                            <span className="text-[#F4B000] text-xs font-bold uppercase tracking-[0.3em]">
                                The Future of Ownership
                            </span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            PURE <br />
                            RIDING <br />
                            PLEASURE.
                        </h1>

                        <p className="text-lg text-white/60 max-w-md leading-relaxed mb-10 border-l-2 border-white/10 pl-6">
                            Forget the paperwork. We've digitized the entire financing process so you can focus on what matters: <span className="text-white font-semibold">The Ride.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/store/catalog"
                                className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-lg font-bold uppercase tracking-widest hover:bg-[#F4B000] transition-colors"
                            >
                                Start Configurator
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="flex items-center justify-center gap-3 px-8 py-4 border border-white/10 bg-white/5 backdrop-blur-md rounded-lg font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Check Eligibility
                            </button>
                        </div>
                    </motion.div>

                    {/* Right: Floating Glass Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className="hidden lg:block relative"
                    >
                        <div className="absolute inset-0 bg-[#F4B000] blur-[80px] opacity-20" />

                        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Instant Approval</p>
                                    <h3 className="text-3xl font-bold">Lowest Rates</h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[#F4B000] flex items-center justify-center text-black">
                                    <PercentIcon />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { label: "Interest Rate", val: "9.5% p.a." },
                                    { label: "Processing Fee", val: "₹0" },
                                    { label: "Approval Time", val: "10 Mins" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                        <span className="text-sm text-white/50">{item.label}</span>
                                        <span className="font-mono font-bold">{item.val}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <div className="flex items-center gap-4 text-xs text-white/40">
                                    <span className="flex items-center gap-1"><ShieldCheck size={14} /> Secure</span>
                                    <span className="flex items-center gap-1"><Zap size={14} /> Fast</span>
                                    <span className="flex items-center gap-1"><Star size={14} /> 4.9/5 Rating</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ════════════ GRADIENT SCROLL ════════════ */}
            <div className="h-32 bg-gradient-to-b from-transparent to-[#030303] -mt-32 relative z-20 pointer-events-none" />

        </div>
    );
}

const PercentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="5" x2="5" y2="19"></line>
        <circle cx="6.5" cy="6.5" r="2.5"></circle>
        <circle cx="17.5" cy="17.5" r="2.5"></circle>
    </svg>
);
