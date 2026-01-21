'use client';

import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronDown, MapPin, Zap, X } from 'lucide-react';
import { BRANDS as defaultBrands } from '@/config/market';
import { ProductCard } from '@/components/store/CatalogDesktop';
import { createClient } from '@/lib/supabase/client';
import { resolveLocation } from '@/utils/locationResolver';
import { calculateDistance, HUB_LOCATION, MAX_SERVICEABLE_DISTANCE_KM } from '@/utils/geoUtils';

interface CatalogMobileProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters: any;
}

export function CatalogMobile({ filters }: CatalogMobileProps) {
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);

    const {
        searchQuery,
        setSearchQuery,
        selectedMakes,
        setSelectedMakes,
        selectedBodyTypes,
        setSelectedBodyTypes,
        selectedCC,
        setSelectedCC,
        downpayment,
        setDownpayment,
        tenure,
        setTenure,
        filteredVehicles,
        toggleFilter,
    } = filters;

    const [serviceability, setServiceability] = useState<{ status: 'loading' | 'serviceable' | 'unserviceable' | 'unset'; location?: string; distance?: number }>({ status: 'loading' });

    useEffect(() => {
        const checkServiceability = async () => {
            if (typeof window === 'undefined') return;
            const supabase = createClient();

            // Tier 1: Profile Pincode (Authenticated)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('aadhaar_pincode')
                    .eq('id', user.id)
                    .single();

                if (profile?.aadhaar_pincode) {
                    const resolved = await resolveLocation(profile.aadhaar_pincode);
                    if (resolved && resolved.lat && resolved.lng) {
                        const dist = calculateDistance(resolved.lat, resolved.lng, HUB_LOCATION.lat, HUB_LOCATION.lng);
                        setServiceability({
                            status: dist <= MAX_SERVICEABLE_DISTANCE_KM ? 'serviceable' : 'unserviceable',
                            location: resolved.city || resolved.district || profile.aadhaar_pincode,
                            distance: Math.round(dist)
                        });
                        return;
                    }
                }
            }

            // Tier 2: Local Storage
            const cached = localStorage.getItem('bkmb_user_pincode');
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    if (data.pincode) {
                        const isServiceable = ['110', '400', '401', '402', '411', '560', '600', '700', '500', '201', '122']
                            .some(prefix => data.pincode?.startsWith(prefix));

                        setServiceability({
                            status: isServiceable ? 'serviceable' : 'unserviceable',
                            location: data.city || data.pincode
                        });
                        return;
                    } else if (data.city) {
                        setServiceability({
                            status: 'unset',
                            location: data.city
                        });
                        return;
                    }
                } catch {
                    localStorage.removeItem('bkmb_user_pincode');
                }
            }

            // Tier 3: Browser Geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                        const data = await res.json();
                        const city = data.city || data.locality || data.principalSubdivision;

                        if (city && data.latitude && data.longitude) {
                            const dist = calculateDistance(data.latitude, data.longitude, HUB_LOCATION.lat, HUB_LOCATION.lng);
                            setServiceability({
                                status: dist <= MAX_SERVICEABLE_DISTANCE_KM ? 'serviceable' : 'unserviceable',
                                location: city,
                                distance: Math.round(dist)
                            });
                            localStorage.setItem('bkmb_user_pincode', JSON.stringify({
                                city,
                                lat: data.latitude,
                                lng: data.longitude,
                                manuallySet: false
                            }));
                        }
                    } catch (err) {
                        setServiceability({ status: 'unset' });
                    }
                }, () => {
                    setServiceability({ status: 'unset' });
                });
            } else {
                setServiceability({ status: 'unset' });
            }
        };
        checkServiceability();
    }, []);

    const makeOptions = (filters.availableMakes && filters.availableMakes.length > 0)
        ? filters.availableMakes
        : defaultBrands;


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FilterGroup = ({ title, options, selectedValues, onToggle }: any) => {
        const [isCollapsed, setIsCollapsed] = useState(false);
        return (
            <div className="space-y-4">
                <div
                    className="flex items-center justify-between py-2 cursor-pointer border-b border-slate-100 dark:border-white/5"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                        {title}
                    </h4>
                    <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                    />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {options.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => onToggle(opt)}
                                className={`px-4 py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${selectedValues.includes(opt) ? 'bg-brand-primary border-brand-primary text-black' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col space-y-4 bg-slate-50 dark:bg-[#0b0d10] py-4">
            {/* 1. Mobile Search - Toggleable Icon next to menu */}
            <div className={`fixed top-0 right-14 z-[60] h-20 flex items-center transition-all duration-500 ease-in-out ${isSearchActive ? 'left-4 w-[calc(100%-80px)]' : 'left-auto w-12'}`}>
                {isSearchActive ? (
                    <div className="relative w-full pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="SEARCH MACHINES..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onBlur={() => !searchQuery && setIsSearchActive(false)}
                            className="w-full pl-12 pr-10 h-11 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black tracking-widest outline-none shadow-2xl focus:ring-2 focus:ring-brand-primary/20 backdrop-blur-xl"
                        />
                        <button
                            onClick={() => {
                                setIsSearchActive(false);
                                setSearchQuery('');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsSearchActive(true)}
                        className="w-10 h-20 pointer-events-auto flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand-primary transition-all active:scale-90 ml-auto"
                    >
                        <Search size={18} strokeWidth={2.5} />
                    </button>
                )}
            </div>

            {/* Product Feed: 1 column for impact */}
            <div className="px-6 space-y-12">
                {filteredVehicles.map(
                    (
                        v: any // eslint-disable-line @typescript-eslint/no-explicit-any
                    ) => (
                        <ProductCard
                            key={v.id}
                            v={v}
                            viewMode="grid"
                            downpayment={downpayment}
                            tenure={tenure}
                            serviceability={serviceability}
                            isTv={false}
                        />
                    )
                )}
            </div>

            {/* Mobile Filter Drawer (Bottom Sheet) */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-[200]">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileFiltersOpen(false)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-black rounded-t-[3rem] p-8 space-y-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-black z-10 pb-4 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-xl font-black uppercase italic tracking-widest">Filter Machines</h3>
                            <button
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="text-[10px] font-black uppercase text-slate-400"
                            >
                                Close
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto space-y-8 pb-4">
                            {/* Finance Configuration */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Finance Configuration
                                </h4>
                                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl space-y-5 border border-slate-100 dark:border-white/5">
                                    {/* Downpayment */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Downpayment</span>
                                            <span className="text-lg font-black text-[#F5B301]">
                                                ₹{downpayment.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="5000"
                                            max="95000"
                                            step="5000"
                                            value={downpayment}
                                            onChange={e => setDownpayment(parseInt(e.target.value))}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #F5B301 0%, #F5B301 ${((downpayment - 5000) / (95000 - 5000)) * 100}%, rgba(255,255,255,0.1) ${((downpayment - 5000) / (95000 - 5000)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                                            }}
                                        />
                                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                                            <span>₹5k</span>
                                            <span>₹95k</span>
                                        </div>
                                    </div>

                                    {/* Tenure */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">EMI Tenure</span>
                                            <span className="text-sm font-black text-[#F5B301]">{tenure} Months</span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[12, 24, 36, 48, 60].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setTenure(t)}
                                                    className={`py-2.5 rounded-xl text-[10px] font-black transition-all ${tenure === t ? 'bg-[#F5B301] text-black shadow-lg shadow-[#F5B301]/20' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Brands */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Brands
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {makeOptions.map((brand: string) => {
                                        const isActive = selectedMakes.includes(brand.toUpperCase());
                                        return (
                                            <button
                                                key={brand}
                                                onClick={() => toggleFilter(setSelectedMakes, brand.toUpperCase())}
                                                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all ${isActive ? 'bg-[#F5B301] text-black shadow-lg shadow-[#F5B301]/20' : 'bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10'}`}
                                            >
                                                {brand}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CC Range */}
                            <FilterGroup
                                title="Engine Capacity"
                                options={['< 125cc', '125-160cc', '160-350cc', '350+ cc']}
                                selectedValues={selectedCC}
                                onToggle={(v: string) => toggleFilter(setSelectedCC, v)}
                            />

                            {/* Fuel Type */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Fuel Type
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {['PETROL', 'ELECTRIC'].map(fuel => (
                                        <button
                                            key={fuel}
                                            className="py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10"
                                        >
                                            {fuel}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mileage */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Mileage
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {['< 40 kmpl', '40-50 kmpl', '50-60 kmpl', '60+ kmpl'].map(m => (
                                        <button
                                            key={m}
                                            className="py-3 rounded-xl text-[9px] font-black uppercase tracking-wide bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10"
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Seat Height */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Seat Height
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {['< 750 mm', '750-800 mm', '800-850 mm', '850+ mm'].map(h => (
                                        <button
                                            key={h}
                                            className="py-3 rounded-xl text-[9px] font-black uppercase tracking-wide bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10"
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Weight */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Kerb Weight
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {['< 100 kg', '100-120 kg', '120-150 kg', '150+ kg'].map(w => (
                                        <button
                                            key={w}
                                            className="py-3 rounded-xl text-[9px] font-black uppercase tracking-wide bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10"
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Apply Button */}
                        <button
                            onClick={() => setIsMobileFiltersOpen(false)}
                            className="w-full py-4 bg-[#F5B301] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_8px_30px_rgba(245,179,1,0.3)]"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* 3. Floating Filter FAB */}
            <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-[#F5B301] text-black rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(245,179,1,0.4)] active:scale-95 transition-all"
            >
                <SlidersHorizontal size={20} />
            </button>
        </div>
    );
}
