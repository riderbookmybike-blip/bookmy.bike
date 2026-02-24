'use client';

import React, { useState } from 'react';
import {
    Loader2,
    Plus,
    Trash2,
    Palette,
    Save,
    GripVertical,
    Sparkles,
    Layers,
    Image as ImageIcon,
    Upload,
    Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createColour, updateColour, deleteColour, reorderColours } from '@/actions/catalog/catalogV2Actions';
import type { CatalogModel, CatalogColour } from '@/actions/catalog/catalogV2Actions';
import { getHierarchyLabels } from '@/lib/constants/catalogLabels';
import CopyableId from '@/components/ui/CopyableId';
import SKUMediaManager from '@/components/catalog/SKUMediaManager';
import { getProxiedUrl } from '@/lib/utils/urlHelper';
import { getErrorMessage } from '@/lib/utils/errorMessage';

// ── Helpers — convert between flat cat_colours columns and SKUMediaManager arrays ──
function colourToGalleryArray(c: CatalogColour): string[] {
    const imgs: string[] = [];
    if (c.primary_image) imgs.push(c.primary_image);
    for (let i = 1; i <= 6; i++) {
        const url = (c as any)[`gallery_img_${i}`] as string | null;
        if (url && !imgs.includes(url)) imgs.push(url);
    }
    return imgs;
}
function colourToVideoArray(c: CatalogColour): string[] {
    const vids: string[] = [];
    if (c.video_url_1) vids.push(c.video_url_1);
    if (c.video_url_2) vids.push(c.video_url_2);
    return vids;
}
function colourToPdfArray(c: CatalogColour): string[] {
    return c.pdf_url_1 ? [c.pdf_url_1] : [];
}

// ── Finish badge styling ──
const finishStyles: Record<string, { bg: string; text: string; label: string }> = {
    GLOSS: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', label: 'Gloss' },
    MATTE: { bg: 'bg-slate-100 dark:bg-slate-800/40', text: 'text-slate-600 dark:text-slate-400', label: 'Matte' },
    METALLIC: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', label: 'Metallic' },
    CHROME: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', label: 'Chrome' },
};

interface ColourPoolStepProps {
    model: CatalogModel;
    colours: CatalogColour[];
    onUpdate: (colours: CatalogColour[]) => void;
}

