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
    Sparkles, // Added Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { checkServiceability } from '@/actions/serviceArea';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/utils/urlHelper';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import { BRANDS as defaultBrands } from '@/config/market';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import type { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { getStableReviewCount } from '@/utils/vehicleUtils';
import type { ProductVariant } from '@/types/productMaster';
import { createClient } from '@/lib/supabase/client';
import { resolveLocation } from '@/utils/locationResolver';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { LocationPicker } from './LocationPicker';
import { calculateDistance, HUB_LOCATION, MAX_SERVICEABLE_DISTANCE_KM } from '@/utils/geoUtils';
import { removeLocationCookie } from '@/actions/locationCookie';
import { ProductCard } from './desktop/ProductCard';

type CatalogFilters = ReturnType<typeof useCatalogFilters>;

interface DesktopCatalogProps {
    filters: CatalogFilters;
    variant?: 'default' | 'tv';
    initialItems?: ProductVariant[]; // Added for SSR Hydration
    leadId?: string;
    basePath?: string;
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



// ... ProductCard ends above ...

export const DesktopCatalog = ({
    filters,
    variant: _variant = 'default',
    initialItems = [],
    leadId,
    basePath = '/store',
}: DesktopCatalogProps) => {
    // 1. Initialize with SSR Data (Instant Render)
    const { items: clientItems, isLoading: isClientLoading } = useSystemCatalogLogic();

    // Prefer client items once loaded, otherwise show server items
    const displayItems = clientItems.length > 0 ? clientItems : initialItems;
    // const isLoading = displayItems.length === 0 && isClientLoading;

    // Destructure filters from props
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

    // Derived State
    const makeOptions = availableMakes && availableMakes.length > 0 ? availableMakes : defaultBrands;
    const activeCategory = selectedBodyTypes.length === 1 ? selectedBodyTypes[0] : 'ALL';

    // Fallback for filteredVehicles if untyped or missing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const vehicles = Array.isArray(filteredVehicles) ? filteredVehicles : [];

    // Local State
    const [isTv] = useState(_variant === 'tv');
    const [sortBy, setSortBy] = useState<'popular' | 'price' | 'emi'>('popular');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isEmiOpen, setIsEmiOpen] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Initial serviceability check (Client Side - keeps looking for updates)
    const [serviceability, setServiceability] = useState<{
        status: 'loading' | 'serviceable' | 'unserviceable' | 'unset';
        location?: string;
        district?: string;
        stateCode?: string;
        userDistrict?: string; // User's actual district
        fallbackDistrict?: string; // Nearest serviceable district if user's is not serviceable
    }>({ status: 'loading' });

    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

    const [marketOffers, setMarketOffers] = useState<
        Record<
            string,
            {
                price: number;
                dealer: string;
                dealerId?: string;
                isServiceable: boolean;
                bundleValue?: number;
                bundlePrice?: number;
            }
        >
    >({});
    const AUMS_DEALER_ID = 'f3e6e266-3ca5-4c67-91ce-b7cc98e30ee5';

