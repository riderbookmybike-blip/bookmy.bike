import React, { useState, useMemo, useCallback } from 'react';
import { BankPartner } from '@/types/bankPartner';
import { Map, Plus, CheckCircle2, Building2, MapPin, Globe, Filter, X, Check, Search } from 'lucide-react';

/* ─────────────────────────────────────────────────
   Mock Data — replace with Supabase fetch later
   ───────────────────────────────────────────────── */
const MOCK_LOCATIONS = [
    {
        state: 'Maharashtra',
        district: 'Pune',
        taluka: 'Haveli',
        area: 'Wagholi',
        dealership: 'Rider Two Wheeler - Wagholi',
    },
    {
        state: 'Maharashtra',
        district: 'Pune',
        taluka: 'Haveli',
        area: 'Hadapsar',
        dealership: 'Rider Two Wheeler - Hadapsar',
    },
    {
        state: 'Maharashtra',
        district: 'Pune',
        taluka: 'Pune City',
        area: 'Kothrud',
        dealership: 'Aajy Autofin - Kothrud',
    },
    { state: 'Maharashtra', district: 'Pune', taluka: 'Pune City', area: 'Baner', dealership: 'Aajy Autofin - Baner' },
    {
        state: 'Maharashtra',
        district: 'Pune',
        taluka: 'Pune City',
        area: 'Shivajinagar',
        dealership: 'Rider Two Wheeler - Shivajinagar',
    },
    { state: 'Maharashtra', district: 'Mumbai', taluka: 'Mumbai South', area: 'Colaba', dealership: 'AUMS - Colaba' },
    {
        state: 'Maharashtra',
        district: 'Mumbai',
        taluka: 'Mumbai South',
        area: 'Marine Drive',
        dealership: 'AUMS - Marine Drive',
    },
    { state: 'Maharashtra', district: 'Mumbai', taluka: 'Mumbai West', area: 'Andheri', dealership: 'AUMS - Andheri' },
    {
        state: 'Maharashtra',
        district: 'Palghar',
        taluka: 'Palghar',
        area: 'Palghar Town',
        dealership: 'Aajy Autofin - Palghar',
    },
    {
        state: 'Maharashtra',
        district: 'Palghar',
        taluka: 'Vasai',
        area: 'Vasai East',
        dealership: 'Aajy Autofin - Vasai',
    },
    {
        state: 'Maharashtra',
        district: 'Thane',
        taluka: 'Thane',
        area: 'Thane West',
        dealership: 'Rider Two Wheeler - Thane',
    },
    {
        state: 'Gujarat',
        district: 'Ahmedabad',
        taluka: 'Ahmedabad City',
        area: 'C G Road',
        dealership: 'JM Motors - CG Road',
    },
    {
        state: 'Gujarat',
        district: 'Ahmedabad',
        taluka: 'Ahmedabad City',
        area: 'Satellite',
        dealership: 'JM Motors - Satellite',
    },
    { state: 'Gujarat', district: 'Surat', taluka: 'Surat City', area: 'Adajan', dealership: 'Galaxy Motors - Adajan' },
    {
        state: 'Karnataka',
        district: 'Bangalore Urban',
        taluka: 'Bangalore North',
        area: 'Hebbal',
        dealership: 'Ride Easy - Hebbal',
    },
    {
        state: 'Karnataka',
        district: 'Bangalore Urban',
        taluka: 'Bangalore South',
        area: 'Koramangala',
        dealership: 'Ride Easy - Koramangala',
    },
];

