'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    Heart,
    MapPin,
    Bluetooth,
    ArrowRight,
    Layers,
    Sparkles,
    Zap,
    CircleHelp,
    Palette,
    GitCompareArrows,
    Pencil,
    Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/utils/urlHelper';
import { slugify } from '@/utils/slugs';
import { getStableReviewCount } from '@/utils/vehicleUtils';
import type { ProductVariant } from '@/types/productMaster';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { useI18n } from '@/components/providers/I18nProvider';
import { toDevanagariScript } from '@/lib/i18n/transliterate';
import { coinsNeededForPrice, discountForCoins } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { getEmiFactor } from '@/lib/constants/pricingConstants';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import { useDiscovery } from '@/contexts/DiscoveryContext';

export const ProductCard = ({
    v,
    viewMode = 'grid',
    downpayment,
    tenure,
    serviceability,
    onLocationClick: _onLocationClick,
    onColorChange,
    onExplodeColors,
    isTv = false,
    bestOffer: rawBestOffer,
    leadId,
    basePath = '/store',
    isParentCompact = false,
    serverPricing, // SSPP v1: Server-calculated pricing
    isPdp = false, // Hide "Know More" on PDP
    walletCoins,
    showOClubPrompt,
    showBcoinBadge = true,
    variantCount,
    onExplore,
    onCompare,
    isInCompare = false,
    onEditDownpayment,
    pricingMode: globalPricingMode = 'finance',
    onTogglePricingMode,
    offerMode: propOfferMode,
    onOfferModeChange: propOnOfferModeChange,
    ...props
}: {
    v: ProductVariant;
    viewMode?: 'grid' | 'list';
    downpayment: number;
    tenure: number;
    serviceability?: {
        status: 'loading' | 'serviceable' | 'unserviceable' | 'unset';
        location?: string;
        district?: string;
        distance?: number;
    };
    onLocationClick?: () => void;
    isTv?: boolean;
    bestOffer?: {
        price?: number;
        dealer?: string;
        dealerId?: string;
        isServiceable?: boolean;
        dealerLocation?: string;
        studio_id?: string;
        bundleValue?: number;
        bundlePrice?: number;
        tat_effective_hours?: number | null;
        delivery_tat_days?: number | null;
    } | null;
    onColorChange?: (colorId: string) => void;
    onExplodeColors?: () => void;
    leadId?: string;
    basePath?: string;
    isParentCompact?: boolean;
    // SSPP v1: Server-calculated pricing for Single Source of Truth
    serverPricing?: {
        final_on_road: number;
        ex_showroom: number;
        rto?: { total: number };
        insurance?: { total: number };
        location?: { district?: string | null; state_code?: string | null };
    } | null;
    isPdp?: boolean;
    walletCoins?: number | null;
    showOClubPrompt?: boolean;
    showBcoinBadge?: boolean;
    variantCount?: number;
    onExplore?: () => void | Promise<void>;
    onCompare?: () => void;
    isInCompare?: boolean;
    onEditDownpayment?: () => void;
    pricingMode?: 'cash' | 'finance';
    onTogglePricingMode?: () => void;
    offerMode?: 'BEST_OFFER' | 'FAST_DELIVERY';
    onOfferModeChange?: (mode: 'BEST_OFFER' | 'FAST_DELIVERY') => void;
}) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const { trackEvent } = useAnalytics();
    const { language } = useI18n();
    const {
        pricingMode: globalPricingModeCtx,
        setPricingMode: setGlobalPricingMode,
        offerMode: globalOfferMode,
    } = useDiscovery();
    const effectiveOfferMode = propOfferMode || globalOfferMode;
    // If the parent explicitly wires onTogglePricingMode it is managing mode — use the prop.
    // Otherwise fall back to the global DiscoveryContext so all cards stay in sync automatically.
    const resolvedGlobalMode: 'cash' | 'finance' = onTogglePricingMode ? globalPricingMode : globalPricingModeCtx;
    const isSaved = isFavorite(v.id);
    const [selectedColorImage, setSelectedColorImage] = useState<string | null>(v.imageUrl || null);
    const [selectedColorZoom, setSelectedColorZoom] = useState<number | null>(v.zoomFactor || null);
    const [selectedColorFlip, setSelectedColorFlip] = useState<boolean>(v.isFlipped || false);
    const [selectedColorOffsetX, setSelectedColorOffsetX] = useState<number>(v.offsetX || 0);
    const [selectedColorOffsetY, setSelectedColorOffsetY] = useState<number>(v.offsetY || 0);
    const [selectedColorFinish, setSelectedColorFinish] = useState<string | null>(null);
    const [cachedScheme, setCachedScheme] = useState<{
        interestRate: number;
        interestType?: 'FLAT' | 'REDUCING';
        schemeName?: string;
        bankName?: string;
    } | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('bmb_finance_scheme_cache');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed?.expiresAt && Date.now() > parsed.expiresAt) return;
            if (parsed?.scheme?.interestRate) {
                setCachedScheme({
                    interestRate: parsed.scheme.interestRate,
                    interestType: parsed.scheme.interestType,
                    schemeName: parsed.scheme.name || parsed.scheme.id || undefined,
                    bankName: parsed.bankName || undefined,
                });
            }
        } catch {}
    }, []);
    const [cardPricingMode, setCardPricingMode] = useState<'cash' | 'finance'>(globalPricingMode);
    const [isFlipping, setIsFlipping] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();

    // 3D tilt effect
    const cardRef = useRef<HTMLDivElement>(null);
    const rawTiltX = useMotionValue(0);
    const rawTiltY = useMotionValue(0);
    const tiltX = useSpring(rawTiltX, { stiffness: 300, damping: 30, mass: 0.5 });
    const tiltY = useSpring(rawTiltY, { stiffness: 300, damping: 30, mass: 0.5 });
    const scaleSpring = useSpring(1, { stiffness: 300, damping: 30 });
    // Glare: compute position as percentage of tilt
    const glareX = useSpring(50, { stiffness: 200, damping: 30 });
    const glareY = useSpring(50, { stiffness: 200, damping: 30 });
    const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });
    const glareBackground = useTransform(
        [glareX, glareY],
        ([x, y]: number[]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.55) 0%, transparent 65%)`
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isTv) return;
            const el = cardRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2); // -1 … 1
            const dy = (e.clientY - cy) / (rect.height / 2); // -1 … 1
            rawTiltX.set(-dy * 8);
            rawTiltY.set(dx * 8);
            // Glare moves to follow the cursor (0-100%)
            glareX.set(50 + dx * 50);
            glareY.set(50 + dy * 50);
            glareOpacity.set(0.14);
        },
        [isTv, rawTiltX, rawTiltY, glareX, glareY, glareOpacity]
    );

    const handleMouseLeave = useCallback(() => {
        if (isTv) return;
        rawTiltX.set(0);
        rawTiltY.set(0);
        scaleSpring.set(1);
        glareX.set(50);
        glareY.set(50);
        glareOpacity.set(0);
    }, [isTv, rawTiltX, rawTiltY, scaleSpring, glareX, glareY, glareOpacity]);

    const handleMouseEnter = useCallback(() => {
        if (isTv) return;
        scaleSpring.set(1.015);
    }, [isTv, scaleSpring]);

    useEffect(() => {
        setCardPricingMode(resolvedGlobalMode);
        // Trigger flip glow animation
        setIsFlipping(true);
        const t = setTimeout(() => setIsFlipping(false), 900);
        return () => clearTimeout(t);
    }, [resolvedGlobalMode]);

    useEffect(() => {
        setIsNavigating(false);
    }, [pathname]);

    const handleFlip = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextMode = cardPricingMode === 'cash' ? 'finance' : 'cash';
        setCardPricingMode(nextMode);
        // Broadcast to all cards globally
        setGlobalPricingMode(nextMode);
        if (onTogglePricingMode) onTogglePricingMode();
    };

    const isSwatchesExpanded = false;
    const [selectedHex, setSelectedHex] = useState<string | null>(() => {
        const match = v.availableColors?.find(c => c.imageUrl === v.imageUrl) || v.availableColors?.[0];
        return match?.hexCode || null;
    });

    useEffect(() => {
        // Prefer the color matching the variant's primary imageUrl (set via is_primary SKU)
        const primaryColor =
            v.availableColors?.find(c => c.imageUrl && c.imageUrl === v.imageUrl) ||
            v.availableColors?.find(c => c.imageUrl) ||
            v.availableColors?.[0];
        setSelectedColorImage(primaryColor?.imageUrl || v.imageUrl || null);
        setSelectedColorZoom(primaryColor?.zoomFactor ?? v.zoomFactor ?? null);
        setSelectedColorFlip(primaryColor?.isFlipped ?? v.isFlipped ?? false);
        setSelectedColorOffsetX(primaryColor?.offsetX ?? v.offsetX ?? 0);
        setSelectedColorOffsetY(primaryColor?.offsetY ?? v.offsetY ?? 0);
        setSelectedColorFinish(primaryColor?.finish || null);
        setSelectedHex(primaryColor?.hexCode || null);
    }, [v.id, v.imageUrl, v.availableColors, v.zoomFactor, v.isFlipped, v.offsetX, v.offsetY]);

    const effectiveServerPricing = (v as any)?.serverPricing;
    const bestOffer = isPdp ? rawBestOffer : null;

    // Uniform Offer SOT: non-PDP uses state on-road pricing only.
    const displayPrice = v.price?.onRoad || v.price?.exShowroom || 0;

    const liveOnRoad = typeof v.price?.onRoad === 'number' ? v.price.onRoad : undefined;
    const basePrice =
        isPdp && liveOnRoad !== undefined ? liveOnRoad : displayPrice || effectiveServerPricing?.final_on_road || 0;

    // Location & Dealer Labels - derived directly from ProductVariant
    const priceSourceLocation =
        bestOffer?.dealerLocation ||
        v.dealerLocation ||
        effectiveServerPricing?.location?.district ||
        v.price?.pricingSource ||
        undefined;

    const cleanedPriceSourceLocation = priceSourceLocation
        ? priceSourceLocation.replace(/^(Best:|Base:)\s*/i, '').trim()
        : undefined;

    const priceSourceLabel = cleanedPriceSourceLocation
        ? effectiveServerPricing?.location?.state_code
            ? `${cleanedPriceSourceLocation}, ${effectiveServerPricing.location.state_code}`
            : cleanedPriceSourceLocation
        : undefined;

    const normalizeDistrictForUrl = (value?: string | null) => {
        if (!value) return undefined;
        const cleaned = String(value)
            .replace(/^(Best:|Base:)\s*/i, '')
            .split(',')[0]
            .trim();
        if (!cleaned || cleaned.toUpperCase() === 'ALL') return undefined;
        return cleaned;
    };

    const districtLabel = (() => {
        if (!cleanedPriceSourceLocation) return null;
        const STATE_NAMES = [
            'MAHARASHTRA',
            'KARNATAKA',
            'GUJARAT',
            'RAJASTHAN',
            'DELHI',
            'KERALA',
            'GOA',
            'PUNJAB',
            'HARYANA',
            'BIHAR',
            'INDIA',
            'ALL',
        ];
        if (STATE_NAMES.includes(cleanedPriceSourceLocation.toUpperCase())) return null;
        return cleanedPriceSourceLocation.split(',')[0]?.trim();
    })();

    const winnerDealerName =
        (bestOffer as any)?.dealer || (bestOffer as any)?.dealer_name || (bestOffer as any)?.dealerName || null;
    const dealerLabel = (winnerDealerName || v.studioName || '').trim();
    const dealerLabelDisplay = dealerLabel || 'UNASSIGNED';
    const districtLabelDisplay = districtLabel || null;
    const studioDisplayLabel = bestOffer?.studio_id || v.studioCode || null;
    const studioIdLabel = studioDisplayLabel || bestOffer?.studio_id || null;

    // Combine District and Studio Code
    const combinedLocationLabel = districtLabelDisplay
        ? studioDisplayLabel
            ? `${districtLabelDisplay}, ${studioDisplayLabel}`
            : districtLabelDisplay
        : studioDisplayLabel || null;

    const navigableDistrict = normalizeDistrictForUrl(
        serviceability?.district || serviceability?.location || v.dealerLocation || cleanedPriceSourceLocation
    );

    const priceSourceDisplay = combinedLocationLabel || priceSourceLabel || '—';
    const isTrulyOnRoad = effectiveServerPricing
        ? effectiveServerPricing.final_on_road > effectiveServerPricing.ex_showroom
        : (v.price?.onRoad || 0) > (v.price?.exShowroom || 0);

    const pricingLabel = isTrulyOnRoad ? 'ON-ROAD' : 'EX-SHOWROOM';

    const onRoad = v.price?.onRoad || 0;
    const rawWinnerDelta =
        (bestOffer as any)?.price ??
        (bestOffer as any)?.offer_amount ??
        (bestOffer as any)?.best_offer ??
        (bestOffer as any)?.offerAmount ??
        null;
    const bestOfferDelta = rawWinnerDelta !== null && rawWinnerDelta !== undefined ? Number(rawWinnerDelta) : null;
    const offerPriceFromWinner = bestOfferDelta !== null && Number.isFinite(onRoad) ? onRoad + bestOfferDelta : null;
    const offerPrice = offerPriceFromWinner ?? v.price?.offerPrice ?? basePrice;
    const discountBasedDelta = typeof v.price?.discount === 'number' ? -Number(v.price.discount || 0) : 0;
    const mappedOfferDelta =
        typeof v.price?.offerPrice === 'number' && typeof v.price?.onRoad === 'number'
            ? Number(v.price.offerPrice) - Number(v.price.onRoad)
            : discountBasedDelta;
    const formatRoundedPrice = (value: number | null | undefined) =>
        Math.ceil(Number(value) || 0).toLocaleString('en-IN');

    // SSPP v1: B-Coin Integration
    const params = useSearchParams();

    // bcoinTotal is the alternative currency view (13 Coins = 1000 INR) — SOT: b_coin_valuation_sot.md
    const bcoinTotal = coinsNeededForPrice(offerPrice);

    // O'Circle Privileged discount: based on user's ACTUAL available wallet balance
    // SOT Rule 2: discount_inr = floor(available_coins / 13) * 1000
    // e.g. 26 coins → ₹2,000 | 13 coins → ₹1,000 | 0 coins → ₹0
    const bcoinAdjustment =
        isPdp && walletCoins && walletCoins > 0
            ? discountForCoins(Math.floor(walletCoins / 13) * 13) // round down to nearest 13-coin block
            : 0;
    const isShowingEffectivePrice = bcoinAdjustment > 0;
    const baseOnRoadPrice = onRoad > 0 ? onRoad : offerPrice;
    const effectiveOfferPrice = Math.max(0, offerPrice - bcoinAdjustment);
    const showOnRoadStrike = baseOnRoadPrice > effectiveOfferPrice;

    // If dealer offer exists, price is CONFIRMED not estimated
    const isConfirmedPrice = !!bestOffer;
    // Savings calculation

    const offerDelta = bestOfferDelta !== null && Number.isFinite(bestOfferDelta) ? bestOfferDelta : mappedOfferDelta;
    const offerDeltaForParity = offerDelta;
    // Calculate savings based on source (Live Best Offer vs Server/Mapped Data)
    const bundleSavings = bestOffer
        ? Math.max(0, (bestOffer.bundleValue || 0) - (bestOffer.bundlePrice || 0))
        : v.price?.bundleSavings || 0;
    const savings = (offerDelta < 0 ? Math.abs(offerDelta) : 0) + bundleSavings;
    const surge = offerDelta > 0 ? offerDelta : 0;
    const netImpact = savings - surge;

    // EMI Flip Logic: if loan < ₹25k, force cash side of the flipcard
    const MIN_LOAN_AMOUNT = 25000;
    const activeTenure = tenure || 36;
    const loanAmount = Math.max(0, basePrice - downpayment);
    const emiIsApprox = !cachedScheme?.interestRate;
    const emiValue = (() => {
        if (!cachedScheme?.interestRate) {
            const factor = getEmiFactor(activeTenure);
            return Math.max(0, Math.round(loanAmount * factor));
        }
        const annualRate = cachedScheme.interestRate / 100;
        if (cachedScheme.interestType === 'FLAT') {
            const totalInterest = loanAmount * annualRate * (activeTenure / 12);
            return Math.max(0, Math.round((loanAmount + totalInterest) / activeTenure));
        }
        const monthlyRate = annualRate / 12;
        if (monthlyRate === 0) return Math.max(0, Math.round(loanAmount / activeTenure));
        return Math.max(
            0,
            Math.round(
                (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, activeTenure)) /
                    (Math.pow(1 + monthlyRate, activeTenure) - 1)
            )
        );
    })();
    // Auto-flip to cash when loan too small to be meaningful
    const effectivePricingMode: 'cash' | 'finance' = loanAmount < MIN_LOAN_AMOUNT ? 'cash' : cardPricingMode;

    // Handle optional serviceability
    const safeServiceability = serviceability || { status: 'unset' };
    const isUnserviceable = safeServiceability.status === 'unserviceable';
    const winnerTatHoursRaw =
        (bestOffer as any)?.tat_effective_hours ??
        (bestOffer as any)?.tatEffectiveHours ??
        (bestOffer as any)?.delivery_tat_hours ??
        null;
    const winnerTatDaysRaw =
        (bestOffer as any)?.delivery_tat_days ??
        (bestOffer as any)?.deliveryTatDays ??
        (bestOffer as any)?.tat_days ??
        null;
    const winnerTatHours =
        winnerTatHoursRaw !== null && winnerTatHoursRaw !== undefined ? Number(winnerTatHoursRaw) : null;
    const winnerTatDays = winnerTatDaysRaw !== null && winnerTatDaysRaw !== undefined ? Number(winnerTatDaysRaw) : null;
    const deliveryTatLabel = (() => {
        if (!isPdp) return null;
        if (winnerTatHours !== null && Number.isFinite(winnerTatHours) && winnerTatHours >= 0) {
            if (winnerTatHours === 0) return 'Delivery in 4 hrs';
            if (winnerTatHours <= 72) return `Delivery in ${winnerTatHours} hrs`;
            const d = Math.floor(winnerTatHours / 24);
            const h = winnerTatHours % 24;
            return h > 0 ? `Delivery in ${d} days ${h} hrs` : `Delivery in ${d} days`;
        }
        if (winnerTatDays !== null && Number.isFinite(winnerTatDays) && winnerTatDays >= 0) {
            if (winnerTatDays === 0) return 'Delivery in 4 hrs';
            if (winnerTatDays <= 3) return `Delivery in ${winnerTatDays * 24} hrs`;
            return `Delivery in ${winnerTatDays} days`;
        }
        return 'Delivery ETA updating';
    })();
    const priceHeaderLabel = isPdp
        ? pricingLabel === 'ON-ROAD'
            ? 'On-Road price'
            : 'Ex-Showroom price'
        : 'State On-Road price';

    const shouldDevanagari = language === 'hi' || language === 'mr';
    const scriptText = (value?: string) => {
        if (!value) return '';
        return shouldDevanagari ? toDevanagariScript(value) : value;
    };
    const displayMake = scriptText(v.make);
    const displayModel = scriptText(v.model);
    const displayVariant = scriptText(v.variant);
    const displayColor = scriptText(v.color || 'Standard Color');

    const handleGetQuoteClick = (e: React.MouseEvent) => {
        if (isUnserviceable) {
            e.preventDefault();
            toast.error(`Your area ${safeServiceability.location || ''} is not serviceable`, {
                description: 'We will update you once we are live in your area.',
                duration: 5000,
            });
        }
    };

    const router = useRouter();
    const variantUrl = buildProductUrl({
        make: v.make,
        model: v.model,
        variant: v.variant,
        color: v.availableColors?.[0]?.name ? slugify(v.availableColors?.[0]?.name) : undefined,
        district: navigableDistrict,
        leadId: leadId,
        basePath,
    }).url;
    const handleCardClick = () => {
        if (isPending || isNavigating) return;
        setIsNavigating(true);
        trackEvent('INTENT_SIGNAL', 'catalog_vehicle_click', {
            lead_id: leadId || undefined,
            sku_id: v.availableColors?.[0]?.id || undefined,
            make_slug: slugify(v.make || ''),
            model_slug: slugify(v.model || ''),
            variant_slug: slugify(v.variant || ''),
            source: 'STORE_CATALOG',
        });
        startTransition(() => {
            router.push(variantUrl);
        });
    };
    const handleExploreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (isNavigating || isPending || !onExplore) return;

        setIsNavigating(true);

        // If navigation does not change route (or errors), avoid getting stuck in "Opening..."
        window.setTimeout(() => setIsNavigating(false), 15000);
        startTransition(() => {
            try {
                const maybePromise = onExplore();
                if (maybePromise && typeof (maybePromise as Promise<void>).catch === 'function') {
                    (maybePromise as Promise<void>).catch(() => setIsNavigating(false));
                }
            } catch {
                setIsNavigating(false);
            }
        });
    };

    // Force Grid View for consistency if requested or stick to logic
    // The original code had a separate return for 'list' view.
    // Since we are standardizing on the desktop card (which defaults to grid mostly),
    // and maintaining the mobile requirement, we will implement the grid view primarily.
    // If list view is strictly needed, we can port it too.
    // For now, adhering to "Desktop Card Style" usually implies the standard card (Grid).

    if (viewMode === 'list') {
        return (
            <div
                key={v.id}
                data-testid="catalog-product-card"
                data-product-id={v.id}
                data-dealer-id={v.dealerId || bestOffer?.dealerId || ''}
                data-offer-delta={offerDeltaForParity}
                data-district={districtLabelDisplay || ''}
                className="group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex shadow-sm hover:shadow-2xl transition-all duration-500 min-h-[22rem]"
            >
                {/* Image Section - Wider */}
                <div
                    className="w-[38%] bg-slate-50 flex items-center justify-center relative p-8 shrink-0 border-r border-slate-100 overflow-hidden group/card"
                    style={{ backgroundColor: selectedHex ? `${selectedHex}4D` : undefined }}
                >
                    {/* Vignette for depth */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-100/50 z-0" />

                    <img
                        src={
                            v.imageUrl ||
                            (v.bodyType === 'SCOOTER'
                                ? '/images/categories/scooter_nobg.png'
                                : '/images/categories/motorcycle_nobg.png')
                        }
                        alt={v.model}
                        className="w-[85%] h-[85%] object-contain z-10 transition-transform duration-700 group-hover/card:scale-110"
                    />

                    {v.specifications?.features?.bluetooth === 'Yes' && (
                        <div
                            className="absolute top-4 right-4 z-20 w-8 h-8 bg-blue-500/10 backdrop-blur-md border border-blue-200/50 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            title="Bluetooth Enabled"
                        >
                            <Bluetooth size={16} className="text-blue-500 animate-pulse" />
                        </div>
                    )}

                    {/* Background Brand Text */}
                    <span className="absolute font-black text-[120px] uppercase tracking-[0.2em] opacity-[0.1] italic text-slate-900 select-none whitespace-nowrap z-0 left-6 top-1/2 -translate-y-1/2 pointer-events-none group-hover/card:translate-x-4 transition-transform duration-1000">
                        {displayMake}
                    </span>
                </div>

                <div className="flex-1 p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-4">
                                <h3
                                    className={`${isTv ? 'text-3xl' : 'text-3xl'} font-black uppercase tracking-tighter italic text-slate-900 leading-none`}
                                >
                                    {displayModel}
                                </h3>
                                {/* Delivery TAT Line - PDP only */}
                                {deliveryTatLabel && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={10} className="text-slate-400" />
                                        <span
                                            className={`text-[9px] uppercase tracking-widest italic ${effectiveOfferMode === 'FAST_DELIVERY' ? 'font-black text-slate-600' : 'font-bold text-slate-400'}`}
                                        >
                                            {deliveryTatLabel}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative">
                                {displayVariant} • <span className="text-brand-primary">{displayColor}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {onExplore && (
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleExploreClick(e);
                                    }}
                                    className="w-12 h-12 border border-slate-200 rounded-full flex items-center justify-center transition-all shadow-sm text-slate-400 hover:text-brand-primary bg-white"
                                    title="Show all variants of this model"
                                >
                                    <Layers size={18} />
                                </button>
                            )}
                            <button
                                onClick={() =>
                                    toggleFavorite({
                                        id: v.id,
                                        model: v.model,
                                        variant: v.variant,
                                        slug: v.slug,
                                        imageUrl: v.imageUrl,
                                    })
                                }
                                className={`w-12 h-12 border border-slate-200 rounded-full flex items-center justify-center transition-all shadow-sm ${isSaved ? 'bg-rose-50 border-rose-200 text-rose-500' : 'text-slate-400 hover:text-rose-500 bg-white'}`}
                                title={isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
                            >
                                <Heart size={20} className={isSaved ? 'fill-current' : ''} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-12 py-6 border-y border-slate-100 relative z-10 mt-4 bg-slate-50/30 -mx-10 px-10">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Engine</p>
                            <p className="text-sm font-black text-slate-900">
                                {Math.round(v.displacement || 0)}
                                {v.powerUnit || 'CC'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                Seat Height
                            </p>
                            <p className="text-sm font-black text-slate-900 truncate">
                                {v.specifications?.dimensions?.seatHeight || '-'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Weight</p>
                            <p className="text-sm font-black text-slate-900 italic">
                                {v.specifications?.dimensions?.kerbWeight ||
                                    v.specifications?.dimensions?.curbWeight ||
                                    '-'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p
                                className={`text-[8px] font-black uppercase tracking-widest ${netImpact >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}
                            >
                                {netImpact >= 0 ? 'Total Savings' : 'Price Surge'}
                            </p>
                            <p
                                className={`text-sm font-black ${netImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                            >
                                {netImpact !== 0 ? `₹${formatRoundedPrice(Math.abs(netImpact))}` : 'No Change'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 relative z-10">
                        <div className="flex gap-16">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {priceHeaderLabel}
                                </p>
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                                            ₹{formatRoundedPrice(baseOnRoadPrice)}
                                        </span>
                                        {bestOffer ? (
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                                                    Lowest in {priceSourceDisplay}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    by {bestOffer.dealer}
                                                </span>
                                            </div>
                                        ) : v.studioName ? (
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                                                    Price for {priceSourceDisplay}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    by {v.studioName}
                                                </span>
                                            </div>
                                        ) : (
                                            v.price?.offerPrice &&
                                            v.price?.onRoad && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 line-through">
                                                        ₹{formatRoundedPrice(v.price.onRoad)}
                                                    </span>
                                                    {(priceSourceLabel || v.price.pricingSource) && (
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                            Price for {priceSourceLabel || v.price.pricingSource}
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1 group/emilist relative">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">EMI</p>
                                <div className="h-10 relative">
                                    <div className="flex flex-col">
                                        <p
                                            className={`text-3xl font-black text-brand-primary ${isTv ? '' : 'drop-shadow-[0_0_8px_rgba(244,176,0,0.2)]'} leading-none`}
                                        >
                                            {emiValue !== null ? `₹${formatRoundedPrice(emiValue)}` : '—'}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <p className="text-sm font-black text-slate-500 uppercase leading-none">
                                                {emiValue !== null ? `x${activeTenure}` : 'Finance unavailable'}
                                            </p>
                                            {showBcoinBadge && (
                                                <div className="flex items-center gap-1">
                                                    <Logo variant="icon" size={10} />
                                                    <span className="text-[10px] font-black text-brand-primary italic">
                                                        {bcoinTotal.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {emiValue !== null && (
                                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover/emilist:opacity-100 group-hover/emilist:visible transition-all duration-200 z-50 pointer-events-none">
                                        {(cachedScheme?.bankName || cachedScheme?.schemeName) && (
                                            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
                                                <span className="font-black text-brand-primary uppercase tracking-wider">
                                                    {cachedScheme.bankName || 'Financier'}
                                                </span>
                                                {cachedScheme.schemeName && (
                                                    <span className="text-slate-400">· {cachedScheme.schemeName}</span>
                                                )}
                                            </div>
                                        )}
                                        <p className="leading-relaxed">
                                            EMI on{' '}
                                            <span className="font-bold text-green-400">
                                                ₹{formatRoundedPrice(downpayment || 0)}
                                            </span>{' '}
                                            downpayment at{' '}
                                            <span className="font-bold text-green-400">{tenure} months</span>
                                            {emiIsApprox ? ' (approx)' : ''}.
                                        </p>
                                        <div className="absolute bottom-0 left-6 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                                    </div>
                                )}
                            </div>
                            {districtLabelDisplay && (
                                <div className="mt-2">
                                    <div className="relative group/location inline-flex">
                                        <span
                                            className="inline-flex items-center gap-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.35em] text-brand-primary max-w-full truncate"
                                            title={combinedLocationLabel || ''}
                                        >
                                            <MapPin size={14} />
                                            {combinedLocationLabel}
                                        </span>
                                        {(dealerLabel || districtLabel) && (
                                            <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-slate-200 bg-white text-[10px] text-slate-700 shadow-xl opacity-0 invisible group-hover/location:opacity-100 group-hover/location:visible transition-all duration-200 pointer-events-none">
                                                <div className="px-3 py-2 space-y-1">
                                                    <p className="font-bold uppercase tracking-widest text-slate-500">
                                                        Studio ID:{' '}
                                                        <span className="text-slate-900">
                                                            {studioIdLabel || 'UNASSIGNED'}
                                                        </span>
                                                    </p>
                                                    <p className="font-bold uppercase tracking-widest text-slate-500">
                                                        District:{' '}
                                                        <span className="text-slate-900">{districtLabelDisplay}</span>
                                                    </p>
                                                </div>
                                                <div className="absolute bottom-0 left-6 translate-y-1/2 rotate-45 w-2.5 h-2.5 bg-white border-b border-r border-slate-200" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {!isPdp && (
                            <div className="flex items-center gap-6">
                                {isUnserviceable ? (
                                    <button
                                        onClick={handleGetQuoteClick}
                                        className="px-10 py-4 bg-slate-200 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] cursor-not-allowed"
                                    >
                                        Get Quote
                                    </button>
                                ) : (
                                    <Link
                                        href={
                                            buildProductUrl({
                                                make: v.make,
                                                model: v.model,
                                                variant: v.variant,
                                                color: v.availableColors?.[0]?.name
                                                    ? slugify(v.availableColors?.[0]?.name)
                                                    : undefined,
                                                district: navigableDistrict,
                                                leadId: leadId,
                                                basePath,
                                            }).url
                                        }
                                        onClick={() =>
                                            trackEvent('INTENT_SIGNAL', 'catalog_vehicle_click', {
                                                lead_id: leadId || undefined,
                                                sku_id: v.availableColors?.[0]?.id || undefined,
                                                make_slug: slugify(v.make || ''),
                                                model_slug: slugify(v.model || ''),
                                                variant_slug: slugify(v.variant || ''),
                                                source: 'STORE_CATALOG',
                                            })
                                        }
                                        className="relative overflow-hidden px-10 py-4 bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(244,176,0,0.3)] hover:shadow-[0_0_30px_rgba(244,176,0,0.5)] hover:-translate-y-1 transition-all"
                                    >
                                        <motion.div
                                            aria-hidden
                                            className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent skew-x-12"
                                            animate={{ x: ['-120%', '420%'] }}
                                            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                                        />
                                        <span className="relative z-10">Check Offer</span>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        /* Perspective wrapper — gives depth to outer card tilt WITHOUT sharing 3D context with children */
        <div
            style={{
                WebkitPerspective: '1200px',
                perspective: '1200px',
                WebkitTransformStyle: 'flat',
                transformStyle: 'flat',
            }}
        >
            <motion.div
                ref={cardRef}
                key={v.id}
                data-testid="catalog-product-card"
                data-product-id={v.id}
                data-dealer-id={v.dealerId || bestOffer?.dealerId || ''}
                data-offer-delta={offerDeltaForParity}
                data-district={districtLabelDisplay || ''}
                onClick={handleCardClick}
                onMouseMove={isTv ? undefined : handleMouseMove}
                onMouseEnter={isTv ? undefined : handleMouseEnter}
                onMouseLeave={isTv ? undefined : handleMouseLeave}
                style={{
                    rotateX: isTv ? 0 : tiltX,
                    rotateY: isTv ? 0 : tiltY,
                    scale: isTv ? 1 : scaleSpring,
                    transformStyle: 'flat',
                    transformOrigin: 'center center',
                }}
                className={`group bg-white border border-black/[0.04] rounded-[2rem] overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-12px_rgba(244,176,0,0.15)] hover:border-brand-primary/30 transition-[border-color,box-shadow,opacity] duration-700 ${isTv ? 'min-h-[328px]' : 'min-h-[580px] md:min-h-[660px]'} ${isNavigating || isPending ? 'opacity-80' : ''}`}
            >
                {/* Glare overlay */}
                <motion.div
                    aria-hidden
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        pointerEvents: 'none',
                        zIndex: 50,
                        opacity: glareOpacity,
                        background: glareBackground,
                    }}
                />
                <div
                    className={`${isTv ? 'h-[170px]' : 'h-[340px] md:h-[344px] lg:h-[384px]'} bg-slate-50 flex items-center justify-center relative p-4 border-b border-black/[0.04] overflow-hidden group/card`}
                    style={{ backgroundColor: selectedHex ? `${selectedHex}4D` : undefined }}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 z-0" />

                    {/* SAVE pill */}
                    {offerDelta < 0 && (
                        <div className="absolute top-4 left-4 z-20">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-lg shadow-[0_3px_10px_rgba(16,185,129,0.25)] border border-emerald-300/35 transition-all">
                                <Sparkles size={9} className="fill-white text-white" />
                                <span className="text-[9px] font-black uppercase tracking-[0.12em]">
                                    Save ₹{formatRoundedPrice(Math.abs(offerDelta))}
                                </span>
                            </div>
                        </div>
                    )}
                    {/* SURGE pill */}
                    {offerDelta > 0 && (
                        <div className="absolute top-4 left-4 z-20">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500 text-white rounded-lg shadow-[0_3px_10px_rgba(244,63,94,0.25)] border border-rose-300/35 transition-all">
                                <Zap size={9} className="fill-white text-white" />
                                <span className="text-[9px] font-black uppercase tracking-[0.12em]">
                                    Surge ₹{formatRoundedPrice(offerDelta)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                        {onExplore && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    handleExploreClick(e);
                                }}
                                className="w-8 h-8 rounded-full bg-white/80 border border-slate-200 text-slate-400 hover:text-brand-primary flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all hover:scale-105"
                                title="Show all variants of this model"
                            >
                                <Layers size={14} />
                            </button>
                        )}
                        {onCompare && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    onCompare();
                                }}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all hover:scale-105 ${isInCompare ? 'bg-[#F4B000]/20 border-[#F4B000]/40 text-[#F4B000]' : 'bg-white/80 border-slate-200 text-slate-400 hover:text-[#F4B000]'}`}
                                title={isInCompare ? 'Remove from Compare' : 'Add to Compare'}
                            >
                                <GitCompareArrows size={14} />
                            </button>
                        )}
                        {onExplodeColors && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    onExplodeColors();
                                }}
                                className="w-8 h-8 rounded-full bg-white/80 border border-slate-200 text-slate-500 hover:text-brand-primary flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all hover:scale-105"
                                title="Explode colors"
                            >
                                <Palette size={14} />
                            </button>
                        )}
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                toggleFavorite({
                                    id: v.id,
                                    model: v.model,
                                    variant: v.variant,
                                    slug: v.slug,
                                    imageUrl: v.imageUrl,
                                });
                                toast.success(isSaved ? 'Removed from Wishlist' : 'Added to Wishlist');
                                trackEvent('INTENT_SIGNAL', 'wishlist_toggle', {
                                    lead_id: leadId || undefined,
                                    sku_id: v.availableColors?.[0]?.id || undefined,
                                    make_slug: slugify(v.make || ''),
                                    model_slug: slugify(v.model || ''),
                                    variant_slug: slugify(v.variant || ''),
                                    action: isSaved ? 'removed' : 'added',
                                    source: 'STORE_CATALOG',
                                });
                            }}
                            className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center transition-all shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:scale-105 ${isSaved ? 'bg-rose-50 text-rose-500' : 'bg-white/80 text-slate-400 hover:text-rose-500'}`}
                            title={isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
                        >
                            <motion.div
                                key={isSaved ? 'saved' : 'unsaved'}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: isSaved ? [1, 1.4, 1] : 1 }}
                                transition={{ duration: 0.3, ease: 'backOut' }}
                            >
                                <Heart size={14} className={isSaved ? 'fill-current' : ''} />
                            </motion.div>
                        </button>
                    </div>

                    {bestOffer && bestOffer.price !== undefined && bestOffer.price < 0 && (
                        <div className="absolute top-4 left-4 z-30">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-lg border border-emerald-400/30 shadow-[0_3px_10px_rgba(16,185,129,0.25)]">
                                <Sparkles size={9} className="fill-white text-white" />
                                <span className="text-[9px] font-black uppercase tracking-[0.12em]">
                                    SAVE ₹{formatRoundedPrice(Math.abs(bestOffer.price))}
                                </span>
                            </div>
                        </div>
                    )}

                    {bestOffer && bestOffer.price !== undefined && bestOffer.price > 0 && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-[0_3px_10px_rgba(0,0,0,0.18)] bg-rose-500 text-white border-rose-400/30"
                        >
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                className="flex items-center justify-center"
                            >
                                <Zap size={9} className="fill-white text-white" />
                            </motion.div>
                            <span className="text-[9px] font-black uppercase tracking-[0.12em] relative z-10">
                                SURGE ₹{formatRoundedPrice(Math.abs(bestOffer.price))}
                            </span>
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-xl pointer-events-none">
                                <motion.div
                                    animate={{ x: ['-150%', '300%'] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                    className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                />
                            </div>
                        </motion.div>
                    )}

                    <motion.img
                        initial={{ scale: 1.15, opacity: 0 }}
                        animate={{
                            scale: selectedColorZoom !== null ? selectedColorZoom : v.zoomFactor || 1.15,
                            scaleX: (selectedColorFlip !== undefined ? selectedColorFlip : v.isFlipped) ? -1 : 1,
                            x: selectedColorOffsetX !== undefined ? selectedColorOffsetX : v.offsetX || 0,
                            y: selectedColorOffsetY !== undefined ? selectedColorOffsetY : v.offsetY || 0,
                            opacity: 1,
                        }}
                        whileHover={{ scale: (selectedColorZoom || v.zoomFactor || 1.15) + 0.05 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        src={
                            selectedColorImage ||
                            v.imageUrl ||
                            (v.bodyType === 'SCOOTER'
                                ? '/images/categories/scooter_nobg.png'
                                : '/images/categories/motorcycle_nobg.png')
                        }
                        alt={v.model}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-contain z-10"
                    />

                    {/* Very Light Brand Watermark */}
                    <span className="absolute font-black text-[70px] uppercase tracking-[0.2em] opacity-[0.1] italic text-slate-900 select-none whitespace-nowrap z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        {displayMake}
                    </span>
                </div>

                <div
                    className={`${isTv ? 'p-3' : 'p-3 md:p-6'} flex-1 flex flex-col justify-between relative bg-[#FAFAFA] z-10`}
                >
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <h3
                                className={`${isTv ? 'text-lg' : 'text-lg md:text-xl'} font-black uppercase tracking-tighter italic text-slate-900 leading-none`}
                            >
                                {displayModel}
                            </h3>
                            {/* Swatches (Standardized) */}
                            {(() => {
                                const swatches =
                                    (v.availableColors || []).filter(
                                        c => typeof c?.hexCode === 'string' && c.hexCode.trim().length > 0
                                    ) || [];
                                if (swatches.length === 0) return null;

                                return (
                                    <div className="flex items-center min-h-[1.25rem] flex-nowrap">
                                        <div className="flex items-center gap-2 cursor-default">
                                            {[...swatches]
                                                .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
                                                .map((c, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            if (c.imageUrl) {
                                                                setSelectedColorImage(c.imageUrl);
                                                                setSelectedColorZoom(c.zoomFactor || null);
                                                                setSelectedColorFlip(c.isFlipped || false);
                                                                setSelectedColorOffsetX(c.offsetX || 0);
                                                                setSelectedColorOffsetY(c.offsetY || 0);
                                                                setSelectedColorFinish(c.finish || null);
                                                            }
                                                            if (c.hexCode) {
                                                                setSelectedHex(c.hexCode);
                                                            }
                                                            // Trigger callback if provided (e.g., in PDP)
                                                            if (onColorChange && c.id) {
                                                                onColorChange(c.id);
                                                            }
                                                        }}
                                                        className="w-5 h-5 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.12)] relative hover:scale-110 transition-all duration-300 cursor-pointer overflow-hidden"
                                                        style={{ background: c.hexCode }}
                                                        title={`${c.name}${c.finish ? ` (${c.finish})` : ''}`}
                                                    >
                                                        {c.finish?.toUpperCase() === 'GLOSS' && (
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-white/20 pointer-events-none" />
                                                        )}
                                                        {c.finish?.toUpperCase() === 'MATTE' && (
                                                            <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] pointer-events-none" />
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="flex flex-col mt-1">
                            <div className="flex items-center gap-2">
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-full text-left">
                                    {displayVariant}
                                </p>
                            </div>
                            {v.suitableFor && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {v.suitableFor
                                        .split(',')
                                        .filter(Boolean)
                                        .map(tag => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-wider border border-indigo-100 italic"
                                            >
                                                {tag.trim()}
                                            </span>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Pricing Flip Card — hex-adaptive colors ── */}
                    {(() => {
                        // Parse hex → {r,g,b}
                        const parseHex = (h: string | null) => {
                            if (!h) return null;
                            const c = h.replace('#', '');
                            if (c.length !== 6) return null;
                            return {
                                r: parseInt(c.slice(0, 2), 16),
                                g: parseInt(c.slice(2, 4), 16),
                                b: parseInt(c.slice(4, 6), 16),
                            };
                        };
                        const rgb = parseHex(selectedHex);
                        // Relative luminance (WCAG)
                        const luminance = rgb
                            ? 0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255)
                            : 0.5;

                        // Finance face: saturated dark tint — mix hex at ~55% with dark base
                        // This ensures even very dark hex codes (#1C1C1C) show visible color
                        const dr = 12,
                            dg = 14,
                            db = 18; // dark base (near-black tinted blue)
                        const finBg = rgb
                            ? `linear-gradient(135deg,
                            rgb(${Math.round(rgb.r * 0.52 + dr)}, ${Math.round(rgb.g * 0.42 + dg)}, ${Math.round(rgb.b * 0.52 + db)}) 0%,
                            rgb(${Math.round(rgb.r * 0.62 + dr + 8)}, ${Math.round(rgb.g * 0.5 + dg + 6)}, ${Math.round(rgb.b * 0.62 + db + 8)}) 50%,
                            rgb(${Math.round(rgb.r * 0.48 + dr)}, ${Math.round(rgb.g * 0.38 + dg)}, ${Math.round(rgb.b * 0.48 + db)}) 100%)`
                            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)';

                        // Cash face: clear light tint so vehicle color shows
                        const cashBg = rgb
                            ? `linear-gradient(135deg,
                            rgba(${rgb.r},${rgb.g},${rgb.b},0.18) 0%,
                            rgba(${rgb.r},${rgb.g},${rgb.b},0.10) 55%,
                            rgba(255,255,255,0.0) 100%)`
                            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                        const cashBgBase = rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.12)` : '#f8fafc';

                        // Text & accent on finance face: always white (background is always dark)
                        const finText = '#ffffff';
                        const finSubText = 'rgba(255,255,255,0.5)';
                        const finDivider = 'rgba(255,255,255,0.1)';

                        // Text on cash face: dark if background is light (which it always is)
                        const cashPrimaryText = '#0f172a';
                        const cashLabelColor = rgb
                            ? `rgb(${Math.round(rgb.r * 0.55 + 20)}, ${Math.round(rgb.g * 0.4 + 15)}, ${Math.round(rgb.b * 0.3 + 10)})`
                            : '#059669'; // fallback emerald
                        const cashDivider = rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)` : 'rgba(0,0,0,0.06)';
                        const cashBorder = rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.18)` : 'rgba(16,185,129,0.15)';

                        return (
                            <div
                                className="mt-3 md:mt-5 border-t border-slate-100 pt-3 md:pt-5"
                                style={{ WebkitPerspective: '1400px', perspective: '1400px' }}
                            >
                                <motion.div
                                    initial={false}
                                    animate={{
                                        boxShadow: isFlipping
                                            ? '0 20px 36px rgba(0,0,0,0.22)'
                                            : '0 2px 8px rgba(0,0,0,0.06)',
                                    }}
                                    transition={{ duration: 0.35 }}
                                    className="rounded-2xl"
                                >
                                    <motion.div
                                        initial={false}
                                        animate={{ rotateY: effectivePricingMode === 'finance' ? 0 : 180 }}
                                        transition={{ rotateY: { duration: 0.72, ease: [0.25, 0.46, 0.45, 0.94] } }}
                                        style={{ WebkitTransformStyle: 'preserve-3d', transformStyle: 'preserve-3d' }}
                                        className="relative w-full"
                                    >
                                        {/* ── FRONT · Finance ── */}
                                        <div
                                            className={`w-full rounded-2xl flex items-center justify-between ${isTv ? 'px-3 py-2.5' : 'px-4 md:px-5 py-3 md:py-4'}`}
                                            style={{
                                                WebkitBackfaceVisibility: 'hidden',
                                                backfaceVisibility: 'hidden',
                                                background: finBg,
                                                boxShadow:
                                                    'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)',
                                            }}
                                        >
                                            {/* Left: Downpayment — click to open global DP panel */}
                                            <button
                                                className="flex-1 flex flex-col items-start text-left"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    e.nativeEvent.stopImmediatePropagation();
                                                    e.preventDefault();
                                                    window.dispatchEvent(new CustomEvent('openFinancePanel'));
                                                }}
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <p
                                                        className="text-[9px] font-black uppercase tracking-wider italic leading-none"
                                                        style={{ color: 'rgba(255,255,255,0.55)' }}
                                                    >
                                                        Downpayment
                                                    </p>
                                                    <Pencil size={9} style={{ color: 'rgba(255,255,255,0.35)' }} />
                                                </div>
                                                <span
                                                    className={`font-black italic leading-none ${isTv ? 'text-[22px]' : 'text-[22px] md:text-[26px]'}`}
                                                    style={{ color: finText }}
                                                >
                                                    ₹{formatRoundedPrice(downpayment || 0)}
                                                </span>
                                                {showBcoinBadge && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Logo variant="icon" size={10} />
                                                        <span
                                                            className="text-[9px] font-bold italic uppercase tracking-wider leading-none"
                                                            style={{ color: finSubText }}
                                                        >
                                                            {coinsNeededForPrice(downpayment || 0).toLocaleString(
                                                                'en-IN'
                                                            )}{' '}
                                                            COINS
                                                        </span>
                                                    </div>
                                                )}
                                            </button>

                                            {/* Divider */}
                                            <div
                                                className="w-px h-10 mx-2 md:mx-4 shrink-0"
                                                style={{ backgroundColor: finDivider }}
                                            />

                                            {/* Right: EMI */}
                                            <div className="flex-1 flex flex-col items-end">
                                                <p className="text-[9px] font-black text-[#F4B000] uppercase tracking-wider mb-1 italic">
                                                    Lowest EMI
                                                </p>
                                                <span
                                                    className={`font-black italic leading-none ${isTv ? 'text-[22px]' : 'text-[22px] md:text-[26px]'}`}
                                                    style={{ color: finText }}
                                                >
                                                    {emiValue !== null ? `₹${formatRoundedPrice(emiValue)}` : '—'}
                                                </span>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Clock size={9} style={{ color: finSubText }} />
                                                    <span
                                                        className="text-[9px] font-bold italic uppercase tracking-wider leading-none"
                                                        style={{ color: finSubText }}
                                                    >
                                                        {activeTenure} MONTHS
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── BACK · Cash ── */}
                                        <div
                                            className={`absolute inset-0 w-full rounded-2xl flex items-center justify-between ${isTv ? 'px-3 py-2.5' : 'px-4 md:px-5 py-3 md:py-4'}`}
                                            style={{
                                                WebkitBackfaceVisibility: 'hidden',
                                                backfaceVisibility: 'hidden',
                                                transform: 'rotateY(180deg)',
                                                background: cashBg,
                                                backgroundColor: cashBgBase,
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                                                border: `1px solid ${cashBorder}`,
                                            }}
                                        >
                                            {/* Left: On-Road Price with Breakdown Tooltip */}
                                            <div
                                                className={`${isTv ? 'pr-3' : 'pr-5'} flex-1 flex flex-col items-start`}
                                            >
                                                <div className="group/pricing relative">
                                                    <div className="flex items-center gap-1.5 mb-1 cursor-help">
                                                        <p
                                                            className="text-[9px] font-black uppercase tracking-wider italic leading-none"
                                                            style={{ color: cashLabelColor }}
                                                        >
                                                            On-Road Price
                                                        </p>
                                                        <CircleHelp size={10} className="text-emerald-500/50" />

                                                        {/* Premium Breakup Tooltip (PDP Parity: High-Fidelity) */}
                                                        <div className="absolute left-0 bottom-full mb-4 z-50 w-max min-w-[280px] p-5 rounded-[2rem] bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover/pricing:opacity-100 group-hover/pricing:visible transition-all duration-500 pointer-events-none origin-bottom-left scale-90 group-hover/pricing:scale-100 ring-1 ring-black/5">
                                                            {/* Triangle pointer */}
                                                            <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />

                                                            <div className="space-y-5 relative z-10">
                                                                <div className="pb-3 border-b border-slate-100 flex justify-between items-end">
                                                                    <div>
                                                                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-brand-primary mb-0.5">
                                                                            Pricing Breakup
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                                            Core Components
                                                                        </p>
                                                                    </div>
                                                                    <div className="px-2 py-0.5 bg-slate-100 rounded-md text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                                        {priceSourceDisplay}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    {(() => {
                                                                        const tEx =
                                                                            (v.price as any)?.exShowroom ||
                                                                            (v as any)?.serverPricing?.ex_showroom ||
                                                                            0;
                                                                        const tRto =
                                                                            (v.price as any)?.rtoTotal ||
                                                                            (v as any)?.serverPricing?.rto?.total ||
                                                                            0;
                                                                        const tIns =
                                                                            (v.price as any)?.insuranceTotal ||
                                                                            (v as any)?.serverPricing?.insurance
                                                                                ?.total ||
                                                                            0;
                                                                        const rawOnRoad =
                                                                            onRoad > 0 ? onRoad : tEx + tRto + tIns;
                                                                        const rows = [
                                                                            { label: 'Ex-Showroom', val: tEx },
                                                                            {
                                                                                label: 'Registration (State)',
                                                                                val: tRto,
                                                                            },
                                                                            { label: 'Insurance', val: tIns },
                                                                        ];

                                                                        return (
                                                                            <>
                                                                                <div className="space-y-2">
                                                                                    {rows.map((row, idx) => (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className="flex justify-between items-center group/row"
                                                                                        >
                                                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover/row:text-slate-900 transition-colors">
                                                                                                {row.label}
                                                                                            </span>
                                                                                            <span className="text-[11px] font-mono font-black text-slate-900">
                                                                                                ₹
                                                                                                {formatRoundedPrice(
                                                                                                    row.val
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))}
                                                                                    <div className="pt-2 mt-1 border-t border-slate-100 flex justify-between items-center">
                                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                                                                                            On-Road Total
                                                                                        </span>
                                                                                        <span className="text-[12px] font-mono font-black text-slate-900">
                                                                                            ₹
                                                                                            {formatRoundedPrice(
                                                                                                rawOnRoad
                                                                                            )}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-start gap-0.5">
                                                        <span
                                                            onClick={handleFlip}
                                                            className="text-[24px] md:text-[28px] font-black italic leading-none cursor-pointer hover:scale-105 active:scale-95 transition-all"
                                                            style={{ color: cashPrimaryText }}
                                                        >
                                                            ₹{formatRoundedPrice(effectiveOfferPrice)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Center Divider */}
                                            <div className="w-px h-10" style={{ backgroundColor: cashDivider }} />

                                            {/* Right Panel: O'Circle Privileged */}
                                            <div className={`${isTv ? 'pl-3' : 'pl-5'} flex-1 flex flex-col items-end`}>
                                                <p
                                                    className="text-[9px] font-black uppercase tracking-wider mb-1 italic"
                                                    style={{ color: cashLabelColor }}
                                                >
                                                    O'Circle Privileged
                                                </p>

                                                <div className="flex flex-col items-end gap-0.5">
                                                    {showBcoinBadge && (
                                                        <div className="flex items-center gap-2">
                                                            <Logo variant="icon" size={16} />
                                                            <span
                                                                className="text-[24px] md:text-[28px] font-black italic leading-none"
                                                                style={{ color: cashPrimaryText }}
                                                            >
                                                                {coinsNeededForPrice(
                                                                    effectiveOfferPrice
                                                                ).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </div>
                        );
                    })()}

                    {/* Optional Mileage Line (Subtle) */}

                    {!isPdp && (
                        <div
                            className={`${isTv ? 'mt-1 space-y-1' : 'mt-1.5 md:mt-4 space-y-1.5 md:space-y-2'} relative z-20 w-full`}
                        >
                            {isUnserviceable ? (
                                <button
                                    onClick={handleGetQuoteClick}
                                    title={`We are not serviceable in ${safeServiceability.location || 'your area'} yet. We will notify you when we launch there.`}
                                    className={`w-full ${isTv ? 'h-8 text-[9px]' : 'h-11 text-[10px]'} bg-slate-100 text-slate-400 rounded-xl font-black uppercase tracking-[0.2em] cursor-not-allowed flex items-center justify-center`}
                                >
                                    Not Serviceable
                                </button>
                            ) : variantCount && variantCount > 1 && onExplore ? (
                                <button
                                    onClick={handleExploreClick}
                                    disabled={isNavigating || isPending}
                                    className={`group/btn relative overflow-hidden w-full ${isTv ? 'h-8 text-[9px]' : 'h-10 md:h-11 text-[10px]'} bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(244,176,0,0.3)] hover:shadow-[0_6px_20px_rgba(244,176,0,0.4)] hover:-translate-y-0.5 active:scale-[0.99] transition-all disabled:opacity-70 disabled:pointer-events-none`}
                                >
                                    <motion.div
                                        aria-hidden
                                        className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent skew-x-12"
                                        animate={{ x: ['-120%', '420%'] }}
                                        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <span className="relative z-10">
                                        {isNavigating || isPending ? 'Opening...' : 'Check Offer'}
                                    </span>
                                    <ArrowRight
                                        size={12}
                                        className="relative z-10 opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all"
                                    />
                                </button>
                            ) : (
                                <Link
                                    href={
                                        buildProductUrl({
                                            make: v.make,
                                            model: v.model,
                                            variant: v.variant,
                                            color: v.availableColors?.[0]?.name
                                                ? slugify(v.availableColors?.[0]?.name)
                                                : undefined,
                                            district: navigableDistrict,
                                            leadId: leadId,
                                            basePath,
                                        }).url
                                    }
                                    onClick={() => setIsNavigating(true)}
                                    className={`group/btn relative overflow-hidden w-full ${isTv ? 'h-8 text-[9px]' : 'h-10 md:h-11 text-[10px]'} bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(244,176,0,0.3)] hover:shadow-[0_6px_20px_rgba(244,176,0,0.4)] hover:-translate-y-0.5 active:scale-[0.99] transition-all`}
                                >
                                    <motion.div
                                        aria-hidden
                                        className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent skew-x-12"
                                        animate={{ x: ['-120%', '420%'] }}
                                        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <span className="relative z-10">
                                        {isNavigating || isPending ? 'Opening...' : 'Check Offer'}
                                    </span>
                                    <ArrowRight
                                        size={12}
                                        className="relative z-10 opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all"
                                    />
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Delivery TAT Line — PDP only */}
                    {deliveryTatLabel && (
                        <div className="mt-2 flex items-center justify-center gap-1.5">
                            <Clock size={10} className="text-slate-400" />
                            <span
                                className={`text-[9px] uppercase tracking-widest italic ${effectiveOfferMode === 'FAST_DELIVERY' ? 'font-black text-slate-600' : 'font-bold text-slate-400'}`}
                            >
                                {deliveryTatLabel}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
