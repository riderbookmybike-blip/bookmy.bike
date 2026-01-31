'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileFooter } from '../layout/MobileFooter';
import { MobileHeader } from '../layout/MobileHeader';

export const MobileHomeOptionH = () => {
    const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
    const [activeSection, setActiveSection] = useState(0);

    useEffect(() => {
        const handleTouch = (e: TouchEvent) => {
            if (e.touches[0]) {
                const x = (e.touches[0].clientX / window.innerWidth) * 100;
                const y = (e.touches[0].clientY / window.innerHeight) * 100;
                setGlowPosition({ x, y });
            }
        };

        window.addEventListener('touchmove', handleTouch);
        return () => window.removeEventListener('touchmove', handleTouch);
    }, []);

    return (
        <div className="bg-black text-white min-h-screen relative overflow-hidden">
            <MobileHeader />
            {/* Interactive Ambient Glow */}
            <motion.div
                animate={{
                    left: `${glowPosition.x}%`,
                    top: `${glowPosition.y}%`
                }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                className="fixed w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
            >
                <div className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-blue-500/20 to-transparent blur-[100px]" />
            </motion.div>

            {/* 1. GLASSMORPHIC HERO */}
            <section className="min-h-screen flex flex-col justify-center px-6 py-20 relative z-10 pt-24">
                {/* Floating Glass Card */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.5)]" />

                    <div className="relative p-10 space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                            <Sparkles size={14} className="text-purple-400" />
                            <span className="text-xs font-bold uppercase tracking-wider">Premium Marketplace</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
                            <span className="block text-white/40">The Future</span>
                            <span className="block bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                                Is Here
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                            Experience India&apos;s most advanced motorcycle marketplace. Transparent pricing, instant delivery, guaranteed savings.
                        </p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { value: '380+', label: 'Bikes', glow: 'from-blue-500' },
                                { value: '4H', label: 'Delivery', glow: 'from-purple-500' },
                                { value: '₹12K', label: 'Savings', glow: 'from-pink-500' }
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    className="relative group"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.glow} to-transparent opacity-0 group-hover:opacity-20 blur-xl transition-opacity`} />
                                    <div className="relative p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                                        <p className="text-2xl font-black mb-1">{stat.value}</p>
                                        <p className="text-[8px] text-white/40 uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Link href="/m/store/catalog">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="w-full py-5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-full border border-white/20 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 hover:border-white/40 transition-all"
                            >
                                Explore Collection
                                <ArrowRight size={18} />
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* Floating Orbs */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            delay: i * 0.5
                        }}
                        className="absolute w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-2xl"
                        style={{
                            left: `${20 + i * 30}%`,
                            top: `${30 + i * 10}%`
                        }}
                    />
                ))}
            </section>

            {/* 2. GLASS BRAND CARDS */}
            <section className="px-6 py-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Elite Brands</h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                    {['HONDA', 'YAMAHA', 'KTM', 'TVS', 'BAJAJ', 'SUZUKI'].map((brand, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                            <div className="relative aspect-square bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-all">
                                <span className="text-lg font-black">{brand}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 3. PROCESS - GLASS PANELS */}
            <section className="px-6 py-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">How it Works</h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                </motion.div>

                <div className="space-y-6">
                    {[
                        {
                            num: '01',
                            title: 'Browse',
                            desc: 'Explore 380+ premium motorcycles with real-time availability',
                            icon: Sparkles,
                            glow: 'from-blue-500'
                        },
                        {
                            num: '02',
                            title: 'Quote',
                            desc: 'Get instant, transparent pricing with guaranteed lowest EMI',
                            icon: Zap,
                            glow: 'from-purple-500'
                        },
                        {
                            num: '03',
                            title: 'Ride',
                            desc: 'Digital documentation and delivery within 4 hours',
                            icon: TrendingUp,
                            glow: 'from-pink-500'
                        }
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onViewportEnter={() => setActiveSection(i)}
                            className="relative group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${step.glow} to-transparent opacity-0 group-hover:opacity-20 blur-2xl transition-opacity`} />
                            <div className="relative p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 group-hover:border-white/30 transition-all">
                                <div className="flex items-start gap-6">
                                    <div className={`w-16 h-16 flex-shrink-0 bg-gradient-to-br ${step.glow} to-transparent rounded-2xl flex items-center justify-center border border-white/20`}>
                                        <step.icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-2xl font-black">{step.title}</h3>
                                            <span className="text-xs text-white/40 font-mono">{step.num}</span>
                                        </div>
                                        <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 4. CATEGORIES - FROSTED GLASS */}
            <section className="px-6 py-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Collections</h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                </motion.div>

                <div className="space-y-6">
                    {[
                        { title: 'Scooters', count: '120+', glow: 'from-blue-500' },
                        { title: 'Motorcycles', count: '200+', glow: 'from-purple-500' },
                        { title: 'Mopeds', count: '60+', glow: 'from-green-500' }
                    ].map((cat, i) => (
                        <Link
                            key={i}
                            href={`/m/store/catalog?cat=${cat.title.toLowerCase()}`}
                        >
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative group"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r ${cat.glow} to-transparent opacity-0 group-hover:opacity-30 blur-2xl transition-opacity`} />
                                <div className="relative p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 group-hover:border-white/30 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-3xl font-black mb-2">{cat.title}</h3>
                                            <p className="text-xs text-white/40 uppercase tracking-widest">{cat.count} Models Available</p>
                                        </div>
                                        <ArrowRight size={32} className="text-white/40 group-hover:text-white group-hover:translate-x-2 transition-all" />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 5. FLOATING CTA */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-6 left-6 right-6 z-50"
            >
                <Link href="/m/store/catalog">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50 blur-xl group-hover:opacity-100 transition-opacity" />
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="relative w-full py-5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-full border border-white/30 font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3"
                        >
                            Start Your Journey
                            <ArrowRight size={24} />
                        </motion.button>
                    </div>
                </Link>
            </motion.div>

            {/* 6. FOOTER */}
            <div className="mt-20 relative z-10">
                <MobileFooter />
            </div>
        </div>
    );
};
