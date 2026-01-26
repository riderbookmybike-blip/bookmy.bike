'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

import Image from 'next/image';
import { ArrowRight, Search, Zap, MapPin } from 'lucide-react';
import { CATEGORIES, MARKET_METRICS } from '@/config/market';
import { useState } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { useBrands } from '@/hooks/useBrands';
import { RiderPulse } from '@/components/store/RiderPulse';
import { Footer } from './Footer';

interface StoreDesktopProps {
    variant?: 'default' | 'tv';
}

export function MasterLayout({ variant: _variant = 'default' }: StoreDesktopProps) {
    const { items, skuCount } = useCatalog();
    const { brands } = useBrands();
    const totalSkus = skuCount || items.length || 500; // Fallback to 500 if loading or empty
    const isTv = false; // TV logic moved to dedicated StoreTV component


    // Hero Template: Night City (Chosen by User)
    const heroImage = '/images/templates/t3_night.png';

    const containerRef = React.useRef<HTMLDivElement>(null);
    const [activeSection, setActiveSection] = React.useState(0);
    const [isScrolling, setIsScrolling] = React.useState(false);

    // Brands Section Visual Hooks
    const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);
    const [drumRotation, setDrumRotation] = useState(0);
    const [isSnapping, setIsSnapping] = useState(false);

    // Brands Drum Animation Loop (State-driven)
    React.useEffect(() => {
        let rafId: number;
        let lastTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const delta = now - lastTime;
            lastTime = now;

            if (!hoveredBrand && !isSnapping) {
                // Slower, consistent rotation when not hovered (approx 80s per revolution)
                setDrumRotation(prev => (prev - (delta * 0.0045)));
            }
            rafId = requestAnimationFrame(animate);
        };

        rafId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId);
    }, [hoveredBrand]);

    // Protocol Section Visual Hooks
    const [activeStep, setActiveStep] = useState<number | null>(0); // Default to 0, but user can clear it

    // Categories Section Visual Hooks
    const [activeVibe, setActiveVibe] = useState<number | null>(0); // Default to 0, but user can clear it
    const [hasMounted, setHasMounted] = useState(false);
    const [bentoHover, setBentoHover] = useState<'inventory' | 'savings' | 'dispatch' | null>('savings');




    const totalSections = 5; // Hero, Brands, How it Works, Categories, RiderPulse, Footer (integrated)

    const activeSectionRef = React.useRef(0);
    const lastScrollTime = React.useRef(0);
    const [_, forceUpdate] = React.useState(0); // For UI sync if needed

    // Strict E-Book Scroll Control (Zero Glitch Logic)
    React.useEffect(() => {
        const handleScrollTransition = (direction: number) => {
            const now = Date.now();
            if (now - lastScrollTime.current < 700) return; // 0.7s responsive lock

            const sections = document.querySelectorAll('.ebook-section');
            const nextIndex = Math.max(0, Math.min(activeSectionRef.current + direction, sections.length - 1));

            if (nextIndex !== activeSectionRef.current) {
                const targetSection = sections[nextIndex] as HTMLElement;
                if (!targetSection) return;

                activeSectionRef.current = nextIndex;
                lastScrollTime.current = now;
                setActiveSection(nextIndex);

                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });
            }
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (Math.abs(e.deltaY) < 10) return; // Lower threshold
            handleScrollTransition(e.deltaY > 0 ? 1 : -1);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
                e.preventDefault();
                handleScrollTransition(1);
            } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
                e.preventDefault();
                handleScrollTransition(-1);
            }
        };

        // Reset scroll on mount
        window.scrollTo(0, 0);

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);

        document.documentElement.classList.add('scrollbar-hide', 'overflow-y-auto');
        document.documentElement.style.scrollBehavior = 'auto';
        setHasMounted(true);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
            document.documentElement.classList.remove('scrollbar-hide', 'overflow-y-auto');
        };
    }, []);

    return (
        <div className="flex flex-col pb-0 transition-colors duration-300">
            {/* the hyper-aperture: kinetic chassis extraordinaria */}
            <section
                className="relative h-screen ebook-section overflow-hidden bg-gradient-to-br from-blue-950/40 via-black to-black isolate flex flex-col items-center justify-center p-0"
                onMouseMove={(e) => {
                    const xPct = (e.clientX / window.innerWidth) * 100;
                    const x = (e.clientX / window.innerWidth - 0.5) * 30;
                    const y = (e.clientY / window.innerHeight - 0.5) * 30;
                    document.documentElement.style.setProperty('--hyper-x', `${x}px`);
                    document.documentElement.style.setProperty('--hyper-y', `${y}px`);
                    document.documentElement.style.setProperty('--mouse-x-pct', `${xPct}%`);
                }}
            >
                {/* layer 0: immersive tunnel chassis */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {/* deep background image */}
                    <motion.div
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.4 }}
                        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 w-full h-full will-change-transform"
                        style={{
                            transform: 'translate(calc(var(--hyper-x) * -0.2), calc(var(--hyper-y) * -0.2)) scale(1.1)',
                        }}
                    >
                        <img src={heroImage} alt="Tunnel" className="w-full h-full object-cover grayscale contrast-125" />
                    </motion.div>

                    {/* aperture layer 1: mid frame */}
                    <motion.div
                        className="absolute inset-[10%] border border-white/5 rounded-[4rem] z-10 box-content"
                        style={{
                            transform: 'translate(calc(var(--hyper-x) * 0.1), calc(var(--hyper-y) * 0.1))',
                        }}
                    />

                    {/* aperture layer 2: peripheral lens flare/vignette - Simplified for consistency */}
                    <div className="absolute inset-0 bg-black/40 z-20" />

                    {/* aperture layer 3: digital scanning grid */}
                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:120px_120px] z-30 opacity-40 mix-blend-overlay"
                        style={{
                            transform: 'translate(calc(var(--hyper-x) * 0.4), calc(var(--hyper-y) * 0.4))',
                        }}
                    />

                    {/* drift elements: technical particles */}
                    <div className="absolute inset-x-[15vw] inset-y-[15vh] z-40">
                        {hasMounted && [...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: Math.random() * 100 + '%', y: Math.random() * 100 + '%', opacity: 0 }}
                                animate={{ y: [null, '-20%', '120%'], opacity: [0, 0.4, 0] }}
                                transition={{ duration: 10 + Math.random() * 20, repeat: Infinity, delay: Math.random() * 10 }}
                                className="absolute w-[1px] h-[30px] bg-brand-primary"
                            />
                        ))}
                    </div>
                </div>

                {/* THE KINETIC INTERFACE */}
                <div className="relative z-50 w-full flex flex-col items-center">

                    {/* telemetry chip: boot sequence header */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className="mb-14 md:mb-20 flex flex-col items-center mt-[12vh]"
                    >
                        <div className="flex items-center gap-6 px-10 py-2.5 bg-zinc-900/80 border border-white/10 rounded-full backdrop-blur-xl transition-all hover:border-brand-primary/50 group/tele shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative">
                            {/* Shimmer Light Effect */}
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-30deg] pointer-events-none"
                            />

                            <div className="flex gap-1.5 z-10">
                                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white group-hover/tele:text-brand-primary transition-colors font-[family-name:var(--font-bruno-ace)] z-10 relative">
                                INDIA'S LOWEST EMI GUARANTEE
                            </span>
                            <div className="flex gap-1.5 z-10">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                            </div>
                        </div>
                    </motion.div>

                    {/* LIQUID CHROME TYPOGRAPHY */}
                    <div className="relative flex flex-col items-center mb-16 select-none pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, letterSpacing: '1.2em' }}
                            animate={{ opacity: 1, letterSpacing: '0.4em' }}
                            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                            className="text-sm md:text-base font-black uppercase text-white mb-6 transition-all duration-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] font-[family-name:var(--font-bruno-ace)]"
                        >
                            The Highest Fidelity Marketplace
                        </motion.div>

                        <div className="relative group/title">
                            {/* reflective shadow layer */}
                            <motion.h1
                                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 0.1, y: 0 }} transition={{ delay: 0.4, duration: 1.5 }}
                                className="absolute -inset-2 text-7xl md:text-8xl lg:text-[clamp(4rem,12.5vw,10.5rem)] font-black uppercase text-white blur-3xl pointer-events-none opacity-20"
                                style={{
                                    backgroundPosition: 'calc(100% - var(--mouse-x-pct)) 50%'
                                }}
                            >
                                MOTORCYCLES
                            </motion.h1>

                            {/* main liquid-metal text */}
                            <motion.h1
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                className="relative text-7xl md:text-8xl lg:text-[clamp(4rem,12vw,9.5rem)] font-black italic uppercase tracking-[-0.03em] leading-none text-transparent bg-clip-text bg-[linear-gradient(110deg,#fff_0%,#fff_40%,#ff9d00_50%,#fff_60%,#fff_100%)] bg-[length:200%_100%] transition-all duration-1000 font-[family-name:var(--font-bruno-ace)]"
                                style={{
                                    textShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundPositionX: 'calc(100% - var(--mouse-x-pct))'
                                }}
                            >
                                MOTORCYCLES
                            </motion.h1>

                            {/* kinetic scan line across text */}
                            <motion.div
                                animate={{ top: ['-20%', '120%'], opacity: [0, 1, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-[30%] bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent z-10 pointer-events-none"
                            />
                        </div>
                    </div>

                    {/* TELEMETRY BENTO: kinetic accordion grid */}
                    <div className="w-full max-w-[1440px] grid grid-cols-1 md:grid-cols-4 gap-4 px-8 md:px-16 mx-auto place-items-stretch pointer-events-auto">

                        {/* block 1: inventory scanner */}
                        <motion.div
                            layout
                            onMouseEnter={() => setBentoHover('inventory')}
                            onMouseLeave={() => setBentoHover('savings')}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02, filter: 'brightness(1.2)' }}
                            transition={{ layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }}
                            className={`${bentoHover === 'inventory' ? 'md:col-span-2' : 'md:col-span-1'} relative p-8 bg-zinc-900/80 border ${bentoHover === 'inventory' ? 'border-brand-primary' : 'border-white/10'} rounded-3xl backdrop-blur-3xl overflow-hidden group/bento min-h-[220px] flex flex-col justify-center cursor-pointer shadow-2xl transition-all duration-500`}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover/bento:opacity-100 transition-opacity">
                                <Zap size={24} className="text-brand-primary" />
                            </div>
                            <div className="space-y-4 relative z-10 mr-auto">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 ${bentoHover === 'inventory' ? 'h-10' : 'h-6'} bg-brand-primary rounded-full transition-all duration-500`} />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white tracking-[0.3em] uppercase font-[family-name:var(--font-bruno-ace)] group-hover/bento:text-brand-primary transition-colors">Inventory_Live</span>
                                        <span className="text-sm font-bold text-white/50 uppercase">Worldwide Access</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-4 whitespace-nowrap">
                                    <span className="text-6xl md:text-7xl font-black text-white italic tracking-tighter leading-none">380+</span>
                                    <div className="h-10 w-px bg-white/10" />
                                    <span className="text-xl font-bold text-white uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Active_Skus</span>
                                </div>
                                {bentoHover === 'inventory' && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="text-[11px] text-zinc-400 font-medium leading-relaxed max-w-sm mt-2"
                                    >
                                        Access India's largest curated collection of premium motorcycles, updated real-time across all regional hubs.
                                    </motion.p>
                                )}
                            </div>
                            {/* high-tech visual ornament */}
                            <div className="absolute -bottom-12 -right-12 w-48 h-48 border border-brand-primary/10 rounded-full pointer-events-none">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-full h-full border-t-2 border-brand-primary/40 rounded-full shadow-[0_0_30px_rgba(255,100,0,0.1)]" />
                            </div>
                        </motion.div>

                        {/* block 2: savings matrix (Default Expanded) */}
                        <motion.div
                            layout
                            onMouseEnter={() => setBentoHover('savings')}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02, filter: 'brightness(1.2)' }}
                            transition={{ layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }}
                            className={`${bentoHover === 'savings' || bentoHover === null ? 'md:col-span-2' : 'md:col-span-1'} p-8 bg-zinc-900/80 border ${bentoHover === 'savings' ? 'border-brand-primary' : 'border-white/10'} rounded-3xl backdrop-blur-3xl group/savings min-h-[220px] flex flex-col justify-center cursor-pointer shadow-2xl transition-all duration-500`}
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/70 font-[family-name:var(--font-bruno-ace)]">
                                    <span>Savings_Calc</span>
                                    <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-6xl md:text-7xl font-black text-white italic tracking-tighter leading-none">{MARKET_METRICS.avgSavings}</p>
                                    <p className="text-[10px] font-bold text-white uppercase tracking-widest pl-1 mt-2">Avg. Dealer Rebate</p>
                                </div>
                                {bentoHover === 'savings' && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="text-[11px] text-zinc-400 font-medium leading-relaxed max-w-sm"
                                    >
                                        Leverage our Lowest EMI Guarantee and exclusive dealer rebates to save an average of ₹12,000 per booking.
                                    </motion.p>
                                )}
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ delay: 2, duration: 1 }}
                                        className="h-full bg-brand-primary shadow-[0_0_15px_rgba(255,100,0,0.5)]"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* block 3: dispatch telemetry */}
                        <motion.div
                            layout
                            onMouseEnter={() => setBentoHover('dispatch')}
                            onMouseLeave={() => setBentoHover('savings')}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02, filter: 'brightness(1.2)' }}
                            transition={{ layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }}
                            className={`${bentoHover === 'dispatch' ? 'md:col-span-2' : 'md:col-span-1'} p-8 bg-zinc-900/80 border ${bentoHover === 'dispatch' ? 'border-brand-primary' : 'border-white/10'} rounded-3xl backdrop-blur-3xl group/dispatch min-h-[220px] flex flex-col justify-center cursor-pointer shadow-2xl transition-all duration-500`}
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/70 font-[family-name:var(--font-bruno-ace)]">
                                    <span>Dispatch_Hub</span>
                                    <span className="text-brand-primary drop-shadow-[0_0_5px_rgba(255,100,0,0.5)]">LHR_04</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-6xl md:text-7xl font-black text-white italic tracking-tighter leading-none">{MARKET_METRICS.deliveryTime}</p>
                                    <p className="text-[10px] font-bold text-white uppercase tracking-widest pl-1 mt-2">Hyper-Local Speed</p>
                                </div>
                                {bentoHover === 'dispatch' && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="text-[11px] text-zinc-400 font-medium leading-relaxed max-w-sm"
                                    >
                                        Hyper-local processing at LHR_04 ensures your premium ride is dispatched and ready in record time.
                                    </motion.p>
                                )}
                                <div className="flex gap-1">
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ backgroundColor: ['rgba(255,255,255,0.05)', 'rgba(255,100,0,0.4)', 'rgba(255,255,255,0.05)'] }}
                                            transition={{ delay: 2 + (i * 0.1), duration: 1, repeat: Infinity }}
                                            className="h-1 flex-1 bg-white/5 rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* INTERFACE TRIGGER */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
                        className="mt-12 md:mt-20 flex flex-col items-center gap-6"
                    >
                        <Link
                            href="/store/catalog"
                            className="group relative h-20 w-96 flex items-center justify-center bg-transparent overflow-visible"
                        >
                            {/* animated liquid border */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible">
                                <rect
                                    x="0" y="0" width="100%" height="100%" fill="transparent" rx="10" stroke="#fff" strokeWidth="1" strokeOpacity="0.1"
                                    className="group-hover:stroke-brand-primary/50 transition-colors"
                                />
                                <motion.rect
                                    x="0" y="0" width="100%" height="100%" fill="transparent" rx="10" stroke="#ff9d00" strokeWidth="2"
                                    strokeDasharray="100, 400" strokeDashoffset="0"
                                    animate={{ strokeDashoffset: -500 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />
                            </svg>

                            <div className="relative z-10 flex items-center gap-4 text-xs font-black uppercase tracking-[0.4rem] text-white group-hover:text-brand-primary transition-colors font-[family-name:var(--font-bruno-ace)]">
                                <Search size={18} />
                                Initialize_Marketplace
                            </div>

                            {/* magnetic hover pull (visual only via scale) */}
                            <div className="absolute inset-0 bg-brand-primary/5 rounded-xl scale-95 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
                        </Link>

                        <div className="flex gap-12 opacity-30 text-[9px] font-mono tracking-widest">
                            <span className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full" /> SECURE_LINK: ENABLED</span>
                            <span className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full" /> HAPTIC_FEEDBACK: ACTIVE</span>
                            <span className="flex items-center gap-2 underline">v2.6_OS_CORE</span>
                        </div>
                    </motion.div>
                </div>

                {/* cinematic letterbox / vignette overlay */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black to-transparent z-40" />
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent z-40" />
            </section>





            <section className="min-h-screen ebook-section relative overflow-hidden bg-gradient-to-bl from-red-950/40 via-[#0b0d10] to-[#0b0d10] flex flex-col items-center justify-center">
                <div className="max-w-[1440px] mx-auto px-8 md:px-16 relative z-10 w-full">
                    <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center">
                        {/* Left Column: Context (4/12) */}
                        <div className="col-span-12 lg:col-span-4 space-y-8 relative z-20">
                            <div>
                                <h2 className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs mb-4">THE SYNDICATE</h2>
                                <h1 className="text-8xl xl:text-9xl font-extrabold italic uppercase tracking-[-0.05em] leading-[0.85] text-white">
                                    ELITE<br />MAKERS<span className="text-brand-primary">.</span>
                                </h1>
                            </div>
                            <p className="text-zinc-500 text-lg leading-relaxed max-w-sm">
                                A curated roster of engineering giants setting global standards. Seamless, elite performance across every brand.
                            </p>
                        </div>

                        {/* Right Column: 3D Cylindrical Monolith (8/12) */}
                        <div className="col-span-12 lg:col-span-8 h-[65vh] relative perspective-[2000px] flex items-center justify-end lg:pr-[250px]">
                            {/* The 3D Drum Container */}
                            <div
                                className={`relative w-[220px] h-[400px] preserve-3d transition-transform ${isSnapping ? 'duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]' : 'duration-0 ease-linear'}`}
                                style={{
                                    transformStyle: 'preserve-3d',
                                    transform: `rotateY(${drumRotation}deg)`,
                                }}
                            >
                                {[
                                    { name: 'APRILIA', color: '#F80000', tagline: 'BE A RACER' },
                                    { name: 'ATHER', color: '#10C25B', tagline: 'WARP SPEED' },
                                    { name: 'BAJAJ', color: '#005CAB', tagline: 'THE WORLD\'S FAVOURITE' },
                                    { name: 'CHETAK', color: '#D4AF37', tagline: 'LEGEND REBORN' },
                                    { name: 'HERO', color: '#E11B22', tagline: 'RIDE THE FUTURE' },
                                    { name: 'HONDA', color: '#CC0000', tagline: 'POWER OF DREAMS' },
                                    { name: 'KTM', color: '#FF6600', tagline: 'READY TO RACE' },
                                    { name: 'SUZUKI', color: '#164194', tagline: 'WAY OF LIFE' },
                                    { name: 'TVS', color: '#1C3E8A', tagline: 'RACING DNA' },
                                    { name: 'VESPA', color: '#0097DA', tagline: 'LIVE MORE VESPA' },
                                    { name: 'VIDA', color: '#FF5722', tagline: 'MAKE WAY' },
                                    { name: 'YAMAHA', color: '#183693', tagline: 'REVS YOUR HEART' },
                                ].map((brand, i) => {
                                    const angle = (i * 360) / 12;
                                    const radius = 375; // Adjusted for a more flush, gap-free drum

                                    const isHovered = hoveredBrand === brand.name;
                                    const isAnyHovered = hoveredBrand !== null;

                                    // Calculate if this card is 'front-center' based on drumRotation
                                    // drumRotation is -angle when a card is centered. So angle + drumRotation should be close to 0 (or multiples of 360)
                                    const currentAngle = (angle + drumRotation) % 360;
                                    const normalizedAngle = currentAngle < 0 ? currentAngle + 360 : currentAngle;
                                    const isAtFront = normalizedAngle < 15 || normalizedAngle > 345;

                                    // Find brand data from DB for the icon
                                    const dbBrand = brands?.find(b => b.name.toUpperCase() === brand.name.toUpperCase());

                                    return (
                                        <div
                                            key={brand.name}
                                            className="absolute inset-0 transition-opacity duration-500 preserve-3d"
                                            style={{
                                                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                                                backfaceVisibility: 'hidden',
                                                zIndex: (isHovered && isAtFront) ? 50 : 1,
                                                opacity: (isAnyHovered && !isHovered) ? 0.1 : 1, // Slightly visible padosi for depth
                                            }}
                                        >
                                            {/* Clickable/Hoverable Hit Area (Static Size) */}
                                            <div
                                                onMouseEnter={() => {
                                                    // Only allow hover expansion if the card is already at the front
                                                    if (isAtFront) {
                                                        setHoveredBrand(brand.name);
                                                    }
                                                }}
                                                onMouseLeave={() => setHoveredBrand(null)}
                                                onClick={() => {
                                                    if (!isAtFront) {
                                                        // If side card clicked, bring it to front
                                                        setIsSnapping(true);
                                                        setDrumRotation(-angle);
                                                        // Release snapping lock after transition completes
                                                        setTimeout(() => setIsSnapping(false), 1000);
                                                    } else {
                                                        // If already focused card clicked, navigate
                                                        window.location.href = `/store/catalog?brand=${brand.name}`;
                                                    }
                                                }}
                                                className="absolute inset-0 z-40 cursor-pointer"
                                            />

                                            <div
                                                className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-3xl pointer-events-none ${isHovered && isAtFront
                                                    ? 'shadow-[0_0_120px_rgba(255,255,255,0.25)] border border-white/20'
                                                    : 'backdrop-blur-md text-zinc-400 border-y border-white/5'
                                                    }`}
                                                style={{
                                                    transform: (isHovered && isAtFront) ? 'scale(1.2) translateZ(150px)' : 'none',
                                                    backgroundColor: (isHovered && isAtFront) ? brand.color : undefined,
                                                    backfaceVisibility: 'hidden',
                                                }}
                                            >
                                                {/* Ribbed Glass Texture Overlay (Only for inactive cards) */}
                                                {(!isHovered || !isAtFront) && (
                                                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-10"
                                                        style={{
                                                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 9px)'
                                                        }}
                                                    />
                                                )}

                                                {/* Soft Lighting: Provides depth without harsh edge lines */}
                                                {(!isHovered || !isAtFront) && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 z-20 pointer-events-none transition-opacity duration-700" />
                                                )}

                                                {/* Subtle Bottom Glow Hint (Brand Specific) */}
                                                <div
                                                    className={`absolute bottom-0 inset-x-0 h-1 z-20 transition-opacity duration-500 blur-sm ${(isHovered && isAtFront) ? 'opacity-100' : 'opacity-30'}`}
                                                    style={{ backgroundColor: brand.color }}
                                                />

                                                {/* Inactive State: Vertical Text - Centered & Standard Rotation */}
                                                {(!isHovered || !isAtFront) && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                                        <span className="text-4xl font-black uppercase italic tracking-tighter -rotate-90 whitespace-nowrap opacity-40 text-white transition-all duration-500">
                                                            {brand.name}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Active State: Full Content */}
                                                <div className={`absolute inset-0 p-8 flex flex-col justify-between z-30 transition-all duration-500 ${(isHovered && isAtFront) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                                                    <div className="flex justify-between items-start">
                                                        {/* Brand Icon (Preferred: Icon version from metadata) - 50% Larger */}
                                                        {(dbBrand?.brand_logos?.icon || dbBrand?.logo_svg) ? (
                                                            <div
                                                                className="w-16 h-16 flex items-center justify-center brightness-0 invert opacity-90 [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                                                                dangerouslySetInnerHTML={{ __html: dbBrand?.brand_logos?.icon || dbBrand?.logo_svg || '' }}
                                                            />
                                                        ) : (
                                                            <span className="text-4xl font-black italic text-white/40">
                                                                {brand.name[0]}
                                                            </span>
                                                        )}

                                                        <div className="text-white/60">
                                                            <ArrowRight className="-rotate-45" size={24} />
                                                        </div>
                                                    </div>

                                                    {/* Center section: LARGE Vertical Brand Name */}
                                                    <div className="flex-1 flex items-center justify-center relative">
                                                        <h3 className="text-white font-black italic uppercase tracking-[-0.05em] leading-none whitespace-nowrap -rotate-90 text-6xl md:text-7xl lg:text-8xl opacity-100 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                                            {brand.name}
                                                        </h3>
                                                    </div>

                                                    {/* Bottom section: Tagline & CTA */}
                                                    <div className="space-y-6">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 leading-none text-center">
                                                            {brand.tagline}
                                                        </p>
                                                        <div className="flex justify-center">
                                                            <div
                                                                className="flex items-center gap-3 bg-black/60 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all cursor-pointer group/active-btn"
                                                            >
                                                                Enter Factory
                                                                <ArrowRight size={14} className="group-hover/active-btn:translate-x-1 transition-transform" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Brand Letter Watermark */}
                                                <div
                                                    className={`absolute -right-4 top-1/2 -translate-y-1/2 text-[12rem] font-black italic uppercase select-none pointer-events-none transition-all duration-1000 ${(isHovered && isAtFront)
                                                        ? 'text-white/[0.1] scale-100 opacity-100'
                                                        : 'text-white/[0.02] scale-110 opacity-0'
                                                        }`}
                                                >
                                                    {brand.name[0]}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Lighting and Shadow Hints - Refined to remove boxy containers */}
                            <div className="absolute bottom-[-10%] inset-x-0 h-40 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_70%)] blur-3xl pointer-events-none z-0" />
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            {/* How it Works Section */}
            {/* How it Works Section */}
            <section className="h-screen ebook-section relative overflow-hidden bg-gradient-to-tr from-emerald-950/40 via-[#0b0d10] to-[#0b0d10] text-white pt-[var(--header-h)] flex flex-col justify-start">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#FFD700,transparent_70%)]" />
                </div>



                <div className="max-w-[1440px] mx-auto px-8 md:px-16 relative z-10 h-full flex flex-col justify-center">
                    <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center h-full">
                        {/* Left Side: Static Context */}
                        <div className="col-span-12 lg:col-span-5 space-y-8 relative z-30 lg:pr-12">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4">
                                    <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">
                                        The Process
                                    </p>
                                </div>
                                <h2 className="text-7xl xl:text-9xl font-extrabold uppercase tracking-[-0.05em] italic leading-[0.85] text-white cursor-pointer group/text">
                                    {['Select.', 'Quote.', 'Ride.'].map((text, i) => (
                                        <div
                                            key={i}
                                            onMouseEnter={() => setActiveStep(i)}
                                            className={`transition-all duration-500 ease-out origin-left ${activeStep === i
                                                ? 'text-white translate-x-4 scale-105'
                                                : 'text-white/20 hover:text-white/60 hover:translate-x-2'
                                                }`}
                                        >
                                            {text}
                                        </div>
                                    ))}
                                </h2>
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-xl text-zinc-400 font-medium leading-relaxed max-w-sm"
                            >
                                Experience the future of ownership. <br />
                                <span className="text-white">Seamless. Digital. Instant.</span>
                            </motion.p>
                        </div>

                        {/* Right Side: The Monolith Accordion */}
                        <div className="col-span-12 lg:col-span-7 h-[60vh] flex gap-4">
                            {[
                                {
                                    step: '01',
                                    title: 'Selection',
                                    subtitle: 'Unrivaled Inventory',
                                    desc: `Access real-time inventory from premium dealers. ${totalSkus}+ bikes available instantly.`,
                                    icon: <Search className="w-8 h-8 md:w-12 md:h-12" />,
                                },
                                {
                                    step: '02',
                                    title: 'Quotation',
                                    subtitle: 'Transparent Pricing',
                                    desc: 'Zero hidden costs. Get a precise on-road quote tailored to your location in seconds.',
                                    icon: <MapPin className="w-8 h-8 md:w-12 md:h-12" />,
                                },
                                {
                                    step: '03',
                                    title: 'Delivery',
                                    subtitle: 'Instant Ownership',
                                    desc: `Digital paperwork, instant approval. Ride out in under ${MARKET_METRICS.deliveryTime}.`,
                                    icon: <Zap className="w-8 h-8 md:w-12 md:h-12" />,
                                },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    layout
                                    onMouseEnter={() => setActiveStep(i)}
                                    className={`relative rounded-[2rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${activeStep === i
                                        ? 'flex-[3] bg-white text-black border-white shadow-[0_0_50px_rgba(255,255,255,0.2)]'
                                        : 'flex-[1] bg-zinc-900/60 border-white/5 text-zinc-500 hover:bg-zinc-800'
                                        }`}
                                >
                                    {/* Inner Content Layout */}
                                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <span className={`text-xl font-bold tracking-widest ${activeStep === i ? 'text-black' : 'text-zinc-600'}`}>
                                                {item.step}
                                            </span>
                                            <div className={`${activeStep === i ? 'text-brand-primary' : 'text-zinc-600'}`}>
                                                {item.icon}
                                            </div>
                                        </div>

                                        {/* Main Title (Vertical when inactive, Horizontal when active) */}
                                        <div className="relative">
                                            {activeStep !== i && (
                                                <div className="absolute bottom-0 left-0 origin-bottom-left -rotate-90 translate-x-8 w-[300px]">
                                                    <span className="text-4xl font-black uppercase tracking-tighter opacity-50 whitespace-nowrap">
                                                        {item.title}
                                                    </span>
                                                </div>
                                            )}

                                            {activeStep === i && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    className="space-y-4"
                                                >
                                                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
                                                        {item.subtitle}
                                                    </p>
                                                    <h3 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9]">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-lg font-medium text-zinc-600 max-w-md leading-relaxed">
                                                        {item.desc}
                                                    </p>

                                                    {/* Action Button Indicator */}
                                                    <div className="pt-6 flex items-center gap-3 text-brand-primary font-black uppercase tracking-widest text-xs">
                                                        Explore
                                                        <div className="h-px w-12 bg-brand-primary" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Decorative Background for Active Card */}
                                    {activeStep === i && (
                                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Categories - "The Vibe Deck" */}
            <section className="h-screen ebook-section relative flex flex-col justify-start bg-slate-50 dark:bg-[#0b0d10] transition-colors pt-[var(--header-h)] overflow-hidden">
                {/* Immersive Background Layer - Shifts with Active Vibe */}
                <div className="absolute inset-0 z-0 transition-colors duration-1000">
                    <div
                        className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 ${activeVibe === 0 ? 'opacity-100 from-blue-900/20 via-slate-900 to-black' : 'opacity-0'
                            }`}
                    />
                    <div
                        className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 ${activeVibe === 1 ? 'opacity-100 from-brand-primary/10 via-slate-900 to-black' : 'opacity-0'
                            }`}
                    />
                    <div
                        className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 ${activeVibe === 2 ? 'opacity-100 from-emerald-900/20 via-slate-900 to-black' : 'opacity-0'
                            }`}
                    />
                </div>

                <div className="max-w-[1440px] mx-auto px-8 md:px-16 relative z-10 h-full flex flex-col justify-center">
                    <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center h-full">
                        {/* Left Side: Static Context (Mirrors Process Section) */}
                        <div className="col-span-12 lg:col-span-5 space-y-8 relative z-30 lg:pr-12">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4">
                                    <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">
                                        Curated Collections
                                    </p>
                                </div>
                                <h2 className="text-7xl xl:text-9xl font-extrabold uppercase tracking-[-0.05em] italic leading-[0.85] text-white">
                                    Select <br /> Your <br /> Vibe
                                </h2>
                            </motion.div>
                            <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-sm">
                                Find your perfect ride. <br />
                                <span className="text-white">Scooter. Motorcycle. Moped.</span>
                            </p>
                        </div>

                        {/* Right Side: The Monolith Accordion */}
                        <div className="col-span-12 lg:col-span-7 h-[60vh] flex flex-col lg:flex-row gap-4">
                            {CATEGORIES.map((cat, i) => (
                                <Link
                                    key={i}
                                    href={cat.link}
                                    onMouseEnter={() => setActiveVibe(i)}
                                    className={`group relative overflow-hidden rounded-[2rem] border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between ${activeVibe === i
                                        ? 'flex-[3] bg-white/10 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md'
                                        : 'flex-[1] bg-white/5 border-white/5 opacity-60 hover:opacity-100 hover:bg-white/10'
                                        }`}
                                >
                                    {/* Background Mesh Gradient (Subtle) */}
                                    <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${cat.color} to-transparent mix-blend-overlay`} />

                                    {/* Interactive Layout Container */}
                                    <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-between z-20">

                                        {/* Top Header: Always visible, but adapts */}
                                        <div className="flex justify-between items-start w-full">
                                            <div className={`space-y-3 transition-opacity duration-500 ${activeVibe === i ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
                                                <div className="flex gap-2">
                                                    {cat.features.slice(0, 2).map((f, idx) => (
                                                        <span key={idx} className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white/80 border border-white/10">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-[0.9]">
                                                    {cat.title}
                                                </h3>
                                            </div>

                                            {/* Icon Arrow */}
                                            <ArrowRight
                                                size={32}
                                                className={`text-white transition-all duration-500 ${activeVibe === i ? '-rotate-45 group-hover:rotate-0 opacity-100' : 'opacity-50'}`}
                                            />
                                        </div>

                                        {/* Vertical Text for Inactive State (Desktop Only) */}
                                        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 pointer-events-none transition-opacity duration-500 ${activeVibe !== i ? 'opacity-100 hidden lg:block' : 'opacity-0 hidden'}`}>
                                            <span className="text-6xl font-black uppercase italic tracking-tighter text-white/40 whitespace-nowrap">
                                                {cat.title}
                                            </span>
                                        </div>

                                        {/* Content Bottom (Active Only) */}
                                        <div className={`relative z-20 transition-all duration-700 delay-100 ${activeVibe === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                                            <p className="text-sm md:text-base font-medium text-zinc-300 leading-relaxed max-w-md">
                                                {cat.desc}
                                            </p>
                                            <div className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-colors cursor-pointer group/btn">
                                                Explore {cat.title}
                                                <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating Product Image */}
                                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 ease-out ${activeVibe === i ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                        <div className="relative w-[85%] h-[85%]">
                                            <Image
                                                src={cat.img}
                                                alt={cat.title}
                                                fill
                                                className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                                            />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Restored Rider Pulse (Reviews) Section */}
            <div className="ebook-section h-screen flex flex-col justify-start pt-[var(--header-h)] bg-gradient-to-br from-amber-950/30 via-[#0b0d10] to-[#0b0d10]">
                <RiderPulse />
            </div>

            {/* Integrated Footer as Last Section */}
            <div className="ebook-section h-screen bg-[#0b0d10]">
                <Footer />
            </div>
        </div >
    );
}
