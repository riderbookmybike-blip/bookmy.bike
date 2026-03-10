'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Zap, Gift, Users, Coins, ShieldCheck, ArrowRight } from 'lucide-react';
import { OCircleMembershipCard } from '@/components/auth/OCircleMembershipCard';
import { createClient } from '@/lib/supabase/client';
import { formatMembershipCardCode } from '@/lib/oclub/membershipCardIdentity';
import { User } from '@supabase/supabase-js';
import { getReferralHotPicks } from '@/actions/catalog/referralActions';
import { CatalogCardAdapter } from '@/components/store/cards/VehicleCardAdapters';
import { useCatalogMarketplace } from '@/hooks/useCatalogMarketplace';
import type { ProductVariant } from '@/types/productMaster';

export default function ReferralInvitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
            <ReferralInviteContent />
        </Suspense>
    );
}

function ReferralInviteContent() {
    const params = useParams();
    const code = params.code as string;
    const [user, setUser] = useState<User | null>(null);
    const [catalogItems, setCatalogItems] = useState<ProductVariant[]>([]);
    const [isCatalogLoading, setIsCatalogLoading] = useState(true);

    // Fetch User Context
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    // Fetch dynamic "Biggest Discounts" (Specific requested lineup)
    useEffect(() => {
        async function loadHotPicks() {
            try {
                const result = await getReferralHotPicks('MH');
                if (result.success && result.data) {
                    const items = result.data;

                    const requestedSlugs = [
                        'honda-activa',
                        'tvs-jupiter',
                        'hero-splendor-plus',
                        'tvs-raider-125',
                        'sp-125', // Shine substitute
                        'dio-125', // RayZR substitute
                    ];

                    const filtered = items.filter(
                        v => requestedSlugs.includes(v.modelSlug) || requestedSlugs.includes(v.slug)
                    );

                    const ordered = requestedSlugs
                        .map(slug => filtered.find(f => f.modelSlug === slug || f.slug === slug))
                        .filter(Boolean) as ProductVariant[];

                    setCatalogItems(ordered.slice(0, 6));
                }
            } catch (err) {
                console.error('Failed to load hot picks:', err);
            } finally {
                setIsCatalogLoading(false);
            }
        }
        loadHotPicks();
    }, []);

    const { winnersMap } = useCatalogMarketplace('ALL', 'MH');

    const referralUrl = useMemo(() => {
        if (!code) return '';
        return `https://www.bookmy.bike/store?ref=${code}`;
    }, [code]);

    const userName = useMemo(() => {
        return (user?.user_metadata?.full_name || 'BMB PRIVILEGED MEMBER').toUpperCase();
    }, [user]);

    const formattedCode = useMemo(() => {
        return formatMembershipCardCode(code);
    }, [code]);

    return (
        <div className="min-h-screen selection:bg-[#f4b000]/30 overflow-x-hidden relative font-sans">
            {/* ── Hero Section ── */}
            <section className="relative bg-gradient-to-b from-[#0b0b0b] via-[#111] to-[#0b0b0b] text-white overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(45deg, #ffffff 0.5px, transparent 0.5px), linear-gradient(-45deg, #ffffff 0.5px, transparent 0.5px)`,
                            backgroundSize: '100px 100px',
                        }}
                    />
                    <div className="absolute top-[-10%] -left-[10%] w-[800px] h-[800px] bg-[#f4b000]/5 rounded-full blur-[160px]" />
                    <div className="absolute bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-[#7EB4E2]/5 rounded-full blur-[140px]" />
                </div>

                <div className="relative z-10 pt-16 pb-24 px-6 flex flex-col items-center text-center">
                    <div className="max-w-[800px] w-full">
                        {/* The "Personal Voice" Introduction */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-12 space-y-6"
                        >
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                                    Verified Personal Invite
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] italic">
                                &quot;Bhai, I just booked my bike & got a{' '}
                                <span className="text-[#f4b000]">Solid Deal</span>!&quot;
                            </h2>
                            <p className="text-white/50 text-base md:text-lg font-medium max-w-[600px] mx-auto leading-relaxed">
                                BookMyBike saved me thousands. Plus, I just unlocked a{' '}
                                <span className="text-white font-black">Lifetime Earning Opportunity</span> through the
                                O&apos;Circle Club.
                            </p>
                        </motion.div>

                        {/* Hero Card: Membership Card */}
                        <div className="relative w-full mb-12">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[#f4b000]/10 blur-[100px] rounded-full z-0" />
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                className="z-20 relative flex justify-center"
                            >
                                <OCircleMembershipCard
                                    memberName={userName}
                                    memberCode={formattedCode}
                                    sizePreset="showcase"
                                    compact={false}
                                    isActive={false}
                                    maxWidthClassName="max-w-[400px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]"
                                />
                            </motion.div>
                        </div>

                        <p className="text-[#f4b000] font-black text-xs tracking-[0.4em] uppercase">
                            Scan or Click Below to Join the O&apos;Circle
                        </p>
                    </div>
                </div>
            </section>

            {/* ── What is BookMyBike Section ── */}
            <section className="bg-white px-6 py-20 md:py-28">
                <div className="max-w-[1200px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <h4 className="text-[#D6A900] font-black text-[10px] tracking-[0.5em] uppercase">
                                    The Ecosystem
                                </h4>
                                <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.95] text-slate-900">
                                    WHAT IS BOOKMYBIKE?
                                </h2>
                            </div>
                            <p className="text-slate-500 text-base leading-relaxed">
                                BookMyBike isn&apos;t just a platform; it&apos;s an{' '}
                                <span className="text-slate-900 font-bold">Elite Verified Network</span>. Our council
                                audits every deal from manufacturers & dealerships to ensure you get the absolute lowest
                                price on your favorite vehicle.
                            </p>
                            <div className="space-y-4">
                                {[
                                    {
                                        icon: Users,
                                        label: "O'Circle Club",
                                        desc: 'Join the inner circle to earn for life.',
                                    },
                                    {
                                        icon: Coins,
                                        label: 'B-Coin Economy',
                                        desc: 'Every coin is real money subtracted from your bike cost.',
                                    },
                                    {
                                        icon: ShieldCheck,
                                        label: 'Verified Deals',
                                        desc: 'Every price is audited by the BMB council.',
                                    },
                                ].map(item => (
                                    <div
                                        key={item.label}
                                        className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-[#f4b000]/10 flex items-center justify-center shrink-0">
                                            <item.icon size={18} className="text-[#D6A900]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{item.label}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right side — info card */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#f4b000]/5 blur-[80px] rounded-full" />
                            <div className="relative bg-slate-50 border border-slate-200 p-10 md:p-12 rounded-[32px]">
                                <div className="space-y-6">
                                    <div className="w-14 h-14 rounded-2xl bg-[#f4b000]/10 flex items-center justify-center">
                                        <Gift size={24} className="text-[#D6A900]" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                        THE O&apos;CIRCLE COUNCIL
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Every referral is a key to a curated world of automotive rewards. Verified by
                                        verified riders. Join a community that earns together.
                                    </p>
                                    <div className="flex items-center gap-2 text-[#D6A900] text-sm font-black">
                                        <span>Learn more</span>
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Today's Hot Picks Section ── */}
            <section className="bg-slate-50 px-6 py-20 md:py-28">
                <div className="max-w-[1440px] mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Zap className="text-[#D6A900] fill-[#D6A900]" size={18} />
                                <h4 className="text-[#D6A900] font-black text-[10px] tracking-[0.5em] uppercase">
                                    Today&apos;s Hot Picks
                                </h4>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">
                                BIGGEST DISCOUNTS
                            </h2>
                        </div>
                        <p className="text-slate-400 text-xs font-semibold max-w-xs md:text-right leading-relaxed">
                            Showing real-time offers verified for your region. Prices updated daily by the council.
                        </p>
                    </div>

                    {isCatalogLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div
                                    key={i}
                                    className="aspect-[4/5] bg-white animate-pulse rounded-3xl border border-slate-100"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {catalogItems.map(v => (
                                <motion.div
                                    key={v.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                >
                                    <CatalogCardAdapter
                                        variant={v}
                                        bestOffer={
                                            winnersMap[v.id]
                                                ? {
                                                      ...winnersMap[v.id],
                                                      studio_id: winnersMap[v.id]?.studio_id ?? undefined,
                                                  }
                                                : null
                                        }
                                        viewMode="grid"
                                        downpayment={50000}
                                        tenure={36}
                                        showBcoinBadge={true}
                                        serviceability={{ status: 'serviceable', district: 'ALL' }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Join Now / QR Section ── */}
            <section className="bg-white px-6 py-20 md:py-28 text-center">
                <div className="max-w-[500px] mx-auto space-y-10">
                    <div className="space-y-3">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">JOIN NOW</h2>
                        <p className="text-slate-400 text-sm font-semibold">
                            Join your friend inside the O&apos;Circle
                        </p>
                    </div>

                    <div className="p-10 bg-slate-50 border border-slate-200 rounded-[32px]">
                        <div className="flex flex-col items-center gap-8">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <QRCodeSVG value={referralUrl} size={180} level="H" fgColor="#0f172a" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-slate-900 font-black text-xl tracking-tight">IMMEDIATE 13 B-COINS</p>
                                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
                                    Valid only via this personal link
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-[#0b0b0b] text-[#f4b000] font-black text-base py-4 rounded-2xl uppercase tracking-widest shadow-lg hover:shadow-xl transition-shadow"
                            >
                                Join The O&apos;Circle
                            </motion.button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
