'use client';

import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/utils/urlHelper';
import { BRANDS as defaultBrands } from '@/config/market';
import type { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { getStableReviewCount } from '@/utils/vehicleUtils';
import type { ProductVariant } from '@/types/productMaster';

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
    isTv = false,
}: {
    v: ProductVariant;
    viewMode: 'grid' | 'list';
    downpayment: number;
    tenure: number;
    isTv?: boolean;
}) => {
    const [isSaved, setIsSaved] = useState(false);
    const [serviceability, setServiceability] = useState<{ status: 'loading' | 'serviceable' | 'unserviceable' | 'unset'; location?: string }>({ status: 'loading' });

    React.useEffect(() => {
        const checkServiceability = () => {
            if (typeof window === 'undefined') return;
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (!cached) {
                setServiceability({ status: 'unset' });
                return;
            }
            try {
                const data = JSON.parse(cached);
                // Serviceable prefixes (Mock)
                const isServiceable = ['110001', '400001', '560001', '600001', '700001', '500001']
                    .some(p => data.pincode?.startsWith(p.slice(0, 3)));

                setServiceability({
                    status: isServiceable ? 'serviceable' : 'unserviceable',
                    location: data.city || data.pincode
                });
            } catch {
                setServiceability({ status: 'unset' });
            }
        };
        checkServiceability();
    }, []);

    const basePrice = v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;
    const emiValue = Math.max(0, Math.round((basePrice - downpayment) * 0.035));
    const isUnserviceable = serviceability.status === 'unserviceable';

    const handleGetQuoteClick = (e: React.MouseEvent) => {
        if (isUnserviceable) {
            e.preventDefault();
            toast.error(`Your area ${serviceability.location || ''} is not serviceable`, {
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
                            onClick={() => setIsSaved(!isSaved)}
                            className={`w-12 h-12 border border-slate-200 dark:border-white/20 rounded-full flex items-center justify-center transition-all shadow-sm ${isSaved ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/40 text-rose-500' : 'text-slate-400 hover:text-rose-500 bg-white dark:bg-white/10 dark:hover:bg-white/20'}`}
                            title={isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
                        >
                            <Heart size={20} className={isSaved ? 'fill-current' : ''} />
                        </button>
                    </div>

                    <div className="flex justify-between items-center py-6 border-y border-slate-100 dark:border-white/10 relative z-10 gap-8 mt-4">
                        <div className="space-y-1.5 w-1/4">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Engine
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {Math.round(v.displacement || 0)}
                                {v.powerUnit || 'CC'}
                            </p>
                        </div>
                        <div className="space-y-1.5 w-1/4">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Brakes
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {v.specifications?.brakes?.front || 'Drum'}
                            </p>
                        </div>
                        <div className="space-y-1.5 w-1/4">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Type
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {v.bodyType || 'COMMUTER'}
                            </p>
                        </div>
                        <div className="space-y-1.5 w-1/4 text-right">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Transmission
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {v.specifications?.transmission?.type || 'Manual'}
                            </p>
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
                                    EMI / {tenure}mo
                                </p>
                                <p className="text-3xl font-black text-brand-primary drop-shadow-[0_0_8px_rgba(244,176,0,0.2)]">
                                    ₹{emiValue.toLocaleString('en-IN')}
                                </p>
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

    return (
        <div
            key={v.id}
            className={`group bg-white dark:bg-[#0f1115] dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm hover:shadow-2xl dark:hover:shadow-brand-primary/5 transition-all duration-500 dark:hover:border-white/20 ${isTv ? 'min-h-[420px]' : 'min-h-[480px] h-sm:min-h-[400px] h-md:min-h-[440px]'}`}
        >
            <div
                className={`${isTv ? 'h-[205px]' : 'h-[220px] h-sm:h-[160px] h-md:h-[180px]'} bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center relative p-4 border-b border-slate-100 dark:border-white/5 overflow-hidden group/card`}
            >
                {/* ... Image Section content ... */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 dark:to-black/30 z-0" />

                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    {v.price?.discount && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md text-white rounded-full shadow-lg shadow-emerald-500/20 animate-in fade-in slide-in-from-left-4 duration-500">
                            <Zap size={10} className="fill-white" />
                            <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                                SAVE ₹{v.price.discount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}
                    {v.price?.surge && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/90 backdrop-blur-md text-white rounded-full shadow-lg shadow-amber-500/20 animate-in fade-in slide-in-from-left-4 duration-500">
                            <Zap size={10} className="fill-white" />
                            <span className="text-[9px] font-black uppercase tracking-[0.1em]">
                                SURGE ₹{v.price.surge.toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-full flex items-center justify-center transition-all ${isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500 dark:hover:bg-white/20'}`}
                    title={isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
                >
                    <Heart size={18} className={isSaved ? 'fill-current' : ''} />
                </button>

                <img
                    src={
                        v.imageUrl ||
                        (v.bodyType === 'SCOOTER'
                            ? '/images/categories/scooter_nobg.png'
                            : '/images/categories/motorcycle_nobg.png')
                    }
                    alt={v.model}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-[75%] object-contain z-10 transition-transform duration-700 group-hover/card:scale-110"
                />

                {/* Background Brand Text */}
                <span className="absolute font-black text-[90px] uppercase tracking-[0.2em] opacity-[0.03] dark:opacity-[0.05] italic text-slate-900 dark:text-white select-none whitespace-nowrap z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover/card:scale-105 transition-transform duration-1000">
                    {v.make}
                </span>
            </div>

            <div
                className={`${isTv ? 'p-4 space-y-4' : 'p-8 space-y-8'} flex-1 flex flex-col justify-between relative overflow-hidden`}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <h3
                            className={`${isTv ? 'text-lg' : 'text-xl'} font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none`}
                        >
                            {v.model}
                        </h3>
                        {/* Rating in line for TV */}
                        {isTv && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-900 dark:text-white">
                                    {v.rating || '4.5'}
                                </span>
                                <StarRating rating={v.rating || 4.5} size={8} />
                            </div>
                        )}
                        {!isTv && v.availableColors && v.availableColors.length > 0 && (
                            <div className="flex items-center -space-x-1.5 translate-y-0.5">
                                {v.availableColors.slice(0, 3).map((c, i) => (
                                    <div
                                        key={i}
                                        className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm relative group/swatch"
                                        style={{
                                            background: c.secondaryHexCode
                                                ? `linear-gradient(135deg, ${c.hexCode} 50%, ${c.secondaryHexCode} 50%)`
                                                : c.hexCode
                                        }}
                                        title={c.name}
                                    />
                                ))}
                                {v.availableColors.length > 3 && (
                                    <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-white/10 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm z-0">
                                        <span className="text-[7px] font-black text-slate-500 dark:text-slate-300">
                                            +{v.availableColors.length - 3}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <p
                        className={`${isTv ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest ${isTv ? 'mt-1' : 'mt-2'}`}
                    >
                        {v.variant}
                    </p>
                </div>

                <div
                    className={`flex items-center justify-between border-y border-slate-100 dark:border-white/10 ${isTv ? 'py-3' : 'py-5'} bg-slate-50/50 dark:bg-white/[0.04] -mx-6 px-6 relative z-10`}
                >
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-none">
                            On-Road Price
                        </p>
                        <span
                            className={`${isTv ? 'text-base' : 'text-lg'} font-black text-slate-900 dark:text-white block tracking-tight`}
                        >
                            ₹{basePrice.toLocaleString('en-IN')}
                        </span>
                        <div className="relative group/tooltip w-fit cursor-help">
                            <div className="flex items-center gap-1">
                                <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    All-Inclusive
                                </p>
                                <CircleHelp
                                    size={10}
                                    className={
                                        serviceability.status === 'serviceable'
                                            ? 'text-emerald-500 fill-emerald-500/20'
                                            : serviceability.status === 'unserviceable'
                                                ? 'text-red-500 fill-red-500/20'
                                                : 'text-slate-400'
                                    }
                                />
                            </div>
                            {/* Serviceability Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                {(() => {
                                    if (serviceability.status === 'loading') return 'Checking...';
                                    if (serviceability.status === 'unset') return 'Maharashtra';

                                    return (
                                        <div className="flex items-center gap-2">
                                            <span>{serviceability.location || 'Your Location'}</span>
                                            <div
                                                className={`w-2 h-2 rounded-full ${serviceability.status === 'serviceable' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}
                                            />
                                            <span className={serviceability.status === 'serviceable' ? 'text-emerald-400' : 'text-red-400'}>
                                                {serviceability.status === 'serviceable' ? 'Serviceable' : 'Not Available'}
                                            </span>
                                        </div>
                                    );
                                })()}
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900 dark:border-t-white" />
                            </div>
                        </div>
                    </div>
                    <div className="text-right space-y-0.5">
                        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-none">
                            EMI
                        </p>
                        <p
                            className={`${isTv ? 'text-base' : 'text-lg'} font-black text-brand-primary drop-shadow-[0_0_8px_rgba(244,176,0,0.2)]`}
                        >
                            ₹{emiValue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {tenure} Months
                        </p>
                    </div>
                </div>

                <div className={`grid grid-cols-1 ${isTv ? 'gap-2' : 'gap-3'} relative z-10 ${isTv ? 'mt-1' : 'mt-2'}`}>
                    {isUnserviceable ? (
                        <button
                            onClick={handleGetQuoteClick}
                            className={`w-full ${isTv ? 'py-3' : 'py-4'} bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-not-allowed`}
                        >
                            GET QUOTE
                        </button>
                    ) : (
                        <Link
                            href={buildProductUrl({
                                make: v.make,
                                model: v.model,
                                variant: v.variant
                            }).url}
                            className={`w-full ${isTv ? 'py-3' : 'py-4'} bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,176,0,0.3)] hover:shadow-[0_0_30px_rgba(244,176,0,0.5)] transition-all`}
                        >
                            GET QUOTE
                        </Link>
                    )}
                    {!isTv && (
                        <div className="flex items-center justify-center gap-2 py-1">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                {v.rating || '4.5'}
                            </span>
                            <StarRating rating={v.rating || 4.5} size={12} />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                {getStableReviewCount(v)} Reviews
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export function CatalogDesktop({ filters, variant: _variant = 'default' }: CatalogDesktopProps) {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            {/* Main Content Area - Visual Rest (No Container Box) */}
            <main className="flex-1 mx-auto w-full max-w-[1600px] px-6 md:px-12 lg:px-20 pt-24 pb-16">
                {/* Header Section - Aligned with Global Header */}
                <header className="mb-6 px-2">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="flex items-center gap-3 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                            >
                                <SlidersHorizontal size={14} strokeWidth={2.5} /> CUSTOMIZE
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center bg-[#F4B000] text-black w-5 h-5 rounded-full text-[8px]">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-white/10" />

                            <div className="flex flex-wrap gap-2">
                                {(['MOTORCYCLE', 'SCOOTER', 'MOPED'] as const).map(option => (
                                    <button
                                        key={option}
                                        onClick={() =>
                                            setSelectedBodyTypes(activeCategory === option ? [] : [option])
                                        }
                                        className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeCategory === option
                                            ? 'bg-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20 scale-105'
                                            : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 shadow-md shadow-slate-900/10 dark:shadow-white/5'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between lg:justify-end gap-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                Catalog
                            </p>
                            <h1 className="text-3xl md:text-4xl font-black italic text-slate-900 dark:text-white tracking-widest leading-none">
                                {results.length} {results.length === 1 ? 'VEHICLE' : 'VEHICLES'}
                            </h1>
                        </div>
                    </div>
                </header>

                <div
                    className={`flex gap-6 xl:gap-16 transition-all duration-700 ${viewMode === 'grid' ? 'max-w-full' : ''}`}
                >
                    {/* Sidebar Filter - Left Column (Only List View) */}
                    {viewMode === 'list' && (
                        <aside className="hidden xl:block w-80 flex-shrink-0 space-y-6 sticky top-24 self-start pt-2 transition-all animate-in fade-in slide-in-from-left-4">
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
                                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8 w-full'
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
                                    isTv={viewMode === 'grid'}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mega Filter Overlay (Grid View Only) */}
                {isFilterOpen && viewMode === 'grid' ? (
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
                ) : null}
            </main>
        </div>
    );
}
