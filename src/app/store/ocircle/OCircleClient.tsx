'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Target,
    Zap,
    ChevronDown,
    CheckCircle2,
    ArrowRight,
    Globe,
    UserPlus,
    ShoppingBag,
    Coins,
    Truck,
    Tag,
    Wrench,
    Phone,
    Gift,
    TrendingUp,
    TrendingDown,
    FileCheck,
    Users,
    BadgeCheck,
    Landmark,
    Clock,
} from 'lucide-react';
import { MembershipCard } from '@/components/auth/MembershipCard';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { getOClubWallet, getOClubLedger } from '@/actions/oclub';

/* ═══════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════ */

const BENEFITS = [
    {
        step: '01',
        title: 'Zero Downpayment',
        subtitle: 'INSTANT OWNERSHIP',
        desc: 'Ride home today with ₹0 upfront. 100% on-road financing through our banking partners.',
        icon: Shield,
        color: '#F4B000',
        cardData: { name: 'RAKESH KUMAR', id: 'XJD-Y84-K8R', validity: '31/12/2026' },
    },
    {
        step: '02',
        title: 'Zero Processing Fee',
        subtitle: 'NO HIDDEN CHARGES',
        desc: 'No processing charges. No management fees. What you see is what you pay.',
        icon: Target,
        color: '#10B981',
        cardData: { name: 'SARAH JANE', id: 'TR7-P9Q-W2M', validity: '15/06/2027' },
    },
    {
        step: '03',
        title: 'Zero Documentation',
        subtitle: '60-SECOND eKYC',
        desc: 'Aadhaar-based digital verification. No papers, no photocopies — done in under 60 seconds.',
        icon: Zap,
        color: '#818CF8',
        cardData: { name: 'VIKRAM SETH', id: 'H5K-L3N-9P1', validity: '22/09/2026' },
    },
];

const HOW_IT_WORKS = [
    { icon: UserPlus, title: 'Sign Up', desc: 'OTP verify in 30 seconds. Free, no commitment.', color: '#F4B000' },
    {
        icon: ShoppingBag,
        title: 'Choose & Book',
        desc: 'Pick your ride. ₹0 down, ₹0 processing, ₹0 docs.',
        color: '#10B981',
    },
    {
        icon: Coins,
        title: 'Ride & Earn',
        desc: 'Earn B-Coins on every purchase. Refer friends for more.',
        color: '#818CF8',
    },
];

const PERKS = [
    { icon: Truck, label: 'Priority Delivery', desc: 'Delivered first' },
    { icon: Tag, label: 'Exclusive Prices', desc: 'Members-only deals' },
    { icon: Coins, label: 'B-Coins', desc: 'Earn & redeem' },
    { icon: Phone, label: 'Roadside Assist', desc: '24/7 support' },
    { icon: Wrench, label: 'Free Servicing', desc: 'First 2 on us' },
    { icon: Gift, label: 'Transferable', desc: 'Gift to family' },
];

const FAQ = [
    {
        q: 'Am I eligible for Zero Downpayment EMI?',
        a: "If you're 18+ with a valid Aadhaar and bank account, you're eligible. Our lender partners approve most applications within minutes. No CIBIL score minimum.",
    },
    {
        q: 'What documents do I need?',
        a: 'Just your phone and Aadhaar. Everything is digital — eKYC via Aadhaar, e-NACH for mandates. Zero physical documents required.',
    },
    {
        q: 'How does B-Coins/Rewards work?',
        a: '1 B-Coin = ₹1. Earn on every purchase, every referral, every activity. Redeem for accessories, servicing, or your next vehicle.',
    },
    {
        q: 'Can I cancel or return after booking?',
        a: 'Yes. Cancel within 24 hours for a full refund. After allocation, standard cancellation charges apply as per T&C.',
    },
    {
        q: 'Can I transfer my membership or B-Coins?',
        a: "Yes! O'Circle membership and B-Coins are fully transferable to any family member through your profile settings.",
    },
];

const TRUST_NUMBERS = [
    { icon: Users, value: '2,500+', label: 'Active Members' },
    { icon: Clock, value: '<60s', label: 'Avg. Approval' },
    { icon: Landmark, value: '5+', label: 'Lender Partners' },
    { icon: BadgeCheck, value: '98%', label: 'Approval Rate' },
];

/* ═══════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════ */

