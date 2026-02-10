'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Palette,
    Trash2,
    Zap,
    LayoutGrid,
    List,
    Image as ImageIcon,
    Video,
    X,
    Check,
    Plus,
    FileText,
    Edit2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import SearchableInput from '../components/SearchableInput';
import AddColorModal from '../components/AddColorModal';
import EditColorModal from '../components/EditColorModal';
import ImageColorPicker from '../components/ImageColorPicker';
import SKUMediaManager from '@/components/catalog/SKUMediaManager';
import { getProxiedUrl } from '@/lib/utils/urlHelper';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

export default function UnitStep({ family, existingColors, onUpdate }: any) {
    const [isSaving, setIsSaving] = useState(false);
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [activeColorId, setActiveColorId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'primary' | 'secondary'>('primary');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingColor, setEditingColor] = useState<any>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [colorToDelete, setColorToDelete] = useState<any>(null);

    // Live Preview States
    const [tempPrimary, setTempPrimary] = useState<string | null>(null);
    const [tempSecondary, setTempSecondary] = useState<string | null>(null);
    const [hoveredColor, setHoveredColor] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
    const [isReorderSaving, setIsReorderSaving] = useState(false);
    const [showReorderSaved, setShowReorderSaved] = useState(false);
    const reorderSavedTimeoutRef = useRef<number | null>(null);

    const l2Label = 'Unit';
    const category = family?.category || 'VEHICLE';
    const unitPlaceholder =
        category === 'SERVICE'
            ? 'e.g. Standard, Premium'
            : category === 'ACCESSORY'
              ? 'e.g. Stainless Steel, Large'
              : 'e.g. Matte Black, Pearl White';
    const showDebug = process.env.NEXT_PUBLIC_DEBUG_CATALOG === 'true';

    useEffect(() => {
        return () => {
            if (reorderSavedTimeoutRef.current) {
                window.clearTimeout(reorderSavedTimeoutRef.current);
            }
        };
    }, []);

    const handleEditColor = async (id: string, newName: string, newStatus: string, newFinish: string) => {
        const normalizedName = newName.trim().toUpperCase();
        if (!normalizedName) {
            toast.error(`${l2Label} name is required`);
            return;
        }
        const isDuplicate = existingColors.some((c: any) => c.id !== id && c.name.toUpperCase() === normalizedName);
        if (isDuplicate) {
            toast.error(`${l2Label} already exists`);
            return;
        }
        setIsSaving(true);
        try {
            const supabase = createClient();
            const updatedList = existingColors.map((c: any) =>
                c.id === id
                    ? {
                          ...c,
                          name: normalizedName,
                          status: newStatus,
                          specs: { ...c.specs, [l2Label]: normalizedName, Finish: newFinish },
                      }
                    : c
            );
            onUpdate(updatedList);

            const newSlug = `${family.slug}-color-${normalizedName.toLowerCase()}`.replace(/ /g, '-');
            const { error } = await supabase
                .from('cat_items')
                .update({
                    name: normalizedName,
                    slug: newSlug,
                    status: newStatus,
                    specs: {
                        ...existingColors.find((c: any) => c.id === id).specs,
                        [l2Label]: normalizedName,
                        Finish: newFinish,
                    },
                })
                .eq('id', id);

            if (error) throw error;
            toast.success(`${l2Label} updated successfully`);
        } catch (error: unknown) {
            console.error('Update failed:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to update ${l2Label.toLowerCase()}: ` + message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddColor = async (name: string, finish: string) => {
        const normalizedName = name.trim().toUpperCase();
        if (!normalizedName) {
            toast.error(`${l2Label} name is required`);
            return;
        }
        const exists = existingColors.some((c: any) => c.name.toUpperCase() === normalizedName);
        if (exists) {
            toast.error(`${l2Label} already exists`);
            return;
        }
        setIsSaving(true);
        try {
            const supabase = createClient();
            const validPositions = existingColors.map((c: any) => parseInt(c.position)).filter((p: any) => !isNaN(p));
            const nextPosition = validPositions.length > 0 ? Math.max(...validPositions) + 1 : 1;

            const payload = {
                name: normalizedName,
                specs: {
                    [l2Label]: normalizedName,
                    Finish: finish,
                    gallery: [],
                    video_urls: [],
                    primary_image: null,
                    hex_primary: '#000000',
                    hex_secondary: null,
                },
                type: 'UNIT',
                status: 'ACTIVE', // SOT: Default to ACTIVE - AUMS needs active SKUs for pricing
                brand_id: family.brand_id,
                category: family.category || 'VEHICLE',
                parent_id: family.id,
                slug: `${family.slug}-color-${normalizedName.toLowerCase()}`.replace(/ /g, '-'),
                position: nextPosition,
            };

            const { data, error: dbError } = await supabase
                .from('cat_items')
                .upsert(payload, { onConflict: 'slug' })
                .select()
                .single();

            if (dbError) throw dbError;

            const isDuplicate = existingColors.some((c: any) => c.slug === data.slug);
            if (!isDuplicate) {
                onUpdate([...existingColors, data].sort((a: any, b: any) => a.position - b.position));
            } else {
                onUpdate(
                    existingColors
                        .map((c: any) => (c.slug === data.slug ? data : c))
                        .sort((a: any, b: any) => a.position - b.position)
                );
            }
            toast.success(`${l2Label} added successfully`);
        } catch (error: unknown) {
            console.error('Add failed:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            setError(message);
            toast.error(`Failed to add ${l2Label.toLowerCase()}: ` + message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePosition = async (colorId: string, newPos: number) => {
        const val = parseInt(newPos.toString());
        if (isNaN(val)) return;

        const previousList = [...existingColors];
        const sorted = [...existingColors].sort((a: any, b: any) => a.position - b.position);
        const currentIndex = sorted.findIndex((c: any) => c.id === colorId);
        if (currentIndex === -1) return;

        const [movedItem] = sorted.splice(currentIndex, 1);
        const targetIndex = Math.max(0, Math.min(val - 1, sorted.length));
        if (currentIndex === targetIndex) return;
        sorted.splice(targetIndex, 0, movedItem);

        const updatedList = sorted.map((c: any, idx: number) => ({
            ...c,
            position: idx + 1,
        }));

        onUpdate(updatedList);

        const supabase = createClient();
        try {
            setIsReorderSaving(true);
            await Promise.all(
                updatedList.map((item: any) =>
                    supabase.from('cat_items').update({ position: item.position }).eq('id', item.id)
                )
            );
            setShowReorderSaved(true);
            if (reorderSavedTimeoutRef.current) {
                window.clearTimeout(reorderSavedTimeoutRef.current);
            }
            reorderSavedTimeoutRef.current = window.setTimeout(() => {
                setShowReorderSaved(false);
            }, 1200);
        } catch (error: any) {
            console.error('Reorder failed', error);
            onUpdate(previousList);
            toast.error('Failed to save order');
        } finally {
            setIsReorderSaving(false);
        }
    };

    const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (existingColors.length === 0) return;
        if (focusedIndex === null) return;
        let nextIndex = focusedIndex;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = focusedIndex + 1;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = focusedIndex - 1;
        if (nextIndex !== focusedIndex) {
            event.preventDefault();
            nextIndex = Math.max(0, Math.min(existingColors.length - 1, nextIndex));
            setFocusedIndex(nextIndex);
            cardRefs.current[nextIndex]?.focus();
            return;
        }
        if (event.key === 'Enter' && focusedIndex >= 0) {
            event.preventDefault();
            const color = existingColors[focusedIndex];
            if (color) {
                setActiveColorId(color.id);
                setMediaModalOpen(true);
            }
        }
    };

    const activeColor = existingColors.find((c: any) => c.id === activeColorId);

    const openSmartPicker = (color: any) => {
        setActiveColorId(color.id);
        setTempPrimary(color.specs.hex_primary || '#000000');
        setTempSecondary(color.specs.hex_secondary || null);
        setPickerOpen(true);
        setHoveredColor(null);
    };

    const saveSmartColor = async () => {
        if (!activeColorId) return;
        try {
            const updatedList = existingColors.map((c: any) => {
                if (c.id === activeColorId) {
                    const newSpecs = { ...c.specs, hex_primary: tempPrimary, hex_secondary: tempSecondary };
                    return { ...c, specs: newSpecs };
                }
                return c;
            });
            onUpdate(updatedList);
            const supabase = createClient();
            const color = existingColors.find((c: any) => c.id === activeColorId);
            const newSpecs = { ...color.specs, hex_primary: tempPrimary, hex_secondary: tempSecondary };
            const { error } = await supabase.from('cat_items').update({ specs: newSpecs }).eq('id', activeColorId);

            if (error) throw error;
            toast.success('Color hex updated');
            setPickerOpen(false);
        } catch (error: unknown) {
            console.error('Hex update failed:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Failed to update hex: ' + message);
        }
    };

    const handleSaveMedia = async (
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
        if (!activeColorId) {
            return;
        }

        try {
            const updatedList = existingColors.map((c: any) => {
                if (c.id === activeColorId) {
                    return {
                        ...c,
                        specs: {
                            ...c.specs,
                            gallery: images,
                            video_urls: videos,
                            pdf_urls: pdfs,
                            primary_image: primary,
                        },
                    };
                }
                if (applyVideosToAll) {
                    return { ...c, specs: { ...c.specs, video_urls: videos, pdf_urls: pdfs } };
                }
                return c;
            });

            onUpdate(updatedList);
            const supabase = createClient();

            // 1. Prepare assets payload
            const assetsPayload: any[] = [];

            // Add images
            images.forEach((url, idx) => {
                assetsPayload.push({
                    item_id: activeColorId,
                    type: 'IMAGE',
                    url,
                    is_primary: url === primary,
                    zoom_factor: zoomFactor || 1.1,
                    position: idx,
                });
            });

            // Add videos
            videos.forEach((url, idx) => {
                assetsPayload.push({
                    item_id: activeColorId,
                    type: 'VIDEO',
                    url,
                    position: idx,
                });
            });

            // Add PDFs
            pdfs.forEach((url, idx) => {
                assetsPayload.push({
                    item_id: activeColorId,
                    type: 'PDF',
                    url,
                    position: idx,
                });
            });

            if (applyVideosToAll) {
                // Update cat_items for all colors (specs)
                const updatePromises = updatedList.map((item: any) =>
                    supabase.from('cat_items').update({ specs: item.specs }).eq('id', item.id)
                );
                await Promise.all(updatePromises);

                // Update assets for the active color
                await supabase.from('cat_assets').delete().eq('item_id', activeColorId);
                if (assetsPayload.length > 0) {
                    const { error } = await supabase.from('cat_assets').insert(assetsPayload);
                    if (error) throw error;
                }
            } else {
                const updatedColor = updatedList.find((c: any) => c.id === activeColorId);

                // Update cat_items
                const { error: itemError } = await supabase
                    .from('cat_items')
                    .update({
                        specs: updatedColor.specs,
                        zoom_factor: zoomFactor,
                    })
                    .eq('id', activeColorId);
                if (itemError) throw itemError;

                // Update cat_assets
                await supabase.from('cat_assets').delete().eq('item_id', activeColorId);
                if (assetsPayload.length > 0) {
                    const { error: assetsError } = await supabase.from('cat_assets').insert(assetsPayload);
                }
            }
            toast.success('Media saved successfully');
        } catch (error: unknown) {
            console.error('Media save failed:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Failed to save media: ' + message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
            <style>{`
                @keyframes swatchShimmer {
                    0% { transform: translateX(-100%) rotate(25deg); }
                    100% { transform: translateX(200%) rotate(25deg); }
                }
                .swatch-shimmer {
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(255,255,255,0.5) 40%,
                        rgba(255,255,255,0.7) 50%,
                        rgba(255,255,255,0.5) 60%,
                        transparent 100%
                    );
                    animation: swatchShimmer 3s ease-in-out infinite;
                }
            `}</style>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 p-1 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {isReorderSaving && <span className="text-indigo-500">Saving order…</span>}
                    {!isReorderSaving && showReorderSaved && <span className="text-emerald-500">Order saved</span>}
                </div>
            </div>

            {existingColors?.length === 0 && (
                <div className="px-4 py-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    No {l2Label.toLowerCase()} yet. Add your first one.
                </div>
            )}

            <div
                className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6' : 'grid-cols-1'}`}
                onKeyDown={handleGridKeyDown}
            >
                {existingColors.map((color: any, index: number) => (
                    <div
                        key={color.id}
                        ref={el => {
                            cardRefs.current[index] = el;
                        }}
                        tabIndex={0}
                        onFocus={() => setFocusedIndex(index)}
                        className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-3xl p-4 hover:border-indigo-500/20 transition-all shadow-xl shadow-slate-200/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        title={`Debug Info:\nID: ${color.id}\nSlug: ${color.slug}\nBrand: ${color.brand_id}`}
                        aria-label={`${l2Label} ${color.name}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div
                                            className="w-10 h-10 rounded-xl border-2 border-slate-100 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-black/40 flex items-center justify-center group-hover:border-indigo-500/30 transition-all"
                                            title={`Primary Image: ${color.specs.primary_image || 'None'}\nGallery Count: ${color.specs.gallery?.length || 0}`}
                                        >
                                            {color.specs.primary_image || color.specs.gallery?.[0] ? (
                                                <img
                                                    src={getProxiedUrl(
                                                        color.specs.primary_image || color.specs.gallery?.[0]
                                                    )}
                                                    className="w-full h-full object-cover animate-in fade-in duration-500"
                                                    alt={color.name}
                                                />
                                            ) : (
                                                <ImageIcon size={24} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="absolute -top-2 -left-2 w-7 h-7 bg-slate-900 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-white font-black italic text-[10px] shadow-lg">
                                            {color.position}
                                        </div>
                                    </div>
                                    <div>
                                        <h4
                                            className="font-black text-sm text-slate-900 dark:text-white uppercase italic leading-none cursor-help"
                                            title={`Name: ${color.name}\nSlug: ${color.slug}`}
                                        >
                                            {color.name}
                                        </h4>
                                        {color.specs?.Finish && (
                                            <div className="mt-1">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[8px] font-black uppercase text-slate-500 tracking-wider">
                                                    {color.specs.Finish}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <input
                                                type="number"
                                                value={color.position}
                                                onChange={e => handleUpdatePosition(color.id, parseInt(e.target.value))}
                                                className="w-10 bg-slate-100 dark:bg-black/20 rounded-md text-[10px] font-black text-center py-0.5 outline-none border border-transparent focus:border-indigo-500/30"
                                            />
                                            <span
                                                className="text-[9px] font-bold text-slate-400 uppercase tracking-widest cursor-help dashed-underline decoration-slate-300"
                                                title="Field: position (Sort Order)"
                                            >
                                                SEQ
                                            </span>
                                            <span
                                                className="text-[9px] font-mono font-black text-slate-300 uppercase tracking-widest pl-2 border-l border-slate-200 dark:border-white/10 cursor-help"
                                                title={`Full ID: ${color.id}`}
                                            >
                                                {color.id.split('-').pop().slice(0, 9)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingColor(color);
                                                setEditModalOpen(true);
                                            }}
                                            className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                            title="Edit Name"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setColorToDelete(color);
                                                setDeleteModalOpen(true);
                                            }}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {/* Color Picker (25%) */}
                                    <button
                                        onClick={() => openSmartPicker(color)}
                                        className="w-1/4 flex items-center justify-center py-2 rounded-xl border-2 border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                        title={`Smart Color Picker — ${color.specs?.Finish || 'No Finish'}`}
                                        aria-label={`Pick ${l2Label.toLowerCase()} colors for ${color.name}`}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full shadow-lg border-2 border-white dark:border-white/10 overflow-hidden relative"
                                            style={{
                                                background: color.specs.hex_secondary
                                                    ? `linear-gradient(135deg, ${color.specs.hex_primary || '#000000'} 50%, ${color.specs.hex_secondary} 50%)`
                                                    : color.specs.hex_primary || '#000000',
                                            }}
                                        >
                                            {color.specs?.Finish !== 'MATTE' && (
                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/10 pointer-events-none" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Media Manager (75%) */}
                                    <div className="w-3/4 flex gap-2">
                                        {/* Image Slot */}
                                        <button
                                            onClick={() => {
                                                setActiveColorId(color.id);
                                                setMediaModalOpen(true);
                                            }}
                                            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all ${color.specs.gallery?.length > 0 ? 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10' : 'border-dashed border-slate-100 dark:border-white/10 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10'}`}
                                            aria-label={`Manage images for ${color.name}`}
                                        >
                                            {color.specs.gallery?.length > 0 ? (
                                                <>
                                                    <div className="flex -space-x-2">
                                                        {color.specs.gallery
                                                            .slice(0, 1)
                                                            .map((img: string, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="w-5 h-5 rounded-md border border-white dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900"
                                                                >
                                                                    <img
                                                                        src={getProxiedUrl(img)}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ))}
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">
                                                        {color.specs.gallery.length} Imgs
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon size={14} className="text-slate-300" />
                                                    <span className="text-[7px] font-bold text-slate-400 uppercase">
                                                        Add
                                                    </span>
                                                </>
                                            )}
                                        </button>

                                        {/* Video Slot */}
                                        <button
                                            onClick={() => {
                                                setActiveColorId(color.id);
                                                setMediaModalOpen(true);
                                            }}
                                            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all ${color.specs.video_urls?.length > 0 || family.specs?.video_urls?.length > 0 ? 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10' : 'border-dashed border-slate-100 dark:border-white/10 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10'}`}
                                            aria-label={`Manage videos for ${color.name}`}
                                        >
                                            {(() => {
                                                const hasOwn = color.specs.video_urls?.length > 0;
                                                const hasInherited = family.specs?.video_urls?.length > 0;
                                                // Check if own videos are just a subset of inherited (meaning user selected them but didn't add NEW ones)
                                                // Actually, if they are identical or subset, we can consider them "Linked/Shared" contextually.
                                                // But visually, if I explicitly selected them, they are "Specific" in the DB.
                                                // However, user wants to see "Shared" if they are the SAME as the model's.
                                                // So: isShared = (hasOwn && allOwnAreInInherited) OR (!hasOwn && hasInherited)
                                                const allOwnAreInInherited =
                                                    hasOwn &&
                                                    color.specs.video_urls.every((u: string) =>
                                                        family.specs?.video_urls?.includes(u)
                                                    );
                                                const isShared =
                                                    (hasOwn && allOwnAreInInherited) || (!hasOwn && hasInherited);

                                                if (isShared) {
                                                    return (
                                                        <>
                                                            <Video size={16} className="text-emerald-500" />
                                                            <span
                                                                className="text-[7px] font-black bg-emerald-100 text-emerald-600 px-1.5 rounded-full uppercase cursor-help"
                                                                title="Source: Inherited from Family specs.video_urls"
                                                            >
                                                                Shared
                                                            </span>
                                                        </>
                                                    );
                                                } else if (hasOwn) {
                                                    return (
                                                        <>
                                                            <Video size={16} className="text-indigo-500" />
                                                            <span
                                                                className="text-[7px] font-black bg-indigo-100 text-indigo-600 px-1.5 rounded-full uppercase cursor-help"
                                                                title="Source: Custom video_urls on this color"
                                                            >
                                                                Specific
                                                            </span>
                                                        </>
                                                    );
                                                } else {
                                                    return (
                                                        <>
                                                            <Video size={14} className="text-slate-300" />
                                                            <span className="text-[7px] font-bold text-slate-400 uppercase">
                                                                Add
                                                            </span>
                                                        </>
                                                    );
                                                }
                                            })()}
                                        </button>

                                        {/* PDF Slot */}
                                        <button
                                            onClick={() => {
                                                setActiveColorId(color.id);
                                                setMediaModalOpen(true);
                                            }}
                                            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all ${color.specs.pdf_urls?.length > 0 || family.specs?.pdf_urls?.length > 0 ? 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10' : 'border-dashed border-slate-100 dark:border-white/10 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10'}`}
                                            aria-label={`Manage PDFs for ${color.name}`}
                                        >
                                            {(() => {
                                                const hasOwn = color.specs.pdf_urls?.length > 0;
                                                const hasInherited = family.specs?.pdf_urls?.length > 0;
                                                const allOwnAreInInherited =
                                                    hasOwn &&
                                                    color.specs.pdf_urls.every((u: string) =>
                                                        family.specs?.pdf_urls?.includes(u)
                                                    );
                                                const isShared =
                                                    (hasOwn && allOwnAreInInherited) || (!hasOwn && hasInherited);

                                                if (isShared) {
                                                    return (
                                                        <>
                                                            <FileText size={16} className="text-emerald-500" />
                                                            <span
                                                                className="text-[7px] font-black bg-emerald-100 text-emerald-600 px-1.5 rounded-full uppercase cursor-help"
                                                                title="Source: Inherited from Family specs.pdf_urls"
                                                            >
                                                                Shared
                                                            </span>
                                                        </>
                                                    );
                                                } else if (hasOwn) {
                                                    return (
                                                        <>
                                                            <FileText size={16} className="text-orange-500" />
                                                            <span
                                                                className="text-[8px] font-black text-slate-400 uppercase cursor-help"
                                                                title="Source: Custom pdf_urls on this color"
                                                            >
                                                                {color.specs.pdf_urls.length} PDF
                                                            </span>
                                                        </>
                                                    );
                                                } else {
                                                    return (
                                                        <>
                                                            <FileText size={14} className="text-slate-300" />
                                                            <span className="text-[7px] font-bold text-slate-400 uppercase">
                                                                Add
                                                            </span>
                                                        </>
                                                    );
                                                }
                                            })()}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Color Card */}
                <button
                    onClick={() => setAddModalOpen(true)}
                    className="group relative h-full border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-4 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 min-h-[140px]"
                >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                        <Plus size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Add {l2Label}</span>
                </button>
            </div>

            {/* Smart Picker Modal */}
            {pickerOpen && activeColor && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-3xl animate-in fade-in"
                        onClick={() => setPickerOpen(false)}
                    />

                    <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col md:flex-row h-[80vh] animate-in zoom-in-95">
                        {/* Canvas Section */}
                        <div className="flex-1 bg-slate-50 dark:bg-black/20 p-8 flex flex-col items-center justify-center relative border-r border-slate-100 dark:border-white/5 overflow-hidden">
                            <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10">
                                    <Palette className="text-indigo-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic leading-none">
                                        Pixel Color Picker
                                    </h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        Accurate Selection Mode
                                    </p>
                                </div>
                            </div>

                            <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-20">
                                <span
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${pickerTarget === 'primary' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white text-slate-400 border-slate-100'}`}
                                >
                                    Target: Primary
                                </span>
                            </div>

                            <ImageColorPicker
                                imageUrl={
                                    activeColor.specs.primary_image ||
                                    activeColor.specs.gallery?.[0] ||
                                    family.image_url
                                }
                                onPick={hex => {
                                    if (pickerTarget === 'primary') setTempPrimary(hex);
                                    else setTempSecondary(hex);
                                }}
                                onHover={setHoveredColor}
                            />
                        </div>

                        {/* Sidebar Section */}
                        <div className="w-full md:w-[400px] flex flex-col h-full relative z-30 bg-white dark:bg-slate-900">
                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto p-10">
                                <div className="space-y-10">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                {l2Label} Definition
                                            </h4>
                                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic font-display leading-none">
                                                {activeColor.name}
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() => setPickerOpen(false)}
                                            className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all"
                                        >
                                            <X size={24} className="text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="space-y-6 pb-20">
                                        {' '}
                                        {/* pb-20 for footer clearance if needed, though footer is outside now */}
                                        {/* Primary Color Box */}
                                        <div
                                            onClick={() => setPickerTarget('primary')}
                                            className={`relative group p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer ${pickerTarget === 'primary' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-50 hover:border-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <span
                                                    className="text-[10px] font-black text-emerald-600 uppercase tracking-widest cursor-help dashed-underline decoration-emerald-300"
                                                    title="Field: specs.hex_primary"
                                                >
                                                    Primary Color
                                                </span>
                                                <div
                                                    className={`w-3 h-3 rounded-full ${pickerTarget === 'primary' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`}
                                                />
                                            </div>
                                            <div
                                                className="w-full h-32 rounded-3xl shadow-inner border border-white/20 transition-all duration-300 relative overflow-hidden"
                                                style={{
                                                    backgroundColor:
                                                        pickerTarget === 'primary' && hoveredColor
                                                            ? hoveredColor
                                                            : tempPrimary || '#000000',
                                                }}
                                            >
                                                {/* Checkerboard pattern for transparency indication if needed, though mostly solid colors here */}
                                            </div>
                                            <div className="mt-6 flex flex-col items-start">
                                                <span className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">
                                                    {pickerTarget === 'primary' && hoveredColor
                                                        ? hoveredColor
                                                        : tempPrimary || '#000000'}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                                    {pickerTarget === 'primary' && hoveredColor
                                                        ? 'POINTER PREVIEW'
                                                        : 'MAIN SURFACE COLOR'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Secondary Color Box (Optional) */}
                                        <div
                                            onClick={() => setPickerTarget('secondary')}
                                            className={`relative group p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer ${pickerTarget === 'secondary' ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-50 hover:border-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <span
                                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-help dashed-underline decoration-slate-300"
                                                    title="Field: specs.hex_secondary"
                                                >
                                                    Secondary (Optional)
                                                </span>
                                                {tempSecondary && (
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setTempSecondary(null);
                                                        }}
                                                        className="text-slate-400 hover:text-rose-500"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            {tempSecondary ? (
                                                <>
                                                    <div
                                                        className="w-full h-24 rounded-2xl shadow-inner border border-white/20 transition-all duration-300"
                                                        style={{
                                                            backgroundColor:
                                                                pickerTarget === 'secondary' && hoveredColor
                                                                    ? hoveredColor
                                                                    : tempSecondary,
                                                        }}
                                                    />
                                                    <div className="mt-4 flex flex-col items-start">
                                                        <span className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">
                                                            {pickerTarget === 'secondary' && hoveredColor
                                                                ? hoveredColor
                                                                : tempSecondary}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                                            {pickerTarget === 'secondary' && hoveredColor
                                                                ? 'POINTER PREVIEW'
                                                                : 'ACCENT SURFACE COLOR'}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-32 rounded-[2rem] bg-slate-50 dark:bg-black/20 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 group-hover:bg-indigo-50/30 transition-all">
                                                    {pickerTarget === 'secondary' && hoveredColor ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div
                                                                className="w-8 h-8 rounded-lg shadow-sm"
                                                                style={{ backgroundColor: hoveredColor }}
                                                            />
                                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                                                                {hoveredColor}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Zap
                                                                size={24}
                                                                className="text-slate-200 group-hover:text-indigo-400 transition-colors"
                                                            />
                                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                                                Click to define
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex-none">
                                <button
                                    onClick={saveSmartColor}
                                    className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                                >
                                    Apply Colors <Check size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {mediaModalOpen && activeColor && (
                <SKUMediaManager
                    skuName={activeColor.name}
                    initialImages={activeColor.specs.gallery || []}
                    // Default to family videos if not defined (New/Unconfigured), but respect empty array if explicitly set
                    initialVideos={
                        activeColor.specs.video_urls?.length > 0
                            ? activeColor.specs.video_urls
                            : (family.specs?.video_urls ?? [])
                    }
                    initialPdfs={
                        activeColor.specs.pdf_urls?.length > 0
                            ? activeColor.specs.pdf_urls
                            : (family.specs?.pdf_urls ?? [])
                    }
                    initialPrimary={activeColor.specs.primary_image}
                    initialZoomFactor={activeColor.zoom_factor || 1.1}
                    initialIsFlipped={activeColor.is_flipped || false}
                    initialOffsetX={activeColor.offset_x || 0}
                    initialOffsetY={activeColor.offset_y || 0}
                    // Inheritance Source
                    inheritedVideos={family.specs?.video_urls || []}
                    inheritedPdfs={family.specs?.pdf_urls || []}
                    inheritedFrom={family.name}
                    onSave={handleSaveMedia}
                    onClose={() => {
                        setMediaModalOpen(false);
                        setActiveColorId(null);
                    }}
                />
            )}
            {/* Edit Color Modal */}
            {editModalOpen && editingColor && (
                <EditColorModal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setEditingColor(null);
                    }}
                    onSave={(newName, newStatus, newFinish) =>
                        handleEditColor(editingColor.id, newName, newStatus, newFinish)
                    }
                    initialName={editingColor.name}
                    initialStatus={editingColor.status}
                    initialFinish={editingColor.specs?.Finish}
                    existingNames={existingColors.filter((c: any) => c.id !== editingColor.id).map((c: any) => c.name)}
                    l2Label={l2Label}
                    placeholder={unitPlaceholder}
                />
            )}

            {addModalOpen && (
                <AddColorModal
                    isOpen={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    onAdd={handleAddColor}
                    existingNames={existingColors.map((c: any) => c.name)}
                    l2Label={l2Label}
                    placeholder={unitPlaceholder}
                />
            )}
            {deleteModalOpen && colorToDelete && (
                <DeleteConfirmationModal
                    isOpen={deleteModalOpen}
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setColorToDelete(null);
                    }}
                    onConfirm={async () => {
                        const supabase = createClient();
                        const { error } = await supabase.from('cat_items').delete().eq('id', colorToDelete.id);
                        if (error) {
                            toast.error(`Failed to delete ${l2Label.toLowerCase()}`);
                        } else {
                            onUpdate(existingColors.filter((c: any) => c.id !== colorToDelete.id));
                            toast.success(`${l2Label} deleted successfully`);
                        }
                    }}
                    title={`Delete ${l2Label}`}
                    message={`Are you sure you want to permanently remove this ${l2Label.toLowerCase()} definition? This action cannot be undone.`}
                    itemName={colorToDelete.name}
                />
            )}
            {showDebug && (
                <div className="mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Debug Console
                        </h4>
                        <span className="text-[9px] font-mono text-slate-300">{existingColors?.length || 0} ITEMS</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 space-y-1 overflow-x-auto">
                        <div>ACTIVE_ID: {activeColorId || 'NULL'}</div>
                        <div>VIEW_MODE: {viewMode}</div>
                        <div>
                            PICKER: {pickerOpen ? 'OPEN' : 'CLOSED'} (TARGET: {pickerTarget})
                        </div>
                        <div className="whitespace-pre">
                            {JSON.stringify(
                                existingColors?.map((c: any) => ({ id: c.id, pos: c.position, name: c.name })),
                                null,
                                2
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