    // Fetch Market Offers when Serviceability Updates
    useEffect(() => {
        const fetchOffers = async () => {
            // ALWAYS call RPC - default to MH state if no location
            const supabase = createClient();
            const stateCode = serviceability.stateCode || 'MH'; // Default fallback
            const district = serviceability.district || null;

            console.log('[MasterCatalog] Calling RPC with:', { stateCode, district });

            const { data, error } = await supabase.rpc('get_market_best_offers', {
                p_state_code: stateCode,
                p_district: serviceability.district || null, // Pass district if available
            });

            if (!error && data) {
                const offerMap: Record<
                    string,
                    {
                        price: number;
                        dealer: string;
                        dealerId?: string;
                        isServiceable: boolean;
                        bundleValue?: number;
                        bundlePrice?: number;
                    }
                > = {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.forEach((item: any) => {
                    offerMap[item.vehicle_color_id] = {
                        price: Number(item.best_offer), // Ensure number
                        dealer: item.dealer_name,
                        dealerId: item.dealer_id,
                        isServiceable: item.is_serviceable,
                        bundleValue: Number(item.bundle_value || 0),
                        bundlePrice: Number(item.bundle_price ?? item.bundle_value ?? 0),
                    };
                });
                setMarketOffers(offerMap);

                // Debug: Log studio name availability
                if (typeof window !== 'undefined') {
                    const sampleOffer = Object.values(offerMap)[0];
                    console.log('[MasterCatalog] Market offers loaded:', {
                        offerCount: Object.keys(offerMap).length,
                        sampleDealer: sampleOffer?.dealer,
                        sampleDealerId: sampleOffer?.dealerId,
                        location: serviceability.location,
                        stateCode: serviceability.stateCode,
                        status: serviceability.status,
                    });

                    // Update debug panel
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).__BMB_DEBUG__ = {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ...(window as any).__BMB_DEBUG__,
                        district: serviceability.location,
                        stateCode: serviceability.stateCode,
                        pricingSource: 'MARKET_RULES',
                        locSource: 'AUTO',
                        dealerId: sampleOffer?.dealerId,
                        studioName: sampleOffer?.dealer,
                        marketOffersCount: Object.keys(offerMap).length,
                    };
                }
            }
        };
        fetchOffers();
    }, [serviceability.location, serviceability.status, serviceability.stateCode]);