/* ─────────────────────────────────────────────────
   Pill — toggleable chip
   ───────────────────────────────────────────────── */
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${
                active
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-blue-400 hover:text-blue-600'
            }`}
        >
            {active && <Check size={12} strokeWidth={3} />}
            {label}
        </button>
    );
}

/* ─────────────────────────────────────────────────
   CascadeRow — one row in the cascade
   ───────────────────────────────────────────────── */
function CascadeRow({
    step,
    label,
    icon: Icon,
    options,
    selected,
    onToggle,
    onSelectAll,
    disabled,
}: {
    step: number;
    label: string;
    icon: React.ElementType;
    options: string[];
    selected: Set<string>;
    onToggle: (v: string) => void;
    onSelectAll: () => void;
    disabled?: boolean;
}) {
    const allSelected = options.length > 0 && options.every(o => selected.has(o));

    return (
        <div className={`py-6 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
            {/* Row header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-black">
                        {step}
                    </span>
                    <Icon size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md tabular-nums">
                        {selected.size}/{options.length}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onSelectAll}
                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                        allSelected
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                            : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                    }`}
                >
                    {allSelected ? 'Deselect All' : 'Select All'}
                </button>
            </div>

            {/* Pills */}
            {options.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {options.map(o => (
                        <Pill key={o} label={o} active={selected.has(o)} onClick={() => onToggle(o)} />
                    ))}
                </div>
            ) : (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic pl-10">
                    Select {step > 1 ? 'items above' : 'options'} to view
                </p>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────
   ServiceabilityTab
   ───────────────────────────────────────────────── */
export default function ServiceabilityTab({ partner }: { partner: BankPartner }) {
    const [selStates, setSelStates] = useState<Set<string>>(new Set());
    const [selDistricts, setSelDistricts] = useState<Set<string>>(new Set());
    const [selTalukas, setSelTalukas] = useState<Set<string>>(new Set());
    const [selAreas, setSelAreas] = useState<Set<string>>(new Set());
    const [selDealerships, setSelDealerships] = useState<Set<string>>(new Set());

    // Step 1: States
    const states = useMemo(() => [...new Set(MOCK_LOCATIONS.map(l => l.state))].sort(), []);

    // Step 2: Districts (only from selected states)
    const districts = useMemo(() => {
        if (selStates.size === 0) return [];
        return [...new Set(MOCK_LOCATIONS.filter(l => selStates.has(l.state)).map(l => l.district))].sort();
    }, [selStates]);

    // Step 3: Talukas (only from selected districts)
    const talukas = useMemo(() => {
        if (selDistricts.size === 0) return [];
        return [
            ...new Set(
                MOCK_LOCATIONS.filter(l => selStates.has(l.state) && selDistricts.has(l.district)).map(l => l.taluka)
            ),
        ].sort();
    }, [selStates, selDistricts]);

    // Step 4: Areas (only from selected talukas)
    const areas = useMemo(() => {
        if (selTalukas.size === 0) return [];
        return [
            ...new Set(
                MOCK_LOCATIONS.filter(
                    l => selStates.has(l.state) && selDistricts.has(l.district) && selTalukas.has(l.taluka)
                ).map(l => l.area)
            ),
        ].sort();
    }, [selStates, selDistricts, selTalukas]);

    // Step 5: Dealerships (only from selected areas)
    const dealerships = useMemo(() => {
        if (selAreas.size === 0) return [];
        return [
            ...new Set(
                MOCK_LOCATIONS.filter(
                    l =>
                        selStates.has(l.state) &&
                        selDistricts.has(l.district) &&
                        selTalukas.has(l.taluka) &&
                        selAreas.has(l.area)
                ).map(l => l.dealership)
            ),
        ].sort();
    }, [selStates, selDistricts, selTalukas, selAreas]);

    // Generic toggle helper
    const toggle = useCallback((set: Set<string>, value: string): Set<string> => {
        const next = new Set(set);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
    }, []);

    // Handlers — reset downstream on any change
    const handleToggleState = (v: string) => {
        const next = toggle(selStates, v);
        setSelStates(next);
        // Prune downstream selections
        setSelDistricts(prev => {
            const valid = new Set(MOCK_LOCATIONS.filter(l => next.has(l.state)).map(l => l.district));
            return new Set([...prev].filter(d => valid.has(d)));
        });
        setSelTalukas(prev => {
            const valid = new Set(MOCK_LOCATIONS.filter(l => next.has(l.state)).map(l => l.taluka));
            return new Set([...prev].filter(t => valid.has(t)));
        });
        setSelAreas(prev => {
            const valid = new Set(MOCK_LOCATIONS.filter(l => next.has(l.state)).map(l => l.area));
            return new Set([...prev].filter(a => valid.has(a)));
        });
        setSelDealerships(prev => {
            const valid = new Set(MOCK_LOCATIONS.filter(l => next.has(l.state)).map(l => l.dealership));
            return new Set([...prev].filter(d => valid.has(d)));
        });
    };

    const handleToggleDistrict = (v: string) => {
        const next = toggle(selDistricts, v);
        setSelDistricts(next);
        setSelTalukas(prev => {
            const valid = new Set(
                MOCK_LOCATIONS.filter(l => selStates.has(l.state) && next.has(l.district)).map(l => l.taluka)
            );
            return new Set([...prev].filter(t => valid.has(t)));
        });
        setSelAreas(prev => {
            const valid = new Set(
                MOCK_LOCATIONS.filter(l => selStates.has(l.state) && next.has(l.district)).map(l => l.area)
            );
            return new Set([...prev].filter(a => valid.has(a)));
        });
        setSelDealerships(prev => {
            const valid = new Set(
                MOCK_LOCATIONS.filter(l => selStates.has(l.state) && next.has(l.district)).map(l => l.dealership)
            );
            return new Set([...prev].filter(d => valid.has(d)));
        });
    };

    const handleToggleTaluka = (v: string) => {
        const next = toggle(selTalukas, v);
        setSelTalukas(next);
        setSelAreas(prev => {
            const valid = new Set(
                MOCK_LOCATIONS.filter(
                    l => selStates.has(l.state) && selDistricts.has(l.district) && next.has(l.taluka)
                ).map(l => l.area)
            );
            return new Set([...prev].filter(a => valid.has(a)));
        });
        setSelDealerships(prev => {
            const valid = new Set(
                MOCK_LOCATIONS.filter(
                    l => selStates.has(l.state) && selDistricts.has(l.district) && next.has(l.taluka)
                ).map(l => l.dealership)
            );
            return new Set([...prev].filter(d => valid.has(d)));
        });
    };

    const handleToggleArea = (v: string) => {
        const next = toggle(selAreas, v);
        setSelAreas(next);
        setSelDealerships(prev => {
            const valid = new Set(
                MOCK_LOCATIONS.filter(
                    l =>
                        selStates.has(l.state) &&
                        selDistricts.has(l.district) &&
                        selTalukas.has(l.taluka) &&
                        next.has(l.area)
                ).map(l => l.dealership)
            );
            return new Set([...prev].filter(d => valid.has(d)));
        });
    };

    const handleToggleDealership = (v: string) => {
        setSelDealerships(toggle(selDealerships, v));
    };

    // Select All helpers
    const selectAllToggle = (options: string[], selected: Set<string>, setter: (s: Set<string>) => void) => {
        const allSelected = options.every(o => selected.has(o));
        if (allSelected) {
            const next = new Set(selected);
            options.forEach(o => next.delete(o));
            setter(next);
        } else {
            setter(new Set([...selected, ...options]));
        }
    };

    // Total mapped count
    const totalMapped = MOCK_LOCATIONS.filter(
        l =>
            selStates.has(l.state) &&
            selDistricts.has(l.district) &&
            selTalukas.has(l.taluka) &&
            selAreas.has(l.area) &&
            selDealerships.has(l.dealership)
    ).length;

    const clearAll = () => {
        setSelStates(new Set());
        setSelDistricts(new Set());
        setSelTalukas(new Set());
        setSelAreas(new Set());
        setSelDealerships(new Set());
    };

    return (
        <div className="p-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[40px] shadow-sm dark:shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-10 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                                <Map size={32} className="text-emerald-500" />
                                Territory Mapping
                            </h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 ml-12 italic opacity-60">
                                Cascading Serviceability Engine • 5-Level Hierarchy • Multi-Select
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {selStates.size > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-5 py-4 rounded-2xl border border-red-200 dark:border-red-500/20 transition-all"
                                >
                                    <X size={14} /> Clear All
                                </button>
                            )}
                            <button className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                                <Plus size={16} /> Save Mapping
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cascading Rows */}
                <div className="px-10 divide-y divide-slate-100 dark:divide-white/5">
                    {/* 1. State */}
                    <CascadeRow
                        step={1}
                        label="States"
                        icon={Globe}
                        options={states}
                        selected={selStates}
                        onToggle={handleToggleState}
                        onSelectAll={() =>
                            selectAllToggle(states, selStates, next => {
                                setSelStates(next);
                                if (next.size === 0) {
                                    setSelDistricts(new Set());
                                    setSelTalukas(new Set());
                                    setSelAreas(new Set());
                                    setSelDealerships(new Set());
                                }
                            })
                        }
                    />

                    {/* 2. District */}
                    <CascadeRow
                        step={2}
                        label="Districts"
                        icon={MapPin}
                        options={districts}
                        selected={selDistricts}
                        onToggle={handleToggleDistrict}
                        onSelectAll={() =>
                            selectAllToggle(districts, selDistricts, next => {
                                setSelDistricts(next);
                                if (next.size === 0) {
                                    setSelTalukas(new Set());
                                    setSelAreas(new Set());
                                    setSelDealerships(new Set());
                                }
                            })
                        }
                        disabled={selStates.size === 0}
                    />

                    {/* 3. Taluka */}
                    <CascadeRow
                        step={3}
                        label="Talukas"
                        icon={Filter}
                        options={talukas}
                        selected={selTalukas}
                        onToggle={handleToggleTaluka}
                        onSelectAll={() =>
                            selectAllToggle(talukas, selTalukas, next => {
                                setSelTalukas(next);
                                if (next.size === 0) {
                                    setSelAreas(new Set());
                                    setSelDealerships(new Set());
                                }
                            })
                        }
                        disabled={selDistricts.size === 0}
                    />

                    {/* 4. Area */}
                    <CascadeRow
                        step={4}
                        label="Operational Areas"
                        icon={MapPin}
                        options={areas}
                        selected={selAreas}
                        onToggle={handleToggleArea}
                        onSelectAll={() =>
                            selectAllToggle(areas, selAreas, next => {
                                setSelAreas(next);
                                if (next.size === 0) {
                                    setSelDealerships(new Set());
                                }
                            })
                        }
                        disabled={selTalukas.size === 0}
                    />

                    {/* 5. Dealership */}
                    <CascadeRow
                        step={5}
                        label="Dealerships"
                        icon={Building2}
                        options={dealerships}
                        selected={selDealerships}
                        onToggle={handleToggleDealership}
                        onSelectAll={() => selectAllToggle(dealerships, selDealerships, setSelDealerships)}
                        disabled={selAreas.size === 0}
                    />
                </div>

                {/* Footer Stats */}
                <div className="p-10 bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-8 md:gap-12">
                        <div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {selStates.size}
                            </span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">
                                States
                            </span>
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {selDistricts.size}
                            </span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">
                                Districts
                            </span>
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {selAreas.size}
                            </span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">
                                Areas
                            </span>
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {selDealerships.size}
                            </span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">
                                Dealerships
                            </span>
                        </div>
                        <div className="pl-4 border-l border-slate-200 dark:border-white/10">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                                {totalMapped}
                            </span>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest ml-2 italic">
                                Total Mapped
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Serviceability Engine</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
