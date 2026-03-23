'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingDown, Banknote, Gift, LogIn, UserPlus, Coins } from 'lucide-react';
import dynamic from 'next/dynamic';

const LoginSidebar = dynamic(() => import('@/components/auth/LoginSidebar'), { ssr: false });

const REFERRAL_STORAGE_KEY = 'bkmb_referral_code';
const REFERRAL_QUERY_KEYS = ['ref', 'referral', 'referral_code', 'code'] as const;

function extractReferralFromUrl(search: string): string {
    const params = new URLSearchParams(search);
    for (const key of REFERRAL_QUERY_KEYS) {
        const value = String(params.get(key) || '')
            .trim()
            .toUpperCase();
        if (value && /^[A-Z0-9_-]{3,32}$/.test(value)) return value;
    }
    return '';
}

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
 * PdpConsentGate
 * ──────────────
 * Overlay rendered when the user is authenticated (proxy.ts lets them in) but
 * commercial context (serviceability / offers) hasn't resolved yet, OR when the
 * PDP page loads while the user's session is freshly established.
 *
 * Design rules:
 *  - Specs / images visible beneath a subtle blur backdrop (warmth, not hard-block)
 *  - No redirect. User stays on page. LoginSidebar slides in on CTA click.
 *  - Referral from ?ref= URL param is captured into localStorage before the
 *    sidebar opens so LoginSidebar auto-populates referralCodeFromLink.
 *  - After login, LoginSidebar does window.location.href → page reloads with auth.
 */
export default function PdpConsentGate({ make, model, variant, heroImage, exShowroomFormatted }: PdpConsentGateProps) {
    const [isLoginOpen, setIsLoginOpen] = React.useState(false);
    const [sidebarInitialStep, setSidebarInitialStep] = React.useState<'INITIAL' | 'SIGNUP'>('INITIAL');
    const capturedRef = useRef(false);

    // Capture ?ref= into localStorage so LoginSidebar auto-reads it on open.
    // LoginSidebar already reads localStorage[REFERRAL_STORAGE_KEY] on isOpen change.
    useEffect(() => {
        if (capturedRef.current) return;
        capturedRef.current = true;
        try {
            const ref = extractReferralFromUrl(window.location.search);
            if (ref) {
                localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
            }
        } catch {
            /* localStorage blocked in private mode */
        }
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
                ? `Save on ₹${exShowroomFormatted} on-road price`
                : 'Up to ₹10,000 for serviceable zones',
        },
    ];

    return (
        <>
            {/* Backdrop — soft blur, specs/images remain visible beneath */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-[6px]"
                aria-hidden="true"
            />

            {/* Consent Modal */}
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pdp-consent-heading"
                >
                    <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
                        {/* Gradient accent strip — hardcoded so it never depends on CSS token resolution */}
                        <div className="h-1 w-full bg-gradient-to-r from-[#F4B000] via-rose-400 to-orange-400" />

                        <div className="px-6 pt-5 pb-6 space-y-5">
                            {/* Heading */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">
                                    Personalised Offers
                                </p>
                                <h2
                                    id="pdp-consent-heading"
                                    className="text-[17px] font-black text-slate-900 leading-snug"
                                >
                                    Unlock your best deal on <span className="text-[#F4B000]">{vehicleLabel}</span>
                                </h2>
                            </div>

                            {/* Benefit list */}
                            <ul className="space-y-3">
                                {benefits.map(({ icon: Icon, label, sub }) => (
                                    <li key={label} className="flex items-start gap-3">
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#F4B000]/10">
                                            <Icon className="h-3.5 w-3.5 text-[#b88900]" strokeWidth={2.5} />
                                        </span>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-800 leading-tight">
                                                {label}
                                            </p>
                                            <p className="text-[11px] text-slate-500">{sub}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* New user B-coin value prop */}
                            <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 px-3.5 py-2.5">
                                <Coins className="h-4 w-4 text-amber-600 shrink-0" strokeWidth={2.5} />
                                <p className="text-[12px] text-amber-800 font-semibold leading-snug">
                                    New signup → <span className="font-black">13 B-Coins credited</span>{' '}
                                    <span className="font-normal text-amber-700">(₹1,000 discount equivalent)</span>
                                </p>
                            </div>

                            {/* Referral banner — only shown when ?ref= present */}
                            <ReferralBanner />

                            <div className="flex flex-col gap-2.5 pt-1">
                                {/* CTA 1 — LOGIN (primary, high contrast: black text on brand yellow) */}
                                <button
                                    type="button"
                                    id="pdp-consent-login-btn"
                                    data-testid="pdp-consent-login"
                                    onClick={handleOpenLogin}
                                    className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#F4B000] py-3.5 text-[13px] font-black uppercase tracking-[0.14em] text-[#0b0d10] shadow-md hover:bg-[#e0a500] active:scale-[0.98] transition-all"
                                >
                                    <LogIn className="h-4 w-4" strokeWidth={2.5} />
                                    LOGIN TO VIEW OFFERS
                                </button>
                                {/* CTA 2 — SIGN UP (secondary, dark border + white bg) */}
                                <button
                                    type="button"
                                    id="pdp-consent-signup-btn"
                                    data-testid="pdp-consent-signup"
                                    onClick={handleOpenSignup}
                                    className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-[#cbd5e1] bg-white py-3.5 text-[13px] font-black uppercase tracking-[0.14em] text-[#0f172a] hover:border-[#94a3b8] hover:bg-slate-50 active:scale-[0.98] transition-all"
                                >
                                    <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                                    NEW HERE? SIGN UP
                                </button>
                            </div>

                            <p className="text-center text-[10px] text-slate-400">
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
            const fromUrl = extractReferralFromUrl(window.location.search);
            if (fromUrl) {
                setCode(fromUrl);
            }
        } catch {
            /* ignore */
        }
    }, []);

    if (!code) return null;

    return (
        <div className="flex items-center gap-2.5 rounded-2xl bg-green-50 border border-green-200 px-3.5 py-2.5">
            <Gift className="h-4 w-4 text-green-600 shrink-0" strokeWidth={2.5} />
            <p className="text-[12px] text-green-800 font-semibold leading-snug">
                Referral <span className="font-black">{code}</span> detected —{' '}
                <span className="font-normal text-green-700">bonus auto-applies after signup</span>
            </p>
        </div>
    );
}
