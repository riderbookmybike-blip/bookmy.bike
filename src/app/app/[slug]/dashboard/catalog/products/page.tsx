'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import { Plus, Database, Search, Filter, Zap, ArrowUpDown, Copy, Check, Image as ImageIcon, FileText, Youtube } from 'lucide-react';
import { CatalogItem } from '@/types/store';
import { KPIItem } from '@/components/layout/KPIBar';

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
    const [stats, setStats] = useState({ products: 0, families: 0, skus: 0, drafts: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setIsLoading(true);
        const supabase = createClient();

        // 1. Fetch All Catalog Items for stat calculation
        const { data: allItems } = await supabase
            .from('cat_items')
            .select('type, status');

        if (allItems) {
            setStats({
                products: allItems.filter(i => i.type === 'FAMILY').length,
                families: allItems.filter(i => i.type === 'FAMILY' && i.status === 'ACTIVE').length,
                skus: allItems.filter(i => i.type === 'SKU').length,
                drafts: allItems.filter(i => i.status === 'DRAFT').length
            });
        }

        // 2. Fetch Families with nested children for the list
        // We ensure we fetch 'position' for variants and colors to respect user-defined sequence.
        const { data, error } = await supabase
            .from('cat_items')
            .select(`
                *,
                brand:cat_brands(name, logo_svg),
                template:cat_templates(name, hierarchy_config, category),
                colors:cat_items!parent_id(id, name, type, specs, position),
                variants:cat_items!parent_id(
                    id, name, type, position,
                    skus:cat_items!parent_id(id, name, type, specs, slug, status)
                )
            `)
            .eq('type', 'FAMILY')
            .order('created_at', { ascending: false });

        if (data) setItems(data as any);
        setIsLoading(false);
    };

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

        return skus;
    }, [items, searchTerm, sortConfig, selectedCategory]);

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
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                            Manage logical product families across all categories (Vehicles, Gear, Parts).
                        </p>
                    </div>

                    <button
                        onClick={() => router.push(`/app/${tenantSlug}/dashboard/catalog/products/studio`)}
                        className="group relative px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-[2rem] hover:scale-105 transition-all shadow-2xl shadow-slate-900/20 flex items-center gap-4 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                        <Database size={20} className="text-emerald-400 dark:text-emerald-600" />
                        <div className="text-left">
                            <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Launch Engine</div>
                            <div className="text-sm font-black uppercase tracking-wider">Open Studio</div>
                        </div>
                        <div className="w-10 h-10 bg-white/10 dark:bg-black/5 rounded-full flex items-center justify-center ml-2">
                            <Plus size={18} />
                        </div>
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="flex flex-wrap items-center gap-4">
                    <KPIItem
                        label="Total Products"
                        value={isLoading ? '--' : stats.products}
                        icon={Database}
                        description="Total unique product families in the unified database"
                        color="emerald"
                    />
                    <KPIItem
                        label="Active Families"
                        value={isLoading ? '--' : stats.families}
                        icon={Zap}
                        description="Families currently published and active in the store"
                        color="blue"
                    />
                    <KPIItem
                        label="Total SKUs"
                        value={isLoading ? '--' : stats.skus}
                        icon={Plus}
                        description="Total Stock Keeping Units (Color/Variant combos) generated"
                        color="indigo"
                    />
                    <KPIItem
                        label="Draft Items"
                        value={isLoading ? '--' : stats.drafts}
                        icon={Search}
                        description="Items currently in creation studio or pending review"
                        color="amber"
                    />
                </div>

                {/* List Panel */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-100/50 dark:shadow-none overflow-hidden min-h-[500px]">
                    {/* Toolbar */}
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div className="relative w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black/20 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-emerald-500/20"
                                placeholder="Search by name, brand, or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center p-1 bg-slate-100 dark:bg-white/5 rounded-2xl gap-1">
                                {[
                                    { id: 'ALL', label: 'All', icon: Database },
                                    { id: 'VEHICLE', label: 'Vehicles', icon: Zap },
                                    { id: 'ACCESSORY', label: 'Accessories', icon: Plus },
                                    { id: 'SERVICE', label: 'Services', icon: Search }
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                            ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        <cat.icon size={12} />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10" />

                            <button className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-emerald-600 transition-colors">
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="p-4">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="p-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">S.No.</th>
                                    <th
                                        className="p-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors"
                                        onClick={() => handleSort('brandName')}
                                    >
                                        <div className="flex items-center gap-1">Brand <ArrowUpDown size={10} /></div>
                                    </th>
                                    <th
                                        className="p-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors"
                                        onClick={() => handleSort('templateName')}
                                    >
                                        <div className="flex items-center gap-1">Template <ArrowUpDown size={10} /></div>
                                    </th>
                                    <th
                                        className="p-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors"
                                        onClick={() => handleSort('familyName')}
                                    >
                                        <div className="flex items-center gap-1">Model Family <ArrowUpDown size={10} /></div>
                                    </th>
                                    <th
                                        className="p-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors"
                                        onClick={() => handleSort('variantName')}
                                    >
                                        <div className="flex items-center gap-1">Variant <ArrowUpDown size={10} /></div>
                                    </th>
                                    <th
                                        className="p-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors"
                                        onClick={() => handleSort('colorName')}
                                    >
                                        <div className="flex items-center gap-1">Color / Style <ArrowUpDown size={10} /></div>
                                    </th>
                                    <th
                                        className="p-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors"
                                        onClick={() => handleSort('skuSlug')} // Sort by SKU ID effectively
                                    >
                                        <div className="flex items-center gap-1">SKU <ArrowUpDown size={10} /></div>
                                    </th>
                                    <th className="p-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assets</th>
                                    <th className="p-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={8} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading SKUs...</td></tr>
                                ) : (
                                    processedSkus.length === 0 ? (
                                        <tr><td colSpan={8} className="p-24 text-center text-slate-400 font-bold uppercase tracking-widest">No SKUs Found.</td></tr>
                                    ) : (
                                        processedSkus.map((item, index) => (
                                            <tr
                                                key={item.sku.id}
                                                onClick={() => router.push(`/app/${tenantSlug}/dashboard/catalog/products/studio?familyId=${item.family.id}&brandId=${item.family.brand_id}&step=5`)}
                                                className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-50 dark:border-white/5 last:border-0 cursor-pointer"
                                            >
                                                <td className="p-6 pl-8">
                                                    <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-500 transition-colors">
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="font-bold text-slate-900 dark:text-white uppercase text-xs">{item.brandName}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.templateName}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="font-black text-slate-900 dark:text-white uppercase italic text-sm">{item.familyName}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="font-bold text-slate-600 dark:text-slate-300 uppercase text-xs">{item.variantName}</span>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        {item.colorHex && <div className="w-4 h-4 rounded-full shadow-sm border border-white/20" style={{ backgroundColor: item.colorHex }} />}
                                                        <span className="text-xs font-bold text-slate-500 uppercase">{item.colorName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col items-start">
                                                        <CopyableId id={item.id} />
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        {/* Video */}
                                                        <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide ${item.videoCount > 0 ? 'opacity-100' : 'opacity-30'}`}>
                                                            <div className={`p-1 rounded ${item.isVideoShared ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                                <Youtube size={10} />
                                                            </div>
                                                            <span className="w-2">{item.videoCount}</span>
                                                            <span className="opacity-60">{item.isVideoShared ? 'Share' : 'Sku'}</span>
                                                        </div>
                                                        {/* Image */}
                                                        <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide ${item.imageCount > 0 ? 'opacity-100' : 'opacity-30'}`}>
                                                            <div className={`p-1 rounded ${item.isImageShared ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                                                <ImageIcon size={10} />
                                                            </div>
                                                            <span className="w-2">{item.imageCount}</span>
                                                            <span className="opacity-60">{item.isImageShared ? 'Share' : 'Sku'}</span>
                                                        </div>
                                                        {/* PDF */}
                                                        <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide ${item.pdfCount > 0 ? 'opacity-100' : 'opacity-30'}`}>
                                                            <div className={`p-1 rounded ${item.isPdfShared ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                                                                <FileText size={10} />
                                                            </div>
                                                            <span className="w-2">{item.pdfCount}</span>
                                                            <span className="opacity-60">{item.isPdfShared ? 'Share' : 'Sku'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${item.status === 'ACTIVE'
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
