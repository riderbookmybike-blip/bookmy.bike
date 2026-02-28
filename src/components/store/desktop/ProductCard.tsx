'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Heart,
    Star,
    StarHalf,
    MapPin,
    Bluetooth,
    ArrowRight,
    Sparkles,
    Zap,
    CircleHelp,
    Layers,
    GitCompareArrows,
    Pencil,
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
import { coinsNeededForPrice } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import { useSearchParams, useRouter } from 'next/navigation';
import { getEmiFactor } from '@/lib/constants/pricingConstants';

const StarRating = ({ rating = 4.5, size = 10 }: { rating?: number; size?: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
        <div className="flex items-center gap-0.5">
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} size={size} className="fill-[#F4B000] text-[#F4B000]" />
            ))}
            {hasHalfStar && <StarHalf size={size} className="fill-[#F4B000] text-[#F4B000]" />}
        </div>
    );
};

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
    bestOffer,
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
    fallbackDealerId,
    pricingMode: globalPricingMode = 'finance',
    onTogglePricingMode,
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
        price: number;
        dealer: string;
        dealerId?: string;
        isServiceable: boolean;
        dealerLocation?: string;
        studio_id?: string;
        bundleValue?: number;
        bundlePrice?: number;
    };
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
    onExplore?: () => void;
    onCompare?: () => void;
    isInCompare?: boolean;
    onEditDownpayment?: () => void;
    fallbackDealerId?: string | null;
    pricingMode?: 'cash' | 'finance';
    onTogglePricingMode?: () => void;
}) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const { language } = useI18n();
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

    useEffect(() => {
        setCardPricingMode(globalPricingMode);
    }, [globalPricingMode]);

    const handleFlip = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextMode = cardPricingMode === 'cash' ? 'finance' : 'cash';
        setCardPricingMode(nextMode);
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

    const [_ratingCount, setRatingCount] = useState(() => {
        // Initialize with random count between 500-999 * 100
        const randomFactor = Math.floor(Math.random() * (999 - 500 + 1) + 500);
        return randomFactor * 100;
    });

    const effectiveServerPricing = (v as any)?.serverPricing;

    // Use the comprehensive price from SystemCatalogLogic (already includes offer)
    const displayPrice = v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;

    const liveOnRoad = typeof v.price?.onRoad === 'number' ? v.price.onRoad : undefined;
    const basePrice =
        isPdp && liveOnRoad !== undefined ? liveOnRoad : displayPrice || effectiveServerPricing?.final_on_road || 0;

    // Location & Dealer Labels - derived directly from ProductVariant
    const priceSourceLocation =
        v.dealerLocation || effectiveServerPricing?.location?.district || v.price?.pricingSource || undefined;

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

    const dealerLabel = v.studioName?.trim();
    const dealerLabelDisplay = dealerLabel || 'UNASSIGNED';
    const districtLabelDisplay = districtLabel || null;
    const studioDisplayLabel = v.studioCode || null;
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
    const offerPrice = v.price?.offerPrice || basePrice;
    const offerDeltaForParity = typeof v.price?.discount === 'number' ? -Number(v.price.discount || 0) : 0;
    const formatRoundedPrice = (value: number | null | undefined) =>
        Math.ceil(Number(value) || 0).toLocaleString('en-IN');

    // SSPP v1: B-Coin Integration
    const params = useSearchParams();

    // bcoinTotal is the alternative currency view (13 Coins = 1000 INR)
    const bcoinTotal = coinsNeededForPrice(offerPrice);

    // Assume standard 13-coin signup bonus (₹1000) for catalog potential if no specific pricing
    const coinPricing = (v.price as any)?.coinPricing || {
        discount: 1000,
        coinsUsed: 13,
    };
    const bcoinAdjustment = coinPricing.discount || 0;
    const isShowingEffectivePrice = bcoinAdjustment > 0;
    const baseOnRoadPrice = onRoad > 0 ? onRoad : offerPrice;
    const effectiveOfferPrice = Math.max(0, offerPrice - bcoinAdjustment);
    const showOnRoadStrike = baseOnRoadPrice > effectiveOfferPrice;

    // If dealer offer exists, price is CONFIRMED not estimated
    const isConfirmedPrice = !!bestOffer;
    // Savings calculation

    const offerDelta = bestOffer?.price ?? 0;
    // Calculate savings based on source (Live Best Offer vs Server/Mapped Data)
    const bundleSavings = bestOffer
        ? Math.max(0, (bestOffer.bundleValue || 0) - (bestOffer.bundlePrice || 0))
        : v.price?.bundleSavings || 0;
    const savings = bestOffer
        ? (offerDelta < 0 ? Math.abs(offerDelta) : 0) + bundleSavings
        : v.price?.totalSavings || onRoad - offerPrice;
    const surge = bestOffer && offerDelta > 0 ? offerDelta : 0;
    const netImpact = bestOffer ? savings - surge : savings;

    // Continuous EMI Flip Logic
    // const TENURE_OPTIONS = [12, 24, 36, 48, 60];

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

    // Handle optional serviceability
    const safeServiceability = serviceability || { status: 'unset' };
    const isUnserviceable = safeServiceability.status === 'unserviceable';

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
        router.push(variantUrl);
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
                data-dealer-id={v.dealerId || bestOffer?.dealerId || fallbackDealerId || ''}
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
                                    className={`${isTv ? 'text-2xl' : 'text-3xl'} font-black uppercase tracking-tighter italic text-slate-900 leading-none`}
                                >
                                    {displayModel}
                                </h3>
                                <div
                                    className={`flex items-center gap-2 bg-slate-100 ${isTv ? 'px-1 py-0.5' : 'px-2 py-1'} rounded-md`}
                                >
                                    <StarRating rating={v.rating || 4.5} size={isTv ? 8 : 10} />
                                    <span
                                        className={`text-[10px] font-black uppercase tracking-widest text-slate-600 ${isTv ? 'scale-90' : ''}`}
                                    >
                                        {v.rating || '4.5'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative">
                                {displayVariant} • <span className="text-brand-primary">{displayColor}</span>
                            </p>
                        </div>
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
                                    {pricingLabel === 'ON-ROAD' ? 'On-Road price' : 'Ex-Showroom price'}
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
                                        <p className="text-3xl font-black text-brand-primary drop-shadow-[0_0_8px_rgba(244,176,0,0.2)] leading-none">
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
                                        className="px-10 py-4 bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(244,176,0,0.3)] hover:shadow-[0_0_30px_rgba(244,176,0,0.5)] hover:-translate-y-1 transition-all"
                                    >
                                        Know More
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
        <div
            key={v.id}
            data-testid="catalog-product-card"
            data-product-id={v.id}
            data-dealer-id={v.dealerId || bestOffer?.dealerId || fallbackDealerId || ''}
            data-offer-delta={offerDeltaForParity}
            data-district={districtLabelDisplay || ''}
            onClick={handleCardClick}
            className={`group bg-white border border-black/[0.04] rounded-[2rem] overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-12px_rgba(244,176,0,0.15)] hover:border-brand-primary/30 transition-all duration-700 hover:-translate-y-2 ${isTv ? 'min-h-[328px]' : 'min-h-[580px] md:min-h-[660px]'}`}
        >
            <div
                className={`${isTv ? 'h-[170px]' : 'h-[340px] md:h-[344px] lg:h-[384px]'} bg-slate-50 flex items-center justify-center relative p-4 border-b border-black/[0.04] overflow-hidden group/card`}
                style={{ backgroundColor: selectedHex ? `${selectedHex}4D` : undefined }}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 z-0" />

                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    {/* Primary Discount Pill (from catalog data) - SAVE for positive, SURGE for negative */}
                    {(v.price?.discount || 0) > 0 && !bestOffer && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] border border-emerald-400/30 transition-all hover:scale-105">
                            <Sparkles size={10} className="fill-white text-white" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                Save ₹{formatRoundedPrice(v.price.discount)}
                            </span>
                        </div>
                    )}
                    {/* SURGE Pill for negative discount (price increase) */}
                    {(v.price?.discount || 0) < 0 && !bestOffer && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-xl shadow-[0_4px_12px_rgba(244,63,94,0.3)] border border-rose-400/30 transition-all hover:scale-105">
                            <Zap size={10} className="fill-white text-white" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                Surge ₹{formatRoundedPrice(Math.abs(v.price.discount || 0))}
                            </span>
                        </div>
                    )}
                </div>

                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
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
                            <Layers size={14} />
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
                        }}
                        className={`w-8 h-8 backdrop-blur-xl border border-slate-200 rounded-full flex items-center justify-center transition-all shadow-sm bg-white/60 ${isSaved ? 'text-rose-500 opacity-100' : 'text-slate-400 hover:text-rose-500 opacity-60 hover:opacity-100 hover:scale-110'}`}
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

                {bestOffer && bestOffer.price !== 0 && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-lg ${
                            bestOffer.price < 0
                                ? 'bg-emerald-500 text-white border-emerald-400/30'
                                : 'bg-rose-500 text-white border-rose-400/30'
                        }`}
                    >
                        <motion.div
                            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="flex items-center justify-center"
                        >
                            {bestOffer.price < 0 ? (
                                <Sparkles
                                    size={12}
                                    className="fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                />
                            ) : (
                                <Zap
                                    size={12}
                                    className="fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                />
                            )}
                        </motion.div>
                        <span className="text-[10px] font-black uppercase tracking-wider relative z-10">
                            {bestOffer.price < 0 ? 'SAVE' : 'SURGE'} ₹{formatRoundedPrice(Math.abs(bestOffer.price))}
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
                                                    className="w-5 h-5 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.12)],255,255,0.15)] relative hover:scale-110 transition-all duration-300 cursor-pointer overflow-hidden"
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

                <div className="mt-3 md:mt-6 pt-3 md:pt-6 border-t border-slate-100 relative z-30 perspective-1000">
                    <motion.div
                        animate={{ rotateY: cardPricingMode === 'finance' ? 0 : 180 }}
                        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="relative w-full min-h-[80px]"
                        onClick={handleFlip}
                    >
                        {/* Front Face: Finance */}
                        <div
                            className="w-full flex items-center justify-between"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            {/* Left Panel: Offer Price */}
                            <div className={`${isTv ? 'pr-2.5' : 'pr-4'} flex flex-col items-start`}>
                                <div className="relative group/offer flex items-center gap-1.5 mb-1.5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] italic">
                                        On Road
                                    </p>
                                    <CircleHelp
                                        size={12}
                                        className="text-slate-400 group-hover/offer:text-brand-primary transition-colors cursor-help shrink-0"
                                    />
                                    {/* ... breakdown tooltip ... */}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className="text-lg md:text-xl font-black italic text-slate-900 leading-none">
                                        ₹{formatRoundedPrice(effectiveOfferPrice)}
                                    </span>
                                    {showBcoinBadge && (
                                        <div className="flex items-center gap-1.5 pl-0.5 mt-1">
                                            <Logo variant="icon" size={14} />
                                            <span className="text-[10px] font-bold italic text-brand-primary">
                                                {bcoinTotal.toLocaleString('en-IN')} Coins
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Center Divider */}
                            <div className="w-px h-10 bg-slate-100" />

                            {/* Right Panel: EMI */}
                            <div className={`${isTv ? 'pl-2.5' : 'pl-4'} flex flex-col items-end`}>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.1em] italic mb-1.5">
                                    Lowest EMI
                                </p>
                                <div className="flex flex-col items-end">
                                    <span className="text-[22px] md:text-3xl font-black text-brand-primary italic leading-none">
                                        {emiValue !== null ? `₹${formatRoundedPrice(emiValue)}` : '—'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 italic mt-1">
                                        x{tenure} months
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Back Face: Cash (Rotated 180deg) */}
                        <div
                            className="absolute inset-0 w-full flex items-center justify-between"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <div className="w-full flex flex-col items-center justify-center space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                                    Full Cash Payment
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl md:text-4xl font-black italic text-slate-900 leading-none">
                                        ₹{formatRoundedPrice(effectiveOfferPrice)}
                                    </span>
                                    {netImpact > 0 && (
                                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                            Save ₹{formatRoundedPrice(netImpact)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={10} /> {priceSourceDisplay}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

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
                                onClick={e => {
                                    e.stopPropagation();
                                    onExplore();
                                }}
                                className={`group/btn relative w-full ${isTv ? 'h-8 text-[9px]' : 'h-10 md:h-11 text-[10px]'} bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(244,176,0,0.3)] hover:shadow-[0_6px_20px_rgba(244,176,0,0.4)] hover:-translate-y-0.5 transition-all`}
                            >
                                Compare Variants
                                <ArrowRight
                                    size={12}
                                    className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all"
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
                                className={`group/btn relative w-full ${isTv ? 'h-8 text-[9px]' : 'h-10 md:h-11 text-[10px]'} bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(244,176,0,0.3)] hover:shadow-[0_6px_20px_rgba(244,176,0,0.4)] hover:-translate-y-0.5 transition-all`}
                            >
                                Know More
                                <ArrowRight
                                    size={12}
                                    className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all"
                                />
                            </Link>
                        )}
                    </div>
                )}
                {!isTv && (
                    <div className="flex items-center justify-center gap-2 opacity-80 pt-1 mt-1">
                        <StarRating rating={v.rating || 4.5} size={9} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            • {getStableReviewCount(v)} Ratings
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
