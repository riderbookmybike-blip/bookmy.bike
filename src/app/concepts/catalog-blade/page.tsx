'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Filter, ChevronDown, Zap, Search, SlidersHorizontal, Heart, Star, BarChart3, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/utils/slugs';
import { useSearchParams } from 'next/navigation';
import { useCatalog } from '@/hooks/useCatalog';
import { useCompare } from '@/hooks/useCompare';
import { useFavorites, FavoritesProvider } from '@/lib/favorites/favoritesContext';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { BladeHeader } from '@/components/concepts/blade/BladeHeader';
import { BladeFooter } from '@/components/concepts/blade/BladeFooter';

import { PageFrame } from '@/components/layout/PageFrame';

function CatalogContent() {
    const { items: vehicles, isLoading } = useCatalog();
    const { compareList, addToCompare, removeFromCompare, isInCompare, clearCompare } = useCompare();
    const { toggleFavorite, isFavorite } = useFavorites();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
    const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
    const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // Dynamic EMI States
    const [downpayment, setDownpayment] = useState(15000);
    const [tenure, setTenure] = useState(36);
    const [userName, setUserName] = useState<string>('Hritik Roshan');

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.full_name) {
                setUserName(user.user_metadata.full_name);
            } else if (user?.user_metadata?.name) {
                setUserName(user.user_metadata.name);
            } else {
                const storedName = localStorage.getItem('user_name');
                if (storedName) setUserName(storedName);
            }
        };
        fetchUser();
    }, []);

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
        return vehicles.filter(v => {
            const matchesSearch = (v.make + ' ' + v.model + ' ' + v.variant).toLowerCase().includes(searchQuery.toLowerCase());

            // Brand/Make Logic
            const matchesMake = selectedMakes.length === 0 || selectedMakes.includes(v.make.toUpperCase());

            // Fuel Type Logic (Using new column)
            const matchesFuel = selectedFuels.length === 0 || selectedFuels.includes(v.fuelType || 'Petrol');

            // Segment Logic (Using new column)
            const matchesSegment = selectedSegments.length === 0 || selectedSegments.includes(v.segment || 'Commuter');

            // Body Type / Category Filter (Using new column)
            const matchesBodyType = selectedBodyTypes.length === 0 || (v.bodyType && selectedBodyTypes.includes(v.bodyType));

            // CC / Technical Filters (Using new column)
            const displacement = v.displacement || 0;
            const ccTag = displacement < 125 ? '< 125cc' : (displacement < 250 ? '125-250cc' : (displacement < 500 ? '250-500cc' : '> 500cc'));
            const matchesCC = selectedCC.length === 0 || selectedCC.includes(ccTag);

            // Tech Specs (Fallbacks to JSON for now)
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
    }, [vehicles, searchQuery, selectedMakes, selectedFuels, selectedSegments, selectedBodyTypes, selectedCC, selectedBrakes, selectedWheels, selectedConsole, selectedSeatHeight]);

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

    // Helper Component for Collapsable Groups (Blade Tactical Style)
    const FilterGroup = ({ title, options, selectedValues, onToggle, showReset = false, onReset }: any) => {
        const [isCollapsed, setIsCollapsed] = useState(false);
        const [isExpanded, setIsExpanded] = useState(false);
        const visibleOptions = isExpanded ? options : options.slice(0, 3);

        return (
            <div className="space-y-6">
                <div
                    className="flex items-center justify-between border-b border-white/10 pb-4 cursor-pointer group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-3 italic">
                        <div className={`w-1 h-1 rotate-45 transition-all ${selectedValues.length > 0 ? 'bg-[#F4B000] shadow-[0_0_10px_#F4B000]' : 'bg-white/20'}`} />
                        {title}
                    </h4>
                    <div className="flex items-center gap-4">
                        {showReset && selectedValues.length > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onReset(); }}
                                className="text-[9px] font-black uppercase text-[#F4B000] hover:text-white transition-colors tracking-widest"
                            >Reset</button>
                        )}
                        <ChevronDown size={14} className={`text-white/20 transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'} group-hover:text-[#F4B000]`} />
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="grid grid-cols-1 gap-3">
                            {visibleOptions.map((opt: string) => (
                                <button
                                    key={opt}
                                    onClick={() => onToggle(opt)}
                                    className={`group relative flex items-center justify-between p-4 border transition-all duration-300 ${selectedValues.includes(opt) ? 'bg-[#F4B000] border-[#F4B000] text-black' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest italic transition-colors ${selectedValues.includes(opt) ? 'text-black' : 'text-white/40 group-hover:text-white'}`}>{opt}</span>
                                    <div className={`w-2 h-2 rotate-45 transition-all ${selectedValues.includes(opt) ? 'bg-black' : 'bg-white/10'}`} />
                                </button>
                            ))}
                        </div>
                        {options.length > 3 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-[#F4B000] transition-colors w-full text-center py-2 border border-dashed border-white/10"
                            >
                                {isExpanded ? 'Minimize Arsenal' : `+ Show ${options.length - 3} More Specs`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Helper Component for Horizontal Dropdowns
    const FilterDropdown = ({ title, options, selectedValues, onToggle, onReset }: any) => {
        const [isOpen, setIsOpen] = useState(false);
        const ref = React.useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClick = (e: MouseEvent) => {
                if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
            }
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }, []);

        return (
            <div className="relative shrink-0" ref={ref}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${selectedValues.length > 0 || isOpen ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
                    {selectedValues.length > 0 && <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold shadow-md shadow-blue-500/20">{selectedValues.length}</span>}
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full mt-3 left-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-2">
                        <div className="max-h-60 overflow-y-auto space-y-1 p-2 custom-scrollbar">
                            {options.map((opt: string) => (
                                <button
                                    key={opt}
                                    onClick={() => onToggle(opt)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedValues.includes(opt) ? 'bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedValues.includes(opt) ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{opt}</span>
                                    {selectedValues.includes(opt) && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                </button>
                            ))}
                        </div>
                        {selectedValues.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-white/5 p-2 bg-slate-50 dark:bg-white/[0.02]">
                                <button onClick={() => { onReset(); setIsOpen(false); }} className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Clear Selection</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // EMI Popover Component
    const EMIPopover = () => {
        const [isOpen, setIsOpen] = useState(false);
        const ref = React.useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClick = (e: MouseEvent) => {
                if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
            }
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }, []);

        return (
            <div className="relative shrink-0" ref={ref}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${isOpen ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-blue-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">EMI Calculator</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full mt-3 right-0 md:left-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Downpayment</span>
                                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter italic">₹{downpayment.toLocaleString('en-IN')}</span>
                                </div>
                                <input
                                    type="range"
                                    min="5000"
                                    max="75000"
                                    step="5000"
                                    value={downpayment}
                                    onChange={(e) => setDownpayment(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                                />
                                <div className="flex justify-between text-[7px] font-bold text-slate-400 dark:text-slate-600 uppercase">
                                    <span>₹5K</span>
                                    <span>₹75K</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Tenure (Months)</span>
                                <div className="grid grid-cols-4 gap-2">
                                    {[12, 24, 36, 48].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTenure(t)}
                                            className={`py-2 rounded-lg text-[10px] font-black transition-all ${tenure === t ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/20' : 'bg-white dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Syncing Marketplace Systems...</p>
            </div>
        );
    }

    return (
        <div className="bg-black text-white transition-colors duration-500 min-h-screen selection:bg-[#F4B000] selection:text-black">
            <BladeHeader />

            {/* ════════════ THE ARSENAL HERO ════════════ */}
            <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#111] skew-x-[-15deg] translate-x-32 opacity-50" />

                <div className="max-w-[1800px] mx-auto px-6 md:px-12 relative z-10">
                    <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-none mb-4">
                        CHOOSE YOUR <br /> <span className="text-[#F4B000]">WEAPON.</span>
                    </h1>
                    <div className="flex items-center gap-6">
                        <div className="h-[1px] w-20 bg-[#F4B000]" />
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-white/40 italic">Global Arsenal {vehicles.length} Units Active</p>
                    </div>
                </div>
            </section>

            {/* 1. Sub-Navbar: The Cockpit Controls */}
            <div className="sticky top-[var(--header-h,80px)] z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 py-6 transition-all w-full">
                <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    {/* Left: Tactical Controls */}
                    <div className="flex items-center gap-6 w-full xl:w-auto shrink-0">
                        <button
                            onClick={() => setIsMobileFiltersOpen(true)}
                            className="group flex items-center gap-6 px-8 py-5 bg-[#F4B000] text-black rounded-sm hover:skew-x-[-10deg] transition-all shadow-xl active:scale-95 shrink-0"
                        >
                            <Plus size={18} className="font-black" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                Refine Arsenal
                                {(selectedMakes.length + selectedCC.length + selectedBrakes.length + selectedWheels.length) > 0 && (
                                    <span className="w-5 h-5 bg-black text-[#F4B000] rounded-full flex items-center justify-center text-[9px] font-black">
                                        {selectedMakes.length + selectedCC.length + selectedBrakes.length + selectedWheels.length}
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>

                    {/* Right: Operational Instruments */}
                    <div className="flex items-center flex-1 justify-end min-w-0">
                        <div className="hidden md:grid grid-cols-2 flex-1 items-center gap-10 bg-white/5 px-10 py-5 rounded-sm border border-white/10 w-full relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#F4B000]/0 via-[#F4B000]/5 to-[#F4B000]/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center gap-6 border-r border-white/10 pr-8 w-full overflow-hidden relative z-10">
                                <span className="text-[10px] font-black uppercase text-white/30 tracking-widest shrink-0 italic">Mission Tenure</span>
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full items-center">
                                    {[12, 24, 36, 48, 60].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTenure(t)}
                                            className={`w-10 h-10 shrink-0 border rounded-sm text-xs font-black flex items-center justify-center transition-all ${tenure === t ? 'bg-[#F4B000] border-[#F4B000] text-black shadow-lg shadow-[#F4B000]/20' : 'border-white/10 hover:border-white/40 text-white/50'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full pl-8 relative z-10">
                                <span className="text-[10px] font-black uppercase text-white/30 tracking-widest shrink-0 italic">Fuel Drop</span>
                                <div className="flex flex-col flex-1 gap-2">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xl font-black italic text-[#F4B000] tracking-tighter">₹{downpayment.toLocaleString()}</span>
                                        <span className="text-[9px] font-black text-white/20 uppercase">Downpayment</span>
                                    </div>
                                    <input
                                        type="range" min="5000" max="75000" step="5000"
                                        value={downpayment} onChange={(e) => setDownpayment(parseInt(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-none appearance-none cursor-pointer accent-[#F4B000]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mobile Simplified Controls */}
                        <div className="md:hidden flex items-center bg-white/5 px-6 py-5 rounded-sm w-full justify-between border border-white/10">
                            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest italic">Entry Level</span>
                            <span className="text-lg font-black italic text-[#F4B000]">₹{downpayment.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <PageFrame variant="wide" noTopPadding>
                {/* 2. The Gallery Grid */}
                <div className="w-full min-h-screen">
                    {filteredVehicles.length === 0 ? (
                        <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-8 bg-white/5 border border-white/10 rounded-sm animate-in fade-in duration-700">
                            <Search size={80} className="text-white/10" />
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black uppercase tracking-tighter italic text-white/20">Empty Arsenal</h3>
                                <p className="text-[10px] font-bold text-[#F4B000] uppercase tracking-[0.4em] italic">No matching units detected in sector</p>
                            </div>
                            <button onClick={() => { setSearchQuery(''); setSelectedMakes(brands); setSelectedFuels([]); setSelectedSegments([]); setSelectedCC([]); }} className="px-10 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#F4B000] transition-colors skew-x-[-10deg]">Clear Operational Filters</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
                            {filteredVehicles.map((v, idx) => {
                                // Mock Pricing Logic (Consistent)
                                const basePrice = (v.make === 'ROYAL ENFIELD' || v.make === 'TRIUMPH' || v.make === 'APRILIA') ? 215000 : 85000;
                                const onRoadPrice = Math.round(basePrice * 1.15);
                                const offerPrice = Math.round(onRoadPrice * 0.94);

                                // EMI Calc
                                const annualInterestRate = 0.095; // Blade standard 9.5%
                                const monthlyRate = annualInterestRate / 12;
                                const loanAmount = Math.max(0, offerPrice - downpayment);
                                const emiValue = loanAmount > 0
                                    ? Math.round(loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1))
                                    : 0;

                                return (
                                    <div
                                        key={v.id}
                                        className="group relative bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden hover:border-[#F4B000]/30 transition-all duration-500 flex flex-col animate-in fade-in slide-in-from-bottom-8"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        {/* Image Section: THE SLASH */}
                                        <div className="aspect-[4/3] bg-[#050505] flex items-center justify-center p-8 overflow-hidden relative transition-colors">
                                            {/* Background Slashes */}
                                            <div className="absolute inset-0 z-0">
                                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                                                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-[-15deg] translate-x-12 group-hover:translate-x-8 transition-transform duration-700" />
                                            </div>

                                            {/* Badges */}
                                            <div className="absolute top-5 left-5 z-20 flex flex-col gap-2">
                                                <div className="px-3 py-1 bg-[#F4B000] text-black text-[8px] font-black uppercase tracking-widest rotate-[-1deg] shadow-lg">
                                                    10 Mins Approval
                                                </div>
                                                <div className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rotate-[1deg]">
                                                    9.5% ROI
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="absolute top-5 right-5 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(v.id); }}
                                                    className={`w-10 h-10 border rounded-sm flex items-center justify-center transition-all ${isFavorite(v.id) ? 'bg-[#F4B000] border-[#F4B000] text-black' : 'bg-black/40 border-white/10 text-white hover:border-[#F4B000] hover:text-[#F4B000]'}`}
                                                >
                                                    <Heart className={`w-4 h-4 ${isFavorite(v.id) ? 'fill-current' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(v.id) ? removeFromCompare(v.id) : addToCompare(v); }}
                                                    className={`w-10 h-10 border rounded-sm flex items-center justify-center transition-all ${isInCompare(v.id) ? 'bg-[#F4B000] border-[#F4B000] text-black' : 'bg-black/40 border-white/10 text-white hover:border-[#F4B000] hover:text-[#F4B000]'}`}
                                                >
                                                    <BarChart3 className={`w-4 h-4 ${isInCompare(v.id) ? 'fill-current' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Bike Visual Fallback/Placeholder */}
                                            <div className="relative w-full h-full flex flex-col items-center justify-center transform group-hover:scale-110 transition-transform duration-700 ease-out z-10">
                                                <span className="font-black text-4xl text-white/5 uppercase italic tracking-tighter mb-2">{v.make}</span>
                                                <span className="font-black text-xs text-white/20 uppercase tracking-[0.3em]">{v.model}</span>
                                            </div>
                                        </div>

                                        {/* Content: THE ARSENAL CARD */}
                                        <div className="p-8 space-y-8 flex-1 flex flex-col border-t border-white/5 bg-gradient-to-b from-transparent to-[#050505]">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F4B000] italic">{v.make}</p>
                                                    <div className="flex gap-1 text-[#F4B000]/40">
                                                        <Plus size={8} /><Plus size={8} /><Plus size={8} />
                                                    </div>
                                                </div>
                                                <h3 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">
                                                    {v.model}
                                                    <span className="block text-[10px] font-bold text-white/20 mt-2 tracking-widest">{v.variant}</span>
                                                </h3>
                                            </div>

                                            {/* Pricing Block */}
                                            <div className="bg-white/5 p-6 rounded-sm border border-white/10 relative overflow-hidden group/price">
                                                <div className="absolute top-0 right-0 w-12 h-12 bg-[#F4B000]/5 -rotate-45 translate-x-6 -translate-y-6" />
                                                <div className="space-y-1 relative z-10">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 italic">Flash EMI Plan</p>
                                                    <p className="text-3xl font-black text-[#F4B000] tracking-tighter italic">
                                                        ₹{emiValue.toLocaleString('en-IN')}<span className="text-xs text-white/20 font-bold ml-1">/MO*</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Footer Info */}
                                            <div className="mt-auto pt-6 flex flex-col gap-6">
                                                <div className="flex justify-between items-end border-t border-white/5 pt-6">
                                                    <div>
                                                        <p className="text-[8px] text-white/20 uppercase tracking-[0.3em] mb-1 italic">Member Authorized</p>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#F4B000]">{userName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[18px] font-black text-white italic tracking-tighter">₹{offerPrice.toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>

                                                <Link
                                                    href={`/concepts/pdp-blade?bike=${v.id}`}
                                                    className="w-full py-5 bg-white text-black text-center text-xs font-black uppercase tracking-[0.3em] hover:bg-[#F4B000] transition-colors skew-x-[-10deg] active:scale-95"
                                                >
                                                    <span className="block skew-x-[10deg]">Initiate Strike</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                    }
                </div >

                {/* Full Screen Filter Drawer */}
                {
                    isMobileFiltersOpen && (
                        <div className="fixed inset-0 z-[200]">
                            {/* Backdrop */}
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setIsMobileFiltersOpen(false)} />

                            {/* Drawer Content */}
                            <div className="absolute inset-y-0 right-0 w-full md:w-[600px] bg-[#0a0a0a] border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
                                {/* Drawer Header */}
                                <div className="p-10 pb-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-[#F4B000]">Refine Arsenal</h3>
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Operational Parameters</p>
                                    </div>
                                    <button
                                        onClick={() => setIsMobileFiltersOpen(false)}
                                        className="w-14 h-14 rounded-sm border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-500 transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Drawer Body - Scrollable */}
                                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                                    <div className="space-y-10">
                                        <FilterGroup title="Manufacturer" options={brands} selectedValues={selectedMakes} onToggle={toggleMake} onReset={() => setSelectedMakes([])} showReset />
                                        <FilterGroup title="Engine Capacity" options={['< 125cc', '125-250cc', '250-500cc', '> 500cc']} selectedValues={selectedCC} onToggle={(v: string) => toggleFilter(setSelectedCC, v)} onReset={() => setSelectedCC([])} showReset />
                                        <FilterGroup title="Braking" options={['Drum', 'Disc (Front)', 'Disc (Rear)', 'Single ABS', 'Dual ABS', 'CBS']} selectedValues={selectedBrakes} onToggle={(v: string) => toggleFilter(setSelectedBrakes, v)} onReset={() => setSelectedBrakes([])} showReset />
                                    </div>
                                </div>

                                {/* Drawer Footer */}
                                <div className="p-10 border-t border-white/5 bg-white/[0.02]">
                                    <button
                                        onClick={() => setIsMobileFiltersOpen(false)}
                                        className="w-full py-6 bg-[#F4B000] hover:bg-white text-black rounded-sm text-xs font-black uppercase tracking-[0.4em] transition-all"
                                    >
                                        Deploy Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Floating Comparison Bubble */}
                {
                    compareList.length > 0 && (
                        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
                            <div className="bg-white text-black px-8 py-5 flex items-center gap-8 border border-white/10 shadow-2xl skew-x-[-5deg]">
                                <div className="flex items-center gap-4 skew-x-[5deg]">
                                    <div className="w-10 h-10 bg-[#F4B000] flex items-center justify-center text-black text-xs font-black rotate-45">
                                        <span className="-rotate-45">{compareList.length}</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap italic">
                                        Units in <span className="text-[#F4B000] italic underline underline-offset-4 decoration-2">Duel Mode</span>
                                    </p>
                                </div>
                                <Link href="/store/compare" className="px-8 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#F4B000] hover:text-black transition-all skew-x-[5deg]">
                                    Engage Comparison
                                </Link>
                            </div>
                        </div>
                    )
                }
            </PageFrame>
            <BladeFooter />
        </div>
    );
}


export default function CatalogPage() {
    // TODO: TEMP FIX - Suspense wrapper to handle useSearchParams in static export
    return (
        <Suspense fallback={<div className="min-h-screen text-white text-center pt-20">Loading Catalog...</div>}>
            <FavoritesProvider>
                <CatalogContent />
            </FavoritesProvider>
        </Suspense>
    );
}
