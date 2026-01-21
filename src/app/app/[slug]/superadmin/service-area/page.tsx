'use client';

import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Search,
    CheckCircle2,
    XCircle,
    Filter,
    ChevronRight,
    Loader2,
    Building2,
    Map as MapIcon,
    Zap,
    LayoutGrid,
    ListFilter,
    Edit3,
    Settings
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Helper to format text as Title Case
function toTitleCase(str: string | null | undefined): string {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

// Helper to normalize RTO codes (Uppercase, remove non-alphanumeric)
function normalizeRTO(rto: string | null | undefined): string {
    if (!rto) return '';
    return rto.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

interface Pincode {
    pincode: string;
    area: string | null;
    city: string | null;
    district: string | null;
    state: string | null;
    status: string | null;
    zone: string | null;
    pricing: string | null;
    latitude: number | null;
    longitude: number | null;
    rto_code: string | null;
}

export default function ServiceAreaPage() {
    const [pincodes, setPincodes] = useState<Pincode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Deliverable' | 'Not Deliverable'>('all');
    const [updating, setUpdating] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<'pincodes' | 'districts'>('pincodes');
    const [enabledDistricts, setEnabledDistricts] = useState<string[]>([]);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [filters, setFilters] = useState<Record<string, string[]>>({});
    const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

    const [editingDistrictName, setEditingDistrictName] = useState<string | null>(null);

    // Edit Modal State
    const [editingPincode, setEditingPincode] = useState<Pincode | null>(null);
    const [editingDistrict, setEditingDistrict] = useState<{ name: string, state: string, rtos: string[] } | null>(null);
    const [originalDistrictName, setOriginalDistrictName] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch current tenant from pathname or session
                // For now, we'll fetch the tenant config based on slug
                const slug = window.location.pathname.split('/')[2];
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('id, config')
                    .eq('slug', slug)
                    .single();

                if (tenant) {
                    setTenantId(tenant.id);
                    const config = (tenant.config as any) || {};
                    setEnabledDistricts(config.serviceable_districts || []);
                }
            }
            fetchPincodes();
        };
        loadInitialData();
    }, []);

    // ... existing fetchPincodes ...

    const handleColumnFilter = (key: string, value: string) => {
        setFilters(prev => {
            const current = prev[key] || [];
            if (value === '') return { ...prev, [key]: [] };
            const next = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [key]: next };
        });
    };

    const fetchPincodes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pincodes')
                .select('*')
                .order('pincode', { ascending: true });

            if (error) throw error;
            setPincodes(data || []);
        } catch (err: any) {
            toast.error('Failed to load pincodes: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (pincode: string, currentStatus: string | null) => {
        setUpdating(pincode);
        const newStatus = currentStatus === 'Deliverable' ? 'Not Deliverable' : 'Deliverable';
        try {
            const { error } = await supabase
                .from('pincodes')
                .update({ status: newStatus })
                .eq('pincode', pincode);

            if (error) throw error;

            setPincodes(prev => prev.map(p =>
                p.pincode === pincode ? { ...p, status: newStatus } : p
            ));

            toast.success(`${pincode} marked as ${newStatus}`);
        } catch (err: any) {
            toast.error('Update failed: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const toggleDistrictServiceability = async (district: string, currentEnabled: boolean) => {
        if (!tenantId) return;

        setUpdating(district);
        const newEnabled = currentEnabled
            ? enabledDistricts.filter(d => d.toLowerCase() !== district.toLowerCase())
            : [...enabledDistricts, district];

        try {
            // 1. Update Tenant Config (Source of Truth)
            // We need to fetch the full config first to avoid overwriting other keys
            const { data: currentTenant } = await supabase
                .from('tenants')
                .select('config')
                .eq('id', tenantId)
                .single();

            const updatedConfig = {
                ...(currentTenant?.config as any || {}),
                serviceable_districts: newEnabled
            };

            const { error: configError } = await supabase
                .from('tenants')
                .update({ config: updatedConfig })
                .eq('id', tenantId);

            if (configError) throw configError;

            // 2. Bulk Update Pincodes for this district (Consistency)
            const statusValue = !currentEnabled ? 'Deliverable' : 'Not Deliverable';

            const { error: pincodeError } = await supabase
                .from('pincodes')
                .update({ status: statusValue })
                .eq('district', district);

            if (pincodeError) throw pincodeError;

            setEnabledDistricts(newEnabled);
            setPincodes(prev => prev.map(p =>
                p.district === district ? { ...p, status: statusValue } : p
            ));

            toast.success(`District ${district} is now ${statusValue}`);
        } catch (err: any) {
            toast.error('Failed to update district: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const handleEdit = (pincode: Pincode) => {
        setEditingPincode(pincode);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPincode) return;

        setUpdating(editingPincode.pincode);
        try {
            const { error } = await supabase
                .from('pincodes')
                .update({
                    state: editingPincode.state,
                    district: editingPincode.district,
                    city: editingPincode.city,
                    area: editingPincode.area,
                    rto_code: normalizeRTO(editingPincode.rto_code)
                })
                .eq('pincode', editingPincode.pincode);

            if (error) throw error;

            setPincodes(prev => prev.map(p =>
                p.pincode === editingPincode.pincode ? editingPincode : p
            ));

            toast.success(`Pincode ${editingPincode.pincode} updated successfully`);
            setEditingPincode(null);
        } catch (err: any) {
            toast.error('Failed to update: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const handleSaveDistrictEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDistrict || !originalDistrictName) return;

        setUpdating(originalDistrictName);
        try {
            const { error: pincodeError } = await supabase
                .from('pincodes')
                .update({
                    district: editingDistrict.name,
                    state: editingDistrict.state,
                    rto_code: normalizeRTO(editingDistrict.rtos[0]) || null // Simplified: set primary RTO
                })
                .eq('district', originalDistrictName);

            if (pincodeError) throw pincodeError;

            // Also update tenants config if the name changed
            if (editingDistrict.name !== originalDistrictName) {
                const newEnabled = enabledDistricts.map(d =>
                    d.toLowerCase() === originalDistrictName.toLowerCase() ? editingDistrict.name : d
                );

                const { data: currentTenant } = await supabase
                    .from('tenants')
                    .select('config')
                    .eq('id', tenantId)
                    .single();

                const updatedConfig = {
                    ...(currentTenant?.config as any || {}),
                    serviceable_districts: newEnabled
                };

                await supabase
                    .from('tenants')
                    .update({ config: updatedConfig })
                    .eq('id', tenantId);

                setEnabledDistricts(newEnabled);
            }

            // Refetch or update local state
            await fetchPincodes();
            toast.success(`District ${editingDistrict.name} updated successfully`);
            setEditingDistrict(null);
            setOriginalDistrictName(null);
        } catch (err: any) {
            toast.error('Failed to update district: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const [sortConfig, setSortConfig] = useState<{ key: keyof Pincode; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: keyof Pincode) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredPincodes = pincodes.filter(p => {
        const matchesSearch =
            p.pincode.includes(searchQuery) ||
            p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.district?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        // Column Filters (Multi-select)
        const matchesColumns = Object.entries(filters).every(([key, values]) => {
            if (!values || values.length === 0) return true;
            const itemValue = String(p[key as keyof Pincode] || '');
            return values.includes(itemValue);
        });

        return matchesSearch && matchesStatus && matchesColumns;
    }).sort((a, b) => {
        // Prioritize Deliverable if no explicit sort is set
        if (!sortConfig) {
            if (a.status === 'Deliverable' && b.status !== 'Deliverable') return -1;
            if (a.status !== 'Deliverable' && b.status === 'Deliverable') return 1;
            return a.pincode.localeCompare(b.pincode);
        }

        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        // Safe comparison for strings/numbers
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const uniqueDistricts = React.useMemo(() => {
        const districtMap = new Map<string, { name: string, state: string, rtos: string[] }>();
        pincodes.forEach(p => {
            if (p.district) {
                const key = p.district.toLowerCase();
                const existing = districtMap.get(key);
                const rto = normalizeRTO(p.rto_code);

                if (!existing) {
                    districtMap.set(key, {
                        name: p.district,
                        state: p.state || 'Unknown',
                        rtos: rto ? [rto] : []
                    });
                } else if (rto && !existing.rtos.includes(rto)) {
                    existing.rtos.push(rto);
                }
            }
        });

        return Array.from(districtMap.values()).sort((a, b) => {
            const aEnabled = enabledDistricts.some(d => d.toLowerCase() === a.name.toLowerCase());
            const bEnabled = enabledDistricts.some(d => d.toLowerCase() === b.name.toLowerCase());

            if (aEnabled && !bEnabled) return -1;
            if (!aEnabled && bEnabled) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [pincodes, enabledDistricts]);

    const filteredDistricts = uniqueDistricts.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.state.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sub-component for Column Header
    const ColumnHeader = ({ label, colKey, className = '' }: { label: string, colKey: keyof Pincode, className?: string }) => {
        const isSorted = sortConfig?.key === colKey;
        const selectedValues = filters[colKey] || [];
        const isFiltered = selectedValues.length > 0;
        const showFilter = activeFilterColumn === colKey;

        // Get dynamic options based on other active filters (Cascading)
        const options = React.useMemo(() => {
            if (!showFilter) return [];

            // Filter pincodes by EVERYTHING EXCEPT this column's filter
            const partialFiltered = pincodes.filter(p => {
                // 1. Status Global Filter
                if (statusFilter !== 'all' && p.status !== statusFilter) return false;

                // 2. Global Search Query
                const query = searchQuery.toLowerCase();
                const matchesSearch = !query ||
                    p.pincode.includes(query) ||
                    p.city?.toLowerCase().includes(query) ||
                    p.area?.toLowerCase().includes(query) ||
                    p.district?.toLowerCase().includes(query);

                if (!matchesSearch) return false;

                // 3. Other Column Filters (Skip current column to allow changing selection)
                return Object.entries(filters).every(([key, values]) => {
                    if (key === colKey) return true; // Skip ourselves
                    if (!values || values.length === 0) return true;
                    return values.includes(String(p[key as keyof Pincode] || ''));
                });
            });

            const rawValues = partialFiltered
                .map(p => String(p[colKey] || '').replace(' Division', '').trim())
                .filter(Boolean);

            const uniqueMap = new Map<string, string>();
            rawValues.forEach((value) => {
                const key = value.toLowerCase();
                if (!uniqueMap.has(key)) uniqueMap.set(key, value);
            });
            return Array.from(uniqueMap.values()).sort((a, b) => a.localeCompare(b));
        }, [showFilter, colKey, pincodes, filters, statusFilter, searchQuery]);

        // Filter the options list based on what user types in the filter box
        const filteredOptions = options.filter(opt =>
            opt.toLowerCase().includes((searchInputs[colKey] || '').toLowerCase())
        );

        return (
            <div className={`flex flex-col relative ${className}`}>
                <div className="flex items-center gap-2 group/header select-none">
                    <div
                        onClick={() => handleSort(colKey)}
                        className={`cursor-pointer flex items-center gap-1 transition-colors ${isSorted ? 'text-indigo-600' : 'hover:text-slate-600'}`}
                    >
                        {label}
                        {isSorted && (
                            <ChevronRight size={12} className={`transition-transform ${sortConfig?.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`} />
                        )}
                    </div>
                    <button
                        onClick={() => setActiveFilterColumn(showFilter ? null : colKey)}
                        className={`p-1.5 rounded-md transition-all ${isFiltered ? 'text-indigo-600 bg-indigo-50 shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                        <Filter size={11} fill={isFiltered ? "currentColor" : "none"} />
                    </button>
                </div>

                {/* Filter Popover */}
                {showFilter && (
                    <div className="absolute top-full left-0 mt-3 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3 ring-1 ring-slate-900/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                autoFocus
                                placeholder={`Search ${label}...`}
                                className="w-full text-xs font-bold bg-slate-50 dark:bg-black/20 pl-9 pr-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                value={searchInputs[colKey] || ''}
                                onChange={(e) => setSearchInputs(prev => ({ ...prev, [colKey]: e.target.value }))}
                            />
                        </div>

                        {/* Options List */}
                        <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(opt => {
                                    const isSelected = selectedValues.includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleColumnFilter(colKey, opt)}
                                            className={`text-left px-4 py-3 rounded-xl text-sm font-black transition-all duration-200 flex items-center justify-between ${isSelected
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                : 'bg-slate-50 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-transparent hover:border-indigo-200 dark:hover:border-white/10'
                                                }`}
                                        >
                                            <span className="truncate pr-2">{toTitleCase(opt)}</span>
                                            {isSelected && <CheckCircle2 size={14} className="flex-shrink-0" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="text-xs font-bold text-slate-500 p-8 text-center italic leading-relaxed bg-slate-50 dark:bg-black/20 rounded-2xl">
                                    No matches found for "{searchInputs[colKey] || ''}"
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
                            {isFiltered && (
                                <button
                                    onClick={() => { handleColumnFilter(colKey, ''); setSearchInputs(prev => ({ ...prev, [colKey]: '' })); }}
                                    className="flex-1 py-2 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:underline text-center tracking-widest transition-all"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                onClick={() => setActiveFilterColumn(null)}
                                className="flex-1 py-2 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/5 rounded-lg text-center tracking-widest transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Filter Indicator (if collapsed) */}
                {isFiltered && !showFilter && (
                    <div className="text-[10px] text-indigo-600 font-bold truncate max-w-[100px] mt-1 bg-indigo-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span>{selectedValues.length} Selected</span>
                        <div
                            onClick={(e) => { e.stopPropagation(); handleColumnFilter(colKey, ''); }}
                            className="hover:text-rose-500 cursor-pointer"
                        >
                            <XCircle size={10} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans relative">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none" />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
                <div className="max-w-[1920px] mx-auto space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white mb-1">
                                Service <span className="text-indigo-600">Perimeter</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <p className="text-slate-500 font-medium text-sm flex items-center gap-2 border-r border-slate-200 dark:border-white/10 pr-4">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Network Coverage
                                </p>
                                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                                    <button
                                        onClick={() => setViewMode('pincodes')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${viewMode === 'pincodes' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Pincodes
                                    </button>
                                    <button
                                        onClick={() => setViewMode('districts')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${viewMode === 'districts' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Districts
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="glass-card px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <Zap size={14} className="text-amber-500" fill="currentColor" />
                                {filteredPincodes.length} Active Nodes
                            </div>
                        </div>
                    </div>

                    {/* NEO-GLASS STATS DASHBOARD */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'States', key: 'state' as keyof Pincode, icon: MapIcon, color: 'from-indigo-500 to-violet-500' },
                            { label: 'Districts', key: 'district' as keyof Pincode, icon: Building2, color: 'from-blue-500 to-cyan-500' },
                            { label: 'Cities', key: 'city' as keyof Pincode, icon: MapPin, color: 'from-emerald-500 to-teal-500' },
                            { label: 'Areas', key: 'area' as keyof Pincode, icon: LayoutGrid, color: 'from-amber-500 to-orange-500' },
                            { label: 'RTOs', key: 'rto_code' as keyof Pincode, icon: CheckCircle2, color: 'from-rose-500 to-pink-500' },
                        ].map((metric) => {
                            const uniqueValues = new Set(pincodes.map(p => p[metric.key]).filter(Boolean));
                            const total = uniqueValues.size;
                            const activeCount = new Set(pincodes.filter(p => p.status === 'Deliverable').map(p => p[metric.key]).filter(Boolean)).size;

                            return (
                                <div key={metric.label} className="group relative overflow-hidden bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${metric.color} opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition-opacity`} />

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 mb-3 rounded-2xl bg-gradient-to-br ${metric.color} p-[1px] shadow-lg`}>
                                            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center">
                                                <metric.icon size={18} className="text-slate-700 dark:text-white" />
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{metric.label}</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                                {total}
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                                {activeCount} Live
                                            </span>
                                        </div>

                                        {/* Micro Chart */}
                                        <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${metric.color} transition-all duration-500`}
                                                style={{ width: `${total > 0 ? (activeCount / total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* COMMAND BAR */}
                    <div className="sticky top-0 z-40 -mx-4 px-4 py-4 backdrop-blur-xl bg-slate-50/80 dark:bg-slate-950/80 transition-all">
                        <div className="glass-card bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-xl shadow-indigo-500/5 items-center">
                            {/* This div now only contains the search/filter header, not the entire content grid */}
                            {viewMode === 'pincodes' ? (
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                    <div className="relative flex-1 max-w-md group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            placeholder="Search by area, city or pincode..."
                                            className="w-full bg-slate-50 dark:bg-black/20 pl-12 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {(['all', 'Deliverable', 'Not Deliverable'] as const).map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === status
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                    : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {status === 'all' ? 'All Zones' : status === 'Deliverable' ? 'Serviceable' : 'Disabled'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                    <div className="relative flex-1 max-w-md group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            placeholder="Search districts or states..."
                                            className="w-full bg-slate-50 dark:bg-black/20 pl-12 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            {uniqueDistricts.length} Total Districts
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            {enabledDistricts.length} Enabled
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MAIN CONTENT GRID */}
                    {viewMode === 'pincodes' ? (
                        <div className="space-y-4">
                            {/* Pincodes Table */}
                            <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-4 shadow-sm backdrop-blur-2xl">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 mb-2 border-b border-slate-50 dark:border-white/5">
                                    <ColumnHeader label="State" colKey="state" className="col-span-2" />
                                    <ColumnHeader label="District" colKey="district" className="col-span-2" />
                                    <ColumnHeader label="City" colKey="city" className="col-span-2" />
                                    <ColumnHeader label="Area" colKey="area" className="col-span-2" />
                                    <ColumnHeader label="Pincode" colKey="pincode" className="col-span-1 flex justify-center" />
                                    <ColumnHeader label="RTO" colKey="rto_code" className="col-span-1 flex justify-center" />
                                    <div className="col-span-1 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center self-center">Serviceable</div>
                                    <div className="col-span-1 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right self-center">Actions</div>
                                </div>

                                {/* Table Body */}
                                <div className="space-y-2 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                            <p className="text-slate-400 font-bold animate-pulse">Synchronizing perimeter data...</p>
                                        </div>
                                    ) : filteredPincodes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-slate-50/50 dark:bg-white/5 rounded-3xl">
                                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                                                <Search className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-bold">No results match your current filters.</p>
                                            <button
                                                onClick={() => { setFilters({}); setStatusFilter('all'); setSearchQuery(''); }}
                                                className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                            >
                                                Reset All Filters
                                            </button>
                                        </div>
                                    ) : (
                                        filteredPincodes.map((p) => (
                                            <div
                                                key={p.pincode}
                                                className="group grid grid-cols-12 gap-4 items-center bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 px-6 py-3.5 rounded-[1.25rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300"
                                            >
                                                <div className="col-span-2">
                                                    <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide truncate" title={toTitleCase(p.state)}>{toTitleCase(p.state)}</div>
                                                </div>

                                                <div className="col-span-2">
                                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate" title={toTitleCase(p.district)}>{toTitleCase(p.district?.replace(' Division', ''))}</div>
                                                </div>

                                                <div className="col-span-2">
                                                    <div className="text-sm font-black italic text-slate-900 dark:text-white tracking-tighter truncate" title={toTitleCase(p.city)}>{toTitleCase(p.city)}</div>
                                                </div>

                                                <div className="col-span-2 flex flex-col justify-center">
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200 truncate pr-4" title={toTitleCase(p.area)}>{toTitleCase(p.area)}</div>
                                                    {(p.latitude && p.longitude) && (
                                                        <div className="flex items-center gap-1 mt-0.5 text-[9px] font-mono font-bold text-indigo-500/60 dark:text-indigo-400/60">
                                                            <span>LAT: {Number(p.latitude).toFixed(4)}</span>
                                                            <span className="opacity-30">|</span>
                                                            <span>LON: {Number(p.longitude).toFixed(4)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="col-span-1 flex justify-center">
                                                    <div className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                                                        {p.pincode}
                                                    </div>
                                                </div>

                                                <div className="col-span-1 flex justify-center">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded whitespace-nowrap">
                                                        {p.rto_code || '-'}
                                                    </div>
                                                </div>

                                                <div className="col-span-1 flex justify-center">
                                                    {p.status === 'Deliverable' ? (
                                                        <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-sm" />
                                                    ) : (
                                                        <XCircle size={18} className="text-rose-500/40" />
                                                    )}
                                                </div>

                                                <div className="col-span-1 flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/5 transition-all"
                                                        title="Edit Pincode"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleStatus(p.pincode, p.status)}
                                                        disabled={updating === p.pincode}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${p.status === 'Deliverable'
                                                            ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
                                                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                                            }`}
                                                    >
                                                        {updating === p.pincode ? '...' : p.status === 'Deliverable' ? 'Disable' : 'Enable'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Districts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredDistricts.map((district) => {
                                    const isEnabled = enabledDistricts.some(d => d.toLowerCase() === district.name.toLowerCase());
                                    return (
                                        <div
                                            key={district.name}
                                            className={`group relative p-6 rounded-[2rem] border transition-all duration-300 ${isEnabled
                                                ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20 text-white'
                                                : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 hover:border-indigo-500/30'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-2xl ${isEnabled ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5'}`}>
                                                    <Building2 size={24} className={isEnabled ? 'text-white' : 'text-slate-400'} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOriginalDistrictName(district.name);
                                                            setEditingDistrict({ ...district });
                                                        }}
                                                        className={`p-2 rounded-xl transition-all ${isEnabled
                                                            ? 'bg-white/20 text-white hover:bg-white/30'
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-indigo-600'
                                                            }`}
                                                        title="Edit District"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleDistrictServiceability(district.name, isEnabled)}
                                                        disabled={updating === district.name}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEnabled
                                                            ? 'bg-white text-indigo-600 hover:scale-105'
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                                                            }`}
                                                    >
                                                        {updating === district.name ? <Loader2 size={12} className="animate-spin" /> : isEnabled ? 'Disable' : 'Enable'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-black italic uppercase tracking-tighter truncate ${isEnabled ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                    {district.name}
                                                </h3>
                                                <p className={`text-xs font-bold uppercase tracking-widest ${isEnabled ? 'text-white/60' : 'text-slate-400'} mb-3`}>
                                                    {district.state}
                                                </p>

                                                {/* RTO List - Always Visible */}
                                                <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                                                    {district.rtos.length > 0 ? district.rtos.map(rto => (
                                                        <span key={rto} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${isEnabled
                                                            ? 'bg-white/10 border-white/20 text-white'
                                                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-400'
                                                            }`}>
                                                            {rto}
                                                        </span>
                                                    )) : (
                                                        <span className={`text-[10px] font-bold italic opacity-30 ${isEnabled ? 'text-white' : 'text-slate-400'}`}>-</span>
                                                    )}
                                                </div>
                                            </div>


                                            {/* Background Decor */}
                                            <div className={`absolute -bottom-4 -right-4 w-24 h-24 blur-2xl rounded-full opacity-20 ${isEnabled ? 'bg-white' : 'bg-indigo-500'}`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {editingPincode && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingPincode(null)} />
                            <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
                                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <MapPin size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white italic tracking-tighter">
                                                Edit Region <span className="text-indigo-600">{editingPincode.pincode}</span>
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update serviceability metadata</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setEditingPincode(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                                        <XCircle size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleSaveEdit} className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <MapIcon size={12} className="text-indigo-500" />
                                                State
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingPincode.state || ''}
                                                onChange={e => setEditingPincode({ ...editingPincode, state: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <Building2 size={12} className="text-blue-500" />
                                                District
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingPincode.district || ''}
                                                onChange={e => setEditingPincode({ ...editingPincode, district: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <MapPin size={12} className="text-emerald-500" />
                                                City
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingPincode.city || ''}
                                                onChange={e => setEditingPincode({ ...editingPincode, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <Zap size={12} className="text-rose-500" />
                                                RTO Code
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
                                                placeholder="e.g., MH-12"
                                                value={editingPincode.rto_code || ''}
                                                onChange={e => setEditingPincode({ ...editingPincode, rto_code: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <LayoutGrid size={12} className="text-amber-500" />
                                                Area / Locality Name
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingPincode.area || ''}
                                                onChange={e => setEditingPincode({ ...editingPincode, area: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditingPincode(null)}
                                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updating === editingPincode.pincode}
                                            className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            {updating === editingPincode.pincode ? <Loader2 size={14} className="animate-spin" /> : 'Save Perimeter Data'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {editingDistrict && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingDistrict(null)} />
                            <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
                                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <Building2 size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white italic tracking-tighter">
                                                Edit District <span className="text-indigo-600">{editingDistrict.name}</span>
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulk update district metadata</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setEditingDistrict(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                                        <XCircle size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleSaveDistrictEdit} className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <Building2 size={12} className="text-blue-500" />
                                                District Name
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingDistrict.name || ''}
                                                onChange={e => setEditingDistrict({ ...editingDistrict, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <MapIcon size={12} className="text-indigo-500" />
                                                State
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingDistrict.state || ''}
                                                onChange={e => setEditingDistrict({ ...editingDistrict, state: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <Zap size={12} className="text-rose-500" />
                                                RTO Codes (Primary)
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
                                                placeholder="e.g., MH-12"
                                                value={editingDistrict.rtos[0] || ''}
                                                onChange={e => setEditingDistrict({ ...editingDistrict, rtos: [e.target.value] })}
                                            />
                                            <p className="text-[9px] text-slate-400 font-bold italic">Note: Changing this will update all pincodes in this district.</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditingDistrict(null)}
                                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updating === originalDistrictName}
                                            className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {updating === originalDistrictName ? <Loader2 size={14} className="animate-spin" /> : 'Update District'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
