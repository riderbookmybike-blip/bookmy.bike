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
import { MobileFilterDrawer } from './MobileFilterDrawer';
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
    resolvedDealerId?: string | null;
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
    resolvedDealerId = null,
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
    const [sortBy, setSortBy] = useState<'popular' | 'price' | 'mileage' | 'seatHeight' | 'kerbWeight'>('popular');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
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
                            stateCode: cachedData.stateCode,
                        });
                        return;
                    }
                } catch {}
            }
            setServiceability({ status: 'unset' });
        };
        checkCurrentServiceability();
    }, []);

    useEffect(() => {
        const handleSearchToggle = () => setIsMobileFilterOpen(true);
        window.addEventListener('toggleCatalogSearch', handleSearchToggle);
        return () => window.removeEventListener('toggleCatalogSearch', handleSearchToggle);
    }, []);

    // No forced default — show all body types when nothing is selected
    // This allows users to browse the full catalog on mobile

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
        switch (sortBy) {
            case 'popular':
                vehicles.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
                break;
            case 'price':
                vehicles.sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
                break;
            case 'mileage':
                vehicles.sort((a, b) => {
                    const ma = parseFloat(a.specifications?.engine?.mileage || '0');
                    const mb = parseFloat(b.specifications?.engine?.mileage || '0');
                    return mb - ma; // Highest mileage first
                });
                break;
            case 'seatHeight':
                vehicles.sort((a, b) => {
                    const sa = parseFloat(a.specifications?.dimensions?.seatHeight || '0');
                    const sb = parseFloat(b.specifications?.dimensions?.seatHeight || '0');
                    return sa - sb; // Lowest seat height first
                });
                break;
            case 'kerbWeight':
                vehicles.sort((a, b) => {
                    const wa = parseFloat(a.specifications?.dimensions?.kerbWeight || '0');
                    const wb = parseFloat(b.specifications?.dimensions?.kerbWeight || '0');
                    return wa - wb; // Lightest first
                });
                break;
        }
        return vehicles;
    }, [filteredVehicles, sortBy]);

    // Apply search filter on top of sorted results
    const finalResults = useMemo(() => {
        if (!searchQuery.trim()) return results;
        const q = searchQuery.toLowerCase().trim();
        // When searching, search across ALL items regardless of body type filter
        return (items || []).filter((v: ProductVariant) => {
            const name = (v.displayName || v.model || '').toLowerCase();
            const make = (v.make || '').toLowerCase();
            const combined = `${make} ${name}`;
            return combined.includes(q) || name.includes(q) || make.includes(q);
        });
    }, [results, searchQuery, items]);

    // Quick Filter Chips Logic: Strictly Bikes, Scooters, Mopeds
    const quickFilters = bodyOptions.map(bt => ({
        label: bt === 'MOTORCYCLE' ? 'Bikes' : bt === 'SCOOTER' ? 'Scooters' : 'Mopeds',
        active: selectedBodyTypes.includes(bt),
        onClick: () => {
            // If it's already active, do nothing (prevent unselecting to empty)
            if (selectedBodyTypes.includes(bt)) return;
            // Otherwise, set it as the exclusive selection in quick filters
            setSelectedBodyTypes([bt]);
        },
    }));

    return (
        <div className="min-h-screen bg-[#0b0d10] text-white pb-32">
            {/* 1. Search Bar (Sticky) */}
            <div className="sticky top-0 z-40 bg-[#0b0d10]/95 backdrop-blur-xl border-b border-white/10 pt-3 pb-3 px-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search bikes, scooters, brands..."
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/30 font-medium focus:outline-none focus:border-[#F4B000]/40 focus:bg-white/[0.08] transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
            {/* 2. Main Content Area */}
            <div className="px-4 py-6">
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
                        {groupProductsByModel(finalResults).map(group => (
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
                                                fallbackDealerId={resolvedDealerId}
                                                onEditDownpayment={() => setIsMobileFilterOpen(true)}
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
                sortBy={sortBy}
                onSortChange={val => setSortBy(val as typeof sortBy)}
            />

            <LocationPicker
                isOpen={isLocationPickerOpen}
                onClose={() => setIsLocationPickerOpen(false)}
                onLocationSet={(pincode, taluka, lat, lng) => {
                    setServiceability({
                        status: 'serviceable',
                        location: taluka || pincode,
                        district: taluka || pincode,
                    });
                    setIsLocationPickerOpen(false);
                }}
            />

            {/* Bottom Compare Tray — positioned above bottom nav */}
            {compareItems.length > 0 && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
                        left: 0,
                        right: 0,
                        zIndex: 52,
                    }}
                >
                    <CompareTray
                        items={compareItems}
                        onRemove={removeCompare}
                        onClear={clearCompare}
                        onCompareNow={handleCompareNow}
                    />
                </div>
            )}
        </div>
    );
};
