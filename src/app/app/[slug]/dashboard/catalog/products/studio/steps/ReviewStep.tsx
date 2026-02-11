'use client';

import React, { useState } from 'react';
import {
    Box,
    Layers,
    Zap,
    FolderCheck,
    Image as ImageIcon,
    FileText,
    Youtube,
    Info,
    Search,
    Filter,
    ArrowUpDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import CopyableId from '@/components/ui/CopyableId';

function HistoryTooltip({ history, users }: { history: any[]; users: any[] }) {
    if (!history || history.length === 0) return null;

    return (
        <div className="group relative inline-block ml-2">
            <Info size={12} className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:block z-[200]">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 w-64 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2 ml-4">
                        Change Log
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                        {history.map((entry, i) => {
                            const user = users.find(u => u.id === entry.by);
                            const userName = user?.full_name || user?.email?.split('@')[0] || 'System';
                            return (
                                <div key={i} className="flex gap-3 px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-900 dark:text-white leading-tight">
                                            <span className="font-black uppercase italic mr-1">{userName}</span>
                                            {entry.action}{' '}
                                            <span className="text-indigo-500 font-bold">{entry.field}</span>
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {format(new Date(entry.at), 'MMM dd, HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-slate-900" />
            </div>
        </div>
    );
}

export default function ReviewStep({ brand, family, variants, colors, allColors, skus, onUpdate }: any) {
    // Use allColors (non-deduplicated) for resolution, colors (deduplicated) for filter dropdowns
    const resolvePool = allColors && allColors.length > 0 ? allColors : colors;
    const category = family?.category || 'VEHICLE';

    const l2Label = 'Unit';
    const [filterVariant, setFilterVariant] = useState<string>('ALL');
    const [filterColor, setFilterColor] = useState<string>('ALL');
    const [filterSearch, setFilterSearch] = useState<string>('');
    const [sortField, setSortField] = useState<string>('SNO');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const [users, setUsers] = useState<any[]>([]);

    const resolveColorObj = (sku: any) => {
        const colorName = sku.specs?.[l2Label] || sku.color_name;
        // First: direct ID match against full (non-deduplicated) pool
        const directColor = resolvePool.find((c: any) => c.id === sku.parent_id);
        if (directColor) return directColor;
        // Fallback: name/hex match against full pool
        return resolvePool.find((c: any) => {
            if (colorName && c.name?.toUpperCase() === colorName.toUpperCase()) return true;
            if (sku.specs?.hex_primary && c.specs?.hex_primary?.toLowerCase() === sku.specs.hex_primary.toLowerCase())
                return true;
            return false;
        });
    };

    const resolveVariantId = (sku: any) => {
        const colorObj = resolveColorObj(sku);
        return colorObj?.parent_id || sku.parent_id;
    };

    React.useEffect(() => {
        const fetchUsers = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('id_members').select('id, full_name, email');
            if (data) setUsers(data);
        };
        fetchUsers();
    }, []);

    const updateSkuField = async (sku: any, field: string, value: any) => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const historyEntry = {
            at: new Date().toISOString(),
            by: user?.id,
            action: 'updated',
            field: field,
            from: sku[field],
            to: value,
        };

        const newHistory = [historyEntry, ...(sku.history || [])].slice(0, 20);

        const { data, error } = await supabase
            .from('cat_items')
            .update({
                [field]: value,
                updated_by: user?.id,
                history: newHistory,
            })
            .eq('id', sku.id)
            .select()
            .single();

        if (error) {
            console.error(`Error updating SKU ${field}:`, error);
        } else if (onUpdate) {
            onUpdate(skus.map((s: any) => (s.id === sku.id ? data : s)));
        }
    };

    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortField(field);
            setSortOrder('ASC');
        }
    };

    const AssetBadge = ({ icon: Icon, shared, specific, color }: any) => (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 group/asset">
            <div className={`p-1 rounded ${color} shadow-sm group-hover/asset:scale-110 transition-transform`}>
                <Icon size={10} />
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black tracking-tighter uppercase whitespace-nowrap">
                <span className="text-indigo-600 font-black">{specific}</span>
                <span className="text-slate-300 mx-0.5">/</span>
                <span className="text-slate-400 font-medium">{shared}</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto py-8 space-y-8 animate-in fade-in zoom-in-95 duration-700 text-left">
            {/* 1. Header Filters */}
            <div className="flex flex-wrap items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search SKUs..."
                            value={filterSearch}
                            onChange={e => setFilterSearch(e.target.value)}
                            className="pl-11 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 w-64 shadow-sm"
                        />
                    </div>

                    <select
                        value={filterVariant}
                        onChange={e => setFilterVariant(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer shadow-sm"
                    >
                        <option value="ALL">All Variants</option>
                        {variants.map((v: any) => (
                            <option key={v.id} value={v.id}>
                                {v.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterColor}
                        onChange={e => setFilterColor(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer shadow-sm"
                    >
                        <option value="ALL">All {l2Label}s</option>
                        {colors.map((c: any) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 px-6 py-2 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl">
                    <Zap size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        {skus?.length || 0} SKUs Generated
                    </span>
                </div>
            </div>

            {/* 2. Expanded SKU Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="max-h-[700px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th
                                    onClick={() => toggleSort('SNO')}
                                    className="p-3 pl-8 text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-500 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        S.No <ArrowUpDown size={10} />
                                    </div>
                                </th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Category
                                </th>

                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Brand
                                </th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Model
                                </th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Variant
                                </th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {l2Label}
                                </th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                                    Assets / Inheritance
                                </th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    SKU Identity
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {skus && skus.length > 0 ? (
                                [...skus]
                                    .filter(s => {
                                        const resolvedVariantId = resolveVariantId(s);
                                        if (filterVariant !== 'ALL' && resolvedVariantId !== filterVariant)
                                            return false;
                                        const cObj = resolveColorObj(s);
                                        if (filterColor !== 'ALL' && cObj?.id !== filterColor) return false;
                                        if (
                                            filterSearch &&
                                            !s.name?.toLowerCase().includes(filterSearch.toLowerCase()) &&
                                            !s.sku_code?.toLowerCase().includes(filterSearch.toLowerCase())
                                        )
                                            return false;
                                        return true;
                                    })
                                    .sort((a, b) => {
                                        if (sortField === 'PRICE') {
                                            const diff = (a.price_base || 0) - (b.price_base || 0);
                                            return sortOrder === 'ASC' ? diff : -diff;
                                        }

                                        // Default: Sort by Variant Position then Color Position
                                        const vA = variants.find((v: any) => v.id === resolveVariantId(a));
                                        const vB = variants.find((v: any) => v.id === resolveVariantId(b));
                                        const vPosA = vA?.position ?? 0;
                                        const vPosB = vB?.position ?? 0;

                                        let result = 0;
                                        if (vPosA !== vPosB) result = vPosA - vPosB;
                                        else {
                                            const cNameA = a.specs?.[l2Label] || a.color_name;
                                            const cNameB = b.specs?.[l2Label] || b.color_name;
                                            const cA = colors.find(
                                                (c: any) => c.name?.toUpperCase() === cNameA?.toUpperCase()
                                            );
                                            const cB = colors.find(
                                                (c: any) => c.name?.toUpperCase() === cNameB?.toUpperCase()
                                            );
                                            const cPosA = cA?.position ?? 0;
                                            const cPosB = cB?.position ?? 0;
                                            result = cPosA - cPosB;
                                        }
                                        return sortOrder === 'ASC' ? result : -result;
                                    })
                                    .map((sku: any, idx: number) => {
                                        // Asset Logic
                                        let colorName = sku.specs?.[l2Label] || sku.color_name;
                                        const colorObj = resolveColorObj(sku);

                                        if (colorObj) colorName = colorObj.name;
                                        const colorSpecs = colorObj?.specs || {};

                                        const getSharedAssets = () => {
                                            const fVideos = family.specs?.video_urls || [];
                                            const vVideos =
                                                variants.find((v: any) => v.id === resolveVariantId(sku))?.specs
                                                    ?.video_urls || [];
                                            const cVideos = colorSpecs.video_urls || [];
                                            const fPdfs = family.specs?.pdf_urls || [];
                                            const vPdfs =
                                                variants.find((v: any) => v.id === resolveVariantId(sku))?.specs
                                                    ?.pdf_urls || [];
                                            const cPdfs = colorSpecs.pdf_urls || [];
                                            const fGallery = family.specs?.gallery || [];
                                            const vGallery =
                                                variants.find((v: any) => v.id === resolveVariantId(sku))?.specs
                                                    ?.gallery || [];
                                            const cGallery = colorSpecs.gallery || [];

                                            return {
                                                videos: Array.from(new Set([...fVideos, ...vVideos, ...cVideos])),
                                                pdfs: Array.from(new Set([...fPdfs, ...vPdfs, ...cPdfs])),
                                                gallery: Array.from(new Set([...fGallery, ...vGallery, ...cGallery])),
                                            };
                                        };

                                        const sharedAssets = getSharedAssets();
                                        const skuVideos =
                                            sku.specs?.video_urls || (sku.video_url ? [sku.video_url] : []);
                                        const videoCount = skuVideos.length;
                                        const isVideoShared =
                                            skuVideos.length > 0 &&
                                            skuVideos.every((v: string) => sharedAssets.videos.includes(v));

                                        const skuImages =
                                            sku.specs?.gallery || (sku.specs?.image_url ? [sku.specs.image_url] : []);
                                        const imageCount = skuImages.length;
                                        const isImageShared =
                                            skuImages.length > 0 &&
                                            skuImages.every((img: string) => sharedAssets.gallery.includes(img));

                                        const skuPdfs = sku.specs?.pdf_urls || [];
                                        const pdfCount = skuPdfs.length;
                                        const isPdfShared =
                                            skuPdfs.length > 0 &&
                                            skuPdfs.every((p: string) => sharedAssets.pdfs.includes(p));

                                        const parentVariant = variants.find((v: any) => v.id === resolveVariantId(sku));
                                        const hexPrimary = sku.specs?.hex_primary || colorObj?.specs?.hex_primary;

                                        return (
                                            <tr
                                                key={sku.id || idx}
                                                className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                            >
                                                <td className="p-3 pl-8 text-[10px] font-bold text-slate-300">
                                                    {(idx + 1).toString().padStart(2, '0')}
                                                </td>
                                                <td className="p-3 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                                                    {category}
                                                </td>

                                                <td className="p-3 text-[10px] font-bold text-slate-900 dark:text-white uppercase">
                                                    {brand?.name}
                                                </td>
                                                <td className="p-3 text-xs font-black text-slate-900 dark:text-white uppercase italic">
                                                    {family?.name}
                                                </td>
                                                <td className="p-3 text-[10px] font-bold text-slate-500 uppercase">
                                                    {parentVariant?.name || sku.variant_name || '-'}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        {hexPrimary && (
                                                            <div
                                                                className="w-3 h-3 rounded-full shadow-sm border border-black/10"
                                                                style={{ backgroundColor: hexPrimary }}
                                                            />
                                                        )}
                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                                                            {colorName || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <AssetBadge
                                                            icon={Youtube}
                                                            specific={videoCount - (isVideoShared ? videoCount : 0)}
                                                            shared={isVideoShared ? videoCount : 0}
                                                            color="bg-rose-50 text-rose-600"
                                                        />
                                                        <AssetBadge
                                                            icon={ImageIcon}
                                                            specific={imageCount - (isImageShared ? imageCount : 0)}
                                                            shared={isImageShared ? imageCount : 0}
                                                            color="bg-indigo-50 text-indigo-600"
                                                        />
                                                        <AssetBadge
                                                            icon={FileText}
                                                            specific={pdfCount - (isPdfShared ? pdfCount : 0)}
                                                            shared={isPdfShared ? pdfCount : 0}
                                                            color="bg-emerald-50 text-emerald-600"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={sku.sku_code || ''}
                                                                onChange={e =>
                                                                    updateSkuField(
                                                                        sku,
                                                                        'sku_code',
                                                                        e.target.value.toUpperCase()
                                                                    )
                                                                }
                                                                placeholder="OEM CODE"
                                                                className="w-32 px-3 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                                            />
                                                            <HistoryTooltip history={sku.history} users={users} />
                                                        </div>
                                                        {sku.id ? (
                                                            <CopyableId id={sku.id} />
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest"
                                    >
                                        No SKUs generated yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
