'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';

import { CATEGORIES, MARKET_METRICS } from '@/config/market';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { sanitizeSvg } from '@/lib/utils/sanitizeSvg';
import { M2Footer } from './M2Footer';
import { useAuth } from '@/components/providers/AuthProvider';
import { coinsNeededForPrice } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';

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
export function M2Home() {
    const { items, skuCount } = useSystemCatalogLogic();
    const { brands } = useSystemBrandsLogic();
    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
    const trendingItems = React.useMemo(() => {
        if (!items) return [];

        // 1. Filter out surge pricing (where discount is negative)
        const validItems = items.filter((item: any) => {
            const discount = item.price?.discount ?? 0;
            return discount >= 0;
        });

        // 2. Group by model and keep only the best variant (highest discount, then lowest price)
        const modelMap = new Map<string, (typeof items)[0]>();

        for (const item of validItems) {
            const modelKey = item.modelSlug;
            if (!modelKey) continue;

            const existing = modelMap.get(modelKey);
            if (!existing) {
                modelMap.set(modelKey, item);
                continue;
            }

            // Compare: Which goes first?
            const currentDiscount = item.price?.discount ?? 0;
            const existingDiscount = existing.price?.discount ?? 0;

            if (currentDiscount > existingDiscount) {
                modelMap.set(modelKey, item);
            } else if (currentDiscount === existingDiscount) {
                const currentPrice = item.price?.onRoad ?? item.price?.exShowroom ?? Number.MAX_SAFE_INTEGER;
                const existingPrice = existing.price?.onRoad ?? existing.price?.exShowroom ?? Number.MAX_SAFE_INTEGER;
                if (currentPrice < existingPrice) {
                    modelMap.set(modelKey, item);
                }
            }
        }

        // 3. Convert Map back to array and apply final sorting across all unique models
        const uniqueModelItems = Array.from(modelMap.values());

        uniqueModelItems.sort((a, b) => {
            const discountA = a.price?.discount ?? 0;
            const discountB = b.price?.discount ?? 0;

            if (discountA !== discountB) {
                return discountB - discountA; // Descending discount
            }

            const priceA = a.price?.onRoad ?? a.price?.exShowroom ?? Number.MAX_SAFE_INTEGER;
            const priceB = b.price?.onRoad ?? b.price?.exShowroom ?? Number.MAX_SAFE_INTEGER;
            return priceA - priceB; // Ascending price
        });

        return uniqueModelItems.slice(0, 8);
    }, [items]);

    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [failedImageKeys, setFailedImageKeys] = useState<Set<string>>(new Set());

    // Feature hooks
    const { user } = useAuth();
    const [userLocationStr, setUserLocationStr] = useState('');

    // EMI Calculator state
    const basePrice = 120000;
    const [downpayment, setDownpayment] = useState(25000);
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
    const riderName = user?.user_metadata?.first_name || 'Rider';
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
        <div className="flex flex-col bg-[#0b0d10] text-white overflow-x-hidden min-h-[100dvh]">
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
                        src="/images/templates/t3_night.webp"
                        alt="Premium motorcycle showcase"
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d10]/50 via-transparent to-[#0b0d10]" />
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
                <div className="relative z-10 px-5 md:px-12 lg:px-20 pb-[110px] md:pb-0 flex flex-col gap-5 md:items-center md:text-center md:max-w-3xl lg:max-w-4xl md:mx-auto">
                    {/* Tag line */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-xl"
                            style={{
                                background: `${GOLD}10`,
                                borderColor: `${GOLD}30`,
                            }}
                        >
                            <Sparkles size={12} style={{ color: GOLD }} />
                            <span
                                className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em]"
                                style={{ color: GOLD }}
                            >
                                India&apos;s Smartest Bike Marketplace
                            </span>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="text-[40px] md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight"
                    >
                        {isReturningUser ? (
                            <>
                                Welcome back,
                                <br />
                                <span
                                    className="text-transparent bg-clip-text"
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, ${GOLD}, ${GOLD_INT}, #fff)`,
                                    }}
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
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, ${GOLD}, ${GOLD_INT}, #fff)`,
                                    }}
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
                        className="text-sm md:text-lg text-white/60 font-medium leading-relaxed max-w-[280px] md:max-w-lg"
                    >
                        {isReturningUser
                            ? 'Ready to pick up where you left off? Compare prices and book instantly.'
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
                                href={`/store/catalog?bodyType=${type.toUpperCase()}`}
                                className="flex-1 md:flex-none py-2.5 md:py-3 md:px-8 rounded-xl border border-white/20 bg-white/5 active:bg-white/10 hover:bg-white/10 hover:border-white/40 backdrop-blur-md text-center text-[10px] md:text-xs font-black uppercase tracking-wider text-white transition-all"
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
                            href="/store/catalog"
                            className="w-full md:w-auto md:px-16 flex items-center justify-center gap-2.5 py-3.5 md:py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.15em] text-black active:scale-[0.97] hover:scale-[1.03] transition-transform shadow-[0_0_30px_rgba(255,215,0,0.2)]"
                            style={{ background: GOLD }}
                        >
                            <Bike size={16} className="shrink-0" />
                            <span className="truncate">Explore Bikes</span>
                        </Link>
                    </motion.div>

                    {/* Stat Ticker */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex items-center justify-center flex-wrap gap-x-2.5 md:gap-x-4 gap-y-1 mt-3 md:mt-5"
                    >
                        {[
                            `${skuCount || '130'}+ MODELS`,
                            `${MARKET_METRICS.avgSavings?.toUpperCase()} AVG SAVINGS`,
                            '4-HOUR DELIVERY',
                        ].map((stat: string, i: number) => (
                            <div key={stat} className="flex items-center gap-2.5">
                                {i > 0 && <span className="text-white/20 text-[10px] leading-none">&bull;</span>}
                                <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.15em] text-white/40">
                                    {stat}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 2: QUICK CATEGORY CARDS
            ══════════════════════════════════════════════ */}
            <section className="relative py-10 md:py-16 lg:py-20 px-5 md:px-12 lg:px-20">
                {/* Subtle top glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] rounded-full blur-[80px] opacity-30"
                    style={{ background: GOLD }}
                />

                <div className="relative max-w-[1440px] mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">
                        Browse By Category
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-6 md:mb-8">
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

                    <div className="flex flex-col md:flex-row gap-3 md:gap-4">
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
                                        href={cat.link}
                                        className="group flex items-center gap-4 p-4 md:p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm active:scale-[0.98] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all"
                                    >
                                        {/* Vehicle Image */}
                                        <div
                                            className={`relative w-24 h-16 rounded-xl overflow-hidden flex-none bg-gradient-to-br ${cat.color} to-transparent`}
                                        >
                                            <Image
                                                src={cat.img}
                                                alt={cat.title}
                                                width={96}
                                                height={64}
                                                className="object-contain drop-shadow-lg"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-black uppercase tracking-tight text-white">
                                                {cat.title}
                                            </h3>
                                            <p className="text-xs text-white/40 mt-0.5">
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
                <section className="py-10 md:py-16 lg:py-20">
                    <div className="flex items-end justify-between px-5 md:px-12 lg:px-20 mb-5 md:mb-8 max-w-[1440px] mx-auto">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: GOLD }}>
                                Popular Right Now
                            </p>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white mt-1">
                                Trending in {trendingLocationName}
                            </h2>
                        </div>
                        <Link
                            href="/store/catalog"
                            className="flex items-center gap-1 text-[10px] font-bold text-white/40 uppercase tracking-wider active:text-white/70 transition-colors"
                        >
                            View All
                            <ChevronRight size={12} />
                        </Link>
                    </div>

                    <div className="flex md:grid md:grid-cols-4 gap-3.5 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none px-5 md:px-12 lg:px-20 pb-4 no-scrollbar max-w-[1440px] mx-auto">
                        {trendingItems.map((item: any, i: number) => {
                            const name = item.displayName || 'Unknown';
                            const brand = item.make || '';
                            const img = item.imageUrl;
                            const imageKey = String(item.id || item.slug || item.modelSlug || i);
                            const showImage = !!img && !failedImageKeys.has(imageKey);

                            // Pricing Logic identical to Catalog Cards
                            const displayPrice =
                                item.price?.offerPrice || item.price?.onRoad || item.price?.exShowroom || 0;
                            const hasDiscount = (item.price?.discount ?? 0) > 0;
                            const exShowroom = item.price?.exShowroom || 0;
                            const bcoinTotal = coinsNeededForPrice(displayPrice);

                            const isBestSeller = i < 3;

                            return (
                                <Link
                                    key={item.id || i}
                                    href={`/store/${brand.toLowerCase().replace(/\s+/g, '-')}/${item.modelSlug || item.slug || ''}`}
                                    className="snap-center flex-none w-[200px] md:w-auto md:flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden active:scale-[0.97] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all group"
                                >
                                    {/* Badge */}
                                    {isBestSeller && (
                                        <div
                                            className="flex items-center gap-1 px-3 py-1.5"
                                            style={{ background: `${GOLD}15` }}
                                        >
                                            <TrendingUp size={10} style={{ color: GOLD }} />
                                            <span
                                                className="text-[10px] font-black uppercase tracking-widest"
                                                style={{ color: GOLD }}
                                            >
                                                Best Seller
                                            </span>
                                        </div>
                                    )}

                                    {/* Image */}
                                    <div className="relative h-[120px] flex items-center justify-center p-3">
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />
                                        {showImage ? (
                                            <Image
                                                src={img}
                                                alt={name}
                                                width={170}
                                                height={110}
                                                className="object-contain drop-shadow-lg relative z-10"
                                                onError={() => {
                                                    setFailedImageKeys(prev => {
                                                        const next = new Set(prev);
                                                        next.add(imageKey);
                                                        return next;
                                                    });
                                                }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                                <Sparkles size={20} className="text-white/30" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="px-4 pb-4 pt-2">
                                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/55">
                                            {brand}
                                        </p>
                                        <h3 className="text-sm font-black uppercase tracking-tight text-white mt-0.5 truncate">
                                            {name}
                                        </h3>
                                        <div className="mt-2 flex flex-col gap-1.5">
                                            {hasDiscount && exShowroom > 0 && (
                                                <p className="text-[11px] font-bold text-slate-400 line-through decoration-[#FFD700] decoration-2">
                                                    ₹{Math.round(exShowroom).toLocaleString('en-IN')}
                                                </p>
                                            )}

                                            <div className="flex flex-col gap-1">
                                                {displayPrice ? (
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-base font-black text-white">
                                                            ₹{Math.round(displayPrice).toLocaleString('en-IN')}
                                                        </span>
                                                        <span className="text-[10px] text-white/60 font-bold uppercase tracking-wide">
                                                            on-road
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-bold text-white/40">Get Quote</span>
                                                )}

                                                {displayPrice > 0 && (
                                                    <div className="flex items-center gap-1.5 pt-[2px]">
                                                        <Logo variant="icon" size={13} />
                                                        <span className="text-[12px] font-black text-[#F4B000] italic leading-none pt-[1px]">
                                                            {bcoinTotal.toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════════
                SECTION 4: WHY BOOKMYBIKE — TRUST SIGNALS
            ══════════════════════════════════════════════ */}
            <section className="py-12 md:py-16 lg:py-20 px-5 md:px-12 lg:px-20">
                <div className="max-w-[1440px] mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Why Us</p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-8">
                        Built for
                        <span
                            className="text-transparent bg-clip-text ml-2"
                            style={{
                                backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                            }}
                        >
                            trust.
                        </span>
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {TRUST_BADGES.map((badge, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-30px' }}
                                transition={{ delay: i * 0.08 }}
                                className="relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-center overflow-hidden"
                            >
                                {/* Subtle gradient glow */}
                                <div
                                    className={`absolute top-0 inset-x-0 h-16 bg-gradient-to-b ${badge.bg} to-transparent opacity-40`}
                                />

                                <div
                                    className={`relative z-10 w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center ${badge.color}`}
                                >
                                    <badge.icon size={20} />
                                </div>
                                <span className="relative z-10 text-[10px] font-black uppercase tracking-wider text-white/70 whitespace-pre-line leading-tight">
                                    {badge.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 5: HOW IT WORKS — 3-STEP FLOW
            ══════════════════════════════════════════════ */}
            <section className="py-12 md:py-16 lg:py-20 px-5 md:px-12 lg:px-20 bg-gradient-to-b from-[#0b0d10] via-[#0f1218] to-[#0b0d10]">
                <div className="max-w-[1440px] mx-auto">
                    <div className="text-center mb-8 md:mb-12">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: GOLD }}>
                            The Process
                        </p>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight">
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
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        {[
                            {
                                step: '01',
                                title: 'Select',
                                desc: 'Browse 130+ models with live regional on-road prices. Filter by type, budget, or brand.',
                                icon: Sparkles,
                                accent: 'from-violet-500/30 to-violet-500/5',
                            },
                            {
                                step: '02',
                                title: 'Quote',
                                desc: 'Get an instant on-road quote with zero hidden charges. Compare EMIs across banks.',
                                icon: Shield,
                                accent: 'from-amber-400/30 to-amber-400/5',
                            },
                            {
                                step: '03',
                                title: 'Ride',
                                desc: 'Digital documentation. 4-hour doorstep delivery. Start riding the same day.',
                                icon: Bike,
                                accent: 'from-emerald-500/30 to-emerald-500/5',
                            },
                        ].map((step, i) => (
                            <motion.div
                                key={step.step}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: i * 0.12 }}
                                className="relative flex md:flex-col md:items-center md:text-center gap-4 p-5 md:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden md:flex-1"
                            >
                                {/* Number & Icon */}
                                <div className="flex-none flex flex-col items-center gap-2">
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} border border-white/10 flex items-center justify-center`}
                                    >
                                        <step.icon size={20} className="text-white/80" />
                                    </div>
                                    <span className="text-[10px] font-black tracking-[0.3em] text-white/40">
                                        {step.step}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-white">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-white/65 mt-1.5 leading-relaxed">{step.desc}</p>
                                </div>

                                {/* Step connector line */}
                                {i < 2 && (
                                    <div
                                        className="absolute bottom-0 left-[41px] w-[2px] h-4 -mb-4 z-10"
                                        style={{ background: `linear-gradient(to bottom, ${GOLD}30, transparent)` }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 6: BRAND GRID
            ══════════════════════════════════════════════ */}
            <section className="py-12 md:py-16 lg:py-20 px-5 md:px-12 lg:px-20">
                <div className="max-w-[1440px] mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">
                        Official Partners
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-6 md:mb-8">
                        Premium
                        <span
                            className="text-transparent bg-clip-text ml-2"
                            style={{
                                backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                            }}
                        >
                            Brands
                        </span>
                    </h2>

                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2.5 md:gap-4">
                        {brands.slice(0, 12).map((brand: any, i: number) => {
                            const color = BRAND_COLORS[brand.name.toUpperCase()] || '#ffffff';
                            return (
                                <motion.div
                                    key={brand.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true, margin: '-20px' }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <Link
                                        href={`/store/catalog?brand=${brand.name.toUpperCase()}`}
                                        className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] active:scale-[0.93] transition-transform"
                                    >
                                        <div
                                            className="w-11 h-11 rounded-full flex items-center justify-center border border-white/10"
                                            style={{ backgroundColor: color + '15' }}
                                        >
                                            {brand.brand_logos?.icon || brand.logo_svg ? (
                                                <div
                                                    className="w-5 h-5 brightness-0 invert opacity-60 [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizeSvg(
                                                            brand.brand_logos?.icon || brand.logo_svg || ''
                                                        ),
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-xs font-black text-white/50">
                                                    {brand.name[0]}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-white/65 text-center leading-tight">
                                            {brand.name}
                                        </span>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 7: SOCIAL PROOF — TESTIMONIALS
            ══════════════════════════════════════════════ */}
            <section className="py-12 md:py-16 lg:py-20 px-5 md:px-12 lg:px-20 bg-gradient-to-b from-[#0b0d10] via-[#0f1218] to-[#0b0d10]">
                <div className="max-w-[1440px] mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Real Stories</p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-6 md:mb-8">
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
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 md:hidden">
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
                                <p className="text-sm text-white/70 leading-relaxed italic">
                                    &ldquo;{TESTIMONIALS[activeTestimonial].text}&rdquo;
                                </p>

                                {/* Author */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black text-white">
                                            {TESTIMONIALS[activeTestimonial].name}
                                        </p>
                                        <p className="text-[11px] text-white/60 mt-0.5">
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
                                            i === activeTestimonial ? 'w-6 h-1.5' : 'w-1.5 h-1.5 bg-white/20'
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
                                className="flex flex-col gap-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03]"
                            >
                                <div className="flex gap-1">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star key={j} size={14} fill={GOLD} stroke="none" />
                                    ))}
                                </div>
                                <p className="text-sm text-white/70 leading-relaxed italic flex-1">
                                    &ldquo;{t.text}&rdquo;
                                </p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black text-white">{t.name}</p>
                                        <p className="text-[11px] text-white/60 mt-0.5">{t.bike}</p>
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
                                className="flex flex-col items-center py-3 rounded-xl border border-white/[0.08] bg-white/[0.03]"
                            >
                                <span className="text-base font-black text-white">{metric.value}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/55 mt-0.5">
                                    {metric.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 8: SERVICE AREAS
            ══════════════════════════════════════════════ */}
            <section className="py-12 md:py-16 lg:py-20 px-5 md:px-12 lg:px-20">
                <div className="max-w-[1440px] mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">
                        Where We Serve
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-6 md:mb-8">
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

                    <div className="flex flex-wrap gap-2">
                        {serviceCities.map(city => (
                            <div
                                key={city}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/[0.08] bg-white/[0.03]"
                            >
                                <MapPin size={10} className="text-white/30" />
                                <span className="text-[11px] font-bold text-white/70">{city}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-white/55 mt-3 font-medium">
                        Expanding to more cities soon. Enter your pincode to check availability.
                    </p>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 9: FINAL CTA — BOOKING STRIP
            ══════════════════════════════════════════════ */}
            <section className="relative py-14 md:py-20 lg:py-24 px-5 md:px-12 lg:px-20 overflow-hidden">
                {/* Background glow */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: `radial-gradient(circle at 50% 80%, ${GOLD}, transparent 60%)`,
                    }}
                />

                <div className="relative z-10 flex flex-col items-center text-center gap-5 max-w-xl mx-auto">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                        Ready to
                        <br />
                        <span
                            className="text-transparent bg-clip-text"
                            style={{
                                backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                            }}
                        >
                            start riding?
                        </span>
                    </h2>
                    <p className="text-sm text-white/50 font-medium max-w-[260px]">
                        Get your personalized on-road quote in under 60 seconds.
                    </p>

                    <Link
                        href="/store/catalog"
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

                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/55 uppercase tracking-widest">
                        <Shield size={10} />
                        <span>No signup required · Free forever</span>
                    </div>
                </div>
            </section>
            <M2Footer />
        </div>
    );
}
