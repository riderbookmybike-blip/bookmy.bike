'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Twitter, Instagram, Facebook, Youtube, Shield, Zap, Globe } from 'lucide-react';

export const BladeFooter = () => {
    return (
        <footer className="bg-black border-t border-white/5 pt-24 pb-12 overflow-hidden relative">
            {/* Background Massive Text */}
            <div className="absolute top-0 right-0 opacity-[0.02] pointer-events-none select-none overflow-hidden">
                <span className="text-[30rem] font-black italic tracking-tighter uppercase whitespace-nowrap leading-none">
                    WEAPONRY
                </span>
            </div>

            <div className="max-w-[1800px] mx-auto px-6 md:px-12 relative z-10">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-24 items-start mb-24">

                    {/* Brand Section */}
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <Logo mode="dark" size={48} variant="full" />
                            <p className="text-xl font-black italic tracking-tighter uppercase text-white/40 max-w-md">
                                Precision Engineering. Tactical Finance. <br />
                                <span className="text-[#F4B000]">The Blade Protocol.</span>
                            </p>
                        </div>

                        <div className="flex gap-6">
                            {[Twitter, Instagram, Facebook, Youtube].map((Icon, i) => (
                                <a key={i} href="#" className="w-12 h-12 border border-white/10 flex items-center justify-center hover:bg-[#F4B000] hover:text-black transition-all skew-x-[-15deg]">
                                    <Icon size={18} className="skew-x-[15deg]" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12 pt-4">
                        <div className="space-y-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4B000] italic">Arsenal</h4>
                            <ul className="space-y-4">
                                {['Catalog', 'Showroom', 'Comparison', 'Fleet'].map(item => (
                                    <li key={item}>
                                        <Link href="#" className="text-xs font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors italic">{item}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4B000] italic">Protocol</h4>
                            <ul className="space-y-4">
                                {['Privacy', 'Standard', 'Licensing', 'Secure'].map(item => (
                                    <li key={item}>
                                        <Link href="#" className="text-xs font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors italic">{item}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="hidden md:block space-y-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4B000] italic">HQ</h4>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic leading-relaxed">
                                    Sector 7, Tactical Hub <br />
                                    New Delhi, IN 110001
                                </p>
                                <div className="flex items-center gap-2 text-[#F4B000]">
                                    <Globe size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Presence</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 skew-x-[-10deg]">
                            <Shield size={12} className="text-[#F4B000] skew-x-[10deg]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 skew-x-[10deg]">Encrypted SSL</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 skew-x-[-10deg]">
                            <Zap size={12} className="text-[#F4B000] skew-x-[10deg]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 skew-x-[10deg]">Flash Sync</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 italic">
                        © 2026 BOOKMY.BIKE | ALL OPERATIONAL RIGHTS RESERVED.
                    </p>
                </div>
            </div>
        </footer>
    );
};
