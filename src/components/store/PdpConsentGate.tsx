'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingDown, Banknote, Gift, LogIn, Coins, ShieldCheck } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const LoginSidebar = dynamic(() => import('@/components/auth/LoginSidebar'), { ssr: false });

import { REFERRAL_STORAGE_KEY, extractReferralFromSearch } from '@/lib/constants/referral';

interface PdpConsentGateProps {
    make: string;
    model: string;
    variant: string;
    /** Server-resolved product hero image URL (color-aware, optimistic first colour). */
    heroImage?: string;
    /** Formatted ex-showroom string e.g. "₹1,05,000" — used in the savings tease. */
    exShowroomFormatted?: string;
}

/**
 * PdpConsentGate — Full-screen premium overlay
 * ─────────────────────────────────────────────
 * Full viewport takeover with:
 *  - Top half: hero image (or gradient fallback) with cinematic gradient overlay
 *  - Bottom half: dark panel with benefit list, B-coin tease, single CTA
 *  - No stacked pill buttons — single primary action at the bottom
 */
export default function PdpConsentGate({ make, model, variant, heroImage, exShowroomFormatted }: PdpConsentGateProps) {
    const [isLoginOpen, setIsLoginOpen] = React.useState(false);
    const [sidebarInitialStep, setSidebarInitialStep] = React.useState<'INITIAL' | 'SIGNUP'>('INITIAL');
    const capturedRef = useRef(false);

    useEffect(() => {
        if (capturedRef.current) return;
        capturedRef.current = true;
        try {
            const ref = extractReferralFromSearch(window.location.search);
            if (ref) {
                localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
            }
        } catch {
            /* localStorage blocked in private mode */
        }
    }, []);

    // Signal ShopperBottomNav to hide its duplicate login CTA while gate is visible
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('pdpConsentGateVisible', { detail: { visible: true } }));
        return () => {
            window.dispatchEvent(new CustomEvent('pdpConsentGateVisible', { detail: { visible: false } }));
        };
    }, []);

    const vehicleLabel = [make, model, variant].map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    const handleOpenLogin = () => {
        setSidebarInitialStep('INITIAL');
        setIsLoginOpen(true);
    };
    const handleOpenSignup = () => {
        setSidebarInitialStep('SIGNUP');
        setIsLoginOpen(true);
    };

    const benefits = [
        {
            icon: MapPin,
            label: 'Area-based dealer offers',
            sub: 'Best price for your pin code',
        },
        {
            icon: Banknote,
            label: 'Verified EMI from financiers',
            sub: 'Real rates, no guesstimates',
        },
        {
            icon: TrendingDown,
            label: 'Live discounts',
            sub: exShowroomFormatted
                ? `Save on ₹${exShowroomFormatted} on-road`
                : 'Up to ₹10,000 for serviceable zones',
        },
        {
            icon: ShieldCheck,
            label: 'Zero booking fee',
            sub: 'Reserve your slot, pay at dealer',
        },
    ];

    return (
        <>
            {/* Full-screen dark backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-40 bg-[#080a0f]/80 backdrop-blur-[8px]"
                aria-hidden="true"
            />

            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed inset-0 z-50 flex flex-col"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pdp-consent-heading"
                >
                    {/* ── TOP HALF: Hero visual ── */}
                    <div className="relative flex-[0_0_42%] w-full overflow-hidden bg-[#0f1117]">
                        {heroImage ? (
                            <Image
                                src={heroImage}
                                alt={vehicleLabel}
                                fill
                                className="object-contain object-center"
                                priority
                                sizes="100vw"
                            />
                        ) : (
                            /* Fallback gradient when no hero image */
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1200] via-[#0f1117] to-[#0a0c12]" />
                        )}

                        {/* Cinematic gradient fade into bottom panel */}
                        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0f1117] to-transparent" />

                        {/* Vehicle label watermark at top */}
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#080a0f]/70 to-transparent flex items-start px-5 pt-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F4B000]/80">
                                Personalised Offers
                            </p>
                        </div>
                    </div>

                    {/* ── BOTTOM HALF: Dark content panel ── */}
                    <div className="flex-1 bg-[#0f1117] flex flex-col overflow-y-auto">
                        <div className="px-5 pt-4 pb-2 space-y-5">
                            {/* Heading */}
                            <div>
                                <h2
                                    id="pdp-consent-heading"
                                    className="text-[22px] font-black text-white leading-tight tracking-tight"
                                >
                                    Unlock your best deal on <span className="text-[#F4B000]">{vehicleLabel}</span>
                                </h2>
                                <p className="mt-1 text-[12px] text-slate-400">
                                    Login once. Get personalised pricing, EMI & offers — instantly.
                                </p>
                            </div>

                            {/* Benefit grid — 2×2 on mobile */}
                            <div className="grid grid-cols-2 gap-2.5">
                                {benefits.map(({ icon: Icon, label, sub }) => (
                                    <div
                                        key={label}
                                        className="flex flex-col gap-2 rounded-2xl bg-white/5 border border-white/8 px-3.5 py-3"
                                    >
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F4B000]/15">
                                            <Icon className="h-4 w-4 text-[#F4B000]" strokeWidth={2.5} />
                                        </span>
                                        <div>
                                            <p className="text-[12px] font-bold text-white leading-snug">{label}</p>
                                            <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">{sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* B-coin value prop */}
                            <div className="flex items-center gap-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/20 px-3.5 py-2.5">
                                <Coins className="h-4 w-4 text-[#F4B000] shrink-0" strokeWidth={2.5} />
                                <p className="text-[11.5px] text-amber-200 font-semibold leading-snug">
                                    New signup → <span className="font-black text-[#F4B000]">13 B-Coins credited</span>{' '}
                                    <span className="font-normal text-amber-300/70">(₹1,000 discount equivalent)</span>
                                </p>
                            </div>

                            {/* Referral banner */}
                            <ReferralBanner />
                        </div>

                        {/* Spacer pushes CTA to bottom */}
                        <div className="flex-1" />

                        {/* ── Sticky bottom CTA ── */}
                        <div className="px-5 pb-8 pt-4 bg-gradient-to-t from-[#080a0f] to-transparent space-y-2">
                            <button
                                type="button"
                                id="pdp-consent-login-btn"
                                data-testid="pdp-consent-login"
                                onClick={handleOpenLogin}
                                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#F4B000] py-4 text-[14px] font-black uppercase tracking-[0.15em] text-[#0b0d10] shadow-[0_4px_24px_rgba(244,176,0,0.35)] hover:bg-[#e0a500] hover:shadow-[0_4px_32px_rgba(244,176,0,0.5)] active:scale-[0.98] transition-all duration-200"
                            >
                                <LogIn className="h-4.5 w-4.5" strokeWidth={2.5} />
                                Login to View Offers
                            </button>
                            <p className="text-center text-[10.5px] text-slate-500">
                                No spam · Just accurate pricing for your area
                            </p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* LoginSidebar — slides in over the consent gate */}
            <LoginSidebar
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                variant="RETAIL"
                initialStep={sidebarInitialStep}
            />
        </>
    );
}

/** Shows a small referral banner only when ?ref= was captured in the URL. */
function ReferralBanner() {
    const [code, setCode] = React.useState<string | null>(null);

    useEffect(() => {
        try {
            const fromUrl = extractReferralFromSearch(window.location.search);
            if (fromUrl) {
                setCode(fromUrl);
            }
        } catch {
            /* ignore */
        }
    }, []);

    if (!code) return null;

    return (
        <div className="flex items-center gap-2.5 rounded-2xl bg-green-400/10 border border-green-400/20 px-3.5 py-2.5">
            <Gift className="h-4 w-4 text-green-400 shrink-0" strokeWidth={2.5} />
            <p className="text-[11.5px] text-green-200 font-semibold leading-snug">
                Referral <span className="font-black">{code}</span> detected —{' '}
                <span className="font-normal text-green-300/70">bonus auto-applies after signup</span>
            </p>
        </div>
    );
}
