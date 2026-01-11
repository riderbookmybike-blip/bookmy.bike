'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { Filter, ChevronDown, Zap, Search, SlidersHorizontal, Heart, Star } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/utils/slugs';
import { useSearchParams } from 'next/navigation';

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

            // Tech Filters (Mocked matching for now based on vehicle IDs for demo variety)
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
        // Elimination logic: Toggle between all and specific. 
        // If it was already in selectedMakes, remove it. If not, add it.
        setSelectedMakes(prev => prev.includes(make) ? prev.filter(m => m !== make) : [...prev, make]);
    };

    const toggleFuel = (fuel: string) => {
        setSelectedFuels(prev => prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]);
    };

    const toggleSegment = (segment: string) => {
        setSelectedSegments(prev => prev.includes(segment) ? prev.filter(s => s !== segment) : [...prev, segment]);
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
                    className="flex items-center justify-between border-b border-white/5 pb-4 cursor-pointer group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full transition-colors ${selectedValues.length > 0 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700'}`} />
                        {title}
                    </h4>
                    <div className="flex items-center gap-3">
                        {showReset && selectedValues.length > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onReset(); }}
                                className="text-[9px] font-black uppercase text-blue-500 hover:text-white transition-colors"
                            >Reset</button>
                        )}
                        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 gap-2">
                            {visibleOptions.map((opt: string) => (
                                <button
                                    key={opt}
                                    onClick={() => onToggle(opt)}
                                    className={`group relative flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${selectedValues.includes(opt) ? 'bg-blue-600/10 border-blue-500/50' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                                >
                                    <span className={`text-[9px] font-black uppercase tracking-widest italic transition-colors ${selectedValues.includes(opt) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{opt}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${selectedValues.includes(opt) ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-800'}`} />
                                </button>
                            ))}
                        </div>
                        {options.length > 3 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-500 transition-colors w-full text-center py-1 border border-dashed border-white/5 rounded-md"
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
            {/* 1. Auto-Scrolling Brand elimination Ribbon */}
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

            {/* 2. Mobile Filter Trigger (Mobile Only) */}
            <div className="lg:hidden flex items-center justify-between bg-white/[0.03] border border-white/5 p-6 rounded-3xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <SlidersHorizontal size={18} className="text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] italic text-white">Refine Machine</span>
                        <span className="block text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">Technical Specifications</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all italic"
                >
                    Filters
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 md:gap-16">
                {/* 2. Advanced Sidebar HUD */}
                <aside className="space-y-10 hidden lg:block animate-in slide-in-from-left-8 duration-700">
                    <div className="space-y-10 p-8 bg-white/[0.03] border border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -z-10" />

                        {/* Search HUD */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                                    Telemetry Search
                                </h4>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="FIND MACHINE..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* Technical Filters with progressive disclosure */}
                            <FilterGroup
                                title="Make"
                                options={brands}
                                selectedValues={selectedMakes}
                                onToggle={(v: string) => toggleMake(v)}
                                onReset={() => setSelectedMakes([])}
                                showReset
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
                                title="Brake System"
                                options={['Drum', 'Disc (Front)', 'Disc (Rear)', 'Single ABS', 'Dual ABS', 'CBS']}
                                selectedValues={selectedBrakes}
                                onToggle={(v: string) => toggleFilter(setSelectedBrakes, v)}
                                onReset={() => setSelectedBrakes([])}
                                showReset
                            />

                            <FilterGroup
                                title="Wheel Type"
                                options={['Alloy', 'Spoke', 'Cast Aluminum', 'Carbon Fiber']}
                                selectedValues={selectedWheels}
                                onToggle={(v: string) => toggleFilter(setSelectedWheels, v)}
                                onReset={() => setSelectedWheels([])}
                                showReset
                            />

                            <FilterGroup
                                title="Console"
                                options={['Analog', 'Semi-Digital', 'Full Digital', 'TFT Display', 'Bluetooth Ready']}
                                selectedValues={selectedConsole}
                                onToggle={(v: string) => toggleFilter(setSelectedConsole, v)}
                                onReset={() => setSelectedConsole([])}
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

                            {/* Dynamic EMI HUD */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                                        EMI Calculator
                                    </h4>
                                </div>
                                <div className="space-y-8 p-6 bg-green-500/5 border border-green-500/10 rounded-2xl">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Downpayment</span>
                                            <span className="text-sm font-black text-green-500 tracking-tighter italic">₹{downpayment.toLocaleString('en-IN')}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="5000"
                                            max="75000"
                                            step="5000"
                                            value={downpayment}
                                            onChange={(e) => setDownpayment(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                                        />
                                        <div className="flex justify-between text-[7px] font-bold text-slate-600 uppercase">
                                            <span>₹5K</span>
                                            <span>₹75K</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Tenure (Months)</span>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[12, 24, 36, 48].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setTenure(t)}
                                                    className={`py-2 rounded-lg text-[10px] font-black transition-all ${tenure === t ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <FilterGroup
                                title="Best For"
                                options={['Family Commute', 'Style & Performance', 'Business Delivery', 'Eco-Friendly']}
                                selectedValues={[]}
                                onToggle={() => { }}
                                onReset={() => { }}
                                showReset
                            />

                            <FilterGroup
                                title="Family Features"
                                options={['Low Seat Height', 'High Mileage', 'Extra Storage', 'Lightweight']}
                                selectedValues={[]}
                                onToggle={() => { }}
                                onReset={() => { }}
                                showReset
                            />
                        </div>

                        <div className="pt-8 border-t border-slate-200 dark:border-white/5">
                            <div className="p-8 bg-slate-100 dark:bg-white/5 rounded-3xl space-y-6 shadow-2xl border border-slate-200 dark:border-white/10 group overflow-hidden relative">
                                <Zap size={32} className="text-blue-600 dark:text-blue-500 fill-blue-600/20 animate-pulse" />
                                <div className="space-y-2 relative z-10">
                                    <h4 className="text-xl font-black uppercase tracking-tighter italic leading-tight text-slate-900 dark:text-white">Expert <br /> Concierge</h4>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic leading-relaxed">Direct access to our <br /> technical inner circle.</p>
                                </div>
                                <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-xl relative z-10">Request Briefing</button>
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 3. The Gallery Grid */}
                <div className="lg:col-span-3">
                    {filteredVehicles.length === 0 ? (
                        <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-6 bg-white/[0.02] border border-white/5 rounded-[4rem] animate-in fade-in duration-700">
                            <Search size={64} className="text-slate-800" />
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-600">No Machines Found</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Try adjusting your technical filters</p>
                            </div>
                            <button onClick={() => { setSearchQuery(''); setSelectedFuels([]); setSelectedSegments([]); }} className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-white transition-all">Clear Systems</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                            {filteredVehicles.map((v, idx) => {
                                // Mock Pricing Logic for Demo
                                const basePriceStr = v.make === 'Royal Enfield' ? '2.15' : '0.85';
                                const basePrice = parseFloat(basePriceStr) * 100000;
                                const onRoadPrice = Math.round(basePrice * 1.15); // Approx 15% tax/reg
                                const offerPrice = Math.round(onRoadPrice * 0.94); // 6% Discount
                                const saving = onRoadPrice - offerPrice;

                                // Calculate monthly EMI dynamically based on sidebar state
                                // Formula: P * r * (1+r)^n / ((1+r)^n - 1)
                                // Interest rate: 10% (0.10)
                                const annualInterestRate = 0.10;
                                const monthlyRate = annualInterestRate / 12;
                                const loanAmount = Math.max(0, offerPrice - downpayment);
                                const emiValue = loanAmount > 0
                                    ? Math.round(loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1))
                                    : 0;

                                // Owner-centric stats
                                const mileage = v.bodyType === 'SCOOTER' ? '45-50' : '35-42';
                                const gc = v.specifications?.dimensions?.groundClearance || '165 mm';
                                const seatHeight = v.specifications?.dimensions?.seatHeight || '765 mm';

                                return (
                                    <div
                                        key={v.id}
                                        className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col animate-in fade-in slide-in-from-bottom-8 shadow-sm"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        {/* Image Section - Prominent & Dynamic */}
                                        <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-6 overflow-hidden relative group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                                            {/* Flash Badges */}
                                            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white rounded-full shadow-lg shadow-green-500/20 animate-pulse">
                                                    <Zap size={10} className="fill-white" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Lowest EMI</span>
                                                </div>
                                                {v.make === 'Honda' && (
                                                    <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                                                        Best Seller
                                                    </div>
                                                )}
                                            </div>

                                            <button className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-md">
                                                <Heart className="w-4 h-4" />
                                            </button>

                                            {/* Vehicle Image Placeholder */}
                                            <div className="relative w-full h-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700 ease-out">
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-200/50 dark:from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <span className="font-black text-[10px] text-slate-300 dark:text-slate-700 uppercase italic opacity-40 text-center tracking-[0.5em] leading-relaxed">
                                                    {v.make} <br /> {v.model}
                                                </span>
                                                {/* Simulated Shadow */}
                                                <div className="w-48 h-2 bg-black/10 dark:bg-black/40 blur-xl absolute bottom-10 rounded-full group-hover:scale-125 transition-transform" />
                                            </div>
                                        </div>

                                        {/* Content Section - Commercial Focus */}
                                        <div className="p-6 space-y-5 flex-1 flex flex-col">
                                            {/* Header: Title & Brand */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 italic">{v.make}</p>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4].map(s => <Star key={s} size={10} className="text-amber-400 fill-amber-400" />)}
                                                        <Star size={10} className="text-slate-300 fill-slate-300" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none">
                                                    {v.model}
                                                    <span className="block text-[10px] font-bold text-slate-400 mt-1">{v.variant}</span>
                                                </h3>
                                            </div>

                                            {/* Commercial Soul: The EMI Box (VARIANT 4 STYLE) */}
                                            <div className="bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center justify-between group-hover:bg-green-500/10 dark:group-hover:bg-green-500/20 transition-colors">
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-500 italic">Pay Only Monthly</p>
                                                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                        ₹{emiValue.toLocaleString('en-IN')}<span className="text-xs font-bold text-slate-400 italic">/mo*</span>
                                                    </p>
                                                </div>
                                                <div className="bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg shadow-green-500/20 uppercase tracking-widest group-hover:scale-110 transition-transform">
                                                    Apply
                                                </div>
                                            </div>

                                            {/* Owner Stats: Real Value (Mileage, GC) */}
                                            <div className="grid grid-cols-3 gap-4 border-y border-slate-100 dark:border-white/5 py-4">
                                                <div className="text-center space-y-1">
                                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Mileage</p>
                                                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 italic">{mileage} <span className="text-[8px]">kmpl</span></p>
                                                </div>
                                                <div className="text-center space-y-1 border-x border-slate-100 dark:border-white/5">
                                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Clearance</p>
                                                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 italic">{gc}</p>
                                                </div>
                                                <div className="text-center space-y-1">
                                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Seat Height</p>
                                                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 italic">{seatHeight}</p>
                                                </div>
                                            </div>

                                            {/* Final Action: Pricing & Book Now */}
                                            <div className="mt-auto pt-2 flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-400 line-through">₹{onRoadPrice.toLocaleString('en-IN')}</span>
                                                        <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase">Save ₹{saving.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">₹{offerPrice.toLocaleString('en-IN')}</p>
                                                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest italic">Final On-Road Price</p>
                                                </div>
                                                <Link
                                                    href={`/store/${slugify(v.make)}/${slugify(v.model)}/${slugify(v.variant)}`}
                                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 active:scale-95 transition-all italic hover:-translate-y-1 animate-pulse"
                                                >
                                                    Book Now
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Inline Social Proof (Every 4th card) */}
                                        {idx % 4 === 3 && (
                                            <div className="absolute bottom-0 inset-x-0 p-4 bg-blue-600/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-full group-hover:translate-y-0 z-30">
                                                <p className="text-white text-[10px] font-bold italic text-center">"Lowest EMI and delivery within 48 hours. Best deal for my family!"</p>
                                                <p className="text-blue-200 text-[8px] font-black uppercase text-center mt-1">- Rajesh, Ludhiana</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                    }
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {
                isMobileFiltersOpen && (
                    <div className="fixed inset-0 z-[200] lg:hidden">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 rounded-t-[2.5rem] p-8 pb-12 space-y-8 animate-in slide-in-from-bottom duration-300 shadow-3xl max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between sticky top-0 bg-slate-900 z-10 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <SlidersHorizontal size={20} className="text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase italic tracking-tight">Refine Results</h3>
                                </div>
                                <button
                                    onClick={() => setIsMobileFiltersOpen(false)}
                                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                                >
                                    Close
                                </button>
                            </div>

                            {/* Search in Mobile Drawer */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Quick Find</h4>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH BRAND OR MODEL..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Brand Filter in Mobile Drawer */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Brand Selection</h4>
                                    {(selectedMakes.length > 0) && (
                                        <button onClick={() => setSelectedMakes([])} className="text-[9px] font-black uppercase text-blue-500">Clear</button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {brands.map(brand => (
                                        <button
                                            key={brand}
                                            onClick={() => toggleMake(brand)}
                                            className={`px-4 py-3 rounded-xl border flex items-center gap-2 transition-all ${selectedMakes.includes(brand) ? 'bg-blue-600 border-blue-600' : 'bg-white/5 border-white/10'}`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase italic ${selectedMakes.includes(brand) ? 'text-white' : 'text-slate-400'}`}>{brand}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-10">
                                {/* Technical Filters in Mobile Drawer */}
                                <FilterGroup
                                    title="Make"
                                    options={brands}
                                    selectedValues={selectedMakes}
                                    onToggle={(v: string) => toggleMake(v)}
                                    onReset={() => setSelectedMakes([])}
                                    showReset
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
                                    title="Brake System"
                                    options={['Drum', 'Disc (Front)', 'Disc (Rear)', 'Single ABS', 'Dual ABS', 'CBS']}
                                    selectedValues={selectedBrakes}
                                    onToggle={(v: string) => toggleFilter(setSelectedBrakes, v)}
                                    onReset={() => setSelectedBrakes([])}
                                    showReset
                                />

                                <FilterGroup
                                    title="Wheel Type"
                                    options={['Alloy', 'Spoke', 'Cast Aluminum', 'Carbon Fiber']}
                                    selectedValues={selectedWheels}
                                    onToggle={(v: string) => toggleFilter(setSelectedWheels, v)}
                                    onReset={() => setSelectedWheels([])}
                                    showReset
                                />

                                <FilterGroup
                                    title="Console"
                                    options={['Analog', 'Semi-Digital', 'Full Digital', 'TFT Display', 'Bluetooth Ready']}
                                    selectedValues={selectedConsole}
                                    onToggle={(v: string) => toggleFilter(setSelectedConsole, v)}
                                    onReset={() => setSelectedConsole([])}
                                    showReset
                                />

                                <FilterGroup
                                    title="Power Source"
                                    options={['Petrol', 'Electric', 'CNG']}
                                    selectedValues={selectedFuels}
                                    onToggle={(v: string) => toggleFilter(setSelectedFuels, v)}
                                    onReset={() => setSelectedFuels([])}
                                    showReset
                                />

                                <FilterGroup
                                    title="Segment"
                                    options={['Commuter', 'Sport', 'Cruiser', 'Adventure']}
                                    selectedValues={selectedSegments}
                                    onToggle={(v: string) => toggleFilter(setSelectedSegments, v)}
                                    onReset={() => setSelectedSegments([])}
                                    showReset
                                />
                            </div>

                            <div className="pt-4 sticky bottom-0 bg-slate-900 pb-2">
                                <button
                                    onClick={() => setIsMobileFiltersOpen(false)}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                                >
                                    Show {filteredVehicles.length} Machines
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default function CatalogPage() {
    // TODO: TEMP FIX - Suspense wrapper to handle useSearchParams in static export
    return (
        <Suspense fallback={<div className="min-h-screen text-white text-center pt-20">Loading Catalog...</div>}>
            <CatalogContent />
        </Suspense>
    );
}
