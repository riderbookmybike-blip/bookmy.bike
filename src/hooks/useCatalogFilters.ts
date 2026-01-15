'use client';

import { useState, useMemo, useEffect } from 'react';
import { ProductVariant } from '@/types/productMaster';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

import { BRANDS as brands } from '@/config/market';

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

    // Initialize filters from searchParams
    const [selectedMakes, setSelectedMakes] = useState<string[]>(() => {
        const brandParam = searchParams.get('brand');
        return brandParam ? brandParam.toUpperCase().split(',') : brands;
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
    const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
    const [maxPrice, setMaxPrice] = useState<number>(1000000); // 10 Lakh default
    const [maxEMI, setMaxEMI] = useState<number>(20000); // 20k default

    // Dynamic EMI States
    const [downpayment, setDownpayment] = useState(() => {
        const dp = searchParams.get('dp');
        return dp ? parseInt(dp) : 15000;
    });
    const [tenure, setTenure] = useState(() => {
        const t = searchParams.get('tenure');
        return t ? parseInt(t) : 36;
    });

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedSearch) params.set('q', debouncedSearch);
        else params.delete('q');

        // Only set brand if it's not the full brands list (default)
        if (selectedMakes.length > 0 && selectedMakes.length < brands.length) {
            params.set('brand', selectedMakes.join(','));
        } else {
            params.delete('brand');
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
        if (downpayment !== 15000) params.set('dp', downpayment.toString());
        else params.delete('dp');
        if (tenure !== 36) params.set('tenure', tenure.toString());
        else params.delete('tenure');
        if (maxPrice < 1000000) params.set('maxPrice', maxPrice.toString());
        else params.delete('maxPrice');
        if (maxEMI < 20000) params.set('maxEMI', maxEMI.toString());
        else params.delete('maxEMI');

        const queryString = params.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;

        // Use replace to avoid filling up history stack during typing/sliding
        router.replace(url, { scroll: false });
    }, [
        debouncedSearch,
        selectedMakes,
        selectedFuels,
        selectedSegments,
        selectedBodyTypes,
        selectedCC,
        selectedFinishes,
        downpayment,
        tenure,
        pathname,
        router,
    ]);

    const filteredVehicles = useMemo(() => {
        return initialVehicles.filter((v: ProductVariant) => {
            const matchesSearch = (v.make + ' ' + v.model + ' ' + v.variant)
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase());
            const matchesMake = selectedMakes.includes(v.make.toUpperCase());

            const isElectric = v.model.toLowerCase().includes('electric') || v.fuelType === 'ELECTRIC';
            const fuelType = isElectric ? 'Electric' : 'Petrol';
            const matchesFuel = selectedFuels.length === 0 || selectedFuels.includes(fuelType);

            const segment = v.segment || 'Commuter';
            const matchesSegment = selectedSegments.length === 0 || selectedSegments.includes(segment);

            const matchesBodyType =
                selectedBodyTypes.length === 0 || (v.bodyType && selectedBodyTypes.includes(v.bodyType));

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

            const brakeType = v.specifications?.brakes?.front?.toLowerCase().includes('disc') ? 'Disc (Front)' : 'Drum';
            const matchesBrakes = selectedBrakes.length === 0 || selectedBrakes.includes(brakeType);

            const wheelType = v.specifications?.wheels?.front?.toLowerCase().includes('alloy') ? 'Alloy' : 'Spoke';
            const matchesWheels = selectedWheels.length === 0 || selectedWheels.includes(wheelType);

            const consoleType = v.specifications?.console?.toLowerCase().includes('digital')
                ? 'Full Digital'
                : 'Analog';
            const matchesConsole = selectedConsole.length === 0 || selectedConsole.includes(consoleType);

            const seatHeight = parseInt(v.specifications?.dimensions?.seatHeight || '0');
            const seatHeightTag =
                seatHeight < 780 ? '< 780mm' : seatHeight >= 780 && seatHeight <= 810 ? '780-810mm' : '> 810mm';
            const matchesSeatHeight = selectedSeatHeight.length === 0 || selectedSeatHeight.includes(seatHeightTag);

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
                matchesFinish &&
                matchesPrice &&
                matchesEMI
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
        selectedFinishes,
        maxPrice,
        maxEMI,
        downpayment, // Added dependency for EMI calculation
    ]);

    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));
    };

    const clearAll = () => {
        setSearchQuery('');
        setSelectedMakes(brands);
        setSelectedFuels([]);
        setSelectedSegments([]);
        setSelectedBodyTypes([]);
        setSelectedCC([]);
        setSelectedBrakes([]);
        setSelectedWheels([]);
        setSelectedConsole([]);
        setSelectedSeatHeight([]);
        setSelectedFinishes([]);
        setMaxPrice(1000000);
        setMaxEMI(20000);
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
        filteredVehicles,
        toggleFilter,
        clearAll,
    };
}
