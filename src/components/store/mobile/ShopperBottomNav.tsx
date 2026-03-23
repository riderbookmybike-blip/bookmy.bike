'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    ArrowRight,
    Bike,
    CreditCard,
    Banknote,
    BookmarkPlus,
    Download,
    CalendarCheck,
    PhoneCall,
    SlidersHorizontal,
    LayoutGrid,
    LogIn,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiscovery } from '@/contexts/DiscoveryContext';

// ─── Pricing helpers ──────────────────────────────────────────────────────────
function readPricing() {
    try {
        const raw = localStorage.getItem('bkmb_pricing_prefs');
        if (raw) return JSON.parse(raw);
    } catch {
        /* ignore */
    }
    return { mode: 'finance', downpayment: 10000, tenure: 36 };
}
function writePricing(payload: unknown) {
    try {
        localStorage.setItem('bkmb_pricing_prefs', JSON.stringify(payload));
    } catch {
        /* ignore */
    }
}

// ─── PDP stage type ───────────────────────────────────────────────────────────
type PdpStage = 0 | 1 | 2 | 3;

// Stage meta — labels, icons, colours
const PDP_STAGES: {
    label: string;
    icon: React.ElementType;
    event: string;
    bg: string;
    shadow: string;
    text: string;
}[] = [
    {
        label: 'Save Quote',
        icon: BookmarkPlus,
        event: 'pdpSaveQuoteRequested',
        bg: 'bg-[#FFD700]',
        shadow: 'shadow-[0_6px_28px_rgba(255,215,0,0.45)]',
        text: 'text-[#0b0d10]',
    },
    {
        label: 'Download Quote',
        icon: Download,
        event: 'pdpDownloadQuoteRequested',
        bg: 'bg-[#1a1a2e]',
        shadow: 'shadow-[0_6px_28px_rgba(0,0,0,0.4)]',
        text: 'text-white',
    },
    {
        label: 'Confirm Booking',
        icon: CalendarCheck,
        event: 'pdpBookingRequested',
        bg: 'bg-emerald-500',
        shadow: 'shadow-[0_6px_28px_rgba(16,185,129,0.45)]',
        text: 'text-white',
    },
    {
        label: 'Request Callback',
        icon: PhoneCall,
        event: 'pdpCallbackRequested',
        bg: 'bg-violet-600',
        shadow: 'shadow-[0_6px_28px_rgba(124,58,237,0.45)]',
        text: 'text-white',
    },
];

