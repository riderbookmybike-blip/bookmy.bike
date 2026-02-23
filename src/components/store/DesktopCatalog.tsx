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
    Bluetooth,
    ArrowRight,
    Menu,
    Sparkles,
    SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { checkServiceability } from '@/actions/serviceArea';
import Link from 'next/link';
import { buildProductUrl, buildVariantExplorerUrl } from '@/lib/utils/urlHelper';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import { groupProductsByModel } from '@/utils/variantGrouping';
import { formatPriceLabel } from '@/utils/formatVehicleSpec';

import { BRANDS as defaultBrands } from '@/config/market';
import type { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { getStableReviewCount } from '@/utils/vehicleUtils';
import type { ProductVariant } from '@/types/productMaster';
import { createClient } from '@/lib/supabase/client';
import { resolveLocation } from '@/utils/locationResolver';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { LocationPicker } from './LocationPicker';
import { calculateDistance, HUB_LOCATION, MAX_SERVICEABLE_DISTANCE_KM } from '@/utils/geoUtils';
import { setLocationCookie } from '@/actions/locationCookie';
import { ProductCard } from './desktop/ProductCard';
import { CompareTray, type CompareItem } from './CompareTray';
import { CompactProductCard } from './mobile/CompactProductCard';
import { MobileFilterDrawer } from './mobile/MobileFilterDrawer';
import { useOClubWallet } from '@/hooks/useOClubWallet';
import { CatalogGridSkeleton } from './CatalogSkeleton';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getSelfMemberLocation, updateSelfMemberLocation } from '@/actions/members';
import { resolveIpLocation } from '@/actions/resolveIpLocation';

type CatalogFilters = ReturnType<typeof useCatalogFilters>;

