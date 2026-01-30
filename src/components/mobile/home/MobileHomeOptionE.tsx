'use client';

import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Zap, TrendingUp, Gauge, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileFooter } from '../layout/MobileFooter';
import { MobileHeader } from '../layout/MobileHeader';

export const MobileHomeOptionE = () => {
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 300], [0, -150]);
    const [activeCategory, setActiveCategory] = useState(0);

    return (
        <div className="bg-gradient-to-br from-orange-950 via-black to-black text-white min-h-screen selection:bg-orange-500/30 overflow-x-hidden">
            <MobileHeader />
            {/* 1. VELOCITY HERO */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
                {/* Speed Lines Background */}
                <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: '-100%', opacity: 0 }}
                            animate={{ x: '200%', opacity: [0, 1, 0] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.1,
                                ease: 'linear'
                            }}
                            className="absolute h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                            style={{
                                top: `${(i * 5) + 10}%`,
                                width: `${Math.random() * 40 + 20}%`
                            }}
                        />
                    ))}
                </div>

                {/* Parallax Bike Image */}
                <motion.div
                    style={{ y: heroY }}
                    className="absolute inset-0 opacity-20"
                >
                    <Image
                        src="/images/templates/t3_night.png"
                        alt="Velocity"
                        fill
                        className="object-cover scale-110"
                    />
                </motion.div>

                <div className="relative z-10 px-8 text-center">
                    {/* Speed Badge */}
                    <motion.div
                        initial={{ opacity: 0, skewX: -10 }}
                        animate={{ opacity: 1, skewX: 0 }}
                        className="inline-flex items-center gap-3 px-8 py-3 bg-orange-500/20 border-l-4 border-orange-500 mb-8 backdrop-blur-xl -skew-x-6"
                    >
                        <Zap size={16} className="text-orange-500" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] skew-x-6">VELOCITY MODE</span>
                    </motion.div>

                    {/* Slanted Title */}
                    <motion.h1
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-6 -skew-x-6"
                    >
                        <span className="block text-white">RIDE</span>
                        <span className="block text-orange-500 text-7xl">FASTER</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-zinc-400 mb-12 italic"
                    >
                        India&apos;s fastest motorcycle marketplace
                    </motion.p>

                    {/* Speed Stats */}
                    <div className="flex justify-center gap-4 mb-12">
                        {[
                            { value: '380+', label: 'BIKES', icon: Gauge },
                            { value: '4H', label: 'DELIVERY', icon: TrendingUp },
                            { value: '₹12K', label: 'SAVINGS', icon: Zap }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="flex-1 p-4 bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/30 -skew-x-6 backdrop-blur-sm"
                            >
                                <stat.icon size={20} className="text-orange-500 mx-auto mb-2 skew-x-6" />
                                <p className="text-2xl font-black skew-x-6">{stat.value}</p>
                                <p className="text-[8px] text-zinc-500 uppercase tracking-widest skew-x-6">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <Link
                        href="/m/store/catalog"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-orange-500 text-black font-black text-xs uppercase tracking-widest -skew-x-6 hover:scale-105 transition-transform active:scale-95 shadow-[0_10px_40px_rgba(249,115,22,0.4)]"
                    >
                        <span className="skew-x-6">ACCELERATE NOW</span>
                        <ArrowRight size={18} className="skew-x-6" />
                    </Link>
                </div>

                {/* Diagonal Divider */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent transform -skew-y-3 origin-bottom-left" />
            </section>

            {/* 2. BRANDS - SPEED GRID */}
            <section className="py-24 px-8 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full" />

                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter -skew-x-6 mb-4">
                        ELITE<br />BRANDS
                    </h2>
                    <div className="h-1 w-24 bg-orange-500 -skew-x-6" />
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                    {['HONDA', 'YAMAHA', 'KTM', 'TVS', 'BAJAJ', 'SUZUKI'].map((brand, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="aspect-square border-l-4 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent flex items-center justify-center group hover:border-orange-500 transition-all -skew-x-6"
                        >
                            <span className="text-2xl font-black italic opacity-40 group-hover:opacity-100 group-hover:text-orange-500 transition-all skew-x-6">{brand}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 3. PROCESS - DIAGONAL FLOW */}
            <section className="py-24 px-8 bg-gradient-to-br from-orange-900/20 to-transparent relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(249,115,22,0.1)_49%,rgba(249,115,22,0.1)_51%,transparent_52%)] bg-[length:20px_20px]" />

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="relative z-10 mb-12"
                >
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter -skew-x-6">
                        SPEED<br />PROTOCOL
                    </h2>
                </motion.div>

                <div className="space-y-6 relative z-10">
                    {[
                        { num: '01', title: 'SELECT', desc: 'Browse 380+ bikes in real-time' },
                        { num: '02', title: 'QUOTE', desc: 'Instant pricing, zero hidden costs' },
                        { num: '03', title: 'RIDE', desc: 'Delivery in under 4 hours' }
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-6 p-6 border-l-4 border-orange-500 bg-gradient-to-r from-orange-500/20 to-transparent -skew-x-6 backdrop-blur-sm"
                        >
                            <span className="text-6xl font-black text-orange-500/20 skew-x-6">{step.num}</span>
                            <div className="skew-x-6">
                                <h3 className="text-3xl font-black italic mb-1">{step.title}</h3>
                                <p className="text-sm text-zinc-400">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 4. CATEGORIES - MOTION CARDS */}
            <section className="py-24 px-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mb-12"
                >
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter -skew-x-6 mb-4">
                        CHOOSE<br />YOUR<br />SPEED
                    </h2>
                </motion.div>

                <div className="space-y-6">
                    {[
                        { title: 'SCOOTERS', speed: '60 KM/H', color: 'from-blue-500' },
                        { title: 'MOTORCYCLES', speed: '180 KM/H', color: 'from-orange-500' },
                        { title: 'MOPEDS', speed: '45 KM/H', color: 'from-green-500' }
                    ].map((cat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onMouseEnter={() => setActiveCategory(i)}
                            className="relative group"
                        >
                            <Link
                                href={`/m/store/catalog?cat=${cat.title.toLowerCase()}`}
                                className="block p-8 border-l-4 border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-transparent group-hover:border-orange-500 transition-all -skew-x-6"
                            >
                                <div className="flex items-center justify-between skew-x-6">
                                    <div>
                                        <h3 className="text-4xl font-black italic mb-2">{cat.title}</h3>
                                        <p className="text-sm text-zinc-500">Max Speed: {cat.speed}</p>
                                    </div>
                                    <ArrowRight size={32} className="text-orange-500 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </Link>

                            {/* Motion Trail */}
                            {activeCategory === i && (
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    className={`absolute inset-y-0 left-0 w-full bg-gradient-to-r ${cat.color} to-transparent opacity-20 -skew-x-6 origin-left`}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 5. FOOTER */}
            <MobileFooter />
        </div>
    );
};
