'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    ChevronRight,
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

    const trendingItems = items?.slice(0, 8) ?? [];
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    // Auto-rotate testimonials
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col bg-[#0b0d10] text-white overflow-x-hidden min-h-screen">
            {/* ══════════════════════════════════════════════
                SECTION 1: IMMERSIVE HERO (full viewport)
            ══════════════════════════════════════════════ */}
            <section ref={heroRef} className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden">
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
                <div className="relative z-10 px-5 pb-[110px] flex flex-col gap-5">
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
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                                India&apos;s Smartest Bike Marketplace
                            </span>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="text-[40px] font-black leading-[0.95] tracking-tight"
                    >
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
                    </motion.h1>

                    {/* Subhead */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-sm text-white/60 font-medium leading-relaxed max-w-[280px]"
                    >
                        Compare on-road prices, get instant quotes, and book your bike — all in one place.
                    </motion.p>

                    {/* CTA Group */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-3"
                    >
                        <Link
                            href="/store/catalog"
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider text-black active:scale-[0.97] transition-transform"
                            style={{ background: GOLD }}
                        >
                            <Bike size={18} />
                            Explore Bikes
                        </Link>
                        <Link
                            href="/store/compare"
                            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-white/20 font-black text-xs uppercase tracking-wider text-white/80 backdrop-blur-xl bg-white/5 active:scale-[0.97] transition-transform"
                        >
                            Compare
                        </Link>
                    </motion.div>

                    {/* Stat Ticker */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex items-center gap-3 mt-1"
                    >
                        {[
                            `${skuCount || '130'}+ Models`,
                            `${MARKET_METRICS.avgSavings} Avg Savings`,
                            '4-Hour Delivery',
                        ].map((stat, i) => (
                            <React.Fragment key={stat}>
                                {i > 0 && <div className="w-[3px] h-[3px] rounded-full bg-white/20" />}
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">
                                    {stat}
                                </span>
                            </React.Fragment>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 2: QUICK CATEGORY CARDS
            ══════════════════════════════════════════════ */}
            <section className="relative py-10 px-5">
                {/* Subtle top glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] rounded-full blur-[80px] opacity-30"
                    style={{ background: GOLD }}
                />

                <div className="relative">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">
                        Browse By Category
                    </p>
                    <h2 className="text-2xl font-black tracking-tight mb-6">
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

                    <div className="flex flex-col gap-3">
                        {CATEGORIES.map((cat, i) => {
                            const count = items?.filter(item => item.bodyType === cat.bodyType).length ?? 0;
                            return (
                                <motion.div
                                    key={cat.bodyType}
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                >
                                    <Link
                                        href={cat.link}
                                        className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm active:scale-[0.98] transition-all"
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
                <section className="py-10">
                    <div className="flex items-end justify-between px-5 mb-5">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: GOLD }}>
                                Popular Right Now
                            </p>
                            <h2 className="text-2xl font-black tracking-tight text-white mt-1">Trending Rides</h2>
                        </div>
                        <Link
                            href="/store/catalog"
                            className="flex items-center gap-1 text-[10px] font-bold text-white/40 uppercase tracking-wider active:text-white/70 transition-colors"
                        >
                            View All
                            <ChevronRight size={12} />
                        </Link>
                    </div>

                    <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory px-5 pb-4 no-scrollbar">
                        {trendingItems.map((item, i) => {
                            const name = item.displayName || 'Unknown';
                            const brand = item.make || '';
                            const img = item.imageUrl;
                            const price = item.price?.onRoad || item.price?.exShowroom;
                            const isBestSeller = i < 3;

                            return (
                                <Link
                                    key={item.id || i}
                                    href={`/store/${brand.toLowerCase().replace(/\s+/g, '-')}/${item.modelSlug || item.slug || ''}`}
                                    className="snap-center flex-none w-[200px] rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden active:scale-[0.97] transition-all group"
                                >
                                    {/* Badge */}
                                    {isBestSeller && (
                                        <div
                                            className="flex items-center gap-1 px-3 py-1.5"
                                            style={{ background: `${GOLD}15` }}
                                        >
                                            <TrendingUp size={10} style={{ color: GOLD }} />
                                            <span
                                                className="text-[8px] font-black uppercase tracking-widest"
                                                style={{ color: GOLD }}
                                            >
                                                Best Seller
                                            </span>
                                        </div>
                                    )}

                                    {/* Image */}
                                    <div className="relative h-[120px] flex items-center justify-center p-3">
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />
                                        {img ? (
                                            <Image
                                                src={img}
                                                alt={name}
                                                width={170}
                                                height={110}
                                                className="object-contain drop-shadow-lg relative z-10"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                                <Sparkles size={20} className="text-white/30" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="px-4 pb-4 pt-2">
                                        <p className="text-[7px] font-black uppercase tracking-[0.25em] text-white/30">
                                            {brand}
                                        </p>
                                        <h3 className="text-sm font-black uppercase tracking-tight text-white mt-0.5 truncate">
                                            {name}
                                        </h3>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            {price ? (
                                                <>
                                                    <span className="text-base font-black text-white">
                                                        ₹{Math.round(price).toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-[9px] text-white/30 font-medium">
                                                        on-road
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm font-bold text-white/40">Get Quote</span>
                                            )}
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
            <section className="py-12 px-5">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Why Us</p>
                <h2 className="text-2xl font-black tracking-tight mb-8">
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

                <div className="grid grid-cols-2 gap-3">
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
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 5: HOW IT WORKS — 3-STEP FLOW
            ══════════════════════════════════════════════ */}
            <section className="py-12 px-5 bg-gradient-to-b from-[#0b0d10] via-[#0f1218] to-[#0b0d10]">
                <div className="text-center mb-8">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: GOLD }}>
                        The Process
                    </p>
                    <h2 className="text-2xl font-black tracking-tight">
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

                <div className="flex flex-col gap-4">
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
                            accent: `from-[${GOLD}30] to-[${GOLD}05]`,
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
                            className="relative flex gap-4 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
                        >
                            {/* Number & Icon */}
                            <div className="flex-none flex flex-col items-center gap-2">
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} border border-white/10 flex items-center justify-center`}
                                >
                                    <step.icon size={20} className="text-white/80" />
                                </div>
                                <span className="text-[9px] font-black tracking-[0.3em] text-white/20">
                                    {step.step}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-1">
                                <h3 className="text-lg font-black uppercase tracking-tight text-white">{step.title}</h3>
                                <p className="text-xs text-white/45 mt-1.5 leading-relaxed">{step.desc}</p>
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
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 6: BRAND GRID
            ══════════════════════════════════════════════ */}
            <section className="py-12 px-5">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Official Partners</p>
                <h2 className="text-2xl font-black tracking-tight mb-6">
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

                <div className="grid grid-cols-4 gap-2.5">
                    {brands.slice(0, 12).map((brand, i) => {
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
                                            <span className="text-xs font-black text-white/50">{brand.name[0]}</span>
                                        )}
                                    </div>
                                    <span className="text-[7px] font-black uppercase tracking-wider text-white/40 text-center leading-tight">
                                        {brand.name}
                                    </span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 7: SOCIAL PROOF — TESTIMONIALS
            ══════════════════════════════════════════════ */}
            <section className="py-12 px-5 bg-gradient-to-b from-[#0b0d10] via-[#0f1218] to-[#0b0d10]">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Real Stories</p>
                <h2 className="text-2xl font-black tracking-tight mb-6">
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

                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
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
                                    <p className="text-[10px] text-white/40 mt-0.5">
                                        <MapPin size={10} className="inline mr-1" />
                                        {TESTIMONIALS[activeTestimonial].city} · {TESTIMONIALS[activeTestimonial].bike}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                                    <Check size={10} className="text-emerald-400" />
                                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400">
                                        Verified
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Dots */}
                    <div className="flex items-center justify-center gap-2 mt-5">
                        {TESTIMONIALS.map((_, i) => (
                            <button key={i} onClick={() => setActiveTestimonial(i)} className="transition-all">
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

                {/* Trust metrics */}
                <div className="mt-5 grid grid-cols-3 gap-3">
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
                            <span className="text-[8px] font-bold uppercase tracking-widest text-white/30 mt-0.5">
                                {metric.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 8: SERVICE AREAS
            ══════════════════════════════════════════════ */}
            <section className="py-12 px-5">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Where We Serve</p>
                <h2 className="text-2xl font-black tracking-tight mb-6">
                    Available in
                    <span
                        className="text-transparent bg-clip-text ml-2"
                        style={{
                            backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_INT})`,
                        }}
                    >
                        Maharashtra
                    </span>
                </h2>

                <div className="flex flex-wrap gap-2">
                    {['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Kolhapur', 'Solapur'].map(city => (
                        <div
                            key={city}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/[0.08] bg-white/[0.03]"
                        >
                            <MapPin size={10} className="text-white/30" />
                            <span className="text-[10px] font-bold text-white/50">{city}</span>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-white/25 mt-3 font-medium">
                    Expanding to more cities soon. Enter your pincode to check availability.
                </p>
            </section>

            {/* ══════════════════════════════════════════════
                SECTION 9: FINAL CTA — BOOKING STRIP
            ══════════════════════════════════════════════ */}
            <section className="relative py-14 px-5 overflow-hidden">
                {/* Background glow */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: `radial-gradient(circle at 50% 80%, ${GOLD}, transparent 60%)`,
                    }}
                />

                <div className="relative z-10 flex flex-col items-center text-center gap-5">
                    <h2 className="text-3xl font-black tracking-tight leading-tight">
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
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-black active:scale-[0.97] transition-transform shadow-lg"
                        style={{
                            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_INT})`,
                            boxShadow: `0 8px 32px ${GOLD}40`,
                        }}
                    >
                        <Sparkles size={18} />
                        Get My Quote
                        <ArrowRight size={18} />
                    </Link>

                    <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        <Shield size={10} />
                        <span>No signup required · Free forever</span>
                    </div>
                </div>
            </section>
            <M2Footer />
        </div>
    );
}
