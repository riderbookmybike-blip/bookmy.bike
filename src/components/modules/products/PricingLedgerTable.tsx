'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Landmark,
    Sparkles,
    TrendingUp,
    Info,
    Save,
    CheckCircle2,
    Car,
    Copy,
    ArrowRight,
    ArrowUpDown,
    Search,
    Filter,
    Package,
    ExternalLink,
    Activity,
    Loader2,
    Power,
    AlertCircle,
    Zap,
    ChevronLeft,
    ChevronRight,
    Download,
    X,
    FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
    rto?: number;
    insurance?: number;
    onRoad?: number;
    originalStatus?: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'RELAUNCH';
    originalLocalIsActive?: boolean;
    publishStage?: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED';
    rto_data?: any;
    insurance_data?: any;
    displayState?: 'Draft' | 'In Review' | 'Published' | 'Live' | 'Inactive';
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
    models: string[];
    selectedModel: string;
    onModelChange: (model: string) => void;
    variants: string[];
    selectedVariant: string;
    onVariantChange: (variant: string) => void;
    onBulkUpdate?: (ids: string[], price: number) => void;
    hasUnsavedChanges?: boolean;
    isSaving?: boolean;
    onSummaryChange?: (summary: { count: number; value: number }) => void;
    onCalculate?: (selectedIds: string[]) => void;
    isCalculating?: boolean;
}

const BrandAvatar = ({ name, logo }: { name: string; logo?: string }) => {
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
            <img src={logo} alt={name} className="w-full h-full object-contain" onError={() => setImgError(true)} />
        </div>
    );
};

