'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Landmark, Sparkles, TrendingUp, Info, Save, CheckCircle2, Car, Copy, Edit2, ArrowRight, ArrowUpDown, Search, Filter, Package, ExternalLink, Activity, Loader2, Power, AlertCircle, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
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
    status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'RELAUNCH';
    localIsActive?: boolean;
}

interface PricingLedgerTableProps {
    initialSkus: SKUPriceRow[];
    processedSkus: SKUPriceRow[];
    activeRule: RegistrationRule | null;
    onUpdatePrice: (skuId: string, price: number) => void;
    onUpdateOffer: (skuId: string, offer: number) => void;
    onUpdateInclusion: (skuId: string, type: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE') => void;
    onUpdateStatus: (skuId: string, status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'RELAUNCH') => void;
    onUpdateLocalStatus?: (skuId: string, isActive: boolean) => void;
    onSaveAll?: () => void;
    states: RegistrationRule[];
    selectedStateId: string;
    onStateChange: (id: string) => void;
    brands: string[];
    selectedBrand: string;
    onBrandChange: (brand: string) => void;
    categories: string[];
    selectedCategory: string;
    onCategoryChange: (cat: string) => void;
    subCategories: string[];
    selectedSubCategory: string;
    onSubCategoryChange: (sub: string) => void;
    onBulkUpdate?: (ids: string[], price: number) => void;
    hasUnsavedChanges?: boolean;
    isSaving?: boolean;
    onSummaryChange?: (summary: { count: number, value: number }) => void;
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
    processedSkus,
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
    categories,
    selectedCategory,
    onCategoryChange,
    subCategories,
    selectedSubCategory,
    onSubCategoryChange,
    onBulkUpdate,
    hasUnsavedChanges,
    isSaving: isParentSaving,
    onSummaryChange // NEW
}: PricingLedgerTableProps) {
    const router = useRouter();
    const { tenantSlug } = useTenant();
    const isAums = tenantSlug === 'aums';
    const [skus, setSkus] = useState<SKUPriceRow[]>(initialSkus);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSkuIds, setSelectedSkuIds] = useState<Set<string>>(new Set());
    type CategoryType = 'vehicles' | 'accessories' | 'service';
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<CategoryType>('vehicles');
    const ITEMS_PER_PAGE = 50;
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<Partial<Record<keyof SKUPriceRow, string>>>({ status: 'ACTIVE' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof SKUPriceRow; direction: 'asc' | 'desc' } | null>(null);
    const [prevSelectedCategory, setPrevSelectedCategory] = useState(selectedCategory);
    const [prevFilters, setPrevFilters] = useState({ filters, selectedBrand, selectedSubCategory, selectedStateId });

    // Sync internal category with prop (Render phase adjustment)
    if (selectedCategory !== prevSelectedCategory) {
        setPrevSelectedCategory(selectedCategory);
        setCurrentPage(1);
        if (selectedCategory && selectedCategory !== 'ALL') {
            const cat = selectedCategory.toLowerCase();
            if (['vehicles', 'accessories', 'service'].includes(cat)) {
                setActiveCategory(cat as CategoryType);
            }
        }
    }

    // Reset page 1 on internal filters (Render phase adjustment)
    if (filters !== prevFilters.filters || selectedBrand !== prevFilters.selectedBrand || selectedSubCategory !== prevFilters.selectedSubCategory || selectedStateId !== prevFilters.selectedStateId) {
        setPrevFilters({ filters, selectedBrand, selectedSubCategory, selectedStateId });
        setCurrentPage(1);
    }

    // Sort & Filter State

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


    // Derived Logic: Filters -> Unique Values for Dropdown (Cascading)
    const getUniqueValues = (key: keyof SKUPriceRow) => {
        const values = new Set<string>();

        // Start with processed dataset (which reflects parent Filters like Brand/Category)
        let baseSet = [...processedSkus];

        // 0. Filter by Active Category (Tab)
        if (activeCategory) {
            baseSet = baseSet.filter(sku => (sku.type || 'vehicles').toLowerCase() === activeCategory.toLowerCase());
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
    const { tableSkus, summary } = useMemo(() => {
        let result = [...processedSkus];

        // 0. Filter by Active Category (Tab)
        if (activeCategory) {
            result = result.filter(sku => (sku.type || 'vehicles').toLowerCase() === activeCategory.toLowerCase());
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

        const totalValue = result.reduce((sum, sku) => sum + (sku.exShowroom || 0), 0);

        return {
            tableSkus: result,
            summary: { count: result.length, value: totalValue }
        };
    }, [processedSkus, filters, sortConfig, activeCategory]);

    // Pagination Logic
    const totalPages = Math.ceil(tableSkus.length / ITEMS_PER_PAGE);
    const paginatedSkus = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return tableSkus.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [tableSkus, currentPage]);

    // Emit summary to parent
    useEffect(() => {
        if (onSummaryChange) {
            onSummaryChange(summary);
        }
    }, [summary, onSummaryChange]);

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


    const handleSave = async () => {
        setIsSaving(true);
        if (onSaveAll) await onSaveAll();
        setIsSaving(false);
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in duration-700 bg-white">
            {/* Soft Tricolor Toolbar */}
            <div className="z-30 bg-slate-50/80 backdrop-blur-md p-8 border-b border-slate-100 flex flex-col xl:flex-row items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    {/* State Filter */}
                    <div className="relative group min-w-[180px]">
                        <Landmark size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                        <select
                            value={selectedStateId}
                            onChange={(e) => onStateChange(e.target.value)}
                            className="w-full pl-11 pr-10 py-4 bg-white border border-slate-100 hover:border-emerald-300 rounded-2xl text-xs font-bold text-slate-700 uppercase tracking-wide focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none cursor-pointer transition-all duration-300 relative"
                        >
                            {states.map((s: RegistrationRule) => (
                                <option key={s.id} value={s.id}>{s.ruleName}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 z-10">
                            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>

                    {/* Brand Filter */}
                    <div className="relative group min-w-[160px]">
                        <Car size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                        <select
                            value={selectedBrand}
                            onChange={(e) => onBrandChange(e.target.value)}
                            className="w-full pl-11 pr-10 py-4 bg-white border border-slate-100 hover:border-emerald-300 rounded-2xl text-xs font-bold text-slate-700 uppercase tracking-wide focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none cursor-pointer transition-all duration-300 relative"
                        >
                            <option value="ALL">All Brands</option>
                            {brands.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 z-10">
                            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="relative group min-w-[160px]">
                        <Activity size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="w-full pl-11 pr-10 py-4 bg-white border border-slate-100 hover:border-emerald-300 rounded-2xl text-xs font-bold text-slate-700 uppercase tracking-wide focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none cursor-pointer transition-all duration-300 relative"
                        >
                            <option value="ALL">All Categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 z-10">
                            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>

                    {/* Sub Category Filter */}
                    <div className="relative group min-w-[180px]">
                        <Info size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                        <select
                            value={selectedSubCategory}
                            onChange={(e) => onSubCategoryChange(e.target.value)}
                            className="w-full pl-11 pr-10 py-4 bg-white border border-slate-100 hover:border-emerald-300 rounded-2xl text-xs font-bold text-slate-700 uppercase tracking-wide focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none cursor-pointer transition-all duration-300 relative"
                        >
                            <option value="ALL">All Sub-Categories</option>
                            {subCategories.map((sc) => (
                                <option key={sc} value={sc}>{sc}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 z-10">
                            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>


                    {(Object.keys(filters).some(k => !!filters[k as keyof SKUPriceRow])) && (
                        <button
                            onClick={() => {
                                setFilters({ status: 'ACTIVE' });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 hover:border-rose-100"
                        >
                            <Power size={12} />
                            Reset Filters
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="h-10 w-[1px] bg-slate-200 hidden xl:block mx-2" />

                    {/* Status Filter Dropdown */}
                    <div className="relative group min-w-[140px]">
                        <Zap size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                        <select
                            value={filters.status || 'ALL'}
                            onChange={(e) => handleFilter('status', e.target.value === 'ALL' ? '' : e.target.value)}
                            className="w-full pl-11 pr-10 py-4 bg-white border border-slate-100 hover:border-emerald-300 rounded-2xl text-xs font-bold text-slate-700 uppercase tracking-wide focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none cursor-pointer transition-all duration-300 relative"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Live</option>
                            <option value="DRAFT">New</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="RELAUNCH">Relaunch</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 z-10">
                            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>
                    {hasUnsavedChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isParentSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-200/50 flex items-center gap-3 group active:scale-95 whitespace-nowrap"
                        >
                            {(isSaving || isParentSaving) ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Save Pricing Ledger
                        </button>
                    )}
                </div>
            </div>

            {/* Soft Tricolor Table Card */}
            <div className="flex-1 px-6 pb-6">
                <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden flex flex-col">
                    <div className="overflow-auto scrollbar-thin flex-1">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-4 w-10 border-b border-slate-200 pl-6">
                                        <input
                                            type="checkbox"
                                            checked={tableSkus.length > 0 && tableSkus.every(s => selectedSkuIds.has(s.id))}
                                            onChange={toggleAll}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer w-4 h-4"
                                        />
                                    </th>
                                    {['model', 'variant', 'color'].map((key) => {
                                        const values = getUniqueValues(key as keyof SKUPriceRow);
                                        const currentFilter = filters[key as keyof SKUPriceRow];
                                        const isActive = activeFilterColumn === key;
                                        const statusLabels: Record<string, string> = {
                                            'ACTIVE': 'Live',
                                            'DRAFT': 'New',
                                            'INACTIVE': 'Inactive',
                                            'RELAUNCH': 'Relaunch'
                                        };

                                        return (
                                            <th key={key} className={`relative px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 bg-slate-50/30 group/header ${key === 'status' ? 'text-right' : 'text-slate-500'}`}>
                                                <div className={`flex items-center gap-1 ${key === 'status' ? 'justify-end' : 'justify-between'}`}>
                                                    <div
                                                        onClick={() => handleSort(key as keyof SKUPriceRow)}
                                                        className={`flex items-center gap-1 hover:text-emerald-600 transition-colors cursor-pointer ${key === 'status' ? 'text-slate-500' : ''}`}
                                                    >
                                                        {key} <ArrowUpDown size={12} className={`opacity-30 ${sortConfig?.key === key ? 'text-emerald-600 opacity-100' : ''}`} />
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveFilterColumn(isActive ? null : key);
                                                        }}
                                                        className={`p-1 rounded-lg transition-all ${currentFilter && currentFilter !== 'ALL' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-300 hover:bg-white hover:text-slate-600 hover:shadow-sm'}`}
                                                    >
                                                        <Filter size={12} className={currentFilter && currentFilter !== 'ALL' ? 'fill-current' : ''} />
                                                    </button>
                                                </div>

                                                {/* Filter Dropdown Popover */}
                                                {isActive && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-40 bg-transparent"
                                                            onClick={() => setActiveFilterColumn(null)}
                                                        />
                                                        <div className={`absolute top-[80%] mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${key === 'status' ? 'right-6' : 'left-6'}`}>
                                                            <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter {key}</span>
                                                                {currentFilter && (
                                                                    <button
                                                                        onClick={() => handleFilter(key as keyof SKUPriceRow, '')}
                                                                        className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter hover:underline"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                                                <button
                                                                    onClick={() => handleFilter(key as keyof SKUPriceRow, '')}
                                                                    className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${!currentFilter || currentFilter === '' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                                                >
                                                                    All {key}s
                                                                    {(!currentFilter || currentFilter === '') && <CheckCircle2 size={12} />}
                                                                </button>
                                                                <div className="h-px bg-slate-100 my-2 mx-2" />
                                                                {values.length > 0 ? (
                                                                    values.map(val => (
                                                                        <button
                                                                            key={val}
                                                                            onClick={() => handleFilter(key as keyof SKUPriceRow, val)}
                                                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${currentFilter === val ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                                                        >
                                                                            {key === 'status' ? (statusLabels[val] || val) : val}
                                                                            {currentFilter === val && <CheckCircle2 size={12} />}
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-4 py-8 text-center">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No options available</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </th>
                                        );
                                    })}


                                    <th className="px-6 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 bg-emerald-50/50 text-right">
                                        <div
                                            className="flex items-center gap-1 justify-end cursor-pointer hover:text-emerald-700 transition-colors"
                                            onClick={() => handleSort('exShowroom')}
                                        >
                                            {activeCategory === 'vehicles' ? 'Ex-Showroom' : 'MRP'} <ArrowUpDown size={12} />
                                        </div>
                                    </th>

                                    {activeCategory === 'vehicles' ? (
                                        <>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/30 text-right">RTO</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/30 text-right">Insurance</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/30 text-right">Base Price</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/30 text-right">GST (28%)</th>
                                        </>
                                    )}

                                    {activeCategory !== 'vehicles' && (
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/30 text-center min-w-[120px]">
                                            Inclusion
                                        </th>
                                    )}

                                    {!isAums && activeCategory === 'vehicles' && (
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/30 text-right">
                                            On-Road (Base)
                                        </th>
                                    )}

                                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 text-right bg-emerald-50/80">
                                        {activeCategory === 'vehicles' ? (isAums ? 'On-Road' : 'On-Road Offer') : 'Final Price'}
                                    </th>

                                    {!isAums && activeCategory === 'vehicles' && (
                                        <th className="px-6 py-5 text-[10px] font-black text-emerald-700 uppercase tracking-widest border-b border-emerald-100 text-right">
                                            Benefit
                                        </th>
                                    )}

                                    <th className="relative px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/30 text-right group/header w-[140px]">
                                        <div className="flex items-center justify-end gap-1">
                                            <div
                                                onClick={() => handleSort('status')}
                                                className="flex items-center gap-1 hover:text-emerald-600 transition-colors cursor-pointer"
                                            >
                                                Status <ArrowUpDown size={12} className={`opacity-30 ${sortConfig?.key === 'status' ? 'text-emerald-600 opacity-100' : ''}`} />
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveFilterColumn(activeFilterColumn === 'status' ? null : 'status');
                                                }}
                                                className={`p-1 rounded-lg transition-all ${filters.status && filters.status !== 'ALL' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-300 hover:bg-white hover:text-slate-600 hover:shadow-sm'}`}
                                            >
                                                <Filter size={12} className={filters.status && filters.status !== 'ALL' ? 'fill-current' : ''} />
                                            </button>
                                        </div>

                                        {/* Status Filter Dropdown */}
                                        {activeFilterColumn === 'status' && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40 bg-transparent"
                                                    onClick={() => setActiveFilterColumn(null)}
                                                />
                                                <div className="absolute top-[80%] right-6 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter status</span>
                                                        {filters.status && (
                                                            <button
                                                                onClick={() => handleFilter('status', '')}
                                                                className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter hover:underline"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                                        <button
                                                            onClick={() => handleFilter('status', '')}
                                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${!filters.status || filters.status === '' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                                        >
                                                            All Statuses
                                                            {(!filters.status || filters.status === '') && <CheckCircle2 size={12} />}
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-2 mx-2" />
                                                        {getUniqueValues('status').map(val => (
                                                            <button
                                                                key={val}
                                                                onClick={() => handleFilter('status', val)}
                                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${filters.status === val ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                                            >
                                                                {{ 'ACTIVE': 'Live', 'DRAFT': 'New', 'INACTIVE': 'Inactive', 'RELAUNCH': 'Relaunch' }[val] || val}
                                                                {filters.status === val && <CheckCircle2 size={12} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedSkus.map((sku) => {
                                    const stdCalcs = activeRule ? calculateOnRoad(sku.exShowroom, Number(sku.engineCc), activeRule, undefined) : null;
                                    const finalCalcs = activeRule ? calculateOnRoad(sku.exShowroom, Number(sku.engineCc), activeRule, undefined, { offerAmount: sku.offerAmount }) : null;
                                    const gstRate = sku.gstRate || 28;
                                    const basePrice = sku.exShowroom / (1 + gstRate / 100);
                                    const totalGst = sku.exShowroom - basePrice;
                                    const isDirty = sku.originalExShowroom !== undefined && sku.exShowroom !== sku.originalExShowroom;
                                    const isSelected = selectedSkuIds.has(sku.id);

                                    return (
                                        <tr
                                            key={sku.id}
                                            className={`group transition-all duration-200 ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}
                                        >
                                            <td className="px-6 py-5 pl-8">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(sku.id)}
                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer w-4 h-4"
                                                />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{sku.model}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-semibold text-slate-700 uppercase">{sku.variant}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[10px] font-medium text-slate-500 uppercase leading-relaxed">{sku.color}</span>
                                            </td>

                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={sku.exShowroom}
                                                        readOnly={!isAums}
                                                        onChange={(e) => isAums && onUpdatePrice(sku.id, Number(e.target.value))}
                                                        className={`w-28 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-black text-right transition-all ${isDirty ? 'border-amber-400 bg-amber-50 text-amber-700' : 'text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'} ${!isAums ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`}
                                                    />
                                                </div>
                                            </td>
                                            {activeCategory === 'vehicles' ? (
                                                <>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="font-bold text-[11px] text-slate-600">₹{stdCalcs?.rtoState.total.toLocaleString() || '--'}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="font-bold text-[11px] text-slate-600">₹{stdCalcs?.insuranceComp.total.toLocaleString() || '--'}</span>
                                                    </td>
                                                    {!isAums && (
                                                        <td className="px-8 py-5 text-right">
                                                            <span className="font-bold text-[11px] text-slate-400">₹{stdCalcs?.onRoadTotal.toLocaleString() || '--'}</span>
                                                        </td>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="font-bold text-[11px] text-slate-500">₹{basePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="font-bold text-[11px] text-slate-500">₹{totalGst.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    </td>
                                                </>
                                            )}

                                            {activeCategory !== 'vehicles' && (
                                                <td className="px-6 py-5 text-center">
                                                    <select
                                                        value={sku.inclusionType || 'OPTIONAL'}
                                                        onChange={(e) => {
                                                            const type = e.target.value as 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
                                                            onUpdateInclusion(sku.id, type);
                                                            if (type === 'MANDATORY' || type === 'BUNDLE') onUpdateOffer(sku.id, -sku.exShowroom);
                                                            else onUpdateOffer(sku.id, 0);
                                                        }}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border transition-all ${sku.inclusionType === 'MANDATORY' ? 'bg-rose-50 text-rose-600 border-rose-200' : sku.inclusionType === 'BUNDLE' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                                    >
                                                        <option value="OPTIONAL">Optional</option>
                                                        <option value="MANDATORY">Mandatory</option>
                                                        <option value="BUNDLE">Bundle</option>
                                                    </select>
                                                </td>
                                            )}

                                            <td className="px-8 py-5 text-right bg-emerald-50/20">
                                                {isAums ? (
                                                    <span className="font-black text-[13px] text-emerald-700 tracking-tight">
                                                        ₹{activeCategory === 'vehicles' ? (stdCalcs?.onRoadTotal.toLocaleString() || '--') : sku.exShowroom.toLocaleString()}
                                                    </span>
                                                ) : activeCategory === 'vehicles' ? (
                                                    <input
                                                        type="number"
                                                        value={finalCalcs?.onRoadTotal || 0}
                                                        onChange={(e) => {
                                                            const enteredOffer = Number(e.target.value);
                                                            const baseOnRoad = stdCalcs?.onRoadTotal || 0;
                                                            onUpdateOffer(sku.id, enteredOffer - baseOnRoad);
                                                        }}
                                                        className="w-28 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-sm font-black text-emerald-700 text-right outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                                    />
                                                ) : (
                                                    <span className="font-black text-[13px] text-emerald-700 tracking-tight">
                                                        ₹{(sku.exShowroom + (sku.offerAmount || 0)).toLocaleString()}
                                                    </span>
                                                )}
                                            </td>

                                            {!isAums && activeCategory === 'vehicles' && (
                                                <td className="px-6 py-5 text-right">
                                                    {(() => {
                                                        const discount = (stdCalcs?.onRoadTotal || 0) - (finalCalcs?.onRoadTotal || 0);
                                                        if (discount === 0) return <span className="text-xs font-bold text-slate-300">—</span>;
                                                        return (
                                                            <div className={`inline-flex items-center gap-1 font-black text-xs ${discount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {discount > 0 ? <Sparkles size={12} /> : <Zap size={12} />}
                                                                {discount > 0 ? `-₹${discount.toLocaleString()}` : `+₹${Math.abs(discount).toLocaleString()}`}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            )}

                                            <td className="px-8 py-5 text-right w-[140px]">
                                                {isAums ? (
                                                    <button
                                                        onClick={() => {
                                                            type StatusType = 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'RELAUNCH';
                                                            const statuses: StatusType[] = ['ACTIVE', 'DRAFT', 'INACTIVE', 'RELAUNCH'];
                                                            const currentStatus = (sku.status || 'INACTIVE') as StatusType;
                                                            const currentIndex = statuses.indexOf(currentStatus);
                                                            const nextStatus = statuses[(currentIndex + 1) % statuses.length];

                                                            if (nextStatus === 'ACTIVE' && (!sku.exShowroom || sku.exShowroom <= 0)) {
                                                                alert('Set Ex-Showroom Price first.');
                                                                return;
                                                            }
                                                            if (onUpdateStatus) onUpdateStatus(sku.id, nextStatus);
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm border ${sku.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            sku.status === 'DRAFT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                sku.status === 'RELAUNCH' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                    'bg-slate-50 text-slate-400 border-slate-100'
                                                            }`}
                                                    >
                                                        {sku.status === 'ACTIVE' ? 'Live' : sku.status === 'DRAFT' ? 'New' : sku.status === 'INACTIVE' ? 'Inactive' : 'Relaunch'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (sku.status !== 'ACTIVE') return;
                                                            if (onUpdateLocalStatus) onUpdateLocalStatus(sku.id, !sku.localIsActive);
                                                        }}
                                                        disabled={sku.status !== 'ACTIVE'}
                                                        className={`w-10 h-5 rounded-full flex items-center transition-all ml-auto ${sku.status === 'ACTIVE' ? (sku.localIsActive ? 'bg-emerald-500' : 'bg-slate-200') : 'bg-slate-100 opacity-50 cursor-not-allowed'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all mx-0.5 ${sku.localIsActive && sku.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {tableSkus.length > 0 && (
                        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, tableSkus.length)}</span> of <span className="text-slate-900">{tableSkus.length}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Insight */}
            <div className="px-6 pb-6 mt-auto">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-500">
                        <Info size={16} className="text-emerald-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">
                            All statutory charges are auto-calculated based on {activeRule?.ruleName || 'unclassified'} regulatory rules.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
