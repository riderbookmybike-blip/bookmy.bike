'use client';

import React, { useState } from 'react';
import { Box, Check, Copy, Palette, Trash2, Upload, LayoutList, Plus, ChevronRight, ChevronDown, Eye, Play, Film, X, Minus, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { MediaItem, ModelColor, ModelVariant, VehicleModel } from '@/types/productMaster';

interface AdvancedColorEditorProps {
    selectedModel: VehicleModel | null;
    colors: ModelColor[];
    onAddColor: (data?: Partial<ModelColor>) => void;
    onUpdateColor: (colorId: string, field: string, value: any) => void;
    onDeleteColor: (colorId: string) => void;
    allModels: VehicleModel[]; // For cross-referencing names if needed
}

function SortableMediaItem({
    item,
    idx,
    onPreview,
    onDelete
}: {
    item: MediaItem;
    idx: number;
    onPreview: () => void;
    onDelete: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group/asset flex-shrink-0"
        >
            <div
                onClick={onPreview}
                className={`w-16 h-16 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors ${isDragging ? 'shadow-2xl ring-2 ring-blue-500' : ''}`}
            >
                {item.type === 'image' ? (
                    <img src={item.url} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Play size={20} className="text-white/50" />
                    </div>
                )}
            </div>

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-1 left-1 p-1 bg-black/50 rounded-lg opacity-0 group-hover/asset:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
            >
                <GripVertical size={10} className="text-white" />
            </div>

            <button
                onClick={onDelete}
                className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/asset:opacity-100 transition-opacity shadow-lg"
            >
                <Minus size={12} strokeWidth={3} />
            </button>
        </div>
    );
}

export default function AdvancedColorEditor({
    selectedModel,
    colors,
    onAddColor,
    onUpdateColor,
    onDeleteColor,
    allModels
}: AdvancedColorEditorProps) {
    const modelVariants = selectedModel?.variants || [];
    const [isModelExpanded, setIsModelExpanded] = useState(true);

    const handleAddColor = () => {
        onAddColor({
            name: 'New Finish',
            code: '#000000',
            variantIds: [],
            media: []
        });
    };

    const handleUpdateColorLocal = (id: string, field: string, value: any) => {
        onUpdateColor(id, field, value);
    };

    const handleDeleteColorLocal = (id: string) => {
        onDeleteColor(id);
    };

    const handleCloneColor = (id: string) => {
        const source = colors.find(c => c.id === id);
        if (!source) return;
        onAddColor({
            ...source,
            name: `${source.name} (Copy)`,
            id: undefined
        });
    };

    const [previewMedia, setPreviewMedia] = useState<{ color: ModelColor, initialIdx: number } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent, colorId: string) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const color = colors.find(c => c.id === colorId);
            if (!color) return;

            const oldIndex = color.media.findIndex((m) => m.id === active.id);
            const newIndex = color.media.findIndex((m) => m.id === over.id);

            const reorderedMedia = arrayMove(color.media, oldIndex, newIndex);
            onUpdateColor(colorId, 'media', reorderedMedia);
        }
    };

    return (
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {selectedModel ? (
                <div className="relative">
                    {/* Parent Model Node (Tree Header) */}
                    <div
                        onClick={() => setIsModelExpanded(!isModelExpanded)}
                        className={`relative z-10 p-4 bg-white dark:bg-slate-900 border-[3px] ${isModelExpanded ? 'border-blue-600 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] bg-blue-500/[0.02]' : 'border-slate-200 dark:border-white/5'} rounded-[2rem] flex items-center justify-between shadow-xl cursor-pointer transition-all duration-500 group`}
                    >
                        <div className="flex gap-4 items-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isModelExpanded ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-orange-500'}`}>
                                <Palette size={20} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 italic">Visual Identity Root</p>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic group-hover:text-orange-500 transition-colors">
                                    {selectedModel.name}
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Finishes</p>
                                <p className="text-[12px] font-black text-slate-600 dark:text-slate-300 italic">{colors.length} Variants Defined</p>
                            </div>
                            <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 transition-transform duration-500 ${isModelExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Vertical Tree Line */}
                    {isModelExpanded && colors.length > 0 && (
                        <div className="absolute left-[34px] top-[60px] bottom-0 w-[2px] bg-gradient-to-b from-orange-500/50 via-orange-500/20 to-transparent z-0 blur-[0.5px]" />
                    )}

                    {/* Tree Branches: Color Finishes */}
                    {isModelExpanded && (
                        <div className="mt-4 space-y-4 pl-16 animate-in slide-in-from-top-4 duration-500">
                            {colors.map((color) => (
                                <div key={color.id} className="relative group/color">
                                    {/* Horizontal Branch Line */}
                                    <div className="absolute -left-[30px] top-[32px] w-[30px] h-[2px] bg-orange-500/20 group-hover/color:bg-orange-500/40 transition-colors blur-[0.5px]" />

                                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-white/5 overflow-hidden transition-all duration-500 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5">
                                        <div className="px-6 py-4 flex items-center justify-between">
                                            <div className="flex flex-col gap-8 w-full">
                                                <div className="flex items-center gap-6">
                                                    {/* Color Identity & Media Launch */}
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div
                                                            onClick={() => color.media.length > 0 && setPreviewMedia({ color, initialIdx: 0 })}
                                                            className={`relative w-16 h-16 rounded-2xl shadow-2xl border-2 ${color.media.length > 0 ? 'border-blue-500/50 cursor-pointer hover:scale-105' : 'border-white/10 cursor-default'} overflow-hidden transition-all duration-500 group/hero`}
                                                        >
                                                            {color.media[0]?.type === 'image' ? (
                                                                <img src={color.media[0].url} className="w-full h-full object-cover" />
                                                            ) : color.media[0]?.type === 'video' ? (
                                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                                    <Play className="text-white opacity-50" size={32} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full" style={{ backgroundColor: color.code }} />
                                                            )}

                                                            {color.media.length > 0 && (
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/hero:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <Eye className="text-white" size={24} />
                                                                </div>
                                                            )}
                                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-100 dark:border-white/20 shadow-xl z-20">
                                                                <Box size={10} className="text-blue-500" />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => color.media.length > 0 && setPreviewMedia({ color, initialIdx: 0 })}
                                                            className="text-[9px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest italic flex items-center gap-2"
                                                        >
                                                            Launch Preview
                                                        </button>
                                                    </div>

                                                    {/* Name & Core Specs */}
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={color.name}
                                                                onChange={(e) => handleUpdateColorLocal(color.id, 'name', e.target.value)}
                                                                className="text-xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 hover:text-orange-500 transition-colors uppercase tracking-tight max-w-sm italic"
                                                            />
                                                            <div className="flex gap-1.5 opacity-20">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                <div className="w-2 h-2 rounded-full bg-blue-500/50 scale-150 animate-pulse" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="w-5 h-5 rounded-lg border-2 border-white/20 shadow-sm overflow-hidden p-0 relative">
                                                                <input
                                                                    type="color"
                                                                    value={color.code}
                                                                    onChange={(e) => handleUpdateColorLocal(color.id, 'code', e.target.value)}
                                                                    className="absolute inset-[-100%] cursor-pointer"
                                                                />
                                                            </div>
                                                            <span className="text-[11px] font-black text-slate-400 font-mono tracking-widest uppercase">{color.code}</span>
                                                            <div className="w-2 h-2 rounded-full bg-orange-500/20 mx-2" />
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Identity Branch</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Visual Assets Gallery - The Multi-Media Hub */}
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Media Library ({color.media.length})</h5>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-600/20 rounded-xl text-[9px] font-black text-blue-600 uppercase tracking-widest cursor-pointer hover:bg-blue-600 hover:text-white transition-all">
                                                                    <Plus size={12} /> Add Photo
                                                                    <input
                                                                        type="file" className="hidden" accept="image/*"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                const reader = new FileReader();
                                                                                reader.onloadend = () => {
                                                                                    const newItem: MediaItem = { id: Math.random().toString(), type: 'image', url: reader.result as string };
                                                                                    handleUpdateColorLocal(color.id, 'media', [...(color.media || []), newItem]);
                                                                                };
                                                                                reader.readAsDataURL(file);
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                                <button
                                                                    onClick={() => {
                                                                        const url = prompt('Enter Video URL (YouTube/MP4):');
                                                                        if (url) {
                                                                            const newItem: MediaItem = { id: Math.random().toString(), type: 'video', url };
                                                                            handleUpdateColorLocal(color.id, 'media', [...(color.media || []), newItem]);
                                                                        }
                                                                    }}
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/10 border border-orange-600/20 rounded-xl text-[9px] font-black text-orange-600 uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all"
                                                                >
                                                                    <Film size={12} /> Add Video
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                                            {color.media.length === 0 && (
                                                                <div className="w-full h-16 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1 opacity-50">
                                                                    <Box size={16} className="text-slate-300" />
                                                                    <p className="text-[7px] font-bold uppercase text-slate-400 tracking-widest">No assets uploaded</p>
                                                                </div>
                                                            )}
                                                            <DndContext
                                                                sensors={sensors}
                                                                collisionDetection={closestCenter}
                                                                onDragEnd={(e) => handleDragEnd(e, color.id)}
                                                            >
                                                                <SortableContext
                                                                    items={color.media.map(m => m.id)}
                                                                    strategy={horizontalListSortingStrategy}
                                                                >
                                                                    {color.media.map((item, idx) => (
                                                                        <SortableMediaItem
                                                                            key={item.id}
                                                                            item={item}
                                                                            idx={idx}
                                                                            onPreview={() => setPreviewMedia({ color, initialIdx: idx })}
                                                                            onDelete={() => handleUpdateColorLocal(color.id, 'media', color.media.filter(i => i.id !== item.id))}
                                                                        />
                                                                    ))}
                                                                </SortableContext>
                                                            </DndContext>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Sync with Variants</p>
                                                            <div className="flex gap-4">
                                                                <button
                                                                    onClick={() => handleUpdateColorLocal(color.id, 'variantIds', modelVariants.map((v: ModelVariant) => v.id))}
                                                                    className="text-[9px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
                                                                >
                                                                    Select All
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleUpdateColorLocal(color.id, 'variantIds', []);
                                                                        handleUpdateColorLocal(color.id, 'variantOverrides', {});
                                                                    }}
                                                                    className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-4">
                                                            {modelVariants.map((v: ModelVariant) => {
                                                                const isSelected = color.variantIds?.includes(v.id);
                                                                const variantMedia = color.variantOverrides?.[v.id]?.media || [];

                                                                return (
                                                                    <div key={v.id} className="flex flex-col gap-3">
                                                                        <div className="flex items-center justify-between group/var-row">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const currentIds = color.variantIds || [];
                                                                                    const newIds = isSelected ? currentIds.filter(id => id !== v.id) : [...currentIds, v.id];
                                                                                    handleUpdateColorLocal(color.id, 'variantIds', newIds);

                                                                                    if (isSelected) {
                                                                                        const newOverrides = { ...(color.variantOverrides || {}) };
                                                                                        delete newOverrides[v.id];
                                                                                        handleUpdateColorLocal(color.id, 'variantOverrides', newOverrides);
                                                                                    }
                                                                                }}
                                                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight border transition-all duration-300 flex items-center gap-2 ${isSelected
                                                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                                                    : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500 hover:border-blue-500/50'
                                                                                    }`}
                                                                            >
                                                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                                                                {v.name}
                                                                            </button>

                                                                            {isSelected && (
                                                                                <div className="flex gap-2 opacity-0 group-hover/var-row:opacity-100 transition-opacity">
                                                                                    <label className="p-2 bg-blue-500/10 text-blue-500 rounded-lg cursor-pointer hover:bg-blue-500 hover:text-white transition-all">
                                                                                        <Plus size={10} />
                                                                                        <input
                                                                                            type="file" className="hidden" accept="image/*"
                                                                                            onChange={(e) => {
                                                                                                const file = e.target.files?.[0];
                                                                                                if (file) {
                                                                                                    const reader = new FileReader();
                                                                                                    reader.onloadend = () => {
                                                                                                        const newItem = { id: Math.random().toString(), type: 'image' as const, url: reader.result as string };
                                                                                                        const vOverrides = color.variantOverrides || {};
                                                                                                        const vData = vOverrides[v.id] || { media: [] };
                                                                                                        const newOverrides = {
                                                                                                            ...vOverrides,
                                                                                                            [v.id]: { ...vData, media: [...(vData.media || []), newItem] }
                                                                                                        };
                                                                                                        handleUpdateColorLocal(color.id, 'variantOverrides', newOverrides);
                                                                                                    };
                                                                                                    reader.readAsDataURL(file);
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </label>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const url = prompt('Enter Variant-Specific Video URL:');
                                                                                            if (url) {
                                                                                                const newItem = { id: Math.random().toString(), type: 'video' as const, url };
                                                                                                const vOverrides = color.variantOverrides || {};
                                                                                                const vData = vOverrides[v.id] || { media: [] };
                                                                                                const newOverrides = {
                                                                                                    ...vOverrides,
                                                                                                    [v.id]: { ...vData, media: [...(vData.media || []), newItem] }
                                                                                                };
                                                                                                handleUpdateColorLocal(color.id, 'variantOverrides', newOverrides);
                                                                                            }
                                                                                        }}
                                                                                        className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all"
                                                                                    >
                                                                                        <Film size={10} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {isSelected && variantMedia.length > 0 && (
                                                                            <div className="flex gap-2 overflow-x-auto pb-2 ml-4 border-l-2 border-blue-500/20 pl-4">
                                                                                {variantMedia.map((item) => (
                                                                                    <div key={item.id} className="relative group/var-asset flex-shrink-0">
                                                                                        <div
                                                                                            onClick={() => setPreviewMedia({ color: { ...color, media: variantMedia }, initialIdx: variantMedia.indexOf(item) })}
                                                                                            className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 overflow-hidden cursor-pointer hover:border-blue-500/50"
                                                                                        >
                                                                                            {item.type === 'image' ? (
                                                                                                <img src={item.url} className="w-full h-full object-cover" />
                                                                                            ) : (
                                                                                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                                                                    <Play size={12} className="text-white/50" />
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const vOverrides = { ...color.variantOverrides };
                                                                                                const vData = vOverrides[v.id];
                                                                                                vOverrides[v.id] = { ...vData, media: vData.media?.filter(i => i.id !== item.id) };
                                                                                                handleUpdateColorLocal(color.id, 'variantOverrides', vOverrides);
                                                                                            }}
                                                                                            className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded flex items-center justify-center opacity-0 group-hover/var-asset:opacity-100 transition-opacity"
                                                                                        >
                                                                                            <Minus size={8} strokeWidth={3} />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center gap-3 border-l border-slate-100 dark:border-white/5 pl-10">
                                                <button
                                                    onClick={() => handleCloneColor(color.id)}
                                                    className="p-4 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 rounded-2xl transition-all group/btn"
                                                    title="Clone Finish"
                                                >
                                                    <Copy size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteColorLocal(color.id)}
                                                    className="p-4 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-all group/btn"
                                                >
                                                    <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Append New Color Branch */}
                            <button
                                onClick={handleAddColor}
                                className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] flex items-center justify-center gap-3 hover:border-orange-500 hover:bg-orange-500/5 group/add transition-all"
                            >
                                <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-300 group-hover/add:bg-orange-500 group-hover/add:text-white transition-all shadow-lg shadow-orange-500/10">
                                    <Plus size={16} />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/add:text-orange-500 italic">Initiate New Core Finish Branch</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[500px] bg-white dark:bg-white/[0.01] border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[56px] animate-in fade-in duration-700">
                    <div className="w-24 h-24 rounded-[32px] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                        <Palette size={48} className="text-slate-200 dark:text-white/10" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2 italic">Color Configuration Matrix</p>
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Context Required</h4>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-4">Select a model from the left branch to begin visual mapping</p>
                </div>
            )}

            {/* Lightbox Preview Modal */}
            {previewMedia && (() => {
                const currentMedia = previewMedia.color.media[previewMedia.initialIdx];
                const getEmbedUrl = (url: string) => {
                    if (url.includes('youtube.com/watch?v=')) {
                        return url.replace('watch?v=', 'embed/');
                    }
                    if (url.includes('youtu.be/')) {
                        return url.replace('youtu.be/', 'youtube.com/embed/');
                    }
                    if (url.includes('vimeo.com/')) {
                        const id = url.split('/').pop();
                        return `https://player.vimeo.com/video/${id}`;
                    }
                    return url;
                };

                return (
                    <div className="fixed inset-0 z-[999] bg-slate-950/95 flex flex-col items-center justify-center backdrop-blur-xl animate-in fade-in duration-500">
                        <button
                            onClick={() => setPreviewMedia(null)}
                            className="absolute top-10 right-10 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10"
                        >
                            <X size={32} />
                        </button>

                        <div className="w-full max-w-6xl px-10 flex flex-col items-center">
                            <div className="text-center mb-10">
                                <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">{previewMedia.color.name}</h2>
                                <p className="text-blue-500 font-black uppercase tracking-[0.5em] mt-4 italic">Live Visual Discovery</p>
                            </div>

                            <div className="relative w-full aspect-video rounded-[48px] overflow-hidden bg-black shadow-2xl border-4 border-white/5 animate-in zoom-in-95 duration-700">
                                {currentMedia?.type === 'image' ? (
                                    <img src={currentMedia.url} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full aspect-video">
                                        <iframe
                                            className="w-full h-full"
                                            src={getEmbedUrl(currentMedia?.url || '')}
                                            title="Video Preview"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 mt-12 overflow-x-auto max-w-full pb-4 scrollbar-hide">
                                {previewMedia.color.media.map((item, id) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setPreviewMedia({ ...previewMedia, initialIdx: id })}
                                        className={`w-32 h-20 rounded-2xl overflow-hidden cursor-pointer border-4 transition-all duration-300 ${previewMedia.initialIdx === id ? 'border-orange-500 scale-105 shadow-xl shadow-orange-500/20' : 'border-white/5 opacity-50 hover:opacity-100'}`}
                                    >
                                        {item.type === 'image' ? (
                                            <img src={item.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                <Play size={20} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
