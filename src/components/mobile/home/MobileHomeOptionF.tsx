'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Circle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileFooter } from '../layout/MobileFooter';
import { MobileHeader } from '../layout/MobileHeader';

export const MobileHomeOptionF = () => {
    return (
        <div className="bg-zinc-50 text-black min-h-screen selection:bg-black selection:text-white">
            <MobileHeader />
            {/* 1. EDITORIAL HERO */}
            <section className="min-h-screen flex flex-col justify-between px-8 py-20 pt-36">
                {/* Top Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <div className="w-1 h-1 bg-black rounded-full" />
                    <span className="text-[10px] uppercase tracking-[0.4em] font-light">India&apos;s Finest</span>
                </motion.div>

                {/* Center Content */}
                <div className="space-y-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-7xl font-light leading-[0.9] tracking-tight"
                    >
                        The Art
                        <br />
                        of
                        <br />
                        <span className="font-serif italic">Riding</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-start gap-8"
                    >
                        <div className="w-px h-32 bg-black/20" />
                        <div className="flex-1 space-y-6">
                            <p className="text-sm leading-relaxed text-zinc-600 max-w-xs">
                                Curated collection of premium motorcycles. Transparent pricing. Seamless delivery.
                            </p>
                            <Link
                                href="/m/store/catalog"
                                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] border-b border-black pb-1 hover:opacity-60 transition-opacity"
                            >
                                Explore Collection
                                <ArrowUpRight size={14} />
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-between text-xs uppercase tracking-[0.3em]"
                >
                    <div>
                        <p className="text-zinc-400 mb-1">Inventory</p>
                        <p className="font-light">380+</p>
                    </div>
                    <div>
                        <p className="text-zinc-400 mb-1">Delivery</p>
                        <p className="font-light">4 Hours</p>
                    </div>
                    <div>
                        <p className="text-zinc-400 mb-1">Savings</p>
                        <p className="font-light">₹12K</p>
                    </div>
                </motion.div>
            </section>

            {/* 2. FEATURED IMAGE */}
            <section className="px-8 py-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative aspect-[3/4] bg-zinc-200 overflow-hidden"
                >
                    <Image
                        src="/images/templates/t3_night.png"
                        alt="Featured"
                        fill
                        className="object-cover grayscale"
                    />
                    <div className="absolute bottom-8 left-8 right-8">
                        <div className="bg-white/90 backdrop-blur-sm p-6">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-2">Featured</p>
                            <h3 className="text-2xl font-light mb-4">Premium Selection</h3>
                            <Link
                                href="/m/store/catalog"
                                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] border-b border-black pb-1"
                            >
                                View All
                                <ArrowUpRight size={12} />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 3. BRANDS - MINIMAL GRID */}
            <section className="px-8 py-20 border-t border-black/10">
                <div className="mb-16">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 mb-4">Our Partners</p>
                    <h2 className="text-5xl font-light">Elite Makers</h2>
                </div>

                <div className="grid grid-cols-2 gap-px bg-black/10">
                    {['Honda', 'Yamaha', 'KTM', 'TVS', 'Bajaj', 'Suzuki'].map((brand, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="aspect-square bg-zinc-50 flex items-center justify-center hover:bg-black hover:text-white transition-all group"
                        >
                            <span className="text-sm font-light tracking-wider">{brand}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 4. PROCESS - EDITORIAL LAYOUT */}
            <section className="px-8 py-20 border-t border-black/10">
                <div className="mb-16">
                    <h2 className="text-5xl font-light mb-8">How it Works</h2>
                    <div className="w-12 h-px bg-black" />
                </div>

                <div className="space-y-12">
                    {[
                        {
                            num: '01',
                            title: 'Selection',
                            desc: 'Browse our curated collection of premium motorcycles. Each vehicle is hand-selected for quality and performance.'
                        },
                        {
                            num: '02',
                            title: 'Quotation',
                            desc: 'Receive transparent, on-road pricing with no hidden costs. Our guarantee ensures the lowest EMI in India.'
                        },
                        {
                            num: '03',
                            title: 'Delivery',
                            desc: 'Digital documentation and rapid deployment. Your motorcycle arrives within 4 hours of confirmation.'
                        }
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-8"
                        >
                            <span className="text-6xl font-light text-zinc-200">{step.num}</span>
                            <div className="flex-1 pt-2">
                                <h3 className="text-2xl font-light mb-4">{step.title}</h3>
                                <p className="text-sm leading-relaxed text-zinc-600">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 5. CATEGORIES - CLEAN CARDS */}
            <section className="px-8 py-20 border-t border-black/10">
                <div className="mb-16">
                    <h2 className="text-5xl font-light">Collections</h2>
                </div>

                <div className="space-y-6">
                    {[
                        { title: 'Scooters', count: '120+', desc: 'Urban mobility redefined' },
                        { title: 'Motorcycles', count: '200+', desc: 'Performance and prestige' },
                        { title: 'Mopeds', count: '60+', desc: 'Efficient commuting' }
                    ].map((cat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link
                                href={`/m/store/catalog?cat=${cat.title.toLowerCase()}`}
                                className="block p-8 border border-black/10 hover:border-black transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-3xl font-light mb-2">{cat.title}</h3>
                                        <p className="text-xs text-zinc-500 uppercase tracking-[0.3em]">{cat.count} Models</p>
                                    </div>
                                    <ArrowUpRight size={24} className="text-zinc-400 group-hover:text-black transition-colors" />
                                </div>
                                <p className="text-sm text-zinc-600">{cat.desc}</p>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 6. TESTIMONIAL */}
            <section className="px-8 py-32 border-t border-black/10">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="max-w-2xl"
                >
                    <Circle size={40} className="text-zinc-200 mb-8" />
                    <blockquote className="text-3xl font-light leading-relaxed mb-8">
                        "The most refined motorcycle buying experience in India. Transparent, efficient, and truly premium."
                    </blockquote>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                        <div>
                            <p className="font-light">Arjun Kapoor</p>
                            <p className="text-xs text-zinc-500">Mumbai</p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 7. FOOTER */}
            <div className="border-t border-black/10">
                <MobileFooter />
            </div>
        </div>
    );
};