function FaqItem({ id, q, a, open, toggle }: { id: string; q: string; a: string; open: boolean; toggle: () => void }) {
    const triggerId = `ocircle-faq-trigger-${id}`;
    const panelId = `ocircle-faq-panel-${id}`;

    return (
        <div
            className={`border rounded-2xl transition-all ${open ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 hover:border-white/10'}`}
        >
            <button
                id={triggerId}
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-controls={panelId}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <span className="text-sm font-bold text-white/80 pr-4">{q}</span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={triggerId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <p className="px-4 pb-4 text-sm text-white/40 leading-relaxed">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   TRACKING HELPER
   ═══════════════════════════════════════════════════ */
function track(event: string, data?: Record<string, any>) {
    try {
        (window as any).gtag?.('event', event, data);
    } catch {
        /* noop */
    }
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export function OCircleClient() {
    const [activeBenefit, setActiveBenefit] = useState(0);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [wallet, setWallet] = useState<any>(null);
    const [ledger, setLedger] = useState<any[]>([]);
    const [walletLoading, setWalletLoading] = useState(false);
    const [showStickyCta, setShowStickyCta] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    // Fetch wallet + ledger for logged-in user
    useEffect(() => {
        if (!user?.id) {
            setWallet(null);
            setLedger([]);
            return;
        }
        setWalletLoading(true);
        Promise.all([getOClubWallet(user.id), getOClubLedger(user.id, 5)])
            .then(([wRes, lRes]) => {
                if (wRes.success) setWallet(wRes.wallet);
                if (lRes.success) setLedger(lRes.ledger || []);
            })
            .catch(() => {
                // Network/action failure — degrade gracefully
                setWallet(null);
                setLedger([]);
            })
            .finally(() => setWalletLoading(false));
    }, [user?.id]);

    useEffect(() => {
        if (user) {
            setShowStickyCta(false);
            return;
        }

        const evaluateSticky = () => {
            const scrollY = window.scrollY || 0;
            const nearBottom = window.innerHeight + scrollY >= document.body.scrollHeight - 220;
            setShowStickyCta(scrollY > 460 && !nearBottom);
        };

        evaluateSticky();
        window.addEventListener('scroll', evaluateSticky, { passive: true });
        window.addEventListener('resize', evaluateSticky);
        return () => {
            window.removeEventListener('scroll', evaluateSticky);
            window.removeEventListener('resize', evaluateSticky);
        };
    }, [user]);

    const active = BENEFITS[activeBenefit];
    const totalAvailable = wallet
        ? (wallet.available_system || 0) + (wallet.available_referral || 0) + (wallet.available_sponsored || 0)
        : 0;

    const handleCTA = (source: string) => {
        track('ocircle_cta_click', { source, logged_in: !!user });
        if (!user) {
            window.dispatchEvent(new Event('openLogin'));
            return;
        }
        router.push('/profile');
    };

    const scrollTo = (id: string) => {
        track('ocircle_nav', { target: id });
        const target = document.getElementById(id);
        if (!target) return;
        const headerOffset = 88;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    };

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        } catch {
            return '';
        }
    };

    const memberName = String(user?.user_metadata?.full_name ?? '').toUpperCase() || 'YOUR NAME HERE';

    return (
        <div className="min-h-screen bg-[#0b0d10] text-white">
            {/* ═══════════════ HERO — GUEST ═══════════════ */}
            {!user && (
                <section className="relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-[radial-gradient(circle,rgba(244,176,0,0.06),transparent_70%)]" />
                    <div className="relative z-10 max-w-[1440px] mx-auto px-5 md:px-6">
                        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-20 items-center min-h-[75vh] py-14 lg:py-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="space-y-5 text-center lg:text-left order-2 lg:order-1"
                            >
                                <div className="flex items-center gap-3 justify-center lg:justify-start">
                                    <div className="h-px w-8 bg-[#F4B000]/40" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F4B000]/80">
                                        The Privilege Tier
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-[0.85]">
                                    THE O&apos;
                                    <br />
                                    <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                        CIRCLE.
                                    </span>
                                </h1>
                                <div className="flex items-center gap-2 justify-center lg:justify-start flex-wrap">
                                    {['Zero Downpayment', 'Zero Fee', 'Zero Docs'].map((v, i) => (
                                        <React.Fragment key={v}>
                                            {i > 0 && <span className="text-white/15 text-xs">•</span>}
                                            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                                                {v}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                </div>
                                <p className="text-sm text-white/65 max-w-sm mx-auto lg:mx-0 leading-relaxed">
                                    Own your dream ride with zero barriers. Instant digital verification, no paperwork,
                                    no hidden fees.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleCTA('hero')}
                                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#F4B000] text-black rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-[#FFD700] transition-all active:scale-[0.97]"
                                    >
                                        Join O&apos;Circle — It&apos;s Free <ArrowRight size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => scrollTo('ocircle-how')}
                                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/[0.05] border border-white/10 text-white/80 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-white/[0.08] transition-all"
                                    >
                                        How It Works
                                    </button>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="flex items-center justify-center order-1 lg:order-2"
                            >
                                <div className="w-full max-w-[380px] lg:max-w-[460px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                                    <MembershipCard name="YOUR NAME HERE" id="BMB-XXX-XXX" validity="∞" compact />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════ HERO — LOGGED IN (Card + Wallet) ═══════════════ */}
            {user && (
                <section className="relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(244,176,0,0.06),transparent_70%)]" />
                    <div className="relative z-10 max-w-[1440px] mx-auto px-5 md:px-6 pt-6 pb-10 lg:py-12">
                        {/* Card + Status Row */}
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center lg:items-start">
                            {/* Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6 }}
                                className="w-full max-w-[340px] lg:max-w-[380px] shrink-0 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                            >
                                <MembershipCard name={memberName} id="BMB-XXX-XXX" validity="∞" compact />
                            </motion.div>

                            {/* Wallet Summary */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="flex-1 w-full space-y-4"
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-wider">
                                        Active Member
                                    </span>
                                </div>

                                {walletLoading ? (
                                    <div className="flex items-center py-6">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-[#F4B000] rounded-full animate-spin" />
                                    </div>
                                ) : wallet ? (
                                    <>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-[#F4B000]/10 to-[#F4B000]/5 border border-[#F4B000]/20">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-[#F4B000]/80">
                                                    Available
                                                </p>
                                                <p className="text-2xl font-black italic text-[#F4B000] mt-0.5">
                                                    {totalAvailable}
                                                </p>
                                                <p className="text-[10px] text-white/65">B-Coins</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-white/60">
                                                    Referral
                                                </p>
                                                <p className="text-xl font-black italic text-emerald-400 mt-0.5">
                                                    {wallet.available_referral || 0}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-white/60">
                                                    Lifetime
                                                </p>
                                                <p className="text-xl font-black italic text-white mt-0.5">
                                                    {wallet.lifetime_earned || 0}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-white/60">
                                                    Redeemed
                                                </p>
                                                <p className="text-xl font-black italic text-white/70 mt-0.5">
                                                    {wallet.lifetime_redeemed || 0}
                                                </p>
                                            </div>
                                        </div>

                                        {ledger.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/55 mb-2">
                                                    Recent Activity
                                                </p>
                                                <div className="flex flex-col gap-1">
                                                    {ledger.slice(0, 3).map((tx: any, i: number) => (
                                                        <div
                                                            key={tx.id || i}
                                                            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
                                                        >
                                                            <div
                                                                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                                                                    tx.delta > 0
                                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                                        : 'bg-red-500/10 text-red-400'
                                                                }`}
                                                            >
                                                                {tx.delta > 0 ? (
                                                                    <TrendingUp size={11} />
                                                                ) : (
                                                                    <TrendingDown size={11} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-bold text-white/75 truncate">
                                                                    {tx.source_type?.replace(/_/g, ' ') || tx.coin_type}
                                                                </p>
                                                            </div>
                                                            <span
                                                                className={`text-xs font-black ${tx.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                                            >
                                                                {tx.delta > 0 ? '+' : ''}
                                                                {tx.delta}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="py-4">
                                        <Coins size={20} className="text-white/10 mb-1" />
                                        <p className="text-[11px] text-white/65">
                                            No B-Coins yet. Refer friends to start earning!
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════ TRUST STRIP ═══════════════ */}
            <section className="border-b border-white/5">
                <div className="max-w-[1440px] mx-auto px-5 md:px-6 py-8">
                    <div className="grid grid-cols-4 gap-3">
                        {TRUST_NUMBERS.map(t => {
                            const Icon = t.icon;
                            return (
                                <div key={t.label} className="text-center">
                                    <Icon size={16} className="mx-auto text-white/45 mb-1.5" />
                                    <div className="text-lg md:text-2xl font-black italic tracking-tight text-white">
                                        {t.value}
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mt-0.5">
                                        {t.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════ HOW IT WORKS (3 Steps) ═══════════════ */}
            <section id="ocircle-how" className="border-b border-white/5">
                <div className="max-w-[1440px] mx-auto px-5 md:px-6 py-14 lg:py-20">
                    <div className="text-center mb-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-300/90">
                            How It Works
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter mt-2">
                            Three Steps
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        {HOW_IT_WORKS.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.12, duration: 0.5 }}
                                    className="relative flex flex-col items-center text-center p-5 rounded-2xl bg-white/[0.02] border border-white/5"
                                >
                                    <div className="relative mb-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${step.color}15` }}
                                        >
                                            <Icon size={20} style={{ color: step.color }} />
                                        </div>
                                        <div
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-black text-[9px] font-black flex items-center justify-center"
                                            style={{ backgroundColor: step.color }}
                                        >
                                            {i + 1}
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white/80">
                                        {step.title}
                                    </h3>
                                    <p className="text-[11px] text-white/70 mt-1.5 leading-relaxed">{step.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════ TRIPLE ZERO BENEFITS ═══════════════ */}
            <section id="ocircle-benefits" className="border-b border-white/5">
                <div className="max-w-[1440px] mx-auto px-5 md:px-6 py-14 lg:py-20">
                    <div className="text-center mb-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F4B000]/85">
                            The Triple Zero Promise
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter mt-2">
                            What You Get
                        </h2>
                    </div>

                    {/* ── MOBILE: Accordion ── */}
                    <div className="flex flex-col gap-2.5 lg:hidden">
                        {BENEFITS.map((b, i) => {
                            const Icon = b.icon;
                            const on = i === activeBenefit;
                            return (
                                <div
                                    key={i}
                                    className={`relative rounded-2xl border transition-all ${
                                        on ? 'bg-white/[0.04] border-white/10' : 'bg-transparent border-white/5'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveBenefit(i);
                                            track('ocircle_benefit_switch', { benefit: b.title });
                                        }}
                                        className="w-full flex items-center gap-3 p-4 text-left"
                                    >
                                        {on && (
                                            <motion.div
                                                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                                                style={{ backgroundColor: b.color }}
                                                initial={{ scaleY: 0 }}
                                                animate={{ scaleY: 1 }}
                                                transition={{ duration: 5, ease: 'linear' }}
                                            />
                                        )}
                                        <div
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                on ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/30'
                                            }`}
                                        >
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-black text-white/55 tracking-wider">
                                                {b.step}
                                            </span>
                                            <h3
                                                className={`text-sm font-black uppercase tracking-tight mt-0.5 ${on ? 'text-white' : 'text-white/55'}`}
                                            >
                                                {b.title}
                                            </h3>
                                        </div>
                                        <ChevronDown
                                            size={14}
                                            className={`shrink-0 text-white/50 transition-transform ${on ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {on && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 space-y-3">
                                                    <p className="text-xs text-white/75 leading-relaxed">{b.desc}</p>
                                                    <div className="flex justify-center">
                                                        <div className="w-full max-w-[300px] drop-shadow-[0_10px_25px_rgba(0,0,0,0.4)]">
                                                            <MembershipCard
                                                                name={b.cardData.name}
                                                                id={b.cardData.id}
                                                                validity={b.cardData.validity}
                                                                compact
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── DESKTOP: Side-by-side ── */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 flex flex-col gap-2">
                            {BENEFITS.map((b, i) => {
                                const Icon = b.icon;
                                const on = i === activeBenefit;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setActiveBenefit(i);
                                            track('ocircle_benefit_switch', { benefit: b.title });
                                        }}
                                        className={`relative flex items-start gap-3 p-4 rounded-2xl text-left transition-all border ${
                                            on
                                                ? 'bg-white/[0.04] border-white/10 shadow-lg shadow-black/20'
                                                : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                                        }`}
                                    >
                                        {on && (
                                            <motion.div
                                                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                                                style={{ backgroundColor: b.color }}
                                                initial={{ scaleY: 0 }}
                                                animate={{ scaleY: 1 }}
                                                transition={{ duration: 5, ease: 'linear' }}
                                            />
                                        )}
                                        <div
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${on ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/30'}`}
                                        >
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-black text-white/55 tracking-wider">
                                                {b.step}
                                            </span>
                                            <h3
                                                className={`text-sm font-black uppercase tracking-tight mt-0.5 ${on ? 'text-white' : 'text-white/55'}`}
                                            >
                                                {b.title}
                                            </h3>
                                            {on && (
                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="text-xs text-white/75 mt-1.5 leading-relaxed"
                                                >
                                                    {b.desc}
                                                </motion.p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="lg:col-span-8 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeBenefit}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full"
                                >
                                    <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-10">
                                        <div className="flex justify-center mb-8">
                                            <div className="w-full max-w-[380px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                                                <MembershipCard
                                                    name={active.cardData.name}
                                                    id={active.cardData.id}
                                                    validity={active.cardData.validity}
                                                    compact
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/65">
                                                {active.subtitle}
                                            </span>
                                            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                                                {active.title}
                                            </h3>
                                            <p className="text-sm text-white/75 max-w-md mx-auto leading-relaxed">
                                                {active.desc}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ ELIGIBILITY MICRO-SECTION ═══════════════ */}
            <section className="border-b border-white/5">
                <div className="max-w-3xl mx-auto px-5 md:px-6 py-14 lg:py-20">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-300/90">
                            Eligibility
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter mt-2">
                            Who Can Join?
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { icon: BadgeCheck, text: '18+ years old', sub: 'Indian citizen or resident' },
                            { icon: FileCheck, text: 'Valid Aadhaar', sub: 'For instant eKYC verification' },
                            { icon: Landmark, text: 'Bank Account', sub: 'Any savings account works' },
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.text}
                                    className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                        <Icon size={15} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white/70">{item.text}</p>
                                        <p className="text-[11px] text-white/65 mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-[11px] text-white/65 text-center mt-4">
                        No CIBIL score minimum. Subject to lender partner approval.{' '}
                        <button
                            type="button"
                            className="underline text-white/85 hover:text-white"
                            onClick={() => scrollTo('ocircle-faq')}
                        >
                            See T&amp;C in FAQ
                        </button>
                    </p>
                </div>
            </section>

            {/* ═══════════════ PERKS ═══════════════ */}
            <section className="border-b border-white/5">
                <div className="max-w-[1440px] mx-auto px-5 md:px-6 py-14 lg:py-20">
                    <div className="text-center mb-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-300/90">
                            Member Benefits
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter mt-2">
                            Beyond Zero
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                        {PERKS.map((perk, i) => {
                            const Icon = perk.icon;
                            return (
                                <motion.div
                                    key={perk.label}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05, duration: 0.4 }}
                                    className="group flex flex-col items-center text-center p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <Icon size={16} />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-white/80">
                                        {perk.label}
                                    </h4>
                                    <p className="text-[11px] text-white/65 mt-0.5">{perk.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════ FAQ ═══════════════ */}
            <section id="ocircle-faq" className="border-b border-white/5">
                <div className="max-w-xl mx-auto px-5 md:px-6 py-14 lg:py-20">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60">
                            Questions
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter mt-2">FAQ</h2>
                    </div>
                    <div className="flex flex-col gap-2">
                        {FAQ.map((item, i) => (
                            <FaqItem
                                key={item.q}
                                id={String(i)}
                                q={item.q}
                                a={item.a}
                                open={openFaq === i}
                                toggle={() => setOpenFaq(openFaq === i ? null : i)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ BOTTOM CTA (guest only) ═══════════════ */}
            {!user && (
                <section className="relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[radial-gradient(circle,rgba(244,176,0,0.08),transparent_70%)]" />
                    <div className="relative z-10 max-w-[1440px] mx-auto px-5 md:px-6 py-14 lg:py-20 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Logo variant="icon" size={24} />
                            <Globe size={20} className="text-[#FFD700]" />
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">
                            Ready to ride <span className="text-[#FFD700]">different?</span>
                        </h2>
                        <p className="text-white/65 mt-2 max-w-sm mx-auto text-sm">
                            Join thousands of riders who own smarter with O&apos;Circle.
                        </p>
                        <button
                            type="button"
                            onClick={() => handleCTA('bottom')}
                            className="mt-5 inline-flex items-center gap-2 px-8 py-3.5 bg-[#FFD700] text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#F4B000] transition-all active:scale-[0.97]"
                        >
                            Join Now — It&apos;s Free
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </section>
            )}

            {!user && (
                <div
                    className={`fixed bottom-[74px] left-0 right-0 z-40 px-4 pb-2 md:hidden transition-all duration-300 ${
                        showStickyCta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
                    }`}
                >
                    <button
                        type="button"
                        onClick={() => handleCTA('sticky_mobile')}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#F4B000] text-black rounded-xl font-black uppercase tracking-widest text-[11px] shadow-[0_-4px_20px_rgba(244,176,0,0.25)] active:scale-[0.98] transition-all"
                    >
                        Join O&apos;Circle — It&apos;s Free
                        <ArrowRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