export default function PricingLedgerTable({
    initialSkus,
    processedSkus,
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
    models,
    selectedModel,
    onModelChange,
    variants,
    selectedVariant,
    onVariantChange,
    onBulkUpdate,
    hasUnsavedChanges,
    isSaving: isParentSaving,
    onSummaryChange,
    onCalculate,
    isCalculating,
}: PricingLedgerTableProps) {
    const router = useRouter();
    const { tenantSlug } = useTenant();
    const isAums = tenantSlug === 'aums';
    const [skus, setSkus] = useState<SKUPriceRow[]>(initialSkus);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSkuIds, setSelectedSkuIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const element = document.getElementById('pricing-ledger-table');
            if (!element) return;

            // Hide UI elements during export
            const uiElements = element.querySelectorAll('.no-export');
            uiElements.forEach(el => ((el as HTMLElement).style.display = 'none'));

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Pricing_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);

            // Restore UI elements
            uiElements.forEach(el => ((el as HTMLElement).style.display = ''));
        } catch (error) {
            console.error('PDF Export failed:', error);
            alert('PDF Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };
    type CategoryType = 'vehicles' | 'accessories' | 'service';
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<CategoryType>('vehicles');
    const ITEMS_PER_PAGE = 50;
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<Partial<Record<keyof SKUPriceRow, string>>>({});
    const [sortConfig, setSortConfig] = useState<{ key: keyof SKUPriceRow; direction: 'asc' | 'desc' } | null>(null);
    const [prevSelectedCategory, setPrevSelectedCategory] = useState(selectedCategory);
    const [prevFilters, setPrevFilters] = useState({ filters, selectedBrand, selectedSubCategory, selectedStateId });

    const formatMoney = (value: number | null | undefined) => {
        if (value === null || value === undefined) return '—';
        const num = Number(value);
        if (isNaN(num)) return '—';
        return `₹${num.toLocaleString()}`;
    };

    const getRtoTypeDetail = (rtoData: any, type: 'STATE' | 'BH' | 'COMPANY') => {
        if (!rtoData) return null;
        const typeVal = rtoData?.[type];
        const fees = rtoData?.fees;
        const tax = rtoData?.tax?.[type];

        if (typeof typeVal === 'number') {
            return { total: typeVal };
        }

        if (typeVal && typeof typeVal === 'object') {
            return {
                total: typeVal.total,
                breakdown: typeVal,
            };
        }

        if (fees && tax) {
            const feeItems = Object.entries(fees)
                .map(([key, val]: any) => ({
                    label: key.replace(/_/g, ' '),
                    amount: val?.amount ?? val,
                }))
                .filter((item: any) => Number(item.amount) > 0);

            const taxItems = [
                { label: 'Road Tax', amount: tax.road_tax ?? tax.roadTax ?? 0 },
                { label: 'Cess', amount: tax.cess ?? tax.cessAmount ?? 0 },
            ].filter(item => Number(item.amount) > 0);

            const total = [...feeItems, ...taxItems].reduce((sum, i) => sum + Number(i.amount || 0), 0);
            return { total, fees: feeItems, tax: taxItems };
        }

        return null;
    };

    useEffect(() => {
        setSelectedSkuIds(new Set());
    }, [activeCategory]);

    // Sync internal category with prop (Render phase adjustment)
    if (selectedCategory !== prevSelectedCategory) {
        setPrevSelectedCategory(selectedCategory);
        setCurrentPage(1);
        if (selectedCategory && selectedCategory !== 'ALL') {
            const rawCat = selectedCategory.toLowerCase();
            let mappedCat: CategoryType = 'vehicles'; // Default

            if (rawCat === 'accessory' || rawCat === 'accessories') mappedCat = 'accessories';
            else if (rawCat === 'service' || rawCat === 'services') mappedCat = 'service';
            else if (rawCat === 'vehicle' || rawCat === 'vehicles') mappedCat = 'vehicles';

            setActiveCategory(mappedCat);
        } else {
            // If ALL, maybe default to vehicles or handle differently?
            // For now, let's keep it as is, or reset to vehicles.
            // The Logic below filters by activeCategory. If we want ALL, we might need activeCategory to be null?
            // But the UI seems tab-based logic. Let's assume Vehicle is default.
            setActiveCategory('vehicles');
        }
    }

    // Reset page 1 on internal filters (Render phase adjustment)
    if (
        filters !== prevFilters.filters ||
        selectedBrand !== prevFilters.selectedBrand ||
        selectedSubCategory !== prevFilters.selectedSubCategory ||
        selectedStateId !== prevFilters.selectedStateId
    ) {
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
                    baseSet = baseSet.filter(
                        sku => String(sku[fKey as keyof SKUPriceRow] || '').toLowerCase() === filterValue
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
                result = result.filter(
                    sku => String(sku[key as keyof SKUPriceRow] || '').toLowerCase() === filterValue
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
                return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }

        const totalValue = result.reduce((sum, sku) => sum + (sku.exShowroom || 0), 0);

        return {
            tableSkus: result,
            summary: { count: result.length, value: totalValue },
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
        setSelectedSkuIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                return next;
            }
            if (activeCategory === 'vehicles' && selectedVariant === 'ALL') {
                return new Set([id]);
            }
            next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (activeCategory === 'vehicles' && selectedVariant === 'ALL') return;
        // Check if all VISIBLE/FILTERED rows are currently selected
        // We use tableSkus (locally filtered) instead of processedSkus (parent filtered only)
        // This ensures we don't accidentally select hidden rows when a column filter is active.
        const allVisibleSelected = tableSkus.length > 0 && tableSkus.every(s => selectedSkuIds.has(s.id));

        const newSet = new Set(selectedSkuIds);

        if (allVisibleSelected) {
            // Deselect visible rows
            tableSkus.forEach(s => newSet.delete(s.id));
        } else {
            // Select visible rows
            tableSkus.forEach(s => newSet.add(s.id));
        }
        setSelectedSkuIds(newSet);
    };

    const handleSave = async () => {
        setIsSaving(true);
        if (onSaveAll) await onSaveAll();
        setIsSaving(false);
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in duration-700 bg-white dark:bg-slate-950">
            {/* Soft Tricolor Toolbar */}
            <div className="z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                    {/* Search Icon */}
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl shrink-0">
                        <Search size={14} className="text-emerald-600" />
                    </div>
                    {/* State Filter */}
                    <div className="relative group flex-1 min-w-[140px]">
                        <Landmark
                            size={12}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 z-10"
                        />
                        <select
                            value={selectedStateId}
                            onChange={e => onStateChange(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer transition-all"
                        >
                            {states.map((s: RegistrationRule) => (
                                <option key={s.id} value={s.id}>
                                    {s.ruleName}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>
                    {/* Category Filter */}
                    <div className="relative group flex-1 min-w-[140px]">
                        <Activity
                            size={12}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 z-10"
                        />
                        <select
                            value={selectedCategory}
                            onChange={e => onCategoryChange(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer transition-all"
                        >
                            <option value="ALL">All Categories</option>
                            {categories.map(c => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>
                    {/* Sub Category Filter */}
                    <div className="relative group flex-1 min-w-[140px]">
                        <Info size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                        <select
                            value={selectedSubCategory}
                            onChange={e => onSubCategoryChange(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer transition-all"
                        >
                            <option value="ALL">All Sub-Cat</option>
                            {subCategories.map(sc => (
                                <option key={sc} value={sc}>
                                    {sc}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>
                    {/* Brand Filter */}
                    <div className="relative group flex-1 min-w-[120px]">
                        <Car size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                        <select
                            value={selectedBrand}
                            onChange={e => onBrandChange(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer transition-all"
                        >
                            <option value="ALL">All Brands</option>
                            {brands.map(b => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>
                    {/* Model Filter */}
                    <div className="relative group flex-1 min-w-[120px]">
                        <Package size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                        <select
                            value={selectedModel}
                            onChange={e => onModelChange(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer transition-all"
                        >
                            <option value="ALL">All Models</option>
                            {models.map(m => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>
                    {/* Variant Filter */}
                    <div className="relative group flex-1 min-w-[120px]">
                        <Package size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                        <select
                            value={selectedVariant}
                            onChange={e => onVariantChange(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer transition-all"
                        >
                            <option value="ALL">All Variants</option>
                            {variants.map(v => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                    </div>

                    {/* Individual active filters with reset icons */}
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value || value === 'ALL' || key === 'displayState') return null;
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 group animate-in fade-in zoom-in duration-200"
                            >
                                <span className="opacity-50">{key}:</span>
                                <span>{value}</span>
                                <button
                                    onClick={() => handleFilter(key as keyof SKUPriceRow, '')}
                                    className="ml-1 hover:text-rose-500 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        );
                    })}

                    {selectedBrand !== 'ALL' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 group animate-in fade-in zoom-in duration-200">
                            <span className="opacity-50">Brand:</span>
                            <span>{selectedBrand}</span>
                            <button
                                onClick={() => onBrandChange('ALL')}
                                className="ml-1 hover:text-rose-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {selectedCategory !== 'ALL' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 group animate-in fade-in zoom-in duration-200">
                            <span className="opacity-50">Category:</span>
                            <span>{selectedCategory}</span>
                            <button
                                onClick={() => onCategoryChange('ALL')}
                                className="ml-1 hover:text-rose-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {selectedSubCategory !== 'ALL' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 group animate-in fade-in zoom-in duration-200">
                            <span className="opacity-50">Sub:</span>
                            <span>{selectedSubCategory}</span>
                            <button
                                onClick={() => onSubCategoryChange('ALL')}
                                className="ml-1 hover:text-rose-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {selectedModel !== 'ALL' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 group animate-in fade-in zoom-in duration-200">
                            <span className="opacity-50">Model:</span>
                            <span>{selectedModel}</span>
                            <button
                                onClick={() => onModelChange('ALL')}
                                className="ml-1 hover:text-rose-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {selectedVariant !== 'ALL' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group animate-in fade-in zoom-in duration-200">
                            <span className="opacity-50">Variant:</span>
                            <span>{selectedVariant}</span>
                            <button
                                onClick={() => onVariantChange('ALL')}
                                className="ml-1 hover:text-rose-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {hasUnsavedChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isParentSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200/50 flex items-center gap-2 active:scale-95"
                        >
                            {isSaving || isParentSaving ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Save size={14} />
                            )}
                            Save
                        </button>
                    )}

                    {isAums && selectedSkuIds.size > 0 && (
                        <button
                            onClick={() => onCalculate?.(Array.from(selectedSkuIds))}
                            disabled={isCalculating}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200/50 flex items-center gap-1.5 active:scale-95"
                            title="Calculate RTO & Insurance"
                        >
                            {isCalculating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                            {selectedSkuIds.size}
                        </button>
                    )}

                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="p-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-all"
                        title="Export PDF"
                    >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    </button>
                </div>
            </div>

            {/* Soft Tricolor Table Card */}
            <div className="flex-1 px-6 pb-6">
                <div
                    id="pricing-ledger-table"
                    className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 relative overflow-hidden flex flex-col"
                >
                    <div className="overflow-auto scrollbar-thin flex-1">
                        <table className="w-full text-left border-separate border-spacing-0 min-w-[1200px]">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md group/header">
                                    <th className="px-4 py-4 w-10 border-b border-slate-200 dark:border-slate-800 pl-6">
                                        <input
                                            type="checkbox"
                                            checked={
                                                tableSkus.length > 0 && tableSkus.every(s => selectedSkuIds.has(s.id))
                                            }
                                            onChange={toggleAll}
                                            disabled={activeCategory === 'vehicles' && selectedVariant === 'ALL'}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer w-4 h-4 disabled:opacity-30 disabled:cursor-not-allowed"
                                        />
                                    </th>
                                    {/* DYAMIC COLUMNS based on Category */}
                                    {(activeCategory === 'vehicles' ? ['color', 'engineCc'] : ['product', 'color']).map(
                                        key => {
                                            // MAPPING: 'product' maps to 'model' for data operations
                                            const dataKey = key === 'product' ? 'model' : (key as keyof SKUPriceRow);
                                            const values = getUniqueValues(dataKey);
                                            const currentFilter = filters[dataKey];
                                            const isActive = activeFilterColumn === key; // Use visual key for UI state
                                            const statusLabels: Record<string, string> = {
                                                ACTIVE: 'Live',
                                                DRAFT: 'New',
                                                INACTIVE: 'Inactive',
                                                RELAUNCH: 'Relaunch',
                                            };

                                            return (
                                                <th
                                                    key={key}
                                                    className={`relative px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 group/header ${key === 'status' ? 'text-right' : 'text-slate-500 dark:text-slate-400'} ${key === 'color' ? 'min-w-[160px]' : 'whitespace-nowrap'}`}
                                                >
                                                    <div
                                                        className={`flex items-center gap-1 ${key === 'status' ? 'justify-end' : 'justify-between'}`}
                                                    >
                                                        <div
                                                            onClick={() => handleSort(dataKey)}
                                                            className={`flex items-center gap-1 hover:text-emerald-600 transition-colors cursor-pointer ${key === 'status' ? 'text-slate-500' : ''}`}
                                                        >
                                                            {key === 'engineCc'
                                                                ? 'Power'
                                                                : key === 'product'
                                                                  ? 'Product'
                                                                  : key}{' '}
                                                            <ArrowUpDown
                                                                size={12}
                                                                className={`opacity-30 ${sortConfig?.key === dataKey ? 'text-emerald-600 opacity-100' : ''}`}
                                                            />
                                                        </div>

                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setActiveFilterColumn(isActive ? null : key);
                                                            }}
                                                            className={`p-1 rounded-lg transition-all ${currentFilter && currentFilter !== 'ALL' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-300 hover:bg-white hover:text-slate-600 hover:shadow-sm'}`}
                                                        >
                                                            <Filter
                                                                size={12}
                                                                className={
                                                                    currentFilter && currentFilter !== 'ALL'
                                                                        ? 'fill-current'
                                                                        : ''
                                                                }
                                                            />
                                                        </button>
                                                    </div>

                                                    {/* Filter Dropdown Popover */}
                                                    {isActive && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-40 bg-transparent"
                                                                onClick={() => setActiveFilterColumn(null)}
                                                            />
                                                            <div
                                                                className={`absolute top-[80%] mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${key === 'status' ? 'right-6' : 'left-6'}`}
                                                            >
                                                                <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                                        Filter {key}
                                                                    </span>
                                                                    {currentFilter && (
                                                                        <button
                                                                            onClick={() => handleFilter(dataKey, '')}
                                                                            className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter hover:underline"
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                                                    <button
                                                                        onClick={() => handleFilter(dataKey, '')}
                                                                        className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${!currentFilter || currentFilter === '' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                                    >
                                                                        All {key}s
                                                                        {(!currentFilter || currentFilter === '') && (
                                                                            <CheckCircle2 size={12} />
                                                                        )}
                                                                    </button>
                                                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />
                                                                    {values.length > 0 ? (
                                                                        values.map(val => (
                                                                            <button
                                                                                key={val}
                                                                                onClick={() =>
                                                                                    handleFilter(dataKey, val)
                                                                                }
                                                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${currentFilter === val ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                                            >
                                                                                {key === 'status'
                                                                                    ? statusLabels[val] || val
                                                                                    : val}
                                                                                {currentFilter === val && (
                                                                                    <CheckCircle2 size={12} />
                                                                                )}
                                                                            </button>
                                                                        ))
                                                                    ) : (
                                                                        <div className="px-4 py-8 text-center">
                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                No options available
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </th>
                                            );
                                        }
                                    )}

                                    <th className="px-6 py-5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-emerald-100 dark:border-emerald-900/30 text-right whitespace-nowrap">
                                        <div
                                            className="flex items-center gap-1 justify-end cursor-pointer hover:text-emerald-700 transition-colors"
                                            onClick={() => handleSort('exShowroom')}
                                        >
                                            {activeCategory === 'vehicles' ? 'Ex-Showroom' : 'MRP'}{' '}
                                            <ArrowUpDown size={12} />
                                        </div>
                                    </th>

                                    {activeCategory === 'vehicles' ? (
                                        <>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right whitespace-nowrap">
                                                RTO
                                            </th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right whitespace-nowrap">
                                                Insurance
                                            </th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-right">
                                                Base Price
                                            </th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-right">
                                                GST (28%)
                                            </th>
                                        </>
                                    )}

                                    {activeCategory !== 'vehicles' && (
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-center min-w-[120px]">
                                            Inclusion
                                        </th>
                                    )}

                                    {!isAums && activeCategory === 'vehicles' && (
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right whitespace-nowrap">
                                            On-Road
                                        </th>
                                    )}

                                    {activeCategory !== 'vehicles' && (
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">
                                            Offer (₹)
                                        </th>
                                    )}

                                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-emerald-100 dark:border-emerald-900/30 text-right whitespace-nowrap bg-emerald-50/80 dark:bg-emerald-900/20">
                                        {activeCategory === 'vehicles'
                                            ? isAums
                                                ? 'On-Road'
                                                : 'Offer On Road'
                                            : 'Final Price'}
                                    </th>

                                    {!isAums && activeCategory === 'vehicles' && (
                                        <th className="px-6 py-5 text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-white/5 text-right whitespace-nowrap">
                                            Delta
                                        </th>
                                    )}

                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right w-[140px] whitespace-nowrap">
                                        Last Updated
                                    </th>

                                    <th className="relative px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right group/header w-[140px] whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                            <div
                                                onClick={() => handleSort('displayState')}
                                                className="flex items-center gap-1 hover:text-emerald-600 transition-colors cursor-pointer"
                                            >
                                                State{' '}
                                                <ArrowUpDown
                                                    size={12}
                                                    className={`opacity-30 ${sortConfig?.key === 'displayState' ? 'text-emerald-600 opacity-100' : ''}`}
                                                />
                                            </div>

                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setActiveFilterColumn(
                                                        activeFilterColumn === 'displayState' ? null : 'displayState'
                                                    );
                                                }}
                                                className={`p-1 rounded-lg transition-all ${filters.displayState && filters.displayState !== 'ALL' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-300 hover:bg-white hover:text-slate-600 hover:shadow-sm'}`}
                                            >
                                                <Filter
                                                    size={12}
                                                    className={
                                                        filters.displayState && filters.displayState !== 'ALL'
                                                            ? 'fill-current'
                                                            : ''
                                                    }
                                                />
                                            </button>
                                        </div>

                                        {/* Status Filter Dropdown */}
                                        {activeFilterColumn === 'displayState' && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40 bg-transparent"
                                                    onClick={() => setActiveFilterColumn(null)}
                                                />
                                                <div className="absolute top-[80%] right-6 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                            Filter state
                                                        </span>
                                                        {filters.displayState && (
                                                            <button
                                                                onClick={() => handleFilter('displayState', '')}
                                                                className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter hover:underline"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                                        <button
                                                            onClick={() => handleFilter('displayState', '')}
                                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${!filters.displayState || filters.displayState === '' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                        >
                                                            All States
                                                            {(!filters.displayState || filters.displayState === '') && (
                                                                <CheckCircle2 size={12} />
                                                            )}
                                                        </button>
                                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />
                                                        {getUniqueValues('displayState').map(val => (
                                                            <button
                                                                key={val}
                                                                onClick={() => handleFilter('displayState', val)}
                                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${filters.displayState === val ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                            >
                                                                {val}
                                                                {filters.displayState === val && (
                                                                    <CheckCircle2 size={12} />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {paginatedSkus.map(sku => {
                                    const offerDelta = Number(sku.offerAmount || 0);
                                    const gstRate = sku.gstRate || 28;
                                    const basePrice = sku.exShowroom / (1 + gstRate / 100);
                                    const totalGst = sku.exShowroom - basePrice;
                                    const isDirty =
                                        sku.originalExShowroom !== undefined &&
                                        sku.exShowroom !== sku.originalExShowroom;
                                    const isSelected = selectedSkuIds.has(sku.id);
                                    const canEdit =
                                        isSelected &&
                                        (activeCategory !== 'vehicles' ||
                                            selectedVariant !== 'ALL' ||
                                            selectedSkuIds.size <= 1);
                                    const updatedAt = sku.updatedAt || sku.publishedAt;
                                    const updatedLabel = updatedAt ? new Date(updatedAt).toLocaleString() : '—';

                                    return (
                                        <tr
                                            key={sku.id}
                                            className={`group transition-all duration-200 ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : 'even:bg-slate-50/10 dark:even:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                                        >
                                            <td className="px-6 py-5 pl-8">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(sku.id)}
                                                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer w-4 h-4"
                                                />
                                            </td>

                                            {/* VEHICLE COLUMNS */}
                                            {activeCategory === 'vehicles' && null}

                                            {/* ACCESSORY COLUMNS - Composite Product */}
                                            {activeCategory !== 'vehicles' && (
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                                            {sku.category} / {sku.subCategory} / {sku.model} /{' '}
                                                            {sku.variant}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}

                                            <td className="px-6 py-5 min-w-[160px]">
                                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase leading-relaxed">
                                                    {sku.color}
                                                </span>
                                            </td>

                                            {activeCategory === 'vehicles' && (
                                                <td className="px-6 py-5">
                                                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                                                        {sku.engineCc ? `${Number(sku.engineCc).toFixed(2)}cc` : '—'}
                                                    </span>
                                                </td>
                                            )}

                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={sku.exShowroom}
                                                        readOnly={!isAums || !canEdit}
                                                        onChange={e =>
                                                            isAums && onUpdatePrice(sku.id, Number(e.target.value))
                                                        }
                                                        className={`w-28 rounded-lg px-3 py-1.5 text-sm font-black text-right transition-all 
                                                            ${
                                                                !isAums || !canEdit
                                                                    ? 'bg-transparent border-transparent text-slate-900 dark:text-slate-100 cursor-default'
                                                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:text-white'
                                                            } 
                                                            ${isDirty ? 'text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20' : ''}
                                                        `}
                                                    />
                                                </div>
                                            </td>
                                            {activeCategory === 'vehicles' ? (
                                                <>
                                                    <td className="px-6 py-5 text-right relative group/tooltip">
                                                        <span
                                                            className={`font-bold text-[11px] text-slate-600 dark:text-slate-400 ${sku.rto_data ? 'cursor-help border-b border-dotted border-slate-300 dark:border-slate-700' : ''}`}
                                                        >
                                                            {sku.rto ? `₹${sku.rto.toLocaleString()}` : '—'}
                                                        </span>
                                                        {sku.rto_data && (
                                                            <div className="fixed right-8 top-24 z-50 w-max min-w-[240px] p-3 rounded-xl bg-[#15191e] border border-white/10 shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 pointer-events-none origin-top-right text-left">
                                                                <div className="space-y-2">
                                                                    <div className="pb-2 border-b border-white/5">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">
                                                                            Registration Options
                                                                        </p>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {(
                                                                            [
                                                                                {
                                                                                    label: 'State',
                                                                                    key: 'STATE',
                                                                                    desc: 'Standard Registration',
                                                                                },
                                                                                {
                                                                                    label: 'Bharat (BH)',
                                                                                    key: 'BH',
                                                                                    desc: 'All India Permit',
                                                                                },
                                                                                {
                                                                                    label: 'Company',
                                                                                    key: 'COMPANY',
                                                                                    desc: 'Corporate Registration',
                                                                                },
                                                                            ] as const
                                                                        ).map(opt => {
                                                                            const detail = getRtoTypeDetail(
                                                                                sku.rto_data,
                                                                                opt.key
                                                                            );
                                                                            const breakdown = detail?.breakdown;
                                                                            return (
                                                                                <div
                                                                                    key={opt.key}
                                                                                    className="bg-white/5 p-2.5 rounded-lg border border-white/5"
                                                                                >
                                                                                    <div className="flex items-center justify-between gap-4 mb-2">
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-[9px] font-bold text-white uppercase tracking-tighter">
                                                                                                {opt.label}
                                                                                            </span>
                                                                                            <span className="text-[8px] text-slate-500">
                                                                                                {opt.desc}
                                                                                            </span>
                                                                                        </div>
                                                                                        <span
                                                                                            className={`text-[10px] font-black tabular-nums ${detail?.total ? 'text-emerald-500' : 'text-slate-600'}`}
                                                                                        >
                                                                                            {detail?.total
                                                                                                ? formatMoney(
                                                                                                      detail.total
                                                                                                  )
                                                                                                : 'N/A'}
                                                                                        </span>
                                                                                    </div>
                                                                                    {breakdown && (
                                                                                        <div className="pt-2 border-t border-dashed border-white/10 space-y-1">
                                                                                            {[
                                                                                                {
                                                                                                    l: 'Road Tax',
                                                                                                    v: breakdown.roadTax,
                                                                                                },
                                                                                                {
                                                                                                    l: 'Reg. Charges',
                                                                                                    v: breakdown.registrationCharges,
                                                                                                },
                                                                                                {
                                                                                                    l: 'Smart Card',
                                                                                                    v: breakdown.smartCardCharges,
                                                                                                },
                                                                                                {
                                                                                                    l: 'Hypothecation',
                                                                                                    v: breakdown.hypothecationCharges,
                                                                                                },
                                                                                                {
                                                                                                    l: 'Postal',
                                                                                                    v: breakdown.postalCharges,
                                                                                                },
                                                                                                {
                                                                                                    l: 'Cess',
                                                                                                    v: breakdown.cessAmount,
                                                                                                },
                                                                                            ]
                                                                                                .filter(i => i.v > 0)
                                                                                                .map((item, idx) => (
                                                                                                    <div
                                                                                                        key={idx}
                                                                                                        className="flex justify-between items-center text-[9px]"
                                                                                                    >
                                                                                                        <span className="text-slate-500">
                                                                                                            {item.l}
                                                                                                        </span>
                                                                                                        <span className="text-slate-300 font-mono">
                                                                                                            {formatMoney(
                                                                                                                item.v
                                                                                                            )}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                ))}
                                                                                        </div>
                                                                                    )}
                                                                                    {!breakdown && detail?.fees && (
                                                                                        <div className="pt-2 border-t border-dashed border-white/10 space-y-1">
                                                                                            {detail.fees.map(
                                                                                                (
                                                                                                    item: any,
                                                                                                    idx: number
                                                                                                ) => (
                                                                                                    <div
                                                                                                        key={`fee-${idx}`}
                                                                                                        className="flex justify-between items-center text-[9px]"
                                                                                                    >
                                                                                                        <span className="text-slate-500">
                                                                                                            {item.label}
                                                                                                        </span>
                                                                                                        <span className="text-slate-300 font-mono">
                                                                                                            {formatMoney(
                                                                                                                item.amount
                                                                                                            )}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )
                                                                                            )}
                                                                                            {detail.tax?.map(
                                                                                                (
                                                                                                    item: any,
                                                                                                    idx: number
                                                                                                ) => (
                                                                                                    <div
                                                                                                        key={`tax-${idx}`}
                                                                                                        className="flex justify-between items-center text-[9px]"
                                                                                                    >
                                                                                                        <span className="text-slate-500">
                                                                                                            {item.label}
                                                                                                        </span>
                                                                                                        <span className="text-slate-300 font-mono">
                                                                                                            {formatMoney(
                                                                                                                item.amount
                                                                                                            )}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                                {/* Triangle pointer */}
                                                                <div className="absolute -top-1 right-8 w-2 h-2 bg-[#15191e] border-l border-t border-white/10 rotate-45" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-right relative group/tooltip">
                                                        <span
                                                            className={`font-bold text-[11px] text-slate-600 dark:text-slate-400 ${sku.insurance_data ? 'cursor-help border-b border-dotted border-slate-300 dark:border-slate-700' : ''}`}
                                                        >
                                                            {sku.insurance ? `₹${sku.insurance.toLocaleString()}` : '—'}
                                                        </span>
                                                        {sku.insurance_data && (
                                                            <div className="fixed right-8 top-24 z-50 w-max min-w-[260px] p-3 rounded-xl bg-[#15191e] border border-white/10 shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 pointer-events-none origin-top-right text-left">
                                                                <div className="space-y-2">
                                                                    <div className="pb-2 border-b border-white/5">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">
                                                                            Insurance Breakdown
                                                                        </p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between items-center text-[9px]">
                                                                            <span className="text-slate-500">
                                                                                OD Premium
                                                                            </span>
                                                                            <span className="text-slate-300 font-mono">
                                                                                {formatMoney(sku.insurance_data.od)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-[9px]">
                                                                            <span className="text-slate-500">
                                                                                TP Premium
                                                                            </span>
                                                                            <span className="text-slate-300 font-mono">
                                                                                {formatMoney(sku.insurance_data.tp)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-[9px]">
                                                                            <span className="text-slate-500">
                                                                                GST ({sku.insurance_data.gst_rate || 18}
                                                                                %)
                                                                            </span>
                                                                            <span className="text-slate-300 font-mono">
                                                                                {formatMoney(
                                                                                    (sku.insurance_data.base_total ||
                                                                                        0) -
                                                                                        ((sku.insurance_data.od || 0) +
                                                                                            (sku.insurance_data.tp ||
                                                                                                0))
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-[9px] font-bold">
                                                                            <span className="text-slate-400">
                                                                                Base Total
                                                                            </span>
                                                                            <span className="text-emerald-500 font-mono">
                                                                                {formatMoney(
                                                                                    sku.insurance_data.base_total
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {Array.isArray(sku.insurance_data.addons) &&
                                                                        sku.insurance_data.addons.length > 0 && (
                                                                            <div className="pt-2 border-t border-dashed border-white/10 space-y-1">
                                                                                {sku.insurance_data.addons.map(
                                                                                    (addon: any) => (
                                                                                        <div
                                                                                            key={
                                                                                                addon.id || addon.label
                                                                                            }
                                                                                            className="flex justify-between items-center text-[9px]"
                                                                                        >
                                                                                            <span className="text-slate-500">
                                                                                                {addon.label ||
                                                                                                    addon.id}
                                                                                            </span>
                                                                                            <span className="text-slate-300 font-mono">
                                                                                                {formatMoney(
                                                                                                    addon.total ??
                                                                                                        addon.price
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                </div>
                                                                <div className="absolute -top-1 right-8 w-2 h-2 bg-[#15191e] border-l border-t border-white/10 rotate-45" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    {!isAums && (
                                                        <td className="px-8 py-5 text-right">
                                                            <span className="font-bold text-[11px] text-slate-400 dark:text-slate-500">
                                                                {sku.onRoad ? `₹${sku.onRoad.toLocaleString()}` : '—'}
                                                            </span>
                                                        </td>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="font-bold text-[11px] text-slate-500 dark:text-slate-400">
                                                            ₹
                                                            {basePrice.toLocaleString(undefined, {
                                                                maximumFractionDigits: 0,
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="font-bold text-[11px] text-slate-500 dark:text-slate-400">
                                                            ₹
                                                            {totalGst.toLocaleString(undefined, {
                                                                maximumFractionDigits: 0,
                                                            })}
                                                        </span>
                                                    </td>
                                                </>
                                            )}

                                            {activeCategory !== 'vehicles' && (
                                                <>
                                                    <td className="px-6 py-5 text-center">
                                                        <select
                                                            value={sku.inclusionType || 'OPTIONAL'}
                                                            onChange={e => {
                                                                const type = e.target.value as
                                                                    | 'MANDATORY'
                                                                    | 'OPTIONAL'
                                                                    | 'BUNDLE';
                                                                onUpdateInclusion(sku.id, type);
                                                                if (type === 'MANDATORY' || type === 'BUNDLE')
                                                                    onUpdateOffer(sku.id, -sku.exShowroom);
                                                                else onUpdateOffer(sku.id, 0);
                                                            }}
                                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border transition-all ${sku.inclusionType === 'MANDATORY' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30' : sku.inclusionType === 'BUNDLE' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                                                        >
                                                            <option value="OPTIONAL">Optional</option>
                                                            <option value="MANDATORY">Mandatory</option>
                                                            <option value="BUNDLE">Bundle</option>
                                                        </select>
                                                    </td>
                                                    {!isAums && (
                                                        <td className="px-6 py-5 text-right">
                                                            {(() => {
                                                                const delta = offerDelta;
                                                                if (delta === 0)
                                                                    return (
                                                                        <span className="text-xs font-bold text-slate-300">
                                                                            —
                                                                        </span>
                                                                    );
                                                                const isSave = delta < 0; // Negative = discount = customer saves
                                                                return (
                                                                    <div
                                                                        className={`inline-flex items-center gap-1 font-black text-xs ${isSave ? 'text-emerald-600' : 'text-rose-600'}`}
                                                                    >
                                                                        {isSave ? (
                                                                            <Sparkles size={12} />
                                                                        ) : (
                                                                            <Zap size={12} />
                                                                        )}
                                                                        {isSave
                                                                            ? `₹${Math.abs(delta).toLocaleString()}`
                                                                            : `-₹${Math.abs(delta).toLocaleString()}`}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                    )}
                                                </>
                                            )}

                                            <td className="px-8 py-5 text-right bg-emerald-50/20 dark:bg-emerald-900/10">
                                                {isAums ? (
                                                    <span className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400 tracking-tight">
                                                        {activeCategory === 'vehicles'
                                                            ? sku.onRoad
                                                                ? `₹${sku.onRoad.toLocaleString()}`
                                                                : '—'
                                                            : `₹${sku.exShowroom.toLocaleString()}`}
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <input
                                                            type="number"
                                                            value={
                                                                activeCategory === 'vehicles'
                                                                    ? (sku.onRoad || 0) + offerDelta
                                                                    : sku.exShowroom + offerDelta
                                                            }
                                                            readOnly={!canEdit}
                                                            title={
                                                                activeCategory === 'vehicles'
                                                                    ? "Dealer's Offer On Road price to customer."
                                                                    : "Dealer's Final Price for this item."
                                                            }
                                                            onChange={e => {
                                                                const enteredPrice = Number(e.target.value);
                                                                const base =
                                                                    activeCategory === 'vehicles'
                                                                        ? sku.onRoad || 0
                                                                        : sku.exShowroom;
                                                                const newDelta = enteredPrice - base;
                                                                onUpdateOffer(sku.id, newDelta);
                                                            }}
                                                            className={`w-28 rounded-lg px-3 py-1.5 text-[11px] font-bold text-right outline-none transition-all
                                                                ${
                                                                    !canEdit
                                                                        ? 'bg-transparent border-transparent text-emerald-700 dark:text-emerald-400 cursor-default'
                                                                        : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                                }
                                                            `}
                                                        />
                                                        {isSelected && selectedSkuIds.size > 1 && (
                                                            <button
                                                                type="button"
                                                                title="Copy to all selected rows"
                                                                onClick={() => {
                                                                    const currentDelta = sku.offerAmount || 0;
                                                                    selectedSkuIds.forEach(id => {
                                                                        if (id !== sku.id) {
                                                                            onUpdateOffer(id, currentDelta);
                                                                        }
                                                                    });
                                                                }}
                                                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-400 transition-all"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {!isAums && activeCategory === 'vehicles' && (
                                                <td className="px-6 py-5 text-right">
                                                    {(() => {
                                                        // Delta = OnRoad (AUMS base) - OfferOnRoad (dealer input)
                                                        // offerDelta here is the dealer's Offer On Road price
                                                        const onRoadBase = sku.onRoad || 0;
                                                        const dealerOfferPrice = onRoadBase + offerDelta; // offerDelta is the adjustment
                                                        const delta = onRoadBase - dealerOfferPrice; // = -offerDelta

                                                        if (delta === 0 || offerDelta === 0)
                                                            return (
                                                                <span className="text-xs font-bold text-slate-300">
                                                                    —
                                                                </span>
                                                            );
                                                        const isSave = delta > 0; // Positive = customer saves
                                                        return (
                                                            <div
                                                                className={`inline-flex items-center gap-1 font-black text-xs ${isSave ? 'text-emerald-600' : 'text-rose-600'}`}
                                                            >
                                                                {isSave ? <Sparkles size={12} /> : <Zap size={12} />}
                                                                {isSave
                                                                    ? `₹${Math.abs(delta).toLocaleString()}`
                                                                    : `-₹${Math.abs(delta).toLocaleString()}`}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            )}

                                            <td className="px-6 py-5 text-right w-[140px]">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                    {updatedLabel}
                                                </span>
                                            </td>

                                            <td className="px-8 py-5 text-right w-[140px] relative">
                                                {(() => {
                                                    const state = sku.displayState || 'Draft';
                                                    const styleMap: Record<string, string> = {
                                                        Published:
                                                            'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
                                                        Live: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
                                                        'In Review':
                                                            'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
                                                        Draft: 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
                                                        Inactive:
                                                            'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
                                                    };
                                                    const isOpen = openStatusDropdownId === sku.id;
                                                    const statusOptions = [
                                                        'Draft',
                                                        'In Review',
                                                        'Published',
                                                        'Live',
                                                        'Inactive',
                                                    ];
                                                    return (
                                                        <>
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setOpenStatusDropdownId(isOpen ? null : sku.id);
                                                                }}
                                                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-emerald-400/50 ${styleMap[state] || styleMap['Draft']}`}
                                                            >
                                                                {state}
                                                            </button>
                                                            {isOpen && (
                                                                <>
                                                                    <div
                                                                        className="fixed inset-0 z-40"
                                                                        onClick={() => setOpenStatusDropdownId(null)}
                                                                    />
                                                                    <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                                                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                                Change Status
                                                                            </span>
                                                                        </div>
                                                                        <div className="p-1">
                                                                            {statusOptions.map(opt => (
                                                                                <button
                                                                                    key={opt}
                                                                                    onClick={() => {
                                                                                        const statusMap: Record<
                                                                                            string,
                                                                                            | 'ACTIVE'
                                                                                            | 'INACTIVE'
                                                                                            | 'DRAFT'
                                                                                            | 'RELAUNCH'
                                                                                        > = {
                                                                                            Draft: 'DRAFT',
                                                                                            'In Review': 'DRAFT',
                                                                                            Published: 'ACTIVE',
                                                                                            Live: 'ACTIVE',
                                                                                            Inactive: 'INACTIVE',
                                                                                        };
                                                                                        onUpdateStatus(
                                                                                            sku.id,
                                                                                            statusMap[opt] || 'DRAFT'
                                                                                        );
                                                                                        setOpenStatusDropdownId(null);
                                                                                    }}
                                                                                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all flex items-center justify-between ${
                                                                                        state === opt
                                                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                                                    }`}
                                                                                >
                                                                                    {opt}
                                                                                    {state === opt && (
                                                                                        <CheckCircle2 size={12} />
                                                                                    )}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {tableSkus.length > 0 && (
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Showing{' '}
                                <span className="text-slate-900 dark:text-white">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{' '}
                                -{' '}
                                <span className="text-slate-900 dark:text-white">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, tableSkus.length)}
                                </span>{' '}
                                of <span className="text-slate-900 dark:text-white">{tableSkus.length}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400"
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
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <Info size={16} className="text-emerald-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">
                            On-road charges are computed by server RPC (SSPP). This ledger edits ex-showroom and offer
                            deltas only.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
