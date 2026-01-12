'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { Filter, ChevronDown, Zap, Search, SlidersHorizontal, Heart, Star, X } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/utils/slugs';
import { useSearchParams } from 'next/navigation';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import LoginSidebar from '@/components/auth/LoginSidebar';
import { TenantProvider } from '@/lib/tenant/tenantContext';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';

function CatalogContent() {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
    const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
    const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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

    // Filter States
    const brands = ['HONDA', 'TVS', 'ROYAL ENFIELD', 'BAJAJ', 'SUZUKI', 'YAMAHA', 'KTM', 'HERO', 'TRIUMPH', 'APRILIA'];
    const [selectedMakes, setSelectedMakes] = useState<string[]>(brands);
    const [selectedCC, setSelectedCC] = useState<string[]>([]);
    const [selectedBrakes, setSelectedBrakes] = useState<string[]>([]);
    const [selectedWheels, setSelectedWheels] = useState<string[]>([]);
    const [selectedConsole, setSelectedConsole] = useState<string[]>([]);
    const [selectedSeatHeight, setSelectedSeatHeight] = useState<string[]>([]);

    // Filter Logic
    const filteredVehicles = React.useMemo(() => {
        return MOCK_VEHICLES.filter(v => {
            const matchesSearch = (v.make + ' ' + v.model + ' ' + v.variant).toLowerCase().includes(searchQuery.toLowerCase());

            // Brand/Make Elimination Logic: Show only if it's in the selectedMakes list
            const matchesMake = selectedMakes.includes(v.make.toUpperCase());

            const isElectric = v.model.toLowerCase().includes('electric') || v.specifications?.battery?.range !== 'N/A';
            const fuelType = isElectric ? 'Electric' : 'Petrol';
            const matchesFuel = selectedFuels.length === 0 || selectedFuels.includes(fuelType);

            const segment = v.make === 'Royal Enfield' ? 'Cruiser' : (v.specifications?.engine?.displacement?.includes('350') ? 'Sport' : 'Commuter');
            const matchesSegment = selectedSegments.length === 0 || selectedSegments.includes(segment);

            // Body Type Filter
            const matchesBodyType = selectedBodyTypes.length === 0 || (v.bodyType && selectedBodyTypes.includes(v.bodyType));

            // CC / Technical Filters (Mocked matching for now based on vehicle IDs for demo variety)
            const displacement = parseInt(v.specifications?.engine?.displacement || '0');
            const ccTag = displacement < 125 ? '< 125cc' : (displacement < 250 ? '125-250cc' : (displacement < 500 ? '250-500cc' : '> 500cc'));
            const matchesCC = selectedCC.length === 0 || selectedCC.includes(ccTag);

            // Mocked Brakes filter
            const brakeType = v.specifications?.brakes?.front?.toLowerCase().includes('disc') ? 'Disc (Front)' : 'Drum';
            const matchesBrakes = selectedBrakes.length === 0 || selectedBrakes.includes(brakeType);

            // Mocked Wheels filter
            const wheelType = v.specifications?.wheels?.front?.toLowerCase().includes('alloy') ? 'Alloy' : 'Spoke';
            const matchesWheels = selectedWheels.length === 0 || selectedWheels.includes(wheelType);

            // Mocked Console filter
            const consoleType = v.specifications?.console?.toLowerCase().includes('digital') ? 'Full Digital' : 'Analog';
            const matchesConsole = selectedConsole.length === 0 || selectedConsole.includes(consoleType);

            // Mocked Seat Height filter
            const seatHeight = parseInt(v.specifications?.dimensions?.seatHeight || '0');
            const seatHeightTag = seatHeight < 780 ? '< 780mm' : (seatHeight >= 780 && seatHeight <= 810 ? '780-810mm' : '> 810mm');
            const matchesSeatHeight = selectedSeatHeight.length === 0 || selectedSeatHeight.includes(seatHeightTag);

            return matchesSearch && matchesMake && matchesFuel && matchesSegment && matchesBodyType && matchesCC && matchesBrakes && matchesWheels && matchesConsole && matchesSeatHeight;
        });
    }, [searchQuery, selectedMakes, selectedFuels, selectedSegments, selectedBodyTypes, selectedCC, selectedBrakes, selectedWheels, selectedConsole, selectedSeatHeight]);

    const toggleMake = (make: string) => {
        setSelectedMakes(prev => prev.includes(make) ? prev.filter(m => m !== make) : [...prev, make]);
    };

    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    };

    // Helper Component for Collapsable Groups
    const FilterGroup = ({ title, options, selectedValues, onToggle, showReset = false, onReset }: any) => {
        const [isCollapsed, setIsCollapsed] = useState(false);
        const [isExpanded, setIsExpanded] = useState(false);
        const visibleOptions = isExpanded ? options : options.slice(0, 3);

        return (
            <div className="space-y-6">
                <div
                    className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4 cursor-pointer group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full transition-colors ${selectedValues.length > 0 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        {title}
                    </h4>
                    <div className="flex items-center gap-3">
                        {showReset && selectedValues.length > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onReset(); }}
                                className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >Reset</button>
                        )}
                        <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 transition-transform duration-300 group-hover:text-blue-500" />
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 gap-2">
                            {visibleOptions.map((opt: string) => (
                                <button
                                    key={opt}
                                    onClick={() => onToggle(opt)}
                                    className={`group relative flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${selectedValues.includes(opt) ? 'bg-blue-600/10 border-blue-500/50' : 'bg-transparent border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
                                >
                                    <span className={`text-[9px] font-black uppercase tracking-widest italic transition-colors ${selectedValues.includes(opt) ? 'text-blue-600 dark:text-white' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300'}`}>{opt}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${selectedValues.includes(opt) ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                                </button>
                            ))}
                        </div>
                        {options.length > 3 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 transition-colors w-full text-center py-1 border border-dashed border-slate-200 dark:border-white/5 rounded-md"
                            >
                                {isExpanded ? 'Show Less' : `+ Show ${options.length - 3} More`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-4 md:py-8 space-y-8 md:space-y-12 bg-white dark:bg-[#020617] transition-colors duration-500">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md">R&D CLONE</div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase">STORE EXPERIMENT</h1>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">A direct clone of the production store for exploration and rapid prototyping.</p>
            </div>

            {/* 1. Auto-Scrolling Brand Ribbon */}
            <div className="relative py-8 border-b border-slate-200 dark:border-white/5 overflow-hidden group">
                <div className="flex whitespace-nowrap animate-marquee gap-16 md:gap-24 opacity-100 transition-opacity">
                    {[...brands, ...brands].map((brand, i) => (
                        <button
                            key={i}
                            onClick={() => toggleMake(brand)}
                            className={`text-xl md:text-4xl font-black italic tracking-tighter uppercase transition-all duration-500 ${selectedMakes.includes(brand) ? 'text-blue-600 dark:text-white scale-110' : 'text-slate-300 dark:text-slate-800 scale-90 opacity-40 hover:opacity-100'}`}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white dark:from-[#020617] to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white dark:from-[#020617] to-transparent z-10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 md:gap-16">
                <aside className="space-y-10 hidden lg:block">
                    <div className="space-y-10 p-8 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                        {/* EMI Calculator */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-green-500" />
                                EMI Calculator
                            </h4>
                            <div className="space-y-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Downpayment</span>
                                        <span className="text-sm font-black text-green-600">₹{downpayment.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range" min="5000" max="75000" step="5000"
                                        value={downpayment} onChange={(e) => setDownpayment(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 appearance-none cursor-pointer accent-green-600"
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[12, 24, 36, 48].map((t) => (
                                        <button key={t} onClick={() => setTenure(t)} className={`py-2 rounded-lg text-[10px] font-black transition-all ${tenure === t ? 'bg-green-600 text-white' : 'bg-white dark:bg-white/5'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text" placeholder="FIND MACHINE..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="space-y-10">
                            <FilterGroup title="Engine Capacity" options={['< 125cc', '125-250cc', '250-500cc', '> 500cc']} selectedValues={selectedCC} onToggle={(v: string) => toggleFilter(setSelectedCC, v)} onReset={() => setSelectedCC([])} showReset />
                            <FilterGroup title="Braking" options={['Drum', 'Disc (Front)', 'Disc (Rear)', 'Single ABS', 'Dual ABS', 'CBS']} selectedValues={selectedBrakes} onToggle={(v: string) => toggleFilter(setSelectedBrakes, v)} onReset={() => setSelectedBrakes([])} showReset />
                        </div>
                    </div>
                </aside>

                <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredVehicles.map((v, idx) => (
                            <div key={v.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col">
                                <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-6 relative">
                                    <div className="w-10 h-10 absolute top-4 right-4 bg-white/80 dark:bg-black/40 rounded-full flex items-center justify-center"><Heart className="w-4 h-4" /></div>
                                    <span className="font-black text-[10px] text-slate-300 uppercase tracking-[0.5em]">{v.model}</span>
                                </div>
                                <div className="p-6 space-y-5 flex-1 flex flex-col">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{v.make}</p>
                                        <h3 className="text-xl font-black uppercase italic tracking-tighter">{v.model}</h3>
                                    </div>
                                    <Link href={`/store/${slugify(v.make)}/${slugify(v.model)}/${slugify(v.variant)}`} className="w-full py-4 bg-red-600 text-white rounded-xl text-center text-[10px] font-black uppercase tracking-[0.2em]">View Details</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StoreRnDContent() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <TenantProvider>
            <FavoritesProvider>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-red-500/30 transition-colors duration-300">
                    <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />

                    <main className="flex-1 pt-24">
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Initializing R&D Systems...</div>}>
                            <CatalogContent />
                        </Suspense>
                    </main>

                    <MarketplaceFooter />

                    <LoginSidebar
                        isOpen={isLoginOpen}
                        onClose={() => setIsLoginOpen(false)}
                        variant="RETAIL"
                    />
                </div>
            </FavoritesProvider>
        </TenantProvider>
    );
}

export default function StoreRnDPage() {
    return <StoreRnDContent />;
}
