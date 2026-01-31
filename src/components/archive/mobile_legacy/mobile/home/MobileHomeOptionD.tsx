'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Cpu, Database, Shield, ChevronRight, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileFooter } from '../layout/MobileFooter';
import { MobileHeader } from '../layout/MobileHeader';

export const MobileHomeOptionD = () => {
    const [bootComplete, setBootComplete] = useState(false);

    React.useEffect(() => {
        setTimeout(() => setBootComplete(true), 2000);
    }, []);

    return (
        <div className="bg-black text-green-400 min-h-screen selection:bg-green-500/30 font-mono">
            <MobileHeader />
            {/* 1. BOOT SEQUENCE HERO */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden border-b border-green-500/20 pt-16">
                {/* Blueprint Grid Background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff00_1px,transparent_1px),linear-gradient(to_bottom,#00ff00_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>

                {/* Scanning Lines */}
                <motion.div
                    animate={{ y: ['0%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"
                />

                <div className="relative z-10 px-6 text-center w-full">
                    {/* Boot Header */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-8 space-y-2"
                    >
                        <div className="flex items-center justify-center gap-2 text-xs">
                            <Terminal size={12} />
                            <span>SYSTEM_BOOT_v2.6.4</span>
                        </div>
                        <div className="flex justify-center gap-1">
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                                    className="w-2 h-2 border border-green-500"
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Main Title */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4 mb-12"
                    >
                        <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">
                            PROTOCOL_X
                            <br />
                            <span className="text-green-500">MARKETPLACE</span>
                        </h1>
                        <p className="text-xs text-green-500/60 tracking-[0.3em]">
                            [INDIA&apos;S LOWEST EMI GUARANTEE]
                        </p>
                    </motion.div>

                    {/* System Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-12">
                        {[
                            { label: 'SKU_LIVE', value: '380+', icon: Database },
                            { label: 'SYNC_TIME', value: '4H', icon: Cpu },
                            { label: 'SAVINGS', value: '₹12K', icon: Shield },
                            { label: 'SECURITY', value: '256BIT', icon: Lock }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="p-4 border border-green-500/30 bg-green-500/5 backdrop-blur-sm"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon size={16} className="text-green-500" />
                                    <span className="text-[8px] text-green-500/60">[{String(i + 1).padStart(2, '0')}]</span>
                                </div>
                                <p className="text-2xl font-black mb-1">{stat.value}</p>
                                <p className="text-[8px] text-green-500/60 tracking-widest">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <Link
                        href="/m/store/catalog"
                        className="inline-flex items-center gap-3 px-8 py-4 border-2 border-green-500 bg-green-500/10 text-green-500 font-black text-xs uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all"
                    >
                        <Terminal size={16} />
                        INITIALIZE_SYSTEM
                        <ChevronRight size={16} />
                    </Link>

                    {/* Terminal Footer */}
                    <div className="mt-12 text-[8px] text-green-500/40 space-y-1">
                        <p>&gt; SECURE_LINK: [ENABLED]</p>
                        <p>&gt; ENCRYPTION: [AES-256]</p>
                        <p>&gt; STATUS: [READY]</p>
                    </div>
                </div>
            </section>

            {/* 2. BRAND MATRIX */}
            <section className="py-16 px-6 border-b border-green-500/20">
                <div className="mb-8">
                    <p className="text-[10px] text-green-500/60 tracking-[0.3em] mb-2">[AUTHORIZED_MANUFACTURERS]</p>
                    <h2 className="text-3xl font-black uppercase">BRAND_MATRIX</h2>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {['HONDA', 'YAMAHA', 'KTM', 'TVS', 'BAJAJ', 'SUZUKI'].map((brand, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="aspect-square border border-green-500/30 bg-green-500/5 flex items-center justify-center group hover:bg-green-500/20 transition-all"
                        >
                            <span className="text-xs font-black opacity-60 group-hover:opacity-100">{brand}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 3. PROTOCOL STEPS */}
            <section className="py-16 px-6 border-b border-green-500/20">
                <div className="mb-8">
                    <p className="text-[10px] text-green-500/60 tracking-[0.3em] mb-2">[EXECUTION_PROTOCOL]</p>
                    <h2 className="text-3xl font-black uppercase">PROCESS_FLOW</h2>
                </div>

                <div className="space-y-4">
                    {[
                        { step: '01', title: 'SELECTION', desc: 'Direct access to regional hubs. 3.8k+ units ready.' },
                        { step: '02', title: 'QUOTATION', desc: 'Zero opacity. Instant on-road valuation.' },
                        { step: '03', title: 'DELIVERY', desc: 'Digital execution. Asset handover in 4 hours.' }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="border border-green-500/30 bg-green-500/5 p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <span className="text-[10px] text-green-500/60">[STEP_{item.step}]</span>
                                <ChevronRight size={16} className="text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black mb-2">{item.title}</h3>
                            <p className="text-xs text-green-500/60 leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 4. CATEGORIES */}
            <section className="py-16 px-6 border-b border-green-500/20">
                <div className="mb-8">
                    <p className="text-[10px] text-green-500/60 tracking-[0.3em] mb-2">[VEHICLE_CLASSES]</p>
                    <h2 className="text-3xl font-black uppercase">SELECT_TYPE</h2>
                </div>

                <div className="space-y-4">
                    {[
                        { title: 'SCOOTERS', code: 'SC_001' },
                        { title: 'MOTORCYCLES', code: 'MC_001' },
                        { title: 'MOPEDS', code: 'MP_001' }
                    ].map((cat, i) => (
                        <Link
                            key={i}
                            href={`/m/store/catalog?cat=${cat.title.toLowerCase()}`}
                            className="block border border-green-500/30 bg-green-500/5 p-8 hover:bg-green-500/20 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] text-green-500/60 mb-2">[{cat.code}]</p>
                                    <h3 className="text-2xl font-black">{cat.title}</h3>
                                </div>
                                <ChevronRight size={24} className="text-green-500 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 5. FOOTER */}
            <MobileFooter />
        </div>
    );
};