interface DesktopCatalogProps {
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
    items = [],
    isLoading: externalLoading = false,
    leadId,
    basePath = '/store',
    mode = 'default',
    needsLocation = false,
    resolvedDealerId = null,
    resolvedStudioId = null,
    resolvedDealerName = null,
}: DesktopCatalogProps) => {
    // Prefer client-resolved items when available, otherwise SSR
    const isLoading = externalLoading;
    const router = useRouter();
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';

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
        showOClubOnly,
        setShowOClubOnly,
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
    const isSmart = mode === 'smart';
    const [sortBy] = useState<'popular' | 'price' | 'emi'>('popular');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isEmiOpen, setIsEmiOpen] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Compare state
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

    // Downpayment edit popover
    const [isDpEditOpen, setIsDpEditOpen] = useState(false);
    const [dpDraft, setDpDraft] = useState(downpayment);
    const openDpEdit = () => {
        setDpDraft(downpayment);
        setIsDpEditOpen(true);
    };
    const applyDp = (val: number) => {
        setDownpayment(val);
        setIsDpEditOpen(false);
        toast.success(`Downpayment updated to ₹${val.toLocaleString('en-IN')}`);
    };

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
    const seatHeightOptions = ['< 780mm', '780-810mm', '> 810mm'] as const;
    const weightOptions = ['< 110kg', '110-140kg', '> 140kg'] as const;
    const selectedMakeSet = new Set(selectedMakes.map(m => m.toUpperCase()));
    const allBrandSelected = makeOptions.length > 0 && makeOptions.every(m => selectedMakeSet.has(m.toUpperCase()));

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

    useEffect(() => {
        const checkCurrentServiceability = async () => {
            if (typeof window === 'undefined') return;
            const supabase = createClient();
            const applyIpFallback = async () => {
                try {
                    const ipLocation = await resolveIpLocation();
                    if (ipLocation.stateCode) {
                        const payload = {
                            stateCode: ipLocation.stateCode,
                            district: ipLocation.district || 'ALL',
                            manuallySet: false,
                            source: 'IP',
                        };
                        setServiceability({
                            status: 'serviceable',
                            location: payload.district,
                            district: payload.district,
                            stateCode: payload.stateCode,
                        });
                        localStorage.setItem('bkmb_user_pincode', JSON.stringify(payload));
                        try {
                            await setLocationCookie(payload);
                        } catch (err) {
                            console.error('[Location] Cookie set failed:', err);
                        }
                        window.dispatchEvent(new Event('locationChanged'));
                        return true;
                    }
                } catch (err) {
                    console.error('[Location] IP fallback failed:', err);
                }
                return false;
            };

            // Tier 1: Logic Removed (Legacy Aadhaar Pincode causing 404s)

            // ... (rest of serviceability check logic which is usually constant) ...

            let cachedData: any = null;
            const cached = localStorage.getItem('bkmb_user_pincode');
            // console.log('[Location] Cached data:', cached);
            if (cached) {
                try {
                    cachedData = JSON.parse(cached);
                } catch {
                    localStorage.removeItem('bkmb_user_pincode');
                    cachedData = null;
                }
            }

            // Tier 1.5: Logged-in Profile (skip if user explicitly set location)
            if (!cachedData?.manuallySet) {
                let member: any = null;
                try {
                    member = await getSelfMemberLocation();
                } catch (err) {
                    console.error('[Location] Profile fetch failed:', err);
                }
                if (member?.pincode) {
                    // console.log('[Location] Using profile pincode:', member.pincode);

                    const resolved = await resolveLocation(member.pincode);
                    const result = await checkServiceability(member.pincode);

                    const payload = {
                        pincode: member.pincode,
                        taluka: resolved?.taluka || member.taluka || result.taluka || result.location || '',
                        district: resolved?.district || member.district || result.district || undefined,
                        state: resolved?.state || member.state || result.state || undefined,
                        stateCode: result.stateCode || undefined,
                        lat: resolved?.lat ?? member.latitude ?? null,
                        lng: resolved?.lng ?? member.longitude ?? null,
                        manuallySet: false,
                        source: 'PROFILE',
                    };

                    // Optimistic Update: Unblock UI immediately using profile data
                    setServiceability(prev => ({
                        ...prev,
                        status: 'serviceable',
                        location: payload.district || payload.pincode || '',
                        district: payload.district || undefined,
                        stateCode: payload.stateCode || 'MH',
                    }));

                    const displayLoc = result.district || result.location || payload.pincode;
                    setServiceability({
                        status: result.isServiceable ? 'serviceable' : 'unserviceable',
                        location: displayLoc,
                        district: result.district || payload.district || undefined,
                        stateCode: result.stateCode,
                    });

                    localStorage.setItem('bkmb_user_pincode', JSON.stringify(payload));
                    try {
                        await setLocationCookie({
                            pincode: payload.pincode,
                            taluka: payload.taluka,
                            district: payload.district,
                            state: payload.state,
                            stateCode: payload.stateCode,
                            lat: payload.lat,
                            lng: payload.lng,
                        });
                    } catch (err) {
                        console.error('[Location] Cookie set failed:', err);
                    }
                    window.dispatchEvent(new Event('locationChanged'));

                    // Persist back to profile if missing data
                    if (!member.district || !member.taluka || !member.state || !member.latitude || !member.longitude) {
                        try {
                            await updateSelfMemberLocation({
                                pincode: payload.pincode,
                                district: payload.district || null,
                                taluka: payload.taluka || null,
                                state: payload.state || null,
                                latitude: payload.lat,
                                longitude: payload.lng,
                            });
                        } catch (err) {
                            console.error('[Location] Profile update failed:', err);
                        }
                    }

                    return; // STOP HERE - don't ask for geolocation
                }
            }

            // Tier 2: Local Storage
            if (cachedData?.pincode) {
                // console.log('[Location] Using cached pincode:', cachedData.pincode);

                // Optimistic Update: Unblock UI immediately using cached data
                setServiceability(prev => ({
                    ...prev,
                    status: 'serviceable',
                    location: cachedData.district || cachedData.pincode || '',
                    district: cachedData.district || undefined,
                    stateCode: cachedData.stateCode || 'MH',
                }));

                const result = await checkServiceability(cachedData.pincode);
                // Construct display location: District ONLY
                const displayLoc = result.district || result.location || cachedData.pincode;
                setServiceability({
                    status: result.isServiceable ? 'serviceable' : 'unserviceable',
                    location: displayLoc,
                    district: result.district || undefined,
                    stateCode: result.stateCode,
                });
                // Allow silent update of details (District/State)
                const updated = {
                    pincode: cachedData.pincode,
                    taluka: result.location || cachedData.taluka || cachedData.city,
                    district: result.district,
                    state: result.state,
                    stateCode: result.stateCode,
                    manuallySet: Boolean(cachedData.manuallySet),
                };
                localStorage.setItem('bkmb_user_pincode', JSON.stringify(updated));
                try {
                    await setLocationCookie({
                        pincode: updated.pincode,
                        taluka: updated.taluka,
                        district: updated.district,
                        state: updated.state,
                        stateCode: updated.stateCode,
                        lat: cachedData.lat,
                        lng: cachedData.lng,
                    });
                } catch (err) {
                    console.error('[Location] Cookie set failed:', err);
                }
                window.dispatchEvent(new Event('locationChanged'));
                return; // STOP HERE - don't ask for geolocation
            }
            // Tier 3: Browser Geolocation
            if (navigator.geolocation) {
                // console.log('[Location] Requesting geolocation...');
                navigator.geolocation.getCurrentPosition(
                    async position => {
                        const { latitude, longitude } = position.coords;
                        // console.log('[Location] Geolocation success:', { latitude, longitude });

                        try {
                            // Use our own database to find nearest pincode - no external APIs!
                            const supabaseClient = createClient();
                            const { data: nearestData, error: nearestError } = await supabaseClient.rpc(
                                'get_nearest_pincode',
                                { p_lat: latitude, p_lon: longitude }
                            );

                            // console.log('[Location] Nearest pincode from DB:', nearestData, nearestError);

                            if (nearestData && nearestData.length > 0) {
                                const nearest = nearestData[0];
                                const pincode = nearest.pincode;
                                const stateCode = nearest.rto_code?.substring(0, 2) || 'MH';

                                // Use checkServiceability to verify and get full details
                                const result = await checkServiceability(pincode);
                                // console.log('[Location] Serviceability result:', result);

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
                                    const payload = {
                                        pincode,
                                        taluka: nearest.taluka || '',
                                        district: userDist,
                                        state: result.state || null,
                                        stateCode: result.stateCode || stateCode,
                                        lat: latitude,
                                        lng: longitude,
                                        manuallySet: false,
                                    };
                                    localStorage.setItem('bkmb_user_pincode', JSON.stringify(payload));
                                    try {
                                        await setLocationCookie(payload);
                                    } catch (err) {
                                        console.error('[Location] Cookie set failed:', err);
                                    }
                                    window.dispatchEvent(new Event('locationChanged'));
                                    try {
                                        await updateSelfMemberLocation({
                                            pincode,
                                            district: userDist || null,
                                            taluka: nearest.taluka || null,
                                            state: result.state || null,
                                            latitude,
                                            longitude,
                                        });
                                    } catch (err) {
                                        console.error('[Location] Profile update failed:', err);
                                    }
                                } else {
                                    // User in non-serviceable district - find nearest serviceable
                                    // console.log('[Location] District not serviceable, finding nearest...');
                                    const { data: nearestServiceable } = await supabaseClient.rpc(
                                        'get_nearest_serviceable_district',
                                        { p_lat: latitude, p_lon: longitude }
                                    );

                                    if (nearestServiceable && nearestServiceable.length > 0) {
                                        const fallback = nearestServiceable[0];
                                        // console.log('[Location] Fallback district:', fallback);
                                        setServiceability({
                                            status: 'unserviceable',
                                            location: fallback.district,
                                            district: fallback.district,
                                            stateCode: fallback.state_code?.substring(0, 2) || 'MH',
                                            userDistrict: userDist,
                                            fallbackDistrict: fallback.district,
                                        });
                                        const payload = {
                                            pincode,
                                            taluka: nearest.taluka || '',
                                            district: userDist,
                                            state: result.state || null,
                                            stateCode: result.stateCode || stateCode,
                                            lat: latitude,
                                            lng: longitude,
                                            manuallySet: false,
                                        };
                                        localStorage.setItem('bkmb_user_pincode', JSON.stringify(payload));
                                        try {
                                            await setLocationCookie(payload);
                                        } catch (err) {
                                            console.error('[Location] Cookie set failed:', err);
                                        }
                                        window.dispatchEvent(new Event('locationChanged'));
                                        try {
                                            await updateSelfMemberLocation({
                                                pincode,
                                                district: userDist || null,
                                                taluka: nearest.taluka || null,
                                                state: result.state || null,
                                                latitude,
                                                longitude,
                                            });
                                        } catch (err) {
                                            console.error('[Location] Profile update failed:', err);
                                        }
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
                                return;
                            }

                            // Fallback if RPC fails - use state-level
                            // console.log('[Location] RPC failed, using Maharashtra fallback');
                            setServiceability({
                                status: 'serviceable',
                                location: 'MAHARASHTRA',
                                district: 'ALL',
                                stateCode: 'MH',
                            });
                        } catch (err) {
                            console.error('[Location] DB lookup error:', err);
                            const resolvedByIp = await applyIpFallback();
                            if (!resolvedByIp) {
                                setServiceability({ status: 'unset' });
                                setIsLocationPickerOpen(true);
                            }
                        }
                    },
                    async err => {
                        console.error('[Location] Geolocation error:', err.code, err.message);
                        const resolvedByIp = await applyIpFallback();
                        if (!resolvedByIp) {
                            setServiceability({ status: 'unset' });
                            setIsLocationPickerOpen(true);
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000, // 10 seconds timeout
                        maximumAge: 300000, // Use cached location if less than 5 min old
                    }
                );
            } else {
                // console.log('[Location] Geolocation not available, trying IP fallback');
                const resolvedByIp = await applyIpFallback();
                if (!resolvedByIp) {
                    setServiceability({ status: 'unset' });
                    setIsLocationPickerOpen(true);
                }
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
        if (selectedWeights.length > 0) count++;
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
        selectedWeights.length,
        maxPrice,
        maxEMI,
    ]);

    // Mobile filter drawer state (separate from desktop mega filter)
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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
        {
            title: 'Finish',
            options: [...finishOptions],
            selected: selectedFinishes,
            onToggle: (v: string) => toggleFilter(setSelectedFinishes, v),
            onReset: () => setSelectedFinishes([]),
        },
    ];

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

    // Phone search overlay
    const [phoneSearchOpen, setPhoneSearchOpen] = useState(false);
    const phoneSearchRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        const handler = () => {
            setPhoneSearchOpen(prev => {
                const next = !prev;
                if (next) setTimeout(() => phoneSearchRef.current?.focus(), 150);
                return next;
            });
        };
        window.addEventListener('toggleCatalogSearch', handler);
        return () => window.removeEventListener('toggleCatalogSearch', handler);
    }, []);

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
            <div className="space-y-4">
                <div
                    className="flex items-center justify-between border-b border-slate-200 pb-2 cursor-pointer group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                        <div
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${selectedValues.length > 0 ? 'bg-brand-primary shadow-[0_0_12px_#F4B000]' : 'bg-slate-300'}`}
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
                                className="text-[9px] font-black uppercase text-brand-primary hover:text-slate-900 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                        <ChevronDown
                            size={12}
                            className={`text-slate-400 transition-transform duration-500 ${isCollapsed ? '-rotate-90' : 'rotate-0'} group-hover:text-brand-primary`}
                        />
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-2">
                            {visibleOptions.map((opt: string) => (
                                <button
                                    key={opt}
                                    onClick={() => onToggle(opt)}
                                    className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                                        selectedValues.includes(opt)
                                            ? 'bg-brand-primary/10 border-brand-primary/50 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <span
                                        className={`text-[9px] font-black uppercase tracking-widest italic transition-colors ${selectedValues.includes(opt) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800'}`}
                                    >
                                        {opt}
                                    </span>
                                    {selectedValues.includes(opt) && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_#F4B000]" />
                                    )}
                                </button>
                            ))}
                        </div>
                        {options.length > 3 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full py-2 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-primary transition-colors border border-dashed border-slate-200 rounded-xl"
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
        if (sortBy === 'popular') {
            vehicles.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
        }
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

    const [smartModel, setSmartModel] = useState<string | null>(null);
    const [smartVariant, setSmartVariant] = useState<string | null>(null);
    const [smartColor, setSmartColor] = useState<string | null>(null);
    const [explodedVariant, setExplodedVariant] = useState<string | null>(null);
    const { availableCoins, isLoggedIn } = useOClubWallet();

    useEffect(() => {
        if (!isSmart) return;
        if (!searchQuery) {
            setSmartModel(null);
            setSmartVariant(null);
            setSmartColor(null);
            setExplodedVariant(null);
        }
    }, [isSmart, searchQuery]);

    const normalize = (value?: string) => (value || '').toLowerCase().trim();

    const resultsForQuery = useMemo(() => {
        const query = normalize(searchQuery);
        if (!query) return [];
        return results.filter(v => {
            const makeMatch = normalize(v.make).includes(query);
            const modelMatch = normalize(v.model).includes(query);
            const variantMatch = normalize(v.variant).includes(query);
            return makeMatch || modelMatch || variantMatch;
        });
    }, [results, searchQuery]);

    const modelCounts = useMemo(() => {
        const map = new Map<string, number>();
        const source = resultsForQuery.length > 0 ? resultsForQuery : [];
        source.forEach(v => {
            const key = v.model;
            map.set(key, (map.get(key) || 0) + 1);
        });
        return map;
    }, [resultsForQuery]);

    const modelOptions = useMemo(() => {
        const query = normalize(searchQuery);
        if (!query) return [];
        return Array.from(modelCounts.keys()).slice(0, 8);
    }, [modelCounts, searchQuery]);

    useEffect(() => {
        if (!isSmart) return;
        const query = normalize(searchQuery);
        if (!query) return;
        const exactMatches = resultsForQuery.filter(v => normalize(v.model) === query);
        const uniqueModels = Array.from(new Set(exactMatches.map(v => v.model)));
        if (uniqueModels.length === 1) {
            const model = uniqueModels[0];
            if (smartModel !== model) {
                setSmartModel(model);
                setSmartVariant(null);
                setSmartColor(null);
                setExplodedVariant(null);
            }
        } else if (uniqueModels.length === 0) {
            setSmartModel(null);
            setSmartVariant(null);
            setSmartColor(null);
            setExplodedVariant(null);
        }
    }, [isSmart, resultsForQuery, searchQuery, smartModel]);

    const variantOptions = useMemo(() => {
        if (!smartModel) return [];
        const map = new Map<string, number>();
        results
            .filter(v => normalize(v.model) === normalize(smartModel))
            .forEach(v => {
                map.set(v.variant, (map.get(v.variant) || 0) + 1);
            });
        return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    }, [results, smartModel]);

    const colorOptions = useMemo(() => {
        if (!smartModel || !smartVariant) return [];
        const map = new Map<string, { name: string; hex?: string; finish?: string; count: number }>();
        results
            .filter(
                v => normalize(v.model) === normalize(smartModel) && normalize(v.variant) === normalize(smartVariant)
            )
            .forEach(v => {
                v.availableColors?.forEach(c => {
                    const key = c.name;
                    const existing = map.get(key);
                    if (existing) {
                        existing.count += 1;
                    } else {
                        map.set(key, { name: c.name, hex: c.hexCode, finish: c.finish, count: 1 });
                    }
                });
            });
        return Array.from(map.values());
    }, [results, smartModel, smartVariant]);

    const smartFilteredResults = useMemo(() => {
        if (!isSmart) return results;
        let next = results;
        if (smartModel) {
            next = next.filter(v => normalize(v.model) === normalize(smartModel));
        }
        if (smartVariant) {
            next = next.filter(v => normalize(v.variant) === normalize(smartVariant));
        }
        return next;
    }, [isSmart, results, smartModel, smartVariant]);

    const displayResults = useMemo(() => {
        if (!isSmart) return results;
        if (explodedVariant) {
            const explodedOnly = smartFilteredResults.filter(
                v => `${v.make}::${v.model}::${v.variant}` === explodedVariant
            );
            return explodedOnly.flatMap(v => {
                const colors = Array.isArray(v.availableColors) ? v.availableColors : [];
                const filteredColors = smartColor
                    ? colors.filter(c => normalize(c.name) === normalize(smartColor))
                    : colors;
                if (filteredColors.length === 0) return [v];
                return filteredColors.map(color => ({
                    ...v,
                    color: color.name,
                    imageUrl: color.imageUrl || v.imageUrl,
                    zoomFactor: color.zoomFactor ?? v.zoomFactor,
                    isFlipped: color.isFlipped ?? v.isFlipped,
                    offsetX: color.offsetX ?? v.offsetX,
                    offsetY: color.offsetY ?? v.offsetY,
                    availableColors: [color, ...colors.filter(c => c.id !== color.id)],
                }));
            });
        }
        return smartFilteredResults;
    }, [isSmart, results, smartFilteredResults, smartColor, explodedVariant]);

    // Group displayResults by model — show only cheapest variant per model family
    const groupedDisplayResults = useMemo(() => {
        const groups = groupProductsByModel(displayResults);
        return groups.map(group => {
            // Sort by exShowroom price (ascending) and pick cheapest
            const sorted = [...group.variants].sort((a, b) => (a.price?.exShowroom || 0) - (b.price?.exShowroom || 0));
            return {
                representative: sorted[0],
                variantCount: group.variants.length,
                make: group.make,
                model: group.model,
                modelSlug: group.modelSlug,
            };
        });
    }, [displayResults]);

    // Location gate: catalog stays in DOM for SEO, but overlaid with modal when location missing
    const showLocationGate = needsLocation || serviceability.status === 'unset';

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 transition-colors duration-500 font-sans relative">
            {/* Location Gate — SEO-safe: catalog HTML stays in DOM, overlay blocks interaction */}
            {showLocationGate && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center">
                    {/* Backdrop blur */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
                    {/* Modal */}
                    <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl border border-white/20 bg-white shadow-2xl p-8 text-center space-y-5">
                        <div className="mx-auto w-14 h-14 rounded-full bg-[#F4B000]/15 flex items-center justify-center">
                            <MapPin size={28} className="text-[#F4B000]" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">Location Required</h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Nearest dealership aur accurate pricing ke liye aapki location zaroori hai.
                            <br />
                            <span className="text-xs text-slate-400">GPS allow karein ya pincode enter karein.</span>
                        </p>
                        <button
                            onClick={() => setIsLocationPickerOpen(true)}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F4B000] px-6 py-3.5 text-sm font-black text-black uppercase tracking-widest shadow-lg shadow-[#F4B000]/20 hover:scale-[1.02] transition-all"
                        >
                            <MapPin size={16} />
                            Set Location
                        </button>
                    </div>
                </div>
            )}
            <div
                className={`flex-1 page-container ${isPhone ? 'pt-6' : 'pt-0'} pb-10 md:pb-16 ${showLocationGate ? 'pointer-events-none select-none' : ''}`}
            >
                <header
                    className="hidden md:block sticky z-[90] py-0 mb-4 transition-all duration-300"
                    style={{ top: 'var(--header-h)', marginTop: '16px' }}
                >
                    <div className="w-full">
                        <div className="rounded-full bg-slate-50/15 backdrop-blur-3xl border border-slate-200 shadow-2xl h-14 px-4 flex items-center">
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 border border-slate-200 text-slate-600 hover:text-slate-900 shrink-0"
                                >
                                    <Menu size={16} />
                                </button>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 w-full bg-white/70 border border-slate-200 rounded-full px-4 py-2 h-10">
                                        <Search size={14} className="text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search brand, product, variant"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent text-[11px] font-black tracking-widest uppercase focus:outline-none placeholder:text-slate-300"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="flex items-center text-slate-400 hover:text-slate-900"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        {explodedVariant && (
                                            <button
                                                onClick={() => setExplodedVariant(null)}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-600"
                                                title="Collapse Colors"
                                            >
                                                Collapse Colors
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isSmart && !smartModel && (
                                    <div className="flex-none flex items-center justify-end gap-2 overflow-x-auto no-scrollbar max-w-[50%]">
                                        <div className="flex items-center gap-2">
                                            {modelOptions.map(model => (
                                                <button
                                                    key={`model-${model}`}
                                                    onClick={() => {
                                                        setSmartModel(model);
                                                        setSmartVariant(null);
                                                        setSmartColor(null);
                                                        setSearchQuery(model);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-700 hover:border-brand-primary/40 hover:text-brand-primary transition-all whitespace-nowrap"
                                                >
                                                    {model}
                                                    <span className="text-slate-400">•</span>
                                                    <span className="text-brand-primary">
                                                        {modelCounts.get(model) || 0}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isSmart && smartModel && (
                                    <div className="flex-none flex items-center justify-end gap-2 overflow-x-auto no-scrollbar max-w-[50%]">
                                        <div className="flex items-center gap-2">
                                            {!smartVariant && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSmartModel(null);
                                                            setSmartVariant(null);
                                                            setSmartColor(null);
                                                            setSearchQuery('');
                                                        }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-700 whitespace-nowrap"
                                                    >
                                                        {smartModel}
                                                        <X size={10} />
                                                    </button>
                                                    {variantOptions.map(v => (
                                                        <button
                                                            key={`variant-${v.name}`}
                                                            onClick={() => {
                                                                setSmartVariant(v.name);
                                                                setSmartColor(null);
                                                            }}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-700 hover:border-brand-primary/40 hover:text-brand-primary transition-all whitespace-nowrap"
                                                        >
                                                            {v.name}
                                                            <span className="text-slate-400">•</span>
                                                            <span className="text-brand-primary">{v.count}</span>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {smartVariant && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSmartVariant(null);
                                                            setSmartColor(null);
                                                        }}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-700 whitespace-nowrap"
                                                    >
                                                        {smartVariant}
                                                        <X size={10} />
                                                    </button>
                                                    {colorOptions.map(c => (
                                                        <button
                                                            key={`color-${c.name}`}
                                                            onClick={() => {
                                                                setSmartColor(c.name);
                                                            }}
                                                            className={`w-5 h-5 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.12)],255,255,0.15)] relative hover:scale-110 transition-all duration-300 cursor-pointer overflow-hidden shrink-0 ${
                                                                normalize(smartColor || undefined) === normalize(c.name)
                                                                    ? 'ring-2 ring-brand-primary/40'
                                                                    : ''
                                                            }`}
                                                            style={{ background: c.hex || '#999' }}
                                                            title={`${c.name}${c.finish ? ` (${c.finish})` : ''}`}
                                                        >
                                                            {c.finish?.toUpperCase() === 'GLOSSY' && (
                                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-white/20 pointer-events-none" />
                                                            )}
                                                            {c.finish?.toUpperCase() === 'MATTE' && (
                                                                <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] pointer-events-none" />
                                                            )}
                                                        </button>
                                                    ))}
                                                    {smartColor && (
                                                        <button
                                                            onClick={() => setSmartColor(null)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap"
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div
                    className="md:hidden sticky z-[90] py-3 mb-4 bg-slate-50/80 backdrop-blur-2xl border-b border-slate-200/60"
                    style={{ top: 'var(--header-h)' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200">
                            <Search size={14} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search brand, product, variant"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-[11px] font-black tracking-widest uppercase focus:outline-none placeholder:text-slate-300"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="flex items-center text-slate-400 hover:text-slate-900"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Phone Search Overlay */}
                <AnimatePresence>
                    {isPhone && phoneSearchOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="sticky z-[91] mb-4"
                            style={{ top: 'var(--header-h)' }}
                        >
                            <div className="flex items-center gap-2 px-4 py-3 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 mx-1">
                                <Search size={16} className="text-[#FFD700] shrink-0" />
                                <input
                                    ref={phoneSearchRef}
                                    type="text"
                                    placeholder="Search brand, product, variant..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent text-sm font-bold text-white focus:outline-none placeholder:text-slate-500"
                                />
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setPhoneSearchOpen(false);
                                    }}
                                    className="text-slate-400 active:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Not Serviceable Banner */}
                {serviceability.status === 'unserviceable' && serviceability.fallbackDistrict && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📍</span>
                            <div className="flex-1">
                                <p className="font-bold text-amber-900">
                                    Your area ({serviceability.userDistrict}) is not in our delivery zone yet.
                                </p>
                                <p className="mt-1 text-sm text-amber-800">
                                    Showing prices for{' '}
                                    <span className="font-bold">{serviceability.fallbackDistrict}</span> • You can still
                                    browse & book
                                </p>
                                <p className="mt-1 text-sm text-amber-700 flex items-center gap-1">
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
                        <aside
                            className="hidden xl:block w-80 flex-shrink-0 space-y-6 sticky self-start pt-2 transition-all animate-in fade-in slide-in-from-left-4"
                            style={{ top: 'calc(var(--header-h) + 24px)' }}
                        >
                            <div className="flex flex-col gap-8 p-6 bg-white/60 border border-slate-200/60 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
                                {/* EMI Calculator Accordion */}
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setIsEmiOpen(!isEmiOpen)}
                                        className="w-full flex items-center justify-between group"
                                    >
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-brand-primary shadow-[0_0_8px_#F4B000]" />
                                            EMI Calculator
                                        </h4>
                                        <ChevronDown
                                            size={14}
                                            className={`text-slate-400 transition-transform duration-300 ${isEmiOpen ? 'rotate-180' : 'rotate-0'} group-hover:text-brand-primary`}
                                        />
                                    </button>

                                    {isEmiOpen && (
                                        <div className="space-y-6 p-5 bg-slate-50 border border-slate-100 rounded-3xl animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
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
                                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 slider-thumb-black"
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
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
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
                                                                className={`py-3 rounded-2xl text-[10px] font-black transition-all duration-300 ${
                                                                    tenure === t
                                                                        ? 'bg-slate-900 text-white shadow-lg scale-105 ring-2 ring-brand-primary/20'
                                                                        : 'bg-white/50 text-slate-400 hover:text-slate-600 hover:bg-white shadow-sm'
                                                                }`}
                                                            >
                                                                {t.toString().padStart(2, '0')}
                                                            </button>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Budget & EMI Filters nested in Calculator */}
                                            <div className="space-y-6 pt-4 border-t border-slate-200/50">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                            Max On-Road Price
                                                        </span>
                                                        <span className="text-sm font-black text-slate-900 italic">
                                                            {maxPrice >= 1000000 ? 'Any' : formatPriceLabel(maxPrice)}
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
                                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 slider-thumb-black"
                                                            style={{
                                                                background: `linear-gradient(to right, #F4B000 0%, #F4B000 ${((maxPrice - 50000) / (1000000 - 50000)) * 100}%, ${typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} ${((maxPrice - 50000) / (1000000 - 50000)) * 100}%, ${typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} 100%)`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
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
                                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 slider-thumb-black"
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
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-14 pr-4 text-[11px] font-black tracking-widest uppercase focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all placeholder:text-slate-300 shadow-sm"
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
                                        options={['MATTE', 'GLOSS']}
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
                    <div className="flex-1 space-y-6">
                        <div
                            className={`grid ${
                                viewMode === 'list'
                                    ? 'grid-cols-1 w-full gap-6'
                                    : isPhone
                                      ? 'grid-cols-1 gap-4 w-full'
                                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'
                            }`}
                        >
                            {/* Results Grid */}
                            {groupedDisplayResults.map((group, idx) => {
                                const v = group.representative;
                                const key = `${v.id}-${(v as any).color || v.imageUrl || idx}`;

                                return (
                                    <ProductCard
                                        key={key}
                                        v={v}
                                        viewMode={viewMode}
                                        downpayment={downpayment}
                                        tenure={tenure}
                                        serviceability={serviceability}
                                        onLocationClick={() => setIsLocationPickerOpen(true)}
                                        isTv={isTv}
                                        leadId={leadId}
                                        fallbackDealerId={resolvedDealerId}
                                        walletCoins={isLoggedIn ? availableCoins : null}
                                        showOClubPrompt={!isLoggedIn}
                                        showBcoinBadge={isLoggedIn}
                                        variantCount={group.variantCount}
                                        onCompare={() =>
                                            toggleCompare({
                                                make: group.make,
                                                model: group.model,
                                                modelSlug: group.modelSlug,
                                                imageUrl: v.imageUrl || '',
                                            })
                                        }
                                        isInCompare={compareItems.some(c => c.modelSlug === group.modelSlug)}
                                        onEditDownpayment={openDpEdit}
                                        onExplore={
                                            group.variantCount > 1
                                                ? () => {
                                                      const url = buildVariantExplorerUrl(group.make, group.model);
                                                      router.push(url);
                                                  }
                                                : undefined
                                        }
                                        onExplodeColors={
                                            isSmart
                                                ? () => {
                                                      const key = `${v.make}::${v.model}::${v.variant}`;
                                                      setExplodedVariant(prev => (prev === key ? null : key));
                                                  }
                                                : undefined
                                        }
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Floating Filter FAB — Phone Only */}
                {isPhone && !isMobileFilterOpen && (
                    <button
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="fixed z-[50] w-11 h-11 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-lg flex items-center justify-center text-[#FFD700] active:scale-90 transition-all"
                        style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 12px)', right: '12px' }}
                    >
                        <SlidersHorizontal size={18} strokeWidth={2.5} />
                    </button>
                )}

                {/* Mega Filter Overlay (Grid View Only) */}
                {isFilterOpen && viewMode === 'grid' ? (
                    <div
                        className="fixed inset-x-0 bottom-0 md:bottom-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-slate-200 flex flex-col animate-in fade-in duration-300 h-[85svh] md:h-auto rounded-t-3xl md:rounded-none pb-[env(safe-area-inset-bottom)]"
                        style={{ top: 'var(--header-h)' }}
                    >
                        <div className="page-container flex flex-col h-full">
                            {/* Overlay Header */}
                            <div className="flex-shrink-0 py-5 md:py-8 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-widest italic uppercase">
                                        Customize
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                        Refine by brand, engine & fuel
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={clearAll}
                                        className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="p-3 hover:bg-slate-100 rounded-full transition-all"
                                    >
                                        <X size={22} className="text-slate-900" />
                                    </button>
                                </div>
                            </div>

                            {/* Overlay Content */}
                            <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: EMI & Search */}
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                                Finance Settings
                                            </h4>
                                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem]">
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                Downpayment
                                                            </span>
                                                            <span className="text-lg font-black text-[#F4B000]">
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
                                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#F4B000]"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Tenure (Months)
                                                        </span>
                                                        <div className="grid grid-cols-6 gap-2">
                                                            {[12, 18, 24, 30, 36, 42, 48, 54, 60].map(t => (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => setTenure(t)}
                                                                    className={`py-2.5 rounded-xl text-[9px] font-black transition-all ${tenure === t ? 'bg-[#F4B000] text-black shadow-lg scale-105' : 'bg-white border border-slate-200 text-slate-500'}`}
                                                                >
                                                                    {t}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                                Search
                                            </h4>
                                            <div className="relative">
                                                <Search
                                                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                                                    size={16}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="SEARCH FOR BIKES..."
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    className="w-full py-4 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#F4B000]/20 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                                Special Filters
                                            </h4>
                                            <button
                                                onClick={() => setShowOClubOnly(!showOClubOnly)}
                                                className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${showOClubOnly ? 'bg-[#F4B000]/10 border-[#F4B000]/30 shadow-lg shadow-[#F4B000]/5' : 'bg-slate-50 border-slate-200'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${showOClubOnly ? 'bg-[#F4B000] text-black' : 'bg-white text-slate-400'}`}
                                                    >
                                                        <Sparkles size={20} />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="block text-xs font-black uppercase tracking-widest text-slate-900">
                                                            O'Circle Premium
                                                        </span>
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                            Exclusive O-Circle Offers
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`w-10 h-6 rounded-full relative transition-colors ${showOClubOnly ? 'bg-[#F4B000]' : 'bg-slate-200'}`}
                                                >
                                                    <div
                                                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showOClubOnly ? 'left-5' : 'left-1'}`}
                                                    />
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right Column: Filters */}
                                    <div className="space-y-8">
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
                                            options={[...brakeOptions]}
                                            selectedValues={selectedBrakes}
                                            onToggle={(v: string) => toggleFilter(setSelectedBrakes, v)}
                                            onReset={() => setSelectedBrakes([])}
                                            showReset
                                        />
                                        <FilterGroup
                                            title="Finish"
                                            options={['MATTE', 'GLOSS']}
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
                                        <FilterGroup
                                            title="Weight"
                                            options={[...weightOptions]}
                                            selectedValues={selectedWeights}
                                            onToggle={(v: string) => toggleFilter(setSelectedWeights, v)}
                                            onReset={() => setSelectedWeights([])}
                                            showReset
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Overlay Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <button
                                    onClick={clearAll}
                                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    Clear all filters
                                </button>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="px-10 py-4 bg-[#F4B000] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#F4B000]/20 hover:scale-105 transition-all"
                                >
                                    Show {results.length} {results.length === 1 ? 'Result' : 'Results'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Mobile Filter Drawer + Trigger (phone only) */}
                {isPhone && (
                    <>
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
                            onSortChange={() => {}} // Placeholder as sortBy is currently read-only in this component
                        />
                    </>
                )}
            </div>

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
                        location: result.district || result.location || taluka || '',
                        district: result.district || undefined,
                        stateCode: result.stateCode || undefined,
                    });

                    localStorage.setItem(
                        'bkmb_user_pincode',
                        JSON.stringify({
                            pincode,
                            taluka: result.location || taluka,
                            district: result.district || undefined,
                            state: result.state || undefined,
                            stateCode: result.stateCode || undefined,
                            lat,
                            lng,
                            manuallySet: true,
                        })
                    );
                    try {
                        await setLocationCookie({
                            pincode,
                            taluka: result.location || taluka,
                            district: result.district || undefined,
                            state: result.state || undefined,
                            stateCode: result.stateCode || undefined,
                            lat,
                            lng,
                        });
                    } catch (err) {
                        console.error('[Location] Cookie set failed:', err);
                    }
                    window.dispatchEvent(new Event('locationChanged'));
                    try {
                        await updateSelfMemberLocation({
                            pincode,
                            district: result.district || null,
                            taluka: result.location || taluka,
                            state: result.state || null,
                            latitude: lat ?? null,
                            longitude: lng ?? null,
                        });
                    } catch (err) {
                        console.error('[Location] Profile update failed:', err);
                    }

                    toast.success(
                        `Prices updated for ${result.location || taluka}${dist ? ` (${Math.round(dist)}km)` : ''}`
                    );
                }}
            />

            {/* Compare Tray */}
            <CompareTray
                items={compareItems}
                onRemove={removeCompare}
                onCompareNow={handleCompareNow}
                onClear={clearCompare}
            />

            {/* Finance Edit — full-width bottom sheet */}
            <AnimatePresence>
                {isDpEditOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-end justify-center"
                        onClick={() => setIsDpEditOpen(false)}
                    >
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            onClick={e => e.stopPropagation()}
                            className="relative z-10 w-full max-w-2xl mx-auto rounded-t-3xl bg-white border-t border-x border-slate-200 shadow-2xl p-6 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                                    Finance Settings
                                </h3>
                                <button
                                    onClick={() => setIsDpEditOpen(false)}
                                    className="text-slate-400 hover:text-slate-900"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Downpayment */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Downpayment
                                    </span>
                                    <span className="text-lg font-black text-emerald-600">
                                        ₹{dpDraft.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100000}
                                    step={1000}
                                    value={dpDraft}
                                    onChange={e => setDpDraft(Number(e.target.value))}
                                    className="w-full accent-[#F4B000] h-2 rounded-full"
                                />
                                <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                                    <span>₹0</span>
                                    <span>₹25K</span>
                                    <span>₹50K</span>
                                    <span>₹75K</span>
                                    <span>₹1L</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    {[5000, 10000, 15000, 20000, 30000, 50000].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setDpDraft(val)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${dpDraft === val ? 'bg-[#F4B000]/15 border-[#F4B000]/40 text-[#F4B000]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#F4B000]/30'}`}
                                        >
                                            ₹{val / 1000}K
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tenure */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Tenure
                                    </span>
                                    <span className="text-lg font-black text-emerald-600">{tenure} months</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    {[12, 24, 36, 48, 60].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setTenure(val)}
                                            className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${tenure === val ? 'bg-[#F4B000]/15 border-[#F4B000]/40 text-[#F4B000]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#F4B000]/30'}`}
                                        >
                                            {val}mo
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => applyDp(dpDraft)}
                                className="w-full py-3 rounded-xl bg-[#F4B000] hover:bg-[#FFD700] text-black text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#F4B000]/20 transition-all hover:-translate-y-0.5"
                            >
                                Apply to All Cards
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
