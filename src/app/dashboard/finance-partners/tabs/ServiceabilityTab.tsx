import React, { useState } from 'react';
import { BankPartner } from '@/types/bankPartner';
import { Map, Search, Plus, Globe, Building2, CheckCircle2, ChevronRight, Filter } from 'lucide-react';

const MOCK_LOCATIONS_LIST = [
    { state: 'Maharashtra', district: 'Pune District', taluka: 'Haveli', area: 'Wagholi' },
    { state: 'Maharashtra', district: 'Pune District', taluka: 'Haveli', area: 'Hadapsar' },
    { state: 'Maharashtra', district: 'Pune District', taluka: 'Pune City', area: 'Kothrud' },
    { state: 'Maharashtra', district: 'Pune District', taluka: 'Pune City', area: 'Baner' },
    { state: 'Maharashtra', district: 'Mumbai City', taluka: 'Mumbai South', area: 'Colaba' },
    { state: 'Maharashtra', district: 'Mumbai City', taluka: 'Mumbai South', area: 'Marine Drive' },
    { state: 'Gujarat', district: 'Ahmedabad District', taluka: 'Ahmedabad City', area: 'C G Road' },
    { state: 'Gujarat', district: 'Ahmedabad District', taluka: 'Ahmedabad City', area: 'Satellite' },
    { state: 'Karnataka', district: 'Bangalore Urban', taluka: 'Bangalore North', area: 'Hebbal' },
];

export default function ServiceabilityTab({ partner }: { partner: BankPartner }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedState, setSelectedState] = useState('ALL');
    const [selectedDistrict, setSelectedDistrict] = useState('ALL');

    const states = ['ALL', ...Array.from(new Set(MOCK_LOCATIONS_LIST.map(l => l.state)))];
    const districts = ['ALL', ...Array.from(new Set(MOCK_LOCATIONS_LIST.filter(l => selectedState === 'ALL' || l.state === selectedState).map(l => l.district)))];

    const filteredLocations = MOCK_LOCATIONS_LIST.filter(loc => {
        const matchesSearch =
            loc.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.taluka.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.area.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesState = selectedState === 'ALL' || loc.state === selectedState;
        const matchesDistrict = selectedDistrict === 'ALL' || loc.district === selectedDistrict;

        return matchesSearch && matchesState && matchesDistrict;
    });

    return (
        <div className="p-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[40px] shadow-sm dark:shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="p-10 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                                <Map size={32} className="text-emerald-500" />
                                Territory Mapping
                            </h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 ml-12 italic opacity-60">Global Serviceability Engine • Simplified List View</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                                <Plus size={16} /> Add Territory
                            </button>
                            <button className="bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 transition-all text-slate-500">
                                Export Mapping
                            </button>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative col-span-1 md:col-span-2">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by State, District, Taluka or Area..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={selectedState}
                                onChange={(e) => {
                                    setSelectedState(e.target.value);
                                    setSelectedDistrict('ALL');
                                }}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-[10px] font-black uppercase tracking-widest shadow-sm outline-none focus:border-blue-500 transition-all appearance-none"
                            >
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-[10px] font-black uppercase tracking-widest shadow-sm outline-none focus:border-blue-500 transition-all appearance-none"
                            >
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-black/40 border-b border-slate-100 dark:border-white/5">
                                <th className="text-left px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">State</th>
                                <th className="text-left px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">District</th>
                                <th className="text-left px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Taluka</th>
                                <th className="text-left px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operational Area</th>
                                <th className="text-right px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredLocations.length > 0 ? (
                                filteredLocations.map((loc, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{loc.state}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{loc.district}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 italic">t/{loc.taluka}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{loc.area}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white">
                                                <Plus size={14} className="rotate-45" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Search size={48} className="text-slate-400" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">No matching territories found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Stats Row */}
                <div className="p-10 bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{filteredLocations.length}</span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Active Areas</span>
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {new Set(filteredLocations.map(l => l.state)).size}
                            </span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">States</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Serviceability Verified</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
