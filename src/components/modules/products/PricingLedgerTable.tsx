'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    ArrowUp,
    ArrowDown,
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
    Send,
    Layers,
    Rocket,
    XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RegistrationRule } from '@/types/registration';
import { sanitizeSvg } from '@/lib/utils/sanitizeSvg';
import { formatEngineCC } from '@/utils/formatVehicleSpec';
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
    exFactory?: number;
    exFactoryGst?: number;
    offerAmount?: number;
    originalExShowroom?: number;
    originalOfferAmount?: number;
    originalInclusionType?: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE';
    hsnCode?: string;
    gstRate?: number;
    updatedAt?: string;
    publishedAt?: string;
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
    publishStage?: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'LIVE' | 'INACTIVE';
    rto_data?: any;
    insurance_data?: any;
    displayState?: 'Draft' | 'In Review' | 'Published' | 'Live' | 'Inactive';
    position?: number;
    variantPosition?: number;
    isPopular?: boolean;
    originalIsPopular?: boolean;
    finish?: string;
    hex_primary?: string;
    hex_secondary?: string;
    updatedByName?: string;
}

interface PricingLedgerTableProps {
    initialSkus: SKUPriceRow[];
    processedSkus: SKUPriceRow[];
    quickFilter?: 'inventory' | 'market_ready' | 'pipeline' | 'critical' | null;
    activeRule: RegistrationRule | null;
    onUpdatePrice: (skuId: string, price: number) => void;
    onUpdateOffer: (skuId: string, offer: number) => void;
    onUpdateInclusion: (skuId: string, type: 'MANDATORY' | 'OPTIONAL' | 'BUNDLE') => void;
    onUpdateStatus: (skuId: string, status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'RELAUNCH') => void;
    onUpdatePublishStage?: (skuId: string, stage: string) => void; // AUMS: update canonical pricing publish_stage
    onUpdateLocalStatus?: (skuId: string, isActive: boolean) => void;
    onUpdatePopular?: (skuId: string, isPopular: boolean) => void;
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
                    dangerouslySetInnerHTML={{ __html: sanitizeSvg(logo) }}
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
    quickFilter,
    onUpdatePrice,
    onUpdateOffer,
    onUpdateInclusion,
    onUpdateStatus,
    onUpdatePublishStage,
    onUpdateLocalStatus,
    onUpdatePopular,
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
}: PricingLedgerTableProps) {
    const router = useRouter();
    const { tenantSlug, tenantName, tenantConfig } = useTenant();
    const isAums = tenantSlug === 'aums';
    const [skus, setSkus] = useState<SKUPriceRow[]>(initialSkus);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSkuIds, setSelectedSkuIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);
    const [editingOfferSkuId, setEditingOfferSkuId] = useState<string | null>(null);
    const [editingOfferValue, setEditingOfferValue] = useState<string>('');

    // Only allow editing when all selected rows belong to the SAME variant
    const singleVariantSelected = useMemo(() => {
        if (selectedSkuIds.size === 0) return false;
        const variants = new Set<string>();
        for (const id of selectedSkuIds) {
            const sku = skus.find(s => s.id === id);
            if (sku) variants.add(sku.variant);
        }
        return variants.size === 1;
    }, [selectedSkuIds, skus]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            let yPos = 15;

            // --- Pre-load dealership logo ---
            const logoUrl = tenantConfig?.brand?.logoUrl;
            let logoData: string | null = null;
            let logoAspect = 1;
            if (logoUrl) {
                try {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = () => reject();
                        img.src = logoUrl;
                    });
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    logoData = canvas.toDataURL('image/png');
                    logoAspect = img.naturalWidth / img.naturalHeight;
                } catch {
                    // Logo failed to load, continue without it
                }
            }

            const dealerName = tenantConfig?.brand?.displayName || tenantName || 'Pricelist';
            const stateName = states.find(s => s.id === selectedStateId)?.ruleName || '';
            const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

            // --- Helper: draw page header ---
            const drawHeader = (brandName: string) => {
                yPos = 15;
                if (logoData) {
                    const logoH = 10;
                    const logoW = logoAspect * logoH;
                    pdf.addImage(logoData, 'PNG', 14, yPos, logoW, logoH);
                    yPos += logoH + 2;
                }
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0);
                pdf.text(dealerName, 14, yPos + 4);
                yPos += 8;
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(100);
                pdf.text(`State: ${stateName}  |  Generated: ${timestamp}`, 14, yPos + 3);
                pdf.text(`Brand: ${brandName}`, pageWidth - 14, yPos + 3, { align: 'right' });
                yPos += 8;
                pdf.setTextColor(0);
            };

            // --- Build data grouped by brand ---
            const fmt = (n?: number) => (n ? Math.round(n).toLocaleString('en-IN') : '-');
            const isVehicle = activeCategory === 'vehicles';
            const headers = isVehicle
                ? [
                      '#',
                      'Product',
                      'Variant',
                      'Color',
                      'Ex-Showroom',
                      'Offer',
                      'RTO',
                      'Insurance',
                      'On-Road',
                      'Delta',
                      'Status',
                  ]
                : ['#', 'Category/Sub', 'Product', 'Variant', 'Ex-Showroom', 'Offer', 'Inclusion', 'Status'];

            // Sort and group by brand
            const sorted = [...tableSkus].sort(
                (a, b) =>
                    a.brand.localeCompare(b.brand) ||
                    a.model.localeCompare(b.model) ||
                    a.variant.localeCompare(b.variant)
            );
            const brandGroups = new Map<string, typeof sorted>();
            sorted.forEach(sku => {
                const group = brandGroups.get(sku.brand) || [];
                group.push(sku);
                brandGroups.set(sku.brand, group);
            });

            // --- Render one table per brand, each on a new page ---
            let isFirstBrand = true;
            brandGroups.forEach((skus, brandName) => {
                if (!isFirstBrand) pdf.addPage();
                isFirstBrand = false;

                drawHeader(brandName);

                const bodyData = skus.map((sku, idx) => {
                    const offer = sku.offerAmount || 0;
                    const onRoad = sku.onRoad || 0;
                    const exShow = sku.exShowroom || 0;
                    const delta = onRoad > 0 && exShow > 0 ? onRoad - exShow : 0;

                    if (isVehicle) {
                        return [
                            String(idx + 1),
                            sku.model,
                            sku.variant,
                            sku.color || '-',
                            fmt(sku.exShowroom),
                            offer > 0 ? fmt(offer) : '-',
                            fmt(sku.rto),
                            fmt(sku.insurance),
                            fmt(sku.onRoad),
                            delta !== 0 ? fmt(Math.abs(delta)) : '-',
                            sku.displayState || sku.status || '-',
                        ];
                    }
                    return [
                        String(idx + 1),
                        `${sku.category} / ${sku.subCategory}`,
                        sku.model,
                        sku.variant,
                        fmt(sku.exShowroom),
                        offer > 0 ? fmt(offer) : '-',
                        sku.inclusionType || '-',
                        sku.displayState || sku.status || '-',
                    ];
                });

                autoTable(pdf, {
                    startY: yPos,
                    head: [headers],
                    body: bodyData,
                    theme: 'grid',
                    styles: {
                        fontSize: 7,
                        cellPadding: 1.5,
                        lineColor: [220, 220, 220],
                        lineWidth: 0.2,
                    },
                    headStyles: {
                        fillColor: [16, 185, 129],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 6.5,
                        halign: 'center',
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252],
                    },
                    columnStyles: isVehicle
                        ? {
                              0: { halign: 'center', cellWidth: 7 },
                              4: { halign: 'right', cellWidth: 20 },
                              5: { halign: 'right', cellWidth: 16 },
                              6: { halign: 'right', cellWidth: 16 },
                              7: { halign: 'right', cellWidth: 18 },
                              8: { halign: 'right', cellWidth: 20, fontStyle: 'bold' },
                              9: { halign: 'right', cellWidth: 16 },
                              10: { halign: 'center', cellWidth: 14 },
                          }
                        : {
                              0: { halign: 'center', cellWidth: 7 },
                              4: { halign: 'right', cellWidth: 20 },
                              5: { halign: 'right', cellWidth: 16 },
                              6: { halign: 'center' },
                              7: { halign: 'center', cellWidth: 14 },
                          },
                    didDrawPage: () => {
                        const pageH = pdf.internal.pageSize.getHeight();
                        pdf.setFontSize(7);
                        pdf.setTextColor(150);
                        pdf.text(`${dealerName} \u2014 Confidential Pricelist`, 14, pageH - 8);
                        pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - 14, pageH - 8, {
                            align: 'right',
                        });
                    },
                });
            });

            pdf.save(`${dealerName.replace(/\s+/g, '_')}_Pricelist_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Export failed:', error);
            alert('PDF Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };
    type CategoryType = 'vehicles' | 'accessories' | 'service';
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
    const [activeToolbarFilter, setActiveToolbarFilter] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<CategoryType>('vehicles');
    const ITEMS_PER_PAGE = 50;
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<Partial<Record<keyof SKUPriceRow, string>>>({});
    const [sortConfig, setSortConfig] = useState<{ key: keyof SKUPriceRow; direction: 'asc' | 'desc' } | null>(null);

    const [searchText, setSearchText] = useState('');
    const [prevSelectedCategory, setPrevSelectedCategory] = useState(selectedCategory);
    const [prevFilters, setPrevFilters] = useState({
        filters,
        selectedBrand,
        selectedSubCategory,
        selectedStateId,
        selectedModel,
        selectedVariant,
    } as any);

    const formatMoney = (value: number | null | undefined) => {
        if (value === null || value === undefined) return '—';
        const num = Number(value);
        if (isNaN(num)) return '—';
        return `₹${Math.round(num).toLocaleString()}`;
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

    // Reset page 1 and clear selection on internal filters (Render phase adjustment)
    if (
        filters !== prevFilters.filters ||
        selectedBrand !== prevFilters.selectedBrand ||
        selectedSubCategory !== prevFilters.selectedSubCategory ||
        selectedStateId !== prevFilters.selectedStateId ||
        selectedModel !== (prevFilters as any).selectedModel ||
        selectedVariant !== (prevFilters as any).selectedVariant
    ) {
        setPrevFilters({
            filters,
            selectedBrand,
            selectedSubCategory,
            selectedStateId,
            selectedModel,
            selectedVariant,
        } as any);
        setCurrentPage(1);
        setSelectedSkuIds(new Set());
    }

    // Sort & Filter State
    const [filterDropdownPos, setFilterDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const filterBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    // Recalculate dropdown position when scroll happens
    const updateDropdownPos = useCallback(() => {
        if (!activeFilterColumn) return;
        const btn = filterBtnRefs.current[activeFilterColumn];
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        setFilterDropdownPos({ top: rect.bottom + 4, left: Math.max(8, rect.left - 100) });
    }, [activeFilterColumn]);

    useEffect(() => {
        if (!activeFilterColumn) return;
        updateDropdownPos();
        // listen for scroll on the overflow-auto container
        const scrollEl = document.querySelector(
            '#pricing-ledger-table .overflow-auto, #pricing-ledger-table [class*="overflow-auto"]'
        );
        scrollEl?.addEventListener('scroll', updateDropdownPos);
        window.addEventListener('resize', updateDropdownPos);
        return () => {
            scrollEl?.removeEventListener('scroll', updateDropdownPos);
            window.removeEventListener('resize', updateDropdownPos);
        };
    }, [activeFilterColumn, updateDropdownPos]);

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
        setFilterDropdownPos(null);
    };

    // Derived Logic: Filters -> Unique Values for Dropdown (Cascading)
    const getUniqueValues = (key: keyof SKUPriceRow) => {
        const values = new Set<string>();

        // Start with processed dataset (which reflects parent Filters like Brand/Category)
        let baseSet = [...processedSkus];

        // 0. Filter by Active Category (Tab) — skip in critical mode to show ALL zero-price items
        if (activeCategory && quickFilter !== 'critical') {
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

        // 0. Filter by Active Category (Tab) — skip in critical mode to show ALL zero-price items
        if (activeCategory && quickFilter !== 'critical') {
            result = result.filter(sku => (sku.type || 'vehicles').toLowerCase() === activeCategory.toLowerCase());
        }

        // 0.5 Text search filter
        if (searchText.trim()) {
            const q = searchText.trim().toLowerCase();
            result = result.filter(sku => {
                const haystack = [sku.brand, sku.model, sku.variant, sku.color, (sku as any).finish]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                return haystack.includes(q);
            });
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
                if (sortConfig.key === 'updatedAt') {
                    const aTs = new Date(a.updatedAt || a.publishedAt || 0).getTime();
                    const bTs = new Date(b.updatedAt || b.publishedAt || 0).getTime();
                    return sortConfig.direction === 'asc' ? aTs - bTs : bTs - aTs;
                }
                if (sortConfig.key === 'offerAmount') {
                    const aVal =
                        activeCategory === 'vehicles'
                            ? Number(a.onRoad || 0) + Number(a.offerAmount || 0)
                            : Number(a.exShowroom || 0) + Number(a.offerAmount || 0);
                    const bVal =
                        activeCategory === 'vehicles'
                            ? Number(b.onRoad || 0) + Number(b.offerAmount || 0)
                            : Number(b.exShowroom || 0) + Number(b.offerAmount || 0);
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }
                if (sortConfig.key === 'isPopular') {
                    const aVal = a.isPopular ? 1 : 0;
                    const bVal = b.isPopular ? 1 : 0;
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }
                if (sortConfig.key === 'engineCc') {
                    const aVal = Number(a.engineCc || 0);
                    const bVal = Number(b.engineCc || 0);
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === bVal) return 0;
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                // Handle Sequential Sorting for Variant and Color
                // Use position as primary sort, but fall through to string comparison when equal
                if (
                    sortConfig.key === 'variant' &&
                    a.variantPosition !== undefined &&
                    b.variantPosition !== undefined &&
                    a.variantPosition !== b.variantPosition
                ) {
                    return sortConfig.direction === 'asc'
                        ? a.variantPosition - b.variantPosition
                        : b.variantPosition - a.variantPosition;
                }
                if (
                    sortConfig.key === 'color' &&
                    a.position !== undefined &&
                    b.position !== undefined &&
                    a.position !== b.position
                ) {
                    return sortConfig.direction === 'asc' ? a.position - b.position : b.position - a.position;
                }

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
    }, [processedSkus, filters, sortConfig, activeCategory, searchText, quickFilter]);

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
    const getSkuById = (id: string) => processedSkus.find(s => s.id === id);
    const getModelForId = (id: string) => getSkuById(id)?.model || null;

    const toggleSelection = (id: string) => {
        setSelectedSkuIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                return next;
            }

            const incomingModel = getModelForId(id);
            if (incomingModel && next.size > 0) {
                const firstId = next.values().next().value as string | undefined;
                const existingModel = firstId ? getModelForId(firstId) : null;
                if (existingModel && existingModel !== incomingModel) {
                    return new Set([id]);
                }
            }

            next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        // Check if all VISIBLE/FILTERED rows are currently selected
        const allVisibleSelected = tableSkus.length > 0 && tableSkus.every(s => selectedSkuIds.has(s.id));

        if (allVisibleSelected) {
            // Deselect all visible rows
            const newSet = new Set(selectedSkuIds);
            tableSkus.forEach(s => newSet.delete(s.id));
            setSelectedSkuIds(newSet);
        } else {
            // Select all visible rows (across all brands/models)
            const newSet = new Set(selectedSkuIds);
            tableSkus.forEach(s => newSet.add(s.id));
            setSelectedSkuIds(newSet);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        if (onSaveAll) await onSaveAll();
        setIsSaving(false);
    };

    const canPublish = (sku: SKUPriceRow) => {
        return Number(sku.rto || 0) > 0 && Number(sku.insurance || 0) > 0;
    };

    const applyPublishStage = (stage: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'LIVE' | 'INACTIVE') => {
        if (!onUpdatePublishStage) return;
        const ids = Array.from(selectedSkuIds);
        if (ids.length === 0) return;
        const invalid = ids
            .map(id => processedSkus.find(s => s.id === id))
            .filter(sku => sku && !canPublish(sku)) as SKUPriceRow[];
        if (invalid.length > 0 && (stage === 'PUBLISHED' || stage === 'LIVE')) {
            alert(
                'Some selected SKUs are missing RTO/Insurance. Edit Ex-Showroom to auto-run price engine, then publish.'
            );
            return;
        }
        ids.forEach(id => onUpdatePublishStage(id, stage));
    };

    const applyLocalStatus = (isActive: boolean) => {
        if (!onUpdateLocalStatus) return;
        const ids = Array.from(selectedSkuIds);
        if (ids.length === 0) return;
        ids.forEach(id => onUpdateLocalStatus(id, isActive));
    };

    const selectAllForModel = () => {
        const baseModel =
            (selectedSkuIds.size > 0
                ? getModelForId(selectedSkuIds.values().next().value as string)
                : selectedModel && selectedModel !== 'ALL'
                  ? selectedModel
                  : tableSkus[0]?.model) || null;
        if (!baseModel) return;
        const modelRows = tableSkus.filter(s => s.model === baseModel);
        setSelectedSkuIds(new Set(modelRows.map(s => s.id)));
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in duration-700 bg-white dark:bg-slate-950">
            {/* Soft Tricolor Toolbar */}
            <div className="z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap flex-1">
                    {/* Search Bar */}
                    <div className="relative w-[150px] ml-[10px]">
                        <Search
                            size={10}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 z-10"
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={e => {
                                setSearchText(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide placeholder:text-slate-400 placeholder:normal-case focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                        />
                    </div>
                    {/* State Filter */}
                    <div className="relative group w-[150px]">
                        <button
                            onClick={() => setActiveToolbarFilter(activeToolbarFilter === 'state' ? null : 'state')}
                            className={`w-full flex items-center justify-between pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border ${activeToolbarFilter === 'state' ? 'border-emerald-500 ring-1 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'} rounded-lg text-[9px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide transition-all`}
                        >
                            <Landmark
                                size={10}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 z-10"
                            />
                            <span className="truncate">
                                {states.find((s: RegistrationRule) => s.id === selectedStateId)?.ruleName ||
                                    'Select State'}
                            </span>
                            <Filter size={8} className="opacity-50 text-emerald-600" />
                        </button>

                        {activeToolbarFilter === 'state' && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveToolbarFilter(null)} />
                                <div className="absolute top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            Select State
                                        </span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                        {states.map((s: RegistrationRule) => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    onStateChange(s.id);
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${selectedStateId === s.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                {s.ruleName}
                                                {selectedStateId === s.id && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Category Filter */}
                    <div className="relative group w-[150px]">
                        <button
                            onClick={() =>
                                setActiveToolbarFilter(activeToolbarFilter === 'category' ? null : 'category')
                            }
                            className={`w-full flex items-center justify-between pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border ${activeToolbarFilter === 'category' ? 'border-emerald-500 ring-1 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'} rounded-lg text-[9px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide transition-all`}
                        >
                            <Activity
                                size={10}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 z-10"
                            />
                            <span className="truncate">
                                {selectedCategory === 'ALL' ? 'All Categories' : selectedCategory}
                            </span>
                            <Filter
                                size={8}
                                className={`opacity-50 ${selectedCategory !== 'ALL' ? 'text-emerald-600 opacity-100' : ''}`}
                            />
                        </button>

                        {activeToolbarFilter === 'category' && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveToolbarFilter(null)} />
                                <div className="absolute top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            Sort & Filter Category
                                        </span>
                                    </div>
                                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20">
                                        <div className="grid grid-cols-2 gap-1">
                                            <button
                                                onClick={() => {
                                                    setSortConfig({ key: 'category', direction: 'asc' });
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortConfig?.key === 'category' && sortConfig?.direction === 'asc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <ArrowUp size={12} /> ASC
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortConfig({ key: 'category', direction: 'desc' });
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortConfig?.key === 'category' && sortConfig?.direction === 'desc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <ArrowDown size={12} /> DESC
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                        <button
                                            onClick={() => {
                                                onCategoryChange('ALL');
                                                setActiveToolbarFilter(null);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${selectedCategory === 'ALL' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            All Categories
                                            {selectedCategory === 'ALL' && <CheckCircle2 size={12} />}
                                        </button>
                                        {categories.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => {
                                                    onCategoryChange(c);
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${selectedCategory === c ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                {c}
                                                {selectedCategory === c && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Brand Filter */}
                    <div className="relative group w-[160px]">
                        <button
                            onClick={() => setActiveToolbarFilter(activeToolbarFilter === 'brand' ? null : 'brand')}
                            className={`w-full flex items-center justify-between pl-7 pr-3 py-1.5 bg-white dark:bg-slate-900 border ${activeToolbarFilter === 'brand' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'} rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide transition-all`}
                        >
                            <Car size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                            <span className="truncate">{selectedBrand === 'ALL' ? 'All Brands' : selectedBrand}</span>
                            <Filter
                                size={10}
                                className={`opacity-50 ${selectedBrand !== 'ALL' ? 'text-emerald-600 opacity-100' : ''}`}
                            />
                        </button>

                        {activeToolbarFilter === 'brand' && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveToolbarFilter(null)} />
                                <div className="absolute top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            Sort & Filter Brand
                                        </span>
                                    </div>
                                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20">
                                        <div className="grid grid-cols-2 gap-1">
                                            <button
                                                onClick={() => {
                                                    setSortConfig({ key: 'brand', direction: 'asc' });
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortConfig?.key === 'brand' && sortConfig?.direction === 'asc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <ArrowUp size={12} /> ASC
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortConfig({ key: 'brand', direction: 'desc' });
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortConfig?.key === 'brand' && sortConfig?.direction === 'desc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <ArrowDown size={12} /> DESC
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                        <button
                                            onClick={() => {
                                                onBrandChange('ALL');
                                                setActiveToolbarFilter(null);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${selectedBrand === 'ALL' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            All Brands
                                            {selectedBrand === 'ALL' && <CheckCircle2 size={12} />}
                                        </button>
                                        {brands.map(b => (
                                            <button
                                                key={b}
                                                onClick={() => {
                                                    onBrandChange(b);
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${selectedBrand === b ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                {b}
                                                {selectedBrand === b && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Model Filter */}
                    <div className="relative group w-[160px]">
                        <button
                            onClick={() => setActiveToolbarFilter(activeToolbarFilter === 'model' ? null : 'model')}
                            className={`w-full flex items-center justify-between pl-7 pr-3 py-1.5 bg-white dark:bg-slate-900 border ${activeToolbarFilter === 'model' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'} rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide transition-all`}
                        >
                            <Package
                                size={12}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 z-10"
                            />
                            <span className="truncate">{selectedModel === 'ALL' ? 'All Products' : selectedModel}</span>
                            <Filter
                                size={10}
                                className={`opacity-50 ${selectedModel !== 'ALL' ? 'text-emerald-600 opacity-100' : ''}`}
                            />
                        </button>

                        {activeToolbarFilter === 'model' && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveToolbarFilter(null)} />
                                <div className="absolute top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            Sort & Filter Product
                                        </span>
                                    </div>
                                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20">
                                        <div className="grid grid-cols-2 gap-1">
                                            <button
                                                onClick={() => {
                                                    setSortConfig({ key: 'model', direction: 'asc' });
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortConfig?.key === 'model' && sortConfig?.direction === 'asc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <ArrowUp size={12} /> ASC
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSortConfig({ key: 'model', direction: 'desc' });
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortConfig?.key === 'model' && sortConfig?.direction === 'desc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <ArrowDown size={12} /> DESC
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                        <button
                                            onClick={() => {
                                                onModelChange('ALL');
                                                setActiveToolbarFilter(null);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${selectedModel === 'ALL' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            All Products
                                            {selectedModel === 'ALL' && <CheckCircle2 size={12} />}
                                        </button>
                                        {models.map(m => (
                                            <button
                                                key={m}
                                                onClick={() => {
                                                    onModelChange(m);
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${selectedModel === m ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                {m}
                                                {selectedModel === m && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Variant Filter */}
                    <div className="relative group w-[140px]">
                        <button
                            onClick={() => setActiveToolbarFilter(activeToolbarFilter === 'variant' ? null : 'variant')}
                            className={`w-full flex items-center justify-between pl-7 pr-3 py-1.5 bg-white dark:bg-slate-900 border ${activeToolbarFilter === 'variant' ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'} rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide transition-all`}
                        >
                            <Layers
                                size={12}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 z-10"
                            />
                            <span className="truncate">
                                {selectedVariant === 'ALL' ? 'All Variants' : selectedVariant}
                            </span>
                            <Filter
                                size={10}
                                className={`opacity-50 ${selectedVariant !== 'ALL' ? 'text-indigo-600 opacity-100' : ''}`}
                            />
                        </button>

                        {activeToolbarFilter === 'variant' && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveToolbarFilter(null)} />
                                <div className="absolute top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            Filter Variant
                                        </span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                        <button
                                            onClick={() => {
                                                onVariantChange('ALL');
                                                setActiveToolbarFilter(null);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${selectedVariant === 'ALL' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            All Variants
                                            {selectedVariant === 'ALL' && <CheckCircle2 size={12} />}
                                        </button>
                                        {variants.map(v => (
                                            <button
                                                key={v}
                                                onClick={() => {
                                                    onVariantChange(v);
                                                    setActiveToolbarFilter(null);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${selectedVariant === v ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                {v}
                                                {selectedVariant === v && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Individual active filters with reset icons */}
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value || value === 'ALL' || key === 'displayState') return null;
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 group animate-in fade-in zoom-in duration-200"
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
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 group animate-in fade-in zoom-in duration-200">
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
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 group animate-in fade-in zoom-in duration-200">
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
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 group animate-in fade-in zoom-in duration-200">
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
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 group animate-in fade-in zoom-in duration-200">
                            <span className="opacity-50">Product:</span>
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
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group animate-in fade-in zoom-in duration-200">
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

                <div className="flex items-center gap-1 shrink-0 mr-[18px]">
                    {/* Permanent Action Icons with Tooltips */}
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 gap-0.5 shadow-sm">
                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={!hasUnsavedChanges || isSaving || isParentSaving}
                            className={`p-1.5 rounded transition-all relative group/btn ${hasUnsavedChanges ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 hover:bg-emerald-700' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                        >
                            {isSaving || isParentSaving ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <Save size={12} />
                            )}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap z-50">
                                Save All Changes
                            </div>
                        </button>

                        {isAums && (
                            <>
                                <div className="w-px h-3 bg-slate-100 dark:bg-slate-800 mx-0.5" />

                                {/* Select Model */}
                                <button
                                    onClick={selectAllForModel}
                                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all relative group/btn"
                                >
                                    <Layers size={12} />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap z-50">
                                        Select All for Product
                                    </div>
                                </button>

                                {/* Publish */}
                                <button
                                    onClick={() => applyPublishStage('PUBLISHED')}
                                    disabled={selectedSkuIds.size === 0}
                                    className={`p-1.5 rounded transition-all relative group/btn ${selectedSkuIds.size > 0 ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'}`}
                                >
                                    <Send size={12} />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap z-50">
                                        Mark Selected Published
                                    </div>
                                </button>

                                {/* Activate */}
                                <button
                                    onClick={() => applyPublishStage('LIVE')}
                                    disabled={selectedSkuIds.size === 0}
                                    className={`p-1.5 rounded transition-all relative group/btn ${selectedSkuIds.size > 0 ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'}`}
                                >
                                    <Rocket size={12} />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap z-50">
                                        Activate Selected (Live)
                                    </div>
                                </button>
                            </>
                        )}

                        {!isAums && (
                            <>
                                <div className="w-px h-3 bg-slate-100 dark:bg-slate-800 mx-0.5" />

                                {/* Select Model */}
                                <button
                                    onClick={selectAllForModel}
                                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all relative group/btn"
                                >
                                    <Layers size={12} />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap z-50">
                                        Select All for Product
                                    </div>
                                </button>

                                {/* Bulk Activate */}
                                <button
                                    onClick={() => applyLocalStatus(true)}
                                    disabled={selectedSkuIds.size === 0}
                                    className={`p-1.5 rounded transition-all relative group/btn ${selectedSkuIds.size > 0 ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'}`}
                                >
                                    <CheckCircle2 size={12} />
                                    {selectedSkuIds.size > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[7px] font-black text-white ring-1 ring-white dark:ring-slate-900">
                                            {selectedSkuIds.size}
                                        </span>
                                    )}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap z-50">
                                        Activate Selected
                                    </div>
                                </button>

                                {/* Bulk Deactivate */}
                                <button
                                    onClick={() => applyLocalStatus(false)}
                                    disabled={selectedSkuIds.size === 0}
                                    className={`p-1.5 rounded transition-all relative group/btn ${selectedSkuIds.size > 0 ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'}`}
                                >
                                    <XCircle size={12} />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap z-50">
                                        Deactivate Selected
                                    </div>
                                </button>
                            </>
                        )}

                        <div className="w-px h-3 bg-slate-100 dark:bg-slate-800 mx-0.5" />

                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all relative group/btn"
                        >
                            {isExporting ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap z-50">
                                Export PDF
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Soft Tricolor Table Card */}
            <div className="flex-1 px-6 pb-6">
                <div
                    id="pricing-ledger-table"
                    className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 relative flex flex-col"
                >
                    <div className="overflow-auto scrollbar-thin flex-1">
                        <table className="w-full text-left border-separate border-spacing-0 min-w-[900px]">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md group/header">
                                    <th className="px-2 py-2 w-8 border-b border-slate-200 dark:border-slate-800 pl-3">
                                        <input
                                            type="checkbox"
                                            checked={
                                                tableSkus.length > 0 && tableSkus.every(s => selectedSkuIds.has(s.id))
                                            }
                                            onChange={toggleAll}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer w-4 h-4"
                                        />
                                    </th>
                                    {/* DYAMIC COLUMNS based on Category */}
                                    {(activeCategory === 'vehicles' ? ['color'] : ['product', 'color']).map(key => {
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
                                                className={`relative px-3 py-2.5 text-[9px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 group/header ${key === 'status' ? 'text-right' : 'text-slate-500 dark:text-slate-400'} ${key === 'color' ? 'min-w-[100px]' : 'whitespace-nowrap'}`}
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
                                                              : key === 'model'
                                                                ? 'Product'
                                                                : key}{' '}
                                                        <ArrowUpDown
                                                            size={12}
                                                            className={`opacity-30 ${sortConfig?.key === dataKey ? 'text-emerald-600 opacity-100' : ''}`}
                                                        />
                                                    </div>

                                                    <button
                                                        ref={el => {
                                                            filterBtnRefs.current[key] = el;
                                                        }}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            if (isActive) {
                                                                setActiveFilterColumn(null);
                                                                setFilterDropdownPos(null);
                                                            } else {
                                                                setActiveFilterColumn(key);
                                                            }
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

                                                {/* Filter dropdown rendered via portal outside overflow container */}
                                            </th>
                                        );
                                    })}

                                    {/* EX-FACTORY (AUMS only, vehicles only) */}
                                    {isAums && activeCategory === 'vehicles' && (
                                        <th className="px-2 py-2.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-center whitespace-nowrap">
                                            <div
                                                className="flex items-center gap-1 justify-center cursor-pointer hover:text-emerald-600 transition-colors"
                                                onClick={() => handleSort('exShowroom')}
                                            >
                                                Ex-Factory
                                            </div>
                                        </th>
                                    )}

                                    <th className="px-3 py-2.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-emerald-100 dark:border-emerald-900/30 text-center whitespace-nowrap">
                                        <div
                                            className="flex items-center gap-1 justify-center cursor-pointer hover:text-emerald-700 transition-colors"
                                            onClick={() => handleSort('exShowroom')}
                                        >
                                            {activeCategory === 'vehicles' ? 'Ex-Showroom' : 'MRP'}{' '}
                                            <ArrowUpDown size={12} />
                                        </div>
                                    </th>

                                    {activeCategory === 'vehicles' ? (
                                        <>
                                            <th
                                                className="px-2 py-1.5 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-center whitespace-nowrap cursor-pointer hover:text-emerald-600 transition-colors"
                                                onClick={() => handleSort('rto')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    RTO
                                                    <ArrowUpDown
                                                        size={10}
                                                        className={`opacity-30 ${sortConfig?.key === 'rto' ? 'text-emerald-600 opacity-100' : ''}`}
                                                    />
                                                </div>
                                            </th>
                                            <th
                                                className="px-2 py-1.5 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-center whitespace-nowrap cursor-pointer hover:text-emerald-600 transition-colors"
                                                onClick={() => handleSort('insurance')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    Insurance
                                                    <ArrowUpDown
                                                        size={10}
                                                        className={`opacity-30 ${sortConfig?.key === 'insurance' ? 'text-emerald-600 opacity-100' : ''}`}
                                                    />
                                                </div>
                                            </th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-2 py-1.5 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-center">
                                                Base Price
                                            </th>
                                            <th className="px-2 py-1.5 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-center">
                                                GST (28%)
                                            </th>
                                        </>
                                    )}

                                    {activeCategory !== 'vehicles' && (
                                        <th className="px-2 py-1.5 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-center min-w-[70px]">
                                            Inclusion
                                        </th>
                                    )}

                                    {!isAums && activeCategory === 'vehicles' && (
                                        <th
                                            className="px-3 py-2.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-center whitespace-nowrap cursor-pointer hover:text-emerald-600 transition-colors"
                                            onClick={() => handleSort('onRoad')}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                On-Road
                                                <ArrowUpDown
                                                    size={10}
                                                    className={`opacity-30 ${sortConfig?.key === 'onRoad' ? 'text-emerald-600 opacity-100' : ''}`}
                                                />
                                            </div>
                                        </th>
                                    )}

                                    {activeCategory !== 'vehicles' && (
                                        <th
                                            className="px-2 py-1.5 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-center cursor-pointer hover:text-emerald-600 transition-colors"
                                            onClick={() => handleSort('offerAmount')}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                Offer (₹)
                                                <ArrowUpDown
                                                    size={10}
                                                    className={`opacity-30 ${sortConfig?.key === 'offerAmount' ? 'text-emerald-600 opacity-100' : ''}`}
                                                />
                                            </div>
                                        </th>
                                    )}

                                    <th
                                        className="px-2 py-1.5 text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-emerald-100 dark:border-emerald-900/30 text-center whitespace-nowrap bg-emerald-50/80 dark:bg-emerald-900/20 cursor-pointer hover:text-emerald-700 transition-colors"
                                        onClick={() =>
                                            handleSort(
                                                activeCategory === 'vehicles' && isAums ? 'onRoad' : 'offerAmount'
                                            )
                                        }
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            {activeCategory === 'vehicles'
                                                ? isAums
                                                    ? 'On-Road'
                                                    : 'Offer On Road'
                                                : 'Final Price'}
                                            <ArrowUpDown
                                                size={10}
                                                className={`opacity-30 ${
                                                    sortConfig?.key ===
                                                    (activeCategory === 'vehicles' && isAums ? 'onRoad' : 'offerAmount')
                                                        ? 'text-emerald-600 opacity-100'
                                                        : ''
                                                }`}
                                            />
                                        </div>
                                    </th>

                                    {!isAums && activeCategory === 'vehicles' && (
                                        <th
                                            className="px-3 py-2.5 text-[9px] font-black text-emerald-400 uppercase tracking-wider border-b border-white/5 text-center whitespace-nowrap cursor-pointer hover:text-emerald-600 transition-colors"
                                            onClick={() => handleSort('offerAmount')}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                Delta
                                                <ArrowUpDown
                                                    size={10}
                                                    className={`opacity-30 ${sortConfig?.key === 'offerAmount' ? 'text-emerald-600 opacity-100' : ''}`}
                                                />
                                            </div>
                                        </th>
                                    )}

                                    <th
                                        className="px-2 py-1.5 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-right whitespace-nowrap cursor-pointer hover:text-emerald-600 transition-colors border-l border-l-slate-100 dark:border-l-slate-800"
                                        onClick={() => handleSort('updatedAt')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Updated
                                            <ArrowUpDown
                                                size={10}
                                                className={`opacity-30 ${sortConfig?.key === 'updatedAt' ? 'text-emerald-600 opacity-100' : ''}`}
                                            />
                                        </div>
                                    </th>
                                    <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-right whitespace-nowrap">
                                        By
                                    </th>

                                    <th className="relative px-2 py-1.5 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-right group/header w-[100px] whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                            <div
                                                onClick={() => handleSort('displayState')}
                                                className="flex items-center gap-1 hover:text-emerald-600 transition-colors cursor-pointer"
                                            >
                                                Status{' '}
                                                <ArrowUpDown
                                                    size={12}
                                                    className={`opacity-30 ${sortConfig?.key === 'displayState' ? 'text-emerald-600 opacity-100' : ''}`}
                                                />
                                            </div>

                                            <button
                                                ref={el => {
                                                    filterBtnRefs.current['displayState'] = el;
                                                }}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    if (activeFilterColumn === 'displayState') {
                                                        setActiveFilterColumn(null);
                                                        setFilterDropdownPos(null);
                                                    } else {
                                                        setActiveFilterColumn('displayState');
                                                    }
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

                                        {/* Status filter dropdown rendered via portal outside overflow container */}
                                    </th>

                                    {/* Popular Header */}
                                    <th
                                        className="sticky top-0 z-20 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 text-[8px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider border-r border-emerald-100 dark:border-white/10 w-14 cursor-pointer hover:text-emerald-600 transition-colors"
                                        onClick={() => handleSort('isPopular')}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Popular
                                            <ArrowUpDown
                                                size={10}
                                                className={`opacity-30 ${sortConfig?.key === 'isPopular' ? 'text-emerald-600 opacity-100' : ''}`}
                                            />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {paginatedSkus.map(sku => {
                                    const offerDelta = Math.round(Number(sku.offerAmount || 0));
                                    const gstRate = sku.gstRate || 28;
                                    const basePrice = Math.round(sku.exShowroom / (1 + gstRate / 100));
                                    const totalGst = sku.exShowroom - basePrice;
                                    const isDirty =
                                        sku.originalExShowroom !== undefined &&
                                        sku.exShowroom !== sku.originalExShowroom;
                                    const isSelected = selectedSkuIds.has(sku.id);
                                    const canEdit = isSelected;
                                    const updatedAt = sku.updatedAt || sku.publishedAt;
                                    const updatedLabel = (() => {
                                        if (!updatedAt) return '—';
                                        const d = new Date(updatedAt);
                                        const day = d.getDate();
                                        const mon = d.toLocaleString('en-IN', { month: 'short' });
                                        const time = d.toLocaleString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true,
                                        });
                                        return `${day} ${mon}, ${time}`;
                                    })();
                                    const updatedByName = sku.updatedByName || '—';

                                    return (
                                        <tr
                                            key={sku.id}
                                            className={`group transition-all duration-200 ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : 'even:bg-slate-50 dark:even:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                                        >
                                            <td className="px-2 py-1.5 pl-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(sku.id)}
                                                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer w-4 h-4"
                                                />
                                            </td>

                                            {/* VEHICLE COLUMNS — no more Product/Variant columns */}

                                            {/* ACCESSORY COLUMNS - Composite Product */}
                                            {activeCategory !== 'vehicles' && (
                                                <td className="px-3 py-1.5">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                                            {sku.category} / {sku.subCategory} / {sku.model} /{' '}
                                                            {sku.variant}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}

                                            <td className="px-3 py-1.5 min-w-[120px]">
                                                <div className="flex items-center gap-2">
                                                    {sku.hex_primary && (
                                                        <div
                                                            className="w-3 h-3 rounded-full border border-slate-200 dark:border-white/10 shrink-0 shadow-sm"
                                                            style={{
                                                                background: sku.hex_secondary
                                                                    ? `linear-gradient(135deg, ${sku.hex_primary} 50%, ${sku.hex_secondary} 50%)`
                                                                    : sku.hex_primary,
                                                            }}
                                                            title={sku.hex_primary}
                                                        />
                                                    )}
                                                    <div className="flex flex-col gap-0 text-left">
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                                            {sku.color}
                                                        </span>
                                                        {sku.finish && (
                                                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                                                {sku.finish}
                                                            </span>
                                                        )}
                                                        {activeCategory === 'vehicles' && sku.engineCc ? (
                                                            <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 tracking-tight mt-0.5">
                                                                {formatEngineCC(Number(sku.engineCc))}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* EX-FACTORY cell (AUMS only, vehicles only, editable) */}
                                            {isAums && activeCategory === 'vehicles' && (
                                                <td className="px-2 py-1 text-center">
                                                    <input
                                                        type="number"
                                                        value={Math.round(sku.exFactory || sku.exShowroom || 0)}
                                                        readOnly={!canEdit}
                                                        onChange={e => {
                                                            const val = Number(e.target.value);
                                                            // Update exFactory locally
                                                            const safeVal =
                                                                Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
                                                            // Use onUpdatePrice indirectly — store in SKU state
                                                            setSkus?.((prev: SKUPriceRow[]) =>
                                                                prev.map((s: SKUPriceRow) =>
                                                                    s.id === sku.id ? { ...s, exFactory: safeVal } : s
                                                                )
                                                            );
                                                        }}
                                                        className={`w-24 rounded-lg px-2 py-1 text-[10px] font-black text-right transition-all
                                                            ${
                                                                !canEdit
                                                                    ? 'bg-transparent border-transparent text-slate-400 dark:text-slate-500 cursor-default tabular-nums'
                                                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:text-white tabular-nums'
                                                            }
                                                        `}
                                                    />
                                                </td>
                                            )}

                                            <td className="px-2 py-1 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={sku.exShowroom}
                                                        readOnly={!isAums || !canEdit}
                                                        onChange={e =>
                                                            isAums && onUpdatePrice(sku.id, Number(e.target.value))
                                                        }
                                                        className={`w-24 rounded-lg px-2 py-1 text-[10px] font-black text-center transition-all 
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
                                                    <td className="px-3 py-1.5 text-center relative group/rto">
                                                        <span
                                                            className={`font-bold text-[11px] text-slate-600 dark:text-slate-400 ${sku.rto_data ? 'cursor-help border-b border-dotted border-slate-300 dark:border-slate-700' : ''}`}
                                                        >
                                                            {sku.rto ? `₹${Math.round(sku.rto).toLocaleString()}` : '—'}
                                                        </span>
                                                        {sku.rto_data && (
                                                            <div className="absolute right-0 top-full mt-1 z-[60] w-max min-w-[260px] p-3.5 rounded-xl bg-[#0d1117] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover/rto:opacity-100 group-hover/rto:visible transition-all duration-200 pointer-events-none text-left">
                                                                <div className="space-y-2.5">
                                                                    <div className="pb-2 border-b border-white/5">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">
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
                                                                                    className="bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06] hover:border-white/10 transition-colors"
                                                                                >
                                                                                    <div className="flex items-center justify-between gap-4 mb-2">
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-[10px] font-bold text-white/90 uppercase tracking-tight">
                                                                                                {opt.label}
                                                                                            </span>
                                                                                            <span className="text-[8px] text-slate-500">
                                                                                                {opt.desc}
                                                                                            </span>
                                                                                        </div>
                                                                                        <span
                                                                                            className={`text-[11px] font-black tabular-nums ${detail?.total ? 'text-emerald-400' : 'text-slate-600'}`}
                                                                                        >
                                                                                            {detail?.total
                                                                                                ? formatMoney(
                                                                                                      detail.total
                                                                                                  )
                                                                                                : 'N/A'}
                                                                                        </span>
                                                                                    </div>
                                                                                    {breakdown && (
                                                                                        <div className="pt-2 border-t border-dashed border-white/[0.06] space-y-1">
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
                                                                                                        <span className="text-slate-300 font-mono tabular-nums">
                                                                                                            {formatMoney(
                                                                                                                item.v
                                                                                                            )}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                ))}
                                                                                        </div>
                                                                                    )}
                                                                                    {!breakdown && detail?.fees && (
                                                                                        <div className="pt-2 border-t border-dashed border-white/[0.06] space-y-1">
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
                                                                                                        <span className="text-slate-300 font-mono tabular-nums">
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
                                                                                                        <span className="text-slate-300 font-mono tabular-nums">
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
                                                                <div className="absolute -top-1 right-4 w-2 h-2 bg-[#0d1117] border-l border-t border-white/10 rotate-45" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-center relative group/ins">
                                                        <span
                                                            className={`font-bold text-[11px] text-slate-600 dark:text-slate-400 ${sku.insurance_data ? 'cursor-help border-b border-dotted border-slate-300 dark:border-slate-700' : ''}`}
                                                        >
                                                            {sku.insurance
                                                                ? `₹${Math.round(sku.insurance).toLocaleString()}`
                                                                : '—'}
                                                        </span>
                                                        {sku.insurance_data && (
                                                            <div className="absolute right-0 top-full mt-1 z-[60] w-max min-w-[280px] p-3.5 rounded-xl bg-[#0d1117] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover/ins:opacity-100 group-hover/ins:visible transition-all duration-200 pointer-events-none text-left">
                                                                <div className="space-y-2.5">
                                                                    <div className="pb-2 border-b border-white/5">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">
                                                                            Insurance Breakdown
                                                                        </p>
                                                                    </div>

                                                                    {/* OD Section */}
                                                                    <div className="bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06]">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-[10px] font-bold text-white/90 uppercase tracking-tight">
                                                                                Own Damage (OD)
                                                                            </span>
                                                                            <span className="text-[11px] font-black tabular-nums text-emerald-400">
                                                                                {formatMoney(
                                                                                    (sku.insurance_data.od?.base || 0) +
                                                                                        (sku.insurance_data.od?.gst ||
                                                                                            0)
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        <div className="pt-1.5 border-t border-dashed border-white/[0.06] space-y-1">
                                                                            <div className="flex justify-between items-center text-[9px]">
                                                                                <span className="text-slate-500">
                                                                                    Premium
                                                                                </span>
                                                                                <span className="text-slate-300 font-mono tabular-nums">
                                                                                    {formatMoney(
                                                                                        sku.insurance_data.od?.base
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-[9px]">
                                                                                <span className="text-slate-500">
                                                                                    GST
                                                                                </span>
                                                                                <span className="text-slate-300 font-mono tabular-nums">
                                                                                    {formatMoney(
                                                                                        sku.insurance_data.od?.gst
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* TP Section */}
                                                                    <div className="bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06]">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-[10px] font-bold text-white/90 uppercase tracking-tight">
                                                                                Third Party (TP)
                                                                            </span>
                                                                            <span className="text-[11px] font-black tabular-nums text-emerald-400">
                                                                                {formatMoney(
                                                                                    (sku.insurance_data.tp?.base || 0) +
                                                                                        (sku.insurance_data.tp?.gst ||
                                                                                            0)
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        <div className="pt-1.5 border-t border-dashed border-white/[0.06] space-y-1">
                                                                            <div className="flex justify-between items-center text-[9px]">
                                                                                <span className="text-slate-500">
                                                                                    Premium
                                                                                </span>
                                                                                <span className="text-slate-300 font-mono tabular-nums">
                                                                                    {formatMoney(
                                                                                        sku.insurance_data.tp?.base
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-[9px]">
                                                                                <span className="text-slate-500">
                                                                                    GST
                                                                                </span>
                                                                                <span className="text-slate-300 font-mono tabular-nums">
                                                                                    {formatMoney(
                                                                                        sku.insurance_data.tp?.gst
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Addons */}
                                                                    {Array.isArray(sku.insurance_data.addons) &&
                                                                        sku.insurance_data.addons.length > 0 && (
                                                                            <div className="bg-white/[0.04] p-2.5 rounded-lg border border-white/[0.06]">
                                                                                <p className="text-[9px] font-bold text-white/70 uppercase tracking-tight mb-1.5">
                                                                                    Add-ons
                                                                                </p>
                                                                                <div className="space-y-1">
                                                                                    {sku.insurance_data.addons.map(
                                                                                        (addon: any) => (
                                                                                            <div
                                                                                                key={
                                                                                                    addon.id ||
                                                                                                    addon.label
                                                                                                }
                                                                                                className="flex justify-between items-center text-[9px]"
                                                                                            >
                                                                                                <span className="text-slate-500">
                                                                                                    {addon.label ||
                                                                                                        addon.id}
                                                                                                </span>
                                                                                                <span className="text-slate-300 font-mono tabular-nums">
                                                                                                    {formatMoney(
                                                                                                        addon.total ??
                                                                                                            addon.price
                                                                                                    )}
                                                                                                </span>
                                                                                            </div>
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                    {/* Grand Total */}
                                                                    <div className="pt-2.5 border-t border-white/10">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-[10px] font-black text-white/80 uppercase tracking-tight">
                                                                                Gross Premium
                                                                            </span>
                                                                            <span className="text-[12px] font-black text-emerald-400 font-mono tabular-nums">
                                                                                {formatMoney(
                                                                                    sku.insurance_data.base_total
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* Triangle pointer */}
                                                                <div className="absolute -top-1 right-4 w-2 h-2 bg-[#0d1117] border-l border-t border-white/10 rotate-45" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    {!isAums && (
                                                        <td className="px-2 py-1 text-center">
                                                            <span className="font-bold text-[11px] text-slate-400 dark:text-slate-500">
                                                                {sku.onRoad
                                                                    ? `₹${Math.round(sku.onRoad).toLocaleString()}`
                                                                    : '—'}
                                                            </span>
                                                        </td>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-2 py-1 text-center">
                                                        <span className="font-bold text-[11px] text-slate-500 dark:text-slate-400">
                                                            ₹
                                                            {basePrice.toLocaleString(undefined, {
                                                                maximumFractionDigits: 0,
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-1 text-center">
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
                                                    <td className="px-3 py-1.5 text-center">
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
                                                        <td className="px-2 py-1 text-center">
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
                                                                            ? `₹${Math.round(Math.abs(delta)).toLocaleString()}`
                                                                            : `-₹${Math.round(Math.abs(delta)).toLocaleString()}`}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                    )}
                                                </>
                                            )}

                                            <td className="px-3 py-1.5 text-center bg-emerald-50/20 dark:bg-emerald-900/10">
                                                {isAums ? (
                                                    <span className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400 tracking-tight">
                                                        {activeCategory === 'vehicles'
                                                            ? sku.onRoad
                                                                ? `₹${Math.round(sku.onRoad).toLocaleString()}`
                                                                : '—'
                                                            : `₹${Math.round(sku.exShowroom).toLocaleString()}`}
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input
                                                            type="number"
                                                            step={1}
                                                            min={
                                                                (activeCategory === 'vehicles'
                                                                    ? sku.onRoad || 0
                                                                    : sku.exShowroom) - 25000
                                                            }
                                                            max={
                                                                (activeCategory === 'vehicles'
                                                                    ? sku.onRoad || 0
                                                                    : sku.exShowroom) + 25000
                                                            }
                                                            value={
                                                                editingOfferSkuId === sku.id
                                                                    ? editingOfferValue
                                                                    : Math.round(
                                                                          activeCategory === 'vehicles'
                                                                              ? (sku.onRoad || 0) + offerDelta
                                                                              : sku.exShowroom + offerDelta
                                                                      )
                                                            }
                                                            readOnly={!canEdit}
                                                            title={
                                                                activeCategory === 'vehicles'
                                                                    ? "Dealer's Offer On Road price to customer. Delta range: -25000 to +25000."
                                                                    : "Dealer's Final Price for this item. Delta range: -25000 to +25000."
                                                            }
                                                            onFocus={() => {
                                                                const displayVal = Math.round(
                                                                    activeCategory === 'vehicles'
                                                                        ? (sku.onRoad || 0) + offerDelta
                                                                        : sku.exShowroom + offerDelta
                                                                );
                                                                setEditingOfferSkuId(sku.id);
                                                                setEditingOfferValue(String(displayVal));
                                                            }}
                                                            onChange={e => {
                                                                if (editingOfferSkuId === sku.id) {
                                                                    setEditingOfferValue(e.target.value);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                if (editingOfferSkuId === sku.id) {
                                                                    const enteredPrice = Math.round(
                                                                        Number(editingOfferValue)
                                                                    );
                                                                    const base = Math.round(
                                                                        activeCategory === 'vehicles'
                                                                            ? sku.onRoad || 0
                                                                            : sku.exShowroom
                                                                    );
                                                                    const newDelta = enteredPrice - base;
                                                                    onUpdateOffer(sku.id, newDelta);
                                                                    setEditingOfferSkuId(null);
                                                                }
                                                            }}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    (e.target as HTMLInputElement).blur();
                                                                }
                                                            }}
                                                            className={`w-24 rounded-lg px-2 py-1 text-[10px] font-bold text-center outline-none transition-all
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
                                                <td className="px-2 py-1 text-center">
                                                    {(() => {
                                                        // Delta = OnRoad (AUMS base) - OfferOnRoad (dealer input)
                                                        // Auto-calculated, read-only
                                                        const onRoadBase = sku.onRoad || 0;
                                                        const delta = -offerDelta; // delta = onRoad - offerPrice = -offerAmount
                                                        if (delta === 0)
                                                            return (
                                                                <span className="text-xs font-bold text-slate-300">
                                                                    —
                                                                </span>
                                                            );
                                                        const isDiscount = delta > 0; // positive delta = dealer offering below on-road = discount
                                                        return (
                                                            <div
                                                                className={`inline-flex items-center gap-1 font-black text-xs ${isDiscount ? 'text-emerald-600' : 'text-rose-600'}`}
                                                                title={`Auto-calculated: On-road (₹${Math.round(onRoadBase).toLocaleString()}) - Offer Price = ${delta > 0 ? '-' : '+'}₹${Math.round(Math.abs(delta)).toLocaleString()}`}
                                                            >
                                                                {isDiscount ? (
                                                                    <Sparkles size={12} />
                                                                ) : (
                                                                    <Zap size={12} />
                                                                )}
                                                                {isDiscount
                                                                    ? `-₹${Math.round(Math.abs(delta)).toLocaleString()}`
                                                                    : `+₹${Math.round(Math.abs(delta)).toLocaleString()}`}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                            )}

                                            <td className="px-2 py-1 text-right border-l border-l-slate-50 dark:border-l-slate-800/50">
                                                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {updatedLabel}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                                    {updatedByName}
                                                </span>
                                            </td>

                                            <td className="px-3 py-1.5 text-right w-[90px] relative">
                                                {(() => {
                                                    const state = isAums
                                                        ? sku.displayState || 'Draft'
                                                        : sku.localIsActive
                                                          ? 'Live'
                                                          : 'Inactive';
                                                    const displayLabel = !isAums
                                                        ? state === 'Live'
                                                            ? 'Active'
                                                            : 'Inactive'
                                                        : state;
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
                                                    const baseOptions = [
                                                        'Draft',
                                                        'In Review',
                                                        'Published',
                                                        'Live',
                                                        'Inactive',
                                                    ];
                                                    const statusOptions = isAums
                                                        ? state === 'In Review'
                                                            ? ['Published']
                                                            : state === 'Published'
                                                              ? ['Live']
                                                              : baseOptions
                                                        : ['Active', 'Inactive'];
                                                    const selectedOpt = isAums ? state : displayLabel;
                                                    return (
                                                        <>
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setOpenStatusDropdownId(isOpen ? null : sku.id);
                                                                }}
                                                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-emerald-400/50 ${styleMap[state] || styleMap['Draft']}`}
                                                            >
                                                                {displayLabel}
                                                            </button>
                                                            {isAums && !canPublish(sku) && (
                                                                <span
                                                                    className="ml-2 px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[9px] font-black uppercase tracking-widest no-export"
                                                                    title="Missing RTO/Insurance values. Edit ex-showroom to trigger price engine."
                                                                >
                                                                    Missing Calc
                                                                </span>
                                                            )}
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
                                                                                        if (
                                                                                            isAums &&
                                                                                            onUpdatePublishStage
                                                                                        ) {
                                                                                            // AUMS: Update publish_stage in canonical pricing flow
                                                                                            const stageMap: Record<
                                                                                                string,
                                                                                                string
                                                                                            > = {
                                                                                                Draft: 'DRAFT',
                                                                                                'In Review':
                                                                                                    'UNDER_REVIEW',
                                                                                                Published: 'PUBLISHED',
                                                                                                Live: 'LIVE',
                                                                                                Inactive: 'INACTIVE',
                                                                                            };
                                                                                            if (
                                                                                                (stageMap[opt] ===
                                                                                                    'PUBLISHED' ||
                                                                                                    stageMap[opt] ===
                                                                                                        'LIVE') &&
                                                                                                !canPublish(sku)
                                                                                            ) {
                                                                                                alert(
                                                                                                    'RTO/Insurance missing. Please calculate before publish.'
                                                                                                );
                                                                                                return;
                                                                                            }
                                                                                            onUpdatePublishStage(
                                                                                                sku.id,
                                                                                                stageMap[opt] || 'DRAFT'
                                                                                            );
                                                                                        } else if (
                                                                                            onUpdateLocalStatus
                                                                                        ) {
                                                                                            // Non-AUMS: Update dealer-local visibility
                                                                                            onUpdateLocalStatus(
                                                                                                sku.id,
                                                                                                opt === 'Active'
                                                                                            );
                                                                                        } else {
                                                                                            // Fallback: Update status in cat_skus
                                                                                            const statusMap: Record<
                                                                                                string,
                                                                                                | 'ACTIVE'
                                                                                                | 'INACTIVE'
                                                                                                | 'DRAFT'
                                                                                                | 'RELAUNCH'
                                                                                            > = {
                                                                                                Active: 'ACTIVE',
                                                                                                Inactive: 'INACTIVE',
                                                                                            };
                                                                                            onUpdateStatus(
                                                                                                sku.id,
                                                                                                statusMap[opt] ||
                                                                                                    'DRAFT'
                                                                                            );
                                                                                        }
                                                                                        setOpenStatusDropdownId(null);
                                                                                    }}
                                                                                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all flex items-center justify-between ${
                                                                                        selectedOpt === opt
                                                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                                                    }`}
                                                                                >
                                                                                    {isAums && opt === 'Live'
                                                                                        ? 'Active'
                                                                                        : opt}
                                                                                    {selectedOpt === opt && (
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

                                            <td className="px-6 py-5 border-r border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            if (onUpdatePopular)
                                                                onUpdatePopular(sku.id, !sku.isPopular);
                                                        }}
                                                        className={`p-2 rounded-xl transition-all ${
                                                            sku.isPopular
                                                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 scale-110 shadow-lg shadow-amber-500/10'
                                                                : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500 hover:bg-slate-100'
                                                        }`}
                                                        title={
                                                            sku.isPopular ? 'Remove Popular Badge' : 'Mark as Popular'
                                                        }
                                                    >
                                                        <Rocket
                                                            size={14}
                                                            className={sku.isPopular ? 'fill-current' : ''}
                                                        />
                                                    </button>
                                                </div>
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
                            {activeCategory === 'accessories'
                                ? 'Accessory pricing: Final Price = MRP + GST. No RTO or Insurance applicable.'
                                : 'On-road charges are computed by server RPC (SSPP). This ledger edits ex-showroom and offer deltas only.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Portal-rendered filter dropdown — escapes overflow clipping */}
            {activeFilterColumn &&
                filterDropdownPos &&
                typeof document !== 'undefined' &&
                createPortal(
                    (() => {
                        const colKey = activeFilterColumn;
                        const dataKey = (colKey === 'product' ? 'model' : colKey) as keyof SKUPriceRow;
                        const currentFilter = filters[dataKey];
                        const values = getUniqueValues(dataKey);
                        const statusLabels: Record<string, string> = {
                            ACTIVE: 'Live',
                            DRAFT: 'New',
                            INACTIVE: 'Inactive',
                            RELAUNCH: 'Relaunch',
                        };
                        const displayLabel =
                            colKey === 'engineCc'
                                ? 'Power'
                                : colKey === 'displayState'
                                  ? 'Status'
                                  : colKey === 'product' || colKey === 'model'
                                    ? 'Product'
                                    : colKey.charAt(0).toUpperCase() + colKey.slice(1);

                        return (
                            <>
                                <div
                                    className="fixed inset-0 z-[9998] bg-transparent"
                                    onClick={() => {
                                        setActiveFilterColumn(null);
                                        setFilterDropdownPos(null);
                                    }}
                                />
                                <div
                                    className="fixed w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                    style={{ top: filterDropdownPos.top, left: filterDropdownPos.left }}
                                >
                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            Sort & Filter {displayLabel}
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
                                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20">
                                        <div className="grid grid-cols-2 gap-1">
                                            <button
                                                onClick={() => {
                                                    if (
                                                        sortConfig?.key !== dataKey ||
                                                        sortConfig?.direction !== 'asc'
                                                    ) {
                                                        setSortConfig({ key: dataKey, direction: 'asc' });
                                                    } else {
                                                        setSortConfig(null);
                                                    }
                                                    setActiveFilterColumn(null);
                                                    setFilterDropdownPos(null);
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortConfig?.key === dataKey && sortConfig?.direction === 'asc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <ArrowUp size={12} /> ASC
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (
                                                        sortConfig?.key !== dataKey ||
                                                        sortConfig?.direction !== 'desc'
                                                    ) {
                                                        setSortConfig({ key: dataKey, direction: 'desc' });
                                                    } else {
                                                        setSortConfig(null);
                                                    }
                                                    setActiveFilterColumn(null);
                                                    setFilterDropdownPos(null);
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortConfig?.key === dataKey && sortConfig?.direction === 'desc' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <ArrowDown size={12} /> DESC
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
                                        <button
                                            onClick={() => handleFilter(dataKey, '')}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${!currentFilter || currentFilter === '' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            All {displayLabel}s
                                            {(!currentFilter || currentFilter === '') && <CheckCircle2 size={12} />}
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2" />
                                        {values.length > 0 ? (
                                            values.map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => handleFilter(dataKey, val)}
                                                    className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all mb-1 flex items-center justify-between ${currentFilter === val ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    {colKey === 'displayState' ? statusLabels[val] || val : val}
                                                    {currentFilter === val && <CheckCircle2 size={12} />}
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
                        );
                    })(),
                    document.body
                )}
        </div>
    );
}
