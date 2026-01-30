'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Landmark, Sparkles, TrendingUp, Info, Save, CheckCircle2, Car, Copy, Edit2, ArrowRight, ArrowUpDown, Search, Filter, Package, ExternalLink, Activity, Loader2, Power, AlertCircle, Zap } from 'lucide-react';
import { calculateOnRoad } from '@/lib/utils/pricingUtility';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { RegistrationRule } from '@/types/registration';
// Helper Component for Robust Brand Logo/Avatar
interface SKUPriceRow {
    id: string;
    brand: string;
    brandId?: string;
    model: string;
    modelId?: string;
    variant: string;
    color: string;
    engineCc: string | number;
    exShowroom: number;
    offerAmount?: number;
    originalExShowroom?: number;
    originalOfferAmount?: number;
    originalInclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    hsnCode?: string;
    gstRate?: number;
    updatedAt?: string;
    brandLogo?: string;
    stockCount?: number;
    inclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    type?: 'vehicles' | 'accessories' | 'service';
    category: string;
    subCategory: string;
    suitableFor?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
    localIsActive?: boolean;
}

interface PricingLedgerTableProps {
    initialSkus: SKUPriceRow[];
    activeRule: RegistrationRule | null;
    onUpdatePrice: (skuId: string, price: number) => void;
    onUpdateOffer: (skuId: string, offer: number) => void;
    onUpdateInclusion: (skuId: string, type: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE') => void;
    onUpdateStatus: (skuId: string, status: 'ACTIVE' | 'INACTIVE') => void;
    onUpdateLocalStatus?: (skuId: string, isActive: boolean) => void;
    onSaveAll?: () => void;
    states: RegistrationRule[];
    selectedStateId: string;
    onStateChange: (id: string) => void;
    brands: string[];
    selectedBrand: string;
    onBrandChange: (brand: string) => void;
    onBulkUpdate?: (ids: string[], price: number) => void;
    hasUnsavedChanges?: boolean;
    isSaving?: boolean;
}

const BrandAvatar = ({ name, logo }: { name: string, logo?: string }) => {
    const [imgError, setImgError] = useState(false);

    // 1. If no logo or image failed, render First Letter Avatar
    if (!logo || imgError) {
        return (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                    {name.charAt(0).toUpperCase()}
                </span>
            </div>
        );
    }

    // 2. If valid SVG string, render SVG
    if (logo.includes('<svg')) {
        return (
            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                <div
                    className="w-full h-full text-slate-900 dark:text-white [&>svg]:w-full [&>svg]:h-full object-contain"
                    dangerouslySetInnerHTML={{ __html: logo }}
                />
            </div>
        );
    }

    // 3. Render Image URL with Error Handler
    return (
        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1">
            <img
                src={logo}
                alt={name}
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
            />
        </div>
    );
};

export default function PricingLedgerTable({
    initialSkus,
    activeRule,
    onUpdatePrice,
    onUpdateOffer,
    onUpdateInclusion,
    onUpdateStatus,
    onUpdateLocalStatus,
    onSaveAll,
    states,
    selectedStateId,
    onStateChange,
    brands,
    selectedBrand,
    onBrandChange,
    onBulkUpdate,
    hasUnsavedChanges,
    isSaving: isParentSaving
}: PricingLedgerTableProps) {
    const router = useRouter();
    const { tenantSlug } = useTenant();
    const isAums = tenantSlug === 'aums';
    const [skus, setSkus] = useState<SKUPriceRow[]>(initialSkus);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedSkuIds, setSelectedSkuIds] = useState<Set<string>>(new Set());
    const [bulkPriceInput, setBulkPriceInput] = useState<string>('');
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<'vehicles' | 'accessories' | 'service'>('vehicles');

    // Sort & Filter State
    const [sortConfig, setSortConfig] = useState<{ key: keyof SKUPriceRow; direction: 'asc' | 'desc' } | null>(null);
    const [filters, setFilters] = useState<Partial<Record<keyof SKUPriceRow, string>>>({});

