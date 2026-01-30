'use client';

import React, { useState } from 'react';
import { Box, Layers, Zap, FolderCheck, Image as ImageIcon, FileText, Youtube, Check, Trash2, Info, Search, Filter, ArrowUpDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

function CopyableId({ id }: { id: string }) {
    const [copied, setCopied] = useState(false);
    const rawId = id.slice(-9);
    const formattedId = `${rawId.slice(0, 3)}-${rawId.slice(3, 6)}-${rawId.slice(6)}`;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(rawId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button onClick={handleCopy} className="group/btn flex items-center gap-2 px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-all" title="Click to copy ID">
            <span className="text-[10px] font-mono font-bold text-slate-400 group-hover/btn:text-indigo-600 transition-colors uppercase tracking-widest">#{formattedId}</span>
            {copied ? <Check size={10} className="text-emerald-500" /> : null}
        </button>
    );
}

function HistoryTooltip({ history, users }: { history: any[]; users: any[] }) {
    if (!history || history.length === 0) return null;

    return (
        <div className="group relative inline-block ml-2">
            <Info size={12} className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:block z-[200]">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 w-64 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2 ml-4">Change Log</h4>
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
                                            {entry.action} <span className="text-indigo-500 font-bold">{entry.field}</span>
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

export default function ReviewStep({ brand, family, template, variants, colors, skus, onUpdate }: any) {
    const l2Label = template?.hierarchy_config?.l2 || 'Style';
    const [filterVariant, setFilterVariant] = useState<string>('ALL');
    const [filterColor, setFilterColor] = useState<string>('ALL');
    const [filterSearch, setFilterSearch] = useState<string>('');
    const [sortField, setSortField] = useState<string>('SNO');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const [pricingState, setPricingState] = useState<string>('MH');
    const [users, setUsers] = useState<any[]>([]);

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
        const { data: { user } } = await supabase.auth.getUser();

        // Special: If Updating Price, also write to vehicle_prices for the selected state
        if (field === 'price_base') {
            try {
                const numericVal = parseFloat(value) || 0;
                await supabase.rpc('upsert_vehicle_prices_bypass', {
                    prices: [{
                        vehicle_color_id: sku.id,
                        state_code: pricingState,
                        ex_showroom_price: numericVal,
                        offer_amount: 0
                    }]
                });
                console.log(`Synced Price for ${pricingState}: ${numericVal}`);
            } catch (err) {
                console.error("Pricing Sync Failed", err);
            }
        }

        const historyEntry = {
            at: new Date().toISOString(),
            by: user?.id,
            action: 'updated',
            field: field === 'price_base' ? `price (${pricingState})` : field,
            from: sku[field],
            to: value
        };

        const newHistory = [historyEntry, ...(sku.history || [])].slice(0, 20);

        const { data, error } = await supabase
            .from('cat_items')
            .update({
                [field]: value,
                updated_by: user?.id,
                history: newHistory
            })
            .eq('id', sku.id)
            .select()
            .single();

        if (error) {
            console.error(`Error updating SKU ${field}:`, error);
        } else if (onUpdate) {
            onUpdate(skus.map((s: any) => s.id === sku.id ? data : s));
        }
    };

    const handleDeleteSku = async (sku: any) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (sku.status === 'ACTIVE') {
            if (!confirm('Are you sure you want to make this SKU INACTIVE? it will no longer be visible in the store.')) return;

            const historyEntry = {
                at: new Date().toISOString(),
                by: user?.id,
                action: 'changed status to',
                field: 'INACTIVE'
            };

            const { data, error } = await supabase
                .from('cat_items')
                .update({
                    status: 'INACTIVE',
                    updated_by: user?.id,
                    history: [historyEntry, ...(sku.history || [])]
                })
                .eq('id', sku.id)
                .select()
                .single();

            if (!error && onUpdate) {
                onUpdate(skus.map((s: any) => s.id === sku.id ? data : s));
            }
        } else {
            if (!confirm('This SKU is already INACTIVE. Deleting it will move it to the ARCHIVE. Continue?')) return;

            // 1. Move to archived_records
            const { error: archiveError } = await supabase.from('sys_archived').insert({
                original_table: 'cat_items',
                original_id: sku.id,
                data: sku,
                archived_by: user?.id,
                tenant_id: sku.tenant_id
            });

            if (archiveError) {
                console.error('Archive error:', archiveError);
                return;
            }

            // 2. Delete from catalog_items
            const { error: deleteError } = await supabase
                .from('cat_items')
                .delete()
                .eq('id', sku.id);

            if (!deleteError && onUpdate) {
                onUpdate(skus.filter((s: any) => s.id !== sku.id));
            }
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
                            onChange={(e) => setFilterSearch(e.target.value)}
                            className="pl-11 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 w-64 shadow-sm"
                        />
                    </div>

                    <select
                        value={filterVariant}
                        onChange={(e) => setFilterVariant(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer shadow-sm"
                    >
                        <option value="ALL">All Variants</option>
                        {variants.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>

                    <select
                        value={filterColor}
                        onChange={(e) => setFilterColor(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer shadow-sm"
                    >
                        <option value="ALL">All Styles</option>
                        {colors.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    {/* State Selector for Pricing */}
                    <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Pricing For:</span>
                        <select
                            value={pricingState}
                            onChange={(e) => setPricingState(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 outline-none cursor-pointer"
                        >
                            <option value="MH">Maharashtra (MH)</option>
                            <option value="KA">Karnataka (KA)</option>
                            <option value="DL">Delhi (DL)</option>
                            <option value="UP">Uttar Pradesh (UP)</option>
                            <option value="GJ">Gujarat (GJ)</option>
                            <option value="RJ">Rajasthan (RJ)</option>
                            <option value="ALL">All India (Base)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-6 py-2 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl">
                    <Zap size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{skus?.length || 0} SKUs Generated</span>
                </div>
            </div>

            {/* 2. Expanded SKU Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="max-h-[700px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th onClick={() => toggleSort('SNO')} className="p-3 pl-8 text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-500 transition-colors">
                                    <div className="flex items-center gap-2">S.No <ArrowUpDown size={10} /></div>
                                </th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand</th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Model</th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Variant</th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Color</th>
                                <th onClick={() => toggleSort('PRICE')} className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:text-indigo-500 transition-colors">
                                    <div className="flex items-center justify-center gap-2">Ex-Showroom ({pricingState}) <ArrowUpDown size={10} /></div>
                                </th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Assets / Inheritance</th>
                                <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">SKU Identity</th>
                                <th className="p-3 pr-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {skus && skus.length > 0 ? (
                                [...skus]
                                    .filter(s => {
                                        if (filterVariant !== 'ALL' && s.parent_id !== filterVariant) return false;
                                        const cName = s.specs?.[l2Label] || s.color_name;
                                        const cObj = colors.find((c: any) => c.name?.toUpperCase() === cName?.toUpperCase());
                                        if (filterColor !== 'ALL' && cObj?.id !== filterColor) return false;
                                        if (filterSearch && !s.name?.toLowerCase().includes(filterSearch.toLowerCase()) && !s.sku_code?.toLowerCase().includes(filterSearch.toLowerCase())) return false;
                                        return true;
                                    })
                                    .sort((a, b) => {
                                        if (sortField === 'PRICE') {
                                            const diff = (a.price_base || 0) - (b.price_base || 0);
                                            return sortOrder === 'ASC' ? diff : -diff;
                                        }

                                        // Default: Sort by Variant Position then Color Position
                                        const vA = variants.find((v: any) => v.id === a.parent_id);
                                        const vB = variants.find((v: any) => v.id === b.parent_id);
                                        const vPosA = vA?.position ?? 0;
                                        const vPosB = vB?.position ?? 0;

                                        let result = 0;
                                        if (vPosA !== vPosB) result = vPosA - vPosB;
                                        else {
                                            const cNameA = a.specs?.[l2Label] || a.color_name;
                                            const cNameB = b.specs?.[l2Label] || b.color_name;
                                            const cA = colors.find((c: any) => c.name?.toUpperCase() === cNameA?.toUpperCase());
                                            const cB = colors.find((c: any) => c.name?.toUpperCase() === cNameB?.toUpperCase());
                                            const cPosA = cA?.position ?? 0;
                                            const cPosB = cB?.position ?? 0;
                                            result = cPosA - cPosB;
                                        }
                                        return sortOrder === 'ASC' ? result : -result;
                                    }).map((sku: any, idx: number) => {
                                        // Asset Logic
                                        let colorName = sku.specs?.[l2Label] || sku.color_name;
                                        const colorObj = colors.find((c: any) => {
                                            if (colorName && c.name?.toUpperCase() === colorName.toUpperCase()) return true;
                                            if (sku.specs?.hex_primary && c.specs?.hex_primary?.toLowerCase() === sku.specs.hex_primary.toLowerCase()) return true;
                                            return false;
                                        });

                                        if (colorObj) colorName = colorObj.name;
                                        const colorSpecs = colorObj?.specs || {};

                                        const getSharedAssets = () => {
                                            const fVideos = family.specs?.video_urls || [];
                                            const vVideos = variants.find((v: any) => v.id === sku.parent_id)?.specs?.video_urls || [];
                                            const cVideos = colorSpecs.video_urls || [];
                                            const fPdfs = family.specs?.pdf_urls || [];
                                            const vPdfs = variants.find((v: any) => v.id === sku.parent_id)?.specs?.pdf_urls || [];
                                            const cPdfs = colorSpecs.pdf_urls || [];
                                            const fGallery = family.specs?.gallery || [];
                                            const vGallery = variants.find((v: any) => v.id === sku.parent_id)?.specs?.gallery || [];
                                            const cGallery = colorSpecs.gallery || [];

                                            return {
                                                videos: Array.from(new Set([...fVideos, ...vVideos, ...cVideos])),
                                                pdfs: Array.from(new Set([...fPdfs, ...vPdfs, ...cPdfs])),
                                                gallery: Array.from(new Set([...fGallery, ...vGallery, ...cGallery]))
                                            };
                                        };

                                        const sharedAssets = getSharedAssets();
                                        const skuVideos = sku.specs?.video_urls || (sku.video_url ? [sku.video_url] : []);
                                        const videoCount = skuVideos.length;
                                        const isVideoShared = skuVideos.length > 0 && skuVideos.every((v: string) => sharedAssets.videos.includes(v));

                                        const skuImages = sku.specs?.gallery || (sku.specs?.image_url ? [sku.specs.image_url] : []);
                                        const imageCount = skuImages.length;
                                        const isImageShared = skuImages.length > 0 && skuImages.every((img: string) => sharedAssets.gallery.includes(img));

                                        const skuPdfs = sku.specs?.pdf_urls || [];
                                        const pdfCount = skuPdfs.length;
                                        const isPdfShared = skuPdfs.length > 0 && skuPdfs.every((p: string) => sharedAssets.pdfs.includes(p));

                                        const parentVariant = variants.find((v: any) => v.id === sku.parent_id);
                                        const hexPrimary = sku.specs?.hex_primary || colorObj?.specs?.hex_primary;

                                        return (
                                            <tr key={sku.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="p-3 pl-8 text-[10px] font-bold text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                                                <td className="p-3 text-[10px] font-bold text-slate-900 dark:text-white uppercase">{brand?.name}</td>
                                                <td className="p-3 text-xs font-black text-slate-900 dark:text-white uppercase italic">{family?.name}</td>
                                                <td className="p-3 text-[10px] font-bold text-slate-500 uppercase">{parentVariant?.name || sku.variant_name || '-'}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        {hexPrimary && <div className="w-3 h-3 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: hexPrimary }} />}
                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{colorName || '-'}</span>
                                                    </div>
                                                </td>

                                                <td className="p-3">
                                                    <div className="relative group/price w-32 mx-auto">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 italic">₹</span>
                                                        <input
                                                            type="number"
                                                            value={sku.price_base || 0}
                                                            onChange={(e) => updateSkuField(sku, 'price_base', parseFloat(e.target.value))}
                                                            className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-center focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <AssetBadge icon={Youtube} specific={videoCount - (isVideoShared ? videoCount : 0)} shared={isVideoShared ? videoCount : 0} color="bg-rose-50 text-rose-600" />
                                                        <AssetBadge icon={ImageIcon} specific={imageCount - (isImageShared ? imageCount : 0)} shared={isImageShared ? imageCount : 0} color="bg-indigo-50 text-indigo-600" />
                                                        <AssetBadge icon={FileText} specific={pdfCount - (isPdfShared ? pdfCount : 0)} shared={isPdfShared ? pdfCount : 0} color="bg-emerald-50 text-emerald-600" />
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={sku.sku_code || ''}
                                                                onChange={(e) => updateSkuField(sku, 'sku_code', e.target.value.toUpperCase())}
                                                                placeholder="OEM CODE"
                                                                className="w-32 px-3 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                                            />
                                                            <HistoryTooltip history={sku.history} users={users} />
                                                        </div>
                                                        {sku.id ? <CopyableId id={sku.id} /> : <span className="text-slate-300">-</span>}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${sku.status === 'INACTIVE' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {sku.status || 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="p-3 pr-8 text-right">
                                                    <button
                                                        onClick={() => handleDeleteSku(sku)}
                                                        className={`p-1.5 rounded-lg transition-all ${sku.status === 'INACTIVE' ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-slate-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}
                                                        title={sku.status === 'INACTIVE' ? 'Archive SKU' : 'Make Inactive'}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                            ) : (
                                <tr>
                                    <td colSpan={10} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">
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
