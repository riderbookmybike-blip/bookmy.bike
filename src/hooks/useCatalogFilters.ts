'use client';

import { useState, useMemo, useEffect } from 'react';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { useSearchParams } from 'next/navigation';

export const brands = ['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'SUZUKI', 'YAMAHA', 'KTM', 'HERO', 'TRIUMPH', 'APRILIA'];

export function useCatalogFilters() {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMakes, setSelectedMakes] = useState<string[]>(brands);
    const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
    const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
    const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
    const [selectedCC, setSelectedCC] = useState<string[]>([]);
    const [selectedBrakes, setSelectedBrakes] = useState<string[]>([]);
    const [selectedWheels, setSelectedWheels] = useState<string[]>([]);
    const [selectedConsole, setSelectedConsole] = useState<string[]>([]);
    const [selectedSeatHeight, setSelectedSeatHeight] = useState<string[]>([]);

    // Dynamic EMI States
    const [downpayment, setDownpayment] = useState(15000);
    const [tenure, setTenure] = useState(36);

    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setSelectedBodyTypes([categoryParam.toUpperCase()]);
        }

        const brandParam = searchParams.get('brand');
        if (brandParam) {
            setSelectedMakes([brandParam.toUpperCase()]);
        }
    }, [searchParams]);

    const filteredVehicles = useMemo(() => {
        return MOCK_VEHICLES.filter(v => {
            const matchesSearch = (v.make + ' ' + v.model + ' ' + v.variant).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesMake = selectedMakes.includes(v.make.toUpperCase());

            const isElectric = v.model.toLowerCase().includes('electric') || v.specifications?.battery?.range !== 'N/A';
            const fuelType = isElectric ? 'Electric' : 'Petrol';
            const matchesFuel = selectedFuels.length === 0 || selectedFuels.includes(fuelType);

            const segment = v.make === 'Royal Enfield' ? 'Cruiser' : (v.specifications?.engine?.displacement?.includes('350') ? 'Sport' : 'Commuter');
            const matchesSegment = selectedSegments.length === 0 || selectedSegments.includes(segment);

            const matchesBodyType = selectedBodyTypes.length === 0 || (v.bodyType && selectedBodyTypes.includes(v.bodyType));

            const displacement = parseInt(v.specifications?.engine?.displacement || '0');
            const ccTag = displacement < 125 ? '< 125cc' : (displacement < 250 ? '125-250cc' : (displacement < 500 ? '250-500cc' : '> 500cc'));
            const matchesCC = selectedCC.length === 0 || selectedCC.includes(ccTag);

            const brakeType = v.specifications?.brakes?.front?.toLowerCase().includes('disc') ? 'Disc (Front)' : 'Drum';
            const matchesBrakes = selectedBrakes.length === 0 || selectedBrakes.includes(brakeType);

            const wheelType = v.specifications?.wheels?.front?.toLowerCase().includes('alloy') ? 'Alloy' : 'Spoke';
            const matchesWheels = selectedWheels.length === 0 || selectedWheels.includes(wheelType);

            const consoleType = v.specifications?.console?.toLowerCase().includes('digital') ? 'Full Digital' : 'Analog';
            const matchesConsole = selectedConsole.length === 0 || selectedConsole.includes(consoleType);

            const seatHeight = parseInt(v.specifications?.dimensions?.seatHeight || '0');
            const seatHeightTag = seatHeight < 780 ? '< 780mm' : (seatHeight >= 780 && seatHeight <= 810 ? '780-810mm' : '> 810mm');
            const matchesSeatHeight = selectedSeatHeight.length === 0 || selectedSeatHeight.includes(seatHeightTag);

            return matchesSearch && matchesMake && matchesFuel && matchesSegment && matchesBodyType && matchesCC && matchesBrakes && matchesWheels && matchesConsole && matchesSeatHeight;
        });
    }, [searchQuery, selectedMakes, selectedFuels, selectedSegments, selectedBodyTypes, selectedCC, selectedBrakes, selectedWheels, selectedConsole, selectedSeatHeight]);

    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    };

    return {
        searchQuery, setSearchQuery,
        selectedMakes, setSelectedMakes,
        selectedFuels, setSelectedFuels,
        selectedSegments, setSelectedSegments,
        selectedBodyTypes, setSelectedBodyTypes,
        selectedCC, setSelectedCC,
        selectedBrakes, setSelectedBrakes,
        selectedWheels, setSelectedWheels,
        selectedConsole, setSelectedConsole,
        selectedSeatHeight, setSelectedSeatHeight,
        downpayment, setDownpayment,
        tenure, setTenure,
        filteredVehicles,
        toggleFilter
    };
}
