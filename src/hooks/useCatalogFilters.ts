'use client';

import { useState, useMemo, useEffect, useTransition, useDeferredValue } from 'react';
import type { ProductVariant } from '@/types/productMaster';
import { getEmiFactor } from '@/lib/constants/pricingConstants';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDiscovery } from '@/contexts/DiscoveryContext';

import { BRANDS as brands } from '@/config/market';
export { brands };

export function useCatalogFilters(initialVehicles: ProductVariant[] = []) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { pricingMode, setPricingMode, offerMode, setOfferMode, searchQuery, setSearchQuery } = useDiscovery();
    const [, startTransition] = useTransition();

    // Gate URL sync to after hydration — prevents router.replace on first render
    // which creates an extra navigation task that blocks TBT.
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // We no longer manage searchQuery local state here, we use the DiscoveryContext
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const availableMakes = useMemo(() => {
        const makes = Array.from(
            new Set(
                initialVehicles
                    .filter(v => v.bodyType !== 'ACCESSORY' && v.bodyType !== 'SERVICE')
                    .map(v => (v.make || '').trim())
                    .filter(Boolean)
                    .map(m => m.toUpperCase())
            )
        );
        return makes.length > 0 ? makes : brands;
    }, [initialVehicles]);

    // Initialize filters from searchParams
    const [selectedMakes, setSelectedMakes] = useState<string[]>(() => {
        const brandParam = searchParams.get('brand');
        return brandParam ? brandParam.toUpperCase().split(',') : availableMakes;
    });

    const [selectedFuels, setSelectedFuels] = useState<string[]>(() => {
        const fuelParam = searchParams.get('fuel');
        return fuelParam ? fuelParam.split(',') : [];
    });

    const [selectedSegments, setSelectedSegments] = useState<string[]>(() => {
        const segmentParam = searchParams.get('segment');
        return segmentParam ? segmentParam.split(',') : [];
    });

    const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(() => {
        const categoryParam = searchParams.get('category');
        return categoryParam ? categoryParam.toUpperCase().split(',') : [];
    });

    const [selectedCC, setSelectedCC] = useState<string[]>(() => {
        const ccParam = searchParams.get('cc');
        return ccParam ? ccParam.split(',') : [];
    });

    const [selectedBrakes, setSelectedBrakes] = useState<string[]>([]);
    const [selectedWheels, setSelectedWheels] = useState<string[]>([]);
    const [selectedConsole, setSelectedConsole] = useState<string[]>([]);
    const [selectedSeatHeight, setSelectedSeatHeight] = useState<string[]>([]);
    const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
    const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
    const [maxPrice, setMaxPrice] = useState<number>(1000000); // 10 Lakh default
    const [maxEMI, setMaxEMI] = useState<number>(20000); // 20k default
    const [showOClubOnly, setShowOClubOnly] = useState(false);

    // We no longer manage pricingMode local state here, we use the DiscoveryContext

    // Dynamic EMI States
    const [downpayment, _setDownpayment] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('bkmb_downpayment');
            if (stored) return parseInt(stored);
        }
        const dp = searchParams.get('dp');
        return dp ? parseInt(dp) : 999;
    });
    const setDownpayment = (val: number | ((prev: number) => number)) => {
        _setDownpayment(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            if (typeof window !== 'undefined') {
                localStorage.setItem('bkmb_downpayment', String(next));
                window.dispatchEvent(new CustomEvent('bkmb_dp_changed', { detail: next }));
            }
            return next;
        });
    };
    const [tenure, setTenure] = useState(() => {
        const t = searchParams.get('tenure');
        return t ? parseInt(t) : 36;
    });

    useEffect(() => {
        const brandParam = searchParams.get('brand');
        if (brandParam) return;

        setSelectedMakes(prev => {
            const newMakes = availableMakes;

            if (prev.length === 0) return newMakes;

            const prevSet = new Set(prev.map(m => m.toUpperCase()));

            // If prev matches default brands or currently available makes, we'd want to sync
            const isDefault =
                (prev.length === brands.length && brands.every(m => prevSet.has(m.toUpperCase()))) ||
                (prev.length === newMakes.length && newMakes.every(m => prevSet.has(m.toUpperCase())));

            if (!isDefault) return prev;

            // Stable identity check: if content is identical, return same `prev` reference
            // so React bails out and doesn't trigger downstream URL sync effect → router.replace loop
            const prevSorted = [...prev].sort().join('|');
            const nextSorted = [...newMakes].sort().join('|');
            return prevSorted === nextSorted ? prev : newMakes;
        });
    }, [availableMakes, searchParams]);

    const [debouncedDownpayment, setDebouncedDownpayment] = useState(downpayment);
    const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(maxPrice);
    const [debouncedMaxEMI, setDebouncedMaxEMI] = useState(maxEMI);

    // Debounce slider updates for URL sync
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedDownpayment(downpayment);
            setDebouncedMaxPrice(maxPrice);
            setDebouncedMaxEMI(maxEMI);
        }, 500); // 500ms debounce for sliders
        return () => clearTimeout(timer);
    }, [downpayment, maxPrice, maxEMI]);

    // Defer URL update to post-hydration & wrap in startTransition so
    // the router.replace doesn't create a synchronous long task on first render.
    useEffect(() => {
        if (!isHydrated) return; // Never run during SSR or hydration render

        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (debouncedSearch) params.set('q', debouncedSearch);
            else params.delete('q');

            // Only set brand if it's not the full brands list (default)
            const selectedMakeSet = new Set(selectedMakes.map(m => m.toUpperCase()));
            const isAllMakesSelected =
                selectedMakes.length === 0 ||
                (availableMakes.length > 0 && availableMakes.every(m => selectedMakeSet.has(m.toUpperCase()))) ||
                (brands.length > 0 && brands.every(m => selectedMakeSet.has(m.toUpperCase())));

            if (isAllMakesSelected) {
                params.delete('brand');
            } else {
                params.set('brand', selectedMakes.join(','));
            }

            if (selectedFuels.length > 0) params.set('fuel', selectedFuels.join(','));
            else params.delete('fuel');
            if (selectedSegments.length > 0) params.set('segment', selectedSegments.join(','));
            else params.delete('segment');
            if (selectedBodyTypes.length > 0) params.set('category', selectedBodyTypes.join(','));
            else params.delete('category');
            if (selectedCC.length > 0) params.set('cc', selectedCC.join(','));
            else params.delete('cc');
            if (selectedFinishes.length > 0) params.set('finish', selectedFinishes.join(','));
            else params.delete('finish');

            if (debouncedDownpayment !== 0) params.set('dp', debouncedDownpayment.toString());
            else params.delete('dp');
            if (tenure !== 36) params.set('tenure', tenure.toString());
            else params.delete('tenure');
            if (debouncedMaxPrice < 1000000) params.set('maxPrice', debouncedMaxPrice.toString());
            else params.delete('maxPrice');
            if (debouncedMaxEMI < 20000) params.set('maxEMI', debouncedMaxEMI.toString());
            else params.delete('maxEMI');
            if (showOClubOnly) params.set('oclub', '1');
            else params.delete('oclub');
            if (pricingMode !== 'cash') params.set('mode', pricingMode);
            else params.delete('mode');

            if (offerMode !== 'BEST_OFFER') params.set('offer', offerMode);
            else params.delete('offer');

            const queryString = params.toString();
            if (queryString !== searchParams.toString()) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('[useCatalogFilters] Updating URL:', queryString);
                }
                const url = queryString ? `${pathname}?${queryString}` : pathname;
                router.replace(url, { scroll: false });
            }
        });
    }, [
        isHydrated,
        debouncedSearch,
        selectedMakes,
        selectedFuels,
        selectedSegments,
        selectedBodyTypes,
        selectedCC,
        selectedFinishes,
        debouncedDownpayment,
        tenure,
        debouncedMaxPrice,
        debouncedMaxEMI,
        showOClubOnly,
        availableMakes,
        pricingMode,
        offerMode,
    ]);

    // Deferred filter dependencies — React computes these in a low-priority frame
    // so the main thread yields to the browser between paint and filter compute.
    const deferredSearch = useDeferredValue(debouncedSearch);
    const deferredMakes = useDeferredValue(selectedMakes);
    const deferredFuels = useDeferredValue(selectedFuels);
    const deferredSegments = useDeferredValue(selectedSegments);
    const deferredBodyTypes = useDeferredValue(selectedBodyTypes);
    const deferredCC = useDeferredValue(selectedCC);
    const deferredBrakes = useDeferredValue(selectedBrakes);
    const deferredWheels = useDeferredValue(selectedWheels);
    const deferredConsole = useDeferredValue(selectedConsole);
    const deferredSeatHeight = useDeferredValue(selectedSeatHeight);
    const deferredWeights = useDeferredValue(selectedWeights);
    const deferredFinishes = useDeferredValue(selectedFinishes);
    const deferredMaxPrice = useDeferredValue(maxPrice);
    const deferredMaxEMI = useDeferredValue(maxEMI);
    const deferredDownpayment = useDeferredValue(downpayment);
    const deferredAvailableMakes = useDeferredValue(availableMakes);

    const filteredVehicles = useMemo(() => {
        const t0 = typeof performance !== 'undefined' ? performance.now() : 0;

        const normalizedSearch = deferredSearch.toLowerCase();
        const selectedMakeSet = new Set(deferredMakes.map(m => m.toUpperCase()));
        const isAllMakesSelected =
            deferredMakes.length === 0 ||
            (deferredAvailableMakes.length > 0 &&
                deferredAvailableMakes.every(m => selectedMakeSet.has(m.toUpperCase())));

        const result = initialVehicles.filter((v: ProductVariant) => {
            const matchesSearch = (v.make + ' ' + v.model + ' ' + v.variant).toLowerCase().includes(normalizedSearch);
            const normalizedMake = (v.make || '').toUpperCase();
            const matchesMake = isAllMakesSelected || selectedMakeSet.has(normalizedMake);

            const isElectric = v.model.toLowerCase().includes('electric') || v.fuelType === 'EV';
            const fuelType = v.fuelType === 'CNG' ? 'CNG' : isElectric ? 'Electric' : 'Petrol';
            const matchesFuel = deferredFuels.length === 0 || deferredFuels.includes(fuelType);

            const segment = v.segment || 'Commuter';
            const matchesSegment = deferredSegments.length === 0 || deferredSegments.includes(segment);

            const isVehicle = v.bodyType !== 'ACCESSORY' && v.bodyType !== 'SERVICE';
            const matchesBodyType =
                deferredBodyTypes.length === 0 ? isVehicle : v.bodyType && deferredBodyTypes.includes(v.bodyType);

            const displacement = v.displacement || 0;
            const ccTag =
                displacement < 125
                    ? '< 125cc'
                    : displacement < 250
                      ? '125-250cc'
                      : displacement < 500
                        ? '250-500cc'
                        : '> 500cc';
            const matchesCC = deferredCC.length === 0 || deferredCC.includes(ccTag);

            const frontBrake = (v.specifications as any)?.brakes?.front?.toLowerCase?.() || '';
            const rearBrake = (v.specifications as any)?.brakes?.rear?.toLowerCase?.() || '';
            const absText = (v.specifications?.features?.abs || '').toString().toLowerCase();
            const hasFrontDisc = frontBrake.includes('disc');
            const hasRearDisc = rearBrake.includes('disc');
            const hasAbs = absText.includes('abs');
            let brakeTag = 'All Drum';
            if (hasAbs && absText.includes('dual')) {
                brakeTag = 'Dual ABS';
            } else if (hasAbs && hasFrontDisc && hasRearDisc) {
                brakeTag = 'Front ABS Rear Disc';
            } else if (hasAbs && hasFrontDisc && !hasRearDisc) {
                brakeTag = 'Front ABS Rear Drum';
            } else if (hasFrontDisc && hasRearDisc) {
                brakeTag = 'Dual Disc';
            } else if (hasFrontDisc && !hasRearDisc) {
                brakeTag = 'Front Disc Rear Drum';
            }
            const matchesBrakes = deferredBrakes.length === 0 || deferredBrakes.includes(brakeTag);

            const wheelType = (v.specifications as any)?.wheels?.front?.toLowerCase?.().includes('alloy')
                ? 'Alloy'
                : 'Spoke';
            const matchesWheels = deferredWheels.length === 0 || deferredWheels.includes(wheelType);

            const consoleType = (v.specifications as any)?.console?.toLowerCase?.().includes('digital')
                ? 'Full Digital'
                : 'Analog';
            const matchesConsole = deferredConsole.length === 0 || deferredConsole.includes(consoleType);

            const seatHeight = parseInt(v.specifications?.dimensions?.seatHeight || '0');
            const seatHeightTag =
                seatHeight < 780 ? '< 780mm' : seatHeight >= 780 && seatHeight <= 810 ? '780-810mm' : '> 810mm';
            const matchesSeatHeight = deferredSeatHeight.length === 0 || deferredSeatHeight.includes(seatHeightTag);

            const weightRaw = parseInt(
                (v.specifications?.dimensions?.kerbWeight || v.specifications?.dimensions?.curbWeight || '0')
                    .toString()
                    .replace(/[^0-9]/g, '')
            );
            const weightTag =
                weightRaw > 0 && weightRaw < 110
                    ? '< 110kg'
                    : weightRaw >= 110 && weightRaw <= 140
                      ? '110-140kg'
                      : weightRaw > 140
                        ? '> 140kg'
                        : 'Unknown';
            const matchesWeight = deferredWeights.length === 0 || deferredWeights.includes(weightTag);

            const matchesFinish =
                deferredFinishes.length === 0 ||
                v.availableColors?.some(c => c.finish && deferredFinishes.includes(c.finish));

            const basePrice = v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;
            const matchesPrice = basePrice <= deferredMaxPrice;

            const calculatedEMI = Math.max(0, Math.round((basePrice - deferredDownpayment) * getEmiFactor(tenure)));
            const matchesEMI = calculatedEMI <= deferredMaxEMI;

            return (
                matchesSearch &&
                matchesMake &&
                matchesFuel &&
                matchesSegment &&
                matchesBodyType &&
                matchesCC &&
                matchesBrakes &&
                matchesWheels &&
                matchesConsole &&
                matchesSeatHeight &&
                matchesWeight &&
                matchesFinish &&
                matchesPrice &&
                matchesEMI &&
                (!showOClubOnly || (v.price?.offerPrice || 0) > 0)
            );
        });

        if (process.env.NODE_ENV !== 'production' && t0) {
            const elapsed = performance.now() - t0;
            if (elapsed > 5)
                console.log(
                    `[useCatalogFilters] filteredVehicles: ${elapsed.toFixed(1)}ms (${initialVehicles.length} → ${result.length})`
                );
        }

        return result;
    }, [
        initialVehicles,
        deferredSearch,
        deferredMakes,
        deferredFuels,
        deferredSegments,
        deferredBodyTypes,
        deferredCC,
        deferredBrakes,
        deferredWheels,
        deferredConsole,
        deferredSeatHeight,
        deferredWeights,
        deferredFinishes,
        deferredMaxPrice,
        deferredMaxEMI,
        showOClubOnly,
        deferredDownpayment,
        deferredAvailableMakes,
        tenure,
    ]);

    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));
    };

    const clearAll = () => {
        setSearchQuery('');
        setSelectedMakes(availableMakes);
        setSelectedFuels([]);
        setSelectedSegments([]);
        setSelectedBodyTypes([]);
        setSelectedCC([]);
        setSelectedBrakes([]);
        setSelectedWheels([]);
        setSelectedConsole([]);
        setSelectedSeatHeight([]);
        setSelectedWeights([]);
        setSelectedFinishes([]);
        setMaxPrice(1000000);
        setMaxEMI(20000);
        setDownpayment(0);
        setShowOClubOnly(false);
        setPricingMode('cash');
    };

    return {
        searchQuery,
        setSearchQuery,
        selectedMakes,
        setSelectedMakes,
        selectedFuels,
        setSelectedFuels,
        selectedSegments,
        setSelectedSegments,
        selectedBodyTypes,
        setSelectedBodyTypes,
        selectedCC,
        setSelectedCC,
        selectedBrakes,
        setSelectedBrakes,
        selectedWheels,
        setSelectedWheels,
        selectedConsole,
        setSelectedConsole,
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
        offerMode,
        setOfferMode,
        toggleFilter,
        clearAll,
    };
}
