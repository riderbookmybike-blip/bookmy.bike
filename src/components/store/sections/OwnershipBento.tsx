'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Target, Cpu } from 'lucide-react';

export function OwnershipBento() {
    return (
        <section
            id="ownership-bento"
            className="relative min-h-screen ebook-section bg-[#0b0d10] flex flex-col items-center justify-center py-24 overflow-hidden"
        >
            {/* VIBRANT ATMOSPHERIC BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/40 via-[#0b0d10] to-black" />

                {/* Aurora Glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[70%] bg-[radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.15),transparent_70%)]" />

                {/* Grainy Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
            </div>

            <div className="page-container relative z-10">
                <div className="flex flex-col items-center text-center mb-20 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                    >
                        <div className="h-px w-6 bg-zinc-800" />
                        <h2 className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">
                            The Architecture
                        </h2>
                        <div className="h-px w-6 bg-zinc-800" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none text-white"
                    >
                        REDEFINING <span className="text-zinc-500">OWNERSHIP.</span>
                    </motion.h1>
                </div>

                {/* BENTO GRID */}
                <div className="grid grid-cols-12 gap-6 auto-rows-[280px] md:auto-rows-[340px]">
                    {/* 1. IMMERSIVE CONFIGURATOR (Large) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="col-span-12 md:col-span-8 row-span-2 relative group overflow-hidden rounded-[3rem] bg-zinc-900/40 backdrop-blur-3xl border border-white/5 hover:border-white/10 transition-all duration-700"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-black to-zinc-950/50" />
                        <div className="absolute inset-0 p-12 flex flex-col justify-between z-10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[#F4B000] animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F4B000]">
                                        Neural Configurator
                                    </span>
                                </div>
                                <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-[0.9]">
                                    THE DIGITAL
                                    <br />
                                    TWIN.
                                </h3>
                            </div>
                            <p className="text-zinc-400 text-base font-medium leading-relaxed max-w-sm">
                                Every bike in our catalog is mapped with 0.1mm precision.{' '}
                                <span className="text-white">View every weld, verify every spec.</span>
                            </p>
                        </div>

                        {/* Visual Ornament - Wireframe Restored */}
                        <div className="absolute right-[-10%] bottom-[-10%] w-[80%] h-[80%] opacity-20 group-hover:opacity-40 transition-all duration-1000 grayscale group-hover:grayscale-0 pointer-events-none">
                            <img
                                src="/images/templates/bike_frame_wireframe.png"
                                alt="Wireframe"
                                className="w-full h-full object-contain filter invert opacity-30"
                                onError={e => (e.currentTarget.style.display = 'none')}
                            />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,176,0,0.15),transparent_70%)]" />
                        </div>
                    </motion.div>

                    {/* 2. REGIONAL INVENTORY (Small Square) */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="col-span-12 md:col-span-4 relative group overflow-hidden rounded-[3rem] bg-indigo-950/20 backdrop-blur-3xl border border-white/5 hover:border-[#F4B000]/30 transition-all duration-500 p-12 flex flex-col justify-between"
                    >
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#F4B000]/10 flex items-center justify-center text-[#F4B000]">
                                <Zap size={24} fill="currentColor" />
                            </div>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">
                                INSTANT
                                <br />
                                ALLOCATION.
                            </h3>
                        </div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] leading-loose">
                            Zero Delay Logistics Hubs
                        </p>
                    </motion.div>

                    {/* 3. ALGORITHMIC FINANCE (Long Vertical) */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="col-span-12 md:col-span-4 relative group overflow-hidden rounded-[3rem] bg-emerald-950/20 backdrop-blur-3xl border border-white/5 hover:border-emerald-500/30 transition-all duration-500 p-12 flex flex-col justify-between"
                    >
                        <div className="space-y-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Target size={24} />
                            </div>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">
                                ZERO OPACITY
                                <br />
                                FINANCE.
                            </h3>
                            <div className="space-y-3 pt-2">
                                <div className="h-1.5 bg-white/5 w-full rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: '85%' }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                    <span>Approval Confidence</span>
                                    <span className="text-emerald-500">85% (High)</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                            Secured via sovereign banking partnerships.
                        </p>
                    </motion.div>

                    {/* 4. SHIELD / PROTECTION (Small Square) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="col-span-12 md:col-span-4 relative group overflow-hidden rounded-[3rem] bg-zinc-900/30 backdrop-blur-3xl border border-white/5 p-12 flex flex-col justify-between"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400">
                            <Shield size={24} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Active Shield
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] leading-relaxed">
                                Complete Ownership Protection
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
