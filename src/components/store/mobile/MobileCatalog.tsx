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
    CircleHelp,
    MapPin,
    ArrowRight,
    SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { checkServiceability } from '@/actions/serviceArea';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BRANDS as defaultBrands } from '@/config/market';
import type { useCatalogFilters } from '@/hooks/useCatalogFilters';
import type { ProductVariant } from '@/types/productMaster';
import { createClient } from '@/lib/supabase/client';
import { resolveLocation } from '@/utils/locationResolver';
import { LocationPicker } from '../LocationPicker';
import { groupProductsByModel } from '@/utils/variantGrouping';
import { setLocationCookie } from '@/actions/locationCookie';
import { CompactProductCard } from './CompactProductCard';
import { MobileFilterDrawer, MobileFilterTrigger } from './MobileFilterDrawer';
import { getSelfMemberLocation, updateSelfMemberLocation } from '@/actions/members';
import { resolveIpLocation } from '@/actions/resolveIpLocation';
import { CompareTray, type CompareItem } from '../CompareTray';
import { CatalogGridSkeleton } from '../CatalogSkeleton';

type CatalogFilters = ReturnType<typeof useCatalogFilters>;

interface MobileCatalogProps {
    filters: CatalogFilters;
    variant?: 'default' | 'tv';
    items?: ProductVariant[];
    isLoading?: boolean;
    leadId?: string;
    basePath?: string;
    mode?: 'default' | 'smart';
    needsLocation?: boolean;
    resolvedStudioId?: string | null;
    resolvedDealerName?: string | null;
}

