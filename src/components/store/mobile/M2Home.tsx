'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    ChevronRight,
    ArrowRightLeft,
    Zap,
    Shield,
    Clock,
    Star,
    MapPin,
    Bike,
    Sparkles,
    Check,
    Phone,
    TrendingUp,
    Users,
    Award,
    ChevronDown,
} from 'lucide-react';

import { CATEGORIES, MARKET_METRICS } from '@/config/market';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { sanitizeSvg } from '@/lib/utils/sanitizeSvg';

import { useAuth } from '@/components/providers/AuthProvider';
import { coinsNeededForPrice } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import { selectTrendingModels } from '@/lib/store/trending';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { useOClubWallet } from '@/hooks/useOClubWallet';
import { ProductCard } from '../desktop/ProductCard';
import { CompactProductCard } from './CompactProductCard';

/* ────────── Palette ────────── */
const GOLD = '#FFD700';
const GOLD_INT = '#F4B000';

/* ────────── Brand Color Map ────────── */
const BRAND_COLORS: Record<string, string> = {
    APRILIA: '#F80000',
    ATHER: '#10C25B',
    BAJAJ: '#005CAB',
    CHETAK: '#D4AF37',
    HERO: '#E11B22',
    HONDA: '#CC0000',
    KTM: '#FF6600',
    SUZUKI: '#164194',
    TVS: '#1C3E8A',
    VESPA: '#0097DA',
    VIDA: '#FF5722',
    YAMAHA: '#183693',
    'ROYAL ENFIELD': '#C63733',
    TRIUMPH: '#000000',
};

/* ────────── Spring configs ────────── */
const springBounce = { type: 'spring' as const, stiffness: 200, damping: 25 };

/* ────────── Trust badges ────────── */
const TRUST_BADGES = [
    { icon: Shield, label: 'Zero\nHidden Charges', color: 'text-emerald-400', bg: 'from-emerald-500/20' },
    { icon: Zap, label: 'Instant\nOn-Road Price', color: 'text-amber-400', bg: 'from-amber-500/20' },
    { icon: Clock, label: '4-Hour\nDoorstep Delivery', color: 'text-violet-400', bg: 'from-violet-500/20' },
    { icon: Award, label: 'Lowest\nEMI Guarantee', color: 'text-rose-400', bg: 'from-rose-500/20' },
];

/* ────────── Social proof data ────────── */
const TESTIMONIALS = [
    {
        name: 'Rahul M.',
        city: 'Pune',
        text: 'Got my Activa 6G delivered in 3 hours. On-road price was exactly what they showed — no surprises.',
        rating: 5,
        bike: 'Honda Activa 6G',
    },
    {
        name: 'Priya S.',
        city: 'Mumbai',
        text: 'Compared 4 scooters side-by-side, got the best deal on Jupiter. EMI was ₹800 less than the dealer quoted.',
        rating: 5,
        bike: 'TVS Jupiter',
    },
    {
        name: 'Vikram D.',
        city: 'Nagpur',
        text: 'The quote calculator saved me ₹15,000 on insurance alone. Genuinely transparent process.',
        rating: 5,
        bike: 'Bajaj Pulsar NS200',
    },
];

const DEFAULT_SERVICE_CITIES = [
    'Mumbai',
    'Navi Mumbai',
    'Thane',
    'Kalyan-Dombivli',
    'Palghar',
    'Mira-Bhayandar',
    'Vasai-Virar',
    'Panvel',
];

/* ═══════════════════════════════════════════════════════════
   M2 HOME — Phone-First Premium Homepage
   ═══════════════════════════════════════════════════════════ */
