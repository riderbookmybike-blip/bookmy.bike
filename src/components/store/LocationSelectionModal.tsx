'use client';

import React from 'react';
import { X, Lock } from 'lucide-react';

export interface LocationSelectionModalProps {
    onClose: () => void;
    stateCode?: string;
    currentRegion?: string;
    currentDistrict?: string;
    onSelect: (selection: { stateCode: string; region: string; district: string }) => Promise<void>;
}

export function LocationSelectionModal({
    onClose,
    stateCode = 'MH',
    currentRegion,
    currentDistrict,
    onSelect,
}: LocationSelectionModalProps) {
    const [regions, setRegions] = React.useState<string[]>([]);
    const [districts, setDistricts] = React.useState<string[]>([]);
    const [selectedRegion, setSelectedRegion] = React.useState<string>(currentRegion || '');
    const [loadingRegions, setLoadingRegions] = React.useState(true);
    const [loadingDistricts, setLoadingDistricts] = React.useState(false);
    const [busyDistrict, setBusyDistrict] = React.useState<string | null>(null);

    React.useEffect(() => {
        fetch(`/api/pdp/regions?stateCode=${encodeURIComponent(stateCode)}`)
            .then(res => res.json())
            .then(json => {
                const nextRegions = Array.isArray(json?.regions) ? json.regions : [];
                const clean = nextRegions.filter((r: any) => typeof r === 'string' && r.trim());
                setRegions(clean);
                const defaultRegion = currentRegion && clean.includes(currentRegion) ? currentRegion : clean[0] || '';
                setSelectedRegion(defaultRegion);
            })
            .catch(() => setRegions([]))
            .finally(() => setLoadingRegions(false));
    }, [currentRegion, stateCode]);

    React.useEffect(() => {
        if (!selectedRegion) {
            setDistricts([]);
            return;
        }
        setLoadingDistricts(true);
        fetch(
            `/api/pdp/districts?stateCode=${encodeURIComponent(stateCode)}&region=${encodeURIComponent(selectedRegion)}`
        )
            .then(res => res.json())
            .then(json => {
                const nextDistricts = Array.isArray(json?.districts) ? json.districts : [];
                setDistricts(nextDistricts.filter((d: any) => typeof d === 'string' && d.trim()));
            })
            .catch(() => setDistricts([]))
            .finally(() => setLoadingDistricts(false));
    }, [selectedRegion, stateCode]);

    const handleSelect = async (d: string) => {
        if (!selectedRegion) return;
        setBusyDistrict(d);
        try {
            await onSelect({ stateCode, region: selectedRegion, district: d });
        } finally {
            setBusyDistrict(null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-[400px] shadow-2xl overflow-hidden flex flex-col border border-slate-200/50">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Change Region</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Deliver To
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-5">
                    {/* Fixed State Selector */}
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold mb-2 block ml-1 flex items-center justify-between">
                            <span>State</span>
                            <Lock size={10} className="text-slate-300" />
                        </label>
                        <div className="relative">
                            <select
                                disabled
                                className="w-full appearance-none px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-[13px] font-black tracking-wide text-slate-500 opacity-90 cursor-not-allowed shadow-inner"
                            >
                                <option value={stateCode}>{stateCode === 'MH' ? 'Maharashtra' : stateCode}</option>
                            </select>
                        </div>
                    </div>

                    {/* Region Selector */}
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold mb-2 block ml-1">
                            Region
                        </label>
                        <div className="relative">
                            {loadingRegions ? (
                                <div className="w-full appearance-none px-5 py-3.5 bg-white border border-slate-200/80 rounded-[1.25rem] text-[13px] font-black tracking-wide text-slate-400 animate-pulse">
                                    Loading...
                                </div>
                            ) : regions.length <= 1 ? (
                                <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-[13px] font-black tracking-wide text-slate-500 opacity-90 cursor-not-allowed shadow-inner flex items-center justify-between">
                                    <span>{regions[0] || selectedRegion || 'No Region Found'}</span>
                                    <Lock size={10} className="text-slate-300" />
                                </div>
                            ) : (
                                <>
                                    <select
                                        value={selectedRegion}
                                        onChange={e => setSelectedRegion(e.target.value)}
                                        className="w-full appearance-none px-5 py-3.5 bg-white border border-slate-200/80 rounded-[1.25rem] text-[13px] font-black tracking-wide text-slate-700 hover:border-slate-300 hover:shadow-sm focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 transition-all cursor-pointer outline-none"
                                    >
                                        {!selectedRegion && (
                                            <option value="" disabled>
                                                Select Region
                                            </option>
                                        )}
                                        {regions.map(r => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                                        <svg
                                            width="10"
                                            height="6"
                                            viewBox="0 0 10 6"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M1 1L5 5L9 1"
                                                stroke="#94A3B8"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* District Dropdown Selector */}
                    <div className="flex flex-col mb-4">
                        <label className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-bold mb-2 block ml-1">
                            Serviceable District
                        </label>
                        <div className="relative">
                            {loadingDistricts ? (
                                <div className="w-full appearance-none px-5 py-3.5 bg-white border border-slate-200/80 rounded-[1.25rem] text-[13px] font-black tracking-wide text-slate-400 animate-pulse">
                                    Loading...
                                </div>
                            ) : districts.length === 1 ? (
                                <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-[13px] font-black tracking-wide text-slate-500 opacity-90 shadow-inner flex items-center justify-between">
                                    <span>{districts[0]}</span>
                                    {busyDistrict ? (
                                        <div className="w-3.5 h-3.5 rounded-full border-[2px] border-brand-primary border-t-transparent animate-spin" />
                                    ) : (
                                        <button
                                            onClick={() => handleSelect(districts[0])}
                                            disabled={!!busyDistrict || currentDistrict === districts[0]}
                                            className="px-3 py-1 bg-brand-primary text-white text-[10px] uppercase font-bold tracking-widest rounded-lg disabled:opacity-50"
                                        >
                                            {currentDistrict === districts[0] ? 'Selected' : 'Confirm'}
                                        </button>
                                    )}
                                </div>
                            ) : districts.length > 1 ? (
                                <>
                                    <select
                                        value={currentDistrict || ''}
                                        onChange={e => handleSelect(e.target.value)}
                                        disabled={!!busyDistrict}
                                        className="w-full appearance-none px-5 py-3.5 bg-white border border-slate-200/80 rounded-[1.25rem] text-[13px] font-black tracking-wide text-slate-800 hover:border-slate-300 hover:shadow-sm focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 transition-all cursor-pointer outline-none disabled:opacity-50"
                                    >
                                        <option value="" disabled>
                                            Select your district
                                        </option>
                                        {districts.map(d => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                                        {busyDistrict ? (
                                            <div className="w-3.5 h-3.5 rounded-full border-[2px] border-brand-primary border-t-transparent animate-spin" />
                                        ) : (
                                            <svg
                                                width="10"
                                                height="6"
                                                viewBox="0 0 10 6"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M1 1L5 5L9 1"
                                                    stroke="#94A3B8"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200/80 rounded-[1.25rem] text-[13px] font-bold text-slate-400 text-center">
                                    Service Expansion Paused
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
