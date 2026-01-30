'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, ChevronRight, Activity, ArrowRight, Star, ShieldCheck, Gauge, Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileFooter } from '../layout/MobileFooter';

export const MobileHomeOptionI = () => {
    const [activeStep, setActiveStep] = useState(0);

    return (
        <div className="bg-[#000] text-white min-h-screen selection:bg-orange-500/30">
            {/* 1. VELOCITY HERO */}
            <section className="relative h-[85vh] w-full overflow-hidden flex flex-col justify-center px-10">
                {/* Diagonal Background Split */}
                <div className="absolute inset-0 skew-y-12 translate-y-[-10%] bg-zinc-900 border-b-2 border-orange-500/50 z-0" />

                <div className="relative z-10">
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="mb-6 flex items-center gap-4"
                    >
                        <Zap className="text-orange-500 fill-orange-500" size={42} />
                        <div className="h-[2px] w-20 bg-orange-500/20" />
                    </motion.div>

                    <motion.h1
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[clamp(4.5rem,15vw,6.5rem)] font-black italic tracking-tighter uppercase leading-[0.75] mb-12"
                    >
                        FAST<br />FORWARD<span className="text-orange-500">.</span>
                    </motion.h1>

                    <div className="flex items-center gap-8 mb-16 px-2">
                        <Link href="/m/store/catalog" className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center active:scale-90 transition-transform shadow-[0_15px_40px_rgba(255,153,51,0.4)]">
                            <ArrowRight size={32} className="text-black" />
                        </Link>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-1">INITIALIZE_FLOW</p>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none italic">Sourcing Status: ACTIVE</p>
                        </div>
                    </div>
                </div>

                {/* Floating Machine */}
                <div className="absolute bottom-[-5%] right-[-25%] w-[110%] h-1/2 z-20 pointer-events-none">
                    <Image src="/images/categories/motorcycle_nobg.png" alt="Bike" fill className="object-contain drop-shadow-[0_45px_100px_rgba(0,0,0,0.8)]" />
                </div>
            </section>

            {/* 2. RAPID STATS */}
            <section className="relative z-30 grid grid-cols-2 gap-px bg-white/5 border-y border-white/5 -mt-16 px-10 bg-black">
                <div className="py-16 flex flex-col items-start bg-black group overflow-hidden">
                    <Activity className="text-orange-500 mb-6 group-hover:scale-110 transition-transform" size={32} />
                    <h3 className="text-5xl font-black italic uppercase tracking-tighter">4HRS</h3>
                    <p className="text-[10px] font-black text-zinc-600 tracking-[0.4em] mt-3 uppercase">SYNC_LATENCY</p>
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 group-hover:bg-orange-500 transition-colors" />
                </div>
                <div className="p-16 border-l border-white/5 flex flex-col items-start translate-y-8 bg-zinc-950 group overflow-hidden shadow-2xl">
                    <Zap className="text-orange-500 mb-6 group-hover:animate-pulse" size={32} />
                    <h3 className="text-5xl font-black italic uppercase tracking-tighter text-orange-500">₹12K</h3>
                    <p className="text-[10px] font-black text-zinc-600 tracking-[0.4em] mt-3 uppercase">MIN_YIELD</p>
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-orange-500/20" />
                </div>
            </section>

            {/* 3. SYNDICATE ENGINE (Elite Makers) */}
            <section className="py-24 px-10">
                <div className="mb-16">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter underline underline-offset-8 decoration-white/10">SYNDICATE_MAKERS</h3>
                </div>

                <div className="space-y-3">
                    {['HONDA', 'YAMAHA', 'KTM', 'TVS', 'BAJAJ'].map((brand, i) => (
                        <div key={i} className="group relative h-20 w-full bg-zinc-950 border border-white/5 overflow-hidden flex items-center px-10 justify-between active:bg-orange-500 transition-colors duration-500">
                            <div className="absolute right-0 top-0 h-full w-[2px] bg-white/5 group-hover:bg-black transition-colors" />
                            <span className="text-[11px] font-black text-zinc-800 group-hover:text-black">00_{i + 1}</span>
                            <h4 className="text-3xl font-black italic tracking-widest text-zinc-700 group-hover:text-black transition-colors uppercase">{brand}</h4>
                            <ChevronRight size={24} className="text-zinc-900 group-hover:text-black" />
                        </div>
                    ))}
                </div>

                <p className="text-center text-[10px] font-bold text-zinc-700 uppercase tracking-widest mt-12 italic">Authorized access required for full brand metrics.</p>
            </section>

            {/* 4. ACCELERATION_STEPS (How It Works) */}
            <section className="py-24 bg-zinc-950/20">
                <div className="px-10 mb-20">
                    <h3 className="text-5xl font-black italic tracking-tighter uppercase leading-[0.8] mb-6">RAPID<br />PROTOCOLS<span className="text-orange-500">.</span></h3>
                </div>

                <div className="px-6 space-y-4">
                    {[
                        { t: 'INDEX', sub: 'Selection', d: 'Choose from 380+ units via elite real-time sourcing.' },
                        { t: 'RESOLVE', sub: 'Quotation', d: 'Executing finance kernels to lock India&apos;s lowest EMI.' },
                        { t: 'DISPATCH', sub: 'Riding', d: '4-hour logistics cycle from finalization to handoff.' }
                    ].map((step, i) => (
                        <div
                            key={i}
                            onClick={() => setActiveStep(i)}
                            className={`p-10 transition-all duration-700 relative overflow-hidden flex flex-col ${activeStep === i ? 'bg-[#111] border-2 border-orange-500' : 'bg-[#050505] border border-white/5'}`}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`h-[1px] w-8 ${activeStep === i ? 'bg-orange-500' : 'bg-white/10'}`} />
                                <span className={`text-[11px] font-black uppercase tracking-widest ${activeStep === i ? 'text-orange-500' : 'text-zinc-700'}`}>{step.sub}</span>
                            </div>
                            <h4 className="text-5xl font-black italic tracking-tighter uppercase mb-6">{step.t}</h4>
                            <AnimatePresence>
                                {activeStep === i && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 0.6, height: 'auto' }}
                                        className="text-sm font-bold leading-relaxed uppercase pr-8 tracking-tighter"
                                    >
                                        {step.d}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                            {activeStep === i && (
                                <motion.div layoutId="vel-step" className="absolute top-0 right-0 p-8 opacity-5">
                                    <Gauge size={120} />
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. VELOCITY_STACK (Categories) */}
            <section className="py-24 px-10">
                <div className="mb-16 flex justify-between items-end">
                    <h3 className="text-3xl font-black italic tracking-tight uppercase leading-none">THE STACK</h3>
                    <Link href="/m/store/catalog" className="text-[10px] font-black text-orange-500 tracking-widest uppercase pb-1 border-b border-orange-500">VIEW_ALL</Link>
                </div>

                <div className="space-y-6">
                    {[
                        { n: 'SCOOTER', c: 'TEAL', img: '/images/categories/scooter_nobg.png', bg: 'bg-[#121c1c]' },
                        { n: 'MOTORCYCLE', c: 'ORANGE', img: '/images/categories/motorcycle_nobg.png', bg: 'bg-[#1c1612]' },
                        { n: 'MOPED', c: 'ELECTRIC', img: '/images/categories/moped_nobg.png', bg: 'bg-[#121c16]' }
                    ].map((cat, i) => (
                        <motion.div
                            key={i}
                            whileTap={{ scale: 0.98 }}
                            className={`relative h-32 w-full ${cat.bg} overflow-hidden group rounded-[2rem] border border-white/5 active:border-white/20`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/60 z-0" />
                            <div className="absolute top-0 right-0 h-full w-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                                <Image src={cat.img} alt={cat.n} fill className="object-contain translate-x-12 translate-y-4" />
                            </div>
                            <div className="relative z-10 h-full flex items-center px-10 justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-white/20 block mb-1">UNIT_0{i + 1}</span>
                                    <h4 className="text-3xl font-black italic tracking-[0.2em] group-hover:tracking-widest transition-all uppercase">{cat.n}</h4>
                                </div>
                                <ChevronRight size={24} className="text-white/20 group-hover:text-orange-500 group-hover:translate-x-2 transition-all" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 6. VERIFIED_LOGS (Reviews) */}
            <section className="py-24 px-10 border-y border-white/5 bg-zinc-950/20">
                <div className="mb-16">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">VERIFIED_LOGS</h3>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide px-2">
                    {[
                        { n: 'ADITYA_S', b: 'DUKE_390', txt: 'SEAMLESS EXPERIENCE. SOURCED PERFECT UNIT IN 4H.' },
                        { n: 'MEHUL_R', b: 'TVS_RONIN', txt: 'LOWEST EMI GUARANTEE. SAVED ₹14K TODAY.' }
                    ].map((rev, i) => (
                        <div key={i} className="flex-shrink-0 w-[78vw] p-12 bg-black border border-white/5 relative flex flex-col justify-between group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Star size={80} className="fill-orange-500" />
                            </div>
                            <p className="text-xl font-black italic tracking-tighter leading-[1.1] mb-12 uppercase group-hover:text-orange-500 transition-colors">&quot;{rev.txt}&quot;</p>
                            <div>
                                <p className="text-lg font-black italic uppercase tracking-tight">{rev.n}</p>
                                <p className="text-[10px] font-black text-orange-500 tracking-[0.3em] uppercase mt-1">{rev.b}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 7. ACCELERATED_ACCESS (Elite Circle) */}
            <section className="py-24 px-10">
                <div className="p-16 border-2 border-orange-500 rounded-[4rem] text-center bg-zinc-950 overflow-hidden relative group active:scale-[0.98] transition-transform">
                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-orange-500/5 rotate-12 blur-[100px] group-hover:scale-110 transition-transform duration-1000" />
                    <p className="relative z-10 text-[10px] font-black text-orange-500 tracking-[0.8em] mb-8 uppercase">THE CIRCLE</p>
                    <h3 className="relative z-10 text-4xl font-black italic tracking-tighter uppercase mb-6 leading-none">INITIALIZE_FULL_QUICK_QUOTE</h3>
                    <p className="relative z-10 text-zinc-600 text-[11px] font-bold leading-relaxed max-w-[200px] mx-auto uppercase italic mb-12">5,000+ RIDER_INDEXED_SESSIONS_READY.</p>
                    <button className="relative z-10 w-full py-6 bg-orange-500 text-black font-black uppercase text-[11px] tracking-[0.5em] rounded-2xl shadow-[0_20px_50px_rgba(255,95,31,0.3)]">
                        START_FLOW_X
                    </button>
                </div>
            </section>

            {/* 8. FOOTER */}
            <MobileFooter />
        </div>
    );
};
