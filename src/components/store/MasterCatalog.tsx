'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    Zap,
    Search,
    Heart,
    Star,
    StarHalf,
    X,
    SlidersHorizontal,
    CircleHelp,
    MapPin,
    Bluetooth,
    ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { checkServiceability } from '@/actions/serviceArea';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/utils/urlHelper';

import { BRANDS as defaultBrands } from '@/config/market';
import type { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { getStableReviewCount } from '@/utils/vehicleUtils';
import type { ProductVariant } from '@/types/productMaster';
import { createClient } from '@/lib/supabase/client';
import { resolveLocation } from '@/utils/locationResolver';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { LocationPicker } from './LocationPicker';
import { calculateDistance, HUB_LOCATION, MAX_SERVICEABLE_DISTANCE_KM } from '@/utils/geoUtils';

type CatalogFilters = ReturnType<typeof useCatalogFilters>;

interface CatalogDesktopProps {
    filters: CatalogFilters;
    variant?: 'default' | 'tv';
}

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
    viewMode,
    downpayment,
    tenure,
    serviceability,
    onLocationClick,
    isTv = false,
}: {
    v: ProductVariant;
    viewMode: 'grid' | 'list';
    downpayment: number;
    tenure: number;
    serviceability?: { status: 'loading' | 'serviceable' | 'unserviceable' | 'unset'; location?: string; distance?: number };
    onLocationClick?: () => void;
    isTv?: boolean;
}) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const isSaved = isFavorite(v.id);
    const [selectedColorImage, setSelectedColorImage] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ratingCount, setRatingCount] = useState(() => {
        // Initialize with random count between 500-999 * 100
        const randomFactor = Math.floor(Math.random() * (999 - 500 + 1) + 500);
        return randomFactor * 100;
    });

    const basePrice = v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;

    // Continuous EMI Flip Logic
    const TENURE_OPTIONS = [12, 24, 36, 48, 60];
    const EMI_FACTORS: Record<number, number> = { 12: 0.091, 24: 0.049, 36: 0.035, 48: 0.028, 60: 0.024 };
    const activeTenure = tenure || 36;
    const emiValue = Math.max(0, Math.round((basePrice - downpayment) * (EMI_FACTORS[activeTenure] || 0.035)));

    // Handle optional serviceability
    const safeServiceability = serviceability || { status: 'unset' };
    const isUnserviceable = safeServiceability.status === 'unserviceable';

    const handleGetQuoteClick = (e: React.MouseEvent) => {
        if (isUnserviceable) {
            e.preventDefault();
            toast.error(`Your area ${safeServiceability.location || ''} is not serviceable`, {
                description: "We will update you once we are live in your area.",
                duration: 5000,
            });
        }
    };

    if (viewMode === 'list') {
        return (
            <div
                key={v.id}
                className="group bg-white dark:bg-[#0f1115] dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex shadow-sm hover:shadow-2xl dark:hover:shadow-brand-primary/5 transition-all duration-500 min-h-[22rem] dark:hover:border-white/20"
            >
                {/* Image Section - Wider */}
                <div className="w-[38%] bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center relative p-8 shrink-0 border-r border-slate-100 dark:border-white/5 overflow-hidden group/card">
                    {/* Vignette for depth */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-100/50 dark:to-black/30 z-0" />

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
                        <div className="absolute top-4 right-4 z-20 w-8 h-8 bg-blue-500/10 dark:bg-blue-400/10 backdrop-blur-md border border-blue-200/50 dark:border-blue-500/30 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]" title="Bluetooth Enabled">
                            <Bluetooth size={16} className="text-blue-500 dark:text-blue-400 animate-pulse" />
                        </div>
                    )}

                    {/* Background Brand Text */}
                    <span className="absolute font-black text-[120px] uppercase tracking-[0.2em] opacity-[0.03] dark:opacity-[0.05] italic text-slate-900 dark:text-white select-none whitespace-nowrap z-0 left-6 top-1/2 -translate-y-1/2 pointer-events-none group-hover/card:translate-x-4 transition-transform duration-1000">
                        {v.make}
                    </span>
                </div>

                <div className="flex-1 p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-4">
                                <h3
                                    className={`${isTv ? 'text-2xl' : 'text-3xl'} font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none`}
                                >
                                    {v.model}
                                </h3>
                                <div
                                    className={`flex items-center gap-2 bg-slate-100 dark:bg-white/10 ${isTv ? 'px-1 py-0.5' : 'px-2 py-1'} rounded-md`}
                                >
                                    <StarRating rating={v.rating || 4.5} size={isTv ? 8 : 10} />
                                    <span
                                        className={`text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 ${isTv ? 'scale-90' : ''}`}
                                    >
                                        {v.rating || '4.5'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                                {v.variant} • <span className="text-brand-primary">{v.color || 'Standard Color'}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => toggleFavorite({
                                id: v.id,
                                model: v.model,
                                variant: v.variant,
                                slug: v.slug,
                                imageUrl: v.imageUrl
                            })}
                            className={`w-12 h-12 border border-slate-200 dark:border-white/20 rounded-full flex items-center justify-center transition-all shadow-sm ${isSaved ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/40 text-rose-500' : 'text-slate-400 hover:text-rose-500 bg-white dark:bg-white/10 dark:hover:bg-white/20'}`}
                            title={isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
                        >
                            <Heart size={20} className={isSaved ? 'fill-current' : ''} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-12 py-6 border-y border-slate-100 dark:border-white/10 relative z-10 mt-4 bg-slate-50/30 dark:bg-white/[0.02] -mx-10 px-10">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Engine</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{Math.round(v.displacement || 0)}{v.powerUnit || 'CC'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seat Height</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{v.specifications?.dimensions?.seatHeight || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Weight</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white italic">{v.specifications?.dimensions?.kerbWeight || v.specifications?.dimensions?.curbWeight || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-emerald-500/80">ARAI Mileage</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{(v.specifications as any)?.mileage || (v.specifications as any)?.arai || '-'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 relative z-10">
                        <div className="flex gap-16">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                                    On-Road price
                                </p>
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                                            ₹{basePrice.toLocaleString('en-IN')}
                                        </span>
                                        {v.price?.offerPrice && v.price?.onRoad && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 line-through">
                                                    ₹{v.price.onRoad.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                                    EMI
                                </p>
                                <div className="h-10 relative">
                                    <div className="flex flex-col">
                                        <p className="text-3xl font-black text-brand-primary drop-shadow-[0_0_8px_rgba(244,176,0,0.2)] leading-none">
                                            ₹{emiValue.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-sm font-black text-slate-500 dark:text-slate-300 uppercase mt-2">
                                            x{activeTenure}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            {isUnserviceable ? (
                                <button
                                    onClick={handleGetQuoteClick}
                                    className="px-10 py-4 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] cursor-not-allowed"
                                >
                                    Get Quote
                                </button>
                            ) : (
                                <Link
                                    href={buildProductUrl({
                                        make: v.make,
                                        model: v.model,
                                        variant: v.variant
                                    }).url}
                                    className="px-10 py-4 bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(244,176,0,0.3)] hover:shadow-[0_0_30px_rgba(244,176,0,0.5)] hover:-translate-y-1 transition-all"
                                >
                                    GET QUOTE
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleCardClick = () => {
        setRatingCount(prev => prev + 1);
    };

    return (
        <div
            key={v.id}
            onClick={handleCardClick}
            className={`group bg-white dark:bg-[#0f1115] border border-black/[0.04] dark:border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-none hover:shadow-[0_20px_40px_-12px_rgba(244,176,0,0.15)] hover:border-brand-primary/30 transition-all duration-700 hover:-translate-y-2 ${isTv ? 'min-h-[640px]' : 'min-h-[520px] md:min-h-[660px]'}`}
        >
            <div
                className={`h-[240px] md:h-[344px] lg:h-[384px] bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center relative p-4 border-b border-black/[0.04] dark:border-white/5 overflow-hidden group/card`}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 dark:to-black/30 z-0" />

                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    {/* Mileage Badge (New) */}
                    {((v.specifications as any)?.mileage || (v.specifications as any)?.arai) && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-black/80 backdrop-blur-xl text-slate-900 dark:text-white rounded-xl shadow-sm border border-black/5 group/mileage transition-all hover:scale-105">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Zap size={10} className="fill-brand-primary text-brand-primary" />
                            </motion.div>
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                {((v.specifications as any)?.mileage || (v.specifications as any)?.arai)} km/l
                            </span>
                        </div>
                    )}

                    {v.rating && v.rating >= 4.7 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 dark:bg-white backdrop-blur-xl text-white dark:text-black rounded-xl shadow-xl border border-white/10 dark:border-black/5 ring-4 ring-black/5 dark:ring-white/5">
                            <Star size={10} className="fill-brand-primary text-brand-primary" />
                            <span className="text-[9px] font-black uppercase tracking-[0.15em]">Best Seller</span>
                        </div>
                    )}
                    {/* Only showing one badge as requested, Priority: Best Seller > Discount */}
                    {(!v.rating || v.rating < 4.7) && v.price?.discount && v.price.discount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 backdrop-blur-xl text-white rounded-xl shadow-lg shadow-emerald-500/20 border border-white/20">
                            <Zap size={10} className="fill-white" />
                            <span className="text-[9px] font-black uppercase tracking-[0.15em]">
                                SAVE ₹{v.price.discount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}
                </div>

                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite({
                                id: v.id,
                                model: v.model,
                                variant: v.variant,
                                slug: v.slug,
                                imageUrl: v.imageUrl
                            });
                            toast.success(isSaved ? 'Removed from Wishlist' : 'Added to Wishlist');
                        }}
                        className={`w-8 h-8 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-full flex items-center justify-center transition-all shadow-sm ${isSaved ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-200 text-rose-500 opacity-100' : 'bg-white/60 dark:bg-black/20 text-slate-400 hover:text-rose-500 opacity-60 hover:opacity-100 hover:scale-110'}`}
                        title={isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
                    >
                        <motion.div
                            key={isSaved ? 'saved' : 'unsaved'}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: isSaved ? [1, 1.4, 1] : 1 }}
                            transition={{ duration: 0.3, ease: "backOut" }}
                        >
                            <Heart size={14} className={isSaved ? 'fill-current' : ''} />
                        </motion.div>
                    </button>
                </div>

                <motion.img
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    src={
                        selectedColorImage ||
                        v.imageUrl ||
                        (v.bodyType === 'SCOOTER'
                            ? '/images/categories/scooter_nobg.png'
                            : '/images/categories/motorcycle_nobg.png')
                    }
                    alt={v.model}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[92%] h-[92%] object-contain z-10"
                />

                {/* Very Light Brand Watermark */}
                <span className="absolute font-black text-[70px] uppercase tracking-[0.2em] opacity-[0.03] dark:opacity-[0.05] italic text-slate-900 dark:text-white select-none whitespace-nowrap z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    {v.make}
                </span>
            </div>

            <div className={`${isTv ? 'p-5' : 'p-3 md:p-6'} flex-1 flex flex-col justify-between relative overflow-hidden bg-[#FAFAFA] dark:bg-[#0f1115]`}>
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <h3
                            className={`${isTv ? 'text-lg' : 'text-lg md:text-xl'} font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none`}
                        >
                            {v.model}
                        </h3>
                        {/* Swatches (Moved Here) */}
                        {v.availableColors && v.availableColors.length > 0 && (
                            <div className="flex items-center -space-x-2">
                                {v.availableColors.slice(0, 3).map((c, i) => (
                                    <div
                                        key={i}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (c.imageUrl) setSelectedColorImage(c.imageUrl);
                                        }}
                                        className="w-5 h-5 rounded-full border border-white dark:border-slate-900 shadow-sm relative cursor-pointer hover:scale-125 transition-transform"
                                        style={{ background: c.hexCode }}
                                        title={c.name}
                                    />
                                ))}
                                {v.availableColors.length > 3 && (
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-white dark:border-slate-900 flex items-center justify-center relative z-10 text-[9px] font-bold text-slate-500">
                                        +{v.availableColors.length - 3}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center mt-1">
                        <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-full text-left">
                            {v.variant}
                        </p>
                    </div>
                </div>

                <div className="mt-1.5 md:mt-4 pt-1.5 md:pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-start">
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 italic">
                            On-Road {v.price?.pricingSource ? `(${v.price.pricingSource})` : ''}
                        </p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl md:text-2xl font-black italic text-slate-900 dark:text-white px-1 pb-1">
                                ₹{basePrice.toLocaleString('en-IN')}
                            </span>
                        </div>
                        {v.price?.isEstimate && (
                            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1 italic">
                                *Estimated Price
                            </p>
                        )}
                        {safeServiceability.location ? (
                            <div className={`flex items-center gap-1 mt-1 ${isUnserviceable ? 'text-rose-500' : 'text-slate-400'}`}>
                                <MapPin size={8} className={isUnserviceable ? 'text-rose-500' : 'text-brand-primary'} />
                                <p className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[100px] italic">
                                    {isUnserviceable ? `${safeServiceability.location} - Not Serviceable` : safeServiceability.location}
                                </p>
                            </div>
                        ) : safeServiceability.status === 'loading' ? (
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest animate-pulse mt-1">
                                Detecting Location...
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black text-green-600 dark:text-green-500 uppercase tracking-widest mb-0.5 italic">Lowest EMI</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl md:text-2xl font-black text-green-600 dark:text-green-500 italic">₹{emiValue.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">/mo</span>
                        </div>
                    </div>
                </div>

                {/* Optional Mileage Line (Subtle) */}




                <div className="mt-1.5 md:mt-4 space-y-1.5 md:space-y-2">
                    {isUnserviceable ? (
                        <button
                            onClick={handleGetQuoteClick}
                            title={`We are not serviceable in ${safeServiceability.location || 'your area'} yet. We will notify you when we launch there.`}
                            className="w-full h-11 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] cursor-not-allowed flex items-center justify-center"
                        >
                            Not Serviceable
                        </button>
                    ) : (
                        <Link
                            href={buildProductUrl({
                                make: v.make,
                                model: v.model,
                                variant: v.variant
                            }).url}
                            className="group/btn relative w-full h-10 md:h-11 bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(244,176,0,0.3)] hover:shadow-[0_6px_20px_rgba(244,176,0,0.4)] hover:-translate-y-0.5 transition-all"
                        >
                            Get Best Quote
                            <ArrowRight size={12} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                        </Link>
                    )}
                    <div className="flex items-center justify-center gap-2 opacity-80 pt-1">
                        <StarRating rating={v.rating || 4.5} size={9} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            • {getStableReviewCount(v)} Ratings
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function MasterCatalog({ filters, variant: _variant = 'default' }: CatalogDesktopProps) {
    const {
        searchQuery,
        setSearchQuery,
        selectedMakes,
        setSelectedMakes,
        selectedCC,
        setSelectedCC,
        selectedBrakes,
        setSelectedBrakes,
        selectedWheels,
        setSelectedWheels,
        selectedBodyTypes,
        setSelectedBodyTypes,
        selectedSeatHeight,
        setSelectedSeatHeight,
        selectedFinishes,
        setSelectedFinishes,
        downpayment,
        setDownpayment,
        tenure,
        setTenure,
        maxPrice,
        setMaxPrice,
        maxEMI,
        setMaxEMI,
        availableMakes,
        filteredVehicles,
        toggleFilter,
        clearAll,
    } = filters;

    const makeOptions = (availableMakes && availableMakes.length > 0) ? availableMakes : defaultBrands;

    const [isTv] = useState(_variant === 'tv');

    const [serviceability, setServiceability] = useState<{ status: 'loading' | 'serviceable' | 'unserviceable' | 'unset'; location?: string; distance?: number }>({ status: 'loading' });
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

    React.useEffect(() => {
        const checkCurrentServiceability = async () => {
            if (typeof window === 'undefined') return;
            const supabase = createClient();

            // Tier 1: Profile Pincode (Authenticated)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('aadhaar_pincode')
                    .eq('id', user.id)
                    .single();

                if (profile?.aadhaar_pincode) {
                    const result = await checkServiceability(profile.aadhaar_pincode);
                    setServiceability({
                        status: result.isServiceable ? 'serviceable' : 'unserviceable',
                        location: result.location || profile.aadhaar_pincode
                    });
                    return;
                }
            }

            // Tier 2: Local Storage
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    if (data.pincode) {
                        const result = await checkServiceability(data.pincode);

                        // Construct display location: District ONLY
                        const displayLoc = result.district || result.location || data.pincode;

                        setServiceability({
                            status: result.isServiceable ? 'serviceable' : 'unserviceable',
                            location: displayLoc
                        });
                        // Allow silent update of details (District/State)
                        localStorage.setItem('bkmb_user_pincode', JSON.stringify({
                            pincode: data.pincode,
                            taluka: result.location || data.taluka || data.city,
                            district: result.district,
                            state: result.state,
                            stateCode: result.stateCode,
                            manuallySet: false
                        }));
                        // Trigger event for ProfileDropdown to update immediate
                        window.dispatchEvent(new Event('locationChanged'));
                        return;
                    } else if (data.taluka || data.city) {
                        setServiceability({
                            status: 'unset',
                            location: data.taluka || data.city
                        });
                        return;
                    }
                } catch {
                    localStorage.removeItem('bkmb_user_pincode');
                }
            }

            // Tier 3: Browser Geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                        const data = await res.json();
                        const pincode = data.postcode;
                        const taluka = data.city || data.locality || data.principalSubdivision;

                        if (pincode) {
                            const result = await checkServiceability(pincode);

                            // Construct display location: District ONLY
                            const displayLoc = result.district || result.location || taluka || pincode;

                            setServiceability({
                                status: result.isServiceable ? 'serviceable' : 'unserviceable',
                                location: displayLoc
                            });
                            localStorage.setItem('bkmb_user_pincode', JSON.stringify({
                                pincode,
                                taluka: result.location || taluka,
                                district: result.district,
                                state: result.state,
                                stateCode: result.stateCode,
                                manuallySet: false
                            }));
                        } else if (taluka && data.latitude && data.longitude) {
                            const dist = calculateDistance(data.latitude, data.longitude, HUB_LOCATION.lat, HUB_LOCATION.lng);
                            setServiceability({
                                status: (dist <= MAX_SERVICEABLE_DISTANCE_KM) ? 'serviceable' : 'unserviceable',
                                location: taluka,
                                distance: Math.round(dist)
                            });
                            localStorage.setItem('bkmb_user_pincode', JSON.stringify({
                                taluka,
                                district: taluka, // Fallback
                                lat: data.latitude,
                                lng: data.longitude,
                                manuallySet: false
                            }));
                        }
                    } catch (err) {
                        setServiceability({ status: 'unset' });
                    }
                }, () => {
                    setServiceability({ status: 'unset' });
                });
            } else {
                setServiceability({ status: 'unset' });
            }
        };
        checkCurrentServiceability();
    }, []);


    const [sortBy, setSortBy] = useState<'popular' | 'price' | 'emi'>('popular');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isEmiOpen, setIsEmiOpen] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const activeCategory = selectedBodyTypes.length === 1 ? selectedBodyTypes[0] : 'ALL';

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        const selectedMakeSet = new Set(selectedMakes.map(m => m.toUpperCase()));
        const isAllMakesSelected = makeOptions.length === 0
            || makeOptions.every(m => selectedMakeSet.has(m.toUpperCase()));
        if (!isAllMakesSelected) count++;
        if (selectedCC.length > 0) count++;
        if (selectedBrakes.length > 0) count++;
        if (selectedWheels.length > 0) count++;
        if (selectedFinishes.length > 0) count++;
        if (selectedSeatHeight.length > 0) count++;
        if (maxPrice < 1000000) count++;
        if (maxEMI < 20000) count++;
        return count;
    }, [
        selectedMakes,
        makeOptions,
        selectedCC.length,
        selectedBrakes.length,
        selectedWheels.length,
        selectedFinishes.length,
        selectedSeatHeight.length,
        maxPrice,
        maxEMI,
    ]);

    // Keyboard handlers
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFilterOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Scroll lock
    React.useEffect(() => {
        if (isFilterOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isFilterOpen]);

    const FilterGroup = ({
        title,
        options,
        selectedValues,
        onToggle,
        showReset = false,
        onReset,
    }: {
        title: string;
        options: string[];
        selectedValues: string[];
        onToggle: (val: string) => void;
        showReset?: boolean;
        onReset: () => void;
    }) => {
        const [isCollapsed, setIsCollapsed] = useState(false);
        const [isExpanded, setIsExpanded] = useState(false);
        const visibleOptions = isExpanded ? options : options.slice(0, 3);

        return (
            <div className="space-y-6">
                <div
                    className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4 cursor-pointer group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white flex items-center gap-2">
                        <div
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${selectedValues.length > 0 ? 'bg-brand-primary shadow-[0_0_12px_#F4B000]' : 'bg-slate-300 dark:bg-slate-700'}`}
                        />
                        {title}
                    </h4>
                    <div className="flex items-center gap-3">
                        {showReset && selectedValues.length > 0 && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    onReset();
                                }}
                                className="text-[9px] font-black uppercase text-brand-primary hover:text-slate-900 dark:hover:text-brand-primary/80 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                        <ChevronDown
                            size={14}
                            className={`text-slate-400 dark:text-slate-500 transition-transform duration-500 ${isCollapsed ? '-rotate-90' : 'rotate-0'} group-hover:text-brand-primary`}
                        />
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 gap-2">
                            {visibleOptions.map((opt: string) => (
                                <button
                                    key={opt}
                                    onClick={() => onToggle(opt)}
                                    className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${selectedValues.includes(opt)
                                        ? 'bg-brand-primary/10 border-brand-primary/50 shadow-sm'
                                        : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                                        }`}
                                >
                                    <span
                                        className={`text-[10px] font-black uppercase tracking-widest italic transition-colors ${selectedValues.includes(opt) ? 'text-slate-900 dark:text-brand-primary' : 'text-slate-500 dark:text-slate-300 group-hover:text-slate-800 dark:hover:text-slate-100'}`}
                                    >
                                        {opt}
                                    </span>
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${selectedValues.includes(opt) ? 'bg-brand-primary shadow-[0_0_10px_#F4B000] scale-125' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    />
                                </button>
                            ))}
                        </div>
                        {options.length > 3 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-primary transition-colors w-full text-center py-1.5 border border-dashed border-slate-200 dark:border-white/10 rounded-md bg-slate-50/50 dark:bg-white/[0.02]"
                            >
                                {isExpanded ? 'Show Less' : `+ Show ${options.length - 3} More`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const results = useMemo(() => {
        const vehicles = Array.isArray(filteredVehicles) ? [...filteredVehicles] : [];
        if (sortBy === 'price') {
            vehicles.sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
        }
        if (sortBy === 'emi') {
            vehicles.sort((a, b) => {
                const aEmi = Math.round(((a.price?.exShowroom || 0) - downpayment) * 0.035);
                const bEmi = Math.round(((b.price?.exShowroom || 0) - downpayment) * 0.035);
                return aEmi - bEmi;
            });
        }
        return vehicles;
    }, [filteredVehicles, sortBy, downpayment]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b0d10] transition-colors duration-500 font-sans">
            <main className="flex-1 mx-auto w-full max-w-[1440px] px-8 md:px-16 pt-12 md:pt-16 pb-10 md:pb-16">
                <header className="sticky top-[var(--header-h)] z-40 -mx-8 px-8 md:-mx-16 md:px-16 py-8 backdrop-blur-xl bg-slate-50/80 dark:bg-[#0b0d10]/80 border-b border-slate-200 dark:border-white/5 mb-8 transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left: Category Chips */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
                            <button
                                onClick={() => setSelectedBodyTypes([])}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === 'ALL'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md'
                                    : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
                                    }`}
                            >
                                All Types
                            </button>
                            {(['MOTORCYCLE', 'SCOOTER', 'MOPED'] as const).map(option => (
                                <button
                                    key={option}
                                    onClick={() =>
                                        setSelectedBodyTypes(activeCategory === option ? [] : [option])
                                    }
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === option
                                        ? 'bg-[#F4B000] text-black shadow-lg shadow-[#F4B000]/20 scale-105'
                                        : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {/* Right: Sort + Filters + Count */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                            {/* Sort Dropdown */}
                            <div className="hidden md:flex items-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-3 py-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="popular">Popularity</option>
                                    <option value="price">Price: Low to High</option>
                                    <option value="emi">EMI: Low to High</option>
                                </select>
                            </div>

                            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />

                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
                            >
                                <SlidersHorizontal size={12} strokeWidth={2.5} />
                                <span className="hidden sm:inline">Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center bg-[#F4B000] text-black w-4 h-4 rounded-full text-[8px] ml-1">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white italic leading-none">
                                    {results.length} <span className="text-[10px] not-italic text-slate-400 font-bold">Vehicles</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div
                    className={`flex gap-6 xl:gap-16 transition-all duration-700 ${viewMode === 'grid' ? 'max-w-full' : ''}`}
                >
                    {/* Sidebar Filter - Left Column (Only List View) */}
                    {viewMode === 'list' && (
                        <aside className="hidden xl:block w-80 flex-shrink-0 space-y-6 sticky top-[calc(var(--header-h)+24px)] self-start pt-2 transition-all animate-in fade-in slide-in-from-left-4">
                            <div className="flex flex-col gap-8 p-6 bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
                                {/* EMI Calculator Accordion */}
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setIsEmiOpen(!isEmiOpen)}
                                        className="w-full flex items-center justify-between group"
                                    >
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-brand-primary shadow-[0_0_8px_#F4B000]" />
                                            EMI Calculator
                                        </h4>
                                        <ChevronDown
                                            size={14}
                                            className={`text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isEmiOpen ? 'rotate-180' : 'rotate-0'} group-hover:text-brand-primary`}
                                        />
                                    </button>

                                    {isEmiOpen && (
                                        <div className="space-y-6 p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                        Downpayment
                                                    </span>
                                                    <span className="text-sm font-black text-brand-primary italic">
                                                        ₹{downpayment.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <div className="relative flex items-center h-6">
                                                    <input
                                                        type="range"
                                                        min="5000"
                                                        max="50000"
                                                        step="1000"
                                                        value={downpayment}
                                                        onChange={e => setDownpayment(parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white slider-thumb-black"
                                                        style={{
                                                            background: `linear-gradient(to right, #F4B000 0%, #F4B000 ${((downpayment - 5000) / (50000 - 5000)) * 100}%, ${typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} ${((downpayment - 5000) / (50000 - 5000)) * 100}%, ${typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} 100%)`,
                                                        }}
                                                    />
                                                    <style
                                                        dangerouslySetInnerHTML={{
                                                            __html: `
                                            .slider-thumb-black::-webkit-slider-thumb {
                                                appearance: none;
                                                width: 18px;
                                                height: 18px;
                                                background: #0f172a;
                                                border: 3px solid #F4B000;
                                                border-radius: 50%;
                                                cursor: pointer;
                                                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                                                transition: all 0.2s;
                                            }
                                            .slider-thumb-black::-webkit-slider-thumb:hover {
                                                transform: scale(1.1);
                                                background: #000;
                                            }
                                            .slider-thumb-black::-moz-range-thumb {
                                                width: 18px;
                                                height: 18px;
                                                background: #0f172a;
                                                border: 3px solid #F4B000;
                                                border-radius: 50%;
                                                cursor: pointer;
                                                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                                            }
                                        `,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                        Tenure (Months)
                                                    </span>
                                                    <span className="text-[10px] font-black text-brand-primary italic">
                                                        {tenure} Months
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {(() => {
                                                        const allTenures = [
                                                            3, 6, 9, 12, 18, 24, 30, 36, 42, 48, 54, 60,
                                                        ];
                                                        const idx = allTenures.indexOf(tenure);
                                                        const start = Math.max(
                                                            0,
                                                            Math.min(idx - 2, allTenures.length - 4)
                                                        );

                                                        return allTenures.slice(start, start + 4).map(t => (
                                                            <button
                                                                key={t}
                                                                onClick={() => setTenure(t)}
                                                                className={`py-3 rounded-2xl text-[10px] font-black transition-all duration-300 ${tenure === t
                                                                    ? 'bg-slate-900 dark:bg-brand-primary text-white dark:text-black shadow-lg scale-105 ring-2 ring-brand-primary/20'
                                                                    : 'bg-white/50 dark:bg-slate-800/30 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm'
                                                                    }`}
                                                            >
                                                                {t.toString().padStart(2, '0')}
                                                            </button>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Budget & EMI Filters nested in Calculator */}
                                            <div className="space-y-6 pt-4 border-t border-slate-200/50 dark:border-white/5">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                            Max On-Road Price
                                                        </span>
                                                        <span className="text-sm font-black text-slate-900 dark:text-white italic">
                                                            {maxPrice >= 1000000
                                                                ? 'Any'
                                                                : `Under ${(maxPrice / 100000).toFixed(1)}L`}
                                                        </span>
                                                    </div>
                                                    <div className="relative flex items-center h-6">
                                                        <input
                                                            type="range"
                                                            min="50000"
                                                            max="1000000"
                                                            step="10000"
                                                            value={maxPrice}
                                                            onChange={e => setMaxPrice(parseInt(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white slider-thumb-black"
                                                            style={{
                                                                background: `linear-gradient(to right, #F4B000 0%, #F4B000 ${((maxPrice - 50000) / (1000000 - 50000)) * 100}%, ${typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} ${((maxPrice - 50000) / (1000000 - 50000)) * 100}%, ${typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} 100%)`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                            Max Monthly EMI
                                                        </span>
                                                        <span className="text-sm font-black text-brand-primary italic">
                                                            {maxEMI >= 20000
                                                                ? 'Any'
                                                                : `Under ₹${maxEMI.toLocaleString('en-IN')}`}
                                                        </span>
                                                    </div>
                                                    <div className="relative flex items-center h-6">
                                                        <input
                                                            type="range"
                                                            min="1000"
                                                            max="20000"
                                                            step="500"
                                                            value={maxEMI}
                                                            onChange={e => setMaxEMI(parseInt(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white slider-thumb-black"
                                                            style={{
                                                                background: `linear-gradient(to right, #F4B000 0%, #F4B000 ${((maxEMI - 1000) / (20000 - 1000)) * 100}%, ${typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} ${((maxEMI - 1000) / (20000 - 1000)) * 100}%, ${typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} 100%)`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Search Bar */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-primary transition-colors">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="FIND MACHINE..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl py-4.5 pl-14 pr-4 text-[11px] font-black tracking-widest uppercase focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                                    />
                                </div>
                                {/* Filter Groups in Sidebar (List View) */}
                                <div className="space-y-6">
                                    <FilterGroup
                                        title="Quick Selection"
                                        options={['HONDA', 'TVS', 'BAJAJ', 'SUZUKI', 'YAMAHA']}
                                        selectedValues={selectedMakes}
                                        onToggle={(v: string) => toggleFilter(setSelectedMakes, v)}
                                        onReset={() => setSelectedMakes(makeOptions)}
                                        showReset={selectedMakes.length < makeOptions.length}
                                    />
                                    <FilterGroup
                                        title="CC Range"
                                        options={['< 125cc', '125-250cc', '250-500cc', '> 500cc']}
                                        selectedValues={selectedCC}
                                        onToggle={(v: string) => toggleFilter(setSelectedCC, v)}
                                        onReset={() => setSelectedCC([])}
                                        showReset
                                    />
                                    <FilterGroup
                                        title="Finish"
                                        options={['MATT', 'GLOSSY', 'METALLIC', 'SATIN']}
                                        selectedValues={selectedFinishes}
                                        onToggle={(v: string) => toggleFilter(setSelectedFinishes, v)}
                                        onReset={() => setSelectedFinishes([])}
                                        showReset
                                    />
                                    <FilterGroup
                                        title="Seat Height"
                                        options={['< 780mm', '780-810mm', '> 810mm']}
                                        selectedValues={selectedSeatHeight}
                                        onToggle={(v: string) => toggleFilter(setSelectedSeatHeight, v)}
                                        onReset={() => setSelectedSeatHeight([])}
                                        showReset
                                    />
                                </div>
                            </div>
                        </aside>
                    )}

                    {/* Main Content Area */}
                    <div className="flex-1 space-y-8">
                        {/* Active Filter Chips */}
                        {(searchQuery ||
                            selectedCC.length > 0 ||
                            selectedBrakes.length > 0 ||
                            selectedWheels.length > 0 ||
                            selectedFinishes.length > 0 ||
                            selectedSeatHeight.length > 0) && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {searchQuery && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full">
                                            <span className="text-[9px] font-black uppercase text-slate-400">Search</span>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                                                {searchQuery}
                                            </span>
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    )}
                                    {selectedCC.map((cc: string) => (
                                        <div
                                            key={cc}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full"
                                        >
                                            <span className="text-[9px] font-black uppercase text-slate-400">CC</span>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                                                {cc}
                                            </span>
                                            <button
                                                onClick={() => toggleFilter(setSelectedCC, cc)}
                                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedFinishes.map((finish: string) => (
                                        <div
                                            key={finish}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full"
                                        >
                                            <span className="text-[9px] font-black uppercase text-slate-400">Finish</span>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                                                {finish}
                                            </span>
                                            <button
                                                onClick={() => toggleFilter(setSelectedFinishes, finish)}
                                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedSeatHeight.map((sh: string) => (
                                        <div
                                            key={sh}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full"
                                        >
                                            <span className="text-[9px] font-black uppercase text-slate-400">Seat</span>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                                                {sh}
                                            </span>
                                            <button
                                                onClick={() => toggleFilter(setSelectedSeatHeight, sh)}
                                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedBrakes.map((brake: string) => (
                                        <div
                                            key={brake}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full"
                                        >
                                            <span className="text-[9px] font-black uppercase text-slate-400">Brakes</span>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                                                {brake}
                                            </span>
                                            <button
                                                onClick={() => toggleFilter(setSelectedBrakes, brake)}
                                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedWheels.map((wheel: string) => (
                                        <div
                                            key={wheel}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full"
                                        >
                                            <span className="text-[9px] font-black uppercase text-slate-400">Wheels</span>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                                                {wheel}
                                            </span>
                                            <button
                                                onClick={() => toggleFilter(setSelectedWheels, wheel)}
                                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={clearAll}
                                        className="text-[9px] font-black uppercase tracking-widest text-brand-primary hover:text-slate-900 dark:hover:text-white transition-colors px-3 ml-2"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}

                        <div
                            className={`grid ${viewMode === 'list'
                                ? 'grid-cols-1 w-full gap-6'
                                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'
                                }`}
                        >
                            {/* Results Grid */}
                            {results.map(v => (
                                <ProductCard
                                    key={v.id}
                                    v={v}
                                    viewMode={viewMode}
                                    downpayment={downpayment}
                                    tenure={tenure}
                                    serviceability={serviceability}
                                    onLocationClick={() => setIsLocationPickerOpen(true)}
                                    isTv={isTv}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mega Filter Overlay (Grid View Only) */}
                {
                    isFilterOpen && viewMode === 'grid' ? (
                        <div className="fixed top-[76px] inset-x-0 bottom-0 z-[100] bg-white/95 dark:bg-[#0b0d10]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 flex flex-col animate-in fade-in duration-300">
                            <div className="max-w-[1440px] mx-auto w-full px-20 flex flex-col h-full">
                                {/* Overlay Header */}
                                <div className="flex-shrink-0 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-widest italic uppercase">
                                            Customize
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                            Refine by brand, engine & fuel
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={clearAll}
                                            className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={() => setIsFilterOpen(false)}
                                            className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all"
                                        >
                                            <X size={22} className="text-slate-900 dark:text-white" />
                                        </button>
                                    </div>
                                </div>

                                {/* Overlay Content */}
                                <div className="flex-1 overflow-y-auto py-10 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        {/* Left Column: EMI & Search */}
                                        <div className="space-y-12">
                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                                    Finance Settings
                                                </h4>
                                                <div className="p-8 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem]">
                                                    <div className="space-y-8">
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                    Downpayment
                                                                </span>
                                                                <span className="text-xl font-black text-[#F4B000]">
                                                                    ₹{downpayment.toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="5000"
                                                                max="100000"
                                                                step="5000"
                                                                value={downpayment}
                                                                onChange={e => setDownpayment(parseInt(e.target.value))}
                                                                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#F4B000]"
                                                            />
                                                        </div>
                                                        <div className="space-y-4">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                Tenure (Months)
                                                            </span>
                                                            <div className="grid grid-cols-6 gap-2">
                                                                {[12, 18, 24, 30, 36, 42, 48, 54, 60].map(t => (
                                                                    <button
                                                                        key={t}
                                                                        onClick={() => setTenure(t)}
                                                                        className={`py-3 rounded-xl text-[10px] font-black transition-all ${tenure === t ? 'bg-[#F4B000] text-black shadow-lg scale-110' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500'}`}
                                                                    >
                                                                        {t}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                                    Search
                                                </h4>
                                                <div className="relative">
                                                    <Search
                                                        className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
                                                        size={20}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="SEARCH FOR BIKES..."
                                                        value={searchQuery}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                        className="w-full py-5 pl-16 pr-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-3xl text-[11px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#F4B000]/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Filters */}
                                        <div className="space-y-12">
                                            <FilterGroup
                                                title="Brands"
                                                options={makeOptions}
                                                selectedValues={selectedMakes}
                                                onToggle={(v: string) => toggleFilter(setSelectedMakes, v)}
                                                onReset={() => setSelectedMakes(makeOptions)}
                                                showReset={selectedMakes.length < makeOptions.length}
                                            />
                                            <FilterGroup
                                                title="Engine Displacement"
                                                options={['< 125cc', '125-250cc', '250-500cc', '> 500cc']}
                                                selectedValues={selectedCC}
                                                onToggle={(v: string) => toggleFilter(setSelectedCC, v)}
                                                onReset={() => setSelectedCC([])}
                                                showReset
                                            />
                                            <FilterGroup
                                                title="Brake System"
                                                options={[
                                                    'Drum',
                                                    'Disc (Front)',
                                                    'Dual Disc',
                                                    'Single Channel ABS',
                                                    'Dual Channel ABS',
                                                ]}
                                                selectedValues={selectedBrakes}
                                                onToggle={(v: string) => toggleFilter(setSelectedBrakes, v)}
                                                onReset={() => setSelectedBrakes([])}
                                                showReset
                                            />
                                            <FilterGroup
                                                title="Finish"
                                                options={['MATT', 'GLOSSY', 'METALLIC', 'SATIN']}
                                                selectedValues={selectedFinishes}
                                                onToggle={(v: string) => toggleFilter(setSelectedFinishes, v)}
                                                onReset={() => setSelectedFinishes([])}
                                                showReset
                                            />
                                            <FilterGroup
                                                title="Seat Height"
                                                options={['< 780mm', '780-810mm', '> 810mm']}
                                                selectedValues={selectedSeatHeight}
                                                onToggle={(v: string) => toggleFilter(setSelectedSeatHeight, v)}
                                                onReset={() => setSelectedSeatHeight([])}
                                                showReset
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Overlay Footer */}
                                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                                    <button
                                        onClick={clearAll}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        Clear all filters
                                    </button>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="px-12 py-5 bg-[#F4B000] text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#F4B000]/20 hover:scale-105 transition-all"
                                    >
                                        Show {results.length} {results.length === 1 ? 'Result' : 'Results'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null
                }
            </main >

            <LocationPicker
                isOpen={isLocationPickerOpen}
                onClose={() => setIsLocationPickerOpen(false)}
                onLocationSet={async (pincode, taluka, lat, lng) => {
                    const result = await checkServiceability(pincode);

                    let dist: number | undefined;
                    const isServiceable = result.isServiceable;

                    if (lat && lng) {
                        dist = calculateDistance(lat, lng, HUB_LOCATION.lat, HUB_LOCATION.lng);
                        // Optional: can keep both distance and database check, but DB is source of truth now
                        // isServiceable = isServiceable || dist <= MAX_SERVICEABLE_DISTANCE_KM;
                    }

                    setServiceability({
                        status: isServiceable ? 'serviceable' : 'unserviceable',
                        location: result.location || taluka,
                        distance: dist ? Math.round(dist) : undefined
                    });

                    localStorage.setItem('bkmb_user_pincode', JSON.stringify({
                        pincode,
                        taluka: result.location || taluka,
                        lat,
                        lng,
                        manuallySet: true
                    }));

                    toast.success(`Prices updated for ${result.location || taluka}${dist ? ` (${Math.round(dist)}km)` : ''}`);
                }}
            />
        </div >
    );
}
