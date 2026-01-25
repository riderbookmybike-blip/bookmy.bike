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

    // Protocol Section Visual Hooks
    const [activeStep, setActiveStep] = useState(0);

    // Categories Section Visual Hooks
    const [activeVibe, setActiveVibe] = useState(1); // Default to center (Motorcycles/Racing)




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

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
            document.documentElement.classList.remove('scrollbar-hide', 'overflow-y-auto');
        };
    }, []);

    return (
        <div className="flex flex-col pb-0 transition-colors duration-300">
            {/* Premium Photography Hero Section */}
            <section
                className="relative flex flex-col justify-start h-screen ebook-section overflow-hidden bg-white dark:bg-[#0b0d10] isolate transition-colors duration-500 pt-[var(--header-h)]"
            >
                <div className="absolute inset-0 z-0 pointer-events-none bg-slate-950 transition-all duration-700">
                    <img
                        src={heroImage}
                        alt="BookMyBike Hero"
                        className="w-full h-full object-cover object-center opacity-90 dark:opacity-60 animate-in fade-in duration-700"
                    />
                    {/* Deep Cinematic Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 mix-blend-multiply" />
                </div>

                <div className="relative z-10 w-full flex flex-col justify-between pb-20 max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 mt-12">
                    {/* 1. Top Section: Title & Content (Breathing Space) */}
                    <div className="flex flex-col justify-center items-center w-full text-center">
                        <style jsx>{`
                            @keyframes shimmer {
                                0% {
                                    transform: translateX(-150%) skewX(-12deg);
                                }
                                20% {
                                    transform: translateX(250%) skewX(-12deg);
                                }
                                100% {
                                    transform: translateX(250%) skewX(-12deg);
                                }
                            }
                        `}</style>

                        {/* Confidence Chip Badge - Premium Black Fill */}
                        <div className="relative inline-flex items-center gap-2 px-6 py-3 bg-black/80 backdrop-blur-md text-white rounded-full text-[12px] font-black uppercase tracking-[0.25em] mb-[10px] md:mb-[12px] shadow-2xl shadow-black/50 overflow-hidden group border border-white/10">
                            <span className="relative z-10">India&apos;s Lowest EMI Guarantee</span>

                            {/* Micro-Shimmer Overlay */}
                            <div
                                className="absolute inset-0 z-0 pointer-events-none"
                                style={{
                                    background:
                                        'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                                    width: '60%',
                                    height: '100%',
                                    animation: 'shimmer 8s infinite linear',
                                    opacity: 0.3,
                                }}
                            />
                        </div>

                        <h1 className="pb-[16px] md:pb-[20px] font-black uppercase tracking-tighter leading-[0.9] text-center">
                            {/* Top: "Redefining" - Medium Strong */}
                            <span className="block text-3xl sm:text-4xl md:text-5xl text-white font-extrabold tracking-[0.15em] mb-[6px] md:mb-[8px] drop-shadow-lg">
                                Redefining
                            </span>

                            {/* Middle: "How India Buys" - Large */}
                            <span className="block text-5xl sm:text-6xl md:text-7xl text-white mb-[12px] md:mb-[14px] drop-shadow-xl tracking-normal">
                                How India Buys
                            </span>

                            {/* Bottom: "Motorcycles" - Pure White */}
                            <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8rem] text-white drop-shadow-2xl scale-y-110 origin-bottom tracking-tight">
                                Motorcycles
                            </span>
                        </h1>
                    </div>

                    {/* 2. Middle Section: Search (Centered between Title and Stats) - Mobile Psychology Adjustments */}
                    <div className="w-full max-w-2xl mx-auto relative z-50 flex items-center justify-center mt-[20px] md:mt-[24px]">
                        <Link
                            href="/store/catalog"
                            className="h-[52px] md:h-16 w-full max-w-xl px-12 bg-white text-black rounded-full flex items-center justify-center gap-4 hover:bg-slate-100 transition-all duration-300 shadow-2xl shadow-black/50 hover:scale-[1.02]"
                        >
                            <Search size={22} className="opacity-60" />
                            <span className="text-base font-medium md:font-bold uppercase tracking-[0.2em]">
                                Check EMI & bikes
                            </span>
                        </Link>
                    </div>

                    {/* Metrics Section - Premium Glass Effect - Pushed to Bottom */}
                    <div className="w-full max-w-5xl mx-auto grid grid-cols-3 gap-4 md:gap-0 border border-white/10 transition-all duration-500 py-6 mt-[20px] md:mt-[32px] bg-zinc-950/40 backdrop-blur-xl rounded-full mb-4 shadow-2xl shadow-black/50">
                        <div className="text-center group cursor-default space-y-1">
                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">
                                Models
                            </p>
                            <p className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                                {totalSkus}+
                            </p>
                        </div>
                        <div className="text-center group cursor-default space-y-1 relative">
                            <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-white/10" />
                            <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-white/10" />
                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">
                                Avg Savings
                            </p>
                            <p className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                                {MARKET_METRICS.avgSavings}
                            </p>
                        </div>
                        <div className="text-center group cursor-default space-y-1">
                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1">
                                Delivery
                            </p>
                            <p className="text-3xl md:text-4xl font-black text-white tracking-tight underline cursor-pointer decoration-brand-primary/50 hover:decoration-brand-primary decoration-4 underline-offset-4 transition-all drop-shadow-sm">
                                {MARKET_METRICS.deliveryTime}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="min-h-screen ebook-section flex flex-col justify-start bg-[#0b0d10] transition-colors relative overflow-hidden group/brand-sec pt-[var(--header-h)]">
                <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 relative z-10 w-full h-full flex flex-col justify-center">
                    {/* Header: The Syndicate */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">
                                    The Syndicate
                                </p>
                            </div>
                            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-white drop-shadow-2xl">
                                Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-600">Makers.</span>
                            </h2>
                        </div>
                        <p className="text-right text-lg text-zinc-500 font-medium max-w-sm border-r-2 border-white/10 pr-6">
                            A curated roster of engineering giants setting global standards.
                        </p>
                    </div>

                    {/* The Power Cell Grid / Stripes */}
                    <div className="w-full border-t border-l border-white/10 bg-[#0b0d10] relative grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row lg:h-[70vh]">
                        {/* Background Grid Pattern - Restricted to Grid Area */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#ffffff05,transparent)] pointer-events-none" />
                        {/* Corner Accents */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-brand-primary z-20" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-brand-primary z-20" />

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
                        ].map((brand, i) => (
                            <Link
                                key={brand.name}
                                href={`/store/catalog?brand=${brand.name}`}
                                onMouseEnter={() => setHoveredBrand(brand.name)}
                                onMouseLeave={() => setHoveredBrand(null)}
                                className="group/cell relative border-r border-b lg:border-b-0 border-white/10 overflow-hidden hover:bg-white/[0.02] transition-all duration-500
                                bg-[#0b0d10] z-10
                                h-[220px] md:h-[280px] lg:h-auto
                                flex flex-col lg:flex-row lg:justify-center lg:items-center
                                p-8 md:p-10 lg:p-0
                                lg:flex-1 lg:hover:grow-[2] lg:hover:w-[300px]"
                            >
                                {/* Active Glow Border */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 transition-all duration-500 z-0 pointer-events-none"
                                    style={{
                                        boxShadow: `inset 0 0 40px ${brand.color}20`
                                    }}
                                />
                                <div
                                    className="absolute top-0 left-0 w-full h-[2px] lg:w-[2px] lg:h-full scale-x-0 lg:scale-x-100 lg:scale-y-0 group-hover/cell:scale-x-100 lg:group-hover/cell:scale-y-100 transition-transform duration-500 origin-left lg:origin-top z-10"
                                    style={{ backgroundColor: brand.color }}
                                />
                                <div
                                    className="absolute bottom-0 right-0 w-[2px] h-full lg:w-full lg:h-[2px] scale-y-0 lg:scale-y-100 lg:scale-x-0 group-hover/cell:scale-y-100 lg:group-hover/cell:scale-x-100 transition-transform duration-500 origin-bottom lg:origin-right z-10"
                                    style={{ backgroundColor: brand.color }}
                                />

                                {/* Mobile: Top Utility Labels */}
                                <div className="relative z-10 flex justify-between items-start lg:hidden">
                                    <span className="text-[10px] font-mono text-zinc-600 group-hover/cell:text-white transition-colors">
                                        CELL_{String(i + 1).padStart(2, '0')}
                                    </span>
                                    <ArrowRight
                                        size={20}
                                        className="text-zinc-700 -rotate-45 group-hover/cell:text-white group-hover/cell:rotate-0 transition-all duration-500"
                                        style={{ color: hoveredBrand === brand.name ? brand.color : undefined }}
                                    />
                                </div>

                                {/* Main Content */}
                                <div className="relative z-10 overflow-hidden flex flex-col lg:items-center lg:justify-center lg:w-full lg:h-full">

                                    {/* Desktop: Tagline Reveal (Vertical Mode) */}
                                    <div className="hidden lg:block absolute top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-500 delay-100 whitespace-nowrap">
                                        <p
                                            className="text-[10px] font-black uppercase tracking-[0.3em]"
                                            style={{ color: brand.color }}
                                        >
                                            {brand.tagline}
                                        </p>
                                    </div>

                                    {/* Mobile: Tagline Slide-in */}
                                    <div className="lg:hidden h-0 group-hover/cell:h-auto overflow-hidden transition-all duration-500 mb-2">
                                        <p
                                            className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] whitespace-nowrap translate-y-10 group-hover/cell:translate-y-0 transition-transform duration-500 delay-100"
                                            style={{ color: brand.color }}
                                        >
                                            {brand.tagline}
                                        </p>
                                    </div>

                                    {/* Kinetic Text Effect */}
                                    <h3
                                        className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-zinc-800 group-hover/cell:text-white transition-colors duration-300 leading-[0.8]
                                        lg:-rotate-90 lg:whitespace-nowrap lg:text-7xl xl:text-8xl lg:origin-center"
                                    >
                                        {brand.name}
                                    </h3>
                                </div>

                                {/* Background Brand Text (Watermark) */}
                                <div
                                    className="absolute -right-4 -bottom-4 text-[8rem] font-black italic uppercase text-white/[0.02] tracking-tighter leading-none select-none pointer-events-none group-hover/cell:scale-110 group-hover/cell:text-white/[0.05] transition-all duration-700 ease-out
                                    lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rotate-0"
                                >
                                    {brand.name[0]}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            {/* How it Works Section */}
            {/* How it Works Section */}
            <section className="h-screen ebook-section relative overflow-hidden bg-[#0b0d10] text-white pt-[var(--header-h)] flex flex-col justify-start">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#FFD700,transparent_70%)]" />
                </div>



                <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 relative z-10 h-full flex flex-col justify-center">
                    <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center h-full">
                        {/* Left Side: Static Context */}
                        <div className="col-span-12 lg:col-span-4 space-y-8 relative z-20">
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
                                <h2 className="text-6xl xl:text-8xl font-black uppercase tracking-tighter italic leading-[0.85] text-white cursor-pointer group/text">
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
                        <div className="col-span-12 lg:col-span-8 h-[60vh] flex gap-4">
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
                                        : 'flex-[1] bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10'
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

                <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 relative z-10 h-full flex flex-col justify-center">
                    <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center h-full">
                        {/* Left Side: Static Context (Mirrors Process Section) */}
                        <div className="col-span-12 lg:col-span-4 space-y-8 relative z-20">
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
                                <h2 className="text-6xl xl:text-8xl font-black uppercase tracking-tighter italic leading-[0.85] text-white">
                                    Select <br /> Your <br /> Vibe
                                </h2>
                            </motion.div>
                            <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-sm">
                                Find your perfect ride. <br />
                                <span className="text-white">Scooter. Motorcycle. Moped.</span>
                            </p>
                        </div>

                        {/* Right Side: The Monolith Accordion */}
                        <div className="col-span-12 lg:col-span-8 h-[60vh] flex flex-col lg:flex-row gap-4">
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
            <div className="ebook-section h-screen flex flex-col justify-start pt-[var(--header-h)] bg-[#0b0d10]">
                <RiderPulse />
            </div>

            {/* Integrated Footer as Last Section */}
            <div className="ebook-section h-screen pt-[var(--header-h)] bg-[#0b0d10]">
                <Footer />
            </div>
        </div >
    );
}