    useEffect(() => {
        const checkCurrentServiceability = async () => {
            if (typeof window === 'undefined') return;
            const supabase = createClient();

            // Tier 1: Logic Removed (Legacy Aadhaar Pincode causing 404s)

            // ... (rest of serviceability check logic which is usually constant) ...

            // Tier 2: Local Storage
            const cached = localStorage.getItem('bkmb_user_pincode');
            console.log('[Location] Cached data:', cached);
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    if (data.pincode) {
                        console.log('[Location] Using cached pincode:', data.pincode);

                        // Optimistic Update: Unblock UI immediately using cached data
                        setServiceability(prev => ({
                            ...prev,
                            status: 'serviceable',
                            location: data.district || data.pincode,
                            district: data.district,
                            stateCode: data.stateCode || 'MH',
                        }));

                        const result = await checkServiceability(data.pincode);
                        // Construct display location: District ONLY
                        const displayLoc = result.district || result.location || data.pincode;
                        setServiceability({
                            status: result.isServiceable ? 'serviceable' : 'unserviceable',
                            location: displayLoc,
                            district: result.district,
                            stateCode: result.stateCode,
                        });
                        // Allow silent update of details (District/State)
                        localStorage.setItem(
                            'bkmb_user_pincode',
                            JSON.stringify({
                                pincode: data.pincode,
                                taluka: result.location || data.taluka || data.city,
                                district: result.district,
                                state: result.state,
                                stateCode: result.stateCode,
                                manuallySet: false,
                            })
                        );
                        window.dispatchEvent(new Event('locationChanged'));
                        return; // STOP HERE - don't ask for geolocation
                    }
                } catch {
                    localStorage.removeItem('bkmb_user_pincode');
                }
            }
            // Tier 3: Browser Geolocation
            if (navigator.geolocation) {
                console.log('[Location] Requesting geolocation...');
                navigator.geolocation.getCurrentPosition(
                    async position => {
                        const { latitude, longitude } = position.coords;
                        console.log('[Location] Geolocation success:', { latitude, longitude });

                        try {
                            // Use our own database to find nearest pincode - no external APIs!
                            const supabaseClient = createClient();
                            const { data: nearestData, error: nearestError } = await supabaseClient.rpc(
                                'get_nearest_pincode',
                                { p_lat: latitude, p_lon: longitude }
                            );

                            console.log('[Location] Nearest pincode from DB:', nearestData, nearestError);

                            if (nearestData && nearestData.length > 0) {
                                const nearest = nearestData[0];
                                const pincode = nearest.pincode;
                                const stateCode = nearest.rto_code?.substring(0, 2) || 'MH';

                                // Use checkServiceability to verify and get full details
                                const result = await checkServiceability(pincode);
                                console.log('[Location] Serviceability result:', result);

                                const displayLoc = result.district || nearest.district || nearest.taluka || pincode;
                                const userDist = result.district || nearest.district;

                                if (result.isServiceable) {
                                    // User is in serviceable district
                                    setServiceability({
                                        status: 'serviceable',
                                        location: displayLoc,
                                        district: userDist,
                                        stateCode: result.stateCode || stateCode,
                                        userDistrict: userDist,
                                    });
                                } else {
                                    // User in non-serviceable district - find nearest serviceable
                                    console.log('[Location] District not serviceable, finding nearest...');
                                    const { data: nearestServiceable } = await supabaseClient.rpc(
                                        'get_nearest_serviceable_district',
                                        { p_lat: latitude, p_lon: longitude }
                                    );

                                    if (nearestServiceable && nearestServiceable.length > 0) {
                                        const fallback = nearestServiceable[0];
                                        console.log('[Location] Fallback district:', fallback);
                                        setServiceability({
                                            status: 'unserviceable',
                                            location: fallback.district,
                                            district: fallback.district,
                                            stateCode: fallback.state_code?.substring(0, 2) || 'MH',
                                            userDistrict: userDist,
                                            fallbackDistrict: fallback.district,
                                        });
                                    } else {
                                        // No serviceable district found - use Maharashtra fallback
                                        setServiceability({
                                            status: 'unserviceable',
                                            location: 'MAHARASHTRA',
                                            district: 'ALL',
                                            stateCode: 'MH',
                                            userDistrict: userDist,
                                            fallbackDistrict: 'Maharashtra',
                                        });
                                    }
                                }
                                localStorage.setItem(
                                    'bkmb_user_pincode',
                                    JSON.stringify({
                                        pincode,
                                        taluka: result.taluka || nearest.taluka,
                                        district: result.district || nearest.district,
                                        state: result.state || nearest.state,
                                        stateCode: result.stateCode || stateCode,
                                        manuallySet: false,
                                    })
                                );
                                return;
                            }

                            // Fallback if RPC fails - use state-level
                            console.log('[Location] RPC failed, using Maharashtra fallback');
                            setServiceability({
                                status: 'serviceable',
                                location: 'MAHARASHTRA',
                                district: 'ALL',
                                stateCode: 'MH',
                            });
                        } catch (err) {
                            console.error('[Location] DB lookup error:', err);
                            setServiceability({ status: 'unset' });
                        }
                    },
                    err => {
                        console.error('[Location] Geolocation error:', err.code, err.message);
                        // Set unset so user sees the prompt with button
                        setServiceability({ status: 'unset' });
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000, // 10 seconds timeout
                        maximumAge: 300000, // Use cached location if less than 5 min old
                    }
                );
            } else {
                console.log('[Location] Geolocation not available, defaulting to MH');
                setServiceability({ status: 'serviceable', location: 'MAHARASHTRA', district: 'ALL', stateCode: 'MH' });
            }
        };
        checkCurrentServiceability();
    }, []);

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        const selectedMakeSet = new Set(selectedMakes.map(m => m.toUpperCase()));
        const isAllMakesSelected =
            makeOptions.length === 0 || makeOptions.every(m => selectedMakeSet.has(m.toUpperCase()));
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

    // Location Gate - Block catalog until location is fetched
    if (serviceability.status === 'loading' || serviceability.status === 'unset') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-primary to-orange-500 flex items-center justify-center">
                        <MapPin size={40} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Enable Location</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                        We need your location to show accurate prices from dealers in your area. Please allow location
                        access when prompted.
                    </p>
                    {serviceability.status === 'loading' && (
                        <>
                            <div className="flex items-center justify-center gap-2 text-brand-primary">
                                <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm font-bold">Detecting location...</span>
                            </div>
                            <button
                                onClick={() =>
                                    setServiceability({
                                        status: 'serviceable',
                                        location: 'MAHARASHTRA',
                                        district: 'ALL',
                                        stateCode: 'MH',
                                    })
                                }
                                className="mt-4 px-4 py-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white underline"
                            >
                                Skip → Use Maharashtra
                            </button>
                        </>
                    )}
                    {serviceability.status === 'unset' && (
                        <button
                            onClick={() =>
                                setServiceability({
                                    status: 'serviceable',
                                    location: 'MAHARASHTRA',
                                    district: 'ALL',
                                    stateCode: 'MH',
                                })
                            }
                            className="px-6 py-3 bg-brand-primary text-white font-bold rounded-full hover:bg-brand-primary/90 transition-colors"
                        >
                            Continue with Maharashtra
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b0d10] transition-colors duration-500 font-sans">
            <main className="flex-1 mx-auto w-full max-w-[1440px] px-6 pt-8 md:pt-40 pb-10 md:pb-16">
                <header className="hidden md:block sticky top-[var(--header-h)] z-40 mb-12 transition-all duration-300">
                    <div className="w-full">
                        <div className="rounded-3xl bg-slate-50/50 dark:bg-[#0b0d10]/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 shadow-sm px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Desktop Category Chips */}
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
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                                            Sort:
                                        </span>
                                        <select
                                            value={sortBy}
                                            onChange={e => setSortBy(e.target.value as 'popular' | 'price' | 'emi')}
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
                                        className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all ${activeFilterCount > 0
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md'
                                            : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                    >
                                        <SlidersHorizontal size={12} strokeWidth={2.5} />
                                        <span className="hidden sm:inline">Filters</span>
                                        {activeFilterCount > 0 && (
                                            <span className="flex items-center justify-center bg-[#F4B000] text-black w-4 h-4 rounded-full text-[8px]">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                        {/* Results Count Badge - Only show when filters applied */}
                                        {activeFilterCount > 0 && (
                                            <span className="absolute -top-2 -right-2 flex items-center justify-center bg-rose-500 text-white min-w-5 h-5 px-1.5 rounded-full text-[9px] font-black shadow-lg">
                                                {results.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Not Serviceable Banner */}
                {serviceability.status === 'unserviceable' && serviceability.fallbackDistrict && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📍</span>
                            <div className="flex-1">
                                <p className="font-bold text-amber-900 dark:text-amber-200">
                                    Your area ({serviceability.userDistrict}) is not in our delivery zone yet.
                                </p>
                                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                                    Showing prices for{' '}
                                    <span className="font-bold">{serviceability.fallbackDistrict}</span> • You can still
                                    browse & book
                                </p>
                                <p className="mt-1 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                    → Pickup from our{' '}
                                    <span className="font-bold">{serviceability.fallbackDistrict}</span> hub available!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
                                        Clear all filters
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
                            {results.map(v => {
                                // Aggregate best offer from all SKUs in this variant (exclude AUMS)
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const bestVariantOffer = v.skuIds?.reduce((best: any, skuId: string) => {
                                    const offer = marketOffers[skuId];
                                    if (!offer) return best;
                                    if (offer.dealerId === AUMS_DEALER_ID || offer.dealer?.toUpperCase() === 'AUMS') {
                                        return best;
                                    }
                                    const offerDelta = offer.price + (offer.bundlePrice || 0);
                                    const bestDelta = best ? best.price + (best.bundlePrice || 0) : null;
                                    if (!best || (bestDelta !== null && offerDelta < bestDelta)) return offer;
                                    if (!best && offerDelta !== null) return offer;
                                    return best;
                                }, null);

                                return (
                                    <ProductCard
                                        key={v.id}
                                        v={v}
                                        viewMode={viewMode}
                                        downpayment={downpayment}
                                        tenure={tenure}
                                        serviceability={serviceability}
                                        onLocationClick={() => setIsLocationPickerOpen(true)}
                                        isTv={isTv}
                                        bestOffer={bestVariantOffer || undefined}
                                        leadId={leadId}
                                    />
                                );
                            })}
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
                        location: result.district || result.location || taluka,
                        district: result.district,
                        stateCode: result.stateCode,
                    });

                    localStorage.setItem(
                        'bkmb_user_pincode',
                        JSON.stringify({
                            pincode,
                            taluka: result.location || taluka,
                            lat,
                            lng,
                            manuallySet: true,
                        })
                    );

                    toast.success(
                        `Prices updated for ${result.location || taluka}${dist ? ` (${Math.round(dist)}km)` : ''}`
                    );
                }}
            />
        </div>
    );
};
