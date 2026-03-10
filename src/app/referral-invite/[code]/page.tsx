'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Zap } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { OCircleMembershipCard } from '@/components/auth/OCircleMembershipCard';
import { createClient } from '@/lib/supabase/client';
import { formatMembershipCardCode } from '@/lib/oclub/membershipCardIdentity';
import { User } from '@supabase/supabase-js';
import { DiscoveryProvider } from '@/contexts/DiscoveryContext';
import { getReferralHotPicks } from '@/actions/catalog/referralActions';
import { CatalogCardAdapter } from '@/components/store/cards/VehicleCardAdapters';
import { useCatalogMarketplace } from '@/hooks/useCatalogMarketplace';
import type { ProductVariant } from '@/types/productMaster';

export default function ReferralInvitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0b0b0b]" />}>
            <DiscoveryProvider>
                <ReferralInviteContent />
            </DiscoveryProvider>
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
        <div className="min-h-screen bg-[#050505] selection:bg-[#f4b000]/30 overflow-x-hidden relative font-sans text-white">
            {/* ── Fixed Cinematic Background Layer ── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(45deg, #ffffff 0.5px, transparent 0.5px), linear-gradient(-45deg, #ffffff 0.5px, transparent 0.5px)`,
                        backgroundSize: '100px 100px',
                    }}
                />

                {/* Dynamic Cinematic Flows */}
                <div className="absolute top-[-10%] -left-[10%] w-[800px] h-[800px] bg-[#f4b000]/5 rounded-full blur-[160px]" />
                <div className="absolute bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-[#7EB4E2]/5 rounded-full blur-[140px]" />
            </div>

            {/* ── Sticky Navigation ── */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md bg-black/20 border-b border-white/5 py-4">
                <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
                    <Logo mode="dark" className="scale-75 origin-left" />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#f4b000] text-black font-black text-xs tracking-widest px-6 py-2.5 rounded-full uppercase"
                    >
                        Join O'Circle
                    </motion.button>
                </div>
            </header>

            {/* ── Hero Section: The Personal Invitation ── */}
            <section className="relative z-10 pt-32 pb-24 px-6 flex flex-col items-center min-h-[100vh] justify-center text-center">
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
                                Verified Personal Message
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] italic">
                            "Bhai, I just booked my bike & got a <span className="text-[#f4b000]">Solid Deal</span>!"
                        </h2>
                        <p className="text-white/50 text-base md:text-xl font-medium max-w-[600px] mx-auto leading-relaxed uppercase tracking-tighter">
                            BookMyBike saved me thousands. Plus, I just unlocked a{' '}
                            <span className="text-white font-black">Lifetime Earning Opportunity</span> through the
                            O'Circle Club.
                        </p>
                    </motion.div>

                    {/* Hero Card: Crystal Clear Spotlight */}
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

                    <p className="text-[#f4b000] font-black text-xs tracking-[0.4em] uppercase mb-12">
                        Scan or Click Below to Join the O'Circle
                    </p>
                </div>
            </section>

            {/* ── Section: Intro to BookMyBike & O'Circle ── */}
            <section className="relative z-10 px-6 py-32 bg-gradient-to-b from-transparent to-black/90">
                <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <h4 className="text-[#f4b000] font-black text-xs tracking-[0.5em] uppercase">
                                The Ecosystem
                            </h4>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                                WHAT IS BOOKMYBIKE?
                            </h2>
                        </div>
                        <p className="text-white/60 text-lg leading-relaxed font-medium">
                            BookMyBike isn't just a platform; it's an{' '}
                            <span className="text-white font-bold">Elite Verified Network</span>. Our council audits
                            every deal from manufacturers & dealerships to ensure you get the absolute lowest price on
                            your favorite vehicle.
                        </p>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#f4b000] mt-2.5 shrink-0" />
                                <p className="text-sm font-bold uppercase tracking-widest opacity-80">
                                    <span className="text-white">O'Circle Club:</span> Join the inner circle to earn for
                                    life.
                                </p>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#f4b000] mt-2.5 shrink-0" />
                                <p className="text-sm font-bold uppercase tracking-widest opacity-80">
                                    <span className="text-white">B-Coin Economy:</span> Every coin is real money
                                    subtracted from your bike cost.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#f4b000]/10 blur-[120px] rounded-full group-hover:bg-[#f4b000]/20 transition-all duration-700" />
                        <div className="relative bg-white/5 border border-white/10 p-12 rounded-[50px] backdrop-blur-3xl">
                            <Logo mode="dark" className="scale-150 mb-12 origin-left" />
                            <h3 className="text-2xl font-black mb-6 tracking-tight">THE O'CIRCLE COUNCIL</h3>
                            <p className="text-white/40 text-sm leading-relaxed uppercase font-bold tracking-widest">
                                Every referral is a key to a curated world of automotive rewards. Verified by verified
                                riders.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section: Today's Hot Picks (Dynamic Grid) ── */}
            <section className="relative z-10 px-6 py-40">
                <div className="max-w-[1440px] mx-auto space-y-24">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Zap className="text-[#f4b000] fill-[#f4b000]" size={20} />
                                <h4 className="text-[#f4b000] font-black text-xs tracking-[0.6em] uppercase">
                                    Today's Hot Picks
                                </h4>
                            </div>
                            <h2 className="text-4xl md:text-8xl font-black tracking-tighter italic">
                                BIGGEST DISCOUNTS
                            </h2>
                        </div>
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest max-w-xs text-right">
                            Showing real-time offers verified for your region. Prices updated daily by the council.
                        </p>
                    </div>

                    {isCatalogLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-[40px]" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {catalogItems.map(v => (
                                <motion.div
                                    key={v.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="relative"
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

            {/* ── Final Discovery Section ── */}
            <section className="relative z-10 px-6 py-40 text-center">
                <div className="max-w-[600px] mx-auto space-y-12">
                    <div className="space-y-4">
                        <h2 className="text-5xl md:text-8xl font-black tracking-tighter">JOIN NOW</h2>
                        <p className="text-white/40 text-sm font-bold tracking-[0.4em] uppercase">
                            Join your friend inside the O'Circle
                        </p>
                    </div>

                    <div className="p-12 bg-white rounded-[50px] shadow-[0_50px_100px_rgba(244,176,0,0.2)]">
                        <div className="flex flex-col items-center gap-8">
                            <QRCodeSVG value={referralUrl} size={200} level="H" fgColor="#000000" />
                            <div className="space-y-2">
                                <p className="text-black font-black text-2xl tracking-tighter">IMMEDIATE 13 B-COINS</p>
                                <p className="text-black/40 text-[10px] font-black tracking-widest uppercase italic">
                                    Valid only via this personal link
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full bg-[#0b0b0b] text-[#f4b000] font-black text-xl py-6 rounded-3xl uppercase tracking-widest shadow-2xl"
                            >
                                Join The O'Circle
                            </motion.button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="relative z-10 py-24 border-t border-white/5 bg-black/40">
                <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col items-center md:items-start gap-6">
                        <Logo mode="dark" className="scale-100" />
                        <p className="text-[10px] font-black tracking-[0.8em] uppercase opacity-30">
                            THE O'CIRCLE COUNCIL • EST 2026
                        </p>
                    </div>
                    <div className="flex gap-12">
                        <div className="space-y-3">
                            <h5 className="text-[9px] font-black tracking-widest uppercase opacity-40">Verified by</h5>
                            <p className="text-xs font-black tracking-tighter">BOOKMY.BIKE CREW</p>
                        </div>
                        <div className="space-y-3">
                            <h5 className="text-[9px] font-black tracking-widest uppercase opacity-40">Status</h5>
                            <p className="text-xs font-black tracking-tighter text-green-500">SYSTEMS ONLINE</p>
                        </div>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes shimmer {
                    from {
                        transform: translate(-50%, -50%) rotate(0deg);
                    }
                    to {
                        transform: translate(-50%, -50%) rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
