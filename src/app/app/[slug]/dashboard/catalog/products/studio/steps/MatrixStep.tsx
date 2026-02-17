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
    ChevronDown,
    Plus,
    MapPin,
    IndianRupee,
    Link2,
    Package,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getProxiedUrl } from '@/lib/utils/urlHelper';
import SKUMediaManager from '@/components/catalog/SKUMediaManager';
import AttributeInput from '@/components/catalog/AttributeInput';
import { toast } from 'sonner';
import { INDIAN_STATES, DEFAULT_STATE_CODE, getStateName } from '@/constants/indianStates';
import CopyableId from '@/components/ui/CopyableId';

const getYoutubeThumbnail = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : null;
};

export default function MatrixStep({ family, variants, colors, allColors = [], existingSkus, onUpdate }: any) {
    const l1Label = 'Variant';
    const l2Label = 'Unit';

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

    // State Pricing State
    const [statePrices, setStatePrices] = useState<Record<string, number>>({});
    const [selectedStates, setSelectedStates] = useState<string[]>([DEFAULT_STATE_CODE]);
    const [isSavingSku, setIsSavingSku] = useState(false);

    // Inclusion Type State
    const [inclusionType, setInclusionType] = useState<string>('OPTIONAL');

    // Compatibility (Suitable For) State — relational via cat_item_compatibility
    const [compatEntries, setCompatEntries] = useState<any[]>([]);

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
            const { data } = await (supabase as any)
                .from('cat_models')
                .select('id, name')
                .eq('brand_id', selectedBrandId)
                .eq('status', 'ACTIVE')
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
            const { data } = await (supabase as any)
                .from('cat_variants_vehicle')
                .select('id, name')
                .eq('model_id', selectedModelId)
                .eq('status', 'ACTIVE')
                .order('name');
            if (data) setVariantsList(data);
        };
        fetchVariants();
    }, [selectedModelId]);

    // Fetch state prices + compatibility when editing a SKU
    const fetchSkuDetails = async (skuId: string) => {
        const supabase = createClient();
        // Fetch state prices from canonical state pricing table
        const allStateCodes = INDIAN_STATES.map(s => s.code);
        const { data: priceRows } = await supabase
            .from('cat_price_state_mh')
            .select('state_code, ex_showroom')
            .eq('sku_id', skuId)
            .in('state_code', allStateCodes);
        if (priceRows && priceRows.length > 0) {
            const priceMap: Record<string, number> = {};
            const states: string[] = [];
            (priceRows || []).forEach((row: any) => {
                const code = row.state_code;
                const exShowroom = Number(row.ex_showroom) || 0;
                if (code && exShowroom > 0) {
                    priceMap[code] = exShowroom;
                    states.push(code);
                }
            });
            setStatePrices(priceMap);
            setSelectedStates(states.length > 0 ? states : [DEFAULT_STATE_CODE]);
        } else {
            setStatePrices({});
            setSelectedStates([DEFAULT_STATE_CODE]);
        }
        // Fetch compatibility entries
        const { data: compat } = await supabase
            .from('cat_item_compatibility')
            .select(
                `
                id, is_universal,
                target_brand_id, target_family_id, target_variant_id
            `
            )
            .eq('item_id', skuId);
        if (compat) {
            // Enrich with names
            const enriched = await Promise.all(
                compat.map(async (c: any) => {
                    let label = '';
                    if (c.is_universal) {
                        label = 'UNIVERSAL / ALL MODELS';
                    } else {
                        const parts: string[] = [];
                        if (c.target_brand_id) {
                            const { data: brand } = await supabase
                                .from('cat_brands')
                                .select('name')
                                .eq('id', c.target_brand_id)
                                .single();
                            parts.push(brand?.name || 'Unknown Brand');
                        }
                        if (c.target_family_id) {
                            const { data: fam } = await (supabase as any)
                                .from('cat_models')
                                .select('name')
                                .eq('id', c.target_family_id)
                                .single();
                            if (!c.target_variant_id) parts.push(`${fam?.name || 'All Models'}`);
                            else parts.push(fam?.name || '');
                        } else if (c.target_brand_id && !c.target_family_id) {
                            parts.push('(All Models)');
                        }
                        if (c.target_variant_id) {
                            const { data: v } = await (supabase as any)
                                .from('cat_variants_vehicle')
                                .select('name')
                                .eq('id', c.target_variant_id)
                                .single();
                            parts.push(v?.name || '');
                        }
                        label = parts.join(' ');
                    }
                    return { ...c, label };
                })
            );
            setCompatEntries(enriched);
        } else {
            setCompatEntries([]);
        }
    };

    const addCompatibilityEntry = () => {
        if (selectedBrandId === 'UNIVERSAL') {
            // Check if already exists
            if (compatEntries.some(c => c.is_universal)) return;
            setCompatEntries([
                ...compatEntries,
                {
                    id: `new-${Date.now()}`,
                    is_universal: true,
                    target_brand_id: null,
                    target_family_id: null,
                    target_variant_id: null,
                    label: 'UNIVERSAL / ALL MODELS',
                },
            ]);
        } else if (selectedBrandId) {
            const brandName = brands.find(b => b.id === selectedBrandId)?.name || '';
            const modelName =
                selectedModelId && selectedModelId !== 'ALL_MODELS'
                    ? models.find(m => m.id === selectedModelId)?.name || ''
                    : '';
            const variantName =
                selectedVariantId && selectedVariantId !== 'ALL_VARIANTS'
                    ? variantsList.find(v => v.id === selectedVariantId)?.name || ''
                    : '';

            const entry: any = {
                id: `new-${Date.now()}`,
                is_universal: false,
                target_brand_id: selectedBrandId,
                target_family_id: selectedModelId && selectedModelId !== 'ALL_MODELS' ? selectedModelId : null,
                target_variant_id: selectedVariantId && selectedVariantId !== 'ALL_VARIANTS' ? selectedVariantId : null,
                label: [brandName, modelName || '(All Models)', variantName].filter(Boolean).join(' '),
            };

            // Dedup check
            const isDup = compatEntries.some(
                c =>
                    c.target_brand_id === entry.target_brand_id &&
                    c.target_family_id === entry.target_family_id &&
                    c.target_variant_id === entry.target_variant_id
            );
            if (!isDup) setCompatEntries([...compatEntries, entry]);
        }
        setSelectedBrandId('');
        setSelectedModelId('');
        setSelectedVariantId('');
    };

    // Legacy tag support for backward compat
    const addCompatibilityTag = (tag: string) => {
        const current = (editingSku.specs?.suitable_for || '').split(',').filter(Boolean);
        if (!current.includes(tag)) {
            const next = [...current, tag];
            setEditingSku({
                ...editingSku,
                specs: { ...editingSku.specs, suitable_for: next.join(',') },
            });
        }
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

                const { error } = await (supabase as any).from('cat_skus').update(payload).eq('id', sku.id);
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

    const toggleSku = async (variant: any, colorColumn: any) => {
        try {
            const colorNameUpper = colorColumn.name?.toUpperCase() || '';

            // Hierarchy-Aware Existence Check:
            // 1. Find ANY UNIT in allColors whose name matches colorNameUpper and parent is current variant
            const localColor = allColors.find(
                (c: any) =>
                    c.type === 'UNIT' && c.parent_id === variant.id && (c.name || '').toUpperCase() === colorNameUpper
            );

            // 2. Find ANY SKU whose parent is either current variant OR localColor
            const exists = existingSkus.find((s: any) => {
                const parentMatch = s.parent_id === variant.id || (localColor && s.parent_id === localColor.id);
                if (!parentMatch) return false;

                // Color match: either specs match or parent is the localColor
                const specsMatch = (s.specs[l2Label] || '').toUpperCase() === colorNameUpper;
                return specsMatch || (localColor && s.parent_id === localColor.id);
            });

            const supabase = createClient();

            if (exists) {
                const { error } = await (supabase as any).from('cat_skus').delete().eq('id', exists.id);
                if (error) throw error;
                onUpdate(existingSkus.filter((s: any) => s.id !== exists.id));
                toast.success('SKU removed');
            } else {
                // Determine target parent: Local Color if exists, else Variant
                const targetParentId = localColor ? localColor.id : variant.id;
                const inherited = getInheritedAssets(variant.id, colorColumn.name);

                const {
                    data: { user },
                } = await supabase.auth.getUser();

                const payload = {
                    name: `${variant.name} ${colorColumn.name}`.toUpperCase(),
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
                        [l2Label]: colorColumn.name?.toUpperCase() || '',
                        gallery: inherited.gallery,
                        primary_image: inherited.primary,
                        video_urls: inherited.videos,
                        pdf_urls: inherited.pdfs,
                        hex_primary: colorColumn.specs?.hex_primary,
                        hex_secondary: colorColumn.specs?.hex_secondary,
                    },
                    type: 'SKU',
                    status: 'ACTIVE',
                    brand_id: family.brand_id,
                    category: family.category || 'VEHICLE',
                    parent_id: targetParentId,
                    slug: `${variant.slug}-${(colorColumn.name || '').toLowerCase()}`
                        .replace(/ /g, '-')
                        .replace(/\//g, '-'),
                    price_base: family.price_base || 0,
                    hsn_code: variant.hsn_code || family.hsn_code || '',
                    primary_image: inherited.primary,
                    gallery_img_1: inherited.gallery?.[0] || null,
                    gallery_img_2: inherited.gallery?.[1] || null,
                    gallery_img_3: inherited.gallery?.[2] || null,
                    gallery_img_4: inherited.gallery?.[3] || null,
                    gallery_img_5: inherited.gallery?.[4] || null,
                    gallery_img_6: inherited.gallery?.[5] || null,
                    video_url_1: inherited.videos[0] || null,
                    video_url_2: inherited.videos[1] || null,
                };

                const { data, error } = await (supabase as any)
                    .from('cat_skus')
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
            await (supabase as any).from('cat_skus').update({ is_primary: false }).eq('parent_id', sku.parent_id);
            const { data, error } = await (supabase as any)
                .from('cat_skus')
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
                primary_image: primary,
                gallery_img_1: images[0] || null,
                gallery_img_2: images[1] || null,
                gallery_img_3: images[2] || null,
                gallery_img_4: images[3] || null,
                gallery_img_5: images[4] || null,
                gallery_img_6: images[5] || null,
                video_url_1: videos[0] || null,
                video_url_2: videos[1] || null,
                zoom_factor: zoomFactor || 1.1,
                is_flipped: isFlipped || false,
                offset_x: offsetX || 0,
                offset_y: offsetY || 0,
            };

            const { data, error } = await (supabase as any)
                .from('cat_skus')
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
                        await (supabase as any)
                            .from('cat_skus')
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
        await (supabase as any).from('cat_skus').update({ price_base: price }).eq('id', skuId);
        onUpdate(existingSkus.map((s: any) => (s.id === skuId ? { ...s, price_base: price } : s)));
    };

    const handleCopyPriceToRow = async (variantId: string, price: number) => {
        const skusToUpdate = existingSkus.filter((s: any) => s.parent_id === variantId);
        if (skusToUpdate.length === 0) return;
        const supabase = createClient();
        await Promise.all(
            skusToUpdate.map((sku: any) =>
                (supabase as any).from('cat_skus').update({ price_base: price }).eq('id', sku.id)
            )
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
                                        <CopyableId
                                            id={variant.id}
                                            showHash={false}
                                            className="mt-3 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5 px-3 py-1 rounded-lg"
                                            textClassName="text-[9px] text-slate-500 dark:text-slate-400"
                                            iconClassName="hidden"
                                        />
                                    </div>
                                </td>
                                {colors.map((color: any) => {
                                    const sku = existingSkus.find((s: any) => {
                                        const colorNameUpper = color.name?.toUpperCase();

                                        // 1. Find if there's a local color for this variant matching the same name
                                        const localColor = allColors.find(
                                            (c: any) =>
                                                c.type === 'UNIT' &&
                                                c.parent_id === variant.id &&
                                                (c.name || '').toUpperCase() === colorNameUpper
                                        );

                                        // 2. Check parentId match: either variantId or localColorId
                                        const parentMatch =
                                            s.parent_id === variant.id || (localColor && s.parent_id === localColor.id);
                                        if (!parentMatch) return false;

                                        // 3. Match by name in specs or parent link
                                        const specs = s.specs || {};
                                        return (
                                            (specs[l2Label] || '').toUpperCase() === colorNameUpper ||
                                            (specs.Color || '').toUpperCase() === colorNameUpper ||
                                            (specs.Style || '').toUpperCase() === colorNameUpper ||
                                            (localColor && s.parent_id === localColor.id)
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
                                                        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/20 dark:border-white/5 shadow-sm whitespace-nowrap">
                                                            <CopyableId
                                                                id={sku.id}
                                                                showHash={false}
                                                                className="px-0 py-0 hover:bg-transparent"
                                                                textClassName="text-[8px] text-slate-900 dark:text-white"
                                                                iconClassName="hidden"
                                                            />
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
                                                                                src={getProxiedUrl(imgUrl)}
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
                                                                setInclusionType(sku.inclusion_type || 'OPTIONAL');
                                                                setStatePrices({
                                                                    [DEFAULT_STATE_CODE]: sku.price_base || 0,
                                                                });
                                                                setSelectedStates([DEFAULT_STATE_CODE]);
                                                                setIsEditModalOpen(true);
                                                                fetchSkuDetails(sku.id);
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
                                const modelAttrs: any[] =
                                    (family?.specs as any)?.model_attributes ||
                                    (family?.specs as any)?.modelAttrs ||
                                    [];
                                const variantAttrs: any[] =
                                    (family?.specs as any)?.variant_attributes ||
                                    (family?.specs as any)?.variantAttrs ||
                                    [];
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

                        {/* ─── STATE-AWARE PRICING SECTION ─── */}
                        <div className="pt-8 mt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <IndianRupee size={12} className="text-emerald-500" /> State-Aware Pricing
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {INDIAN_STATES.map(s => (
                                    <button
                                        key={s.code}
                                        onClick={() => {
                                            setSelectedStates(prev =>
                                                prev.includes(s.code)
                                                    ? prev.filter(c => c !== s.code)
                                                    : [...prev, s.code]
                                            );
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                                            selectedStates.includes(s.code)
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-300'
                                        }`}
                                    >
                                        {s.code}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSelectedStates(INDIAN_STATES.map(s => s.code))}
                                    className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 dark:border-white/10"
                                >
                                    Select All
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {selectedStates.map(code => (
                                    <div
                                        key={code}
                                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10"
                                    >
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            <MapPin size={12} className="text-indigo-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                                {getStateName(code)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 flex-1">
                                            <span className="text-[10px] font-bold text-slate-400">₹</span>
                                            <input
                                                type="number"
                                                value={statePrices[code] || editingSku?.price_base || 0}
                                                onChange={e =>
                                                    setStatePrices(prev => ({
                                                        ...prev,
                                                        [code]: Number(e.target.value),
                                                    }))
                                                }
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-indigo-500"
                                                placeholder="Ex-showroom price"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
                                <Info size={12} className="text-amber-500" />
                                <p className="text-[9px] text-amber-700 dark:text-amber-400 font-bold">
                                    The first selected state&apos;s price sets the SKU base price (price_base). All
                                    states get saved to the pricing ledger.
                                </p>
                            </div>
                        </div>

                        {/* ─── INCLUSION TYPE & SUITABLE FOR ─── */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-100 dark:border-white/5">
                            {/* Suitable For — cat_item_compatibility backed */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Link2 size={12} className="text-indigo-500" /> Suitable For
                                </label>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                                        {compatEntries.map((entry: any) => (
                                            <div
                                                key={entry.id}
                                                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm"
                                            >
                                                {entry.label}
                                                <button
                                                    onClick={() =>
                                                        setCompatEntries(
                                                            compatEntries.filter((c: any) => c.id !== entry.id)
                                                        )
                                                    }
                                                    className="hover:scale-125 transition-transform"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        {compatEntries.length === 0 && (
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1">
                                                No Compatibility Set
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
                                                if (val === 'UNIVERSAL') addCompatibilityEntry();
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
                                                onChange={e => setSelectedVariantId(e.target.value)}
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

                                        {/* Add Button */}
                                        {selectedBrandId && selectedBrandId !== 'UNIVERSAL' && (
                                            <button
                                                onClick={addCompatibilityEntry}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all w-fit"
                                            >
                                                <Plus size={12} /> Add Compatibility
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Inclusion Type + Keywords */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <Package size={12} className="text-purple-500" /> Inclusion Type
                                    </label>
                                    <select
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 shadow-sm"
                                        value={inclusionType}
                                        onChange={e => setInclusionType(e.target.value)}
                                    >
                                        <option value="OPTIONAL">Optional (Standalone / Add-On)</option>
                                        <option value="BUNDLE">Bundled (Included in Vehicle Price)</option>
                                        <option value="MANDATORY">Mandatory (Auto-included)</option>
                                    </select>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                        {inclusionType === 'OPTIONAL' &&
                                            'Optional item (sold independently or as an add-on).'}
                                        {inclusionType === 'BUNDLE' && 'Included with the vehicle — no extra charge.'}
                                        {inclusionType === 'MANDATORY' && 'Mandatory item for this SKU.'}
                                    </p>
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
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-white/5">
                            <button
                                disabled={isSavingSku}
                                onClick={async () => {
                                    setIsSavingSku(true);
                                    try {
                                        const supabase = createClient();

                                        // 1. Determine base price from first selected state
                                        const primaryState = selectedStates[0] || DEFAULT_STATE_CODE;
                                        const basePrice = statePrices[primaryState] || editingSku.price_base || 0;

                                        // 2. Update cat_skus (specs, price_base, inclusion_type)
                                        const { error } = await (supabase as any)
                                            .from('cat_skus')
                                            .update({
                                                specs: editingSku.specs,
                                                price_base: basePrice,
                                                inclusion_type: inclusionType,
                                            })
                                            .eq('id', editingSku.id);
                                        if (error) throw error;

                                        // 3. Upsert state prices into canonical state pricing table
                                        const effectivePrices: Record<string, number> = {};
                                        selectedStates.forEach(code => {
                                            const val = statePrices[code];
                                            if (val && val > 0) {
                                                effectivePrices[code] = val;
                                            } else if (code === primaryState && basePrice > 0) {
                                                effectivePrices[code] = basePrice;
                                            }
                                        });

                                        const stateRows = Object.entries(effectivePrices).map(([code, price]) => ({
                                            sku_id: editingSku.id,
                                            state_code: code,
                                            ex_showroom: price,
                                            publish_stage: 'DRAFT',
                                        }));
                                        if (stateRows.length > 0) {
                                            const { error: priceErr } = await supabase
                                                .from('cat_price_state_mh' as any)
                                                .upsert(stateRows as any, { onConflict: 'sku_id,state_code' });
                                            if (priceErr) console.error('State price upsert warning:', priceErr);
                                        }

                                        // 4. Sync compatibility entries to cat_item_compatibility
                                        // Delete existing entries then re-insert
                                        await supabase
                                            .from('cat_item_compatibility')
                                            .delete()
                                            .eq('item_id', editingSku.id);
                                        if (compatEntries.length > 0) {
                                            const compatRows = compatEntries.map((c: any) => ({
                                                item_id: editingSku.id,
                                                is_universal: c.is_universal || false,
                                                target_brand_id: c.target_brand_id || null,
                                                target_family_id: c.target_family_id || null,
                                                target_variant_id: c.target_variant_id || null,
                                            }));
                                            const { error: compatErr } = await supabase
                                                .from('cat_item_compatibility')
                                                .insert(compatRows);
                                            if (compatErr) console.error('Compatibility insert warning:', compatErr);
                                        }

                                        // 5. Update Local State
                                        const updatedSku = {
                                            ...editingSku,
                                            price_base: basePrice,
                                            inclusion_type: inclusionType,
                                        };
                                        onUpdate(
                                            existingSkus.map((s: any) => (s.id === editingSku.id ? updatedSku : s))
                                        );
                                        setIsEditModalOpen(false);
                                        toast.success('SKU updated with pricing, compatibility & inclusion type');
                                    } catch (err: any) {
                                        toast.error('Failed to update SKU: ' + err.message);
                                    } finally {
                                        setIsSavingSku(false);
                                    }
                                }}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSavingSku && <Loader2 size={16} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