    // Toggle Sort
    const handleSort = (key: keyof SKUPriceRow) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return current.direction === 'asc' ? { key, direction: 'desc' } : null;
            }
            return { key, direction: 'asc' };
        });
    };

    // Update Filter
    const handleFilter = (key: keyof SKUPriceRow, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setActiveFilterColumn(null); // Close dropdown on select
    };

    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

    // Derived Logic: Filters -> Unique Values for Dropdown (Cascading)
    const getUniqueValues = (key: keyof SKUPriceRow) => {
        const values = new Set<string>();

        // Start with initial dataset
        let baseSet = [...initialSkus];

        // 0. Filter by Active Category (Tab)
        if (activeCategory) {
            baseSet = baseSet.filter(sku => (sku.type || 'vehicles').toLowerCase() === activeCategory.toLowerCase());
        }

        // 0.1 Filter by Status (Global Filter)
        if (statusFilter !== 'ALL') {
            baseSet = baseSet.filter(sku => (sku.status || 'INACTIVE') === statusFilter);
        }

        // 1. Cross-Filter: For the current column's options, respect all OTHER active filters
        Object.keys(filters).forEach(fKey => {
            if (fKey !== key) {
                const filterValue = filters[fKey as keyof SKUPriceRow]?.toLowerCase();
                if (filterValue) {
                    baseSet = baseSet.filter(sku =>
                        String(sku[fKey as keyof SKUPriceRow] || '').toLowerCase() === filterValue
                    );
                }
            }
        });

        // Collect unique values from the correctly constrained baseSet
        baseSet.forEach(sku => {
            if (sku[key]) values.add(String(sku[key]));
        });

        return Array.from(values).sort();
    };

    // Derived Logic: Filter -> Sort
    const processedSkus = useMemo(() => {
        let result = [...initialSkus];

        // 0. Filter by Active Category (Tab)
        if (activeCategory) {
            result = result.filter(sku => (sku.type || 'vehicles').toLowerCase() === activeCategory.toLowerCase());
        }

        // 0.1 Filter by Status
        if (statusFilter !== 'ALL') {
            // Treat null/undefined as INACTIVE
            result = result.filter(sku => (sku.status || 'INACTIVE') === statusFilter);
        }

        // 1. Filter Dropdowns
        Object.keys(filters).forEach(key => {
            const filterValue = filters[key as keyof SKUPriceRow]?.toLowerCase();
            if (filterValue) {
                result = result.filter(sku =>
                    String(sku[key as keyof SKUPriceRow] || '').toLowerCase() === filterValue
                );
            }
        });

        // 2. Sort
        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === bVal) return 0;
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                // Handle numbers vs strings
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }

                const valA = String(aVal || '').toLowerCase();
                const valB = String(bVal || '').toLowerCase();
                return sortConfig.direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            });
        }

        return result;
    }, [initialSkus, filters, sortConfig, activeCategory, statusFilter]);

    // Selection Logic
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedSkuIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedSkuIds(newSet);
    };

    const toggleAll = () => {
        // Check if all VISIBLE rows are currently selected
        const allVisibleSelected = processedSkus.length > 0 && processedSkus.every(s => selectedSkuIds.has(s.id));

        const newSet = new Set(selectedSkuIds);

        if (allVisibleSelected) {
            // Deselect visible rows
            processedSkus.forEach(s => newSet.delete(s.id));
        } else {
            // Select visible rows
            processedSkus.forEach(s => newSet.add(s.id));
        }
        setSelectedSkuIds(newSet);
    };

    const handleBulkApply = () => {
        if (!onBulkUpdate || !bulkPriceInput) return;
        const price = parseFloat(bulkPriceInput);
        if (isNaN(price)) return;
        onBulkUpdate(Array.from(selectedSkuIds), price);
        setBulkPriceInput('');
        setSelectedSkuIds(new Set()); // Auto-clear selection after apply
    };

    const handleSave = async () => {
        setIsSaving(true);
        if (onSaveAll) await onSaveAll();
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in duration-700">
            {/* Luxury Premium Toolbar */}
            <div className="px-6 pt-4 sticky top-0 z-30 bg-gradient-to-b from-[#0a1628] via-[#0a1628]/95 to-transparent backdrop-blur-sm -mx-6">
                <div className="relative flex items-center justify-between px-6 py-3 bg-gradient-to-br from-[#1a2942] via-[#0f1d33] to-[#1a2942] border border-[#d4af37]/30 rounded-lg shadow-xl shadow-black/50 mb-4 overflow-hidden">
                    {/* Leather texture overlay */}
                    <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0ibGVhdGhlciIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxjaXJjbGUgY3g9IjI1IiBjeT0iMjUiIHI9IjIiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMyIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjEuNSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4yIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2xlYXRoZXIpIi8+PC9zdmc+')] pointer-events-none" />

                    <div className="flex items-center gap-8 relative z-10">
                        {/* Premium Filters */}
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Landmark size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37] group-hover:text-[#f4e4c1] transition-colors" />
                                <select
                                    value={selectedStateId}
                                    onChange={(e) => onStateChange(e.target.value)}
                                    className="pl-11 pr-10 py-2.5 bg-gradient-to-br from-[#0a1628] to-[#1a2942] border-2 border-[#d4af37]/40 hover:border-[#d4af37] rounded-lg text-xs font-bold text-[#f4e4c1] uppercase tracking-wide focus:ring-4 focus:ring-[#d4af37]/20 outline-none appearance-none cursor-pointer transition-all duration-300 shadow-lg shadow-black/30"
                                >
                                    {states.map((s: RegistrationRule) => (
                                        <option key={s.id} value={s.id}>{s.ruleName}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#d4af37]" />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="relative group">
                                <Power size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${statusFilter === 'ACTIVE' ? 'text-emerald-400' : 'text-[#d4af37]'}`} />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="pl-11 pr-10 py-2.5 bg-gradient-to-br from-[#0a1628] to-[#1a2942] border-2 border-[#d4af37]/40 hover:border-[#d4af37] rounded-lg text-xs font-bold text-[#f4e4c1] uppercase tracking-wide focus:ring-4 focus:ring-[#d4af37]/20 outline-none appearance-none cursor-pointer transition-all duration-300 shadow-lg shadow-black/30"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">New Launches</option>
                                    <option value="ALL">All Status</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#d4af37]" />
                                </div>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#d4af37]/50 to-transparent" />

                        {/* Classic Category Tabs */}
                        <div className="flex gap-2">
                            {[
                                { id: 'vehicles', label: 'Vehicles', icon: Car },
                                { id: 'accessories', label: 'Accessories', icon: Package },
                                { id: 'service', label: 'Service', icon: Sparkles }
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id as any)}
                                    className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeCategory === cat.id
                                        ? 'bg-gradient-to-br from-[#d4af37] to-[#b8941f] text-[#0a1628] shadow-xl shadow-[#d4af37]/30 border-2 border-[#f4e4c1]/50'
                                        : 'bg-gradient-to-br from-[#1a2942]/50 to-[#0a1628]/50 text-[#d4af37]/70 hover:text-[#d4af37] border-2 border-[#d4af37]/20 hover:border-[#d4af37]/40'
                                        }`}
                                >
                                    <cat.icon size={16} strokeWidth={2.5} />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || isParentSaving}
                                    className="group relative bg-gradient-to-br from-[#d4af37] via-[#c9a832] to-[#b8941f] hover:from-[#f4e4c1] hover:via-[#d4af37] hover:to-[#c9a832] disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-[#0a1628] px-7 py-3 rounded-lg text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 shadow-2xl shadow-[#d4af37]/40 hover:shadow-[#d4af37]/60 active:scale-95 flex items-center gap-3 border-2 border-[#f4e4c1]/30 disabled:border-transparent disabled:shadow-none overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    {(isSaving || isParentSaving) ? <Loader2 size={18} className="animate-spin" strokeWidth={2.5} /> : <Save size={18} strokeWidth={2.5} />}
                                    <span className="relative font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>Save Changes</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Luxury Premium Table Card */}
            <div className="flex-1 px-6 pb-6">
                <div className="h-full bg-gradient-to-br from-[#1a2942] via-[#0f1d33] to-[#1a2942] backdrop-blur-md rounded-2xl border-2 border-[#d4af37]/30 shadow-2xl shadow-black/50 relative overflow-hidden flex flex-col">
                    {/* Subtle pinstripe pattern */}
                    <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjQiIGZpbGw9IiNkNGFmMzciLz48L3N2Zz4=')] pointer-events-none" />
                    <div className="overflow-auto scrollbar-thin flex-1">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#1a2942] via-[#0f1d33] to-[#1a2942] backdrop-blur-md border-b border-[#d4af37]/40">
                                <tr>
                                    {/* ... (Checkbox and other headers remain same) ... */}
                                    <th className="px-4 py-3 w-10 text-[9px] font-black text-[#d4af37] uppercase tracking-[0.2em] border-b border-[#d4af37]/30 pl-6">
                                        <input
                                            type="checkbox"
                                            checked={processedSkus.length > 0 && processedSkus.every(s => selectedSkuIds.has(s.id))}
                                            onChange={toggleAll}
                                            className="rounded border-[#d4af37] text-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/30 cursor-pointer w-3.5 h-3.5"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-[9px] font-black text-[#d4af37] uppercase tracking-widest border-b border-[#d4af37]/30 text-center w-[70px]">
                                        Avail.
                                    </th>
                                    {['brand', 'category', 'subCategory', 'model', 'variant', 'color'].map((key) => {
                                        const label = key === 'subCategory' ? 'Sub Category' : key;
                                        return (
                                            <th key={key} className={`px-4 py-3 text-[9px] font-black text-[#d4af37] uppercase tracking-widest border-b border-[#d4af37]/30 align-top relative ${key === 'subCategory' || key === 'color' ? 'min-w-[120px]' : ''}`}>
                                                <div className="flex items-center justify-between gap-2 group cursor-pointer">
                                                    <div onClick={() => handleSort(key as keyof SKUPriceRow)} className="flex items-center gap-1 hover:text-blue-500 transition-colors uppercase text-left">
                                                        {label}
                                                        <ArrowUpDown size={10} className={`opacity-50 ${sortConfig?.key === key ? 'text-blue-500 opacity-100' : ''}`} />
                                                    </div>
                                                    <div
                                                        className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 ${filters[key as keyof SKUPriceRow] ? 'text-blue-500' : 'text-slate-400'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveFilterColumn(activeFilterColumn === key ? null : key);
                                                        }}
                                                    >
                                                        <Filter size={10} fill={filters[key as keyof SKUPriceRow] ? "currentColor" : "none"} />
                                                    </div>
                                                </div>

                                                {/* Filter Dropdown */}
                                                {activeFilterColumn === key && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setActiveFilterColumn(null)} />
                                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95">
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Filter by {label}</div>
                                                            <div className="max-h-48 overflow-y-auto scrollbar-thin">
                                                                <div
                                                                    className={`px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-blue-50 dark:hover:bg-white/5 transition-colors ${!filters[key as keyof SKUPriceRow] ? 'text-blue-500 bg-blue-50 dark:bg-white/5' : 'text-slate-600 dark:text-slate-300'}`}
                                                                    onClick={() => handleFilter(key as keyof SKUPriceRow, '')}
                                                                >
                                                                    All
                                                                </div>
                                                                {getUniqueValues(key as keyof SKUPriceRow).map(val => (
                                                                    <div
                                                                        key={val}
                                                                        className={`px-3 py-2 rounded-lg text-[10px] font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${filters[key as keyof SKUPriceRow] === val ? 'text-blue-500 bg-blue-50 dark:bg-white/5 font-bold' : 'text-slate-600 dark:text-slate-300'}`}
                                                                        onClick={() => handleFilter(key as keyof SKUPriceRow, val)}
                                                                    >
                                                                        {val}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        );
                                    })}




                                    <th className="px-4 py-3 text-[9px] font-black text-blue-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 bg-blue-500/5 text-right align-top">
                                        <div className="flex flex-col gap-2 items-end">
                                            <div
                                                className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"
                                                onClick={() => handleSort('exShowroom')}
                                            >
                                                {activeCategory === 'vehicles' ? 'Ex-Showroom' : 'MRP'} <ArrowUpDown size={10} />
                                            </div>
                                        </div>
                                    </th>
                                    {activeCategory === 'vehicles' ? (
                                        <>
                                            <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 text-right align-top">RTO</th>
                                            <th className="px-4 py-3 text-[9px] font-black text-amber-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 bg-amber-500/5 text-right align-top">Insurance</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 text-right align-top">Base Price</th>
                                            <th className="px-4 py-3 text-[9px] font-black text-purple-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 text-right align-top">GST (28%)</th>
                                        </>
                                    )}

                                    {activeCategory !== 'vehicles' && (
                                        <th className="px-4 py-3 text-[9px] font-black text-blue-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 text-center align-top min-w-[120px]">
                                            Inclusion
                                        </th>
                                    )}

                                    {!isAums && activeCategory === 'vehicles' && (
                                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 text-right align-top">
                                            On-Road (Base)
                                        </th>
                                    )}

                                    {/* On-Road Offer - Dealer enters final offer price */}
                                    <th className="px-6 py-3 text-[9px] font-black text-emerald-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 text-right align-top">
                                        {activeCategory === 'vehicles' ? (isAums ? 'On-Road' : 'On-Road Offer') : 'Final Price'}
                                    </th>

                                    {/* Discount - Auto-calculated */}
                                    {!isAums && activeCategory === 'vehicles' && (
                                        <th className="px-4 py-3 text-[9px] font-black text-purple-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10 text-right align-top">
                                            <div className="flex items-center justify-end gap-1 cursor-help group/header">
                                                Discount <Info size={10} />
                                                <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-xl hidden group-hover/header:block z-50 shadow-xl pointer-events-none normal-case font-normal text-slate-300">
                                                    Auto-calculated: On-Road Base - On-Road Offer
                                                </div>
                                            </div>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {processedSkus.map((sku, skuIdx) => {
                                    // 1. Calculate Standard On-Road (No Offer)
                                    const stdCalcs = activeRule
                                        ? calculateOnRoad(sku.exShowroom, Number(sku.engineCc), activeRule, undefined)
                                        : null;

                                    // 2. Calculate Final On-Road (With Offer)
                                    const finalCalcs = activeRule
                                        ? calculateOnRoad(sku.exShowroom, Number(sku.engineCc), activeRule, undefined, { offerAmount: sku.offerAmount })
                                        : null;

                                    const gstRate = sku.gstRate || 28;
                                    const basePrice = sku.exShowroom / (1 + gstRate / 100);
                                    const totalGst = sku.exShowroom - basePrice;
                                    const isDirty = sku.originalExShowroom !== undefined && sku.exShowroom !== sku.originalExShowroom;
                                    const isSelected = selectedSkuIds.has(sku.id);
                                    const hasOffer = sku.offerAmount && sku.offerAmount !== 0;

                                    return (
                                        <tr
                                            key={sku.id}
                                            className={`group transition-all duration-300 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-blue-600/5'}`}
                                        >
                                            <td className="px-4 py-2.5 pl-6 border-l-4 border-transparent group-hover:border-[#d4af37]/30 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(sku.id)}
                                                    className="rounded border-[#d4af37]/50 text-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/30 cursor-pointer w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center relative group/status">
                                                <button
                                                    onClick={() => {
                                                        if (isAums) {
                                                            // SUPERADMIN: Global Activation
                                                            const newStatus = sku.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                                                            if (newStatus === 'ACTIVE' && (!sku.exShowroom || sku.exShowroom <= 0)) {
                                                                alert('Cannot activate SKU without Ex-Showroom Price.');
                                                                return;
                                                            }
                                                            if (onUpdateStatus) onUpdateStatus(sku.id, newStatus);
                                                        } else {
                                                            // DEALER: Local Inventory Toggle
                                                            // Cannot enable if Global is INACTIVE
                                                            if (sku.status !== 'ACTIVE') {
                                                                return; // Silent fail (button disabled visually)
                                                            }
                                                            if (onUpdateLocalStatus) onUpdateLocalStatus(sku.id, !sku.localIsActive);
                                                        }
                                                    }}
                                                    disabled={!isAums && sku.status !== 'ACTIVE'}
                                                    className={`
                                                        w-8 h-5 rounded-full flex items-center transition-all duration-300 relative
                                                        ${isAums
                                                            ? (sku.status === 'ACTIVE'
                                                                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                                                                : (!sku.exShowroom || sku.exShowroom <= 0) ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-50' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300')
                                                            : (sku.status === 'ACTIVE'
                                                                ? (sku.localIsActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300')
                                                                : 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-30')
                                                        }
                                                    `}
                                                >
                                                    <div className={`
                                                        w-3 h-3 rounded-full bg-white shadow-sm absolute top-1 transition-all duration-300
                                                        ${isAums
                                                            ? (sku.status === 'ACTIVE' ? 'left-4' : 'left-1')
                                                            : (sku.localIsActive && sku.status === 'ACTIVE' ? 'left-4' : 'left-1')
                                                        }
                                                    `} />
                                                </button>

                                                {/* Tooltip for Disabled State */}
                                                {isAums && sku.status !== 'ACTIVE' && (!sku.exShowroom || sku.exShowroom <= 0) && (
                                                    <div className="absolute left-10 top-1/2 -translate-y-1/2 w-32 p-2 bg-slate-900 border border-white/10 rounded-lg hidden group-hover/status:block z-50 pointer-events-none">
                                                        <div className="flex items-center gap-2 text-[10px] text-rose-300 font-bold leading-tight">
                                                            <AlertCircle size={12} className="shrink-0" />
                                                            <span>Set Price to Activate</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Dealer Inactive Context */}
                                                {!isAums && sku.status !== 'ACTIVE' && (
                                                    <div className="absolute left-10 top-1/2 -translate-y-1/2 w-32 p-2 bg-slate-900 border border-white/10 rounded-lg hidden group-hover/status:block z-50 pointer-events-none">
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold leading-tight">
                                                            <Info size={12} className="shrink-0" />
                                                            <span>Global Launch Pending</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-bold text-[#f4e4c1] uppercase tracking-tight leading-none">{sku.brand}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-[10px] font-bold text-[#d4af37]/70 uppercase tracking-wider">{sku.category}</span>
                                            </td>
                                            <td className="px-4 py-2.5 max-w-[150px]">
                                                <span className="text-[11px] font-semibold text-[#f4e4c1]/80 uppercase leading-relaxed whitespace-normal">{sku.subCategory}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-xs font-bold text-white uppercase tracking-tight">{sku.model}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-xs font-semibold text-[#f4e4c1]/90 uppercase">{sku.variant}</span>
                                            </td>
                                            <td className="px-4 py-2.5 max-w-[150px]">
                                                <span className="text-[10px] font-medium text-[#d4af37]/60 uppercase leading-relaxed whitespace-normal">{sku.color}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="relative group/input flex justify-end items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={sku.exShowroom}
                                                        readOnly={!isAums} // Only AUMS can edit Base Price
                                                        onChange={(e) => isAums && onUpdatePrice(sku.id, Number(e.target.value))}
                                                        onFocus={(e) => e.target.select()}
                                                        onBlur={(e) => {
                                                            if (!e.target.value || Number(e.target.value) <= 0) {
                                                                onUpdatePrice(sku.id, sku.originalExShowroom || 0);
                                                            }
                                                        }}
                                                        className={`w-28 bg-gradient-to-br rounded-xl px-3 py-2 text-sm font-black outline-none transition-all duration-300 text-right
                                                        ${isDirty
                                                                ? 'from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-2 border-amber-400/50 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-lg shadow-amber-500/20'
                                                                : 'from-slate-50 to-slate-100/50 dark:from-black/20 dark:to-black/10 border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-500/30 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                                                            }
                                                        ${!isAums ? 'opacity-75 cursor-not-allowed' : ''}
                                                    `}
                                                    />
                                                    {/* Dirty State Indicator */}
                                                    {isDirty && (
                                                        <div className="relative group/history">
                                                            <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center cursor-help">
                                                                <Sparkles size={8} />
                                                            </div>
                                                            {/* Context History Tooltip */}
                                                            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-48 p-3 bg-slate-900 border border-white/10 rounded-xl text-[9px] text-white shadow-xl z-50 hidden group-hover/history:block animate-in fade-in zoom-in-95 pointer-events-none">
                                                                <div className="flex items-center justify-between font-mono bg-white/5 p-1.5 rounded-lg mb-1">
                                                                    <span className="text-slate-500 line-through">₹{sku.originalExShowroom?.toLocaleString()}</span>
                                                                    <ArrowRight size={10} className="text-slate-500" />
                                                                    <span className="text-amber-400">₹{sku.exShowroom.toLocaleString()}</span>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            {activeCategory === 'vehicles' ? (
                                                <>
                                                    <td className="px-4 py-2 text-right group/cell relative cursor-help">
                                                        <span className="font-bold text-[10px] text-slate-600 dark:text-slate-400">₹{stdCalcs?.rtoState.total.toLocaleString() || '--'}</span>
                                                        {stdCalcs && (
                                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-xl hidden group-hover/cell:block z-50 shadow-xl pointer-events-none">
                                                                <div className="space-y-1">
                                                                    {stdCalcs.rtoState.items.map((item: any, idx: number) => (
                                                                        <div key={idx} className="flex justify-between text-[8px] text-slate-300">
                                                                            <span>{item.label}</span>
                                                                            <span className="font-mono">₹{item.amount}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right bg-amber-500/[0.02] group/cell relative cursor-help">
                                                        <span className="font-bold text-[10px] text-amber-600 dark:text-amber-400">₹{stdCalcs?.insuranceComp.total.toLocaleString() || '--'}</span>
                                                        {stdCalcs && (
                                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-xl hidden group-hover/cell:block z-50 shadow-xl pointer-events-none">
                                                                <div className="space-y-1">
                                                                    {stdCalcs.insuranceComp.items.map((item: any, idx: number) => (
                                                                        <div key={idx} className="flex justify-between text-[8px] text-amber-200">
                                                                            <span>{item.label}</span>
                                                                            <span className="font-mono">₹{item.amount}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    {!isAums && (
                                                        <td className="px-6 py-2 text-right">
                                                            <span className="font-bold text-[10px] text-slate-400">₹{stdCalcs?.onRoadTotal.toLocaleString() || '--'}</span>
                                                        </td>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-2 text-right">
                                                        <span className="font-bold text-[10px] text-slate-600 dark:text-slate-400">₹{basePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <span className="font-bold text-[10px] text-purple-600 dark:text-purple-400">₹{totalGst.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </td>
                                                </>
                                            )}

                                            {activeCategory !== 'vehicles' && (
                                                <td className="px-4 py-2 text-center">
                                                    <select
                                                        value={sku.inclusionType || 'OPTIONAL'}
                                                        onChange={(e) => {
                                                            const type = e.target.value as 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
                                                            onUpdateInclusion(sku.id, type);
                                                            // Automated Discount Logic for Mandatory/Bundle (Makes it free)
                                                            if (type === 'MANDATORY' || type === 'BUNDLE') {
                                                                onUpdateOffer(sku.id, -sku.exShowroom);
                                                            } else {
                                                                onUpdateOffer(sku.id, 0); // Reset if moving to Optional
                                                            }
                                                        }}
                                                        className={`
                                                        px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none border transition-all cursor-pointer
                                                        ${sku.inclusionType === 'MANDATORY'
                                                                ? 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50'
                                                                : sku.inclusionType === 'BUNDLE'
                                                                    ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50'
                                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent hover:border-slate-300'
                                                            }
                                                    `}
                                                    >
                                                        <option value="OPTIONAL">Optional</option>
                                                        <option value="MANDATORY">Mandatory</option>
                                                        <option value="BUNDLE">Bundle</option>
                                                    </select>
                                                </td>
                                            )}

                                            {/* On-Road Offer - Editable Final Price */}
                                            <td className="px-6 py-2 text-right">
                                                {isAums ? (
                                                    <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 italic tracking-tight">
                                                        ₹{activeCategory === 'vehicles'
                                                            ? (stdCalcs?.onRoadTotal.toLocaleString() || '--')
                                                            : sku.exShowroom.toLocaleString()}
                                                    </span>
                                                ) : activeCategory === 'vehicles' ? (
                                                    <div className="relative group/offer">
                                                        <input
                                                            type="number"
                                                            value={finalCalcs?.onRoadTotal || 0}
                                                            onChange={(e) => {
                                                                // offerAmount = entered value - base on-road
                                                                const enteredOffer = Number(e.target.value);
                                                                const baseOnRoad = stdCalcs?.onRoadTotal || 0;
                                                                const newOfferAmount = enteredOffer - baseOnRoad;
                                                                onUpdateOffer(sku.id, newOfferAmount);
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-28 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-2 border-emerald-300/50 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-sm font-black text-emerald-700 dark:text-emerald-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 text-right transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 focus:shadow-xl focus:shadow-emerald-500/30 focus:scale-105"
                                                        />
                                                        {/* Glow effect on focus */}
                                                        <div className="absolute inset-0 rounded-xl bg-emerald-500/0 group-focus-within/offer:bg-emerald-500/5 blur-xl transition-all duration-300 -z-10" />
                                                    </div>
                                                ) : (
                                                    <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 italic tracking-tight">
                                                        ₹{(sku.exShowroom + (sku.offerAmount || 0)).toLocaleString()}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Discount - Auto-calculated with Enhanced Badges */}
                                            {!isAums && activeCategory === 'vehicles' && (
                                                <td className="px-4 py-2 text-right">
                                                    {(() => {
                                                        const baseOnRoad = stdCalcs?.onRoadTotal || 0;
                                                        const offerOnRoad = finalCalcs?.onRoadTotal || 0;
                                                        const discount = baseOnRoad - offerOnRoad;

                                                        if (discount === 0) {
                                                            return <span className="text-xs font-bold text-slate-400">—</span>;
                                                        }

                                                        const isDiscount = discount > 0;
                                                        return (
                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${isDiscount
                                                                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-300/50 dark:border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                                                                : 'bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 border border-rose-300/50 dark:border-rose-500/30 shadow-sm shadow-rose-500/10'
                                                                }`}>
                                                                {isDiscount ? (
                                                                    <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                                                                ) : (
                                                                    <Zap size={12} className="text-rose-600 dark:text-rose-400" />
                                                                )}
                                                                <span className={`font-black text-xs tabular-nums ${isDiscount ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                                                    }`}>
                                                                    {isDiscount ? `-₹${discount.toLocaleString()}` : `+₹${Math.abs(discount).toLocaleString()}`}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>
                    </div>

                    {/* Footer Insight */}
                    <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-slate-400">
                            <Info size={16} />
                            <p className="text-[10px] font-black uppercase tracking-widest italic">
                                All statutory charges are auto-calculated based on {activeRule?.ruleName || 'unclassified'} regulatory rules.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
