'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Shield,
    Zap,
    ArrowRight,
    Search,
    Menu,
    Activity,
    PenTool,
    Truck,
    CreditCard,
    Target,
    Terminal,
    Clock,
    ExternalLink,
    Bike,
    Zap as Electric
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { AumsLandingHeader as LandingHeader } from '@/components/layout/AumsLandingHeader';
import { AumsFooter as LandingFooter } from '@/components/layout/AumsFooter';

const ORANGE = "var(--brand-primary)";

export default function IndustrialLanding() {
    const [isMounted, setIsMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 500]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/store/catalog?search=${encodeURIComponent(searchQuery)}`);
        } else {
            router.push('/store/catalog');
        }
    };

    if (!isMounted) return null;

    const categories = [
        { id: 'SCOOTER', name: 'Scooters', icon: Bike, count: '2.5k+' },
        { id: 'MOTORCYCLE', name: 'Motorcycles', icon: Bike, count: '3.2k+' },
        { id: 'ELECTRIC', name: 'Electric', icon: Electric, count: '800+' },
        { id: 'SPORTS', name: 'Sports', icon: Zap, count: '450+' }
    ];

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-[#E0E0E0] font-mono selection:bg-[#FF5F1F] selection:text-black overflow-x-hidden">

            {/* Header */}
            <LandingHeader />

            {/* Hero */}
            <section className="relative h-screen flex flex-col items-center justify-center pt-20 overflow-hidden border-x-[20px] border-slate-200 dark:border-[#1A1A1A]">
                <motion.div style={{ y: yHero, opacity: opacityHero }} className="absolute inset-0 z-0">
                    <Image
                        src="/images/landing/industrial.png"
                        alt="Industrial Machine"
                        fill
                        className="object-cover saturate-0 opacity-40 contrast-125 scale-110"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent" />
                </motion.div>

                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-12 left-12 grid grid-cols-2 gap-x-24 gap-y-2 opacity-30 text-[9px] uppercase">
                        <div>REF_ID: BMB-2025-IND</div>
                        <div>STATUS: LOADED</div>
                        <div>CHASSIS: HARDENED_STEEL</div>
                        <div>LOC: SECTOR_PRIMARY</div>
                    </div>
                    <div className="absolute bottom-12 right-12 text-[9px] opacity-30 text-right uppercase">
                        SCAN_COMPLETE... 100%<br />
                        BUFFER: STABLE<br />
                        CORE: OPTIMIZED
                    </div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>

                <div className="relative z-20 w-full max-w-7xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-px bg-[#FF5F1F]" />
                            <div className="text-[10px] font-black text-[#FF5F1F] tracking-[0.5em] uppercase">Grid_System_Active</div>
                        </div>
                        <h1 className="text-7xl md:text-[12rem] font-black uppercase tracking-tighter leading-[0.8] mb-12 text-white">
                            RAW <br /> <span className="text-[#FF5F1F]">MTRL.</span>
                        </h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
                            <div className="space-y-6">
                                <p className="text-[#888] text-sm md:text-xl uppercase leading-relaxed max-w-lg">
                                    Utility over aesthetics. Precision over polish. Browse 500k+ verified machines built for the relentless pursuit of function and freedom.
                                </p>
                                <div className="flex items-center gap-8 text-[10px] text-white/30 uppercase font-bold tracking-widest">
                                    <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> 24/7 Support</span>
                                    <span className="flex items-center gap-2"><Target className="w-3 h-3" /> Pan India</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <form onSubmit={handleSearch} className="relative group">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search bikes..."
                                        className="w-full h-16 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 px-6 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 uppercase tracking-widest text-sm focus:outline-none focus:border-[#FF5F1F] transition-colors"
                                    />
                                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#FF5F1F] flex items-center justify-center hover:bg-white transition-colors">
                                        <Search className="w-5 h-5 text-black" />
                                    </button>
                                </form>
                                <Link href="/store/catalog" className="group relative w-full h-20 bg-[#FF5F1F] text-black font-black uppercase tracking-[0.3em] overflow-hidden flex items-center justify-center">
                                    <span className="relative z-10 flex items-center gap-4">
                                        Browse_All_Inventory <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                                </Link>
                                <div className="flex justify-between text-[10px] text-white/20 uppercase font-bold px-1">
                                    <span>Ver: 2025.1A</span>
                                    <span>Verified: ✓</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ... other sections ... */}
            {/* Standard Footer */}
            <LandingFooter />

            <div className="fixed inset-0 pointer-events-none z-50">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-slate-200 dark:bg-white/5" />
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-slate-200 dark:bg-white/5" />
            </div>

        </div>
    );
}
