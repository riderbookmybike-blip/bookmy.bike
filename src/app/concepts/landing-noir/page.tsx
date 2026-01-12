'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export default function LandingNoirPage() {
    return (
        <div className="bg-white text-black min-h-screen font-sans selection:bg-black selection:text-white overflow-x-hidden">

            {/* ════════════ MINIMAL NAV ════════════ */}
            <nav className="fixed top-0 w-full z-50 px-8 py-8 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-black/5">
                <Logo mode="light" size={24} variant="full" />
                <div className="flex gap-12 items-center">
                    <div className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
                        <Link href="#" className="hover:opacity-50 transition-opacity">Philosophy</Link>
                        <Link href="#" className="hover:opacity-50 transition-opacity">Collection</Link>
                        <Link href="#" className="hover:opacity-50 transition-opacity">Institutional</Link>
                    </div>
                    <Link href="/store/catalog" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-black pb-1">
                        Enter Showroom
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </nav>

            {/* ════════════ HERO: NOIR ════════════ */}
            <section className="relative h-screen flex items-center pt-20">
                <div className="max-w-7xl mx-auto px-8 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                        <div className="lg:col-span-7 space-y-12">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8 }}
                            >
                                <h1 className="text-[12vw] lg:text-[100px] font-black leading-[0.9] tracking-tighter uppercase italic">
                                    Pure <br />
                                    Performance. <br />
                                    Zero Noise.
                                </h1>
                            </motion.div>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="max-w-md text-lg text-black/60 font-medium leading-relaxed"
                            >
                                Experience the future of motorcycle acquisition.
                                Transparent pricing. Instant approval. Absolute minimalism.
                            </motion.p>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex flex-wrap gap-8 items-center"
                            >
                                <button className="px-12 py-6 bg-black text-white text-xs font-black uppercase tracking-[0.3em] hover:bg-black/80 transition-all">
                                    Start Journey
                                </button>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Starting Monthly</span>
                                    <span className="text-2xl font-black italic">₹1,999</span>
                                </div>
                            </motion.div>
                        </div>

                        <div className="lg:col-span-5 relative">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="relative aspect-[3/4] bg-black/5 rounded-2xl overflow-hidden group"
                            >
                                <img
                                    src="/images/hero/blurred_bike_hero.png"
                                    alt="Minimal Bike"
                                    className="w-full h-full object-cover grayscale contrast-[1.2] brightness-[1.1]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
                            </motion.div>

                            {/* Minimal Stats Overlay */}
                            <motion.div
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="absolute -bottom-10 -left-10 bg-white p-8 border border-black/5 shadow-2xl space-y-4 hidden md:block"
                            >
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-black/20 uppercase tracking-widest">Identity Secure</div>
                                    <div className="text-xs font-black uppercase tracking-widest italic">Member 0092-A</div>
                                </div>
                                <div className="h-[1px] w-full bg-black/5" />
                                <div className="text-3xl font-black italic">9.5% <span className="text-[10px] font-bold not-italic text-black/40">ROI</span></div>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ════════════ THE STRIP ════════════ */}
            <section className="py-32 border-y border-black/5">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        {[
                            { label: "Approval", val: "10m" },
                            { label: "Interest", val: "9.5%" },
                            { label: "Saving", val: "₹12k+" },
                            { label: "Delivery", val: "48h" }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">{item.label}</div>
                                <div className="text-4xl lg:text-5xl font-black italic tracking-tighter">{item.val}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════ THE PHILOSOPHY ════════════ */}
            <section className="py-40 bg-black text-white">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div className="space-y-10">
                            <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none">
                                LESS IS <br />
                                MORE.
                            </h2>
                            <p className="text-white/40 text-lg font-medium leading-relaxed max-w-sm">
                                We removed the paperwork, the middleman, and the stress.
                                Just you, the machine, and the open road.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-px bg-white/10">
                            <div className="bg-black p-12 space-y-6">
                                <span className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">Core Value</span>
                                <h4 className="text-3xl font-black italic uppercase">Instant Settlement.</h4>
                                <p className="text-white/40 text-sm leading-relaxed">Direct digital transfers to dealerships ensures your bike is ready before you arrive.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════ FOOTER ════════════ */}
            <footer className="py-20 bg-white border-t border-black/5">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
                    <Logo mode="light" size={24} variant="full" />
                    <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
                        <span>Pincode Secure</span>
                        <span>© 2026 BMB NOIR</span>
                        <span>Mumbai, IN</span>
                    </div>
                </div>
            </footer>

        </div>
    );
}
