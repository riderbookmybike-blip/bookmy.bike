'use client';

import { useState, useMemo, useEffect } from 'react';
import { ProductVariant } from '@/types/productMaster';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

import { BRANDS as brands } from '@/config/market';
export { brands };

export function useCatalogFilters(initialVehicles: ProductVariant[] = []) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
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

    // Dynamic EMI States
    const [downpayment, _setDownpayment] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('bkmb_downpayment');
            if (stored) return parseInt(stored);
        }
        const dp = searchParams.get('dp');
        return dp ? parseInt(dp) : 15000;
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
            if (prev.length === 0) return availableMakes;

            const prevSet = new Set(prev.map(m => m.toUpperCase()));
            const defaultSet = new Set(brands.map(m => m.toUpperCase()));

            // If prev matches default brands or is identical to currently available makes, update it
            const isDefault =
                (prev.length === brands.length && brands.every(m => prevSet.has(m.toUpperCase()))) ||
                (prev.length === availableMakes.length && availableMakes.every(m => prevSet.has(m.toUpperCase())));

            return isDefault ? availableMakes : prev;
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

    // Update URL when filters change
    useEffect(() => {
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

        // Use debounced values for URL to prevent spamming history/analytics
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

        const queryString = params.toString();
        if (queryString !== searchParams.toString()) {
            console.log('[useCatalogFilters] Updating URL:', queryString);
            const url = queryString ? `${pathname}?${queryString}` : pathname;
            router.replace(url, { scroll: false });
        }
    }, [
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
    ]);

    const filteredVehicles = useMemo(() => {
        return initialVehicles.filter((v: ProductVariant) => {
            const matchesSearch = (v.make + ' ' + v.model + ' ' + v.variant)
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase());
            const normalizedMake = (v.make || '').toUpperCase();
            const selectedMakeSet = new Set(selectedMakes.map(m => m.toUpperCase()));
            const isAllMakesSelected =
                selectedMakes.length === 0 ||
                (availableMakes.length > 0 && availableMakes.every(m => selectedMakeSet.has(m.toUpperCase())));
            const matchesMake = isAllMakesSelected || selectedMakeSet.has(normalizedMake);

            const isElectric = v.model.toLowerCase().includes('electric') || v.fuelType === 'EV';
            const fuelType = v.fuelType === 'CNG' ? 'CNG' : isElectric ? 'Electric' : 'Petrol';
            const matchesFuel = selectedFuels.length === 0 || selectedFuels.includes(fuelType);

            const segment = v.segment || 'Commuter';
            const matchesSegment = selectedSegments.length === 0 || selectedSegments.includes(segment);

            const isVehicle = v.bodyType !== 'ACCESSORY' && v.bodyType !== 'SERVICE';

            // Default: hide accessories/services unless explicitly filtered in body type
            const matchesBodyType =
                selectedBodyTypes.length === 0 ? isVehicle : v.bodyType && selectedBodyTypes.includes(v.bodyType);

            const displacement = v.displacement || 0;
            const ccTag =
                displacement < 125
                    ? '< 125cc'
                    : displacement < 250
                        ? '125-250cc'
                        : displacement < 500
                            ? '250-500cc'
                            : '> 500cc';
            const matchesCC = selectedCC.length === 0 || selectedCC.includes(ccTag);

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
            const matchesBrakes = selectedBrakes.length === 0 || selectedBrakes.includes(brakeTag);

            const wheelType = (v.specifications as any)?.wheels?.front?.toLowerCase().includes('alloy')
                ? 'Alloy'
                : 'Spoke';
            const matchesWheels = selectedWheels.length === 0 || selectedWheels.includes(wheelType);

            const consoleType = (v.specifications as any)?.console?.toLowerCase().includes('digital')
                ? 'Full Digital'
                : 'Analog';
            const matchesConsole = selectedConsole.length === 0 || selectedConsole.includes(consoleType);

            const seatHeight = parseInt(v.specifications?.dimensions?.seatHeight || '0');
            const seatHeightTag =
                seatHeight < 780 ? '< 780mm' : seatHeight >= 780 && seatHeight <= 810 ? '780-810mm' : '> 810mm';
            const matchesSeatHeight = selectedSeatHeight.length === 0 || selectedSeatHeight.includes(seatHeightTag);

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
            const matchesWeight = selectedWeights.length === 0 || selectedWeights.includes(weightTag);

            const matchesFinish =
                selectedFinishes.length === 0 ||
                v.availableColors?.some(c => c.finish && selectedFinishes.includes(c.finish));

            const basePrice = v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;
            const matchesPrice = basePrice <= maxPrice;

            const calculatedEMI = Math.max(0, Math.round((basePrice - downpayment) * 0.035));
            const matchesEMI = calculatedEMI <= maxEMI;

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
                (!showOClubOnly || (v.price?.offerPrice || 0) > 0) // Example logic: O'Club items usually have offers
            );
        });
    }, [
        initialVehicles,
        debouncedSearch,
        selectedMakes,
        selectedFuels,
        selectedSegments,
        selectedBodyTypes,
        selectedCC,
        selectedBrakes,
        selectedWheels,
        selectedConsole,
        selectedSeatHeight,
        selectedWeights,
        selectedFinishes,
        maxPrice,
        maxEMI,
        maxEMI,
        showOClubOnly,
        downpayment, // Added dependency for EMI calculation
        availableMakes,
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
        setMaxPrice(1000000);
        setMaxEMI(20000);
        setDownpayment(0);
        setShowOClubOnly(false);
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
        toggleFilter,
        clearAll,
    };
}