export function ShopperBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { pricingMode, setPricingMode } = useDiscovery();

    // ── Page detection ────────────────────────────────────────────────────────
    const isHomePage = useMemo(() => pathname === '/' || pathname === '/store', [pathname]);

    const isPdpPage = useMemo(() => {
        if (!pathname) return false;
        const parts = pathname.split('/').filter(Boolean);
        return parts.length === 4 && parts[0] === 'store';
    }, [pathname]);

    const isCatalogPage = useMemo(() => !!pathname?.startsWith('/store/catalog'), [pathname]);

    const isComparePage = useMemo(() => !!pathname?.startsWith('/store/compare'), [pathname]);

    // ── Compare view-mode toggle (grid ↔ list) ────────────────────────────────
    const [compareViewMode, setCompareViewMode] = useState<'grid' | 'list'>('grid');
    useEffect(() => {
        if (!isComparePage) setCompareViewMode('grid');
    }, [isComparePage]);

    // ── Gate-aware commercial-ready signal ───────────────────────────────────
    // Subscribes to pdpCommercialReady dispatched by ProductClient on every
    // pdpGateState change. Uses stable handler stored in ref for strict cleanup.
    const [isCommercialReady, setIsCommercialReady] = useState(false);
    useEffect(() => {
        const handler = (e: Event) => {
            setIsCommercialReady((e as CustomEvent<{ ready: boolean }>).detail?.ready ?? false);
        };
        window.addEventListener('pdpCommercialReady', handler);
        return () => window.removeEventListener('pdpCommercialReady', handler);
    }, []); // stable: no deps, handler is function-scoped

    // ── PDP stage (session-only, resets on leaving PDP) ───────────────────────
    const [pdpStage, setPdpStage] = useState<PdpStage>(0);
    const prevPathRef = useRef(pathname);

    useEffect(() => {
        // Reset stage when navigating away from PDP
        if (!isPdpPage) {
            setPdpStage(0);
        }
        prevPathRef.current = pathname;
    }, [pathname, isPdpPage]);

    // Reset pdpStage when user navigates back via browser (bfcache restore or visibilitychange)
    useEffect(() => {
        const handlePageShow = (e: PageTransitionEvent) => {
            // e.persisted = true means page was restored from bfcache (back/forward nav)
            if (e.persisted && isPdpPage) {
                setPdpStage(0);
            }
        };
        // Also handle in-app back navigation where pathname stays same but page re-focuses
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && isPdpPage) {
                // Only reset if we came from a non-PDP context (i.e., the stage was accumulated elsewhere)
                // We reset to 0 conservatively — the MobilePDP will re-fire pdpStageAdvanced if needed
                setPdpStage(prev => {
                    // If stage was advanced (>0) and we're returning to PDP fresh, reset
                    if (prev > 0 && prevPathRef.current !== pathname) {
                        return 0;
                    }
                    return prev;
                });
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener('pageshow', handlePageShow);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [isPdpPage, pathname]);

    // Listen for success events fired by MobilePDP after each action completes
    useEffect(() => {
        const onStageAdvanced = (e: Event) => {
            const stage = (e as CustomEvent<{ stage: PdpStage }>).detail?.stage;
            if (stage !== undefined) {
                setPdpStage(stage);
            }
        };
        window.addEventListener('pdpStageAdvanced', onStageAdvanced);
        return () => window.removeEventListener('pdpStageAdvanced', onStageAdvanced);
    }, []);

    // ── Downpayment / tenure (needed for dispatchPricing) ────────────────────
    const [downpayment, setDownpayment] = useState(10000);
    const [tenure, setTenure] = useState(36);

    useEffect(() => {
        const saved = readPricing();
        setDownpayment(saved.downpayment || 10000);
        setTenure(saved.tenure || 36);
    }, []);

    // ── Pricing dispatch (keeps DiscoveryContext + all listeners in sync) ─────
    const dispatchPricing = (mode: 'cash' | 'finance') => {
        const payload = { mode, downpayment, tenure };
        writePricing(payload);
        setPricingMode(mode);
        window.dispatchEvent(new CustomEvent('discoveryPricingChanged', { detail: payload }));
    };

    // ── CTA config ────────────────────────────────────────────────────────────
    type CtaConfig = {
        label: string;
        subLabel?: string;
        icon: React.ElementType;
        bg: string;
        shadow: string;
        textColor: string;
        shimmer: boolean;
        onClick: () => void;
    };

    const ctaConfig = useMemo((): CtaConfig | null => {
        if (isHomePage) {
            return {
                label: 'Explore Bikes',
                icon: Bike,
                bg: 'bg-[#FFD700]',
                shadow: 'shadow-[0_6px_28px_rgba(255,215,0,0.45)]',
                textColor: 'text-[#0b0d10]',
                shimmer: true,
                onClick: () => router.push('/store/catalog'),
            };
        }

        if (isPdpPage) {
            // Phase 4: gate override — show login CTA when commercial not yet unlocked
            if (pdpStage === 0 && !isCommercialReady) {
                return {
                    label: 'Login to View Offers',
                    icon: LogIn,
                    bg: 'bg-[#F4B000]',
                    shadow: 'shadow-[0_6px_28px_rgba(244,176,0,0.45)]',
                    textColor: 'text-[#0b0d10]',
                    shimmer: true,
                    onClick: () =>
                        window.dispatchEvent(
                            new CustomEvent('pdpConsentLoginRequested', {
                                detail: { source: 'bottom_nav', stage: 0 },
                            })
                        ),
                };
            }
            const stage = PDP_STAGES[pdpStage];
            return {
                label: stage.label,
                icon: stage.icon,
                bg: stage.bg,
                shadow: stage.shadow,
                textColor: stage.text,
                shimmer: pdpStage === 0,
                onClick: () => window.dispatchEvent(new CustomEvent(stage.event)),
            };
        }

        if (isComparePage) {
            const isGrid = compareViewMode === 'grid';
            return {
                label: isGrid ? 'Compare Variants' : 'Card View',
                subLabel: isGrid ? 'side-by-side list view' : 'back to cards',
                icon: isGrid ? SlidersHorizontal : LayoutGrid,
                bg: isGrid ? 'bg-indigo-600' : 'bg-slate-700',
                shadow: isGrid ? 'shadow-[0_4px_20px_rgba(79,70,229,0.45)]' : 'shadow-[0_4px_20px_rgba(30,41,59,0.4)]',
                textColor: 'text-white',
                shimmer: false,
                onClick: () => {
                    const next = isGrid ? 'list' : 'grid';
                    setCompareViewMode(next);
                    window.dispatchEvent(
                        new CustomEvent(next === 'list' ? 'compareForceListView' : 'compareForceGridView')
                    );
                },
            };
        }

        if (isCatalogPage) {
            const isCash = pricingMode === 'cash';
            return {
                label: isCash ? 'Switch to Loan' : 'Switch to Cash',
                subLabel: isCash ? 'view EMI & downpayment options' : 'view full on-road price',
                icon: isCash ? CreditCard : Banknote,
                bg: isCash ? 'bg-[#FFD700]' : 'bg-emerald-500',
                shadow: isCash
                    ? 'shadow-[0_4px_20px_rgba(255,215,0,0.5)]'
                    : 'shadow-[0_4px_20px_rgba(16,185,129,0.45)]',
                textColor: isCash ? 'text-[#0b0d10]' : 'text-white',
                shimmer: false,
                onClick: () => dispatchPricing(isCash ? 'finance' : 'cash'),
            };
        }

        // Other pages — fallback explore
        return {
            label: 'Explore Bikes',
            icon: Bike,
            bg: 'bg-[#FFD700]',
            shadow: 'shadow-[0_6px_28px_rgba(255,215,0,0.45)]',
            textColor: 'text-[#0b0d10]',
            shimmer: false,
            onClick: () => router.push('/store/catalog'),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isHomePage,
        isPdpPage,
        isCatalogPage,
        isComparePage,
        compareViewMode,
        pdpStage,
        pricingMode,
        isCommercialReady,
    ]);

    // ── EMI Modal state ─────────────────────────────────────────────────────────
    const [showEmiModal, setShowEmiModal] = useState(false);
    const [modalDownpayment, setModalDownpayment] = useState(downpayment);
    const [modalTenure, setModalTenure] = useState(tenure);
    const TENURE_OPTIONS = [6, 12, 18, 24, 36, 48, 60];

    const applyEmiSettings = () => {
        setDownpayment(modalDownpayment);
        setTenure(modalTenure);
        writePricing({ mode: 'finance', downpayment: modalDownpayment, tenure: modalTenure });
        setPricingMode('finance');
        window.dispatchEvent(
            new CustomEvent('discoveryPricingChanged', {
                detail: { mode: 'finance', downpayment: modalDownpayment, tenure: modalTenure },
            })
        );
        setShowEmiModal(false);
    };

    if (!ctaConfig) return null;

    const Icon = ctaConfig.icon;

    const handleCtaClick = () => {
        if (isCatalogPage && pricingMode === 'cash') {
            setModalDownpayment(downpayment);
            setModalTenure(tenure);
            setShowEmiModal(true);
        } else {
            ctaConfig.onClick();
        }
    };

    return (
        <>
            {/* ── EMI Configurator Bottom Sheet ── */}
            <AnimatePresence>
                {showEmiModal && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="emi-backdrop"
                            className="fixed inset-0 z-[60] bg-black/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEmiModal(false)}
                        />
                        {/* Sheet */}
                        <motion.div
                            key="emi-sheet"
                            className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl px-5 pt-5 pb-[env(safe-area-inset-bottom,16px)]"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {/* Handle */}
                            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-5" />

                            <h3 className="text-[15px] font-black uppercase tracking-[0.1em] text-slate-900 mb-1">
                                Finance Options
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium mb-5">
                                Set your downpayment & tenure before switching to loan view
                            </p>

                            {/* Downpayment */}
                            <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                                Downpayment
                            </label>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[13px] font-bold text-slate-400">₹</span>
                                <input
                                    type="number"
                                    value={modalDownpayment}
                                    onChange={e => setModalDownpayment(Number(e.target.value))}
                                    className="flex-1 text-[18px] font-black text-slate-900 border-b-2 border-slate-200 focus:border-[#FFD700] outline-none pb-1 bg-transparent"
                                    step={1000}
                                    min={0}
                                />
                            </div>
                            <div className="flex gap-2 mb-6 mt-3">
                                {[0, 5000, 10000, 25000, 50000].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setModalDownpayment(amt)}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                                            modalDownpayment === amt
                                                ? 'bg-[#FFD700] border-[#FFD700] text-black'
                                                : 'border-slate-200 text-slate-500'
                                        }`}
                                    >
                                        {amt === 0 ? 'NIL' : `₹${amt >= 1000 ? `${amt / 1000}K` : amt}`}
                                    </button>
                                ))}
                            </div>

                            {/* Tenure */}
                            <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                                Loan Tenure (months)
                            </label>
                            <div className="grid grid-cols-7 gap-1.5 mb-7">
                                {TENURE_OPTIONS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setModalTenure(t)}
                                        className={`py-2.5 rounded-xl text-[11px] font-black transition-all ${
                                            modalTenure === t
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* Apply */}
                            <button
                                onClick={applyEmiSettings}
                                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-[13px] uppercase tracking-[0.1em] shadow-[0_4px_20px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-transform"
                            >
                                Apply & Switch to Loan View
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <nav
                className="fixed bottom-0 left-0 right-0 z-[55]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="h-[60px] flex items-center">
                    <AnimatePresence mode="wait">
                        <motion.button
                            key={`${isHomePage}-${isPdpPage}-${isCatalogPage}-${pdpStage}-${pricingMode}`}
                            onClick={handleCtaClick}
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                            whileTap={{ scale: 0.97 }}
                            className={`
                                w-full h-[60px] rounded-none flex items-center justify-center gap-3
                                relative overflow-hidden
                                ${ctaConfig.bg} ${ctaConfig.shadow} ${ctaConfig.textColor}
                                transition-shadow duration-300
                            `}
                        >
                            {/* Shimmer sweep */}
                            {ctaConfig.shimmer && (
                                <motion.div
                                    className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-transparent via-white/70 to-transparent blur-[1px]"
                                    animate={{ x: [0, 500] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 5,
                                        ease: 'linear',
                                        delay: 2,
                                        repeatDelay: 2,
                                    }}
                                />
                            )}

                            <Icon size={18} className="relative z-10 shrink-0" />
                            <div className="relative z-10 flex flex-col items-start leading-none">
                                <span className="text-[13px] font-black uppercase tracking-[0.12em]">
                                    {ctaConfig.label}
                                </span>
                                {ctaConfig.subLabel && (
                                    <span className="text-[9px] font-semibold tracking-wide opacity-60 mt-0.5 normal-case">
                                        {ctaConfig.subLabel}
                                    </span>
                                )}
                            </div>
                            <ArrowRight size={16} className="relative z-10 shrink-0 opacity-70" />
                        </motion.button>
                    </AnimatePresence>
                </div>
            </nav>
        </>
    );
}
