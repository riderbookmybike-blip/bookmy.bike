'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Gauge, Flame, Wind, Timer } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

const GOLD = '#FFD700';

export default function LandingV11Page() {
    const scrollContainer = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();

    // Smooth scroll physics
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Kinetic typography transforms
    const x1 = useTransform(smoothProgress, [0, 0.25], [0, -1000]);
    const x2 = useTransform(smoothProgress, [0, 0.25], [0, 1000]);
    const scale = useTransform(smoothProgress, [0, 0.15], [1, 5]);
    const opacity = useTransform(smoothProgress, [0.1, 0.2], [1, 0]);

    return (
        <div className="bg-black text-white selection:bg-[#FFD700] selection:text-black font-black italic uppercase tracking-tighter">

            {/* ════════════ OVERLAY HUD ════════════ */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100] border-[20px] border-white/5">
                <div className="absolute top-10 left-10">
                    <Logo mode="dark" size={32} variant="icon" />
                </div>
                <div className="absolute bottom-10 left-10 text-[10px] tracking-[0.5em] text-white/40">
                    [ SYSTEM STATUS: FLASHBOLT v11.0 ]
                </div>
                <div className="absolute top-10 right-10 flex gap-4 pointer-events-auto">
                    <Link href="/login" className="px-6 py-2 border border-white/20 text-xs hover:bg-white hover:text-black transition-all">
                        SYS LOG
                    </Link>
                </div>
            </div>


            {/* ════════════ KINETIC HERO ════════════ */}
            <section className="relative h-[400vh] bg-black">

                {/* Fixed Center Point */}
                <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

                    {/* Background Speed Lines */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <motion.div
                            style={{ opacity: useTransform(smoothProgress, [0, 0.1], [0.3, 1]) }}
                            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.1)_0%,transparent_70%)]"
                        />
                    </div>

                    {/* Phase 1: THE IGNITION */}
                    <motion.div
                        style={{ scale, opacity }}
                        className="relative z-10 text-center"
                    >
                        <h1 className="text-[25vw] leading-none mb-0">FLASH</h1>
                        <p className="text-sm tracking-[1.5em] text-[#FFD700] -mt-10">BOLT</p>
                    </motion.div>

                    {/* Phase 2: THE SPLIT VELOCITY */}
                    <AnimatePresence>
                        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                            <motion.div style={{ x: x1 }} className="text-[15vw] whitespace-nowrap opacity-10 blur-sm">SPEED SPEED SPEED SPEED</motion.div>
                            <motion.div style={{ x: x2 }} className="text-[15vw] whitespace-nowrap opacity-10 blur-sm">FASTER FASTER FASTER FASTER</motion.div>
                        </div>
                    </AnimatePresence>

                    {/* Phase 3: DATA BURST (Visible as you scroll) */}
                    <motion.div
                        style={{
                            opacity: useTransform(smoothProgress, [0.2, 0.3, 0.5], [0, 1, 0]),
                            y: useTransform(smoothProgress, [0.2, 0.5], [100, -100])
                        }}
                        className="absolute inset-0 flex items-center justify-center pt-20"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 w-full max-w-7xl px-12">
                            {[
                                { icon: <Timer size={48} />, label: "INSTANT", val: "10 MINS", desc: "APPROVAL PULSE" },
                                { icon: <Gauge size={48} />, label: "RATES", val: "9.5%", desc: "LOW FREQUENCY" },
                                { icon: <Zap size={48} />, label: "DOCUMENTS", val: "ZERO", desc: "SMOKELESS PROCESS" }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-4 group">
                                    <div className="w-24 h-24 bg-[#FFD700] text-black flex items-center justify-center rounded-sm rotate-45 group-hover:rotate-0 transition-transform duration-500">
                                        <div className="-rotate-45 group-hover:rotate-0 transition-transform">
                                            {item.icon}
                                        </div>
                                    </div>
                                    <span className="text-xs tracking-widest text-white/40">{item.label}</span>
                                    <span className="text-6xl text-[#FFD700]">{item.val}</span>
                                    <span className="text-[10px] tracking-widest">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Phase 4: THE TRIGGER */}
                    <motion.div
                        style={{
                            opacity: useTransform(smoothProgress, [0.6, 0.7], [0, 1]),
                            scale: useTransform(smoothProgress, [0.6, 0.8], [0.8, 1])
                        }}
                        className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
                    >
                        <h2 className="text-[10vw] text-white/10 mb-8">STOP DREAMING</h2>
                        <Link
                            href="/store/catalog"
                            className="pointer-events-auto group relative px-20 py-10 bg-[#FFD700] text-black text-4xl hover:bg-white transition-all overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-6">
                                START RIDING <ArrowRight size={48} />
                            </span>
                            <div className="absolute inset-0 bg-white/40 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                        </Link>
                        <p className="mt-8 text-xs tracking-[1em] text-white/40">NO DOWNPAYMENT OPTIONS AVAILABLE</p>
                    </motion.div>

                    {/* Background Machine Visual (Generic) */}
                    <motion.div
                        style={{
                            opacity: useTransform(smoothProgress, [0.3, 0.6], [0, 0.3]),
                            scale: useTransform(smoothProgress, [0.3, 0.6], [1.2, 1])
                        }}
                        className="absolute inset-0 z-[-1]"
                    >
                        <img
                            src="/images/hero/blurred_bike_hero.png"
                            alt=""
                            className="w-full h-full object-cover grayscale contrast-200"
                        />
                    </motion.div>
                </div>
            </section>


            {/* ════════════ VERTICAL FALLOUT ════════════ */}
            <section className="py-40 bg-white text-black">
                <div className="max-w-7xl mx-auto px-10">
                    <div className="flex justify-between items-end mb-20 border-b-4 border-black pb-10">
                        <h3 className="text-8xl w-1/2 leading-none">THE RULES HAVE CHANGED.</h3>
                        <div className="text-right">
                            <p className="text-xl">OLD WAY: BANK VISITS, FILES, DAYS.</p>
                            <p className="text-xl font-bold">NEW WAY: FLASHBOLT, 10 MINS, RIDE.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-40">
                        <div className="space-y-12">
                            <h4 className="text-4xl text-[#FFD700] bg-black inline-block px-4">01. THE ENGINE</h4>
                            <p className="text-xl normal-case not-italic tracking-normal">Our AI Engine connects directly to credit bureaus in sub-seconds. We don't wait for humans to approve. We trust the code.</p>
                        </div>
                        <div className="space-y-12">
                            <h4 className="text-4xl text-[#FFD700] bg-black inline-block px-4">02. THE REWARD</h4>
                            <p className="text-xl normal-case not-italic tracking-normal">Loyalty isn't just a word. Every EMI paid on time boosts your FlashScore, dropping your interest rates for your next upgrade automatically.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════ CTA ════════════ */}
            <section className="h-[50vh] flex items-center justify-center bg-black relative overflow-hidden">
                <div className="text-[20vw] opacity-5 absolute inset-0 text-center select-none">BMB</div>
                <Link href="/store/catalog" className="text-6xl md:text-8xl hover:text-[#FFD700] transition-colors border-b-8 border-[#FFD700]">
                    LAUNCH NOW
                </Link>
            </section>

        </div>
    );
}
