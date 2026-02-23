'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, ChevronDown, Gauge, Zap, Wind, Disc, Trophy, ArrowRight, Shield } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

const BRAND_BLUE = '#0055D4'; // Yamaha Racing Blue (approx)
const BRAND_SILVER = '#A5A9B4'; // R15M Silver theme

export default function R15MV2Page() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: containerRef });

    // Parallax effects
    const heroY = useTransform(scrollYProgress, [0, 0.2], ['0%', '50%']);
    const textY = useTransform(scrollYProgress, [0, 0.2], ['0%', '100%']);
    const opacityFade = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

    // Features reveal
    const feature1Y = useTransform(scrollYProgress, [0.2, 0.4], [100, 0]);
    const feature2Y = useTransform(scrollYProgress, [0.4, 0.6], [100, 0]);

    return (
        <div ref={containerRef} className="bg-[#0b0d10] text-white selection:bg-blue-600 selection:text-white">
            {/* ════════════ FIXED HEADER ════════════ */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex items-center justify-between mix-blend-difference"
            >
                <Link
                    href="/store/catalog"
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Back to Garage</span>
                </Link>
                <Logo mode="dark" size={24} variant="icon" />
                <button className="px-6 py-2 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors">
                    Book Now
                </button>
            </motion.header>

            {/* ════════════ HERO SECTION ════════════ */}
            <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
                {/* Background Text Layer */}
                <motion.div
                    style={{ y: textY, opacity: opacityFade }}
                    className="absolute inset-0 flex items-center justify-center select-none"
                >
                    <h1 className="text-[20vw] font-black italic tracking-tighter text-[#1a1a1a] leading-none">R15M</h1>
                </motion.div>

                {/* Main Image Layer */}
                <motion.div style={{ y: heroY }} className="relative z-10 w-full max-w-[90vw] md:max-w-[70vw]">
                    <img
                        src="/images/products/yamaha-r15m-hero-v2.jpg"
                        alt="Yamaha R15M"
                        className="w-full h-auto drop-shadow-2xl"
                        style={{ filter: 'drop-shadow(0 0 100px rgba(0,85,212,0.2))' }}
                    />
                </motion.div>

                {/* Foreground Info */}
                <motion.div
                    style={{ opacity: opacityFade }}
                    className="absolute bottom-12 left-6 md:left-12 z-20 max-w-md"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                            The R-DNA
                        </span>
                        <span className="h-px w-10 bg-white/20" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold italic tracking-tight mb-2">
                        We R Racing <br /> Perfection.
                    </h2>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Born from the YZF-R1. The R15M isn't just a bike. It's a statement of dominance.
                    </p>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    style={{ opacity: opacityFade }}
                    className="absolute bottom-8 right-6 md:right-12 z-20 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 rotate-90 origin-right translate-x-4 mb-8">
                        Scroll to Explore
                    </span>
                    <div className="w-px h-16 bg-gradient-to-b from-blue-600 to-transparent" />
                </motion.div>
            </section>

            {/* ════════════ STATS STRIP ════════════ */}
            <section className="py-20 border-y border-white/5 bg-[#0f1115]">
                <div className="page-container grid grid-cols-2 md:grid-cols-4 gap-12">
                    {[
                        { label: 'Displacement', value: '155', unit: 'cc' },
                        { label: 'Max Power', value: '18.4', unit: 'PS' },
                        { label: 'Top Speed', value: '140', unit: 'km/h' },
                        { label: 'Technology', value: 'VVA', unit: 'Active' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center md:text-left">
                            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                                {stat.label}
                            </p>
                            <div className="flex items-baseline justify-center md:justify-start gap-1">
                                <span className="text-4xl md:text-5xl font-black italic">{stat.value}</span>
                                <span className="text-xl text-blue-500 font-bold">{stat.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════ FEATURE: ENGINE ════════════ */}
            <section className="min-h-screen flex items-center py-20 relative overflow-hidden">
                <div className="page-container grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="relative z-10 order-2 md:order-1">
                        <motion.div style={{ y: feature1Y }} className="space-y-8">
                            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter">
                                155cc LC4V <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-white">
                                    SOHC Engine.
                                </span>
                            </h3>
                            <p className="text-xl text-white/50 leading-relaxed max-w-lg">
                                Liquid-cooled, 4-stroke, SOHC, 4-value engine. Featuring Variable Valve Actuation (VVA)
                                that kicks in at 7,400 RPM for top-end fury.
                            </p>
                            <div className="grid grid-cols-2 gap-6 pt-8">
                                <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                                    <p className="text-2xl font-bold text-white">14.2 Nm</p>
                                    <p className="text-xs text-white/40 uppercase">Peak Torque</p>
                                </div>
                                <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                                    <p className="text-2xl font-bold text-white">10,000</p>
                                    <p className="text-xs text-white/40 uppercase">Redline RPM</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    <div className="relative z-0 order-1 md:order-2 h-full flex items-center justify-center">
                        {/* Placeholder for Engine Image - using Product Image zoomed */}
                        <div className="relative w-full aspect-square rounded-full border border-white/5 bg-gradient-to-br from-blue-900/20 to-transparent flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-blue-600/20 blur-[100px]" />
                            <img
                                src="/images/products/yamaha-r15m-product.png"
                                className="scale-150 rotate-12 opacity-80"
                                alt="Engine Detail"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════ TECH GRID ════════════ */}
            <section className="py-32 bg-[#0f1115] relative">
                <div className="page-container">
                    <div className="mb-20">
                        <span className="text-blue-500 font-bold tracking-widest text-sm uppercase">
                            Smart Technology
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mt-4">
                            Born on the Track. <br />
                            Built for the Road.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Wind size={24} />,
                                title: 'Quick Shifter',
                                desc: 'Clutchless upshifts for seamless acceleration. Keep the throttle pinned.',
                            },
                            {
                                icon: <Disc size={24} />,
                                title: 'Traction Control',
                                desc: 'Dedicated electronic system to reduce rear wheel spin in all conditions.',
                            },
                            {
                                icon: <Gauge size={24} />,
                                title: 'Y-Connect',
                                desc: 'Bluetooth connectivity. Call alerts, SMS, battery status, and breakdown alerts.',
                            },
                            {
                                icon: <Trophy size={24} />,
                                title: 'Assist & Slipper Clutch',
                                desc: 'Lighter clutch pull and smoother downshifts during aggressive braking.',
                            },
                            {
                                icon: <Zap size={24} />,
                                title: 'Class D Headlight',
                                desc: 'Bi-functional LED headlight unit for superior night visibility.',
                            },
                            {
                                icon: <Shield size={24} />,
                                title: 'Dual Channel ABS',
                                desc: 'Superior braking control with 282mm front and 220mm rear disc brakes.',
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="group p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#0b0d10] flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all">
                                    {feature.icon}
                                </div>
                                <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                                <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/80 transition-colors">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════ BUYING CTA ════════════ */}
            <section className="h-[80vh] relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="/images/products/yamaha-r15m-hero-v2.jpg"
                        className="w-full h-full object-cover opacity-30 grayscale"
                        alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d10] via-[#0b0d10]/80 to-transparent" />
                </div>

                <div className="relative z-10 text-center max-w-2xl px-6">
                    <p className="text-blue-500 font-bold uppercase tracking-widest mb-6">Price Drop Alert</p>
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="text-5xl md:text-7xl font-black tracking-tight">₹1,94,412</span>
                    </div>
                    <p className="text-white/40 text-sm uppercase tracking-wider mb-12">Ex-Showroom Delhi</p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2">
                            Check EMI
                            <ArrowRight size={18} />
                        </button>
                        <button className="px-10 py-5 bg-white dark:bg-slate-100 text-black hover:bg-gray-200 font-bold uppercase tracking-widest rounded-full transition-all hover:scale-105">
                            Book Test Ride
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