export const MobileCatalog = ({
    filters,
    items = [],
    isLoading: externalLoading = false,
    leadId,
    basePath = '/store',
    mode = 'default',
}: MobileCatalogProps) => {
    const isLoading = externalLoading;
    const router = useRouter();
    const isSmart = mode === 'smart';

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
        selectedFuels,
        setSelectedFuels,
        selectedBodyTypes,
        setSelectedBodyTypes,
        selectedSeatHeight,
        setSelectedSeatHeight,
        selectedWeights,
        setSelectedWeights,
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

    const makeOptions = availableMakes && availableMakes.length > 0 ? availableMakes : defaultBrands;
    const bodyOptions = ['MOTORCYCLE', 'SCOOTER', 'MOPED'] as const;
    const fuelOptions = ['Petrol', 'Electric', 'CNG'] as const;
    const brakeOptions = [
        'All Drum',
        'Front Disc Rear Drum',
        'Dual Disc',
        'Front ABS Rear Drum',
        'Front ABS Rear Disc',
        'Dual ABS',
    ] as const;
    const finishOptions = ['MATTE', 'GLOSS'] as const;

    // Derived State
    const [sortBy, setSortBy] = useState<'popular' | 'price' | 'emi'>('popular');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

    const toggleCompare = (item: CompareItem) => {
        setCompareItems(prev => {
            const exists = prev.find(c => c.modelSlug === item.modelSlug);
            if (exists) return prev.filter(c => c.modelSlug !== item.modelSlug);
            if (prev.length >= 3) {
                toast.error('Max 3 models to compare');
                return prev;
            }
            toast.success(`${item.model} added to compare`);
            return [...prev, item];
        });
    };
    const removeCompare = (modelSlug: string) => setCompareItems(prev => prev.filter(c => c.modelSlug !== modelSlug));
    const clearCompare = () => setCompareItems([]);
    const handleCompareNow = () => {
        if (compareItems.length === 0) return;
        const item = compareItems[0];
        router.push(`/store/compare/${item.make.toLowerCase()}/${item.modelSlug}`);
    };

    // Location / Serviceability (Simplified for Mobile view port logic)
    const [serviceability, setServiceability] = useState<{
        status: 'loading' | 'serviceable' | 'unserviceable' | 'unset';
        location?: string;
        district?: string;
        stateCode?: string;
    }>({ status: 'loading' });
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

    useEffect(() => {
        const checkCurrentServiceability = async () => {
            // Abbreviated location logic for brevity. Inherits logic from DesktopCatalog.
            // We'll read from localStorage directly first for speed on mobile.
            if (typeof window === 'undefined') return;

            let cachedData: any = null;
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (cached) {
                try {
                    cachedData = JSON.parse(cached);
                    if (cachedData?.pincode) {
                        setServiceability({
                            status: 'serviceable',
                            location: cachedData.district || cachedData.pincode || '',
                            district: cachedData.district,
                            stateCode: cachedData.stateCode || 'MH',
                        });
                        return;
                    }
                } catch {}
            }
            setServiceability({ status: 'unset' });
        };
        checkCurrentServiceability();
    }, []);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        const selectedMakeSet = new Set(selectedMakes.map(m => m.toUpperCase()));
        const isAllMakesSelected = makeOptions.every(m => selectedMakeSet.has(m.toUpperCase()));
        if (!isAllMakesSelected && selectedMakes.length > 0) count++;
        if (selectedBodyTypes.length > 0) count++;
        if (selectedCC.length > 0) count++;
        if (selectedBrakes.length > 0) count++;
        if (selectedWheels.length > 0) count++;
        if (selectedFinishes.length > 0) count++;
        return count;
    }, [selectedMakes, makeOptions, selectedBodyTypes, selectedCC, selectedBrakes, selectedWheels, selectedFinishes]);

    const mobileFilterSections = [
        {
            title: 'Body Type',
            options: [...bodyOptions],
            selected: selectedBodyTypes,
            onToggle: (v: string) => toggleFilter(setSelectedBodyTypes, v),
            onReset: () => setSelectedBodyTypes([]),
        },
        {
            title: 'Brand',
            options: makeOptions,
            selected: selectedMakes,
            onToggle: (v: string) => toggleFilter(setSelectedMakes, v),
            onReset: () => setSelectedMakes([]),
        },
        {
            title: 'Fuel',
            options: [...fuelOptions],
            selected: selectedFuels,
            onToggle: (v: string) => toggleFilter(setSelectedFuels, v),
            onReset: () => setSelectedFuels([]),
        },
        {
            title: 'Brakes',
            options: [...brakeOptions],
            selected: selectedBrakes,
            onToggle: (v: string) => toggleFilter(setSelectedBrakes, v),
            onReset: () => setSelectedBrakes([]),
        },
    ];

    const results = useMemo(() => {
        const vehicles = Array.isArray(filteredVehicles) ? [...filteredVehicles] : [];
        if (sortBy === 'popular') vehicles.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
        if (sortBy === 'price') vehicles.sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
        return vehicles;
    }, [filteredVehicles, sortBy]);

    // Quick Filter Chips Logic
    const quickFilters = [
        { label: 'All', active: selectedBodyTypes.length === 0, onClick: () => setSelectedBodyTypes([]) },
        ...bodyOptions.map(bt => ({
            label: bt === 'MOTORCYCLE' ? 'Bikes' : bt === 'SCOOTER' ? 'Scooters' : 'Mopeds',
            active: selectedBodyTypes.includes(bt),
            onClick: () => toggleFilter(setSelectedBodyTypes, bt),
        })),
        {
            label: 'EVs',
            active: selectedFuels.includes('Electric'),
            onClick: () => toggleFilter(setSelectedFuels, 'Electric'),
        },
    ];

    return (
        <div className="min-h-screen bg-[#0b0d10] text-white pb-32">
            {/* 1. Mobile Header (Sticky) */}
            <div className="sticky top-[var(--header-h)] z-40 bg-[#0b0d10]/95 backdrop-blur-xl border-b border-white/5 pt-4 pb-3 px-4 shadow-sm">
                {/* Search & Location Bar */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 h-11 transition-colors focus-within:border-brand-primary/50 focus-within:bg-white/10">
                        <Search size={16} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search bikes, scooters..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none text-[13px] font-medium text-white placeholder:text-slate-500 px-3 outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-1 rounded-full bg-white/10 text-white flex-shrink-0"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setIsLocationPickerOpen(true)}
                        className="h-11 px-4 bg-[#F4B000]/10 border border-[#F4B000]/30 rounded-2xl flex flex-col justify-center items-center min-w-[70px] active:scale-95 transition-all text-[#F4B000]"
                    >
                        <MapPin size={14} className="mb-0.5" />
                        <span className="text-[9px] font-bold uppercase tracking-widest line-clamp-1 max-w-[60px] truncate">
                            {serviceability.location || 'Loc'}
                        </span>
                    </button>
                </div>

                {/* Horizontal Quick Chips */}
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
                    {quickFilters.map((qf, i) => (
                        <button
                            key={i}
                            onClick={qf.onClick}
                            className={`flex-shrink-0 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${
                                qf.active
                                    ? 'bg-[#F4B000] text-black border-[#F4B000] shadow-[0_0_10px_rgba(244,176,0,0.3)]'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {qf.label}
                        </button>
                    ))}

                    {/* Trigger for the robust filter drawer aligned as a chip */}
                    <button
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/10 border border-white/20 text-white flex items-center gap-2"
                    >
                        <SlidersHorizontal size={12} />
                        Filters
                    </button>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="px-4 py-6">
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-wider text-white leading-none">
                            {isSmart ? 'Recommended' : 'All Vehicles'}
                        </h1>
                        <p className="text-[10px] font-semibold text-slate-400 tracking-widest mt-1">
                            {results.length} OPTIONS FOUND
                        </p>
                    </div>

                    {/* Simple sort toggle */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setSortBy('popular')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${sortBy === 'popular' ? 'bg-[#F4B000] text-black' : 'text-slate-400'}`}
                        >
                            Pop
                        </button>
                        <button
                            onClick={() => setSortBy('price')}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${sortBy === 'price' ? 'bg-[#F4B000] text-black' : 'text-slate-400'}`}
                        >
                            Price
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex flex-col gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className="h-6 w-1/3 bg-white/5 rounded animate-pulse" />
                                <div className="flex gap-3 overflow-hidden">
                                    <div className="w-[85vw] max-w-[320px] shrink-0 bg-white/5 border border-white/10 rounded-2xl aspect-[3/4] animate-pulse" />
                                    <div className="w-[85vw] max-w-[320px] shrink-0 bg-white/5 border border-white/10 rounded-2xl aspect-[3/4] animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="flex flex-col gap-8">
                        {groupProductsByModel(results).map(group => (
                            <div
                                key={group.modelSlug}
                                className="flex flex-col border-b border-white/5 pb-8 last:border-0 last:pb-0"
                            >
                                {/* Model Header block */}
                                <div className="flex items-end justify-between mb-3 px-1">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
                                            {group.make}
                                        </div>
                                        <h3 className="text-xl font-black italic uppercase tracking-wider text-white leading-none">
                                            {group.model}
                                        </h3>
                                    </div>
                                    <div className="text-[9px] font-bold text-[#F4B000] bg-[#F4B000]/10 px-2 py-1 rounded-full uppercase tracking-wider">
                                        {group.variants.length} Variant{group.variants.length > 1 ? 's' : ''}
                                    </div>
                                </div>

                                {/* Variants Swipe Container */}
                                <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 hide-scrollbar pb-2 items-stretch">
                                    {group.variants.map((v, idx) => (
                                        <div
                                            key={v.id}
                                            className="w-[85%] max-w-[320px] shrink-0 snap-center first:pl-1 last:pr-1"
                                        >
                                            <CompactProductCard
                                                v={v}
                                                downpayment={downpayment}
                                                tenure={tenure}
                                                basePath={basePath}
                                                leadId={leadId}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Search size={24} className="text-slate-500" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2">No Vehicles Found</h3>
                        <p className="text-sm font-medium text-slate-400 mb-6 max-w-[200px]">
                            Try adjusting your filters or searching for something else.
                        </p>
                        <button
                            onClick={clearAll}
                            className="px-6 py-3 rounded-full bg-[#F4B000] text-black text-[11px] font-black uppercase tracking-widest"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Filter Button (Optional, as we have the chip now, but keeping for UX parity) */}
            <MobileFilterTrigger onClick={() => setIsMobileFilterOpen(true)} activeCount={activeFilterCount} />

            {/* Drawers and Modals */}
            <MobileFilterDrawer
                isOpen={isMobileFilterOpen}
                onClose={() => setIsMobileFilterOpen(false)}
                sections={mobileFilterSections}
                onClearAll={clearAll}
                activeFilterCount={activeFilterCount}
                downpayment={downpayment}
                onDownpaymentChange={setDownpayment}
                tenure={tenure}
                onTenureChange={setTenure}
            />

            <LocationPicker
                isOpen={isLocationPickerOpen}
                onClose={() => setIsLocationPickerOpen(false)}
                onLocationSet={(pincode, taluka, lat, lng) => {
                    setServiceability({
                        status: 'serviceable', // Simplified for demo, ordinarily we'd check validity
                        location: taluka || pincode,
                        district: taluka || pincode,
                        stateCode: 'MH',
                    });
                    setIsLocationPickerOpen(false);
                }}
            />

            {/* Bottom Compare Tray */}
            {compareItems.length > 0 && (
                <CompareTray
                    items={compareItems}
                    onRemove={removeCompare}
                    onClear={clearCompare}
                    onCompareNow={handleCompareNow}
                />
            )}
        </div>
    );
};
