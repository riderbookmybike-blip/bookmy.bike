'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, MapPin, ArrowRight, Star, Quote, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { MARKET_METRICS } from '@/config/market';
import { PhoneHeader } from '@/components/phone/layout/PhoneHeader';
import { PhoneBottomNav } from '@/components/phone/layout/PhoneBottomNav';
import { Footer as PhoneFooter } from '@/components/store/Footer';
import { PhoneContextFeed } from '@/components/phone/catalog/PhoneContextFeed';
import { PhoneSearch } from '@/components/phone/catalog/PhoneSearch';
import { Logo } from '@/components/brand/Logo';
import { EliteCircle } from '@/components/store/sections/EliteCircle';

import { useTheme } from '@/components/providers/ThemeProvider';
import { useI18n } from '@/components/providers/I18nProvider';

/**
 * Mobile V2 Home Page
 * Hybrid implementation: Desktop high-fidelity Hero + Mobile-optimized sections.
 * Standardized padding: px-6 (aligns with AppHeaderShell)
 */
export function PhoneHome() {
    const { items, skuCount } = useSystemCatalogLogic();
    const { brands } = useSystemBrandsLogic();
    const { theme } = useTheme();
    const { t } = useI18n();
    const [hasMounted, setHasMounted] = useState(false);

    React.useEffect(() => {
        setHasMounted(true);
        // Reset scroll on mount
        window.scrollTo(0, 0);
    }, []);

    const heroImage = '/images/templates/t3_night.png';

    // Standard horizontal padding matching header
    const SIDE_PADDING = "px-5";

    // Gyroscope Parallax Effect for Mobile
    const [permissionGranted, setPermissionGranted] = useState(false);

    React.useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (!event.gamma || !event.beta) return;

            // Clamp values
            const x = Math.min(Math.max(event.gamma, -45), 45);
            const y = Math.min(Math.max(event.beta, -45), 45) - 30;

            // Map values
            const xPct = ((x + 45) / 90) * 100;
            const xPx = x * 1.5;
            const yPx = y * 1.5;

            requestAnimationFrame(() => {
                document.documentElement.style.setProperty('--hyper-x', `${xPx}px`);
                document.documentElement.style.setProperty('--hyper-y', `${yPx}px`);
                document.documentElement.style.setProperty('--mouse-x-pct', `${xPct}%`);
            });
        };

        if (permissionGranted) {
            window.addEventListener('deviceorientation', handleOrientation);
        } else if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
            // Non-iOS 13+ (Android)
            window.addEventListener('deviceorientation', handleOrientation);
            setPermissionGranted(true);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [permissionGranted]);

    const requestMotionPermission = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceOrientationEvent as any).requestPermission();
                if (permissionState === 'granted') {
                    setPermissionGranted(true);
                }
            } catch (e) {
                console.error("Motion permission error:", e);
            }
        } else {
            setPermissionGranted(true);
        }
    };

    return (
        <div className="flex flex-col bg-white dark:bg-black text-slate-900 dark:text-white overflow-x-hidden pb-20 md:pb-0 transition-colors duration-500">
            {/* Mobile Header (Hamburger & Logo) */}
            <PhoneHeader />

            {/* THE ACTUAL DESKTOP HERO - REFINED FOR MOBILE VIEWPORT */}
            <section
                className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-900/60 via-[#0b0d10] to-[#0b0d10] dark:from-rose-950/80 dark:via-black dark:to-black isolate flex flex-col items-center justify-center p-0 transition-colors duration-500"
                onClick={requestMotionPermission}
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
                    <motion.div
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1.1, opacity: 0.4 }}
                        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 w-full h-full will-change-transform"
                        style={{
                            transform: 'translate(calc(var(--hyper-x) * -0.2), calc(var(--hyper-y) * -0.2))',
                        }}
                    >
                        <img
                            src={heroImage}
                            alt="Tunnel"
                            className="w-full h-full object-cover grayscale contrast-125"
                        />
                    </motion.div>

                    <div className="absolute inset-0 bg-amber-500/10 dark:bg-black/40 z-20 transition-colors" />

                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:120px_120px] z-30 opacity-40 mix-blend-overlay transition-all"
                        style={{
                            transform: 'translate(calc(var(--hyper-x) * 0.4), calc(var(--hyper-y) * 0.4))',
                        }}
                    />

                    <div className="absolute inset-x-[15vw] inset-y-[15vh] z-40">
                        {hasMounted &&
                            [...Array(15)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        x: (i * 7) % 100 + '%',
                                        y: ((i * 11) % 100) + '%',
                                        opacity: 0,
                                    }}
                                    animate={{ y: [null, '-20%', '120%'], opacity: [0, 0.4, 0] }}
                                    transition={{
                                        duration: 8 + (i % 5) * 3,
                                        repeat: Infinity,
                                        delay: i % 10,
                                    }}
                                    className="absolute w-[1px] h-[30px] bg-brand-primary"
                                />
                            ))}
                    </div>
                </div>

                {/* CENTER CONTENT: ALIGNED & VIEWPORT SAFE */}
                <div className={`relative z-50 w-full flex flex-col items-center ${SIDE_PADDING} pt-6`}>
                    {/* circular telemetry badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: 'circOut' }}
                        className="mb-8 md:mb-16 relative flex items-center justify-center w-56 h-56 md:w-80 md:h-80"
                    >
                        {/* Rotating text ring (Clockwise) */}
                        <motion.svg
                            viewBox="0 0 100 100"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                        >
                            <defs>
                                <path id="circlePath" d="M 50, 50 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" />
                            </defs>
                            <text
                                className="text-[8.5px] font-black uppercase tracking-[0.6em] fill-slate-900 dark:fill-white font-[family-name:var(--font-bruno-ace)] transition-colors"
                                style={{ opacity: 0.95 }}
                            >
                                <textPath href="#circlePath" startOffset="0%" textLength="262" lengthAdjust="spacingAndGlyphs">
                                    INDIA&apos;S LOWEST EMI GUARANTEE *&nbsp;
                                </textPath>
                            </text>
                        </motion.svg>

                        {/* Central HUD Core */}
                        <div className="relative z-10 w-24 h-24 md:w-36 md:h-36 rounded-full bg-transparent border border-white/20 backdrop-blur-3xl flex flex-col items-center justify-center group/tele shadow-[0_0_60px_rgba(0,0,0,0.8)] hover:border-brand-primary/50 transition-all overflow-hidden scale-110">
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] pointer-events-none"
                            />

                            <div className="z-10 scale-90 md:scale-110 group-hover:scale-100 transition-transform duration-500 brightness-110">
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

                    <div className="relative flex flex-col items-center mb-10 select-none w-full text-center">
                        <motion.div
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2, ease: 'circOut' }}
                            className="flex flex-col items-center text-center"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 dark:text-white/30 leading-none mb-2">THE</span>
                            <span className="text-sm font-black uppercase tracking-[0.4em] text-slate-600 dark:text-white/80 leading-none mb-2">HIGHEST FIDELITY</span>
                            <span className="text-2xl font-black italic uppercase tracking-[0.2em] text-brand-primary leading-none">MARKETPLACE</span>
                        </motion.div>

                        <div className="relative group/title w-full max-w-full px-4 text-center">
                            <motion.h1
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                className="relative text-[clamp(1.5rem,8.5vw,3.5rem)] md:text-8xl lg:text-[clamp(4rem,12vw,9.5rem)] font-black italic uppercase tracking-[-0.04em] leading-none text-transparent bg-clip-text bg-[linear-gradient(110deg,#1e293b_0%,#475569_40%,#ff9d00_50%,#475569_60%,#1e293b_100%)] dark:bg-[linear-gradient(110deg,#fff_0%,#fff_40%,#ff9d00_50%,#fff_60%,#fff_100%)] bg-[size:200%_100%] transition-all duration-1000 font-[family-name:var(--font-bruno-ace)]"
                                style={{
                                    textShadow: theme === 'dark' ? '0 20px 50px rgba(0,0,0,0.5)' : 'none',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundPositionX: 'calc(100% - var(--mouse-x-pct))',
                                }}
                            >
                                MOTORCYCLES
                            </motion.h1>

                            <motion.div
                                animate={{ top: ['-20%', '120%'], opacity: [0, 1, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                className="absolute left-0 right-0 h-[30%] bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent z-10 pointer-events-none"
                            />
                        </div>

                        {/* INITIALIZE MARKETPLACE CTA (RESTORED FROM DESKTOP) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.8 }}
                            className="mt-6 flex flex-col items-center gap-6 w-full px-4"
                        >
                            <Link
                                href="/phone/store/catalog"
                                className="group relative h-14 w-full max-w-[320px] flex items-center justify-center bg-transparent overflow-visible"
                            >
                                <svg className="absolute inset-0 w-full h-full overflow-visible">
                                    <rect
                                        x="0" y="0" width="100%" height="100%"
                                        fill="transparent" rx="8"
                                        stroke="currentColor" strokeWidth="1" strokeOpacity="0.1"
                                        className="text-slate-900 dark:text-white group-hover:stroke-brand-primary/50 transition-colors"
                                    />
                                    <motion.rect
                                        x="0" y="0" width="100%" height="100%"
                                        fill="transparent" rx="8"
                                        stroke="#ff9d00" strokeWidth="2"
                                        strokeDasharray="80, 240"
                                        strokeDashoffset="0"
                                        animate={{ strokeDashoffset: -320 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    />
                                </svg>
                                <div className="relative z-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors font-[family-name:var(--font-bruno-ace)]">
                                    <Search size={18} className="text-[#ff9d00]" />
                                    Search Your Bike
                                </div>
                            </Link>

                            <div className="flex gap-6 opacity-30 text-[7px] font-mono tracking-widest whitespace-nowrap overflow-hidden text-slate-500 dark:text-white">
                                <span className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 bg-current rounded-full" /> SECURE_LINK: ENABLED
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 bg-current rounded-full" /> HAPTIC: ACTIVE
                                </span>
                                <span className="underline text-[8px]">v2.7_STABLE_DYNAMIC</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* BOTTOM CONTENT: COMPACT METRICS ROW */}
                <div className={`absolute bottom-6 md:bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-8 ${SIDE_PADDING}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="flex flex-row items-start justify-center gap-4 md:gap-16 w-full max-w-xl mx-auto"
                    >
                        {/* 01: SKU Live */}
                        <div className="flex flex-col items-center gap-2 min-w-[90px]">
                            <div className="flex items-center gap-1.5 opacity-80">
                                <span className="text-[9px] md:text-[11px] font-black text-white tracking-[0.25em] uppercase whitespace-nowrap">
                                    {t('LIVE MODELS')}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-3xl md:text-5xl font-black italic text-white tracking-tighter leading-none">
                                    {skuCount}+
                                </span>
                                <span className="text-[9px] md:text-[11px] font-bold text-white/50 tracking-widest lowercase border-t border-white/10 pt-1 w-full text-center">
                                    {t('active_sourcing')}
                                </span>
                            </div>
                        </div>

                        <div className="h-12 md:h-20 w-px bg-white/5 mt-4 opacity-50" />

                        {/* 02: Inventory Sync */}
                        <div className="flex flex-col items-center gap-2 min-w-[110px]">
                            <div className="flex items-center gap-1.5 opacity-80">
                                <span className="text-[9px] md:text-[11px] font-black text-white tracking-[0.25em] uppercase whitespace-nowrap">
                                    {t('REAL-TIME STOCK')}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-3xl md:text-5xl font-black italic text-white tracking-tighter leading-none">
                                    {MARKET_METRICS.deliveryTime}
                                </span>
                                <span className="text-[9px] md:text-[11px] font-bold text-white/50 tracking-widest lowercase border-t border-white/10 pt-1 w-full text-center">
                                    {t('logistics_flow')}
                                </span>
                            </div>
                        </div>

                        <div className="h-12 md:h-20 w-px bg-white/5 mt-4 opacity-50" />

                        {/* 03: Savings Calc */}
                        <div className="flex flex-col items-center gap-2 min-w-[90px]">
                            <div className="flex items-center gap-1.5 opacity-80">
                                <span className="text-[9px] md:text-[11px] font-black text-white tracking-[0.25em] uppercase whitespace-nowrap">
                                    {t('AVG. SAVINGS')}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-3xl md:text-5xl font-black italic text-white tracking-tighter leading-none">
                                    {MARKET_METRICS.avgSavings}
                                </span>
                                <span className="text-[9px] md:text-[11px] font-bold text-white/50 tracking-widest lowercase border-t border-white/10 pt-1 w-full text-center">
                                    {t('dealer_rebate')}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex flex-col items-center gap-4 opacity-40">
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] text-white transition-colors">{t('Scroll to Explore')}</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-px h-8 md:h-12 bg-gradient-to-b from-brand-primary to-transparent"
                        />
                    </div>
                </div>
            </section>

            {/* RESTORED MOBILE SECTIONS - ALL ALIGNED WITH px-6 */}

            {/* Brands Section */}
            <section className={`bg-slate-50 dark:bg-gradient-to-bl dark:from-orange-800/20 dark:via-[#0b0d10] dark:to-[#0b0d10] py-16 ${SIDE_PADDING} transition-colors duration-500`}>
                <div className="mb-12">
                    <h2 className="text-slate-400 dark:text-zinc-500 font-black uppercase tracking-[0.3em] text-xs mb-4">{t('THE SYNDICATE')}</h2>
                    <h1 className="text-5xl font-extrabold italic uppercase tracking-tight leading-tight text-slate-900 dark:text-white transition-colors">{t('ELITE')}<br />{t('MAKERS')}<span className="text-brand-primary">.</span></h1>
                </div>

                <div className="relative -mx-6 px-6 overflow-hidden">
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
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
                        ].map((brand) => {
                            const dbBrand = brands?.find(b => b.name.toUpperCase() === brand.name.toUpperCase());
                            return (
                                <motion.div key={brand.name} className="flex-none w-64 snap-center" whileTap={{ scale: 0.95 }}>
                                    <Link href={`/phone/store/catalog?brand=${brand.name}`} className="block h-80 p-6 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-xl relative overflow-hidden group shadow-sm dark:shadow-none transition-all" style={{ background: hasMounted && theme === 'dark' ? `linear-gradient(135deg, ${brand.color}10 0%, #18181b 50%)` : undefined }}>
                                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: brand.color }} />
                                        <div className="relative h-full flex flex-col justify-between">
                                            <div className="flex justify-end">
                                                <ArrowRight className="text-white/20 group-hover:text-white/80 transition-all -rotate-45" size={18} />
                                            </div>
                                            <div className="flex-1 flex items-center justify-center">
                                                {dbBrand?.brand_logos?.icon || dbBrand?.logo_svg ? (
                                                    <div className="w-24 h-24 flex items-center justify-center dark:brightness-0 dark:invert opacity-60 group-hover:opacity-100 transition-opacity [&>svg]:w-full [&>svg]:h-full [&>svg]:block" dangerouslySetInnerHTML={{ __html: dbBrand?.brand_logos?.icon || dbBrand?.logo_svg || '' }} />
                                                ) : (
                                                    <span className="text-5xl font-black italic text-slate-200 dark:text-white/40">{brand.name[0]}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black italic uppercase text-slate-900 dark:text-white transition-colors">{brand.name}</h3>
                                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30 transition-colors">{brand.tagline}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className={`bg-white dark:bg-gradient-to-tr dark:from-amber-700/20 dark:via-[#0b0d10] dark:to-[#0b0d10] py-16 border-t border-slate-100 dark:border-white/5 ${SIDE_PADDING} transition-colors duration-500`}>
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-px bg-brand-primary" />
                        <p className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">{t('The Process')}</p>
                    </div>
                    <h2 className="text-5xl font-extrabold uppercase tracking-tight italic leading-tight text-slate-900 dark:text-white transition-colors">{t('Select.')}<br />{t('Quote.')}<br />{t('Ride.')}</h2>
                </div>

                <div className="space-y-6">
                    {[
                        { step: '01', title: 'Select', desc: 'Browse 380+ premium motorcycles across 12 elite brands.', icon: Search },
                        { step: '02', title: 'Quote', desc: 'Get instant on-road pricing with our Lowest EMI Guarantee.', icon: Zap },
                        { step: '03', title: 'Ride', desc: 'Complete paperwork online. Asset delivery in 4 hours.', icon: MapPin },
                    ].map((item, index) => (
                        <motion.div key={item.step} className="relative flex gap-6">
                            <div className="flex-none flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                                    <span className="text-xl font-black text-brand-primary">{item.step}</span>
                                </div>
                                {index < 2 && <div className="w-px flex-1 bg-slate-200 dark:bg-white/10 my-4" />}
                            </div>
                            <div className="flex-1 pb-8">
                                <h3 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white mb-2 transition-colors">{t(item.title)}</h3>
                                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed transition-colors">{t(item.desc)}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Categories Section */}
            <section className={`bg-slate-50 dark:bg-gradient-to-tr dark:from-emerald-800/20 dark:via-[#0b0d10] dark:to-black py-16 transition-colors duration-500 ${SIDE_PADDING}`}>
                <div className="mb-12">
                    <p className="text-xs font-black text-slate-400 dark:text-white uppercase tracking-[0.2em] mb-4">{t('Curated Collections')}</p>
                    <h2 className="text-5xl font-extrabold uppercase italic text-slate-900 dark:text-white mb-4 transition-colors">{t('Select')}<br />{t('Your')}<br />{t('Vibe')}</h2>
                </div>

                <div className="space-y-4">
                    {[
                        { title: 'Scooters', icon: 'SC', link: '/phone/store/catalog?category=SCOOTER', bg: 'from-violet-500/10' },
                        { title: 'Motorcycles', icon: 'MC', link: '/phone/store/catalog?category=MOTORCYCLE', bg: 'from-rose-500/10' },
                        { title: 'Mopeds', icon: 'MP', link: '/phone/store/catalog?category=MOPED', bg: 'from-amber-500/10' },
                    ].map((cat) => (
                        <Link key={cat.title} href={cat.link} className={`block relative p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 bg-gradient-to-br ${cat.bg} to-transparent overflow-hidden group shadow-sm dark:shadow-none transition-all`}>
                            <div className="flex justify-between items-center relative z-10">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-white/30 tracking-[0.3em] uppercase transition-colors">{t('Most Popular')}</span>
                                    <h3 className="text-3xl font-black italic uppercase text-slate-900 dark:text-white transition-colors">{t(cat.title)}</h3>
                                </div>
                                <ArrowRight className="text-slate-200 dark:text-white/20 group-hover:text-brand-primary transition-all -rotate-45 group-hover:rotate-0" size={24} />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Rider Pulse */}
            <section className={`bg-white dark:bg-gradient-to-br dark:from-blue-900/20 dark:via-[#0b0d10] dark:to-[#0b0d10] py-16 transition-colors duration-500 ${SIDE_PADDING}`}>
                <div className="mb-12">
                    <h2 className="text-5xl font-black uppercase italic text-slate-900 dark:text-white mb-4 transition-colors">{t('Rider')}<br /><span className="text-brand-primary">{t('Pulse.')}</span></h2>
                    <p className="text-sm text-slate-400 dark:text-zinc-500 border-l border-slate-200 dark:border-white/10 pl-4 transition-colors">{t('Real stories. Real roads.')}</p>
                </div>
                <div className="relative -mx-6 px-6 overflow-hidden">
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                        {[
                            { name: 'Arjun Kapoor', quote: 'Booking my bike online was as easy as ordering food. EMI comparison saved me from 5 showrooms.' },
                            { name: 'Meera Reddy', quote: 'The transparency is what I loved. No hidden costs, everything upfront. Delivery was right on time.' },
                            { name: 'Karan Malhotra', quote: 'Finally a platform that understands riders. The EMI tool saved me so much time and money.' },
                        ].map((review) => (
                            <div key={review.name} className="flex-none w-72 snap-center p-8 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/5 rounded-3xl transition-colors">
                                <Quote className="text-brand-primary/20 mb-6" size={32} />
                                <p className="text-base font-bold italic leading-tight mb-8 text-slate-900 dark:text-white transition-colors">"{t(review.quote)}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center font-black text-brand-primary text-xs">
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.name}`}
                                            alt={review.name}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white transition-colors">{review.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Elite Circle */}
            <EliteCircle />

            {/* Desktop Footer (Rich experience preserved) */}
            <PhoneFooter />

            {/* Bottom HUD Navigation */}
            <PhoneBottomNav />
        </div>
    );
}
