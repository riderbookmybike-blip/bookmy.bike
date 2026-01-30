'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, DollarSign, Zap, Gauge } from 'lucide-react';

interface MobileFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const BRANDS = ['Honda', 'Yamaha', 'Suzuki', 'Royal Enfield', 'Bajaj', 'TVS', 'Hero', 'KTM'];
const PRICE_PRESETS = [
    { label: 'Under ₹50K', min: 0, max: 50000 },
    { label: '₹50K - ₹1L', min: 50000, max: 100000 },
    { label: '₹1L - ₹2L', min: 100000, max: 200000 },
    { label: 'Above ₹2L', min: 200000, max: 500000 },
];

export const MobileFilterModal: React.FC<MobileFilterModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(500000);
    const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [mileage, setMileage] = useState(30);

    // Load filters from URL on mount
    useEffect(() => {
        const min = searchParams.get('price_min');
        const max = searchParams.get('price_max');
        const fuels = searchParams.get('fuel');
        const brands = searchParams.get('brands');
        const mil = searchParams.get('mileage');

        if (min) setPriceMin(parseInt(min));
        if (max) setPriceMax(parseInt(max));
        if (fuels) setSelectedFuelTypes(fuels.split(','));
        if (brands) setSelectedBrands(brands.split(','));
        if (mil) setMileage(parseInt(mil));
    }, [searchParams]);

    const toggleFuelType = (fuel: string) => {
        setSelectedFuelTypes((prev) =>
            prev.includes(fuel) ? prev.filter((f) => f !== fuel) : [...prev, fuel]
        );
    };

    const toggleBrand = (brand: string) => {
        setSelectedBrands((prev) =>
            prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
        );
    };

    const applyPricePreset = (preset: typeof PRICE_PRESETS[0]) => {
        setPriceMin(preset.min);
        setPriceMax(preset.max);
    };

    const clearAllFilters = () => {
        setPriceMin(0);
        setPriceMax(500000);
        setSelectedFuelTypes([]);
        setSelectedBrands([]);
        setMileage(30);
    };

    const applyFilters = () => {
        const params = new URLSearchParams();

        // Only add params if they're not default values
        if (priceMin > 0) params.set('price_min', priceMin.toString());
        if (priceMax < 500000) params.set('price_max', priceMax.toString());
        if (selectedFuelTypes.length > 0) params.set('fuel', selectedFuelTypes.join(','));
        if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
        if (mileage > 30) params.set('mileage', mileage.toString());

        // Remove filter trigger param
        params.delete('filter');

        router.push(`${pathname}?${params.toString()}`);
        onClose();
    };

    const activeFilterCount =
        (priceMin > 0 || priceMax < 500000 ? 1 : 0) +
        selectedFuelTypes.length +
        selectedBrands.length +
        (mileage > 30 ? 1 : 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-x-0 bottom-0 max-h-[90vh] bg-zinc-950 rounded-t-3xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 px-5 py-4 rounded-t-3xl">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#F4B000]/10 rounded-full flex items-center justify-center">
                                        <SlidersHorizontal size={20} className="text-[#F4B000]" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                                        Filters
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                                >
                                    <X size={20} className="text-zinc-400" />
                                </button>
                            </div>
                            {activeFilterCount > 0 && (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-zinc-500 font-medium">
                                        {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                                    </p>
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-sm font-bold text-[#F4B000] hover:text-yellow-400 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
                            {/* Price Range */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <DollarSign size={18} className="text-[#F4B000]" />
                                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                                        Price Range
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {PRICE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => applyPricePreset(preset)}
                                            className={`px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${priceMin === preset.min && priceMax === preset.max
                                                    ? 'bg-[#F4B000] text-black'
                                                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2 block">
                                            Min Price
                                        </label>
                                        <input
                                            type="number"
                                            value={priceMin}
                                            onChange={(e) => setPriceMin(parseInt(e.target.value) || 0)}
                                            className="w-full h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#F4B000]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2 block">
                                            Max Price
                                        </label>
                                        <input
                                            type="number"
                                            value={priceMax}
                                            onChange={(e) => setPriceMax(parseInt(e.target.value) || 500000)}
                                            className="w-full h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#F4B000]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Fuel Type */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap size={18} className="text-[#138808]" />
                                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                                        Fuel Type
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {FUEL_TYPES.map((fuel) => (
                                        <button
                                            key={fuel}
                                            onClick={() => toggleFuelType(fuel)}
                                            className={`px-5 py-3 rounded-full font-bold text-sm transition-all active:scale-95 ${selectedFuelTypes.includes(fuel)
                                                    ? 'bg-[#138808] text-white'
                                                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                                                }`}
                                        >
                                            {fuel}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brand */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                                        Brand
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {BRANDS.map((brand) => (
                                        <label
                                            key={brand}
                                            className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand)}
                                                onChange={() => toggleBrand(brand)}
                                                className="w-5 h-5 rounded bg-zinc-800 border-2 border-zinc-700 checked:bg-[#F4B000] checked:border-[#F4B000] cursor-pointer"
                                            />
                                            <span className="text-sm font-bold text-zinc-300">{brand}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Mileage */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Gauge size={18} className="text-[#F4B000]" />
                                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                                        Min Mileage
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="range"
                                        min="30"
                                        max="80"
                                        step="5"
                                        value={mileage}
                                        onChange={(e) => setMileage(parseInt(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F4B000]"
                                    />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-zinc-600 font-medium">30 km/l</span>
                                        <span className="text-2xl font-black text-white">{mileage} km/l</span>
                                        <span className="text-sm text-zinc-600 font-medium">80 km/l</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="sticky bottom-0 bg-zinc-950 border-t border-zinc-800 p-5">
                            <button
                                onClick={applyFilters}
                                className="w-full h-14 bg-[#F4B000] rounded-xl font-black uppercase tracking-wider text-black text-sm active:scale-95 transition-transform shadow-lg shadow-[#F4B000]/20"
                            >
                                Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
