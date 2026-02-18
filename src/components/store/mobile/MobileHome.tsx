'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Zap, Shield, Clock, Sparkles } from 'lucide-react';

import { CATEGORIES, MARKET_METRICS } from '@/config/market';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { useI18n } from '@/components/providers/I18nProvider';
import { sanitizeSvg } from '@/lib/utils/sanitizeSvg';
import { Logo } from '@/components/brand/Logo';
import { RiderPulse } from '@/components/store/RiderPulse';
import { Footer } from '../Footer';

/* ─────────────────────── Brand Data ─────────────────────── */
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
};

/* ─────────────────────── Component ─────────────────────── */
export function MobileHome() {
    const { items, skuCount } = useSystemCatalogLogic();
    const { brands } = useSystemBrandsLogic();
    const { t } = useI18n();
    const [activeStep, setActiveStep] = useState(0);

    const trendingItems = items?.slice(0, 6) ?? [];

    return (
        <div className="flex flex-col bg-black text-white overflow-x-hidden">
            {/* ══════════════ SECTION 1: CINEMATIC HERO ══════════════ */}
            <section className="relative min-h-[85svh] flex flex-col items-center justify-between pt-safe-top overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/templates/t3_night.png"
                        alt="Hero"
                        fill
                        className="object-cover opacity-30 scale-110"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
                </div>

                {/* Top: Logo */}
                <div className="relative z-10 pt-14 flex flex-col items-center gap-3">
                    <Logo variant="icon" size={48} mode="dark" />
                    <motion.p
                        initial={{ opacity: 0, letterSpacing: '0.8em' }}
                        animate={{ opacity: 1, letterSpacing: '0.3em' }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[9px] font-black uppercase text-white/60 tracking-[0.3em]"
                    >
                        The Highest Fidelity Marketplace
                    </motion.p>
                </div>

                {/* Center: Hero Text */}
                <div className="relative z-10 flex flex-col items-center text-center px-6 -mt-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.3 }}
                        className="text-5xl font-black italic uppercase tracking-tight leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 font-[family-name:var(--font-bruno-ace)]"
                    >
                        MOTOR
                        <br />
                        CYCLES
                    </motion.h1>

                    {/* EMI Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="mt-6 px-4 py-2 rounded-full bg-brand-primary/15 border border-brand-primary/30 backdrop-blur-xl"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                            ⚡ India&apos;s Lowest EMI Guarantee
                        </span>
                    </motion.div>
                </div>

                {/* Bottom: CTA + Stats */}
                <div className="relative z-10 w-full px-4 pb-8 flex flex-col items-center gap-6">
                    {/* Category Chips - Moved into Hero for Viewport visibility */}
                    <div className="flex gap-2 w-full">
                        {CATEGORIES.map((cat, i) => {
                            const count = items?.filter(item => item.bodyType === cat.bodyType).length ?? 0;

                            return (
                                <Link
                                    key={i}
                                    href={cat.link}
                                    className="flex-1 group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl active:scale-[0.96] transition-all flex flex-col"
                                >
                                    <div className="relative h-16 flex items-end justify-center overflow-hidden">
                                        <Image
                                            src={cat.img}
                                            alt={cat.title}
                                            width={80}
                                            height={54}
                                            className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] relative z-10 -mb-1"
                                        />
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent opacity-30`}
                                        />
                                    </div>
                                    <div className="px-2 py-3 text-center flex flex-col gap-2 bg-gradient-to-b from-white/[0.05] to-transparent">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-white/90">
                                                {cat.title}
                                            </p>
                                            <p className="text-[8px] font-bold text-white/40 mt-0.5">{count} Models</p>
                                        </div>
                                        {/* Explore CTA */}
                                        <div className="mt-1 py-1.5 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center gap-1 group-hover:bg-brand-primary transition-colors">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white">
                                                {t('Explore')}
                                            </span>
                                            <ChevronRight size={8} className="text-white" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Stat Ticker */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-white/40"
                    >
                        <span>{skuCount || '130'}+ Models</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{MARKET_METRICS.avgSavings} Savings</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{MARKET_METRICS.deliveryTime}</span>
                    </motion.div>
                </div>
            </section>

            {/* ══════════════ SECTION 3: BRAND MARQUEE ══════════════ */}
            <section className="py-8 bg-gradient-to-b from-black via-zinc-950 to-black overflow-hidden">
                <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-5">
                    {t('Elite Makers')}
                </p>
                {/* Double marquee for seamless loop */}
                <div className="relative flex overflow-hidden">
                    <motion.div
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="flex gap-8 shrink-0"
                    >
                        {[...brands, ...brands].map((brand, i) => {
                            const color = BRAND_COLORS[brand.name.toUpperCase()] || '#ffffff';
                            return (
                                <Link
                                    key={`${brand.id}-${i}`}
                                    href={`/store/catalog?brand=${brand.name.toUpperCase()}`}
                                    className="flex-none flex flex-col items-center gap-2 w-16 active:scale-90 transition-transform"
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center border border-white/10"
                                        style={{ backgroundColor: color + '15' }}
                                    >
                                        {brand.brand_logos?.icon || brand.logo_svg ? (
                                            <div
                                                className="w-6 h-6 brightness-0 invert opacity-70 [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeSvg(
                                                        brand.brand_logos?.icon || brand.logo_svg || ''
                                                    ),
                                                }}
                                            />
                                        ) : (
                                            <span className="text-sm font-black text-white/60">{brand.name[0]}</span>
                                        )}
                                    </div>
                                    <span className="text-[7px] font-black uppercase tracking-wider text-white/40">
                                        {brand.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* ══════════════ SECTION 4: TRENDING RIDES ══════════════ */}
            {trendingItems.length > 0 && (
                <section className="py-10 bg-black">
                    <div className="flex items-center justify-between px-5 mb-5">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary">
                                {t('Popular Right Now')}
                            </p>
                            <h2 className="text-2xl font-black uppercase italic tracking-tight text-white mt-1">
                                {t('Trending')}
                            </h2>
                        </div>
                        <Link
                            href="/store/catalog"
                            className="flex items-center gap-1 text-[10px] font-bold text-white/50 uppercase tracking-wider active:text-white transition-colors"
                        >
                            {t('View All')}
                            <ChevronRight size={12} />
                        </Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-4 no-scrollbar">
                        {trendingItems.map((item, i) => {
                            const name = item.displayName || 'Unknown';
                            const brand = item.make || '';
                            const img = item.imageUrl;
                            const price = item.price?.onRoad || item.price?.exShowroom;

                            return (
                                <Link
                                    key={item.id || i}
                                    href={`/store/${brand.toLowerCase().replace(/\s+/g, '-')}/${item.modelSlug || item.slug || ''}`}
                                    className="snap-center flex-none w-[220px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden active:scale-[0.97] transition-all group"
                                >
                                    {/* Image */}
                                    <div className="relative h-[140px] bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center p-4">
                                        {img ? (
                                            <Image
                                                src={img}
                                                alt={name}
                                                width={180}
                                                height={120}
                                                className="object-contain drop-shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                                                <Sparkles size={24} className="text-white/30" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="px-4 py-3">
                                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-brand-primary/80">
                                            {brand}
                                        </p>
                                        <h3 className="text-sm font-black uppercase tracking-tight text-white mt-0.5 truncate">
                                            {name}
                                        </h3>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            {price ? (
                                                <span className="text-lg font-black text-white">
                                                    ₹{Math.round(price).toLocaleString('en-IN')}
                                                </span>
                                            ) : (
                                                <span className="text-sm font-bold text-white/40">
                                                    {t('Get Quote')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ══════════════ SECTION 5: HOW IT WORKS ══════════════ */}
            <section className="py-12 px-5 bg-gradient-to-b from-black to-zinc-950">
                <div className="text-center mb-8">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-primary mb-2">
                        {t('The Process')}
                    </p>
                    <h2 className="text-3xl font-black uppercase italic tracking-tight text-white">
                        {t('How It Works')}
                    </h2>
                </div>

                <div className="flex flex-col gap-3">
                    {[
                        {
                            step: '01',
                            title: t('Select'),
                            desc: t('Browse 130+ models with live regional pricing'),
                            icon: <Sparkles size={20} />,
                            gradient: 'from-violet-500/20 to-transparent',
                        },
                        {
                            step: '02',
                            title: t('Quote'),
                            desc: t('Instant on-road price — zero hidden charges'),
                            icon: <Shield size={20} />,
                            gradient: 'from-brand-primary/20 to-transparent',
                        },
                        {
                            step: '03',
                            title: t('Ride'),
                            desc: t('Digital docs, 4-hour delivery to your doorstep'),
                            icon: <Clock size={20} />,
                            gradient: 'from-emerald-500/20 to-transparent',
                        },
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => setActiveStep(i)}
                            className={`relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 active:scale-[0.98] ${
                                activeStep === i
                                    ? 'bg-white/10 border-white/20 shadow-lg'
                                    : 'bg-white/[0.03] border-white/5'
                            }`}
                        >
                            {/* Step number */}
                            <div
                                className={`flex-none w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center border border-white/10`}
                            >
                                <span className="text-white/80">{step.icon}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black tracking-[0.3em] text-brand-primary/60">
                                        {step.step}
                                    </span>
                                    <h3 className="text-base font-black uppercase tracking-tight text-white">
                                        {step.title}
                                    </h3>
                                </div>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">{step.desc}</p>
                            </div>

                            <ChevronRight
                                size={16}
                                className={`flex-none transition-all ${activeStep === i ? 'text-white/60 translate-x-0' : 'text-white/20 -translate-x-1'}`}
                            />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ══════════════ SECTION 6: USP STRIP ══════════════ */}
            <section className="py-8 px-5 bg-zinc-950">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: <Zap size={18} />, label: t('Instant\nQuotes'), color: 'text-brand-primary' },
                        { icon: <Shield size={18} />, label: t('Zero\nHidden'), color: 'text-emerald-400' },
                        { icon: <Clock size={18} />, label: t('4-Hour\nDelivery'), color: 'text-violet-400' },
                    ].map((usp, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-white/[0.03] border border-white/5"
                        >
                            <div className={usp.color}>{usp.icon}</div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-white/60 text-center whitespace-pre-line leading-tight">
                                {usp.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════ SECTION 7: SOCIAL PROOF ══════════════ */}
            <section className="py-10 bg-gradient-to-b from-zinc-950 to-black">
                <RiderPulse />
            </section>

            {/* ══════════════ FOOTER ══════════════ */}
            <Footer />
        </div>
    );
}
