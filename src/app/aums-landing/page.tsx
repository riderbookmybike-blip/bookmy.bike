'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, BarChart3, Database, Globe, Lock, Play, Shield, Terminal, Zap } from 'lucide-react';
import { AumsHeader } from '@/components/layout/AumsHeader';
import { AumsFooter } from '@/components/layout/AumsFooter';
const LoginSidebar = dynamic(() => import('@/components/auth/LoginSidebar'), { ssr: false });

export default function AumsLandingPage() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans">
            <AumsHeader onLoginClick={() => setIsLoginOpen(true)} />

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 md:pt-60 md:pb-32 overflow-hidden">
                {/* Immersive Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none opacity-30" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f2e_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
                </div>

                <div className="page-container relative z-10">
                    <div className="flex flex-col items-center text-center space-y-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/30 border border-indigo-500/30 rounded-full mb-4 backdrop-blur-md">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black italic text-indigo-400 uppercase tracking-widest">
                                Protocol v2.4.0 Live
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
                            The Operating System <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-slate-400">
                                For Auto Retail
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-medium leading-relaxed">
                            A unified terminal for OEMs, Dealerships, and Banks. <br className="hidden md:block" />
                            Real-time inventory, instant financing, and automated compliance.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-100 text-black hover:bg-slate-200 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                            >
                                Request Access <ArrowRight size={18} />
                            </button>
                            <button className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-3">
                                <Play size={18} /> Watch Demo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Data Ticker Visualization */}
                <div className="mt-24 page-container border-y border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden whitespace-nowrap py-3">
                    <div className="inline-flex animate-marquee gap-12 text-xs font-mono text-slate-400">
                        {[
                            'BMB-IDX +2.4%',
                            'RE-SALES 14,203',
                            'HND-STOCK 892',
                            'CREDIT-VOL ₹12.4Cr',
                            'ACTIVE-DEALERS 542',
                            'TVS-REQ +12%',
                            'LOAN-APR 45s',
                            'KA-RTO ONLINE',
                            'MH-RTO ONLINE',
                        ].map((item, i) => (
                            <span key={i} className="flex items-center gap-2">
                                <span className={item.includes('+') ? 'text-emerald-500' : 'text-indigo-500'}>●</span>{' '}
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-24 bg-slate-950/30 border-t border-white/5">
                <div className="page-container grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Database className="text-indigo-500" />}
                        title="Unified Inventory"
                        desc="Sync stock across all showrooms in real-time. Eliminate dead stock and optimize clearance."
                    />
                    <FeatureCard
                        icon={<Zap className="text-amber-500" />}
                        title="Instant Financing"
                        desc="Integrated with 15+ banks. Paperless loan processing with 45-second approval turnarounds."
                    />
                    <FeatureCard
                        icon={<BarChart3 className="text-emerald-500" />}
                        title="Predictive Analytics"
                        desc="Forecast demand, track sales team performance, and visualize market trends instantly."
                    />
                </div>
            </section>

            {/* Terminal Interface Preview */}
            <section className="py-32">
                <div className="page-container">
                    <div className="rounded-xl border border-white/10 bg-[#0c0c0c] shadow-2xl overflow-hidden">
                        <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                            </div>
                            <div className="ml-4 text-[10px] font-mono text-slate-500">
                                bmb_terminal_v2 — -zsh — 80x24
                            </div>
                        </div>
                        <div className="p-8 font-mono text-sm md:text-base space-y-4">
                            <div className="flex gap-4">
                                <span className="text-emerald-500">➜</span>
                                <span className="text-blue-400">~</span>
                                <span className="text-slate-300">initiate_protocol --dealership=HONDA_DEL_SOUTH</span>
                            </div>
                            <div className="text-slate-500 pl-8">
                                <p>[INFO] Connecting to secure gateway...</p>
                                <p>[INFO] Verifying credentials...</p>
                                <p>[SUCCESS] Connection established (12ms)</p>
                                <p>[DATA] Loading inventory stats...</p>
                            </div>
                            <div className="pl-8 grid grid-cols-2 md:grid-cols-4 gap-8 py-4 border-l-2 border-slate-800 ml-1">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase">Total Units</p>
                                    <p className="text-xl text-white font-bold">142</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase">Pending Orders</p>
                                    <p className="text-xl text-amber-500 font-bold">8</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase">Revenue (MTD)</p>
                                    <p className="text-xl text-emerald-500 font-bold">₹2.4Cr</p>
                                </div>
                            </div>
                            <div className="flex gap-4 animate-pulse">
                                <span className="text-emerald-500">➜</span>
                                <span className="text-blue-400">~</span>
                                <span className="text-white">_</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <AumsFooter />

            <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="TERMINAL" />
        </div>
    );
}

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
        <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform border border-white/10">
            {icon}
        </div>
        <h3 className="text-lg font-black uppercase tracking-wider text-white mb-3">{title}</h3>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
);
