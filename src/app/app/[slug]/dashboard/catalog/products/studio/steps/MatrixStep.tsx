'use client';

import React, { useState } from 'react';
import {
    Info,
    Copy,
    Check,
    Star,
    Image as ImageIcon,
    Upload,
    Play,
    AlertCircle,
    X,
    Loader2,
    CheckCircle2,
    Edit2,
    Box,
    Gauge,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import SKUMediaManager from '@/components/catalog/SKUMediaManager';
import AttributeInput from '@/components/catalog/AttributeInput';
import { toast } from 'sonner';

const getYoutubeThumbnail = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : null;
};

export default function MatrixStep({ family, template, variants, colors, existingSkus, onUpdate }: any) {
    const l1Label = template?.hierarchy_config?.l1 || 'Variant';
    const l2Label = template?.hierarchy_config?.l2 || 'Style';

    const [isSyncing, setIsSyncing] = useState(false);
    const [activeMediaSku, setActiveMediaSku] = useState<any>(null);
    const [focusedSkuId, setFocusedSkuId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [pendingAction, setPendingAction] = useState<{
        id: string;
        type: 'TOGGLE_SKU' | 'TOGGLE_PRIMARY';
        data: any;
    } | null>(null);

    // Edit SKU Specs State
    const [editingSku, setEditingSku] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [allVehicles, setAllVehicles] = useState<any[]>([]);

    // Cascading Selection State
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [variantsList, setVariantsList] = useState<any[]>([]);

    const [selectedBrandId, setSelectedBrandId] = useState<string>('');
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');

    // Fetch Brands on Mount
    React.useEffect(() => {
        const fetchBrands = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('cat_brands').select('id, name').eq('is_active', true).order('name');
            if (data) setBrands(data);
        };
        fetchBrands();
    }, []);

    // Fetch Models when Brand Changes
    React.useEffect(() => {
        if (!selectedBrandId) {
            setModels([]);
            return;
        }
        const fetchModels = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('cat_items')
                .select('id, name')
                .eq('brand_id', selectedBrandId)
                .eq('type', 'FAMILY')
                .eq('status', 'ACTIVE') // Ensure we only get active models
                .order('name');
            if (data) setModels(data);
        };
        fetchModels();
    }, [selectedBrandId]);

    // Fetch Variants when Model Changes
    React.useEffect(() => {
        if (!selectedModelId) {
            setVariantsList([]);
            return;
        }
        const fetchVariants = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('cat_items')
                .select('id, name')
                .eq('parent_id', selectedModelId)
                .eq('type', 'VARIANT')
                .eq('status', 'ACTIVE')
                .order('name');
            if (data) setVariantsList(data);
        };
        fetchVariants();
    }, [selectedModelId]);

    const addCompatibilityTag = (tag: string) => {
        const current = (editingSku.specs?.suitable_for || '').split(',').filter(Boolean);
        if (!current.includes(tag)) {
            const next = [...current, tag];
            setEditingSku({
                ...editingSku,
                specs: { ...editingSku.specs, suitable_for: next.join(',') },
            });
        }
        // Reset local selection after adding
        setSelectedVariantId('');
    };

    const getInheritedAssets = (variantId: string, colorName: string) => {
        if (!colorName) return { videos: [], pdfs: [], primary: null, gallery: [] };
        const variant = variants.find((v: any) => v.id === variantId);
        const color = colors.find((c: any) => c.name?.toUpperCase() === colorName?.toUpperCase());

        const familyVideos = family.specs?.video_urls || [];
        const variantVideos = variant?.specs?.video_urls || [];
        const colorVideos = color?.specs?.video_urls || [];

        const familyPdfs = family.specs?.pdf_urls || [];
        const variantPdfs = variant?.specs?.pdf_urls || [];
        const colorPdfs = color?.specs?.pdf_urls || [];

        return {
            videos: Array.from(new Set([...familyVideos, ...variantVideos, ...colorVideos])),
            pdfs: Array.from(new Set([...familyPdfs, ...variantPdfs, ...colorPdfs])),
            primary: color?.specs?.primary_image || color?.specs?.image_url,
            gallery: color?.specs?.gallery || [],
        };
    };

    const handleSyncAssets = async () => {
        setIsSyncing(true);
        const supabase = createClient();
        let successCount = 0;
        let failCount = 0;

        const updates = existingSkus.map(async (sku: any) => {
            try {
                const inherited = getInheritedAssets(sku.parent_id, sku.specs[l2Label]);
                const currentVideos = sku.specs?.video_urls || (sku.video_url ? [sku.video_url] : []) || [];
                const newVideos = Array.from(new Set([...currentVideos, ...inherited.videos]));
                const currentPdfs = sku.specs?.pdf_urls || [];
                const newPdfs = Array.from(new Set([...currentPdfs, ...inherited.pdfs]));

                const payload = {
                    video_url: newVideos[0] || null,
                    hsn_code: variants.find((v: any) => v.id === sku.parent_id)?.hsn_code || family.hsn_code || '',
                    specs: {
                        ...sku.specs,
                        video_urls: newVideos,
                        pdf_urls: newPdfs,
                    },
                };

                const { error } = await supabase.from('cat_items').update(payload).eq('id', sku.id);
                if (error) throw error;

                successCount++;
                return { ...sku, ...payload };
            } catch (err) {
                console.error(`Failed to sync SKU ${sku.id}:`, err);
                failCount++;
                return sku;
            }
        });

        const results = await Promise.all(updates);
        onUpdate(results);
        setIsSyncing(false);

        if (failCount === 0) {
            toast.success(`Successfully synchronized ${successCount} SKUs.`);
        } else if (successCount > 0) {
            toast.info(`Sync complete: ${successCount} successful, ${failCount} failed.`);
        } else {
            toast.error(`Failed to synchronize assets.`);
        }
    };

    const toggleSku = async (variant: any, color: any) => {
        try {
            const colorNameUpper = color.name?.toUpperCase() || '';
            const exists = existingSkus.find(
                (s: any) => s.parent_id === variant.id && s.specs[l2Label]?.toUpperCase() === colorNameUpper
            );
            const supabase = createClient();

            if (exists) {
                const { error } = await supabase.from('cat_items').delete().eq('id', exists.id);
                if (error) throw error;
                onUpdate(existingSkus.filter((s: any) => s.id !== exists.id));
                toast.success('SKU removed');
            } else {
                const inherited = getInheritedAssets(variant.id, color.name);
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                const payload = {
                    name: `${variant.name} ${color.name}`.toUpperCase(),
                    history: [
                        {
                            at: new Date().toISOString(),
                            by: user?.id,
                            action: 'generated',
                            field: 'SKU',
                        },
                    ],
                    specs: {
                        ...variant.specs,
                        [l2Label]: color.name?.toUpperCase() || '',
                        gallery: inherited.gallery,
                        video_urls: inherited.videos,
                        primary_image: inherited.primary,
                        pdf_urls: inherited.pdfs,
                        hex_primary: color.specs?.hex_primary,
                        hex_secondary: color.specs?.hex_secondary,
                    },
                    type: 'SKU',
                    status: 'ACTIVE', // SOT: SKUs should be ACTIVE for AUMS pricing
                    brand_id: family.brand_id,
                    template_id: family.template_id,
                    parent_id: variant.id,
                    slug: `${variant.slug}-${(color.name || '').toLowerCase()}`.replace(/ /g, '-'),
                    price_base: family.price_base || 0,
                    hsn_code: variant.hsn_code || family.hsn_code || '',
                    image_url: inherited.primary,
                    gallery_urls: inherited.gallery,
                    video_url: inherited.videos[0] || null,
                };
                const { data, error } = await supabase
                    .from('cat_items')
                    .upsert(payload, { onConflict: 'slug' })
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    onUpdate([...existingSkus, data]);
                    toast.success('SKU created');
                }
            }
        } catch (error: any) {
            toast.error('Failed to toggle SKU: ' + error.message);
        }
    };

    const togglePrimary = async (sku: any) => {
        toast('Set as Primary SKU?', {
            action: {
                label: 'Confirm',
                onClick: () => executeTogglePrimary(sku),
            },
        });
    };

    const executeTogglePrimary = async (sku: any) => {
        try {
            const supabase = createClient();
            // Rule: Only one SKU can be primary for this specific variant row
            await supabase
                .from('cat_items')
                .update({ is_primary: false })
                .eq('parent_id', sku.parent_id)
                .eq('type', 'SKU');
            const { data, error } = await supabase
                .from('cat_items')
                .update({ is_primary: true })
                .eq('id', sku.id)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                onUpdate(
                    existingSkus.map((s: any) =>
                        s.parent_id === sku.parent_id ? { ...s, is_primary: s.id === sku.id } : s
                    )
                );
                toast.success(`${sku.name} is now primary`);
            }
        } catch (err: any) {
            toast.error('Failed to set primary: ' + err.message);
        }
    };

    const handleMediaSave = async (
        images: string[],
        videos: string[],
        pdfs: string[],
        primary: string | null,
        applyVideosToAll?: boolean,
        zoomFactor?: number,
        isFlipped?: boolean,
        offsetX?: number,
        offsetY?: number
    ) => {
        console.log('DEBUG: MatrixStep handleMediaSave called', {
            images,
            videos,
            pdfs,
            primary,
            applyVideosToAll,
            zoomFactor,
            isFlipped,
            offsetX,
            offsetY,
        });
        if (!activeMediaSku) return;

        try {
            const supabase = createClient();

            // 1. Prepare assets payload
            const assetsPayload: any[] = [];
            images.forEach((url, idx) => {
                assetsPayload.push({
                    item_id: activeMediaSku.id,
                    type: 'IMAGE',
                    url,
                    is_primary: url === primary,
                    zoom_factor: zoomFactor || 1.0,
                    is_flipped: isFlipped || false,
                    offset_x: offsetX || 0,
                    offset_y: offsetY || 0,
                    position: idx,
                });
            });
            videos.forEach((url, idx) => {
                assetsPayload.push({ item_id: activeMediaSku.id, type: 'VIDEO', url, position: idx });
            });
            pdfs.forEach((url, idx) => {
                assetsPayload.push({ item_id: activeMediaSku.id, type: 'PDF', url, position: idx });
            });

            // 2. Perform database updates
            const updatedSpecs = {
                ...activeMediaSku.specs,
                gallery: images,
                primary_image: primary,
                video_urls: videos,
                pdf_urls: pdfs,
            };

            const payload: any = {
                gallery_urls: images,
                image_url: primary,
                video_url: videos[0] || null,
                specs: updatedSpecs,
                zoom_factor: zoomFactor || 1.1,
            };

            const { data, error } = await supabase
                .from('cat_items')
                .update(payload)
                .eq('id', activeMediaSku.id)
                .select()
                .single();
            if (error) throw error;

            // Update assets table
            await supabase.from('cat_assets').delete().eq('item_id', activeMediaSku.id);
            if (assetsPayload.length > 0) {
                const { error: assetsError } = await supabase.from('cat_assets').insert(assetsPayload);
                if (assetsError) throw assetsError;
            }

            if (data) {
                onUpdate(existingSkus.map((s: any) => (s.id === activeMediaSku.id ? data : s)));
            }

            // Handle bulk update if needed
            if (applyVideosToAll && (videos.length > 0 || pdfs.length > 0)) {
                const otherSkus = existingSkus.filter(
                    (s: any) => s.parent_id === activeMediaSku.parent_id && s.id !== activeMediaSku.id
                );
                if (otherSkus.length > 0) {
                    const updatePromises = otherSkus.map(async (s: any) => {
                        const newSpecs = { ...s.specs, video_urls: videos, pdf_urls: pdfs };
                        await supabase
                            .from('cat_items')
                            .update({
                                video_url: videos[0] || null,
                                specs: newSpecs,
                            })
                            .eq('id', s.id);

                        // Also update assets for other SKUs in same variant (Wait, usually assets are per color. Matrix handles SKUs which are Variant x Color)
                        // This logic seems specific to propagation. For now let's keep it simple.
                    });
                    await Promise.all(updatePromises);
                    onUpdate(
                        existingSkus.map((s: any) => {
                            if (s.parent_id === activeMediaSku.parent_id) {
                                return {
                                    ...s,
                                    video_url: videos[0] || null,
                                    specs: { ...s.specs, video_urls: videos, pdf_urls: pdfs },
                                    ...(s.id === activeMediaSku.id ? data : {}),
                                };
                            }
                            return s;
                        })
                    );
                }
            }

            toast.success('Media saved successfully');
        } catch (error: any) {
            console.error('MatrixStep save failed:', error);
            toast.error('Failed to save media: ' + error.message);
        }
    };

    const updatePrice = async (skuId: string, price: number) => {
        const supabase = createClient();
        await supabase.from('cat_items').update({ price_base: price }).eq('id', skuId);
        onUpdate(existingSkus.map((s: any) => (s.id === skuId ? { ...s, price_base: price } : s)));
    };

    const handleCopyPriceToRow = async (variantId: string, price: number) => {
        const skusToUpdate = existingSkus.filter((s: any) => s.parent_id === variantId);
        if (skusToUpdate.length === 0) return;
        const supabase = createClient();
        await Promise.all(
            skusToUpdate.map((sku: any) => supabase.from('cat_items').update({ price_base: price }).eq('id', sku.id))
        );
        onUpdate(existingSkus.map((s: any) => (s.parent_id === variantId ? { ...s, price_base: price } : s)));
        setFocusedSkuId(null);
    };

    // Calculate Global Primary Occupancy
    const primaryColorsOccupancy: Record<string, string> = {};
    existingSkus.forEach((s: any) => {
        if (s.is_primary) {
            primaryColorsOccupancy[s.specs?.[l2Label]?.toUpperCase()] = s.specs?.[l1Label];
        }
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
            <div className="flex items-center justify-end px-4">
                <button
                    onClick={handleSyncAssets}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                    {isSyncing ? <Loader2 className="animate-spin w-3 h-3" /> : <Upload size={14} />}
                    {isSyncing ? 'Syncing...' : 'Sync Inherited Assets'}
                </button>
            </div>

            <div className="overflow-x-auto pb-12 custom-scrollbar max-h-[85vh] rounded-[2rem]">
                <table className="w-full border-separate border-spacing-4">
                    <thead className="sticky top-0 z-[100]">
                        <tr>
                            <th className="p-4 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic text-center w-64 h-20 sticky left-0 z-[110] border-4 border-white/10 shadow-2xl">
                                {l1Label} <span className="mx-2 opacity-30">×</span> {l2Label}
                            </th>
                            {colors.map((color: any) => (
                                <th
                                    key={color.id}
                                    className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl min-w-[140px] h-16"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-xl shadow-inner border border-black/5"
                                            style={{ backgroundColor: color.specs?.hex_primary || '#000000' }}
                                        />
                                        <div className="text-center">
                                            <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase italic block leading-none truncate max-w-[120px]">
                                                {color.name}
                                            </span>
                                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                                                Style
                                            </span>
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {variants.map((variant: any) => (
                            <tr key={variant.id}>
                                <td className="p-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl h-64 sticky left-0 z-40 shadow-xl shadow-slate-200/40 dark:shadow-none min-w-[240px]">
                                    <div className="text-center">
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase italic leading-tight text-base tracking-tighter">
                                            {variant.name}
                                        </h4>
                                        <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full mt-2">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                {l1Label}
                                            </p>
                                        </div>
                                        <div className="mt-3 text-[9px] font-mono text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg inline-block border border-slate-200 dark:border-white/5">
                                            ID: {variant.id.toString().slice(-9)}
                                        </div>
                                    </div>
                                </td>
                                {colors.map((color: any) => {
                                    const sku = existingSkus.find((s: any) => {
                                        if (s.parent_id !== variant.id) return false;
                                        const targetColor = color.name?.toUpperCase();
                                        const specs = s.specs || {};
                                        return (
                                            specs[l2Label]?.toUpperCase() === targetColor ||
                                            specs.Color?.toUpperCase() === targetColor ||
                                            specs.Colour?.toUpperCase() === targetColor ||
                                            specs.Style?.toUpperCase() === targetColor
                                        );
                                    });
                                    const isColorOccupiedByOtherVariant =
                                        !sku?.is_primary && primaryColorsOccupancy[color.name?.toUpperCase()];
                                    const isPendingSku = pendingAction?.id === `sku-${variant.id}-${color.name}`;
                                    const isPendingPrimary = sku && pendingAction?.id === `primary-${sku.id}`;

                                    return (
                                        <td key={color.id} className="p-1">
                                            <div
                                                className={`h-64 w-full min-w-[160px] p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 relative ${sku ? 'border-indigo-600/20 bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10' : 'border-slate-50/50 opacity-10 hover:opacity-100 dark:border-white/5'}`}
                                            >
                                                <div className="w-full flex items-center justify-between gap-1.5 z-20">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => toggleSku(variant, color)}
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${sku ? 'text-white shadow-lg' : 'bg-slate-100 dark:bg-white/10 text-slate-300'} ${isPendingSku ? 'ring-4 ring-indigo-500 animate-pulse' : ''}`}
                                                            style={
                                                                sku
                                                                    ? {
                                                                          backgroundColor:
                                                                              color.specs?.hex_primary || '#4f46e5',
                                                                      }
                                                                    : {}
                                                            }
                                                        >
                                                            {sku ? (
                                                                <Check size={12} strokeWidth={4} />
                                                            ) : (
                                                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                            )}
                                                        </button>

                                                        {sku && (
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    if (!isColorOccupiedByOtherVariant)
                                                                        togglePrimary(sku);
                                                                }}
                                                                disabled={!!isColorOccupiedByOtherVariant}
                                                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border ${sku.is_primary ? 'bg-yellow-400 border-yellow-500 text-white shadow-lg' : isColorOccupiedByOtherVariant ? 'bg-slate-100 dark:bg-slate-800 border-slate-100 dark:border-white/5 text-slate-200 cursor-not-allowed opacity-50' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-white/20 dark:border-white/5 text-slate-300 hover:text-yellow-400'} ${isPendingPrimary ? 'ring-4 ring-yellow-400 animate-pulse' : ''}`}
                                                                title={
                                                                    isColorOccupiedByOtherVariant
                                                                        ? `Color already primary in ${primaryColorsOccupancy[color.name?.toUpperCase()]}`
                                                                        : 'Mark as Primary SKU'
                                                                }
                                                            >
                                                                <Star
                                                                    size={10}
                                                                    fill={sku.is_primary ? 'currentColor' : 'none'}
                                                                />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {sku && (
                                                        <div className="text-[8px] font-mono text-slate-900 dark:text-white font-black uppercase tracking-widest bg-white/60 dark:bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/20 dark:border-white/5 shadow-sm whitespace-nowrap">
                                                            {(() => {
                                                                const raw = sku.id.toString().slice(-9).toUpperCase();
                                                                return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-center w-full">
                                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase italic leading-none truncate max-w-[140px] block font-display">
                                                        {color.name}
                                                    </span>
                                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                                                        Selected Style
                                                    </span>
                                                </div>

                                                {sku && (
                                                    <div className="flex flex-col items-center gap-1 flex-1 justify-center w-full">
                                                        <button
                                                            onClick={() => setActiveMediaSku(sku)}
                                                            className={`w-14 h-14 rounded-xl border-2 transition-all overflow-hidden flex items-center justify-center group/media relative ${sku.image_url || sku.specs?.primary_image || sku.video_url || sku.specs?.video_urls?.[0] ? 'border-indigo-600/30' : 'bg-slate-50 dark:bg-black/40 border-dashed border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 hover:border-indigo-600/50'}`}
                                                            title="Manage Media"
                                                        >
                                                            {(() => {
                                                                const imgUrl =
                                                                    sku.image_url || sku.specs?.primary_image;
                                                                const vidUrl =
                                                                    sku.video_url || sku.specs?.video_urls?.[0];
                                                                const vidThumb = vidUrl
                                                                    ? getYoutubeThumbnail(vidUrl)
                                                                    : null;

                                                                if (imgUrl) {
                                                                    return (
                                                                        <>
                                                                            <img
                                                                                src={imgUrl}
                                                                                className="w-full h-full object-contain p-1 group-hover/media:scale-110 transition-transform duration-500"
                                                                                alt={sku.name}
                                                                            />
                                                                            {vidUrl && (
                                                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                                                                                    <Play
                                                                                        size={8}
                                                                                        fill="currentColor"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                                <Upload size={20} strokeWidth={3} />
                                                                            </div>
                                                                        </>
                                                                    );
                                                                } else if (vidUrl) {
                                                                    return (
                                                                        <>
                                                                            {vidThumb ? (
                                                                                <img
                                                                                    src={vidThumb}
                                                                                    className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-500 opacity-80"
                                                                                    alt="Thumbnail"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
                                                                                    <Play
                                                                                        size={24}
                                                                                        fill="currentColor"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white shadow-sm z-10">
                                                                                <Play size={10} fill="currentColor" />
                                                                            </div>
                                                                            <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center text-white z-20">
                                                                                <Upload size={20} strokeWidth={3} />
                                                                            </div>
                                                                        </>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div className="flex flex-col items-center gap-0.5">
                                                                            <Upload size={18} strokeWidth={2} />
                                                                            <span className="text-[6px] font-black uppercase tracking-widest">
                                                                                Upload
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                            })()}
                                                        </button>

                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setEditingSku(sku);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="w-14 h-8 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 hover:border-indigo-500 flex items-center justify-center transition-all mt-1"
                                                            title="Edit SKU Attributes"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>

                                                        {focusedSkuId === sku.id && (
                                                            <button
                                                                onClick={() =>
                                                                    handleCopyPriceToRow(variant.id, sku.price_base)
                                                                }
                                                                className="px-4 py-2 text-[9px] font-black text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl flex items-center gap-2 transition-all shadow-sm animate-in fade-in zoom-in duration-200"
                                                            >
                                                                <Copy size={12} />
                                                                <span>COPY TO ROW</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="fixed bottom-8 right-8 z-[1000] flex flex-col gap-3 pointer-events-none">
                {/* Replaced custom notifications with sonner */}
            </div>

            {activeMediaSku && (
                <SKUMediaManager
                    skuName={activeMediaSku.name}
                    initialImages={activeMediaSku.gallery_urls || activeMediaSku.specs?.gallery || []}
                    initialVideos={
                        activeMediaSku.specs?.video_urls || (activeMediaSku.video_url ? [activeMediaSku.video_url] : [])
                    }
                    inheritedVideos={getInheritedAssets(activeMediaSku.parent_id, activeMediaSku.specs[l2Label]).videos}
                    initialPdfs={activeMediaSku.specs?.pdf_urls || []}
                    inheritedPdfs={getInheritedAssets(activeMediaSku.parent_id, activeMediaSku.specs[l2Label]).pdfs}
                    inheritedFrom={`${family.brand?.name || 'Brand'} / ${family.name} / ${variants.find((v: any) => v.id === activeMediaSku.parent_id)?.name || 'Variant'}`}
                    initialPrimary={activeMediaSku.image_url || activeMediaSku.specs?.primary_image}
                    initialZoomFactor={activeMediaSku.zoom_factor || 1.0}
                    initialIsFlipped={activeMediaSku.is_flipped || false}
                    initialOffsetX={activeMediaSku.offset_x || 0}
                    initialOffsetY={activeMediaSku.offset_y || 0}
                    onSave={handleMediaSave}
                    onClose={() => setActiveMediaSku(null)}
                />
            )}

            {/* Edit SKU Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit SKU: ${editingSku?.name || 'Specs'}`}
                size="xl"
            >
                {editingSku && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                            <Info size={16} className="text-indigo-500" />
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                Override specific attributes for this SKU. Inherited values are shown as placeholders.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(() => {
                                const modelAttrs = Array.isArray(template?.attribute_config)
                                    ? template.attribute_config
                                    : template?.attribute_config?.model || [];
                                const variantAttrs = Array.isArray(template?.attribute_config)
                                    ? []
                                    : template?.attribute_config?.variant || [];
                                return [...modelAttrs, ...variantAttrs];
                            })().map((attr: any) => {
                                // Resolve inherited value from Variant or Family
                                const variant = variants.find((v: any) => v.id === editingSku.parent_id);
                                const inheritedValue = variant?.specs?.[attr.key] || family?.specs?.[attr.key] || '-';

                                return (
                                    <div key={attr.key} className="space-y-2">
                                        <label
                                            className="text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-help dashed-underline decoration-slate-300"
                                            title={`Key: ${attr.key} | Type: ${attr.type} | Suffix: ${attr.suffix || 'None'}`}
                                        >
                                            {attr.label}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <AttributeInput
                                                attr={attr}
                                                value={editingSku.specs?.[attr.key]}
                                                onChange={(val: any) =>
                                                    setEditingSku({
                                                        ...editingSku,
                                                        specs: { ...editingSku.specs, [attr.key]: val },
                                                    })
                                                }
                                                placeholder={String(inheritedValue)}
                                                className="bg-transparent font-bold text-lg outline-none w-full border-b border-gray-200 dark:border-gray-700 focus:border-indigo-500 py-1"
                                            />
                                            {attr.suffix &&
                                                !attr.label?.toLowerCase().includes('material') &&
                                                !(attr.key === 'weight' && attr.type === 'select') && (
                                                    <span className="text-xs font-bold text-indigo-400 text-[10px] uppercase tracking-wider">
                                                        {attr.suffix}
                                                    </span>
                                                )}
                                        </div>
                                        <div className="text-[9px] text-slate-300 flex items-center gap-1">
                                            Inherited:{' '}
                                            <span className="font-bold text-slate-500">
                                                {typeof inheritedValue === 'object' ? 'Complex Data' : inheritedValue}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-100 dark:border-white/5">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Box size={12} className="text-indigo-500" /> Suitable For
                                </label>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                                        {(editingSku.specs?.suitable_for || '')
                                            .split(',')
                                            .filter(Boolean)
                                            .map((v: string) => (
                                                <div
                                                    key={v}
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm"
                                                >
                                                    {v}
                                                    <button
                                                        onClick={() => {
                                                            const current = (editingSku.specs?.suitable_for || '')
                                                                .split(',')
                                                                .filter(Boolean);
                                                            const next = current.filter((x: string) => x !== v);
                                                            setEditingSku({
                                                                ...editingSku,
                                                                specs: {
                                                                    ...editingSku.specs,
                                                                    suitable_for: next.join(','),
                                                                },
                                                            });
                                                        }}
                                                        className="hover:scale-125 transition-transform"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        {!editingSku.specs?.suitable_for && (
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1">
                                                No Compatibility Fixed
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {/* 1. Brand Selector */}
                                        <select
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 shadow-sm"
                                            value={selectedBrandId}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setSelectedBrandId(val);
                                                setSelectedModelId('');
                                                setSelectedVariantId('');
                                                if (val === 'UNIVERSAL') addCompatibilityTag('UNIVERSAL / ALL MODELS');
                                            }}
                                        >
                                            <option value="">Select Brand...</option>
                                            <option value="UNIVERSAL">UNIVERSAL / ALL MODELS</option>
                                            {brands.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>

                                        {/* 2. Model Selector */}
                                        {selectedBrandId && selectedBrandId !== 'UNIVERSAL' && (
                                            <select
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 shadow-sm"
                                                value={selectedModelId}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setSelectedModelId(val);
                                                    setSelectedVariantId('');
                                                    if (val === 'ALL_MODELS') {
                                                        const brandName = brands.find(
                                                            b => b.id === selectedBrandId
                                                        )?.name;
                                                        addCompatibilityTag(`${brandName} (All Models)`);
                                                    }
                                                }}
                                            >
                                                <option value="">Select Model...</option>
                                                <option value="ALL_MODELS">
                                                    All {brands.find(b => b.id === selectedBrandId)?.name} Models
                                                </option>
                                                {models.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        {/* 3. Variant Selector */}
                                        {selectedModelId && selectedModelId !== 'ALL_MODELS' && (
                                            <select
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 shadow-sm"
                                                value={selectedVariantId}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setSelectedVariantId(val);
                                                    const brandName = brands.find(b => b.id === selectedBrandId)?.name;
                                                    const modelName = models.find(m => m.id === selectedModelId)?.name;

                                                    if (val === 'ALL_VARIANTS') {
                                                        addCompatibilityTag(`${brandName} ${modelName}`);
                                                    } else {
                                                        const variantName = variantsList.find(v => v.id === val)?.name;
                                                        addCompatibilityTag(`${brandName} ${modelName} ${variantName}`);
                                                    }
                                                }}
                                            >
                                                <option value="">Select Variant...</option>
                                                <option value="ALL_VARIANTS">
                                                    All {models.find(m => m.id === selectedModelId)?.name} Variants
                                                </option>
                                                {variantsList.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    Related Keywords (Tags)
                                </label>
                                <input
                                    type="text"
                                    value={editingSku.specs?.related_keywords || ''}
                                    onChange={e =>
                                        setEditingSku({
                                            ...editingSku,
                                            specs: { ...editingSku.specs, related_keywords: e.target.value },
                                        })
                                    }
                                    className="bg-transparent font-bold text-sm outline-none w-full border-b border-gray-200 dark:border-gray-700 focus:border-indigo-500"
                                    placeholder="Comma separated tags e.g. sport, taluka, budget"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-white/5">
                            <button
                                onClick={async () => {
                                    try {
                                        // Save Logic
                                        const supabase = createClient();
                                        const { error } = await supabase
                                            .from('cat_items')
                                            .update({
                                                specs: editingSku.specs,
                                            })
                                            .eq('id', editingSku.id);

                                        if (error) throw error;

                                        // Update Local State
                                        onUpdate(
                                            existingSkus.map((s: any) => (s.id === editingSku.id ? editingSku : s))
                                        );
                                        setIsEditModalOpen(false);
                                        toast.success('SKU updated');
                                    } catch (err: any) {
                                        toast.error('Failed to update SKU: ' + err.message);
                                    }
                                }}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
