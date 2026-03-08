'use client';

import React, { useMemo, useState } from 'react';
import {
    Palette,
    Grid3X3,
    Layers,
    Star,
    Loader2,
    Upload,
    Image as ImageIcon,
    X,
    Trash2,
    Copy,
    RefreshCcw,
    Trash2 as TrashIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { getHierarchyLabels } from '@/lib/constants/catalogLabels';
import { updateSku, createSku, deleteSku, createColour } from '@/actions/catalog/catalogV2Actions';
import type { CatalogModel, CatalogSku, CatalogColour, ProductType } from '@/types/catalog';
import SKUMediaManager from '@/components/catalog/SKUMediaManager';
import { getProxiedUrl } from '@/lib/utils/urlHelper';
import { getErrorMessage } from '@/lib/utils/errorMessage';

interface SKUStepProps {
    model: CatalogModel;
    variants: any[];
    colours: CatalogColour[];
    skus: CatalogSku[];
    onUpdate: (skus: CatalogSku[]) => void;
    onUpdateColours: (colours: CatalogColour[]) => void;
    brandName?: string;
}

// Helpers — convert between flat cat_skus columns and SKUMediaManager arrays
function skuToGalleryArray(sku: CatalogSku): string[] {
    const imgs: string[] = [];
    if (sku.primary_image) imgs.push(sku.primary_image);
    for (let i = 1; i <= 6; i++) {
        const url = (sku as any)[`gallery_img_${i}`] as string | null;
        if (url && !imgs.includes(url)) imgs.push(url);
    }
    return imgs;
}

function skuToVideoArray(sku: CatalogSku): string[] {
    const vids: string[] = [];
    if (sku.video_url_1) vids.push(sku.video_url_1);
    if (sku.video_url_2) vids.push(sku.video_url_2);
    return vids;
}

function skuToPdfArray(sku: CatalogSku): string[] {
    return sku.pdf_url_1 ? [sku.pdf_url_1] : [];
}

export default function SKUStepV2({
    model,
    variants,
    colours,
    skus,
    onUpdate,
    onUpdateColours,
    brandName,
}: SKUStepProps) {
    const productType = (model.product_type || 'VEHICLE') as ProductType;
    const labels = getHierarchyLabels(productType);
    const poolLabel = labels.pool;
    const [busyCells, setBusyCells] = useState<Set<string>>(new Set());
    const [activeMediaSku, setActiveMediaSku] = useState<CatalogSku | null>(null);
    const [editingOemSku, setEditingOemSku] = useState<string | null>(null); // SKU id being edited
    const [oemDraft, setOemDraft] = useState<string>('');
    const [focusedColourId, setFocusedColourId] = useState<string | null>(null);
    const [focusedVariantId, setFocusedVariantId] = useState<string | null>(null);

    // Get variant FK field name
    const variantFkField =
        productType === 'VEHICLE'
            ? 'vehicle_variant_id'
            : productType === 'ACCESSORY'
              ? 'accessory_variant_id'
              : 'service_variant_id';

    // Use ALL colours from the colour pool as matrix rows, sorted by position
    // Fallback: if colour pool is empty but SKUs exist, reconstruct synthetic colour entries from SKUs
    const effectiveColours: CatalogColour[] = (() => {
        if (colours.length > 0) return colours;
        if (skus.length === 0) return [];
        // Reconstruct from orphaned SKUs — deduplicate by colour_id
        const seen = new Map<string, CatalogColour>();
        skus.forEach((sku, idx) => {
            const cid = sku.colour_id || sku.id; // fallback to SKU id if no colour_id
            if (!seen.has(cid)) {
                seen.set(cid, {
                    id: cid,
                    model_id: model.id,
                    name: sku.color_name || sku.name || `SKU ${idx + 1}`,
                    hex_primary: sku.hex_primary,
                    hex_secondary: sku.hex_secondary,
                    finish: sku.finish,
                    position: seen.size,
                    created_at: sku.created_at,
                    updated_at: sku.updated_at,
                });
            }
        });
        return Array.from(seen.values());
    })();
    const sortedColours = [...effectiveColours].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

    const getSkuForCell = (variantId: string, colourId: string) =>
        skus.find(s => (s as any)[variantFkField] === variantId && s.colour_id === colourId);

    // For non-accessory matrix: dynamically order columns by focus + density.
    const orderedVariants = useMemo(() => {
        const withIndex = variants.map((variant: any, index: number) => {
            const filledRows = sortedColours.filter(c => !!getSkuForCell(variant.id, c.id)).length;
            const hasFocusedColour = focusedColourId ? !!getSkuForCell(variant.id, focusedColourId) : false;
            const isFocusedVariant = focusedVariantId ? variant.id === focusedVariantId : false;
            return { variant, index, filledRows, hasFocusedColour, isFocusedVariant };
        });

        return withIndex
            .sort((a, b) => {
                if (a.isFocusedVariant !== b.isFocusedVariant) {
                    return a.isFocusedVariant ? -1 : 1;
                }
                if (focusedColourId && a.hasFocusedColour !== b.hasFocusedColour) {
                    return a.hasFocusedColour ? -1 : 1;
                }
                if (b.filledRows !== a.filledRows) return b.filledRows - a.filledRows;
                return a.index - b.index;
            })
            .map(item => item.variant);
    }, [variants, sortedColours, skus, focusedColourId, focusedVariantId, variantFkField]);

    // For non-accessory matrix: dynamically order rows by focus + density.
    const orderedColours = useMemo(() => {
        const withIndex = sortedColours.map((colour, index) => {
            const filledCols = variants.filter((v: any) => !!getSkuForCell(v.id, colour.id)).length;
            const hasFocusedVariant = focusedVariantId ? !!getSkuForCell(focusedVariantId, colour.id) : false;
            const isFocusedColour = focusedColourId ? colour.id === focusedColourId : false;
            return { colour, index, filledCols, hasFocusedVariant, isFocusedColour };
        });

        return withIndex
            .sort((a, b) => {
                if (a.isFocusedColour !== b.isFocusedColour) {
                    return a.isFocusedColour ? -1 : 1;
                }
                if (focusedVariantId && a.hasFocusedVariant !== b.hasFocusedVariant) {
                    return a.hasFocusedVariant ? -1 : 1;
                }
                if (b.filledCols !== a.filledCols) return b.filledCols - a.filledCols;
                return a.index - b.index;
            })
            .map(item => item.colour);
    }, [sortedColours, variants, skus, focusedVariantId, focusedColourId, variantFkField]);

    // Resolve colour swatch for a SKU
    const getSkuSwatch = (sku: CatalogSku) => {
        if (sku.colour_id) {
            const linked = colours.find(c => c.id === sku.colour_id);
            return linked?.hex_primary || sku.hex_primary || null;
        }
        return sku.hex_primary || null;
    };

    // Resolve display image: SKU → Colour → Variant → Model (only if media_shared)
    const resolveSkuImage = (sku: CatalogSku): { url: string | null; inherited: boolean; source: string } => {
        // 1. SKU's own image
        if (sku.primary_image) return { url: sku.primary_image, inherited: false, source: '' };

        // 2. Colour's image (if colour has media_shared on)
        const linkedColour = colours.find(c => c.id === sku.colour_id);
        if (linkedColour?.primary_image && linkedColour.media_shared) {
            return { url: linkedColour.primary_image, inherited: true, source: 'C' };
        }

        // 3. Variant's image (if variant has media_shared on)
        const skuVariantId = sku.vehicle_variant_id || sku.accessory_variant_id || sku.service_variant_id;
        const linkedVariant = skuVariantId ? variants.find(v => v.id === skuVariantId) : null;
        if (linkedVariant?.primary_image && linkedVariant.media_shared) {
            return { url: linkedVariant.primary_image, inherited: true, source: 'V' };
        }

        // 4. Model's image (if model has media_shared on)
        if (model.primary_image && model.media_shared) {
            return { url: model.primary_image, inherited: true, source: 'M' };
        }

        return { url: null, inherited: false, source: '' };
    };

    const getSkuMediaStatus = (
        sku: CatalogSku
    ): { kind: 'uploaded' | 'shared'; source?: 'C' | 'V' | 'M' | 'S'; hasMedia: boolean } => {
        const img = resolveSkuImage(sku);
        const ownPrimary = sku.primary_image || sku.gallery_img_1 || null;
        const hasMedia = Boolean(img.url || ownPrimary);
        if (!hasMedia) return { kind: 'uploaded', hasMedia: false };

        // Inherited from colour/variant/model hierarchy.
        if (img.inherited) {
            const source = (img.source || 'C') as 'C' | 'V' | 'M';
            return { kind: 'shared', source, hasMedia: true };
        }

        // Heuristic: same-colour SKUs with identical media and newer updated_at are treated as shared-from-sibling.
        const mediaKey = [
            sku.primary_image || '',
            sku.gallery_img_1 || '',
            sku.gallery_img_2 || '',
            sku.gallery_img_3 || '',
            sku.gallery_img_4 || '',
            sku.gallery_img_5 || '',
            sku.gallery_img_6 || '',
            sku.video_url_1 || '',
            sku.video_url_2 || '',
            sku.pdf_url_1 || '',
        ].join('|');

        if (sku.media_shared !== false && mediaKey.replace(/\|/g, '') !== '') {
            const sameMediaSiblings = skus.filter(s => {
                if (s.id === sku.id) return false;
                if (s.colour_id !== sku.colour_id) return false;
                const siblingKey = [
                    s.primary_image || '',
                    s.gallery_img_1 || '',
                    s.gallery_img_2 || '',
                    s.gallery_img_3 || '',
                    s.gallery_img_4 || '',
                    s.gallery_img_5 || '',
                    s.gallery_img_6 || '',
                    s.video_url_1 || '',
                    s.video_url_2 || '',
                    s.pdf_url_1 || '',
                ].join('|');
                return siblingKey === mediaKey;
            });

            if (sameMediaSiblings.length > 0) {
                const cluster = [sku, ...sameMediaSiblings].sort((a, b) => {
                    const ta = new Date(a.updated_at || a.created_at || 0).getTime();
                    const tb = new Date(b.updated_at || b.created_at || 0).getTime();
                    return ta - tb;
                });
                if (cluster[0]?.id !== sku.id) {
                    return { kind: 'shared', source: 'S', hasMedia: true };
                }
            }
        }

        return { kind: 'uploaded', hasMedia: true };
    };

    // Toggle SKU existence (create/delete)
    const handleToggleSku = async (variantId: string, colour: CatalogColour) => {
        if (productType !== 'ACCESSORY') {
            setFocusedColourId(colour.id);
            setFocusedVariantId(variantId);
        }
        const cellKey = `${variantId}-${colour.id}`;
        const existingSku = getSkuForCell(variantId, colour.id);

        setBusyCells(prev => new Set(prev).add(cellKey));

        try {
            if (existingSku) {
                await deleteSku(existingSku.id);
                onUpdate(skus.filter(s => s.id !== existingSku.id));
                toast.success(`Removed ${colour.name}`);
            } else {
                // Build descriptive SKU name
                // Accessories: "{Product} {SubVariant} for {SuitableFor}"
                // e.g. "Crash Guard Standard Stainless Steel (Silver) for Activa / Honda"
                const variant = variants.find((v: any) => v.id === variantId);
                let skuName = colour.name;
                if (productType === 'ACCESSORY' && variant?.name) {
                    // variant.name is like "HONDA › Activa" — split into brand and model
                    const parts = variant.name.split('›').map((p: string) => p.trim());
                    const suitableFor = parts.length >= 2 ? `${parts.slice(1).join(' ')} / ${parts[0]}` : variant.name;
                    skuName = `${model.name} ${colour.name} for ${suitableFor}`;
                }
                const newSku = await createSku({
                    sku_type: productType,
                    brand_id: model.brand_id,
                    model_id: model.id,
                    [variantFkField]: variantId,
                    colour_id: colour.id,
                    name: skuName,
                    color_name: colour.name,
                    hex_primary: colour.hex_primary || undefined,
                    hex_secondary: colour.hex_secondary || undefined,
                    finish: colour.finish || undefined,
                });
                onUpdate([...skus, newSku]);
                toast.success(`Added ${colour.name} to ${variant?.name || 'variant'}`);
            }
        } catch (err: unknown) {
            console.error('SKU toggle failed:', err);
            const msg = getErrorMessage(err) || 'Unknown error';
            toast.error(existingSku ? `Failed to remove SKU: ${msg}` : `Failed to create SKU: ${msg}`);
        } finally {
            setBusyCells(prev => {
                const next = new Set(prev);
                next.delete(cellKey);
                return next;
            });
        }
    };

    // ─── OEM SKU inline save ────────────────────────────────────────
    const handleSaveOemSku = async (sku: CatalogSku) => {
        try {
            const updated = await updateSku(sku.id, { oem_sku: oemDraft.trim() || null } as any);
            if (updated) {
                onUpdate(skus.map(s => (s.id === sku.id ? { ...updated, oem_sku: oemDraft.trim() || null } : s)));
                toast.success('OEM SKU saved');
            }
        } catch {
            toast.error('Failed to save OEM SKU');
        } finally {
            setEditingOemSku(null);
        }
    };

    // Toggle SKU status between ACTIVE and DRAFT
    const handleToggleStatus = async (sku: CatalogSku) => {
        const newStatus = sku.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
        try {
            const updated = await updateSku(sku.id, { status: newStatus });
            if (updated) {
                onUpdate(skus.map(s => (s.id === sku.id ? updated : s)));
                toast.success(`${sku.name} → ${newStatus}`);
            }
        } catch {
            toast.error('Failed to update status');
        }
    };

    // Toggle a SKU as primary for its variant
    const handleSetPrimary = async (sku: CatalogSku) => {
        const variantId = (sku as any)[variantFkField];
        const variantSkusList = skus.filter(s => (s as any)[variantFkField] === variantId);

        try {
            // If already primary, just unset it
            if (sku.is_primary) {
                const updated = await updateSku(sku.id, { is_primary: false });
                if (updated) {
                    onUpdate(skus.map(s => (s.id === sku.id ? updated : s)));
                    toast.success(`${sku.name} removed as primary`);
                }
                return;
            }

            // Otherwise, unset previous primary and set this one
            const prevPrimary = variantSkusList.find(s => s.is_primary && s.id !== sku.id);
            if (prevPrimary) {
                const unset = await updateSku(prevPrimary.id, { is_primary: false });
                if (unset) {
                    onUpdate(skus.map(s => (s.id === prevPrimary.id ? unset : s)));
                }
            }
            const updated = await updateSku(sku.id, { is_primary: true });
            if (updated) {
                onUpdate(skus.map(s => (s.id === sku.id ? updated : s)));
                toast.success(`${sku.name} set as primary`);
            }
        } catch {
            toast.error('Failed to set primary');
        }
    };

    // ─── Media save handler ──────────────────────────────────────────
    const handleMediaSave = async (
        images: string[],
        videos: string[],
        pdfs: string[],
        primary: string | null,
        _applyVideosToAll?: boolean,
        zoomFactor?: number,
        isFlipped?: boolean,
        offsetX?: number,
        offsetY?: number
    ) => {
        if (!activeMediaSku) return;

        try {
            const resolvedPrimary = primary || images[0] || null;
            // Map arrays → flat cat_skus columns
            const mediaUpdate: Partial<CatalogSku> = {
                primary_image: resolvedPrimary,
                gallery_img_1: images[0] || null,
                gallery_img_2: images[1] || null,
                gallery_img_3: images[2] || null,
                gallery_img_4: images[3] || null,
                gallery_img_5: images[4] || null,
                gallery_img_6: images[5] || null,
                video_url_1: videos[0] || null,
                video_url_2: videos[1] || null,
                pdf_url_1: pdfs[0] || null,
                zoom_factor: zoomFactor ?? 1.0,
                is_flipped: isFlipped ?? false,
                offset_x: offsetX ?? 0,
                offset_y: offsetY ?? 0,
                media_shared: true,
            };

            const updated = await updateSku(activeMediaSku.id, mediaUpdate);
            if (updated) {
                // Default behavior: keep same-colour SKUs in sync across variants unless a peer is explicitly unique.
                const sameColourPeers = skus.filter(
                    s => s.colour_id === activeMediaSku.colour_id && s.id !== activeMediaSku.id
                );
                const syncedPeers = await Promise.all(
                    sameColourPeers.map(async peer => {
                        const peerOwnImage =
                            peer.primary_image ||
                            peer.gallery_img_1 ||
                            peer.image_url ||
                            peer.specs?.primary_image ||
                            peer.specs?.gallery?.[0] ||
                            null;
                        const isUniqueLocked = peer.media_shared === false && !!peerOwnImage;
                        if (isUniqueLocked) return peer;
                        try {
                            const synced = await updateSku(peer.id, mediaUpdate);
                            return synced || ({ ...peer, ...mediaUpdate } as CatalogSku);
                        } catch {
                            return peer;
                        }
                    })
                );

                const peerMap = new Map(syncedPeers.map(s => [s.id, s]));
                onUpdate(
                    skus.map(s => {
                        if (s.id === activeMediaSku.id) return updated;
                        return peerMap.get(s.id) || s;
                    })
                );
                toast.success('Media saved');
            }
        } catch (err: unknown) {
            console.error('Media save failed:', err);
            toast.error('Failed to save media: ' + getErrorMessage(err));
        }
    };

    // ─── Copy media from a sibling SKU (same colour, different variant) ─────
    const handleCopyMediaFromSibling = async (targetSku: CatalogSku) => {
        // Find sibling SKUs with same colour that have an image
        const siblings = skus.filter(
            s => s.colour_id === targetSku.colour_id && s.id !== targetSku.id && s.primary_image
        );
        if (siblings.length === 0) {
            toast.error('No sibling with image found');
            return;
        }
        const donor = siblings[0];
        try {
            const mediaUpdate: Partial<CatalogSku> = {
                primary_image: donor.primary_image,
                gallery_img_1: donor.gallery_img_1,
                gallery_img_2: donor.gallery_img_2,
                gallery_img_3: donor.gallery_img_3,
                gallery_img_4: donor.gallery_img_4,
                gallery_img_5: donor.gallery_img_5,
                gallery_img_6: donor.gallery_img_6,
                zoom_factor: donor.zoom_factor,
                is_flipped: donor.is_flipped,
                offset_x: donor.offset_x,
                offset_y: donor.offset_y,
            };
            const updated = await updateSku(targetSku.id, mediaUpdate);
            if (updated) {
                onUpdate(skus.map(s => (s.id === targetSku.id ? updated : s)));
                toast.success('Image copied from sibling!');
            }
        } catch (err: unknown) {
            toast.error('Copy failed: ' + getErrorMessage(err));
        }
    };

    // Select/deselect all colours for a variant
    const handleToggleAllForVariant = async (variantId: string) => {
        if (productType !== 'ACCESSORY') {
            setFocusedVariantId(variantId);
        }
        const variant = variants.find((v: any) => v.id === variantId);
        const existingCount = sortedColours.filter(c => getSkuForCell(variantId, c.id)).length;
        const shouldAdd = existingCount < sortedColours.length;

        for (const colour of sortedColours) {
            const exists = !!getSkuForCell(variantId, colour.id);
            if (shouldAdd && !exists) {
                await handleToggleSku(variantId, colour);
            } else if (!shouldAdd && exists) {
                await handleToggleSku(variantId, colour);
            }
        }

        toast.success(
            shouldAdd ? `All colours added to ${variant?.name}` : `All colours removed from ${variant?.name}`
        );
    };

    // Select/deselect all variants for a colour
    const handleToggleAllForColour = async (colour: CatalogColour) => {
        if (productType !== 'ACCESSORY') {
            setFocusedColourId(colour.id);
        }
        const existingCount = variants.filter((v: any) => getSkuForCell(v.id, colour.id)).length;
        const shouldAdd = existingCount < variants.length;

        for (const variant of variants) {
            const exists = !!getSkuForCell(variant.id, colour.id);
            if (shouldAdd && !exists) {
                await handleToggleSku(variant.id, colour);
            } else if (!shouldAdd && exists) {
                await handleToggleSku(variant.id, colour);
            }
        }

        toast.success(shouldAdd ? `${colour.name} added to all variants` : `${colour.name} removed from all variants`);
    };

    // ─── Restore an orphaned SKU by re-creating its color ───────────
    const handleRestoreSku = async (sku: CatalogSku) => {
        if (!sku.color_name) {
            toast.error('Cannot restore: Color metadata missing in SKU');
            return;
        }

        try {
            // 1. Create the colour definition from SKU cache
            const newColour = await createColour({
                model_id: model.id,
                name: sku.color_name,
                hex_primary: sku.hex_primary || undefined,
                hex_secondary: sku.hex_secondary || undefined,
                finish: sku.finish || undefined,
            });

            // 2. Link SKU to this new colour
            const updatedSku = await updateSku(sku.id, { colour_id: newColour.id });

            // 3. Update parent states
            onUpdateColours([...colours, newColour]);
            onUpdate(skus.map(s => (s.id === sku.id ? updatedSku : s)));

            toast.success(`Restored ${sku.color_name} to the colour pool`);
        } catch (err) {
            console.error('Restore failed:', err);
            toast.error('Restore failed: ' + getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                    {model.name} — SKU Matrix
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Check colours per variant to create SKUs · Toggle active/draft · Set primary · Manage media
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                            <Layers size={18} className="text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{variants.length}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {labels.variant}s
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                            <Palette size={18} className="text-pink-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                {effectiveColours.length}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {labels.pool}s in Pool
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <Grid3X3 size={18} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{skus.length}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total SKUs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            {sortedColours.length > 0 && variants.length > 0 ? (
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5">
                                    <th className="text-left px-5 py-4 bg-slate-50/50 dark:bg-white/[0.02] sticky left-0 z-10">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            {productType === 'ACCESSORY'
                                                ? `${labels.variant} ↓ / ${labels.sku} →`
                                                : `${labels.sku} ↓ / ${labels.variant} →`}
                                        </span>
                                    </th>
                                    {/* Column headers: colours for ACCESSORY, variants for others */}
                                    {productType === 'ACCESSORY'
                                        ? sortedColours.map(colour => {
                                              const colourSkuCount = variants.filter((v: any) =>
                                                  getSkuForCell(v.id, colour.id)
                                              ).length;
                                              const allChecked = colourSkuCount === variants.length;
                                              return (
                                                  <th
                                                      key={colour.id}
                                                      className="px-3 py-4 text-center whitespace-nowrap"
                                                  >
                                                      <div className="flex flex-col items-center gap-1.5">
                                                          <span
                                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                                              style={
                                                                  colour.hex_primary
                                                                      ? {
                                                                            backgroundColor: colour.hex_primary + '18',
                                                                            borderLeft: `3px solid ${colour.hex_primary}`,
                                                                        }
                                                                      : { backgroundColor: 'rgb(241 245 249)' }
                                                              }
                                                          >
                                                              {colour.hex_primary && (
                                                                  <span
                                                                      className="w-3 h-3 rounded-full border border-white/50 shadow-sm inline-block flex-shrink-0"
                                                                      style={{ backgroundColor: colour.hex_primary }}
                                                                  />
                                                              )}
                                                              <span className="text-slate-600 dark:text-slate-300">
                                                                  {colour.name}
                                                              </span>
                                                          </span>
                                                          <button
                                                              onClick={() => handleToggleAllForColour(colour)}
                                                              className="text-[8px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors"
                                                              title={allChecked ? 'Deselect all' : 'Select all'}
                                                          >
                                                              {allChecked ? 'Clear All' : 'Select All'}
                                                          </button>
                                                      </div>
                                                  </th>
                                              );
                                          })
                                        : orderedVariants.map((variant: any) => {
                                              const variantSkuCount = orderedColours.filter(c =>
                                                  getSkuForCell(variant.id, c.id)
                                              ).length;
                                              const allChecked = variantSkuCount === orderedColours.length;
                                              const variantActiveSkus = skus.filter(
                                                  s =>
                                                      (s as any)[variantFkField] === variant.id && s.status === 'ACTIVE'
                                              );
                                              const primarySku =
                                                  variantActiveSkus.find(s => s.is_primary) || variantActiveSkus[0];
                                              const hex = primarySku ? getSkuSwatch(primarySku) : null;
                                              return (
                                                  <th
                                                      key={variant.id}
                                                      className="px-3 py-4 text-center whitespace-nowrap"
                                                  >
                                                      <div className="flex flex-col items-center gap-1.5">
                                                          <span
                                                              onClick={() => setFocusedVariantId(variant.id)}
                                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                                              style={
                                                                  hex
                                                                      ? {
                                                                            backgroundColor: hex + '18',
                                                                            borderLeft: `3px solid ${hex}`,
                                                                        }
                                                                      : { backgroundColor: 'rgb(241 245 249)' }
                                                              }
                                                          >
                                                              {hex && (
                                                                  <span
                                                                      className="w-3 h-3 rounded-full border border-white/50 shadow-sm inline-block flex-shrink-0"
                                                                      style={{ backgroundColor: hex }}
                                                                  />
                                                              )}
                                                              <span className="text-slate-600 dark:text-slate-300">
                                                                  {variant.name}
                                                              </span>
                                                          </span>
                                                          <button
                                                              onClick={() => handleToggleAllForVariant(variant.id)}
                                                              className="text-[8px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors"
                                                              title={allChecked ? 'Deselect all' : 'Select all'}
                                                          >
                                                              {allChecked ? 'Clear All' : 'Select All'}
                                                          </button>
                                                      </div>
                                                  </th>
                                              );
                                          })}
                                </tr>
                                {/* Sub-header: Brand / Model / Variant context row */}
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
                                    <th className="px-5 py-2 text-left sticky left-0 top-0 bg-slate-50/95 dark:bg-slate-900/95 z-30">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                                            Brand · Model · {labels.variant}
                                        </span>
                                    </th>
                                    {productType === 'ACCESSORY'
                                        ? sortedColours.map(colour => (
                                              <th
                                                  key={colour.id}
                                                  className="px-3 py-2 text-center sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-900/95"
                                              >
                                                  <div className="flex flex-col items-center gap-0.5">
                                                      {brandName && (
                                                          <span className="text-[7px] font-black uppercase tracking-widest text-indigo-400">
                                                              {brandName}
                                                          </span>
                                                      )}
                                                      <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
                                                          {model.name}
                                                      </span>
                                                      <span className="text-[7px] font-bold text-slate-300">
                                                          {colour.name}
                                                      </span>
                                                  </div>
                                              </th>
                                          ))
                                        : orderedVariants.map((variant: any) => (
                                              <th
                                                  key={variant.id}
                                                  className="px-3 py-2 text-center sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-900/95"
                                              >
                                                  <div className="flex flex-col items-center gap-0.5">
                                                      {brandName && (
                                                          <span className="text-[7px] font-black uppercase tracking-widest text-indigo-400">
                                                              {brandName}
                                                          </span>
                                                      )}
                                                      <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
                                                          {model.name}
                                                      </span>
                                                      <span className="text-[7px] font-bold text-slate-300">
                                                          {variant.name}
                                                      </span>
                                                  </div>
                                              </th>
                                          ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* For ACCESSORY: rows = variants (suitable fors), cols = colours (sub-variants)
                                    For others:    rows = colours, cols = variants */}
                                {productType === 'ACCESSORY'
                                    ? variants.map((variant: any) => {
                                          const variantsCheckedForRow = sortedColours.filter(c =>
                                              getSkuForCell(variant.id, c.id)
                                          );
                                          const allColoursChecked =
                                              variantsCheckedForRow.length === sortedColours.length;
                                          return (
                                              <tr
                                                  key={variant.id}
                                                  className="border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                                              >
                                                  <td className="px-5 py-3 sticky left-0 bg-white dark:bg-slate-900 z-10 min-w-[180px] max-w-[220px]">
                                                      <div className="flex items-center gap-2">
                                                          <span
                                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border flex-1 min-w-0"
                                                              style={{
                                                                  backgroundColor: 'rgb(241 245 249)',
                                                                  borderColor: 'rgb(226 232 240)',
                                                                  color: 'rgb(100 116 139)',
                                                              }}
                                                          >
                                                              <span className="break-words leading-tight">
                                                                  {variant.name}
                                                              </span>
                                                          </span>
                                                          <button
                                                              onClick={() => handleToggleAllForVariant(variant.id)}
                                                              title={
                                                                  allColoursChecked
                                                                      ? 'Remove all sub-variants'
                                                                      : 'Add all sub-variants'
                                                              }
                                                              className="flex-shrink-0"
                                                          >
                                                              <div
                                                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                                                      allColoursChecked
                                                                          ? 'bg-indigo-500 border-indigo-500'
                                                                          : variantsCheckedForRow.length > 0
                                                                            ? 'bg-indigo-200 border-indigo-400'
                                                                            : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600'
                                                                  }`}
                                                              >
                                                                  {allColoursChecked && (
                                                                      <svg
                                                                          className="w-2.5 h-2.5 text-white"
                                                                          fill="none"
                                                                          viewBox="0 0 24 24"
                                                                          stroke="currentColor"
                                                                          strokeWidth={3}
                                                                      >
                                                                          <path
                                                                              strokeLinecap="round"
                                                                              strokeLinejoin="round"
                                                                              d="M5 13l4 4L19 7"
                                                                          />
                                                                      </svg>
                                                                  )}
                                                                  {!allColoursChecked &&
                                                                      variantsCheckedForRow.length > 0 && (
                                                                          <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                                                                      )}
                                                              </div>
                                                          </button>
                                                      </div>
                                                  </td>
                                                  {sortedColours.map(colour => {
                                                      const sku = getSkuForCell(variant.id, colour.id);
                                                      const cellKey = `${variant.id}-${colour.id}`;
                                                      const isBusy = busyCells.has(cellKey);
                                                      return (
                                                          <td key={cellKey} className="px-3 py-3 text-center">
                                                              <div className="flex flex-col items-center justify-center gap-1.5">
                                                                  <div className="flex items-center justify-center gap-1.5">
                                                                      {isBusy ? (
                                                                          <Loader2
                                                                              size={14}
                                                                              className="animate-spin text-indigo-400"
                                                                          />
                                                                      ) : (
                                                                          <>
                                                                              <button
                                                                                  onClick={() =>
                                                                                      handleToggleSku(
                                                                                          variant.id,
                                                                                          colour
                                                                                      )
                                                                                  }
                                                                                  title={
                                                                                      sku ? 'Remove SKU' : 'Create SKU'
                                                                                  }
                                                                                  className="transition-all"
                                                                              >
                                                                                  <div
                                                                                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                                                          sku
                                                                                              ? sku.status === 'ACTIVE'
                                                                                                  ? 'bg-emerald-500 border-emerald-500'
                                                                                                  : 'bg-amber-400 border-amber-400'
                                                                                              : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-600 hover:border-indigo-400'
                                                                                      }`}
                                                                                  >
                                                                                      {sku ? (
                                                                                          <X
                                                                                              className="w-3 h-3 text-white"
                                                                                              strokeWidth={3}
                                                                                          />
                                                                                      ) : (
                                                                                          <div className="w-2 h-2 rounded-full bg-slate-100 opacity-0 group-hover:opacity-100" />
                                                                                      )}
                                                                                  </div>
                                                                              </button>
                                                                              {sku && (
                                                                                  <>
                                                                                      <button
                                                                                          onClick={() =>
                                                                                              handleToggleStatus(sku)
                                                                                          }
                                                                                          title={
                                                                                              sku.status === 'ACTIVE'
                                                                                                  ? 'Set DRAFT'
                                                                                                  : 'Set ACTIVE'
                                                                                          }
                                                                                          className="transition-all"
                                                                                      >
                                                                                          <span
                                                                                              className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase ${sku.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                                                                                          >
                                                                                              {sku.status === 'ACTIVE'
                                                                                                  ? 'ON'
                                                                                                  : 'OFF'}
                                                                                          </span>
                                                                                      </button>
                                                                                      <button
                                                                                          onClick={() =>
                                                                                              handleSetPrimary(sku)
                                                                                          }
                                                                                          title={
                                                                                              sku.is_primary
                                                                                                  ? 'Primary'
                                                                                                  : 'Set as primary'
                                                                                          }
                                                                                          className="transition-all"
                                                                                      >
                                                                                          <Star
                                                                                              size={12}
                                                                                              className={
                                                                                                  sku.is_primary
                                                                                                      ? 'text-amber-400 fill-amber-400'
                                                                                                      : 'text-slate-300 hover:text-amber-400'
                                                                                              }
                                                                                          />
                                                                                      </button>
                                                                                  </>
                                                                              )}
                                                                          </>
                                                                      )}
                                                                  </div>
                                                                  {sku && (
                                                                      <div className="flex flex-col items-center gap-1">
                                                                          <div className="flex items-center gap-0.5">
                                                                              <button
                                                                                  onClick={() => setActiveMediaSku(sku)}
                                                                                  className="p-1 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                                                  title={
                                                                                      resolveSkuImage(sku).inherited
                                                                                          ? 'Shared media shown. Click to upload unique media for this SKU.'
                                                                                          : 'Manage media'
                                                                                  }
                                                                              >
                                                                                  {(() => {
                                                                                      const img = resolveSkuImage(sku);
                                                                                      return img.url ? (
                                                                                          <div className="relative">
                                                                                              <img
                                                                                                  src={getProxiedUrl(
                                                                                                      img.url
                                                                                                  )}
                                                                                                  alt=""
                                                                                                  className={`w-5 h-5 rounded object-cover ${img.inherited ? 'opacity-70' : ''}`}
                                                                                              />
                                                                                              {img.inherited && (
                                                                                                  <span
                                                                                                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 text-white text-[6px] font-black flex items-center justify-center"
                                                                                                      title={`From ${img.source === 'C' ? 'Colour' : img.source === 'V' ? 'Variant' : 'Model'}`}
                                                                                                  >
                                                                                                      {img.source}
                                                                                                  </span>
                                                                                              )}
                                                                                          </div>
                                                                                      ) : (
                                                                                          <ImageIcon
                                                                                              size={12}
                                                                                              className="text-slate-300"
                                                                                          />
                                                                                      );
                                                                                  })()}
                                                                              </button>
                                                                              {!sku.primary_image &&
                                                                                  skus.some(
                                                                                      s =>
                                                                                          s.colour_id ===
                                                                                              sku.colour_id &&
                                                                                          s.id !== sku.id &&
                                                                                          s.primary_image
                                                                                  ) && (
                                                                                      <button
                                                                                          onClick={e => {
                                                                                              e.stopPropagation();
                                                                                              handleCopyMediaFromSibling(
                                                                                                  sku
                                                                                              );
                                                                                          }}
                                                                                          className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                                                                          title="Copy image from sibling"
                                                                                      >
                                                                                          <Copy
                                                                                              size={10}
                                                                                              className="text-indigo-500"
                                                                                          />
                                                                                      </button>
                                                                                  )}
                                                                          </div>
                                                                          {(() => {
                                                                              const mediaStatus =
                                                                                  getSkuMediaStatus(sku);
                                                                              return (
                                                                                  <div className="flex items-center gap-1">
                                                                                      <span
                                                                                          className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider ${
                                                                                              mediaStatus.kind ===
                                                                                              'shared'
                                                                                                  ? 'bg-indigo-100 text-indigo-700'
                                                                                                  : 'bg-emerald-100 text-emerald-700'
                                                                                          }`}
                                                                                          title={
                                                                                              mediaStatus.kind ===
                                                                                              'shared'
                                                                                                  ? `Shared from ${
                                                                                                        mediaStatus.source ===
                                                                                                        'C'
                                                                                                            ? 'Colour'
                                                                                                            : mediaStatus.source ===
                                                                                                                'V'
                                                                                                              ? 'Variant'
                                                                                                              : mediaStatus.source ===
                                                                                                                  'M'
                                                                                                                ? 'Model'
                                                                                                                : 'Sibling SKU'
                                                                                                    }`
                                                                                                  : 'Uploaded directly on this SKU'
                                                                                          }
                                                                                      >
                                                                                          {mediaStatus.kind === 'shared'
                                                                                              ? `Shared-${mediaStatus.source || 'S'}`
                                                                                              : 'Uploaded'}
                                                                                      </span>
                                                                                      {sku.is_primary && (
                                                                                          <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
                                                                                              Primary
                                                                                          </span>
                                                                                      )}
                                                                                  </div>
                                                                              );
                                                                          })()}
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          </td>
                                                      );
                                                  })}
                                              </tr>
                                          );
                                      })
                                    : orderedColours.map(colour => {
                                          const coloursForRow = orderedVariants.filter((v: any) =>
                                              getSkuForCell(v.id, colour.id)
                                          );
                                          const allVariantsChecked = coloursForRow.length === orderedVariants.length;

                                          return (
                                              <tr
                                                  key={colour.id}
                                                  className="border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                                              >
                                                  <td className="px-5 py-3 sticky left-0 bg-white dark:bg-slate-900 z-10 min-w-[180px] max-w-[220px]">
                                                      <div className="flex items-center gap-2">
                                                          <span
                                                              onClick={() => setFocusedColourId(colour.id)}
                                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border flex-1 min-w-0"
                                                              style={
                                                                  colour.hex_primary
                                                                      ? {
                                                                            backgroundColor: colour.hex_primary + '12',
                                                                            borderColor: colour.hex_primary + '30',
                                                                            color: colour.hex_primary,
                                                                        }
                                                                      : {
                                                                            backgroundColor: 'rgb(241 245 249)',
                                                                            borderColor: 'rgb(226 232 240)',
                                                                            color: 'rgb(100 116 139)',
                                                                        }
                                                              }
                                                          >
                                                              {colour.hex_primary && (
                                                                  <span
                                                                      className="w-3 h-3 rounded-full border border-white/50 shadow-sm inline-block flex-shrink-0"
                                                                      style={{ backgroundColor: colour.hex_primary }}
                                                                  />
                                                              )}
                                                              <span className="break-words leading-tight">
                                                                  {colour.name}
                                                              </span>
                                                          </span>
                                                          <button
                                                              onClick={() => handleToggleAllForColour(colour)}
                                                              title={
                                                                  allVariantsChecked
                                                                      ? 'Remove from all variants'
                                                                      : 'Add to all variants'
                                                              }
                                                              className="flex-shrink-0"
                                                          >
                                                              <div
                                                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                                                      allVariantsChecked
                                                                          ? 'bg-indigo-500 border-indigo-500'
                                                                          : coloursForRow.length > 0
                                                                            ? 'bg-indigo-200 border-indigo-400'
                                                                            : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600'
                                                                  }`}
                                                              >
                                                                  {allVariantsChecked && (
                                                                      <svg
                                                                          className="w-2.5 h-2.5 text-white"
                                                                          fill="none"
                                                                          viewBox="0 0 24 24"
                                                                          stroke="currentColor"
                                                                          strokeWidth={3}
                                                                      >
                                                                          <path
                                                                              strokeLinecap="round"
                                                                              strokeLinejoin="round"
                                                                              d="M5 13l4 4L19 7"
                                                                          />
                                                                      </svg>
                                                                  )}
                                                                  {!allVariantsChecked && coloursForRow.length > 0 && (
                                                                      <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                                                                  )}
                                                              </div>
                                                          </button>
                                                      </div>
                                                  </td>
                                                  {orderedVariants.map((variant: any) => {
                                                      const sku = getSkuForCell(variant.id, colour.id);
                                                      const cellKey = `${variant.id}-${colour.id}`;
                                                      const isBusy = busyCells.has(cellKey);

                                                      return (
                                                          <td key={cellKey} className="px-3 py-3 text-center">
                                                              <div className="flex flex-col items-center justify-center gap-1.5">
                                                                  {/* Row 1: Checkbox + Status + Primary */}
                                                                  <div className="flex items-center justify-center gap-1.5">
                                                                      {isBusy ? (
                                                                          <Loader2
                                                                              size={14}
                                                                              className="animate-spin text-indigo-400"
                                                                          />
                                                                      ) : (
                                                                          <>
                                                                              {/* Main checkbox — toggles SKU existence */}
                                                                              <button
                                                                                  onClick={() =>
                                                                                      handleToggleSku(
                                                                                          variant.id,
                                                                                          colour
                                                                                      )
                                                                                  }
                                                                                  title={
                                                                                      sku ? 'Remove SKU' : 'Create SKU'
                                                                                  }
                                                                                  className="transition-all"
                                                                              >
                                                                                  <div
                                                                                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                                                          sku
                                                                                              ? sku.status === 'ACTIVE'
                                                                                                  ? 'bg-emerald-500 border-emerald-500'
                                                                                                  : 'bg-amber-400 border-amber-400'
                                                                                              : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-600 hover:border-indigo-400'
                                                                                      }`}
                                                                                  >
                                                                                      {sku ? (
                                                                                          <X
                                                                                              className="w-3 h-3 text-white"
                                                                                              strokeWidth={3}
                                                                                          />
                                                                                      ) : (
                                                                                          <div className="w-2 h-2 rounded-full bg-slate-100 opacity-0 group-hover:opacity-100" />
                                                                                      )}
                                                                                  </div>
                                                                              </button>

                                                                              {/* Status toggle + Primary — only visible if SKU exists */}
                                                                              {sku && (
                                                                                  <>
                                                                                      <button
                                                                                          onClick={() =>
                                                                                              handleToggleStatus(sku)
                                                                                          }
                                                                                          title={
                                                                                              sku.status === 'ACTIVE'
                                                                                                  ? 'Set DRAFT'
                                                                                                  : 'Set ACTIVE'
                                                                                          }
                                                                                          className="transition-all"
                                                                                      >
                                                                                          <span
                                                                                              className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                                                                                                  sku.status ===
                                                                                                  'ACTIVE'
                                                                                                      ? 'bg-emerald-100 text-emerald-700'
                                                                                                      : 'bg-amber-100 text-amber-700'
                                                                                              }`}
                                                                                          >
                                                                                              {sku.status === 'ACTIVE'
                                                                                                  ? 'ON'
                                                                                                  : 'OFF'}
                                                                                          </span>
                                                                                      </button>
                                                                                      <button
                                                                                          onClick={() =>
                                                                                              handleSetPrimary(sku)
                                                                                          }
                                                                                          title={
                                                                                              sku.is_primary
                                                                                                  ? 'Primary colour'
                                                                                                  : 'Set as primary'
                                                                                          }
                                                                                          className="transition-all"
                                                                                      >
                                                                                          <Star
                                                                                              size={12}
                                                                                              className={
                                                                                                  sku.is_primary
                                                                                                      ? 'text-amber-400 fill-amber-400'
                                                                                                      : 'text-slate-200 hover:text-amber-300'
                                                                                              }
                                                                                          />
                                                                                      </button>
                                                                                  </>
                                                                              )}
                                                                          </>
                                                                      )}
                                                                  </div>

                                                                  {/* Row 2: Media thumbnail — only visible if SKU exists */}
                                                                  {sku && (
                                                                      <div className="flex flex-col items-center gap-1">
                                                                          <button
                                                                              onClick={() => setActiveMediaSku(sku)}
                                                                              className={`w-10 h-10 rounded-lg border transition-all overflow-hidden flex items-center justify-center group/media relative ${
                                                                                  resolveSkuImage(sku).url
                                                                                      ? 'border-indigo-500/30 hover:border-indigo-500'
                                                                                      : 'bg-slate-50 dark:bg-black/40 border-dashed border-slate-200 dark:border-white/10 text-slate-300 hover:text-indigo-500 hover:border-indigo-400'
                                                                              }`}
                                                                              title={
                                                                                  resolveSkuImage(sku).inherited
                                                                                      ? 'Shared media shown. Click to upload unique media for this SKU.'
                                                                                      : 'Manage Media'
                                                                              }
                                                                          >
                                                                              {(() => {
                                                                                  const img = resolveSkuImage(sku);
                                                                                  return img.url ? (
                                                                                      <>
                                                                                          <img
                                                                                              src={getProxiedUrl(
                                                                                                  img.url
                                                                                              )}
                                                                                              className={`w-full h-full object-contain p-0.5 group-hover/media:scale-110 transition-transform duration-300 ${img.inherited ? 'opacity-70' : ''}`}
                                                                                              alt={sku.name}
                                                                                          />
                                                                                          <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                                              <Upload
                                                                                                  size={14}
                                                                                                  strokeWidth={3}
                                                                                              />
                                                                                          </div>
                                                                                          {img.inherited && (
                                                                                              <span
                                                                                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[6px] font-black flex items-center justify-center shadow"
                                                                                                  title={`From ${img.source === 'C' ? 'Colour' : img.source === 'V' ? 'Variant' : 'Model'}`}
                                                                                              >
                                                                                                  {img.source}
                                                                                              </span>
                                                                                          )}
                                                                                      </>
                                                                                  ) : (
                                                                                      <ImageIcon
                                                                                          size={14}
                                                                                          strokeWidth={1.5}
                                                                                      />
                                                                                  );
                                                                              })()}
                                                                          </button>
                                                                          {(() => {
                                                                              const mediaStatus =
                                                                                  getSkuMediaStatus(sku);
                                                                              return (
                                                                                  <div className="flex items-center gap-1">
                                                                                      <span
                                                                                          className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider ${
                                                                                              mediaStatus.kind ===
                                                                                              'shared'
                                                                                                  ? 'bg-indigo-100 text-indigo-700'
                                                                                                  : 'bg-emerald-100 text-emerald-700'
                                                                                          }`}
                                                                                          title={
                                                                                              mediaStatus.kind ===
                                                                                              'shared'
                                                                                                  ? `Shared from ${
                                                                                                        mediaStatus.source ===
                                                                                                        'C'
                                                                                                            ? 'Colour'
                                                                                                            : mediaStatus.source ===
                                                                                                                'V'
                                                                                                              ? 'Variant'
                                                                                                              : mediaStatus.source ===
                                                                                                                  'M'
                                                                                                                ? 'Model'
                                                                                                                : 'Sibling SKU'
                                                                                                    }`
                                                                                                  : 'Uploaded directly on this SKU'
                                                                                          }
                                                                                      >
                                                                                          {mediaStatus.kind === 'shared'
                                                                                              ? `Shared-${mediaStatus.source || 'S'}`
                                                                                              : 'Uploaded'}
                                                                                      </span>
                                                                                      {sku.is_primary && (
                                                                                          <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
                                                                                              Primary
                                                                                          </span>
                                                                                      )}
                                                                                  </div>
                                                                              );
                                                                          })()}
                                                                      </div>
                                                                  )}

                                                                  {/* Row 3: SKU Code + OEM SKU */}
                                                                  {sku && (
                                                                      <div className="flex flex-col items-center gap-0.5 w-full">
                                                                          {/* 9-char SKU Code badge */}
                                                                          {sku.sku_code && (
                                                                              <span className="font-mono text-[7px] font-black tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                                                                  {sku.sku_code}
                                                                              </span>
                                                                          )}
                                                                          {/* OEM SKU inline edit */}
                                                                          {editingOemSku === sku.id ? (
                                                                              <div className="flex items-center gap-0.5">
                                                                                  <input
                                                                                      autoFocus
                                                                                      value={oemDraft}
                                                                                      onChange={e =>
                                                                                          setOemDraft(e.target.value)
                                                                                      }
                                                                                      onKeyDown={e => {
                                                                                          if (e.key === 'Enter')
                                                                                              handleSaveOemSku(sku);
                                                                                          if (e.key === 'Escape')
                                                                                              setEditingOemSku(null);
                                                                                      }}
                                                                                      placeholder="OEM code"
                                                                                      className="w-16 text-[7px] font-mono border border-indigo-300 rounded px-1 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                                                                                  />
                                                                                  <button
                                                                                      onClick={() =>
                                                                                          handleSaveOemSku(sku)
                                                                                      }
                                                                                      className="text-[7px] font-black text-emerald-600 hover:text-emerald-700 px-1"
                                                                                  >
                                                                                      ✓
                                                                                  </button>
                                                                              </div>
                                                                          ) : (
                                                                              <button
                                                                                  onClick={() => {
                                                                                      setEditingOemSku(sku.id);
                                                                                      setOemDraft(
                                                                                          (sku as any).oem_sku || ''
                                                                                      );
                                                                                  }}
                                                                                  title="Set OEM SKU"
                                                                                  className="text-[7px] font-mono text-slate-300 dark:text-slate-600 hover:text-indigo-500 transition-colors truncate max-w-[70px]"
                                                                              >
                                                                                  {(sku as any).oem_sku || '+ OEM'}
                                                                              </button>
                                                                          )}
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          </td>
                                                      );
                                                  })}
                                              </tr>
                                          );
                                      })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-slate-400">
                    <Grid3X3 size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold text-sm">
                        {effectiveColours.length === 0 && variants.length === 0
                            ? `Add ${labels.variant.toLowerCase()}s and ${poolLabel.toLowerCase()}s first`
                            : effectiveColours.length === 0
                              ? `Add ${poolLabel.toLowerCase()}s in the ${labels.pool} step first`
                              : `Add ${labels.variant.toLowerCase()}s in the ${labels.variant} step first`}
                    </p>
                    <p className="text-xs mt-1">
                        The matrix will appear once both {labels.variant.toLowerCase()}s and {poolLabel.toLowerCase()}s
                        are defined
                    </p>
                </div>
            )}

            {/* ─── Orphaned SKUs (Cleanup) ─── */}
            {skus.some(s => !effectiveColours.some(c => c.id === s.colour_id)) && (
                <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 p-6 space-y-4 shadow-sm border-dashed">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl">
                                <Trash2 className="text-rose-600 dark:text-rose-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight text-rose-900 dark:text-rose-400">
                                    Orphaned SKUs Found
                                </h3>
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-0.5 opacity-70">
                                    SKUs without a valid colour in the current pool
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-rose-600 dark:text-rose-500/80 italic leading-relaxed">
                        These SKUs exist in the database but are hidden from the matrix because their associated colour
                        was removed. Do you want to <strong>Restore</strong> the colour pool or <strong>Purge</strong>{' '}
                        them permanently?
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {skus
                            .filter(s => !effectiveColours.some(c => c.id === s.colour_id))
                            .map(sku => (
                                <div
                                    key={sku.id}
                                    className="flex items-center justify-between bg-white dark:bg-black/20 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm"
                                >
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <span className="text-[11px] font-black text-rose-800 dark:text-rose-400 truncate uppercase tracking-tight">
                                            {sku.name}
                                        </span>
                                        <span className="text-[9px] font-bold text-rose-400 dark:text-rose-500/60 uppercase tracking-widest">
                                            {sku.color_name || 'Legacy SKU'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={() => handleRestoreSku(sku)}
                                            className="px-3 py-1.5 bg-rose-100 hover:bg-emerald-500 hover:text-white dark:bg-rose-900/20 text-rose-600 transition-all rounded-lg flex items-center gap-1.5 group"
                                            title="Restore Color definition"
                                        >
                                            <RefreshCcw
                                                size={12}
                                                className="group-hover:rotate-180 transition-transform duration-500"
                                            />
                                            <span className="text-[9px] font-black uppercase">Restore</span>
                                        </button>

                                        <button
                                            onClick={async () => {
                                                if (
                                                    confirm(
                                                        `PERMANENTLY DELETE SKU "${sku.name}"? This cannot be undone.`
                                                    )
                                                ) {
                                                    try {
                                                        await deleteSku(sku.id);
                                                        onUpdate(skus.filter(s => s.id !== sku.id));
                                                        toast.success('SKU Purged');
                                                    } catch {
                                                        toast.error('Purge failed');
                                                    }
                                                }
                                            }}
                                            className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all rounded-lg"
                                            title="Delete permanently"
                                        >
                                            <TrashIcon size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* ─── SKU Media Manager (Full-Screen Overlay) ─── */}
            {activeMediaSku && (
                <SKUMediaManager
                    skuName={activeMediaSku.name}
                    skuContext={`Variant: ${
                        variants.find(
                            (v: any) =>
                                v.id ===
                                (activeMediaSku.vehicle_variant_id ||
                                    activeMediaSku.accessory_variant_id ||
                                    activeMediaSku.service_variant_id)
                        )?.name || 'Unknown'
                    } · Colour: ${colours.find(c => c.id === activeMediaSku.colour_id)?.name || activeMediaSku.color_name || 'Unknown'}`}
                    initialImages={skuToGalleryArray(activeMediaSku)}
                    initialVideos={skuToVideoArray(activeMediaSku)}
                    initialPdfs={skuToPdfArray(activeMediaSku)}
                    initialPrimary={activeMediaSku.primary_image}
                    initialZoomFactor={activeMediaSku.zoom_factor || 1.0}
                    initialIsFlipped={activeMediaSku.is_flipped || false}
                    initialOffsetX={activeMediaSku.offset_x || 0}
                    initialOffsetY={activeMediaSku.offset_y || 0}
                    onSave={handleMediaSave}
                    onClose={() => setActiveMediaSku(null)}
                />
            )}
        </div>
    );
}
