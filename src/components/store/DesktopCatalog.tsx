'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    Zap,
    Search,
    Heart,
    Star,
    StarHalf,
    X,
    Pencil,
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
import { buildProductUrl } from '@/lib/utils/urlHelper';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { formatPriceLabel } from '@/utils/formatVehicleSpec';
import { DiscoveryBar } from '@/components/store/DiscoveryBar';

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
import { CatalogCardAdapter } from './cards/VehicleCardAdapters';
import { CompareTray, type CompareItem } from './CompareTray';
import { CompactProductCard } from './mobile/CompactProductCard';
import { MobileFilterDrawer } from './mobile/MobileFilterDrawer';
import { useOClubWallet } from '@/hooks/useOClubWallet';
import { CatalogGridSkeleton } from './CatalogSkeleton';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getSelfMemberLocation, updateSelfMemberLocation } from '@/actions/members';
import { resolveIpLocation } from '@/actions/resolveIpLocation';
import { getEmiFactor } from '@/lib/constants/pricingConstants';
import { useDiscovery } from '@/contexts/DiscoveryContext';
import { StoreSearchBar } from '@/components/store/ui/StoreSearchBar';
import { buildVariantExplorerUrl } from '@/lib/utils/urlHelper';
import {
    VEHICLE_MODE_CONFIG,
    compareLimitMessage,
    compareMinSelectionMessage,
    getSafeViewMode,
} from './cards/vehicleModeConfig';

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
}: DesktopCatalogProps) => {
    // Prefer client-resolved items when available, otherwise SSR
    const router = useRouter();
    const { device } = useBreakpoint();
    const { setResultsCount, setLocationLabel, setShowDiscoveryBar } = useDiscovery();
    const isPhone = device === 'phone';
    const [tvViewport, setTvViewport] = useState(false);
    const isTv = tvViewport;
    const [viewportDebug, setViewportDebug] = useState({
        width: 0,
        height: 0,
        dpr: 1,
        tvLike: false,
        forced: 'auto' as 'auto' | '1' | '0',
    });
    const [showHeader, setShowHeader] = useState(true);
    const [tvIdleMode, setTvIdleMode] = useState(false);
    const [tvRotationTick, setTvRotationTick] = useState(0);
    const tvIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tvRotateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [showTvSearch, setShowTvSearch] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const syncTvViewport = () => {
            const params = new URLSearchParams(window.location.search);
            const forced = params.get('tv');
            const explicitTv = document.documentElement.dataset.tv === '1';
            const width = window.innerWidth || document.documentElement.clientWidth || 0;
            const height = window.innerHeight || document.documentElement.clientHeight || 0;
            // TV browser often reports reduced CSS viewport (e.g. 960x540 @ dpr2).
            const tvLikeViewport =
                (width >= 1500 && height <= 1000) || (width >= 900 && width <= 1200 && height >= 500 && height <= 700);
            const forcedTv = forced === '1' ? true : forced === '0' ? false : null;
            setViewportDebug({
                width,
                height,
                dpr: window.devicePixelRatio || 1,
                tvLike: tvLikeViewport,
                forced: forced === '1' || forced === '0' ? (forced as '1' | '0') : 'auto',
            });
            const resolved = forcedTv ?? (explicitTv || tvLikeViewport);
            setTvViewport(resolved);
            // Propagate heuristic TV detection to DOM so CSS [data-tv="1"] works
            // even for Windows Chrome where UA-based detection returns false
            document.documentElement.dataset.tv = resolved ? '1' : '0';
        };
        syncTvViewport();
        window.addEventListener('popstate', syncTvViewport);
        window.addEventListener('resize', syncTvViewport);
        return () => {
            window.removeEventListener('popstate', syncTvViewport);
            window.removeEventListener('resize', syncTvViewport);
        };
    }, []);

    // Listen for TV search toggle
    useEffect(() => {
        if (!isTv) return;
        const handleToggleSearch = () => setShowTvSearch(prev => !prev);
        window.addEventListener('toggleTvSearch', handleToggleSearch);
        return () => window.removeEventListener('toggleTvSearch', handleToggleSearch);
    }, [isTv]);

    // Idle detection — flip effect triggers after inactivity
    useEffect(() => {
        const schedule = () => {
            if (tvIdleTimeoutRef.current) clearTimeout(tvIdleTimeoutRef.current);
            tvIdleTimeoutRef.current = setTimeout(() => setTvIdleMode(true), isTv ? 60000 : 90000);
        };
        const onActivity = () => {
            setTvIdleMode(false);
            schedule();
        };
        schedule();
        const events = ['mousemove', 'mousedown', 'click', 'keydown', 'touchstart', 'scroll'] as const;
        events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
        return () => {
            events.forEach(e => window.removeEventListener(e, onActivity));
            if (tvIdleTimeoutRef.current) clearTimeout(tvIdleTimeoutRef.current);
        };
    }, [isTv]);

    // Flip rotation: cycle 3 cards every 10s while idle
    useEffect(() => {
        if (!tvIdleMode) {
            if (tvRotateIntervalRef.current) clearInterval(tvRotateIntervalRef.current);
            return;
        }
        tvRotateIntervalRef.current = setInterval(() => setTvRotationTick(t => t + 1), 8000); // 8s per card
        return () => {
            if (tvRotateIntervalRef.current) clearInterval(tvRotateIntervalRef.current);
        };
    }, [tvIdleMode]);

    // Auto-hide header on TV after 4s of inactivity
    useEffect(() => {
        if (!isTv) return;

        let timer: NodeJS.Timeout;
        const resetTimer = () => {
            setShowHeader(true);
            clearTimeout(timer);
            timer = setTimeout(() => setShowHeader(false), 4000);
        };

        const handleInteraction = () => resetTimer();

        window.addEventListener('mousemove', handleInteraction);
        window.addEventListener('scroll', handleInteraction);
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        resetTimer();

        return () => {
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            clearTimeout(timer);
        };
    }, [isTv]);

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
        pricingMode,
        setPricingMode,
        toggleFilter,
        clearAll,
    } = filters;

    // Derived State
    const makeOptions = availableMakes && availableMakes.length > 0 ? availableMakes : defaultBrands;
    const activeCategory = selectedBodyTypes.length === 1 ? selectedBodyTypes[0] : 'ALL';

    // Local State
    const isSmart = mode === 'smart';
    const [sortBy] = useState<'popular' | 'price' | 'emi'>('price');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(VEHICLE_MODE_CONFIG.catalog.defaultView);

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Compare state
    const [compareItems, setCompareItems] = useState<(CompareItem & { id: string })[]>([]);
    const toggleCompare = (item: CompareItem & { id: string }) => {
        setCompareItems(prev => {
            const exists = prev.find(c => c.id === item.id);
            if (exists) return prev.filter(c => c.id !== item.id);
            if (prev.length >= VEHICLE_MODE_CONFIG.catalog.compareCap) {
                toast.error(compareLimitMessage(VEHICLE_MODE_CONFIG.catalog.compareCap));
                return prev;
            }
            toast.success(`${item.model} added to compare`);
            return [...prev, item];
        });
    };
    const removeCompare = (id: string) => setCompareItems(prev => prev.filter(c => c.id !== id));
    const clearCompare = () => setCompareItems([]);
    const openCompareView = () => {
        const minCompareSelection = VEHICLE_MODE_CONFIG.catalog.minCompareSelection;
        if (compareItems.length < minCompareSelection) {
            toast.error(compareMinSelectionMessage(minCompareSelection));
            return;
        }
        setViewMode('list');
    };
    const handleCompareNow = () => {
        openCompareView();
    };

    // Downpayment edit popover
    const [isDpEditOpen, setIsDpEditOpen] = useState(false);
    const [dpDraft, setDpDraft] = useState(downpayment);
    const openDpEdit = () => {
        setDpDraft(downpayment);
        setIsDpEditOpen(true);
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
        stateCode?: string;
    }>({ status: 'loading' });

    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    const [showNotServingModal, setShowNotServingModal] = useState(false);
    const notServingShownRef = React.useRef(false);

    // Trigger non-served modal once when serviceability resolves to unserviceable
    useEffect(() => {
        if (serviceability.status === 'unserviceable' && !notServingShownRef.current) {
            notServingShownRef.current = true;
            setShowNotServingModal(true);
        }
    }, [serviceability.status]);

    useEffect(() => {
        const checkCurrentServiceability = async () => {
            if (typeof window === 'undefined') return;
            const normalizeStateCode = (value?: string | null) => {
                const upper = String(value || '')
                    .trim()
                    .toUpperCase();
                if (!upper) return 'MH';
                if (/^[A-Z]{2}$/.test(upper)) return upper;
                const map: Record<string, string> = {
                    MAHARASHTRA: 'MH',
                    KARNATAKA: 'KA',
                    GUJARAT: 'GJ',
                    RAJASTHAN: 'RJ',
                    DELHI: 'DL',
                    KERALA: 'KL',
                    GOA: 'GA',
                    PUNJAB: 'PB',
                    HARYANA: 'HR',
                };
                return map[upper] || upper.slice(0, 2);
            };

            const stateLabelFromCode = (stateCode?: string | null) => {
                const code = normalizeStateCode(stateCode);
                const map: Record<string, string> = {
                    MH: 'MAHARASHTRA',
                    KA: 'KARNATAKA',
                    GJ: 'GUJARAT',
                    RJ: 'RAJASTHAN',
                    DL: 'DELHI',
                    KL: 'KERALA',
                    GA: 'GOA',
                    PB: 'PUNJAB',
                    HR: 'HARYANA',
                };
                return map[code] || code;
            };

            const isServiceableByRange = (stateCode: string, lat?: number | null, lng?: number | null) => {
                if (normalizeStateCode(stateCode) !== 'MH') return false;
                if (lat == null || lng == null) return true;
                return calculateDistance(lat, lng, HUB_LOCATION.lat, HUB_LOCATION.lng) <= MAX_SERVICEABLE_DISTANCE_KM;
            };

            const persistPayload = async (payload: {
                pincode?: string;
                taluka?: string;
                state?: string;
                stateCode?: string;
                lat?: number | null;
                lng?: number | null;
                manuallySet?: boolean;
                source?: string;
            }) => {
                localStorage.setItem('bkmb_user_pincode', JSON.stringify(payload));
                try {
                    await setLocationCookie({
                        pincode: payload.pincode,
                        taluka: payload.taluka,
                        state: payload.state,
                        stateCode: payload.stateCode,
                        lat: payload.lat,
                        lng: payload.lng,
                    });
                } catch (err) {
                    console.error('[Location] Cookie set failed:', err);
                }
                window.dispatchEvent(new Event('locationChanged'));
            };

            const applyRangeStateContext = async (input: {
                pincode: string;
                taluka?: string | null;
                state?: string | null;
                stateCode?: string | null;
                lat?: number | null;
                lng?: number | null;
                manuallySet?: boolean;
                source?: string;
            }) => {
                const pincode = String(input.pincode || '').trim();
                if (!/^\d{6}$/.test(pincode)) return null;

                const [resolved, serviceResult] = await Promise.all([
                    resolveLocation(pincode).catch(() => null),
                    checkServiceability(pincode),
                ]);

                const stateCode = normalizeStateCode(serviceResult?.stateCode || input.stateCode || resolved?.state);
                const stateLabel =
                    String(serviceResult?.state || input.state || resolved?.state || stateLabelFromCode(stateCode))
                        .trim()
                        .toUpperCase() || stateLabelFromCode(stateCode);
                const lat = input.lat ?? resolved?.lat ?? null;
                const lng = input.lng ?? resolved?.lng ?? null;
                const serviceable = isServiceableByRange(stateCode, lat, lng);

                setServiceability({
                    status: serviceable ? 'serviceable' : 'unserviceable',
                    location: stateLabel,
                    stateCode,
                });

                const payload = {
                    pincode,
                    taluka: input.taluka || resolved?.taluka || serviceResult?.taluka || serviceResult?.location || '',
                    state: stateLabel,
                    stateCode,
                    lat,
                    lng,
                    manuallySet: Boolean(input.manuallySet),
                    source: input.source || 'AUTO',
                };

                await persistPayload(payload);
                return payload;
            };

            const applyIpFallback = async () => {
                try {
                    const ipLocation = await resolveIpLocation();
                    if (!ipLocation.stateCode) return false;
                    const stateCode = normalizeStateCode(ipLocation.stateCode);
                    const stateLabel = stateLabelFromCode(stateCode);
                    const serviceable = stateCode === 'MH';
                    setServiceability({
                        status: serviceable ? 'serviceable' : 'unserviceable',
                        location: stateLabel,
                        stateCode,
                    });
                    await persistPayload({
                        state: stateLabel,
                        stateCode,
                        manuallySet: false,
                        source: 'IP',
                    });
                    return true;
                } catch (err) {
                    console.error('[Location] IP fallback failed:', err);
                    return false;
                }
            };

            const applyGeoCoords = async (latitude: number, longitude: number) => {
                try {
                    const supabaseClient = createClient();
                    const { data: nearestData } = await supabaseClient.rpc('get_nearest_pincode', {
                        p_lat: latitude,
                        p_lon: longitude,
                    });
                    if (!nearestData || nearestData.length === 0) return false;
                    const nearest = nearestData[0];
                    const payload = await applyRangeStateContext({
                        pincode: nearest.pincode,
                        taluka: nearest.taluka || '',
                        stateCode: nearest.rto_code?.substring(0, 2) || 'MH',
                        lat: latitude,
                        lng: longitude,
                        manuallySet: false,
                        source: 'GEO',
                    });
                    if (!payload) return false;

                    updateSelfMemberLocation({
                        pincode: payload.pincode || null,
                        taluka: payload.taluka || null,
                        state: payload.state || null,
                        latitude,
                        longitude,
                    }).catch(err => console.error('[Location] Profile update failed:', err));

                    return true;
                } catch (err) {
                    console.error('[Location] DB lookup error:', err);
                    return false;
                }
            };

            let cachedData: any = null;
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (cached) {
                try {
                    cachedData = JSON.parse(cached);
                } catch {
                    localStorage.removeItem('bkmb_user_pincode');
                    cachedData = null;
                }
            }

            if (!cachedData?.manuallySet) {
                let member: any = null;
                try {
                    member = await getSelfMemberLocation();
                } catch (err) {
                    console.error('[Location] Profile fetch failed:', err);
                }
                if (member?.pincode) {
                    const payload = await applyRangeStateContext({
                        pincode: member.pincode,
                        taluka: member.taluka || '',
                        state: member.state || null,
                        stateCode: null,
                        lat: member.latitude ?? null,
                        lng: member.longitude ?? null,
                        manuallySet: false,
                        source: 'PROFILE',
                    });
                    if (payload) {
                        if (!member.taluka || !member.state || !member.latitude || !member.longitude) {
                            try {
                                await updateSelfMemberLocation({
                                    pincode: payload.pincode || null,
                                    taluka: payload.taluka || null,
                                    state: payload.state || null,
                                    latitude: payload.lat ?? null,
                                    longitude: payload.lng ?? null,
                                });
                            } catch (err) {
                                console.error('[Location] Profile update failed:', err);
                            }
                        }
                        return;
                    }
                }
            }

            if (cachedData?.pincode) {
                const payload = await applyRangeStateContext({
                    pincode: cachedData.pincode,
                    taluka: cachedData.taluka || cachedData.city || '',
                    state: cachedData.state || null,
                    stateCode: cachedData.stateCode || null,
                    lat: cachedData.lat ?? null,
                    lng: cachedData.lng ?? null,
                    manuallySet: Boolean(cachedData.manuallySet),
                    source: cachedData.source || 'CACHE',
                });
                if (payload) {
                    if (payload.lat && payload.lng) {
                        updateSelfMemberLocation({
                            pincode: payload.pincode || null,
                            taluka: payload.taluka || null,
                            state: payload.state || null,
                            latitude: payload.lat,
                            longitude: payload.lng,
                        }).catch(err => console.error('[Location] Profile update failed:', err));
                    }
                    return;
                }
            }

            if (navigator.geolocation) {
                let hasRetriedAfterTimeout = false;
                navigator.geolocation.getCurrentPosition(
                    async position => {
                        const ok = await applyGeoCoords(position.coords.latitude, position.coords.longitude);
                        if (!ok) {
                            const resolvedByIp = await applyIpFallback();
                            if (!resolvedByIp) {
                                setServiceability({ status: 'unset' });
                                setIsLocationPickerOpen(true);
                            }
                        }
                    },
                    async err => {
                        console.error('[Location] Geolocation error:', err.code, err.message);
                        if (err.code === 3 && !hasRetriedAfterTimeout) {
                            hasRetriedAfterTimeout = true;
                            navigator.geolocation.getCurrentPosition(
                                async position => {
                                    const ok = await applyGeoCoords(
                                        position.coords.latitude,
                                        position.coords.longitude
                                    );
                                    if (!ok) {
                                        const resolvedByIp = await applyIpFallback();
                                        if (!resolvedByIp) {
                                            setServiceability({ status: 'unset' });
                                            setIsLocationPickerOpen(true);
                                        }
                                    }
                                },
                                async retryErr => {
                                    console.error(
                                        '[Location] Geolocation retry error:',
                                        retryErr.code,
                                        retryErr.message
                                    );
                                    const resolvedByIp = await applyIpFallback();
                                    if (!resolvedByIp) {
                                        setServiceability({ status: 'unset' });
                                        setIsLocationPickerOpen(true);
                                    }
                                },
                                {
                                    enableHighAccuracy: false,
                                    timeout: 30000,
                                    maximumAge: 0,
                                }
                            );
                            return;
                        }
                        const resolvedByIp = await applyIpFallback();
                        if (!resolvedByIp) {
                            setServiceability({ status: 'unset' });
                            setIsLocationPickerOpen(true);
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 30000,
                        maximumAge: 300000,
                    }
                );
            } else {
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

    // Sync pricing prefs from mobile bottom nav EMI sheet
    React.useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail) return;
            if (detail.mode) setPricingMode(detail.mode as 'cash' | 'finance');
            if (typeof detail.downpayment === 'number') setDownpayment(detail.downpayment);
            if (typeof detail.tenure === 'number') setTenure(detail.tenure);
        };
        window.addEventListener('discoveryPricingChanged', handler);
        return () => window.removeEventListener('discoveryPricingChanged', handler);
    }, []);

    // Sync body type from mobile bottom nav Ride popout
    React.useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail) return;
            setSelectedBodyTypes(detail.bodyTypes || []);
        };
        window.addEventListener('catalogBodyTypeChanged', handler);
        return () => window.removeEventListener('catalogBodyTypeChanged', handler);
    }, []);

    // Open Finance panel when card pill dispatches event
    React.useEffect(() => {
        const handler = () => openDpEdit();
        window.addEventListener('openFinancePanel', handler);
        return () => window.removeEventListener('openFinancePanel', handler);
    }, []);

    // Open mobile filter from bottom nav Filter tab
    React.useEffect(() => {
        const handler = () => setIsMobileFilterOpen(true);
        window.addEventListener('openMobileFilter', handler);
        return () => window.removeEventListener('openMobileFilter', handler);
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
        allVisible = false,
    }: {
        title: string;
        options: string[];
        selectedValues: string[];
        onToggle: (val: string) => void;
        showReset?: boolean;
        onReset: () => void;
        allVisible?: boolean;
    }) => {
        const [isCollapsed, setIsCollapsed] = useState(false);
        const [isExpanded, setIsExpanded] = useState(false);
        const visibleOptions = isExpanded || allVisible ? options : options.slice(0, 3);

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
                        {!allVisible && options.length > 3 && (
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
            vehicles.sort(
                (a, b) => (a.price?.onRoad || a.price?.exShowroom || 0) - (b.price?.onRoad || b.price?.exShowroom || 0)
            );
        }
        if (sortBy === 'emi') {
            vehicles.sort((a, b) => {
                const aEmi = Math.round(((a.price?.exShowroom || 0) - downpayment) * getEmiFactor(36));
                const bEmi = Math.round(((b.price?.exShowroom || 0) - downpayment) * getEmiFactor(36));
                return aEmi - bEmi;
            });
        }
        return vehicles;
    }, [filteredVehicles, sortBy, downpayment]);

    const [smartModel, setSmartModel] = useState<string | null>(null);
    const [smartVariant, setSmartVariant] = useState<string | null>(null);
    const [smartColor, setSmartColor] = useState<string | null>(null);
    const { availableCoins, isLoggedIn } = useOClubWallet();

    useEffect(() => {
        if (!isSmart) return;
        if (!searchQuery) {
            setSmartModel(null);
            setSmartVariant(null);
            setSmartColor(null);
        }
    }, [isSmart, searchQuery]);

    const normalize = (value?: string) => (value || '').toLowerCase().trim();

    // Fuzzy match: tolerates small typos (max 2 char edit distance for words >=4 chars)
    const fuzzyMatch = (text: string, query: string): boolean => {
        if (!text || !query) return false;
        if (text.includes(query)) return true;
        // Word-level fuzzy: each query word checked against each text word
        const qWords = query.split(/\s+/).filter(Boolean);
        const tWords = text.split(/\s+/).filter(Boolean);
        return qWords.every(qw => {
            if (text.includes(qw)) return true;
            return tWords.some(tw => {
                if (tw.includes(qw) || qw.includes(tw)) return true;
                // Levenshtein for longer words
                if (qw.length < 3) return false;
                const maxDist = qw.length <= 4 ? 1 : 2;
                const m = qw.length,
                    n = tw.length;
                if (Math.abs(m - n) > maxDist) return false;
                const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
                    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
                );
                for (let i = 1; i <= m; i++)
                    for (let j = 1; j <= n; j++)
                        dp[i][j] =
                            qw[i - 1] === tw[j - 1]
                                ? dp[i - 1][j - 1]
                                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                return dp[m][n] <= maxDist;
            });
        });
    };

    // Search dropdown state
    const [searchFocused, setSearchFocused] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const resultsForQuery = useMemo(() => {
        const query = normalize(searchQuery);
        if (!query) return [];
        return results.filter(v => {
            const makeText = normalize(v.make);
            const modelText = normalize(v.model);
            const variantText = normalize(v.variant);
            return fuzzyMatch(makeText, query) || fuzzyMatch(modelText, query) || fuzzyMatch(variantText, query);
        });
    }, [results, searchQuery]);

    // Instant dropdown suggestions — unique model+make combos, max 6
    const searchSuggestions = useMemo(() => {
        const query = normalize(searchQuery);
        if (!query || query.length < 1) return [];
        const seen = new Set<string>();
        const suggestions: { key: string; make: string; model: string; count: number; bodyType?: string }[] = [];
        for (const v of results) {
            const key = `${normalize(v.make)}-${normalize(v.model)}`;
            if (seen.has(key)) continue;
            const makeText = normalize(v.make);
            const modelText = normalize(v.model);
            if (fuzzyMatch(makeText, query) || fuzzyMatch(modelText, query)) {
                seen.add(key);
                const count = results.filter(r => normalize(r.model) === normalize(v.model)).length;
                suggestions.push({ key, make: v.make, model: v.model, count, bodyType: (v as any).bodyType });
            }
            if (suggestions.length >= 6) break;
        }
        return suggestions;
    }, [results, searchQuery]);

    const modelOptions: string[] = [];

    // Removed: smart model auto-selection from search query (pills replaced by dropdown)

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
        // Source pool: smart mode uses smartFilteredResults, normal mode uses results
        const pool = isSmart ? smartFilteredResults : results;
        return pool;
    }, [isSmart, results, smartFilteredResults]);

    // Enterprise rule: render all variants directly, clustered by model (contiguous ordering),
    // with lowest-to-highest pricing as default reading order.
    const groupedDisplayResults = useMemo(() => {
        const priceOf = (v: ProductVariant) => v.price?.onRoad || v.price?.exShowroom || 0;
        const modelMinPrice = new Map<string, number>();
        const modelVariantCount = new Map<string, number>();

        for (const vehicle of displayResults) {
            const modelKey = String(vehicle.model || '').toLowerCase();
            const price = priceOf(vehicle);
            const currentMin = modelMinPrice.get(modelKey);
            if (currentMin === undefined || price < currentMin) {
                modelMinPrice.set(modelKey, price);
            }
            const explicitModelCount = Number((vehicle as any).modelVariantCount);
            if (Number.isFinite(explicitModelCount) && explicitModelCount > 0) {
                modelVariantCount.set(modelKey, Math.max(modelVariantCount.get(modelKey) || 0, explicitModelCount));
            } else {
                modelVariantCount.set(modelKey, (modelVariantCount.get(modelKey) || 0) + 1);
            }
        }

        const sorted = [...displayResults].sort((a, b) => {
            const aModelKey = String(a.model || '').toLowerCase();
            const bModelKey = String(b.model || '').toLowerCase();
            const aModelMin = modelMinPrice.get(aModelKey) ?? Number.MAX_SAFE_INTEGER;
            const bModelMin = modelMinPrice.get(bModelKey) ?? Number.MAX_SAFE_INTEGER;

            if (aModelMin !== bModelMin) return aModelMin - bModelMin;
            if (aModelKey !== bModelKey) return aModelKey.localeCompare(bModelKey);

            const priceCmp = priceOf(a) - priceOf(b);
            if (priceCmp !== 0) return priceCmp;

            return String(a.variant || '').localeCompare(String(b.variant || ''));
        });

        return sorted.map(v => ({
            representative: v,
            variantCount: modelVariantCount.get(String(v.model || '').toLowerCase()) || 1,
            make: v.make,
            model: v.model,
            modelSlug: v.modelSlug,
        }));
    }, [displayResults]);

    // Dynamic max downpayment = most expensive vehicle on catalog - ₹25,000 min loan
    const maxDp = useMemo(() => {
        const prices = displayResults.map(v => v.price?.offerPrice ?? v.price?.exShowroom ?? 0).filter(p => p > 0);
        if (!prices.length) return 200000;
        return Math.max(Math.max(...prices) - 25000, 0);
    }, [displayResults]);

    const renderedGroups = useMemo(() => groupedDisplayResults, [groupedDisplayResults]);

    const compareIds = useMemo(() => new Set(compareItems.map(item => item.id)), [compareItems]);
    const visibleGroups = useMemo(() => {
        if (viewMode !== 'list') return renderedGroups;
        return renderedGroups.filter(group => compareIds.has(group.representative.id));
    }, [viewMode, renderedGroups, compareIds]);

    useEffect(() => {
        const minCompareSelection = VEHICLE_MODE_CONFIG.catalog.minCompareSelection;
        if (viewMode === 'list' && compareItems.length < minCompareSelection) {
            setViewMode('grid');
        }
    }, [viewMode, compareItems.length]);

    // Sync stats to discovery context
    useEffect(() => {
        if (!isPhone) {
            setResultsCount(groupedDisplayResults.length);
            setLocationLabel(serviceability.location || null);
            setShowDiscoveryBar(true);
        }
        return () => {
            setShowDiscoveryBar(false);
        };
    }, [
        groupedDisplayResults.length,
        serviceability.location,
        isPhone,
        setResultsCount,
        setLocationLabel,
        setShowDiscoveryBar,
    ]);

    // Location gate: catalog stays in DOM for SEO, but overlaid with modal when location missing
    const showLocationGate = needsLocation || serviceability.status === 'unset';

    return (
        <div
            className="flex flex-col min-h-screen bg-slate-50 transition-colors duration-500 font-sans relative"
            style={
                isTv
                    ? {
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                          textRendering: 'optimizeLegibility',
                      }
                    : undefined
            }
        >
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

            {/* Non-Served State Modal — dismissable, user can still browse */}
            {showNotServingModal && (
                <div className="fixed inset-0 z-[199] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowNotServingModal(false)}
                    />
                    <div className="relative z-10 w-full max-w-sm mx-4 rounded-3xl border border-slate-100 bg-white shadow-2xl p-8 text-center space-y-5">
                        {/* Close */}
                        <button
                            onClick={() => setShowNotServingModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                            aria-label="Close"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path
                                    d="M1 1l12 12M13 1L1 13"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                        {/* Icon */}
                        <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                            <MapPin size={26} className="text-slate-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-black uppercase tracking-wide text-slate-900">
                                {serviceability.location
                                    ? `${serviceability.location} mein abhi nahi`
                                    : 'Abhi yahan seva nahi'}
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Hum filhaal is area mein service nahi karte.{' '}
                                <span className="font-semibold text-slate-700">
                                    Aap catalog explore karein aur vehicles compare karein.
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNotServingModal(false)}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-black text-white uppercase tracking-widest hover:bg-slate-700 transition-all"
                        >
                            Explore Catalog
                        </button>
                    </div>
                </div>
            )}
            <div
                className={`flex-1 store-page-shell ${showLocationGate ? 'pointer-events-none select-none' : ''} ${
                    isTv ? 'px-12' : ''
                }`}
            >
                <DiscoveryBar
                    className={
                        isTv
                            ? 'opacity-100 translate-y-0'
                            : showHeader
                              ? 'opacity-100 translate-y-0'
                              : 'opacity-0 -translate-y-full pointer-events-none'
                    }
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchSuggestions={searchSuggestions}
                    onSuggestionSelect={(make, model) => router.push(buildVariantExplorerUrl(make, model))}
                    pricingMode={pricingMode}
                    onPricingModeChange={mode => {
                        setPricingMode(mode as any);
                        if (mode === 'finance') openDpEdit();
                    }}
                    reduceEffects={isTv}
                    onCompareClick={() => {
                        if (viewMode === 'list') {
                            setViewMode(getSafeViewMode('catalog', 'grid'));
                            return;
                        }
                        openCompareView();
                    }}
                    compareCount={compareItems.length}
                    compareCap={VEHICLE_MODE_CONFIG.catalog.compareCap}
                    viewMode={viewMode}
                    onViewModeChange={mode => setViewMode(getSafeViewMode('catalog', mode))}
                    allowedViewModes={VEHICLE_MODE_CONFIG.catalog.allowedViews}
                    centerContent={
                        <>
                            {/* Body type quick-filter pills — always visible */}
                            {
                                <div className="hidden lg:flex items-center gap-1.5">
                                    {bodyOptions.map(type => {
                                        const isActive = selectedBodyTypes.includes(type);
                                        const icon =
                                            type === 'MOTORCYCLE' ? (
                                                <img
                                                    src="/media/motorcycle.svg"
                                                    className={`${isTv ? 'w-4 h-4' : 'w-6 h-6'} object-contain transition-all scale-x-[-1] ${isActive ? 'brightness-0' : 'opacity-70 grayscale'}`}
                                                    alt="Motorcycle"
                                                />
                                            ) : type === 'SCOOTER' ? (
                                                <img
                                                    src="/media/scooter.svg"
                                                    className={`${isTv ? 'w-4 h-4' : 'w-6 h-6'} object-contain transition-all scale-x-[-1] ${isActive ? 'brightness-0' : 'opacity-70 grayscale'}`}
                                                    alt="Scooter"
                                                />
                                            ) : (
                                                <img
                                                    src="/media/moped.svg"
                                                    className={`${isTv ? 'w-4 h-4' : 'w-6 h-6'} object-contain transition-all ${isActive ? 'brightness-0' : 'opacity-70 grayscale'}`}
                                                    alt="Moped"
                                                />
                                            );
                                        const label =
                                            type === 'MOTORCYCLE'
                                                ? 'Motorcycle'
                                                : type === 'SCOOTER'
                                                  ? 'Scooter'
                                                  : 'Moped';
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedBodyTypes(isActive ? [] : [type])}
                                                className={`inline-flex items-center gap-1.5 ${isTv ? 'px-2 h-8 text-[8px]' : 'px-4 h-10 text-[10px]'} rounded-2xl border font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300 ${
                                                    isActive
                                                        ? 'bg-[#F4B000] text-black border-black/20 shadow-md shadow-black/5'
                                                        : 'bg-white/70 text-slate-500 border-black/10 hover:bg-white hover:text-slate-900 hover:border-black/20'
                                                }`}
                                            >
                                                {icon}
                                                <span className="leading-none select-none">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            }
                        </>
                    }
                />

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
                {serviceability.status === 'unserviceable' && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📍</span>
                            <div className="flex-1">
                                <p className="font-bold text-amber-900">
                                    Selected location is outside active service range.
                                </p>
                                <p className="mt-1 text-sm text-amber-800">
                                    Range-based serviceability is active for state-locked pricing.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    className={`flex gap-6 xl:gap-16 transition-all duration-700 ${viewMode === 'grid' ? 'max-w-full' : ''}`}
                >
                    {/* Filters removed by product decision; keep list view + compare only */}
                    {false && viewMode === 'list' && (
                        <aside
                            className="hidden xl:block w-80 flex-shrink-0 space-y-6 sticky self-start pt-2 transition-all animate-in fade-in slide-in-from-left-4"
                            style={{ top: 'calc(var(--header-h) + 24px)' }}
                        >
                            <div
                                className={`flex flex-col gap-8 p-6 ${isTv ? 'bg-white' : 'bg-white/60 border border-slate-200/60 backdrop-blur-3xl'} rounded-[3rem] shadow-2xl`}
                            >
                                {/* Search Bar moved to Navbar via DiscoveryContext */}
                                {/* Filter Groups in Sidebar (List View) */}
                                <div className="space-y-6">
                                    <FilterGroup
                                        title="Quick Selection"
                                        options={['HONDA', 'TVS', 'BAJAJ', 'SUZUKI', 'YAMAHA']}
                                        selectedValues={selectedMakes}
                                        onToggle={(v: string) => toggleFilter(setSelectedMakes, v)}
                                        onReset={() => setSelectedMakes(makeOptions)}
                                        showReset={selectedMakes.length < makeOptions.length}
                                        allVisible={true}
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
                    <div className={`flex-1 ${isTv ? 'space-y-1' : 'space-y-6'}`}>
                        {/* Results Header moved to Navbar via DiscoveryContext */}

                        <motion.div
                            key="catalog-static"
                            className={`grid ${
                                viewMode === 'list'
                                    ? 'grid-cols-1 w-full gap-6 subpixel-antialiased'
                                    : isTv
                                      ? 'grid-cols-3 gap-6 w-full'
                                      : isPhone
                                        ? 'grid-cols-1 gap-4 w-full'
                                        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'
                            }`}
                        >
                            {visibleGroups.map((group, idx) => {
                                const v = group.representative;
                                const tick = tvRotationTick;
                                const isAmbient = tvIdleMode && idx < 3;
                                // Sequential flip: slot s flips at ticks s, s+3, s+6...
                                const slotVersion = isAmbient ? Math.floor((tick + 2 - idx) / 3) : 0;
                                const key = isAmbient
                                    ? `ambient-${idx}-${slotVersion}`
                                    : `stable-${v.id}-${(v as any).color || ''}`;
                                // Cycle through ALL color variants (flat displayResults) — different color each rotation
                                const allVariants = tvIdleMode ? displayResults : [];
                                const totalVariants = allVariants.length;
                                const dv =
                                    isAmbient && totalVariants > 3
                                        ? allVariants[(idx + slotVersion * 3) % totalVariants]
                                        : v;
                                return (
                                    <div
                                        key={key}
                                        className={
                                            isAmbient ? `ambient-card-enter ambient-card-slot-${idx % 3}` : undefined
                                        }
                                    >
                                        <CatalogCardAdapter
                                            key={`inner-${key}`}
                                            variant={dv}
                                            viewMode={viewMode}
                                            downpayment={downpayment}
                                            tenure={tenure}
                                            serviceability={serviceability}
                                            onLocationClick={() => setIsLocationPickerOpen(true)}
                                            isTv={isTv}
                                            isTvCompact={false}
                                            leadId={leadId}
                                            walletCoins={isLoggedIn ? availableCoins : null}
                                            showOClubPrompt={!isLoggedIn}
                                            showBcoinBadge={true}
                                            variantCount={group.variantCount}
                                            onExplore={() => {
                                                const url =
                                                    group.variantCount > 1
                                                        ? buildVariantExplorerUrl(group.make, group.model)
                                                        : buildProductUrl({
                                                              make: group.make,
                                                              model: group.model,
                                                              variant: dv.variant,
                                                              studio: dv.studioCode || undefined,
                                                              leadId: leadId,
                                                              basePath,
                                                          }).url;
                                                router.push(url);
                                            }}
                                            onCompare={() =>
                                                toggleCompare({
                                                    id: v.id,
                                                    make: group.make,
                                                    model: group.model,
                                                    modelSlug: group.modelSlug,
                                                    imageUrl: v.imageUrl || '/images/templates/t3_night.webp',
                                                })
                                            }
                                            isInCompare={compareIds.has(v.id)}
                                            onEditDownpayment={openDpEdit}
                                            onTogglePricingMode={() =>
                                                setPricingMode(prev => {
                                                    const next = prev === 'cash' ? 'finance' : 'cash';
                                                    if (next === 'finance') openDpEdit();
                                                    return next;
                                                })
                                            }
                                            pricingMode={pricingMode}
                                        />
                                    </div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>

                {false && isFilterOpen && viewMode === 'grid' ? (
                    <AnimatePresence>
                        {isFilterOpen && viewMode === 'grid' && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsFilterOpen(false)}
                                    className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
                                />
                                {/* Sidebar Panel */}
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed top-0 bottom-0 right-0 z-[101] w-full md:w-[460px] bg-white shadow-2xl flex flex-col border-l border-slate-200"
                                >
                                    {/* Sidebar Header */}
                                    <div className="flex-shrink-0 px-8 py-8 border-b border-slate-100 flex items-center justify-between bg-white pt-[max(env(safe-area-inset-top),32px)]">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-widest uppercase italic">
                                                Filters
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                Refine your search
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsFilterOpen(false)}
                                            className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-700 hover:text-black"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Sidebar Content */}
                                    <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-8 bg-slate-50 pb-[120px]">
                                        <FilterGroup
                                            title="Brands"
                                            options={makeOptions}
                                            selectedValues={selectedMakes}
                                            onToggle={(v: string) => toggleFilter(setSelectedMakes, v)}
                                            onReset={() => setSelectedMakes(makeOptions)}
                                            showReset={selectedMakes.length < makeOptions.length}
                                            allVisible={true}
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

                                    {/* Sidebar Footer */}
                                    <div className="absolute pl-8 pr-8 bottom-0 w-full p-6 border-t border-slate-200 bg-white flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-[max(env(safe-area-inset-bottom),24px)]">
                                        <button
                                            onClick={clearAll}
                                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors"
                                        >
                                            Clear all filters
                                        </button>
                                        <button
                                            onClick={() => setIsFilterOpen(false)}
                                            className="px-8 py-4 bg-[#F4B000] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#F4B000]/20 hover:scale-105 transition-all"
                                        >
                                            Show {results.length} {results.length === 1 ? 'Result' : 'Results'}
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                ) : null}

                {/* Mobile Filter Drawer + Trigger (phone only) */}
                {false && isPhone && (
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
                            onSortChange={() => {}}
                        />
                    </>
                )}
            </div>

            <LocationPicker
                isOpen={isLocationPickerOpen}
                onClose={() => setIsLocationPickerOpen(false)}
                onLocationSet={async (pincode, taluka, lat, lng) => {
                    const result = await checkServiceability(pincode);
                    const stateCode = String(result.stateCode || 'MH')
                        .trim()
                        .toUpperCase()
                        .slice(0, 2);
                    const stateLabel = String(result.state || (stateCode === 'MH' ? 'MAHARASHTRA' : stateCode))
                        .trim()
                        .toUpperCase();

                    let dist: number | undefined;
                    const isStateLocked = stateCode === 'MH';
                    let isServiceable = isStateLocked;

                    if (lat && lng) {
                        dist = calculateDistance(lat, lng, HUB_LOCATION.lat, HUB_LOCATION.lng);
                        isServiceable = isStateLocked && dist <= MAX_SERVICEABLE_DISTANCE_KM;
                    }

                    setServiceability({
                        status: isServiceable ? 'serviceable' : 'unserviceable',
                        location: stateLabel,
                        stateCode,
                    });

                    localStorage.setItem(
                        'bkmb_user_pincode',
                        JSON.stringify({
                            pincode,
                            taluka: result.location || taluka,
                            state: stateLabel,
                            stateCode,
                            lat,
                            lng,
                            manuallySet: true,
                        })
                    );
                    try {
                        await setLocationCookie({
                            pincode,
                            taluka: result.location || taluka,
                            state: stateLabel,
                            stateCode,
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
                            taluka: result.location || taluka,
                            state: stateLabel,
                            latitude: lat ?? null,
                            longitude: lng ?? null,
                        });
                    } catch (err) {
                        console.error('[Location] Profile update failed:', err);
                    }

                    toast.success(`Prices updated for ${stateLabel}${dist ? ` (${Math.round(dist)}km)` : ''}`);
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
                                    {/* Editable value with pencil */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-400">₹</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={maxDp}
                                            step={Math.max(1000, Math.round(maxDp / 100) * 1000)}
                                            value={Math.min(dpDraft, maxDp)}
                                            onChange={e => {
                                                const v = Math.min(maxDp, Math.max(0, Number(e.target.value)));
                                                setDpDraft(v);
                                                setDownpayment(v);
                                            }}
                                            className="w-24 text-right text-lg font-black text-emerald-600 bg-transparent border-b-2 border-emerald-200 focus:border-emerald-500 focus:outline-none transition-colors"
                                        />
                                        <Pencil size={12} className="text-slate-300" />
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={maxDp}
                                    step={5000}
                                    value={Math.min(dpDraft, maxDp)}
                                    onChange={e => {
                                        const v = Number(e.target.value);
                                        setDpDraft(v);
                                        setDownpayment(v);
                                    }}
                                    className="w-full accent-[#F4B000] h-2 rounded-full"
                                />
                                <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                                    <span>₹0</span>
                                    <span>₹{Math.round((maxDp * 0.25) / 5000) * 5}K</span>
                                    <span>₹{Math.round((maxDp * 0.5) / 5000) * 5}K</span>
                                    <span>₹{Math.round((maxDp * 0.75) / 5000) * 5}K</span>
                                    <span>₹{Math.round(maxDp / 5000) * 5}K</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    {[
                                        0, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 125000,
                                        150000, 175000, 200000, 250000, 300000,
                                    ]
                                        .filter(v => v <= maxDp)
                                        .map(val => (
                                            <button
                                                key={val}
                                                onClick={() => {
                                                    setDpDraft(val);
                                                    setDownpayment(val);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${dpDraft === val ? 'bg-[#F4B000]/15 border-[#F4B000]/40 text-[#F4B000]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#F4B000]/30'}`}
                                            >
                                                {val === 0
                                                    ? '₹0'
                                                    : val >= 100000
                                                      ? `₹${(val / 100000).toFixed(1)}L`
                                                      : `₹${val / 1000}K`}
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
                                <div className="grid grid-cols-3 gap-2">
                                    {[3, 6, 9, 12, 18, 24, 36, 48, 60].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setTenure(val)}
                                            className={`py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${tenure === val ? 'bg-[#F4B000]/15 border-[#F4B000]/40 text-[#F4B000]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#F4B000]/30'}`}
                                        >
                                            {val}mo
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsDpEditOpen(false)}
                                className="w-full py-3 rounded-xl bg-[#F4B000] hover:bg-[#FFD700] text-black text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#F4B000]/20 transition-all hover:-translate-y-0.5"
                            >
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