export function M2Home({
    heroImage,
    initialItems,
    initialDevice = 'desktop',
}: {
    heroImage?: string;
    initialItems?: any[];
    initialDevice?: 'phone' | 'desktop';
}) {
    const searchParams = useSearchParams();
    const leadId = searchParams.get('leadId');
    const { items, skuCount } = useSystemCatalogLogic(leadId || undefined);
    const { brands } = useSystemBrandsLogic();
    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
    const { device } = useBreakpoint(initialDevice);
    const isPhone = device === 'phone';
    const trendingItems = React.useMemo(
        () => selectTrendingModels((items && items.length > 0 ? items : initialItems) || [], isPhone ? 3 : 6),
        [items, initialItems, isPhone]
    );
    const withLead = React.useCallback(
        (href: string) => {
            if (!leadId) return href;
            if (!href.startsWith('/')) return href;

            const [pathAndQuery, hashPart] = href.split('#');
            const [path, query = ''] = pathAndQuery.split('?');
            const params = new URLSearchParams(query);
            if (!params.has('leadId')) params.set('leadId', leadId);
            const nextHref = `${path}${params.toString() ? `?${params.toString()}` : ''}`;
            return hashPart ? `${nextHref}#${hashPart}` : nextHref;
        },
        [leadId]
    );

    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [failedImageKeys, setFailedImageKeys] = useState<Set<string>>(new Set());

    // Feature hooks
    const { user } = useAuth();
    const [userLocationStr, setUserLocationStr] = useState('');

    // EMI Calculator state
    const basePrice = 120000;
    const { availableCoins, isLoggedIn } = useOClubWallet();
    const [downpayment, setDownpayment] = useState(25000);

    const [scrolled, setScrolled] = useState(false);
    const tenure = 36;
    const interestRate = 9.5; // 9.5% p.a

    // Extract location cookie purely on client to avoid hydration mismatch
    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
        };
        const loc = getCookie('bmb_user_location');
        if (loc) setUserLocationStr(loc);
    }, []);

    // Parse the location string safely
    const parsedLocation = React.useMemo(() => {
        try {
            if (userLocationStr) return JSON.parse(decodeURIComponent(userLocationStr));
        } catch (e) {
            return null;
        }
        return null;
    }, [userLocationStr]);

    const trendingLocationName =
        parsedLocation?.district || parsedLocation?.taluka || parsedLocation?.state || 'Maharashtra';
    const primaryServiceLocation = parsedLocation?.district || parsedLocation?.taluka || null;
    const serviceRegionName = parsedLocation?.district || parsedLocation?.state || 'Maharashtra';
    const serviceCities = React.useMemo(() => {
        if (!primaryServiceLocation) return DEFAULT_SERVICE_CITIES;
        const normalized = String(primaryServiceLocation).toLowerCase();
        return [
            String(primaryServiceLocation),
            ...DEFAULT_SERVICE_CITIES.filter(city => city.toLowerCase() !== normalized),
        ].slice(0, 8);
    }, [primaryServiceLocation]);
    const riderName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.first_name || 'Rider';
    const isReturningUser = !!user;

    // Calculate real-time EMI
    const calculateEMI = () => {
        const principal = basePrice - downpayment;
        const ratePerMonth = interestRate / 12 / 100;
        const emi =
            (principal * ratePerMonth * Math.pow(1 + ratePerMonth, tenure)) / (Math.pow(1 + ratePerMonth, tenure) - 1);
        return Math.round(emi);
    };

    return (
        <div className="flex flex-col bg-white text-slate-900 overflow-x-hidden min-h-[100dvh]">
            {/* ══════════════════════════════════════════════
                SECTION 1: IMMERSIVE HERO (full viewport)
            ══════════════════════════════════════════════ */}
            <section
                ref={heroRef}
                className="relative min-h-[100svh] flex flex-col justify-end md:justify-center md:items-center overflow-hidden"
            >
                {/* Parallax Background */}
                <motion.div className="absolute inset-0" style={{ scale: heroScale, opacity: heroOpacity }}>
                    <Image
                        src={heroImage || '/images/hero_d8.jpg'}
                        alt="Sport motorcycle at golden hour"
                        fill
                        className="object-cover object-[80%_center] md:object-center"
                        priority
                        sizes="100vw"
                    />
                    {/* Immersive Dark Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </motion.div>

                {/* Floating Gold Accent Line */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[40%] left-1/2 -translate-x-1/2 w-16 h-[2px] origin-center"
                    style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
                />

                {/* Hero Content */}
                <div className="relative z-10 pb-[110px] md:pb-0 flex flex-col gap-5 md:items-center md:text-center md:max-w-3xl lg:max-w-4xl md:mx-auto page-container">
                    {/* Tag line */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 bg-white shadow-xl">
                            <Sparkles size={12} className="text-black" />
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-black">
                                India&apos;s Smartest Bike Marketplace
                            </span>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="text-[44px] md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                    >
                        {isReturningUser ? (
                            <>
                                Welcome back,
                                <br />
                                <span
                                    className="text-transparent bg-clip-text"
                                    style={{ backgroundImage: `linear-gradient(135deg, #fff, ${GOLD_INT})` }}
                                >
                                    {riderName}.
                                </span>
                            </>
                        ) : (
                            <>
                                Find your
                                <br />
                                <span
                                    className="text-transparent bg-clip-text"
                                    style={{ backgroundImage: `linear-gradient(135deg, #fff, ${GOLD_INT})` }}
                                >
                                    perfect ride.
                                </span>
                            </>
                        )}
                    </motion.h1>

                    {/* Subhead */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-[15px] md:text-lg text-white/95 font-bold leading-relaxed max-w-[280px] md:max-w-lg drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
                    >
                        {isReturningUser
                            ? 'Ready for your next adventure? Manage your bookings and explore new arrivals.'
                            : 'Compare on-road prices, get instant quotes, and book your bike — all in one place.'}
                    </motion.p>

                    {/* Quick Filter Pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="flex gap-2.5 mt-2 md:gap-4 md:mt-4"
                    >
                        {['Scooter', 'Motorcycle', 'Moped'].map(type => (
                            <Link
                                key={type}
                                href={withLead(`/store/catalog?bodyType=${type.toUpperCase()}`)}
                                className="flex-1 md:flex-none py-2.5 md:py-3 md:px-8 rounded-xl border border-white/10 bg-white shadow-xl hover:bg-slate-50 transition-all text-center text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-900"
                            >
                                {type}
                            </Link>
                        ))}
                    </motion.div>

                    {/* CTA Group */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        <Link
                            href={withLead('/store/catalog')}
                            className="w-full md:w-auto md:px-16 flex items-center justify-center gap-2.5 py-3.5 md:py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.15em] text-black active:scale-[0.97] hover:scale-[1.03] transition-transform shadow-[0_0_30px_rgba(255,215,0,0.2)]"
                            style={{ background: GOLD }}
                        >
                            <Bike size={16} className="shrink-0" />
                            <span className="truncate">Explore Bikes</span>
                        </Link>
                    </motion.div>

                    {/* Stat Ticker — Glassmorphic */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                        className="inline-flex items-center justify-center gap-x-4 md:gap-x-6 px-5 py-2.5 md:px-8 md:py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md mt-6 md:mt-8"
                    >
                        {[
                            `${skuCount || '130'}+ Models`,
                            `${MARKET_METRICS.avgSavings} Avg Savings`,
                            '4-Hour Delivery',
                        ].map((stat: string, i: number) => (
                            <div key={stat} className="flex items-center gap-3 md:gap-4">
                                {i > 0 && <span className="text-white/20">|</span>}
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.12em] text-white/80">
                                    {stat}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 8, 0] }}
                    transition={{ opacity: { delay: 2 }, y: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
                    className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
                >
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Scroll</span>
                    <ChevronDown size={16} className="text-white/40" />
                </motion.div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 2: QUICK CATEGORY CARDS
            ══════════════════════════════════════════════ */}
            <section className="relative py-10 md:py-16 lg:py-20 page-container">
                {/* Subtle top glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] rounded-full blur-[80px] opacity-30"
                    style={{ background: GOLD }}
                />

                <div className="relative max-w-[1440px] mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">
                        Browse By Category
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-6 md:mb-8 text-slate-900">
                        What are you
                        <span
                            className="text-transparent bg-clip-text ml-2"
                            style={{
                                backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                            }}
                        >
                            looking for?
                        </span>
                    </h2>

                    <div className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-5">
                        {CATEGORIES.map((cat, i) => {
                            const count = items?.filter(item => item.bodyType === cat.bodyType).length ?? 0;
                            return (
                                <motion.div
                                    key={cat.bodyType}
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="md:flex-1"
                                >
                                    <Link
                                        href={withLead(cat.link)}
                                        className="group flex items-center md:flex-col md:items-start gap-4 p-4 md:p-6 rounded-2xl border border-slate-100 bg-white shadow-sm active:scale-[0.98] hover:bg-slate-50 hover:border-slate-200 hover:shadow-md transition-all font-bold"
                                    >
                                        {/* Vehicle Image */}
                                        <div
                                            className={`relative w-24 h-16 md:w-full md:h-28 rounded-xl overflow-hidden flex-none bg-gradient-to-br ${cat.color} to-transparent`}
                                        >
                                            <Image
                                                src={cat.img}
                                                alt={cat.title}
                                                width={96}
                                                height={64}
                                                className="object-contain drop-shadow-lg md:w-full md:h-full"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                                                {cat.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {count} models · {cat.features[0]}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform"
                                            style={{ background: `${GOLD}15` }}
                                        >
                                            <ArrowRight size={16} style={{ color: GOLD }} />
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 3: TRENDING — HORIZONTAL SCROLL
            ══════════════════════════════════════════════ */}
            {trendingItems.length > 0 && (
                <section className="py-10 md:py-16 lg:py-20 page-container">
                    <div className="flex items-end justify-between mb-5 md:mb-8 max-w-[1440px] mx-auto">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: GOLD }}>
                                Popular Right Now
                            </p>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                                Trending
                                <span
                                    className="text-transparent bg-clip-text ml-2"
                                    style={{
                                        backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                                    }}
                                >
                                    Right Now.
                                </span>
                            </h2>
                        </div>
                        <Link
                            href={withLead('/store/catalog')}
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors group"
                        >
                            Explore All Models
                            <ArrowRight
                                size={14}
                                className="transition-transform duration-300 group-hover:translate-x-1"
                            />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 md:gap-6 pb-4 max-w-[1440px] mx-auto">
                        {trendingItems.map((item: any) =>
                            isPhone ? (
                                <CompactProductCard
                                    key={item.id}
                                    v={item}
                                    downpayment={downpayment}
                                    tenure={tenure}
                                    walletCoins={isLoggedIn ? availableCoins : null}
                                    showOClubPrompt={!isLoggedIn}
                                />
                            ) : (
                                <ProductCard
                                    key={item.id}
                                    v={item}
                                    downpayment={downpayment}
                                    tenure={tenure}
                                    walletCoins={isLoggedIn ? availableCoins : null}
                                    showOClubPrompt={!isLoggedIn}
                                    serviceability={{
                                        status: parsedLocation ? 'serviceable' : 'unset',
                                        location: trendingLocationName,
                                        district: parsedLocation?.district || undefined,
                                    }}
                                />
                            )
                        )}
                    </div>
                </section>
            )}

            {/* ── Gold accent divider ── */}
            <div className="page-container">
                <div className="max-w-[1440px] mx-auto h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent" />
            </div>

            {/* ══════════════════════════════════════════════
                SECTION 4: TRUST SIGNALS
            ══════════════════════════════════════════════ */}
            <section className="py-12 md:py-20 bg-white page-container">
                <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {[
                        { icon: Shield, label: 'Genuine Pricing', desc: 'No hidden dealership fees' },
                        { icon: Clock, label: 'Fast Delivery', desc: '4-hour home handover' },
                        { icon: Zap, label: 'Instant Finance', desc: 'Approvals in 60 seconds' },
                        { icon: MapPin, label: 'Regional Focus', desc: 'Optimized for Maharashtra' },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col gap-3 group cursor-default">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border border-slate-100 bg-slate-50 group-hover:scale-110 group-hover:border-slate-200 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] transition-all duration-300">
                                <item.icon
                                    size={20}
                                    className="text-slate-400 group-hover:text-slate-900 transition-colors duration-300"
                                />
                            </div>
                            <div>
                                <h4 className="text-xs md:text-sm font-black uppercase tracking-wide text-slate-900">
                                    {item.label}
                                </h4>
                                <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Gold accent divider ── */}
            <div className="page-container">
                <div className="max-w-[1440px] mx-auto h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent" />
            </div>

            {/* ══════════════════════════════════════════════
                SECTION 5: HOW IT WORKS
            ══════════════════════════════════════════════ */}
            <section className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white overflow-hidden page-container">
                <div className="max-w-[1440px] mx-auto flex flex-col items-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">The Process</p>
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight text-center mb-12 md:mb-20 text-slate-900">
                        3 Steps to Your
                        <span
                            className="text-transparent bg-clip-text ml-1"
                            style={{
                                backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                            }}
                        >
                            Dream Ride
                        </span>
                    </h2>

                    <div className="relative flex flex-col md:flex-row gap-4 md:gap-0">
                        {/* Desktop connecting line */}
                        <div className="hidden md:block absolute top-[40px] left-[16.6%] right-[16.6%] h-[2px] bg-gradient-to-r from-violet-300/40 via-amber-300/40 to-emerald-300/40" />

                        {[
                            {
                                step: '01',
                                title: 'Select',
                                desc: 'Browse 130+ models with live regional on-road prices. Filter by type, budget, or brand.',
                                icon: Sparkles,
                                glowColor: 'rgba(139,92,246,0.2)',
                            },
                            {
                                step: '02',
                                title: 'Quote',
                                desc: 'Get an instant on-road quote with zero hidden charges. Compare EMIs across banks.',
                                icon: Shield,
                                glowColor: 'rgba(255,215,0,0.2)',
                            },
                            {
                                step: '03',
                                title: 'Ride',
                                desc: 'Digital documentation. 4-hour doorstep delivery. Start riding the same day.',
                                icon: Bike,
                                glowColor: 'rgba(16,185,129,0.2)',
                            },
                        ].map((step, i) => (
                            <motion.div
                                key={step.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: i * 0.15 }}
                                className="relative flex-1 flex flex-col items-center text-center gap-4 p-5 md:p-8 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-lg active:scale-[0.98] hover:border-slate-200 transition-all duration-300 group md:mx-3"
                            >
                                {/* Number & Icon */}
                                <div className="flex-none flex flex-col items-center gap-2">
                                    <div
                                        className="relative w-16 md:w-20 h-16 md:h-20 flex items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 mb-6 group-hover:scale-110 group-hover:border-slate-200 transition-all duration-500 overflow-hidden"
                                        style={{ boxShadow: `0 10px 40px -10px rgba(0,0,0,0.05)` }}
                                    >
                                        {/* Hover glow */}
                                        <div
                                            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{ boxShadow: `0 0 30px ${step.glowColor}` }}
                                        />
                                        <span
                                            className="text-2xl md:text-3xl font-black italic tracking-tighter opacity-10 absolute -right-2 -bottom-2"
                                            style={{ color: GOLD_INT }}
                                        >
                                            0{i + 1}
                                        </span>
                                        <step.icon
                                            size={28}
                                            className="text-slate-900 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    <h4 className="text-base md:text-xl font-black uppercase tracking-tight text-slate-900">
                                        {step.title}
                                    </h4>
                                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-2 leading-relaxed max-w-[200px] md:max-w-none">
                                        {step.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 6: BRAND GRID
            ══════════════════════════════════════════════ */}
            <section className="py-12 md:py-16 lg:py-20 page-container">
                <div className="max-w-[1440px] mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">
                        Official Partners
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-6 md:mb-8 text-slate-900">
                        Premium
                        <span
                            className="text-transparent bg-clip-text ml-2"
                            style={{
                                backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                            }}
                        >
                            Brands.
                        </span>
                    </h2>

                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2.5 md:gap-4">
                        {brands.slice(0, 12).map((brand: any, i: number) => {
                            const color = BRAND_COLORS[brand.name.toUpperCase()] || '#ffffff';
                            const modelCount =
                                items?.filter((item: any) => item.brandName?.toUpperCase() === brand.name.toUpperCase())
                                    .length ?? 0;
                            return (
                                <motion.div
                                    key={brand.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true, margin: '-20px' }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <Link
                                        href={withLead(`/store/catalog?brand=${brand.name.toUpperCase()}`)}
                                        className="group flex flex-col items-center gap-2 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm active:scale-[0.93] hover:border-slate-200 hover:shadow-md transition-all duration-300"
                                    >
                                        <div
                                            className="w-11 h-11 rounded-full flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform duration-300"
                                            style={{ backgroundColor: color + '10' }}
                                        >
                                            {brand.brand_logos?.icon || brand.logo_svg ? (
                                                <div
                                                    className="w-5 h-5 opacity-80 [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizeSvg(
                                                            brand.brand_logos?.icon || brand.logo_svg || ''
                                                        ),
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-xs font-black text-slate-400">
                                                    {brand.name[0]}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 text-center leading-tight">
                                            {brand.name}
                                        </span>
                                        {modelCount > 0 && (
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                                {modelCount} {modelCount === 1 ? 'model' : 'models'}
                                            </span>
                                        )}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Gold accent divider ── */}
            <div className="page-container">
                <div className="max-w-[1440px] mx-auto h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent" />
            </div>

            {/* ══════════════════════════════════════════════
                SECTION 7: SOCIAL PROOF — TESTIMONIALS
            ══════════════════════════════════════════════ */}
            <section className="py-20 md:py-32 bg-gradient-to-b from-white via-slate-50 to-white">
                <div className="page-container">
                    <div className="max-w-[1440px] mx-auto">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">
                            Real Stories
                        </p>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-6 md:mb-8 text-slate-900">
                            Riders
                            <span
                                className="text-transparent bg-clip-text ml-2"
                                style={{
                                    backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                                }}
                            >
                                Love Us
                            </span>
                        </h2>

                        {/* Mobile: carousel */}
                        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:hidden shadow-sm">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTestimonial}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col gap-4"
                                >
                                    {/* Stars */}
                                    <div className="flex gap-1">
                                        {Array.from({ length: TESTIMONIALS[activeTestimonial].rating }).map((_, i) => (
                                            <Star key={i} size={14} fill={GOLD} stroke="none" />
                                        ))}
                                    </div>

                                    {/* Quote */}
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                                        &ldquo;{TESTIMONIALS[activeTestimonial].text}&rdquo;
                                    </p>

                                    {/* Author */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-slate-900">
                                                {TESTIMONIALS[activeTestimonial].name}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {TESTIMONIALS[activeTestimonial].bike}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                                            <Check size={10} className="text-emerald-400" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                                Verified
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Dots */}
                            <div className="flex items-center justify-center gap-2 mt-5">
                                {TESTIMONIALS.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        aria-label={`Show testimonial ${i + 1}`}
                                        onClick={() => setActiveTestimonial(i)}
                                        className="transition-all"
                                    >
                                        <div
                                            className={`rounded-full transition-all duration-300 ${
                                                i === activeTestimonial ? 'w-6 h-1.5' : 'w-1.5 h-1.5 bg-slate-200'
                                            }`}
                                            style={i === activeTestimonial ? { background: GOLD } : undefined}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Desktop: show all testimonials side by side */}
                        <div className="hidden md:grid md:grid-cols-3 gap-4">
                            {TESTIMONIALS.map((t, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col gap-4 p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-lg hover:border-slate-200 hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="flex gap-1">
                                        {Array.from({ length: t.rating }).map((_, j) => (
                                            <Star key={j} size={14} fill={GOLD} stroke="none" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic flex-1">
                                        &ldquo;{t.text}&rdquo;
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-slate-900">{t.name}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{t.bike}</p>
                                        </div>
                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                                            <Check size={10} className="text-emerald-400" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                                Verified
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Trust metrics */}
                        <div className="mt-5 md:mt-8 grid grid-cols-3 gap-3 md:gap-4">
                            {[
                                { value: '4.8★', label: 'Avg Rating' },
                                { value: '2,100+', label: 'Deliveries' },
                                { value: '98%', label: 'Satisfaction' },
                            ].map((metric, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center py-4 rounded-2xl border border-slate-100 bg-white shadow-sm"
                                >
                                    <span className="text-base md:text-lg font-black text-slate-900">
                                        {metric.value}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                                        {metric.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 8: SERVICE AREAS
            ══════════════════════════════════════════════ */}
            {/* ── Gold accent divider ── */}
            <div className="page-container">
                <div className="max-w-[1440px] mx-auto h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent" />
            </div>

            <section className="py-20 md:py-28 bg-white page-container">
                <div className="max-w-[1440px] mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">
                        Where We Serve
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-6 md:mb-8 text-slate-900">
                        Available in
                        <span
                            className="text-transparent bg-clip-text ml-2"
                            style={{
                                backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                            }}
                        >
                            {serviceRegionName}
                        </span>
                    </h2>

                    <div className="flex flex-wrap md:grid md:grid-cols-4 gap-2 md:gap-3">
                        {serviceCities.map((city, ci) => (
                            <motion.div
                                key={city}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: ci * 0.05 }}
                                className="flex items-center gap-3 px-4 py-3 md:py-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-300 group"
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-100 group-hover:border-slate-200 transition-colors shrink-0">
                                    <MapPin
                                        size={14}
                                        className="text-slate-400 group-hover:text-slate-600 transition-colors"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                                        {city}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        Same-day delivery
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-6 font-bold uppercase tracking-wider">
                        Expanding to more cities soon. Enter your pincode to check availability.
                    </p>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 9: FINAL CTA — BOOKING STRIP
            ══════════════════════════════════════════════ */}
            <section className="relative py-14 md:py-20 lg:py-24 page-container overflow-hidden bg-gradient-to-b from-amber-50/60 via-white to-white">
                {/* Background glow */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        background: `radial-gradient(circle at 50% 80%, ${GOLD}, transparent 60%)`,
                    }}
                />

                <div className="relative z-10 flex flex-col items-center text-center gap-5 max-w-xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[42px] md:text-7xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-slate-900"
                    >
                        Find your
                        <br />
                        <span
                            className="text-transparent bg-clip-text"
                            style={{
                                backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                            }}
                        >
                            perfect ride.
                        </span>
                    </motion.h1>
                    <p className="text-sm text-slate-500 font-bold max-w-[260px] uppercase tracking-wide">
                        Get your personalized on-road quote in under 60 seconds.
                    </p>

                    <Link
                        href={withLead('/store/catalog')}
                        className="w-full md:w-auto md:px-16 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm md:text-base uppercase tracking-wider text-black active:scale-[0.97] hover:scale-[1.02] transition-transform shadow-lg"
                        style={{
                            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_INT})`,
                            boxShadow: `0 8px 32px ${GOLD}40`,
                        }}
                    >
                        <Sparkles size={18} />
                        Get My Quote
                        <ArrowRight size={18} />
                    </Link>

                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <Shield size={10} className="text-emerald-500" />
                        <span>No signup required · Free forever</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
