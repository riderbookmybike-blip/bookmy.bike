'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import Image from 'next/image';
import { ArrowRight, Search, Zap, MapPin } from 'lucide-react';
import { CATEGORIES, MARKET_METRICS } from '@/config/market';
import { useState } from 'react';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { RiderPulse } from '@/components/store/RiderPulse';
import { EliteCircle } from './sections/EliteCircle';
import { Footer } from './Footer';
import { useI18n } from '@/components/providers/I18nProvider';
import { sanitizeSvg } from '@/lib/utils/sanitizeSvg';

interface StoreDesktopProps {
    variant?: 'default' | 'tv';
}

const ROTATION_SPEED = 0.0045;
const ROTATION_REFRESH_INTERVAL = 80;

export function DesktopHome() {
    const { items, skuCount } = useSystemCatalogLogic();
    const { brands } = useSystemBrandsLogic();
    const { t } = useI18n();

    // Hero Template: Night City (Chosen by User)
    const heroImage = '/images/templates/t3_night.png';

    const processHeadings = [t('Select.'), t('Quote.'), t('Ride.')];

    const processSteps = [
        {
            step: '01',
            title: t('Selection'),
            subtitle: t('LIVE INVENTORY FEED'),
            desc: t('Direct access to regional hubs. 3.8k+ units ready for immediate allocation.'),
            icon: <Search className="w-8 h-8 md:w-12 md:h-12" />,
        },
        {
            step: '02',
            title: t('Quotation'),
            subtitle: t('ALGORITHMIC PRICING'),
            desc: t('Zero opacity. Instant, distinct on-road valuation with no hidden dealer margins.'),
            icon: <MapPin className="w-8 h-8 md:w-12 md:h-12" />,
        },
        {
            step: '03',
            title: t('Delivery'),
            subtitle: t('RAPID DEPLOYMENT'),
            desc: t('Digital documentation execution. Asset handover achieved in under 4 hours.'),
            icon: <Zap className="w-8 h-8 md:w-12 md:h-12" />,
        },
    ];

    const categoryCopy: Record<string, { title: string; desc: string; features: string[] }> = {
        Scooters: {
            title: t('Scooters'),
            desc: t(
                'Daily commuting made easy with comfort and great mileage. See transparent on-road prices and get instant quotes. Book your scooter in minutes.'
            ),
            features: [t('Most Popular')],
        },
        Motorcycles: {
            title: t('Motorcycles'),
            desc: t(
                'Find the right bike—commuter, cruiser, or sport. Compare on-road prices from verified dealers instantly. Get a quote and book in minutes.'
            ),
            features: [t('Youth Love')],
        },
        Mopeds: {
            title: t('Mopeds'),
            desc: t(
                'Work-ready utility rides built for heavy daily use. Low running cost with transparent on-road pricing. Get instant quotes and book fast.'
            ),
            features: [t('Utility Hero')],
        },
    };

    const containerRef = React.useRef<HTMLDivElement>(null);
    // Removed unused activeSection and isScrolling state

    // Brands Section Visual Hooks
    const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);
    const [drumRotation, setDrumRotation] = useState(0);
    const rotationRef = React.useRef(0);
    const commitRotation = React.useCallback(
        (value: number) => {
            rotationRef.current = value;
            setDrumRotation(value);
        },
        [setDrumRotation]
    );
    const [isSnapping, setIsSnapping] = useState(false);

    // Brands Drum Animation Loop (State-driven)
    React.useEffect(() => {
        let rafId: number;
        let lastTime = performance.now();
        let lastRender = performance.now();

        const animate = () => {
            const now = performance.now();
            const delta = now - lastTime;
            lastTime = now;

            if (!hoveredBrand && !isSnapping) {
                const nextRotation = rotationRef.current - delta * ROTATION_SPEED;
                rotationRef.current = nextRotation;
                if (now - lastRender >= ROTATION_REFRESH_INTERVAL) {
                    lastRender = now;
                    commitRotation(nextRotation);
                }
            }

            rafId = requestAnimationFrame(animate);
        };

        rafId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId);
    }, [hoveredBrand, isSnapping, commitRotation]);

    // Protocol Section Visual Hooks
    const [activeStep, setActiveStep] = useState<number | null>(0); // Default to 0, but user can clear it

    // Categories Section Visual Hooks
    const [activeVibe, setActiveVibe] = useState<number | null>(0); // Default to 0, but user can clear it
    const [hasMounted, setHasMounted] = useState(false);
    const [bentoHover, setBentoHover] = useState<'inventory' | 'savings' | 'dispatch' | null>('savings');

    const activeSectionRef = React.useRef(0);
    const lastScrollTime = React.useRef(0);

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
                // Removed setActiveSection call

                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth',
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
        <div className="flex flex-col pb-0 transition-colors duration-500 bg-white dark:bg-black text-slate-900 dark:text-white">
            {/* the hyper-aperture: kinetic chassis extraordinaria */}
            <section
                className="relative h-screen ebook-section overflow-hidden bg-gradient-to-br from-rose-900/60 via-[#0b0d10] to-[#0b0d10] dark:from-rose-950/80 dark:via-black dark:to-black isolate flex flex-col items-center justify-center p-0"
                onMouseMove={e => {
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
                        <img
                            src={heroImage}
                            alt="Tunnel"
                            className="w-full h-full object-cover grayscale contrast-125"
                        />
                    </motion.div>

                    {/* aperture layer 1: mid frame */}
                    <motion.div
                        className="absolute inset-[10%] border border-white/5 rounded-[4rem] z-10 box-content"
                        style={{
                            transform: 'translate(calc(var(--hyper-x) * 0.1), calc(var(--hyper-y) * 0.1))',
                        }}
                    />

                    {/* aperture layer 2: peripheral lens flare/vignette - Simplified for consistency */}
                    <div className="absolute inset-0 bg-amber-500/10 dark:bg-black/40 z-20" />

                    {/* aperture layer 3: digital scanning grid */}
                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:120px_120px] z-30 opacity-40 mix-blend-overlay"
                        style={{
                            transform: 'translate(calc(var(--hyper-x) * 0.4), calc(var(--hyper-y) * 0.4))',
                        }}
                    />

                    {/* drift elements: technical particles */}
                    <div className="absolute inset-x-[15vw] inset-y-[15vh] z-40">
                        {hasMounted &&
                            [...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        x: i * 5 + '%',
                                        y: ((i * 7) % 100) + '%',
                                        opacity: 0,
                                    }}
                                    animate={{ y: [null, '-20%', '120%'], opacity: [0, 0.4, 0] }}
                                    transition={{
                                        duration: 10 + (i % 5) * 4,
                                        repeat: Infinity,
                                        delay: i % 10,
                                    }}
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
                        animate={{ opacity: 1, scale: 1.1, y: 0 }}
                        transition={{ duration: 1.2, ease: 'circOut' }}
                        className="mb-8 md:mb-12 flex flex-col items-center mt-[8vh] relative z-[60]"
                    >
                        <div className="flex items-center gap-6 px-10 py-2.5 bg-zinc-900/80 border border-white/10 rounded-full backdrop-blur-xl transition-all hover:border-brand-primary/50 group/tele shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative">
                            {/* Shimmer Light Effect */}
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-30deg] pointer-events-none"
                            />

                            <div className="flex gap-1.5 z-10">
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-1.5 h-1.5 rounded-full bg-brand-primary"
                                />
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white group-hover/tele:text-brand-primary transition-colors font-[family-name:var(--font-bruno-ace)] z-10 relative">
                                INDIA&apos;S LOWEST EMI GUARANTEE
                            </span>
                            <div className="flex gap-1.5 z-10">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-1.5 h-1.5 rounded-full bg-brand-primary"
                                />
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
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 0.1, y: 0 }}
                                transition={{ delay: 0.4, duration: 1.5 }}
                                className="absolute -inset-2 text-7xl md:text-8xl lg:text-[clamp(4rem,12.5vw,10.5rem)] font-black uppercase text-white blur-3xl pointer-events-none opacity-20"
                                style={{
                                    backgroundPosition: 'calc(100% - var(--mouse-x-pct)) 50%',
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
                                    backgroundPositionX: 'calc(100% - var(--mouse-x-pct))',
                                }}
                            >
                                MOTORCYCLES
                            </motion.h1>

                            {/* kinetic scan line across text */}
                            <motion.div
                                animate={{ top: ['-20%', '120%'], opacity: [0, 1, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                className="absolute left-0 right-0 h-[30%] bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent z-10 pointer-events-none"
                            />
                        </div>
                    </div>

                    {/* TELEMETRY BENTO: kinetic accordion grid */}
                    <div className="w-full max-w-[1440px] grid grid-cols-1 md:grid-cols-4 gap-4 px-6 mx-auto place-items-stretch pointer-events-auto">
                        {/* block 1: SKU scanner */}
                        <motion.div
                            layout
                            onMouseEnter={() => setBentoHover('inventory')}
                            onMouseLeave={() => setBentoHover(null)}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02, filter: 'brightness(1.2)' }}
                            transition={{ layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }}
                            className={`${bentoHover === 'inventory' ? 'md:col-span-2' : 'md:col-span-1'} relative p-8 bg-zinc-900/60 border ${bentoHover === 'inventory' ? 'border-brand-primary' : 'border-white/10'} rounded-3xl backdrop-blur-3xl overflow-hidden group/bento h-[220px] flex flex-col justify-center cursor-pointer shadow-xl transition-all duration-500`}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover/bento:opacity-100 transition-opacity">
                                <Zap size={24} className="text-brand-primary" />
                            </div>
                            <div className="flex items-center gap-8 relative z-10 w-full h-full">
                                {/* Left Column: Core Stats (Locked Width) */}
                                <div className="md:w-48 flex-none space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70 font-[family-name:var(--font-bruno-ace)] group-hover/bento:text-brand-primary transition-colors">
                                        <span>{t('SKU_Live')}</span>
                                        <motion.div
                                            animate={{ opacity: [1, 0.1, 1] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
                                        />
                                    </div>
                                    <div className="flex items-baseline gap-4 whitespace-nowrap">
                                        <span className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                            380+
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-white tracking-widest px-2 py-1 rounded font-inter opacity-60">
                                            {t('active_sourcing')}
                                        </span>
                                    </div>
                                </div>

                                {/* Right Column: Expanded Details */}
                                {bentoHover === 'inventory' && (
                                    <>
                                        <div className="w-px h-24 bg-white/10 skew-x-[-20deg] hidden md:block" />
                                        <motion.div
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex-1 hidden md:flex flex-col gap-2 p-4 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-amber-500/80 tracking-[0.2em] uppercase font-mono">
                                                    {t('Archive_01: Inventory_Core')}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-zinc-300 font-medium leading-[1.6] max-w-[240px]">
                                                {t(
                                                    "Access India's largest curated collection of premium motorcycles, updated real-time across regional hubs."
                                                )}
                                            </p>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        </motion.div>

                        {/* block 2: inventory sync (was dispatch) */}
                        <motion.div
                            layout
                            onMouseEnter={() => setBentoHover('dispatch')}
                            onMouseLeave={() => setBentoHover(null)}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02, filter: 'brightness(1.2)' }}
                            transition={{ layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }}
                            className={`${bentoHover === 'dispatch' ? 'md:col-span-2' : 'md:col-span-1'} p-8 bg-zinc-900/60 border ${bentoHover === 'dispatch' ? 'border-brand-primary' : 'border-white/10'} rounded-3xl backdrop-blur-3xl group/dispatch h-[220px] flex flex-col justify-center cursor-pointer shadow-xl transition-all duration-500`}
                        >
                            <div className="flex items-center gap-8 relative z-10 w-full h-full">
                                {/* Left Column: Core Stats (Locked Width) */}
                                <div className="md:w-48 flex-none space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70 font-[family-name:var(--font-bruno-ace)]">
                                        <span>{t('Inventory_Sync')}</span>
                                        <motion.div
                                            animate={{ opacity: [1, 0.1, 1] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
                                        />
                                    </div>
                                    <div className="flex items-baseline gap-4 whitespace-nowrap">
                                        <p className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                            {MARKET_METRICS.deliveryTime}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold text-white tracking-widest px-2 py-1 rounded font-inter opacity-60">
                                            {t('logistics_flow')}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column: Expanded Details */}
                                {bentoHover === 'dispatch' && (
                                    <>
                                        <div className="w-px h-24 bg-white/10 skew-x-[-20deg] hidden md:block" />
                                        <motion.div
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex-1 hidden md:flex flex-col gap-2 p-4 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-red-500/80 tracking-[0.2em] uppercase font-mono">
                                                    {t('Archive_02: Logistics_Hub')}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-zinc-300 font-medium leading-[1.6] max-w-[240px]">
                                                {t(
                                                    'Hyper-local processing ensure your premium ride is dispatched and ready in record time.'
                                                )}
                                            </p>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        </motion.div>

                        {/* block 3: savings matrix (Now 3rd and Default Expanded) */}
                        <motion.div
                            layout
                            onMouseEnter={() => setBentoHover('savings')}
                            onMouseLeave={() => setBentoHover(null)}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02, filter: 'brightness(1.2)' }}
                            transition={{ layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }}
                            className={`${bentoHover === 'savings' || bentoHover === null ? 'md:col-span-2' : 'md:col-span-1'} p-8 bg-zinc-900/60 border ${bentoHover === 'savings' ? 'border-brand-primary' : 'border-white/10'} rounded-3xl backdrop-blur-3xl group/savings h-[220px] flex flex-col justify-center cursor-pointer shadow-xl transition-all duration-500`}
                        >
                            <div className="flex items-center gap-8 relative z-10 w-full h-full">
                                {/* Left Column: Core Stats (Locked Width) */}
                                <div className="md:w-48 flex-none space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70 font-[family-name:var(--font-bruno-ace)]">
                                        <span>{t('Savings_Calc')}</span>
                                        <motion.div
                                            animate={{ opacity: [1, 0.1, 1] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                                        />
                                    </div>
                                    <div className="flex items-baseline gap-4 whitespace-nowrap">
                                        <p className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                            {MARKET_METRICS.avgSavings}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold text-white tracking-widest px-2 py-1 rounded opacity-60">
                                            {t('dealer_rebate')}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column: Expanded Details */}
                                {(bentoHover === 'savings' || bentoHover === null) && (
                                    <>
                                        <div className="w-px h-24 bg-white/10 skew-x-[-20deg] hidden md:block" />
                                        <motion.div
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex-1 hidden md:flex flex-col gap-2 p-4 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-green-500/80 tracking-[0.2em] uppercase font-mono">
                                                    {t('Archive_03: Finance_Core')}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-zinc-300 font-medium leading-[1.6] max-w-[240px]">
                                                {t(
                                                    'Leverage our Lowest EMI Guarantee and exclusive dealer rebates to save an average of ₹12,000 per booking.'
                                                )}
                                            </p>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* INTERFACE TRIGGER */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.8 }}
                        className="mt-12 md:mt-20 flex flex-col items-center gap-6"
                    >
                        <Link
                            href="/store/catalog"
                            className="group relative h-20 w-96 flex items-center justify-center bg-transparent overflow-visible"
                        >
                            {/* animated liquid border */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible">
                                <rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    fill="transparent"
                                    rx="10"
                                    stroke="#fff"
                                    strokeWidth="1"
                                    strokeOpacity="0.1"
                                    className="group-hover:stroke-brand-primary/50 transition-colors"
                                />
                                <motion.rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    fill="transparent"
                                    rx="10"
                                    stroke="#ff9d00"
                                    strokeWidth="2"
                                    strokeDasharray="100, 400"
                                    strokeDashoffset="0"
                                    animate={{ strokeDashoffset: -500 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                />
                            </svg>

                            <div className="relative z-10 flex items-center gap-4 text-xs font-black uppercase tracking-[0.4rem] text-white group-hover:text-brand-primary transition-colors font-[family-name:var(--font-bruno-ace)]">
                                <Search size={18} />
                                {t('Initialize_Marketplace')}
                            </div>

                            {/* magnetic hover pull (visual only via scale) */}
                            <div className="absolute inset-0 bg-brand-primary/5 rounded-xl scale-95 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
                        </Link>

                        <div className="flex gap-12 opacity-30 text-[9px] font-mono tracking-widest">
                            <span className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-white rounded-full" /> SECURE_LINK: ENABLED
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-white rounded-full" /> HAPTIC_FEEDBACK: ACTIVE
                            </span>
                            <span className="flex items-center gap-2 underline">v2.6_OS_CORE</span>
                        </div>
                    </motion.div>
                </div>

                {/* cinematic letterbox / vignette overlay */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black to-transparent z-40" />
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent z-40" />
            </section>

            <section className="min-h-screen ebook-section relative overflow-hidden bg-gradient-to-bl from-orange-800/60 via-[#0b0d10] to-[#0b0d10] dark:from-orange-950/80 dark:via-black dark:to-black transition-colors duration-500 flex flex-col items-center justify-center">
                <div className="max-w-[1440px] mx-auto px-6 relative z-10 w-full">
                    <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center">
                        {/* Left Column: Context (4/12) */}
                        <div className="col-span-12 lg:col-span-4 space-y-8 relative z-20">
                            <div>
                                <h2 className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs mb-4">
                                    {t('THE SYNDICATE')}
                                </h2>
                                <h1 className="text-8xl xl:text-9xl font-extrabold italic uppercase tracking-[-0.05em] leading-[0.85] text-white">
                                    {t('ELITE')}
                                    <br />
                                    {t('MAKERS')}
                                    <span className="text-brand-primary">.</span>
                                </h1>
                            </div>
                            <p className="text-zinc-500 text-lg leading-relaxed max-w-sm">
                                {t(
                                    'A curated roster of engineering giants setting global standards. Seamless, elite performance across every brand.'
                                )}
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
                                    { name: 'BAJAJ', color: '#005CAB', tagline: "THE WORLD'S FAVOURITE" },
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
                                    const dbBrand = brands?.find(
                                        b => b.name.toUpperCase() === brand.name.toUpperCase()
                                    );

                                    return (
                                        <div
                                            key={brand.name}
                                            className="absolute inset-0 transition-opacity duration-500 preserve-3d"
                                            style={{
                                                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                                                backfaceVisibility: 'hidden',
                                                zIndex: isHovered && isAtFront ? 50 : 1,
                                                opacity: isAnyHovered && !isHovered ? 0.1 : 1, // Slightly visible padosi for depth
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
                                                        commitRotation(-angle);
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
                                                className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-3xl pointer-events-none ${
                                                    isHovered && isAtFront
                                                        ? 'shadow-[0_0_120px_rgba(255,255,255,0.25)] border border-white/20'
                                                        : 'backdrop-blur-md text-zinc-400 border-y border-white/5'
                                                }`}
                                                style={{
                                                    transform:
                                                        isHovered && isAtFront
                                                            ? 'scale(1.2) translateZ(150px)'
                                                            : 'none',
                                                    backgroundColor: isHovered && isAtFront ? brand.color : undefined,
                                                    backfaceVisibility: 'hidden',
                                                }}
                                            >
                                                {/* Ribbed Glass Texture Overlay (Only for inactive cards) */}
                                                {(!isHovered || !isAtFront) && (
                                                    <div
                                                        className="absolute inset-0 opacity-[0.05] pointer-events-none z-10"
                                                        style={{
                                                            backgroundImage:
                                                                'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 9px)',
                                                        }}
                                                    />
                                                )}

                                                {/* Soft Lighting: Provides depth without harsh edge lines */}
                                                {(!isHovered || !isAtFront) && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 z-20 pointer-events-none transition-opacity duration-700" />
                                                )}

                                                {/* Subtle Bottom Glow Hint (Brand Specific) */}
                                                <div
                                                    className={`absolute bottom-0 inset-x-0 h-1 z-20 transition-opacity duration-500 blur-sm ${isHovered && isAtFront ? 'opacity-100' : 'opacity-30'}`}
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
                                                <div
                                                    className={`absolute inset-0 p-8 flex flex-col justify-between z-30 transition-all duration-500 ${isHovered && isAtFront ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        {/* Brand Icon (Small Top Left) - OPTIONAL: We can keep it or remove it since we have a huge one in center now. Let's keep it minimal or remove. Actually, let's keep the layout clean. Top Right Arrow only. */}
                                                        <div /> {/* Spacer */}
                                                        <div className="text-white/60">
                                                            <ArrowRight className="-rotate-45" size={24} />
                                                        </div>
                                                    </div>

                                                    {/* Center section: LARGE Hero Logo */}
                                                    <div className="flex-1 flex items-center justify-center relative">
                                                        {dbBrand?.brand_logos?.icon || dbBrand?.logo_svg ? (
                                                            <div
                                                                className="w-48 h-48 flex items-center justify-center brightness-0 invert opacity-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: sanitizeSvg(
                                                                        dbBrand?.brand_logos?.icon ||
                                                                            dbBrand?.logo_svg ||
                                                                            ''
                                                                    ),
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-9xl font-black italic text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                                                {brand.name[0]}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Bottom section: Tagline & CTA */}
                                                    <div className="space-y-6">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 leading-none text-center">
                                                            {brand.tagline}
                                                        </p>
                                                        <div className="flex justify-center">
                                                            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all cursor-pointer group/active-btn">
                                                                {t('Enter Factory')}
                                                                <ArrowRight
                                                                    size={14}
                                                                    className="group-hover/active-btn:translate-x-1 transition-transform"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Brand Letter Watermark */}
                                                <div
                                                    className={`absolute -right-4 top-1/2 -translate-y-1/2 text-[12rem] font-black italic uppercase select-none pointer-events-none transition-all duration-1000 ${
                                                        isHovered && isAtFront
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
            <section className="h-screen ebook-section relative overflow-hidden bg-gradient-to-tr from-amber-700/60 via-[#0b0d10] to-[#0b0d10] dark:from-amber-950/80 dark:via-black dark:to-black text-slate-900 dark:text-white pt-[var(--header-h)] flex flex-col justify-start transition-colors duration-500">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#FFD700,transparent_70%)]" />
                </div>

                <div className="max-w-[1440px] mx-auto px-6 relative z-10 h-full flex flex-col justify-center">
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
                                    <div className="w-12 h-0.5 bg-brand-primary" />
                                    <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">
                                        {t('The Process')}
                                    </p>
                                </div>
                                <h2 className="text-7xl xl:text-9xl font-extrabold uppercase tracking-[-0.05em] italic leading-[0.85] text-white cursor-pointer group/text">
                                    {processHeadings.map((text, i) => (
                                        <div
                                            key={i}
                                            onMouseEnter={() => setActiveStep(i)}
                                            className={`transition-all duration-500 ease-out origin-left ${
                                                activeStep === i
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
                                {t('Experience the future of ownership.')}
                                <br />
                                <span className="text-white">{t('Seamless. Digital. Instant.')}</span>
                            </motion.p>
                        </div>

                        {/* Right Side: The Monolith Accordion */}
                        <div className="col-span-12 lg:col-span-7 h-[60vh] flex gap-4">
                            {processSteps.map((item, i) => (
                                <motion.div
                                    key={i}
                                    layout
                                    onMouseEnter={() => setActiveStep(i)}
                                    className={`relative rounded-[2rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                                        activeStep === i
                                            ? 'flex-[3] bg-white text-black border-white shadow-[0_0_50px_rgba(255,255,255,0.2)]'
                                            : 'flex-[1] bg-zinc-900/60 border-white/5 text-zinc-500 hover:bg-zinc-800'
                                    }`}
                                >
                                    {/* Inner Content Layout */}
                                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                        {/* Header */}
                                        <div
                                            className={`flex items-start w-full ${activeStep === i ? 'justify-between' : 'justify-center'}`}
                                        >
                                            {/* Icon: Left if Active, Center if Inactive */}
                                            <div
                                                className={`${activeStep === i ? 'text-brand-primary order-1' : 'text-zinc-600'}`}
                                            >
                                                {React.cloneElement(
                                                    item.icon as React.ReactElement<{ className?: string }>,
                                                    { className: 'w-8 h-8 md:w-12 md:h-12' }
                                                )}
                                            </div>

                                            {/* Step Number: Right if Active, Hidden if Inactive */}
                                            {activeStep === i && (
                                                <span className="text-xl font-bold tracking-widest text-black order-2">
                                                    {item.step}
                                                </span>
                                            )}
                                        </div>

                                        {/* Main Title (Vertical Center when inactive, Horizontal when active) */}
                                        <div className="relative flex-1 flex flex-col justify-end">
                                            {activeStep !== i && (
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
                                                    <span className="text-6xl font-black uppercase italic tracking-tighter text-white/40">
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
                                                        {t('Explore')}
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

            <section className="h-screen ebook-section relative flex flex-col justify-start bg-gradient-to-br from-emerald-100 via-slate-50 to-slate-50 dark:from-emerald-950/80 dark:via-black dark:to-black pt-[var(--header-h)] overflow-hidden">
                {/* Vibrant Background Layer: Silken 'Aurora' cross-fades to avoid the flash */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-800/50 via-[#0b0d10] to-black" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[70%] bg-[radial-gradient(circle_at_50%_100%,rgba(52,211,153,0.25),transparent_70%)]" />
                </div>

                <div className="max-w-[1440px] mx-auto px-6 relative z-10 h-full flex flex-col justify-center">
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
                                    <p className="text-sm font-black text-white uppercase tracking-[0.3em]">
                                        {t('Curated Collections')}
                                    </p>
                                </div>
                                <h2 className="text-7xl xl:text-9xl font-extrabold uppercase tracking-[-0.05em] italic leading-[0.85] text-white">
                                    {t('Select')} <br /> {t('Your')} <br /> {t('Vibe')}
                                </h2>
                            </motion.div>
                            <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-sm">
                                {t('Find your perfect ride.')}
                                <br />
                                <span className="text-white">{t('Scooter. Motorcycle. Moped.')}</span>
                            </p>
                        </div>

                        {/* Right Side: The Monolith Accordion */}
                        <div className="col-span-12 lg:col-span-7 h-[60vh] flex flex-col lg:flex-row gap-4">
                            {CATEGORIES.map((cat, i) => (
                                <Link
                                    key={i}
                                    href={cat.link}
                                    onMouseEnter={() => setActiveVibe(i)}
                                    className={`group relative overflow-hidden rounded-[2rem] border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between ${
                                        activeVibe === i
                                            ? 'flex-[3] bg-white/10 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md'
                                            : 'flex-[1] bg-white/5 border-white/5 opacity-60 hover:opacity-100 hover:bg-white/10'
                                    }`}
                                >
                                    {(() => {
                                        const copy = categoryCopy[cat.title];
                                        const title = copy?.title || cat.title;
                                        const desc = copy?.desc || cat.desc;
                                        const features = copy?.features || cat.features;
                                        return (
                                            <>
                                                {/* Background Mesh Gradient (Subtle) */}
                                                {/* Background Mesh Gradient (Subtle) */}
                                                <div
                                                    className={`absolute inset-0 opacity-20 bg-gradient-to-br ${cat.color} to-transparent mix-blend-overlay`}
                                                />

                                                {/* Interactive Layout Container: Nested vertical sandwich to fix overlap */}
                                                <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-between z-20">
                                                    {/* Top Header: Title & Meta */}
                                                    <div className="flex justify-between items-start w-full">
                                                        <div
                                                            className={`space-y-3 transition-opacity duration-500 ${activeVibe === i ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}
                                                        >
                                                            <div className="flex gap-2">
                                                                {features.slice(0, 2).map((f, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white/80 border border-white/10"
                                                                    >
                                                                        {f}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-[0.9]">
                                                                {title}
                                                            </h3>
                                                        </div>

                                                        {/* Icon Arrow */}
                                                        <ArrowRight
                                                            size={32}
                                                            className={`text-white transition-all duration-500 ${activeVibe === i ? '-rotate-45 group-hover:rotate-0 opacity-100' : 'opacity-50'}`}
                                                        />
                                                    </div>

                                                    {/* THE VEHICLE: Nested in flow between Title and Desc to fix overlap */}
                                                    <div
                                                        className={`flex-1 flex items-center justify-center transition-all duration-700 ease-out ${activeVibe === i ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                                                    >
                                                        <div className="relative w-[65%] h-[65%] pointer-events-none">
                                                            <Image
                                                                src={cat.img}
                                                                alt={title}
                                                                fill
                                                                className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Vertical Text for Inactive State (Desktop Only) */}
                                                    <div
                                                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 pointer-events-none transition-opacity duration-500 ${activeVibe !== i ? 'opacity-100 hidden lg:block' : 'opacity-0 hidden'}`}
                                                    >
                                                        <span className="text-6xl font-black uppercase italic tracking-tighter text-white/40 whitespace-nowrap">
                                                            {title}
                                                        </span>
                                                    </div>

                                                    {/* Content Bottom (Active Only) */}
                                                    <div
                                                        className={`relative z-20 transition-all duration-700 delay-100 ${activeVibe === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                                                    >
                                                        <p className="text-sm md:text-base font-medium text-zinc-300 leading-relaxed max-w-md">
                                                            {desc}
                                                        </p>
                                                        <div className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-colors cursor-pointer group/btn">
                                                            {t('Explore')} {title}
                                                            <ArrowRight
                                                                size={16}
                                                                className="transition-transform group-hover/btn:translate-x-1"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Restored Rider Pulse (Reviews) Section */}
            <div className="ebook-section h-screen flex flex-col justify-start pt-[var(--header-h)] bg-gradient-to-br from-blue-100 via-slate-50 to-slate-50 dark:from-blue-900/50 dark:via-[#0b0d10] dark:to-[#0b0d10]">
                <RiderPulse />
            </div>

            {/* Cinematic Sections */}
            <EliteCircle />

            {/* Integrated Footer as Last Section */}
            <div className="ebook-section h-screen bg-gradient-to-t from-slate-200 via-white to-white dark:from-zinc-950/80 dark:via-black dark:to-black">
                <Footer />
            </div>
        </div>
    );
}
