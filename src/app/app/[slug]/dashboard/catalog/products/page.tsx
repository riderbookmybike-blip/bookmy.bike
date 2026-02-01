'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import { Plus, Database, Search, Filter, Zap, ArrowUpDown, Copy, Check, Image as ImageIcon, FileText, Youtube, ChevronLeft, ChevronRight } from 'lucide-react';
import { CatalogItem } from '@/types/store';

function CopyableId({ id }: { id: string }) {
    const [copied, setCopied] = useState(false);
    const rawId = id.slice(-9);

    // Format as 3-3-3 (e.g. abc-def-ghi)
    const formattedId = `${rawId.slice(0, 3)}-${rawId.slice(3, 6)}-${rawId.slice(6)}`;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(rawId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="group/btn flex items-center gap-2 mt-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-all w-fit -ml-2"
            title="Click to copy ID"
        >
            <span className="text-xs font-mono font-bold text-slate-500 group-hover/btn:text-indigo-600 transition-colors uppercase tracking-widest">
                #{formattedId}
            </span>
            {copied ? (
                <Check size={12} className="text-emerald-500" />
            ) : (
                <Copy size={12} className="text-slate-300 group-hover/btn:text-indigo-500" />
            )}
        </button>
    );
}

export default function UnifiedCatalogPage() {
    const router = useRouter();
    const { tenantSlug } = useTenant();
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedBrand, setSelectedBrand] = useState('ALL');
    const [selectedTemplate, setSelectedTemplate] = useState('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setIsLoading(true);
        const supabase = createClient();

        // 1. Fetch Families with nested children for the list
        const { data, error } = await supabase
            .from('cat_items')
            .select(`
                *,
                brand:cat_brands(id, name, logo_svg),
                template:cat_templates(id, name, hierarchy_config, category),
                colors:cat_items!parent_id(id, name, type, specs, position, status),
                variants:cat_items!parent_id(
                    id, name, type, position, status,
                    skus:cat_items!parent_id(id, name, type, specs, slug, status)
                )
            `)
            .eq('type', 'FAMILY')
            .order('created_at', { ascending: false });

        if (data) setItems(data as any);
        setIsLoading(false);
    };

    // Filter Logic Calculation
    const { uniqueBrands, filteredTemplates } = useMemo(() => {
        if (!items) return { uniqueBrands: [], filteredTemplates: [] };

        const brandsMap = new Map();
        const templatesMap = new Map();

        items.forEach((item: any) => {
            if (item.brand) {
                // Cascading: Only show brands that have products in the selected category
                const matchesCategory = selectedCategory === 'ALL' || item.template?.category === selectedCategory;
                if (matchesCategory) {
                    brandsMap.set(item.brand.id, item.brand);
                }
            }
            if (item.template) {
                // Cascading Filters: Only show templates belonging to the selected Brand and Category
                const matchesBrand = selectedBrand === 'ALL' || item.brand_id === selectedBrand;
                const matchesCategory = selectedCategory === 'ALL' || item.template.category === selectedCategory;

                if (matchesBrand && matchesCategory) {
                    templatesMap.set(item.template.id, item.template);
                }
            }
        });

        // Info: Sort alphabetically
        const sortedBrands = Array.from(brandsMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        const sortedTemplates = Array.from(templatesMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));

        return {
            uniqueBrands: sortedBrands,
            filteredTemplates: sortedTemplates
        };
    }, [items, selectedCategory, selectedBrand]);

    // Dynamic Stats Logic
    const stats = useMemo(() => {
        if (!items) return { activeBrands: 0, activeModels: 0, activeVariants: 0, activeColors: 0, activeSkus: 0, inactiveSkus: 0 };

        // 1. Filter Families strictly based on Brand + Category + Template selection
        const filteredFamilies = items.filter((f: any) => {
            const matchesBrand = selectedBrand === 'ALL' || f.brand_id === selectedBrand;
            const matchesCategory = selectedCategory === 'ALL' || f.template?.category === selectedCategory;
            const matchesTemplate = selectedTemplate === 'ALL' || f.template_id === selectedTemplate;
            return matchesBrand && matchesCategory && matchesTemplate;
        });

        const activeBrands = new Set(filteredFamilies.map(f => f.brand_id).filter(Boolean)).size;
        const activeModels = filteredFamilies.length;

        // 2. Aggregate counts from filtered families
        let activeVariantsTotal = 0;
        let activeColorsTotal = 0;
        let activeSkusTotal = 0;
        let inactiveSkusTotal = 0;

        filteredFamilies.forEach((f: any) => {
            const variants = (f.variants || []).filter((v: any) => v.type === 'VARIANT');
            const colors = (f.colors || []).filter((c: any) => c.type === 'COLOR_DEF');

            activeVariantsTotal += variants.length;
            activeColorsTotal += colors.length;

            // Count SKUs from these filtered variants
            variants.forEach((v: any) => {
                const skus = v.skus || [];
                activeSkusTotal += skus.filter((s: any) => s.status === 'ACTIVE').length;
                inactiveSkusTotal += skus.filter((s: any) => s.status !== 'ACTIVE').length;
            });
        });

        return {
            activeBrands,
            activeModels,
            activeVariants: activeVariantsTotal,
            activeColors: activeColorsTotal,
            activeSkus: activeSkusTotal,
            inactiveSkus: inactiveSkusTotal
        };
    }, [items, selectedBrand, selectedCategory, selectedTemplate]);

    // Removed Auto-Selection Effects to allow "ALL" selection


    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const processedSkus = useMemo(() => {
        if (!items) return [];
        let skus = items.flatMap(family => {
            // Create a map of Color Name -> { Position, Hex } for this family
            const colorMap = new Map<string, { position: number, hex: string }>();
            ((family as any).colors || []).forEach((c: any) => {
                if (c.name) {
                    colorMap.set(c.name.toUpperCase(), {
                        position: c.position !== undefined ? c.position : 999,
                        hex: c.specs?.hex_primary || c.specs?.hex || ''
                    });
                }
            });

            return ((family as any).variants || []).flatMap((variant: any) =>
                (variant.skus || []).map((sku: any) => {
                    const brandName = (family as any).brand?.name || '';
                    const familyName = family.name || '';
                    const skuName = sku.name || '';
                    const variantName = variant.name || '';

                    // Determine Color Name logic
                    const rawColorName = sku.specs?.[(family as any).template?.hierarchy_config?.l2 || 'Style'] || sku.specs?.color || skuName.replace(variantName, '').trim();
                    const colorName = rawColorName;

                    // Lookup Color Info
                    const colorInfo = colorMap.get(colorName?.toUpperCase());
                    const colorPosition = colorInfo?.position || 999;
                    const colorHex = sku.specs?.hex_primary || colorInfo?.hex;

                    // ASSET LOGIC
                    // 1. Find reference color specs
                    const colorObj = ((family as any).colors || []).find((c: any) => c.name?.toUpperCase() === colorName?.toUpperCase());
                    const colorSpecs = colorObj?.specs || {};

                    // 2. Videos
                    // Sku Videos: sku.specs.video_urls (array) or sku.video_url (single)
                    // Color Videos: colorSpecs.video_urls (array) or colorSpecs.video_url (single)
                    const skuVideos = sku.specs?.video_urls || (sku.video_url ? [sku.video_url] : []);
                    const colorVideos = colorSpecs.video_urls || (colorSpecs.video_url ? [colorSpecs.video_url] : []);
                    const videoCount = skuVideos.length;
                    const isVideoShared = JSON.stringify(skuVideos) === JSON.stringify(colorVideos);

                    // 3. Images
                    const skuImages = sku.specs?.gallery || (sku.specs?.image_url ? [sku.specs.image_url] : []);
                    const colorImages = colorSpecs.gallery || (colorSpecs.image_url ? [colorSpecs.image_url] : []);
                    const imageCount = skuImages.length;
                    const isImageShared = JSON.stringify(skuImages) === JSON.stringify(colorImages);

                    // 4. PDFs
                    const skuPdfs = sku.specs?.pdf_urls || [];
                    const colorPdfs = colorSpecs.pdf_urls || [];
                    const pdfCount = skuPdfs.length;
                    const isPdfShared = JSON.stringify(skuPdfs) === JSON.stringify(colorPdfs);

                    const variantPosition = variant.position || 999;

                    return {
                        id: sku.id,
                        family,
                        variant,
                        sku,
                        brandName,
                        templateCategory: (family as any).template?.category || 'VEHICLE',
                        templateName: (family as any).template?.name || '',
                        familyName,
                        familyPosition: (family as any).position || 999,
                        variantName,
                        variantPosition,
                        colorName,
                        colorPosition,
                        colorHex,
                        skuName,
                        skuSlug: sku.slug,
                        status: sku.status,
                        // Asset Data
                        videoCount, isVideoShared,
                        imageCount, isImageShared,
                        pdfCount, isPdfShared,
                        // Full Name: Brand + Family + SKU Name (SKU Name usually contains Variant + Color)
                        fullSkuName: `${brandName} ${familyName} ${skuName}`.trim()
                    };
                })
            );
        });

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            skus = skus.filter(item =>
                item.brandName.toLowerCase().includes(lowerTerm) ||
                item.familyName.toLowerCase().includes(lowerTerm) ||
                item.variantName.toLowerCase().includes(lowerTerm) ||
                item.fullSkuName.toLowerCase().includes(lowerTerm) ||
                item.skuSlug.toLowerCase().includes(lowerTerm)
            );
        }

        if (selectedCategory !== 'ALL') {
            skus = skus.filter(item => item.templateCategory === selectedCategory);
        }

        if (selectedBrand !== 'ALL') {
            skus = skus.filter(item => (item.family as any).brand?.id === selectedBrand);
        }

        if (selectedTemplate !== 'ALL') {
            skus = skus.filter(item => (item.family as any).template?.id === selectedTemplate);
        }

        // Apply Sorting
        skus.sort((a: any, b: any) => {
            if (sortConfig) {
                // User defined sort
                const aValue = String(a[sortConfig.key] || '').toLowerCase();
                const bValue = String(b[sortConfig.key] || '').toLowerCase();
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            } else {
                // Default Hierarchy Sort: Brand -> Family -> Variant (Pos) -> Color (Pos)

                // 1. Brand Name
                if (a.brandName < b.brandName) return -1;
                if (a.brandName > b.brandName) return 1;

                // 2. Family Position (Primary) -> Name (Secondary)
                if (a.familyPosition !== b.familyPosition) {
                    return a.familyPosition - b.familyPosition;
                }
                if (a.familyName < b.familyName) return -1;
                if (a.familyName > b.familyName) return 1;

                // 3. Variant Position
                if (a.variantPosition !== b.variantPosition) {
                    return a.variantPosition - b.variantPosition;
                }

                // 4. Color Position
                if (a.colorPosition !== b.colorPosition) {
                    return a.colorPosition - b.colorPosition;
                }

                return 0;
            }
        });

        // Additional explicit check for sorting by variantName or colorName if selected via header
        if (sortConfig?.key === 'variantName') {
            skus.sort((a: any, b: any) => {
                // Sort by Variant Position as primary, Name as secondary
                // But if key is strictly 'variantName', use name.
                // Actually user asked for sorting headers. 
                // Let's rely on the generic sort block above if it wasn't position-aware, 
                // but since we want to respect position for default, let's keep it simple.
                // If the user *clicks* the header, it sets sortConfig.key = 'variantName'.
                // The code block above `if (sortConfig)` handles this generically by string comparison.
                // That's fine for simple alphabetical sort on click.
                return 0; // Already handled by generic block
            });
        }

        return skus; // Return ALL sorted/filtered items
    }, [items, searchTerm, sortConfig, selectedBrand, selectedCategory, selectedTemplate]);

    // Pagination Logic
    const ITEMS_PER_PAGE = 50;
    const [currentPage, setCurrentPage] = useState(1);

    // Reset to Page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedBrand, selectedCategory, selectedTemplate]);

    const totalPages = Math.ceil(processedSkus.length / ITEMS_PER_PAGE);
    const paginatedSkus = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedSkus.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [processedSkus, currentPage]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 lg:p-12">
            <div className="max-w-[1600px] mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest rounded-full">
                                Unified Database
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                            Product <span className="text-emerald-600">Catalog</span>
                        </h1>

                    </div>


                </div>

                {/* KPI Grid - Expanded & Large */}
                <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap size={64} className="text-indigo-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                                <Zap size={20} className="fill-current" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brands</span>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {isLoading ? '-' : stats.activeBrands}
                            </div>
                            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Active Partners</div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Database size={64} className="text-blue-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                                <Database size={20} className="fill-current" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Models</span>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {isLoading ? '-' : stats.activeModels}
                            </div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Active Families</div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ArrowUpDown size={64} className="text-emerald-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                                <ArrowUpDown size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variants</span>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {isLoading ? '-' : stats.activeVariants}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Active Configs</div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ImageIcon size={64} className="text-pink-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600">
                                <ImageIcon size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Colors</span>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {isLoading ? '-' : stats.activeColors}
                            </div>
                            <div className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mt-1">Active Styles</div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Plus size={64} className="text-amber-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                                <Plus size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active SKUs</span>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {isLoading ? '-' : stats.activeSkus}
                            </div>
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Market Ready</div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Filter size={64} className="text-slate-400" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                                <Filter size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inactive</span>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                {isLoading ? '-' : stats.inactiveSkus}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending/Draft</div>
                        </div>
                    </div>
                </div>

                {/* List Panel */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-100/50 dark:shadow-none min-h-[500px]">
                    {/* Toolbar */}
                    <div className="z-30 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md p-8 border-b border-slate-100 dark:border-white/5 flex flex-col xl:flex-row items-center justify-between gap-6 rounded-t-[3rem]">

                        {/* Filters Panel (Left) */}
                        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                            {/* Brand Filter */}
                            <select
                                className="px-4 py-4 rounded-2xl bg-white dark:bg-black/20 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-emerald-500/20 min-w-[160px] border border-slate-100 dark:border-white/5"
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                            >
                                <option value="ALL">All Brands</option>
                                {uniqueBrands.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>

                            {/* Category Filter */}
                            <select
                                className="px-4 py-4 rounded-2xl bg-white dark:bg-black/20 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-emerald-500/20 min-w-[160px] border border-slate-100 dark:border-white/5"
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setSelectedTemplate('ALL'); // Reset template on category change
                                }}
                            >
                                <option value="ALL">All Categories</option>
                                <option value="VEHICLE">Vehicles</option>
                                <option value="ACCESSORY">Accessories</option>
                                <option value="SERVICE">Services</option>
                            </select>

                            {/* Template Filter (Sub-Category) */}
                            <select
                                className="px-4 py-4 rounded-2xl bg-white dark:bg-black/20 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-emerald-500/20 min-w-[160px] border border-slate-100 dark:border-white/5"
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                            >
                                <option value="ALL">All Templates</option>
                                {filteredTemplates.map((t: any) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search Bar (Center/Fill) */}
                        <div className="relative w-full flex-1 min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-black/40 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-emerald-500/20 border border-slate-100 dark:border-white/5"
                                placeholder="Search by name, brand, or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Actions (Right) */}
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10 hidden xl:block mx-2" />

                            <button
                                onClick={() => router.push(`/app/${tenantSlug}/dashboard/catalog/products/studio`)}
                                className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="p-4">
                        <div className="rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                            <table className="w-full text-left border-collapse table-fixed relative">
                                <thead>
                                    <tr className="bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-white/5">
                                        <th className="sticky top-0 z-20 bg-emerald-50 dark:bg-emerald-950/20 p-4 pl-8 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest w-16 border-r border-emerald-100 dark:border-white/10">S.No.</th>

                                        <th
                                            className="sticky top-0 z-20 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors border-r border-emerald-100 dark:border-white/10 w-[200px]"
                                            onClick={() => handleSort('familyName')}
                                        >
                                            <div className="flex items-center gap-1">Model Family <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th
                                            className="sticky top-0 z-20 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors border-r border-emerald-100 dark:border-white/10 w-[200px]"
                                            onClick={() => handleSort('variantName')}
                                        >
                                            <div className="flex items-center gap-1">Variant <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th
                                            className="sticky top-0 z-20 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors border-r border-emerald-100 dark:border-white/10 w-[400px]"
                                            onClick={() => handleSort('colorName')}
                                        >
                                            <div className="flex items-center gap-1">Color / Style <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th
                                            className="sticky top-0 z-20 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors w-44 border-r border-emerald-100 dark:border-white/10"
                                            onClick={() => handleSort('skuSlug')}
                                        >
                                            <div className="flex items-center gap-1">SKU <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th className="sticky top-0 z-20 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest w-32 border-r border-emerald-100 dark:border-white/10">Assets</th>
                                        <th className="sticky top-0 z-20 bg-emerald-50 dark:bg-emerald-950/20 p-4 pr-8 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest text-right w-40 border-r border-emerald-100 dark:border-white/10">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan={8} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading SKUs...</td></tr>
                                    ) : (
                                        processedSkus.length === 0 ? (
                                            <tr><td colSpan={8} className="p-24 text-center text-slate-400 font-bold uppercase tracking-widest">No SKUs Found.</td></tr>
                                        ) : (
                                            paginatedSkus.map((item, index) => (
                                                <tr
                                                    key={item.sku.id}
                                                    onClick={() => router.push(`/app/${tenantSlug}/dashboard/catalog/products/studio?familyId=${item.family.id}&brandId=${item.family.brand_id}&step=5`)}
                                                    className="group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 even:bg-slate-50 dark:even:bg-white/5 transition-colors cursor-pointer"
                                                >
                                                    <td className="p-4 pl-8 align-middle border border-slate-100 dark:border-white/5">
                                                        <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-500 transition-colors">
                                                            {(index + 1).toString().padStart(2, '0')}
                                                        </span>
                                                    </td>

                                                    <td className="p-4 align-middle border border-slate-100 dark:border-white/5">
                                                        <span className="font-black text-slate-700 dark:text-white uppercase italic text-sm block whitespace-normal break-words leading-tight">{item.familyName}</span>
                                                    </td>
                                                    <td className="p-4 align-middle border border-slate-100 dark:border-white/5">
                                                        <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px] block whitespace-normal break-words leading-tight">{item.variantName}</span>
                                                    </td>
                                                    <td className="p-4 align-middle border border-slate-100 dark:border-white/5">
                                                        <div className="flex items-start gap-2">
                                                            {item.colorHex && <div className="w-3 h-3 rounded-full shadow-sm border border-white/20 mt-0.5 shrink-0" style={{ backgroundColor: item.colorHex }} />}
                                                            <span className="text-xs font-bold text-slate-500 uppercase block whitespace-normal break-words leading-tight">{item.colorName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle border border-slate-100 dark:border-white/5">
                                                        <div className="flex flex-col items-start w-full">
                                                            <CopyableId id={item.id} />
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle border border-slate-100 dark:border-white/5">
                                                        <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5 w-fit">
                                                            {/* Video */}
                                                            <div className={`flex items-center gap-1 ${item.videoCount > 0 ? 'opacity-100' : 'opacity-20 grayscale'}`} title="Videos">
                                                                <Youtube size={14} className={item.isVideoShared ? 'text-slate-400' : 'text-blue-500'} />
                                                                {item.videoCount > 0 && <span className="text-[10px] font-black text-slate-500">{item.videoCount}</span>}
                                                            </div>
                                                            <div className="w-[1px] h-3 bg-slate-200 dark:bg-white/10" />
                                                            {/* Image */}
                                                            <div className={`flex items-center gap-1 ${item.imageCount > 0 ? 'opacity-100' : 'opacity-20 grayscale'}`} title="Images">
                                                                <ImageIcon size={14} className={item.isImageShared ? 'text-slate-400' : 'text-amber-500'} />
                                                                {item.imageCount > 0 && <span className="text-[10px] font-black text-slate-500">{item.imageCount}</span>}
                                                            </div>
                                                            <div className="w-[1px] h-3 bg-slate-200 dark:bg-white/10" />
                                                            {/* PDF */}
                                                            <div className={`flex items-center gap-1 ${item.pdfCount > 0 ? 'opacity-100' : 'opacity-20 grayscale'}`} title="PDFs">
                                                                <FileText size={14} className={item.isPdfShared ? 'text-slate-400' : 'text-purple-500'} />
                                                                {item.pdfCount > 0 && <span className="text-[10px] font-black text-slate-500">{item.pdfCount}</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 pr-8 align-middle text-right border border-slate-100 dark:border-white/5">
                                                        <div className="flex justify-end">
                                                            {item.status === 'ACTIVE' && (
                                                                <span className="px-3 py-1.5 bg-emerald-100/50 dark:bg-emerald-900/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest rounded-full flex items-center gap-2 border border-emerald-500/10 shadow-sm shadow-emerald-500/5">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                    ACTIVE
                                                                </span>
                                                            )}
                                                            {item.status === 'DRAFT' && (
                                                                <span className="px-3 py-1.5 bg-amber-100/50 dark:bg-amber-900/20 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest rounded-full flex items-center gap-2 border border-amber-500/10 shadow-sm shadow-amber-500/5">
                                                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                                    DRAFT
                                                                </span>
                                                            )}
                                                            {item.status === 'INACTIVE' && (
                                                                <span className="px-3 py-1.5 bg-red-100/50 dark:bg-red-900/20 text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest rounded-full flex items-center gap-2 border border-red-500/10 shadow-sm shadow-red-500/5">
                                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                                    OFFLINE
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    {processedSkus.length > 0 && (
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, processedSkus.length)}</span> of <span className="text-slate-900 dark:text-white">{processedSkus.length}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-300"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest px-2">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-300"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
