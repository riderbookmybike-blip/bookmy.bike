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
import { Logo } from '@/components/brand/Logo';

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
    const sectionViewportClass = 'min-h-[calc(100svh-var(--header-h))] md:h-[calc(100svh-var(--header-h))]';

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
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setHasMounted(true);
            return;
        }

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
        <div className="flex flex-col pb-0 transition-colors duration-500 bg-white text-slate-900 relative">
            {/* ATMOSPHERIC AMBIENT LIGHT OVERLAY (NEW) */}
            <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        opacity: [0.1, 0.2, 0.1],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-brand-primary/5 blur-[150px] rounded-full"
                />
                <motion.div
                    animate={{
                        opacity: [0.1, 0.15, 0.1],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-brand-primary/5 blur-[180px] rounded-full"
                />
            </div>
            {/* the hyper-aperture: kinetic chassis extraordinaria */}
            <section
                className={`relative ${sectionViewportClass} ebook-section overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 isolate flex flex-col items-center justify-start px-6 md:px-0 pt-6 md:pt-10`}
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
                        animate={{ scale: 1, opacity: 0.7 }}
                        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 w-full h-full will-change-transform"
                        style={{
                            transform: 'translate(calc(var(--hyper-x) * -0.2), calc(var(--hyper-y) * -0.2)) scale(1.1)',
                        }}
                    >
                        <img src={heroImage} alt="Tunnel" className="w-full h-full object-cover opacity-80" />
                    </motion.div>

                    {/* aperture layer 1: mid frame */}
                    <motion.div
                        className="absolute inset-[10%] border border-white/5 rounded-[4rem] z-10 box-content"
                        style={{
                            transform: 'translate(calc(var(--hyper-x) * 0.1), calc(var(--hyper-y) * 0.1))',
                        }}
                    />

                    {/* aperture layer 2: peripheral lens flare/vignette - Simplified for consistency */}
                    <div className="absolute inset-0 bg-black/30 z-20" />

                    {/* aperture layer 3: digital scanning grid */}
                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:120px_120px] z-30 opacity-30"
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
                    {/* Circular Rotating EMI Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: 'circOut' }}
                        className="mb-8 md:mb-12 mt-0 relative flex items-center justify-center w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 z-[60]"
                    >
                        {/* Rotating text ring (Clockwise) */}
                        <motion.svg
                            viewBox="0 0 100 100"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                        >
                            <defs>
                                <path
                                    id="heroCirclePath"
                                    d="M 50, 50 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0"
                                />
                            </defs>
                            <text
                                className="text-[8.5px] font-black uppercase tracking-[0.6em] fill-white font-[family-name:var(--font-bruno-ace)]"
                                style={{ opacity: 0.95 }}
                            >
                                <textPath
                                    href="#heroCirclePath"
                                    startOffset="0%"
                                    textLength="262"
                                    lengthAdjust="spacingAndGlyphs"
                                >
                                    INDIA&apos;S LOWEST EMI GUARANTEE *&nbsp;
                                </textPath>
                            </text>
                        </motion.svg>

                        {/* Central HUD Core */}
                        <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-black/60 border border-white/20 backdrop-blur-3xl flex flex-col items-center justify-center group/tele shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-brand-primary transition-all overflow-hidden">
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] pointer-events-none"
                            />
                            <div className="z-10 scale-75 sm:scale-90 md:scale-110 group-hover/tele:scale-100 transition-transform duration-500 brightness-100">
                                <Logo variant="icon" size={64} mode="dark" />
                            </div>
                        </div>

                        {/* Decorative Outer Rings (Counter-Rotating: Anti-clockwise) */}
                        <div className="absolute inset-0 rounded-full border border-white/10 scale-[0.8] pointer-events-none" />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 rounded-full border border-dashed border-white/20 scale-[0.9] pointer-events-none opacity-40"
                        />
                        <div className="absolute inset-0 rounded-full border border-white/10 scale-[1.05] pointer-events-none" />
                    </motion.div>

                    {/* LIQUID CHROME TYPOGRAPHY */}
                    <div className="relative flex flex-col items-center mb-16 select-none pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, letterSpacing: '1.2em' }}
                            animate={{ opacity: 1, letterSpacing: '0.4em' }}
                            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                            className="text-sm md:text-base font-black uppercase text-white/90 mb-6 transition-all duration-300 font-[family-name:var(--font-bruno-ace)]"
                        >
                            The Highest Fidelity Marketplace
                        </motion.div>

                        <div className="relative group/title">
                            {/* reflective shadow layer */}
                            <motion.h1
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 0.05, y: 0 }}
                                transition={{ delay: 0.4, duration: 1.5 }}
                                className="absolute -inset-2 text-4xl sm:text-6xl md:text-8xl lg:text-[clamp(4rem,12.5vw,10.5rem)] font-black uppercase text-white blur-3xl pointer-events-none"
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
                                className="relative text-4xl sm:text-6xl md:text-8xl lg:text-[clamp(4rem,12vw,9.5rem)] font-black italic uppercase tracking-[-0.03em] leading-none text-transparent bg-clip-text bg-[linear-gradient(110deg,#ffffff_0%,#ffffff_40%,#ff9d00_50%,#ffffff_60%,#ffffff_100%)] bg-[length:200%_100%] transition-all duration-1000 font-[family-name:var(--font-bruno-ace)]"
                                style={{
                                    textShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundPositionX: 'calc(100% - var(--mouse-x-pct))',
                                }}
                            >
                                MOTORCYCLES
                            </motion.h1>

                            {/* kinetic scan line across text */}
                            <motion.div
                                animate={{ top: ['-20%', '120%'], opacity: [0, 0.4, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                className="absolute left-0 right-0 h-[30%] bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent z-10 pointer-events-none"
                            />
                        </div>
                    </div>

                    {/* TELEMETRY BENTO: kinetic accordion grid */}
                    <div
                        className={`w-full max-w-[1440px] grid grid-cols-1 md:grid-cols-4 gap-4 px-6 mx-auto place-items-stretch pointer-events-auto`}
                    >
                        {/* block 1: SKU scanner */}
                        <motion.div
                            layout
                            onMouseEnter={() => setBentoHover('inventory')}
                            onMouseLeave={() => setBentoHover(null)}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }}
                            className={`${bentoHover === 'inventory' ? 'md:col-span-2' : 'md:col-span-1'} relative p-8 h-[220px] bg-black/40 border ${bentoHover === 'inventory' ? 'border-brand-primary' : 'border-white/10'} rounded-3xl backdrop-blur-xl overflow-hidden group/bento flex flex-col justify-center cursor-pointer shadow-lg transition-all duration-500`}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover/bento:opacity-100 transition-opacity">
                                <Zap size={24} className="text-brand-primary" />
                            </div>
                            <div className="flex items-center gap-8 relative z-10 w-full h-full">
                                {/* Left Column: Core Stats (Locked Width) */}
                                <div className="md:w-48 flex-none space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 font-[family-name:var(--font-bruno-ace)] group-hover/bento:text-brand-primary transition-colors">
                                        <span>{t('SKU_Live')}</span>
                                        <motion.div
                                            animate={{ opacity: [1, 0.1, 1] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0"
                                        />
                                    </div>
                                    <div className="flex items-baseline gap-4 whitespace-nowrap">
                                        <span className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                            380+
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-white/40 tracking-widest px-2 py-1 rounded font-inter">
                                            {t('active_sourcing')}
                                        </span>
                                    </div>
                                </div>

                                {/* Right Column: Expanded Details */}
                                {bentoHover === 'inventory' && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex-1 hidden md:flex flex-col gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
                                                <span className="text-[9px] font-black text-emerald-600/80 tracking-[0.2em] uppercase font-mono">
                                                    {t('Archive_01: Inventory_Core')}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-white/50 font-medium leading-[1.6] max-w-[240px]">
                                                {t(
                                                    "Access India's largest curated collection of premium motorcycles, updated real-time across regional hubs."
                                                )}
                                            </p>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        </motion.div>

                        {/* block 2: Smart Discovery (NEW) */}
                        <motion.div
                            layout
                            onMouseEnter={() => setBentoHover('dispatch')}
                            onMouseLeave={() => setBentoHover(null)}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }}
                            className={`${bentoHover === 'dispatch' ? 'md:col-span-2' : 'md:col-span-1'} p-8 h-[220px] bg-black/40 border ${bentoHover === 'dispatch' ? 'border-brand-primary' : 'border-white/10'} rounded-3xl backdrop-blur-xl group/dispatch flex flex-col justify-center cursor-pointer shadow-lg transition-all duration-500`}
                        >
                            <div className="flex items-center gap-8 relative z-10 w-full h-full">
                                {/* Left Column: Action Chips */}
                                <div className="md:w-48 flex-none space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 font-[family-name:var(--font-bruno-ace)]">
                                        <span>{t('Smart_Discovery')}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Under 80k', 'Best Mileage', 'Electric', 'Cruiser'].map(chip => (
                                            <div
                                                key={chip}
                                                className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-tight text-white/60 hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all"
                                            >
                                                {chip}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Column: Expanded Details */}
                                {bentoHover === 'dispatch' && (
                                    <>
                                        <div className="w-px h-24 bg-white/10 skew-x-[-20deg] hidden md:block" />
                                        <motion.div
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex-1 hidden md:flex flex-col gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-brand-primary" />
                                                <span className="text-[9px] font-black text-brand-primary tracking-[0.2em] uppercase font-mono">
                                                    {t('Frictionless_Picker')}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-white/50 font-medium leading-[1.6]">
                                                {t(
                                                    'Bypass traditional browsing. One-tap access to pre-filtered collections based on your lifestyle.'
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
                            whileHover={{ scale: 1.02 }}
                            transition={{ layout: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }}
                            className={`${bentoHover === 'savings' || bentoHover === null ? 'md:col-span-2' : 'md:col-span-1'} p-8 h-[220px] bg-black/40 border ${bentoHover === 'savings' ? 'border-brand-primary' : 'border-white/10'} rounded-3xl backdrop-blur-xl group/savings flex flex-col justify-center cursor-pointer shadow-lg transition-all duration-500`}
                        >
                            <div className="flex items-center gap-8 relative z-10 w-full h-full">
                                {/* Left Column: Core Stats (Locked Width) */}
                                <div className="md:w-48 flex-none space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 font-[family-name:var(--font-bruno-ace)]">
                                        <span>{t('Savings_Matrix')}</span>
                                        <motion.div
                                            animate={{ opacity: [1, 0.1, 1] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0"
                                        />
                                    </div>
                                    <div className="flex items-baseline gap-4 whitespace-nowrap">
                                        <p className="text-4xl font-black text-white italic tracking-tighter leading-none">
                                            {MARKET_METRICS.avgSavings}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold text-white/40 tracking-widest px-2 py-1 rounded">
                                            {t('exclusive_rebate')}
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
                                            className="flex-1 hidden md:flex flex-col gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
                                                <span className="text-[9px] font-black text-emerald-600/80 tracking-[0.2em] uppercase font-mono">
                                                    {t('Archive_03: Finance_Core')}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-white/50 font-medium leading-[1.6] max-w-[240px]">
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
                            className="group relative h-20 w-full max-w-sm flex items-center justify-center bg-transparent overflow-visible"
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
                                    stroke="#000"
                                    strokeWidth="1.5"
                                    strokeOpacity="0.3"
                                    className="group-hover:stroke-brand-primary/50 transition-colors"
                                />
                                <motion.rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    fill="transparent"
                                    rx="10"
                                    stroke="#FFD700"
                                    strokeWidth="2"
                                    strokeDasharray="100, 400"
                                    strokeDashoffset="0"
                                    animate={{ strokeDashoffset: -500 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                />
                            </svg>

                            <div className="relative z-10 flex items-center gap-4 text-xs font-black uppercase tracking-[0.4rem] text-white group-hover:text-brand-primary transition-colors font-[family-name:var(--font-bruno-ace)]">
                                <Search size={18} />
                                {t('Lock_Intro_Pricing')}
                            </div>

                            {/* magnetic hover pull (visual only via scale) */}
                            <div className="absolute inset-0 bg-brand-primary/5 rounded-xl scale-95 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
                        </Link>

                        <div className="hidden md:flex gap-12 opacity-30 text-[9px] font-mono tracking-widest text-white">
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
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/40 to-transparent z-40" />
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/40 to-transparent z-40" />
            </section>

            <section
                className={`${sectionViewportClass} ebook-section relative overflow-hidden bg-gradient-to-bl from-slate-100 via-white to-white transition-colors duration-500 flex flex-col items-center justify-center`}
            >
                <div className="max-w-[1440px] mx-auto px-6 relative z-10 w-full">
                    <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center">
                        {/* Left Column: Context (4/12) */}
                        <div className="col-span-12 lg:col-span-4 space-y-8 relative z-20">
                            <div>
                                <h2 className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs mb-4">
                                    {t('THE SYNDICATE')}
                                </h2>
                                <h1 className="text-4xl sm:text-6xl md:text-7xl xl:text-9xl font-extrabold italic uppercase tracking-[-0.05em] leading-[0.85] text-slate-900">
                                    {t('ELITE')}
                                    <br />
                                    {t('MAKERS')}
                                    <span className="text-brand-primary">.</span>
                                </h1>
                            </div>
                            <p className="text-slate-500 text-lg leading-relaxed max-w-sm">
                                {t(
                                    'A curated roster of engineering giants setting global standards. Seamless, elite performance across every brand.'
                                )}
                            </p>
                        </div>

                        {/* Right Column: 3D Cylindrical Monolith (8/12) — Desktop only */}
                        {
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
                                        {
                                            name: 'APRILIA',
                                            color: '#F80000',
                                            tagline: 'BE A RACER',
                                            mainModel: 'RS 457',
                                            startPrice: '4.10L',
                                        },
                                        {
                                            name: 'ATHER',
                                            color: '#10C25B',
                                            tagline: 'WARP SPEED',
                                            mainModel: '450X',
                                            startPrice: '1.25L',
                                        },
                                        {
                                            name: 'BAJAJ',
                                            color: '#005CAB',
                                            tagline: "THE WORLD'S FAVOURITE",
                                            mainModel: 'NS 400Z',
                                            startPrice: '1.85L',
                                        },
                                        {
                                            name: 'CHETAK',
                                            color: '#D4AF37',
                                            tagline: 'LEGEND REBORN',
                                            mainModel: 'Premium',
                                            startPrice: '1.35L',
                                        },
                                        {
                                            name: 'HERO',
                                            color: '#E11B22',
                                            tagline: 'RIDE THE FUTURE',
                                            mainModel: 'Mavrick',
                                            startPrice: '1.99L',
                                        },
                                        {
                                            name: 'HONDA',
                                            color: '#CC0000',
                                            tagline: 'POWER OF DREAMS',
                                            mainModel: 'City',
                                            startPrice: '11.8L',
                                        },
                                        {
                                            name: 'KTM',
                                            color: '#FF6600',
                                            tagline: 'READY TO RACE',
                                            mainModel: 'Duke 390',
                                            startPrice: '3.11L',
                                        },
                                        {
                                            name: 'SUZUKI',
                                            color: '#164194',
                                            tagline: 'WAY OF LIFE',
                                            mainModel: 'V-Strom sx',
                                            startPrice: '2.12L',
                                        },
                                        {
                                            name: 'TVS',
                                            color: '#1C3E8A',
                                            tagline: 'RACING DNA',
                                            mainModel: 'Apache RR',
                                            startPrice: '2.72L',
                                        },
                                        {
                                            name: 'VESPA',
                                            color: '#0097DA',
                                            tagline: 'LIVE MORE VESPA',
                                            mainModel: 'SXL 150',
                                            startPrice: '1.45L',
                                        },
                                        {
                                            name: 'VIDA',
                                            color: '#FF5722',
                                            tagline: 'MAKE WAY',
                                            mainModel: 'V1 Pro',
                                            startPrice: '1.26L',
                                        },
                                        {
                                            name: 'YAMAHA',
                                            color: '#183693',
                                            tagline: 'REVS YOUR HEART',
                                            mainModel: 'R15 V4',
                                            startPrice: '1.82L',
                                        },
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
                                                            ? 'shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-black/5'
                                                            : 'bg-slate-50/80 backdrop-blur-md text-slate-400 border border-slate-200'
                                                    }`}
                                                    style={{
                                                        transform:
                                                            isHovered && isAtFront
                                                                ? 'scale(1.2) translateZ(150px)'
                                                                : 'none',
                                                        backgroundColor:
                                                            isHovered && isAtFront ? brand.color : undefined,
                                                        backfaceVisibility: 'hidden',
                                                    }}
                                                >
                                                    {/* Ribbed Glass Texture Overlay (Only for inactive cards) */}
                                                    {(!isHovered || !isAtFront) && (
                                                        <div
                                                            className="absolute inset-0 opacity-[0.03] pointer-events-none z-10"
                                                            style={{
                                                                backgroundImage:
                                                                    'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 9px)',
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
                                                            <span className="text-4xl font-black uppercase italic tracking-tighter -rotate-90 whitespace-nowrap text-slate-900/30 transition-all duration-500 group-hover:text-slate-900/50">
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
                                                            <div className="text-slate-900/60">
                                                                <ArrowRight className="-rotate-45" size={24} />
                                                            </div>
                                                        </div>

                                                        {/* Center section: LARGE Hero Logo */}
                                                        <div className="flex-1 flex items-center justify-center relative">
                                                            {dbBrand?.brand_logos?.icon || dbBrand?.logo_svg ? (
                                                                <div
                                                                    className="w-48 h-48 flex items-center justify-center opacity-100 drop-shadow-[0_10px_30px_rgba(0,0,0,0.1)] [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: sanitizeSvg(
                                                                            dbBrand?.brand_logos?.icon ||
                                                                                dbBrand?.logo_svg ||
                                                                                ''
                                                                        ),
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="text-9xl font-black italic text-slate-900 drop-shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                                                                    {brand.name[0]}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Bottom section: Tagline & CTA */}
                                                        <div className="space-y-6">
                                                            {/* TRENDING MODEL SNIPPET (NEW) */}
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.3 }}
                                                                className="flex items-center gap-3 bg-black/5 p-2 rounded-xl border border-black/5"
                                                            >
                                                                <div className="w-10 h-10 bg-black/5 rounded-lg flex items-center justify-center">
                                                                    <Zap size={16} className="text-slate-900/60" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/40">
                                                                        Trending
                                                                    </span>
                                                                    <span className="text-xs font-black text-slate-900">
                                                                        {brand.mainModel} • From ₹{brand.startPrice}*
                                                                    </span>
                                                                </div>
                                                            </motion.div>

                                                            <div className="flex flex-col gap-1 text-slate-900">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 font-[family-name:var(--font-bruno-ace)]">
                                                                    {brand.tagline}
                                                                </span>
                                                                <div className="flex items-center gap-2 group/cta">
                                                                    <span className="text-sm font-black uppercase tracking-widest font-[family-name:var(--font-bruno-ace)] group-hover/cta:translate-x-2 transition-transform">
                                                                        Explore Lineup
                                                                    </span>
                                                                    <ArrowRight
                                                                        size={16}
                                                                        className="group-hover/cta:translate-x-2 transition-transform"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Brand Letter Watermark */}
                                                    <div
                                                        className={`absolute -right-4 top-1/2 -translate-y-1/2 text-[12rem] font-black italic uppercase select-none pointer-events-none transition-all duration-1000 ${
                                                            isHovered && isAtFront
                                                                ? 'text-black/[0.1] scale-100 opacity-100'
                                                                : 'text-black/[0.02] scale-110 opacity-0'
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
                        }

                        {/* Phone Brand Carousel */}
                        {false && (
                            <div className="col-span-12 mt-8">
                                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 px-1 no-scrollbar">
                                    {[
                                        { name: 'APRILIA', color: '#F80000' },
                                        { name: 'ATHER', color: '#10C25B' },
                                        { name: 'BAJAJ', color: '#005CAB' },
                                        { name: 'CHETAK', color: '#D4AF37' },
                                        { name: 'HERO', color: '#E11B22' },
                                        { name: 'HONDA', color: '#CC0000' },
                                        { name: 'KTM', color: '#FF6600' },
                                        { name: 'SUZUKI', color: '#164194' },
                                        { name: 'TVS', color: '#1C3E8A' },
                                        { name: 'VESPA', color: '#0097DA' },
                                        { name: 'VIDA', color: '#FF5722' },
                                        { name: 'YAMAHA', color: '#183693' },
                                    ].map(brand => {
                                        const dbBrand = brands?.find(b => b.name.toUpperCase() === brand.name);
                                        return (
                                            <Link
                                                key={brand.name}
                                                href={`/store/catalog?brand=${brand.name}`}
                                                className="snap-center flex-none w-[100px] flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all active:scale-95"
                                            >
                                                <div
                                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: brand.color + '20' }}
                                                >
                                                    {dbBrand?.brand_logos?.icon || dbBrand?.logo_svg ? (
                                                        <div
                                                            className="w-7 h-7 brightness-0 invert opacity-80 [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                                                            dangerouslySetInnerHTML={{
                                                                __html: sanitizeSvg(
                                                                    dbBrand?.brand_logos?.icon ||
                                                                        dbBrand?.logo_svg ||
                                                                        ''
                                                                ),
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-lg font-black text-white/80">
                                                            {brand.name[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-wider text-white/70">
                                                    {brand.name}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            {/* How it Works Section */}
            <section
                id="process"
                className={`${sectionViewportClass} ebook-section relative flex flex-col justify-start bg-white overflow-hidden`}
            >
                {/* Standardized 'Bottom-Up' Amber Soft Tint (Light Theme) */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-white opacity-100" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[80%] bg-[radial-gradient(circle_at_50%_100%,rgba(244,176,0,0.06),transparent_75%)]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-multiply" />
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
                                <h2 className="text-4xl sm:text-6xl md:text-7xl xl:text-9xl font-extrabold uppercase tracking-[-0.05em] italic leading-[0.85] text-slate-900 cursor-pointer group/text">
                                    {processHeadings.map((text, i) => (
                                        <div
                                            key={i}
                                            onMouseEnter={() => setActiveStep(i)}
                                            className={`transition-all duration-500 ease-out origin-left ${
                                                activeStep === i
                                                    ? 'text-slate-900 translate-x-4 scale-105'
                                                    : 'text-slate-300 hover:text-slate-400 hover:translate-x-2'
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
                                className="text-xl text-slate-500 font-medium leading-relaxed max-w-sm"
                            >
                                {t('Experience the future of ownership.')}
                                <br />
                                <span className="text-slate-900">{t('Seamless. Digital. Instant.')}</span>
                            </motion.p>
                        </div>

                        {/* Right Side: The Monolith Accordion */}
                        <div className={`col-span-12 lg:col-span-7 h-[60vh] flex ${''} gap-4`}>
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
                                    <div className={`absolute inset-0 p-8 flex flex-col justify-between`}>
                                        {/* Header */}
                                        <div
                                            className={`flex items-start w-full ${activeStep === i ? 'justify-between' : 'justify-center'}`}
                                        >
                                            <div
                                                className={`${activeStep === i ? 'text-brand-primary order-1' : 'text-zinc-600'}`}
                                            >
                                                {React.cloneElement(
                                                    item.icon as React.ReactElement<{ className?: string }>,
                                                    { className: 'w-8 h-8 md:w-12 md:h-12' }
                                                )}
                                            </div>
                                            {activeStep === i && (
                                                <span
                                                    className={`text-xl font-bold tracking-widest ${false && activeStep !== i ? 'text-white/50' : 'text-black'} order-2`}
                                                >
                                                    {item.step}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title — always visible on phone, vertical text on desktop inactive */}
                                        <div className="relative flex-1 flex flex-col justify-end">
                                            {!false && (
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
                                                    <span className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-white/40">
                                                        {item.title}
                                                    </span>
                                                </div>
                                            )}

                                            {false && activeStep !== i && (
                                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white/80">
                                                    {item.title}
                                                </h3>
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
                                                    <h3
                                                        className={`text-3xl sm:text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9]`}
                                                    >
                                                        {item.title}
                                                    </h3>
                                                    <p
                                                        className={`text-lg font-medium text-zinc-600 max-w-md leading-relaxed`}
                                                    >
                                                        {item.desc}
                                                    </p>

                                                    {/* Action Button Indicator */}
                                                    <div className="pt-4 flex items-center gap-3 text-brand-primary font-black uppercase tracking-widest text-xs">
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

            <section
                className={`${sectionViewportClass} ebook-section relative flex flex-col justify-start bg-white overflow-hidden`}
            >
                {/* Standardized 'Bottom-Up' Brand Soft Tint (Light Theme) */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-white opacity-100" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[80%] bg-[radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.08),transparent_75%)]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-multiply" />
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
                                    <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">
                                        {t('Curated Collections')}
                                    </p>
                                </div>
                                <h2 className="text-4xl sm:text-6xl md:text-7xl xl:text-9xl font-extrabold uppercase tracking-[-0.05em] italic leading-[0.85] text-slate-900">
                                    {t('Select')} <br /> {t('Your')} <br /> {t('Vibe')}
                                </h2>
                            </motion.div>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-sm">
                                {t('Find your perfect ride.')}
                                <br />
                                <span className="text-slate-900">{t('Scooter. Motorcycle. Moped.')}</span>
                            </p>
                        </div>

                        {/* Right Side: The Monolith Accordion */}
                        <div className={`col-span-12 lg:col-span-7 h-[60vh] flex flex-col lg:flex-row gap-4`}>
                            {CATEGORIES.map((cat, i) => (
                                <Link
                                    key={i}
                                    href={cat.link}
                                    onMouseEnter={() => setActiveVibe(i)}
                                    className={`group relative overflow-hidden rounded-[2rem] border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between ${
                                        activeVibe === i
                                            ? 'flex-[3] bg-white border-slate-200 shadow-[0_40px_100px_rgba(0,0,0,0.1)]'
                                            : 'flex-[1] bg-slate-50 border-slate-200 opacity-60 hover:opacity-100 hover:bg-slate-100'
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

                                                {/* Interactive Layout Container */}
                                                <div
                                                    className={`absolute inset-0 p-8 md:p-10 flex flex-col justify-between z-20`}
                                                >
                                                    {/* Top Header: Title & Meta */}
                                                    <div className="flex justify-between items-start w-full">
                                                        <div
                                                            className={`space-y-3 transition-opacity duration-500 ${activeVibe === i ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}
                                                        >
                                                            <div className="flex gap-2">
                                                                {features.slice(0, 2).map((f, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-900 border border-slate-200"
                                                                    >
                                                                        {f}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <h3
                                                                className={`text-3xl sm:text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-slate-900 leading-[0.9]`}
                                                            >
                                                                {title}
                                                            </h3>
                                                        </div>

                                                        {/* Icon Arrow */}
                                                        <ArrowRight
                                                            size={32}
                                                            className={`text-slate-900 transition-all duration-500 ${activeVibe === i ? '-rotate-45 group-hover:rotate-0 opacity-100' : 'opacity-50'}`}
                                                        />
                                                    </div>

                                                    {/* THE VEHICLE: Nested in flow between Title and Desc to fix overlap */}
                                                    <div
                                                        className={`flex-1 flex items-center justify-center transition-all duration-700 ease-out ${activeVibe === i ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} ${''}`}
                                                    >
                                                        <div className={`relative w-[65%] h-[65%] pointer-events-none`}>
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
                                                        <span className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-slate-900/30 whitespace-nowrap">
                                                            {title}
                                                        </span>
                                                    </div>

                                                    {/* Content Bottom (Active Only) */}
                                                    <div
                                                        className={`relative z-20 transition-all duration-700 delay-100 ${activeVibe === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                                                    >
                                                        <p
                                                            className={`text-sm md:text-base font-medium text-slate-500 leading-relaxed max-w-md`}
                                                        >
                                                            {desc}
                                                        </p>
                                                        <div
                                                            className={`mt-4 ${''} inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-colors cursor-pointer group/btn`}
                                                        >
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
            <div
                className={`ebook-section ${sectionViewportClass} relative flex flex-col justify-start bg-white overflow-hidden`}
            >
                {/* Standardized 'Bottom-Up' Sapphire Soft Tint (Light Theme) */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-white opacity-100" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[80%] bg-[radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.06),transparent_75%)]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-multiply" />
                </div>

                <div className="relative z-10 w-full h-full flex flex-col justify-start">
                    <RiderPulse />
                </div>
            </div>

            {/* Cinematic Sections */}
            <EliteCircle />

            {/* Integrated Footer as Last Section */}
            <div className={`ebook-section ${sectionViewportClass} bg-black transition-colors duration-500`}>
                <Footer />
            </div>
        </div>
    );
}