export default function ColourPoolStepV2({ model, colours, onUpdate }: ColourPoolStepProps) {
    const productType = (model.product_type || 'VEHICLE') as string;
    const isVehicle = productType === 'VEHICLE';
    const labels = getHierarchyLabels(productType);
    const poolLabel = labels.pool; // 'Colour' for VEHICLE, 'Tier' for SERVICE, 'Sub-Variant' for ACCESSORY
    const poolLabelLower = poolLabel.toLowerCase();

    // ── Form state for new colour ──
    const [newName, setNewName] = useState('');
    const [newHex, setNewHex] = useState('#4F46E5');
    const [newHexSecondary, setNewHexSecondary] = useState('');
    const [newFinish, setNewFinish] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);

    // ── Editing state ──
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Record<string, Partial<CatalogColour>>>({});
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [activeMediaColour, setActiveMediaColour] = useState<CatalogColour | null>(null);

    // ── Actions ──
    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsCreating(true);
        try {
            const created = await createColour({
                model_id: model.id,
                name: newName.trim(),
                hex_primary: newHex || undefined,
                hex_secondary: newHexSecondary || undefined,
                finish: newFinish || undefined,
            });
            onUpdate([...colours, created]);
            setNewName('');
            setNewHex('#4F46E5');
            setNewHexSecondary('');
            setNewFinish('');
            setShowNewForm(false);
            toast.success(`${poolLabel} "${created.name}" added`);
        } catch (err) {
            console.error(`Failed to create ${poolLabelLower}:`, err);
            toast.error(`Failed to create ${poolLabelLower}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSave = async (id: string) => {
        const data = editData[id];
        if (!data) return;
        setIsSaving(id);
        try {
            const updated = await updateColour(id, data);
            onUpdate(colours.map(c => (c.id === id ? updated : c)));
            setEditingId(null);
            toast.success(`${poolLabel} updated`);
        } catch (err) {
            toast.error(`Failed to update ${poolLabelLower}`);
        } finally {
            setIsSaving(null);
        }
    };

    const handleDelete = async (id: string) => {
        const colour = colours.find(c => c.id === id);
        if (
            !confirm(
                `Delete ${poolLabelLower} "${colour?.name}"? SKUs linked to this ${poolLabelLower} will be unlinked.`
            )
        )
            return;
        try {
            await deleteColour(id);
            onUpdate(colours.filter(c => c.id !== id));
            toast.success(`${poolLabel} deleted`);
        } catch (err) {
            toast.error(`Failed to delete ${poolLabelLower}`);
        }
    };

    const handleReposition = async (currentIndex: number, newPosition: number) => {
        const targetIdx = Math.max(0, Math.min(colours.length - 1, newPosition - 1));
        if (targetIdx === currentIndex) return;

        const newOrder = [...colours];
        const [moved] = newOrder.splice(currentIndex, 1);
        newOrder.splice(targetIdx, 0, moved);
        // Sync position fields to match new array order (so SKU Matrix sorts correctly)
        const withPositions = newOrder.map((c, i) => ({ ...c, position: i }));
        onUpdate(withPositions);
        try {
            await reorderColours(
                model.id,
                withPositions.map(c => c.id)
            );
            toast.success(`Moved to position ${targetIdx + 1}`);
        } catch {
            toast.error('Failed to reorder');
        }
    };

    const startEditing = (colour: CatalogColour) => {
        setEditingId(colour.id);
        setEditData(prev => ({ ...prev, [colour.id]: { ...colour } }));
    };

    const updateField = (id: string, key: string, value: any) => {
        setEditData(prev => ({
            ...prev,
            [id]: { ...prev[id], [key]: value },
        }));
    };

    // ── Colour media save handler (matches SKUStepV2 pattern) ──
    const handleColourMediaSave = async (
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
        if (!activeMediaColour) return;
        try {
            const mediaUpdate: Partial<CatalogColour> = {
                primary_image: primary || images[0] || null,
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
            };
            const updated = await updateColour(activeMediaColour.id, mediaUpdate as any);
            if (updated) {
                onUpdate(colours.map(c => (c.id === activeMediaColour.id ? updated : c)));
                toast.success('Colour media saved');
            }
        } catch (err: unknown) {
            console.error('Colour media save failed:', err);
            toast.error('Failed to save media: ' + getErrorMessage(err));
        }
    };

    const toggleColourMediaShared = async (colour: CatalogColour) => {
        try {
            const updated = await updateColour(colour.id, { media_shared: !colour.media_shared } as any);
            if (updated) {
                onUpdate(colours.map(c => (c.id === updated.id ? updated : c)));
                toast.success(updated.media_shared ? 'Media shared with SKUs' : 'Media sharing disabled');
            }
        } catch (err: unknown) {
            toast.error('Failed to toggle sharing: ' + getErrorMessage(err));
        }
    };

    return (
        <>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                            {model.name} — {poolLabel} Pool
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Define {poolLabelLower}s once, assign to SKUs later · {colours.length} {poolLabelLower}
                            {colours.length !== 1 ? 's' : ''} defined
                        </p>
                    </div>
                    <button
                        onClick={() => setShowNewForm(!showNewForm)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} />
                        Add {poolLabel}
                    </button>
                </div>

                {/* New Colour Form */}
                {showNewForm && (
                    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 dark:from-indigo-900/10 dark:via-white/5 dark:to-violet-900/10 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-indigo-500" />
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                New {poolLabel}
                            </span>
                        </div>

                        <div
                            className={`grid grid-cols-1 ${isVehicle ? 'md:grid-cols-4' : 'md:grid-cols-1 max-w-md'} gap-4`}
                        >
                            {/* Name */}
                            <div className={isVehicle ? 'md:col-span-1' : ''}>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">
                                    {poolLabel} Name
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleCreate();
                                    }}
                                    placeholder={
                                        isVehicle
                                            ? 'e.g. Starlight Blue'
                                            : `e.g. ${productType === 'SERVICE' ? '1 Year, Silver, Gold' : 'Standard, Premium'}`
                                    }
                                    className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                    autoFocus
                                />
                            </div>

                            {/* Colour-specific fields — hidden for non-VEHICLE */}
                            {isVehicle && (
                                <>
                                    {/* Primary Hex */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">
                                            Primary Hex
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={newHex}
                                                onChange={e => setNewHex(e.target.value)}
                                                className="w-10 h-10 rounded-xl border-2 border-slate-200 cursor-pointer shadow-inner"
                                            />
                                            <input
                                                type="text"
                                                value={newHex}
                                                onChange={e => setNewHex(e.target.value)}
                                                placeholder="#4F46E5"
                                                className="flex-1 px-3 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Secondary Hex */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">
                                            Secondary Hex <span className="text-slate-300">(optional)</span>
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={newHexSecondary || '#000000'}
                                                onChange={e => setNewHexSecondary(e.target.value)}
                                                className="w-10 h-10 rounded-xl border-2 border-slate-200 cursor-pointer shadow-inner"
                                            />
                                            <input
                                                type="text"
                                                value={newHexSecondary}
                                                onChange={e => setNewHexSecondary(e.target.value)}
                                                placeholder="#000000"
                                                className="flex-1 px-3 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Finish */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">
                                            Finish
                                        </label>
                                        <select
                                            value={newFinish}
                                            onChange={e => setNewFinish(e.target.value)}
                                            className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
                                        >
                                            <option value="">— Select finish —</option>
                                            <option value="GLOSS">Gloss</option>
                                            <option value="MATTE">Matte</option>
                                            <option value="METALLIC">Metallic</option>
                                            <option value="CHROME">Chrome</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Preview + Actions */}
                        <div className="flex items-center justify-between pt-2">
                            {/* Live preview */}
                            <div className="flex items-center gap-3">
                                {!isVehicle ? (
                                    <>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                            <Layers size={20} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {newName || 'Tier Preview'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                Service Tier
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <div
                                                className="w-12 h-12 rounded-2xl shadow-lg border-2 border-white"
                                                style={{ backgroundColor: newHex || '#ccc' }}
                                            />
                                            {newHexSecondary && (
                                                <div
                                                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white shadow"
                                                    style={{ backgroundColor: newHexSecondary }}
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {newName || 'Colour Preview'}
                                            </p>
                                            <p className="text-[10px] font-mono text-slate-400">
                                                {newHex} {newFinish && `· ${newFinish}`}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowNewForm(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating || !newName.trim()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
                                >
                                    {isCreating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Colour List */}
                <div className="space-y-3">
                    {colours.map((colour, index) => {
                        const isEditing = editingId === colour.id;
                        const data = editData[colour.id] || colour;
                        const finish = finishStyles[colour.finish || ''];

                        return (
                            <div
                                key={colour.id}
                                className={`group relative rounded-2xl border-2 transition-all ${
                                    isEditing
                                        ? 'border-indigo-300 dark:border-indigo-500/40 shadow-lg shadow-indigo-500/5 bg-white dark:bg-white/5'
                                        : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.03] hover:border-slate-200 dark:hover:border-white/10'
                                }`}
                            >
                                <div className="p-5">
                                    <div className="flex items-center gap-4">
                                        {/* Reorder handle + swatch/icon */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                max={colours.length}
                                                defaultValue={index + 1}
                                                key={`${colour.id}-${index}`}
                                                onClick={e => e.stopPropagation()}
                                                onBlur={e => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val)) handleReposition(index, val);
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = parseInt((e.target as HTMLInputElement).value);
                                                        if (!isNaN(val)) handleReposition(index, val);
                                                    }
                                                }}
                                                className="w-10 h-8 text-center text-xs font-black bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 dark:text-white"
                                                title={`Position ${index + 1} — type to reorder`}
                                            />

                                            {!isVehicle ? (
                                                /* Tier icon */
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center transition-transform group-hover:scale-110">
                                                    <Layers size={20} className="text-emerald-500" />
                                                </div>
                                            ) : (
                                                /* Dual colour swatch */
                                                <div className="relative">
                                                    <div
                                                        className="w-12 h-12 rounded-2xl shadow-md border-2 border-white dark:border-slate-700 transition-transform group-hover:scale-110"
                                                        style={{ backgroundColor: colour.hex_primary || '#ccc' }}
                                                    />
                                                    {colour.hex_secondary && (
                                                        <div
                                                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white dark:border-slate-700 shadow"
                                                            style={{ backgroundColor: colour.hex_secondary }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Colour Media — clickable thumbnail to open SKUMediaManager */}
                                        {isVehicle && (
                                            <button
                                                onClick={() => setActiveMediaColour(colour)}
                                                className={`w-16 h-12 rounded-lg border transition-all overflow-hidden flex items-center justify-center group/media relative ${
                                                    colour.primary_image
                                                        ? 'border-indigo-500/30 hover:border-indigo-500'
                                                        : 'bg-slate-50 dark:bg-black/40 border-dashed border-slate-200 dark:border-white/10 text-slate-300 hover:text-indigo-500 hover:border-indigo-400'
                                                }`}
                                                title="Manage Media"
                                            >
                                                {colour.primary_image ? (
                                                    <>
                                                        <img
                                                            src={getProxiedUrl(colour.primary_image)}
                                                            className="w-full h-full object-contain p-0.5 group-hover/media:scale-110 transition-transform duration-300"
                                                            alt={colour.name}
                                                        />
                                                        <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                            <Upload size={12} strokeWidth={3} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <ImageIcon size={14} strokeWidth={1.5} />
                                                )}
                                            </button>
                                        )}

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                    {colour.name}
                                                </h4>
                                                {finish && (
                                                    <span
                                                        className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${finish.bg} ${finish.text}`}
                                                    >
                                                        {finish.label}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-mono text-slate-300">
                                                    #{index + 1}
                                                </span>
                                            </div>
                                            {isVehicle && (
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        {colour.hex_primary || 'no hex'}
                                                    </span>
                                                    {colour.hex_secondary && (
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            + {colour.hex_secondary}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <CopyableId id={colour.id} />
                                        </div>

                                        {/* Actions */}
                                        {!isEditing && (
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEditing(colour)}
                                                    className="p-2 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"
                                                    title="Edit"
                                                >
                                                    <Palette size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(colour.id)}
                                                    className="p-2 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                {/* Shareable toggle */}
                                                {colour.primary_image && (
                                                    <button
                                                        onClick={() => toggleColourMediaShared(colour)}
                                                        className={`p-2 rounded-xl transition-colors ${
                                                            colour.media_shared
                                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                                                : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-indigo-600'
                                                        }`}
                                                        title={
                                                            colour.media_shared
                                                                ? 'Shared ✓ (click to unshare)'
                                                                : 'Share media with SKUs'
                                                        }
                                                    >
                                                        <Share2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Inline Edit Form */}
                                    {isEditing && (
                                        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div
                                                className={`grid grid-cols-1 ${isVehicle ? 'md:grid-cols-4' : 'max-w-md'} gap-4`}
                                            >
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">
                                                        Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.name || ''}
                                                        onChange={e => updateField(colour.id, 'name', e.target.value)}
                                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </div>
                                                {isVehicle && (
                                                    <>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">
                                                                Primary Hex
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={data.hex_primary || '#000000'}
                                                                    onChange={e =>
                                                                        updateField(
                                                                            colour.id,
                                                                            'hex_primary',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-10 h-10 rounded-xl border-2 border-slate-200 cursor-pointer"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={data.hex_primary || ''}
                                                                    onChange={e =>
                                                                        updateField(
                                                                            colour.id,
                                                                            'hex_primary',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">
                                                                Secondary Hex
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={data.hex_secondary || '#000000'}
                                                                    onChange={e =>
                                                                        updateField(
                                                                            colour.id,
                                                                            'hex_secondary',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-10 h-10 rounded-xl border-2 border-slate-200 cursor-pointer"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={data.hex_secondary || ''}
                                                                    onChange={e =>
                                                                        updateField(
                                                                            colour.id,
                                                                            'hex_secondary',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">
                                                                Finish
                                                            </label>
                                                            <select
                                                                value={data.finish || ''}
                                                                onChange={e =>
                                                                    updateField(
                                                                        colour.id,
                                                                        'finish',
                                                                        e.target.value || null
                                                                    )
                                                                }
                                                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
                                                            >
                                                                <option value="">—</option>
                                                                <option value="GLOSS">Gloss</option>
                                                                <option value="MATTE">Matte</option>
                                                                <option value="METALLIC">Metallic</option>
                                                                <option value="CHROME">Chrome</option>
                                                            </select>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleSave(colour.id)}
                                                    disabled={isSaving === colour.id}
                                                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
                                                >
                                                    {isSaving === colour.id ? (
                                                        <Loader2 className="animate-spin" size={12} />
                                                    ) : (
                                                        <Save size={12} />
                                                    )}
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty state */}
                {colours.length === 0 && !showNewForm && (
                    <div className="text-center py-16">
                        <div className="relative inline-block mb-4">
                            <div
                                className={`w-20 h-20 rounded-3xl flex items-center justify-center ${isVehicle ? 'bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20' : 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20'}`}
                            >
                                {isVehicle ? (
                                    <Palette size={36} className="text-indigo-400" />
                                ) : (
                                    <Layers size={36} className="text-emerald-400" />
                                )}
                            </div>
                        </div>
                        <p className="font-bold text-sm text-slate-500">No {poolLabelLower}s defined yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Add {poolLabelLower}s to this {labels.model.toLowerCase()} — they&apos;ll be available for
                            all SKUs
                        </p>
                        <button
                            onClick={() => setShowNewForm(true)}
                            className={`mt-4 text-xs font-bold uppercase tracking-wider ${isVehicle ? 'text-indigo-600 hover:text-indigo-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                        >
                            + Add First {poolLabel}
                        </button>
                    </div>
                )}

                {/* Summary footer */}
                {colours.length > 0 && (
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl px-5 py-4 border border-slate-100 dark:border-white/5">
                        {isVehicle ? (
                            <div className="flex -space-x-2">
                                {colours.slice(0, 8).map(c => (
                                    <div
                                        key={c.id}
                                        className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
                                        style={{ backgroundColor: c.hex_primary || '#ccc' }}
                                        title={c.name}
                                    />
                                ))}
                                {colours.length > 8 && (
                                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                        +{colours.length - 8}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                <Layers size={16} className="text-emerald-500" />
                            </div>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {colours.length} {poolLabelLower}
                            {colours.length !== 1 ? 's' : ''} in pool · These will be available in the SKU step
                        </p>
                    </div>
                )}
            </div>

            {/* ─── Colour Media Manager (Full-Screen Overlay) ─── */}
            {activeMediaColour && (
                <SKUMediaManager
                    skuName={`${activeMediaColour.name} (Colour)`}
                    initialImages={colourToGalleryArray(activeMediaColour)}
                    initialVideos={colourToVideoArray(activeMediaColour)}
                    initialPdfs={colourToPdfArray(activeMediaColour)}
                    initialPrimary={activeMediaColour.primary_image || null}
                    initialZoomFactor={activeMediaColour.zoom_factor || 1.0}
                    initialIsFlipped={activeMediaColour.is_flipped || false}
                    initialOffsetX={activeMediaColour.offset_x || 0}
                    initialOffsetY={activeMediaColour.offset_y || 0}
                    onSave={handleColourMediaSave}
                    onClose={() => setActiveMediaColour(null)}
                />
            )}
        </>
    );
}
