'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

const GOLD = '#F4B000';

export default function LandingV6Page() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, { damping: 20 });
    const y = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

    return (
        <div ref={containerRef} className="bg-[#050505] text-[#ECECEC] font-sans selection:bg-[#F4B000] selection:text-black overflow-x-hidden">

            {/* ════════════ HEADER ════════════ */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between"
            >
                <Logo mode="dark" size={32} variant="full" />
                <div className="flex gap-2">
                    <Link href="/store/catalog" className="px-6 py-2 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                        Catalog
                    </Link>
                    <Link href="/login" className="px-6 py-2 rounded-full bg-[#F4B000] text-black text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                        Sign In
                    </Link>
                </div>
            </motion.header>


            {/* ════════════ HERO SECTION ════════════ */}
            <section className="relative h-[120vh] w-full flex flex-col items-center justify-center p-4">
                <div className="absolute inset-0 z-0">
                    <motion.div
                        style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "50%"]) }}
                        className="w-full h-full"
                    >
                        <img
                            src="/images/hero/blurred_bike_hero.png"
                            alt=""
                            className="w-full h-full object-cover opacity-30 grayscale contrast-125"
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-[90vw]">
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <h1 className="text-[12vw] leading-[0.8] font-black tracking-tighter uppercase mix-blend-overlay">
                            Access
                        </h1>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden flex items-baseline gap-4 md:gap-8"
                    >
                        <span className="text-xl md:text-3xl font-light italic text-[#F4B000]">The New Standard</span>
                        <h1 className="text-[12vw] leading-[0.8] font-black tracking-tighter uppercase text-white">
                            Mobility
                        </h1>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-12 left-8 md:left-12 max-w-sm"
                >
                    <div className="h-px w-12 bg-[#F4B000] mb-6" />
                    <p className="text-sm md:text-base font-light text-white/60 leading-relaxed">
                        Own your dream two-wheeler without the financial weight.
                        Zero processing fees. Instant approval. Pure freedom.
                    </p>
                </motion.div>
            </section>


            {/* ════════════ STICKY SCROLL SECTION ════════════ */}
            <section className="relative">
                <div className="sticky top-0 h-screen flex items-center overflow-hidden">
                    {/* Big Background Text */}
                    <div className="absolute -right-[10%] top-1/2 -translate-y-1/2 text-[40vh] font-black text-[#111] leading-none whitespace-nowrap select-none -z-10">
                        BOOKMY.BIKE
                    </div>

                    <div className="w-full md:w-1/2 px-8 md:pl-24">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-[#F4B000] text-sm font-bold uppercase tracking-[0.3em] mb-4 block">
                                The Promise
                            </span>
                            <h2 className="text-5xl md:text-7xl font-bold leading-[0.9] tracking-tight mb-8">
                                Why <br />
                                Settle <br />
                                For Less?
                            </h2>
                            <p className="text-xl text-white/50 max-w-md leading-relaxed mb-12">
                                We've rebuilt the financing engine from scratch.
                                Designed for speed, transparency, and you.
                            </p>
                            <Link href="/store/catalog" className="inline-flex items-center gap-2 border-b border-[#F4B000] pb-1 text-[#F4B000] hover:text-white hover:border-white transition-colors uppercase tracking-widest text-xs font-bold">
                                See all benefits <ArrowUpRight size={16} />
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* Scrolling Cards */}
                <div className="relative z-10 w-full md:w-1/2 ml-auto -mt-[80vh] px-8 md:pr-24 pb-32 space-y-32">
                    {[
                        { title: "Lowest EMI Guarantee", desc: "We match any market rate. Period.", icon: <Shield size={32} /> },
                        { title: "Zero Friction", desc: "Paperless. Instant. 10 minutes to approval.", icon: <Zap size={32} /> },
                        { title: "Complete Clarity", desc: "Every rupee accounted for. No hidden fees.", icon: <CheckCircle2 size={32} /> }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ margin: "-20%" }}
                            transition={{ duration: 0.6 }}
                            className="bg-[#111] border border-white/5 p-12 rounded-none aspect-square flex flex-col justify-between group hover:border-[#F4B000]/50 transition-colors"
                        >
                            <div className="text-[#F4B000] opacity-50 group-hover:opacity-100 transition-opacity">
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold mb-4">{item.title}</h3>
                                <p className="text-white/40">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>


            {/* ════════════ HORIZONTAL TICKER ════════════ */}
            <section className="py-20 border-y border-white/5 bg-[#F4B000] text-black overflow-hidden transform -skew-y-2 origin-left">
                <div className="flex whitespace-nowrap animate-marquee">
                    {[...Array(6)].map((_, i) => (
                        <span key={i} className="text-6xl md:text-8xl font-black uppercase tracking-tighter mx-8">
                            Zero Cost EMI • Instant Approval • No Documentation •
                        </span>
                    ))}
                </div>
            </section>


            {/* ════════════ MINIMAL STATS ════════════ */}
            <section className="py-32 px-8 md:px-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { val: "500+", lbl: "Models" },
                        { val: "₹999", lbl: "EMI Starts" },
                        { val: "10m", lbl: "Approval" },
                        { val: "0%", lbl: "Processing" },
                    ].map((stat, i) => (
                        <div key={i} className="border-l border-white/10 pl-8">
                            <motion.h4
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-6xl font-thin tracking-tighter mb-2"
                            >
                                {stat.val}
                            </motion.h4>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F4B000]">
                                {stat.lbl}
                            </p>
                        </div>
                    ))}
                </div>
            </section>


            {/* ════════════ FINAL CTA ════════════ */}
            <section className="h-[80vh] relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero/blurred_bike_hero.png"
                        alt=""
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-[#050505]/80" />
                </div>

                <div className="relative z-10 text-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">
                        Don't Just Dream. <br />
                        <span className="text-[#F4B000]">Drive.</span>
                    </h2>

                    <Link
                        href="/store/catalog"
                        className="group relative inline-flex items-center justify-center px-12 py-6 bg-white text-black font-bold uppercase tracking-widest overflow-hidden"
                    >
                        <span className="relative z-10 transition-colors group-hover:text-white">Start Configuration</span>
                        <div className="absolute inset-0 bg-[#F4B000] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    </Link>
                </div>
            </section>

        </div>
    );
}
