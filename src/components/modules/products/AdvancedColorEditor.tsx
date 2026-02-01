'use client';

import React, { useState } from 'react';
import { Box, Check, Copy, Palette, Trash2, Upload, LayoutList, Plus, ChevronRight, ChevronDown, Eye, Play, Film, X, Minus, GripVertical, Star, Pipette, Maximize2 } from 'lucide-react';
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
    allModels: VehicleModel[];
    lastSavedAt?: number;
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
                    <div className="w-full h-full relative">
                        {/* Try to show Thumbnail if YouTube */}
                        {(() => {
                            // Define logic inline or call helper if hoisted. 
                            // Since helper is inside default function, we might need to move it out or dupe logic.
                            // For simplicity in this chunk, I'll inline basic extraction or assume typical YouTube patterns.
                            let thumb = null;
                            if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
                                const vId = item.url.split('v=')[1]?.split('&')[0] || item.url.split('/').pop();
                                if (vId) thumb = `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;
                            }

                            if (thumb) {
                                return (
                                    <>
                                        <img src={thumb} className="w-full h-full object-cover opacity-80" />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <Play size={24} className="text-white fill-white" />
                                        </div>
                                    </>
                                )
                            }

                            return (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-purple-600/20" />
                                    <Play size={24} className="text-white fill-white relative z-10" />
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Drag Handle - Only for owned media */}
            {!item.isShared && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-1 left-1 p-1 bg-black/50 rounded-lg opacity-0 group-hover/asset:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
                >
                    <GripVertical size={10} className="text-white" />
                </div>
            )}

            {!item.isShared && (
                <button
                    onClick={onDelete}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/asset:opacity-100 transition-opacity shadow-lg"
                >
                    <Minus size={12} strokeWidth={3} />
                </button>
            )}
        </div>
    );
}

export default function AdvancedColorEditor({
    selectedModel,
    colors,
    onAddColor,
    onUpdateColor,
    onDeleteColor,
    allModels,
    lastSavedAt = 0
}: AdvancedColorEditorProps) {
    const modelVariants = selectedModel?.variants || [];
    const [isModelExpanded, setIsModelExpanded] = useState(true);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [previewMedia, setPreviewMedia] = useState<{ color: ModelColor, initialIdx: number, isShared?: boolean } | null>(null);
    const initialColorsRef = React.useRef<ModelColor[]>([]);

    // Capture baseline colors for Dirty tracking
    React.useEffect(() => {
        if (selectedModel && initialColorsRef.current.length === 0) {
            initialColorsRef.current = JSON.parse(JSON.stringify(colors));
        }
    }, [selectedModel]);

    // Reset baseline if switching to a different model OR if data was saved
    React.useEffect(() => {
        if (selectedModel) {
            initialColorsRef.current = JSON.parse(JSON.stringify(colors));
        }
    }, [selectedModel?.id, lastSavedAt]);

    // Find the first available video across all colors to use as a shared master video
    const sharedModelVideo = colors
        .flatMap(c => c.media || [])
        .find(m => m.type === 'video');

    const toggleColorCollapse = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleAddColor = () => {
        onAddColor({
            name: 'New Finish',
            code: '#000000',
            variantIds: [],
            primaryVariantIds: [],
            media: []
        });
    };

    const handleUpdateColorLocal = (colorId: string, field: string, value: any) => {
        onUpdateColor(colorId, field, value);
    };

    const handleInputBlur = (colorId: string, field: string, value: any, fallbackValue: any) => {
        if (!value || value.trim() === '') {
            onUpdateColor(colorId, field, fallbackValue);
        }
    };

    const isColorDirty = (color: ModelColor) => {
        const initial = initialColorsRef.current.find(c => c.id === color.id);
        if (!initial) return false;
        const initialPrimary = (initial.primaryVariantIds || []).join(',');
        const currentPrimary = (color.primaryVariantIds || []).join(',');
        return initial.name !== color.name || initial.code !== color.code || initialPrimary !== currentPrimary;
    };

    // Reset baseline if switching to a different model
    React.useEffect(() => {
        if (selectedModel) {
            initialColorsRef.current = JSON.parse(JSON.stringify(colors));
        }
    }, [selectedModel?.id]);

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

    const setPrimaryForVariant = (variantId: string, colorId: string, enable: boolean) => {
        colors.forEach(c => {
            const current = c.primaryVariantIds || [];
            const has = current.includes(variantId);

            if (c.id === colorId) {
                const next = enable
                    ? Array.from(new Set([...current, variantId]))
                    : current.filter(id => id !== variantId);
                if (next.length !== current.length) {
                    onUpdateColor(c.id, 'primaryVariantIds', next);
                }
                return;
            }

            if (enable && has) {
                onUpdateColor(c.id, 'primaryVariantIds', current.filter(id => id !== variantId));
            }
        });
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
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

    const getYoutubeThumbnail = (url: string) => {
        if (!url) return null;
        let videoId = null;
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1]?.split('?')[0];
        }

        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
        return null;
    };

    const handlePickColor = async (colorId: string, mode: 'primary' | 'secondary' = 'primary') => {
        // @ts-ignore - EyeDropper is a modern browser API
        if (window.EyeDropper) {
            try {
                // @ts-ignore
                const eyeDropper = new window.EyeDropper();
                const result = await eyeDropper.open();
                const hex = result.sRGBHex;

                const color = colors.find(c => c.id === colorId);
                if (!color) return;

                const [pri, sec] = (color.code || '').split(',').map(s => s.trim());

                let newCode = hex;
                if (mode === 'primary') {
                    if (sec) newCode = `${hex},${sec}`;
                    else newCode = hex;
                } else {
                    newCode = `${pri || '#000000'},${hex}`;
                }

                handleUpdateColorLocal(colorId, 'code', newCode);
            } catch (e) {
                console.log('EyeDropper cancelled or failed', e);
            }
        } else {
            alert('Your browser does not support the EyeDropper API. Please use the manual color picker.');
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
                            {colors.map((color) => {
                                const isExpanded = expandedIds.includes(color.id);

                                // Logic: If this color has no video, it can inherit the shared model video
                                const hasOwnVideo = color.media?.some(m => m.type === 'video');
                                const colorMediaWithFallback = [...(color.media || [])];
                                if (!hasOwnVideo && sharedModelVideo) {
                                    colorMediaWithFallback.push({ ...sharedModelVideo, isShared: true });
                                }

                                // Change Tracking
                                const isDirty = isColorDirty(color);

                                return (
                                    <div key={color.id} className="relative group/color">
                                        {/* Horizontal Branch Line */}
                                        <div className="absolute -left-[30px] top-[32px] w-[30px] h-[2px] bg-orange-500/20 group-hover/color:bg-orange-500/40 transition-colors blur-[0.5px]" />

                                        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-white/5 overflow-hidden transition-all duration-500 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 relative">
                                            {/* Dirty Indicator */}
                                            {isDirty && (
                                                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-amber-500 text-[8px] text-white font-black uppercase tracking-widest rounded-full shadow-lg z-30 animate-in fade-in zoom-in duration-300">
                                                    Unsaved changes
                                                </div>
                                            )}
                                            <div className="px-6 py-4 flex items-center justify-between">
                                                <div className="flex items-center gap-6 w-full">
                                                    {/* Color Identity & Media Launch */}
                                                    <div className="flex flex-col items-center gap-3 shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            {(() => {
                                                                const firstImgIdx = colorMediaWithFallback.findIndex(m => m.type === 'image');
                                                                const firstVidIdx = colorMediaWithFallback.findIndex(m => m.type === 'video');
                                                                const firstImg = firstImgIdx !== -1 ? colorMediaWithFallback[firstImgIdx] : null;
                                                                const firstVid = firstVidIdx !== -1 ? colorMediaWithFallback[firstVidIdx] : null;

                                                                if (!firstImg && !firstVid) {
                                                                    return (
                                                                        <div
                                                                            className="w-16 h-16 rounded-2xl shadow-2xl border-2 border-white/10 overflow-hidden transition-all duration-500"
                                                                            style={{ backgroundColor: color.code }}
                                                                        />
                                                                    );
                                                                }

                                                                return (
                                                                    <>
                                                                        {firstImg && (
                                                                            <div
                                                                                onClick={() => setPreviewMedia({ color: { ...color, media: colorMediaWithFallback }, initialIdx: firstImgIdx })}
                                                                                className={`relative ${firstVid ? 'w-14 h-14' : 'w-16 h-16'} rounded-2xl shadow-xl border-2 border-blue-500/30 cursor-pointer hover:scale-105 active:scale-95 overflow-hidden transition-all duration-500 group/hero`}
                                                                            >
                                                                                <img src={firstImg.url} alt="Gallery Preview" className="w-full h-full object-cover" />
                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/hero:opacity-100 flex items-center justify-center transition-opacity">
                                                                                    <Eye className="text-white" size={firstVid ? 16 : 24} />
                                                                                </div>
                                                                                <div className="absolute top-1 right-1 w-4 h-4 bg-white/10 backdrop-blur-md rounded border border-white/20 flex items-center justify-center">
                                                                                    <Palette size={8} className="text-white/80" />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {firstVid && (
                                                                            <div
                                                                                onClick={() => setPreviewMedia({ color: { ...color, media: colorMediaWithFallback }, initialIdx: firstVidIdx })}
                                                                                className={`relative ${firstImg ? 'w-14 h-14' : 'w-16 h-16'} rounded-2xl shadow-xl border-2 border-blue-500/30 cursor-pointer hover:scale-105 active:scale-95 overflow-hidden transition-all duration-500 group/hero bg-slate-800`}
                                                                            >
                                                                                <div className="w-full h-full flex items-center justify-center">
                                                                                    <Play className="text-white opacity-80" size={firstImg ? 20 : 32} />
                                                                                </div>
                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/hero:opacity-100 flex items-center justify-center transition-opacity">
                                                                                    <Film className="text-white" size={firstImg ? 16 : 24} />
                                                                                </div>
                                                                                <div className="absolute top-1 right-1 w-4 h-4 bg-white/10 backdrop-blur-md rounded border border-white/20 flex items-center justify-center">
                                                                                    <Film size={8} className="text-white/80" />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        <button
                                                            onClick={() => colorMediaWithFallback.length > 0 && setPreviewMedia({ color: { ...color, media: colorMediaWithFallback }, initialIdx: 0 })}
                                                            disabled={colorMediaWithFallback.length === 0}
                                                            className={`text-[9px] font-black uppercase tracking-widest italic flex items-center gap-2 transition-colors ${colorMediaWithFallback.length > 0 ? 'text-blue-500 hover:text-blue-600' : 'text-slate-300 opacity-50 cursor-not-allowed'}`}
                                                        >
                                                            Launch Discovery
                                                        </button>
                                                    </div>

                                                    {/* Name & Core Specs */}
                                                    <div className="flex flex-col flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={color.name}
                                                                onChange={(e) => handleUpdateColorLocal(color.id, 'name', e.target.value)}
                                                                onFocus={(e) => e.target.select()}
                                                                onBlur={(e) => handleInputBlur(color.id, 'name', e.target.value, 'New Finish')}
                                                                className="text-xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 hover:text-orange-500 transition-colors uppercase tracking-tight w-48 italic"
                                                            />
                                                            <select
                                                                value={color.finish || ''}
                                                                onChange={(e) => handleUpdateColorLocal(color.id, 'finish', e.target.value || undefined)}
                                                                className="bg-slate-100 dark:bg-white/5 border-none text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-lg focus:ring-0 cursor-pointer"
                                                            >
                                                                <option value="">UNCATEGORIZED</option>
                                                                <option value="MATT">MATT</option>
                                                                <option value="GLOSSY">GLOSSY</option>
                                                                <option value="METALLIC">METALLIC</option>
                                                                <option value="SATIN">SATIN</option>
                                                            </select>
                                                            <div className="flex gap-1.5 opacity-20">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                <div className="w-2 h-2 rounded-full bg-blue-500/50 scale-150 animate-pulse" />
                                                            </div>
                                                        </div>

                                                        {/* Variant Association Tags */}
                                                        {color.variantIds && color.variantIds.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {color.variantIds.map(vid => {
                                                                    const vName = modelVariants.find(v => v.id === vid)?.name || 'Unknown';
                                                                    return (
                                                                        <span key={vid} className="px-1.5 py-0.5 bg-blue-500/10 text-[7px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest rounded border border-blue-500/20">
                                                                            {vName}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 group/picker">
                                                                <div
                                                                    className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-sm overflow-hidden p-0 relative shrink-0"
                                                                    style={{ background: color.code.includes(',') ? `linear-gradient(135deg, ${color.code.split(',')[0]} 50%, ${color.code.split(',')[1]} 50%)` : color.code }}
                                                                >
                                                                    {/* Input for Primary (Hidden Color Picker) */}
                                                                    <input
                                                                        type="color"
                                                                        value={color.code.split(',')[0].trim()}
                                                                        onChange={(e) => {
                                                                            const sec = color.code.split(',')[1];
                                                                            handleUpdateColorLocal(color.id, 'code', sec ? `${e.target.value},${sec}` : e.target.value);
                                                                        }}
                                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                                        title="Click to Pick Primary Color"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1.5 ml-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={color.code.split(',')[0].trim()}
                                                                            onChange={(e) => {
                                                                                const sec = color.code.split(',')[1];
                                                                                handleUpdateColorLocal(color.id, 'code', sec ? `${e.target.value},${sec}` : e.target.value);
                                                                            }}
                                                                            onFocus={(e) => e.target.select()}
                                                                            className="text-[10px] font-black text-slate-800 dark:text-slate-200 font-mono tracking-widest uppercase bg-transparent border-none focus:ring-0 p-0 w-16"
                                                                        />
                                                                        <button
                                                                            onClick={() => handlePickColor(color.id, 'primary')}
                                                                            className="p-1 text-slate-300 hover:text-blue-500 bg-slate-50 dark:bg-white/5 rounded transition-colors"
                                                                            title="Pick Primary Hex"
                                                                        >
                                                                            <Pipette size={10} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={color.code.split(',')[1]?.trim() || ''}
                                                                            placeholder="DUAL TONE"
                                                                            onChange={(e) => {
                                                                                const pri = color.code.split(',')[0].trim();
                                                                                const val = e.target.value;
                                                                                handleUpdateColorLocal(color.id, 'code', val ? `${pri},${val}` : pri);
                                                                            }}
                                                                            onFocus={(e) => e.target.select()}
                                                                            className="text-[10px] font-bold text-slate-400 focus:text-slate-900 dark:focus:text-white font-mono tracking-widest uppercase bg-transparent border-b border-dashed border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-0 p-0 w-16 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                                                        />
                                                                        <button
                                                                            onClick={() => handlePickColor(color.id, 'secondary')}
                                                                            className="p-1 text-slate-300 hover:text-orange-500 bg-slate-50 dark:bg-white/5 rounded transition-colors"
                                                                            title="Pick Secondary Hex"
                                                                        >
                                                                            <Pipette size={10} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Identity Branch</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Control Buttons (Row) */}
                                                <div className="flex items-center gap-3 border-l border-slate-100 dark:border-white/5 pl-10 shrink-0">
                                                    <button
                                                        onClick={() => toggleColorCollapse(color.id)}
                                                        className={`p-4 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-2xl transition-all group/btn ${isExpanded ? 'rotate-180' : ''}`}
                                                        title={isExpanded ? "Collapse" : "Expand"}
                                                    >
                                                        <ChevronDown size={20} className="transition-transform" />
                                                    </button>
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
                                                        title="Delete Finish"
                                                    >
                                                        <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Collapsible Content */}
                                            {isExpanded && (
                                                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
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
                                                                        items={colorMediaWithFallback.map(m => m.id)}
                                                                        strategy={horizontalListSortingStrategy}
                                                                    >
                                                                        {colorMediaWithFallback.map((item, idx) => (
                                                                            <div key={item.id} className="relative group/asset-container">
                                                                                <SortableMediaItem
                                                                                    item={item}
                                                                                    idx={idx}
                                                                                    onPreview={() => setPreviewMedia({ color: { ...color, media: colorMediaWithFallback }, initialIdx: idx })}
                                                                                    onDelete={() => handleUpdateColorLocal(color.id, 'media', color.media.filter(i => i.id !== item.id))}
                                                                                />
                                                                                {item.isShared ? (
                                                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-orange-500 text-[6px] text-white font-black uppercase tracking-tighter rounded-full shadow-lg z-30 flex items-center gap-1">
                                                                                        <ChevronRight size={6} strokeWidth={4} /> Shared
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-blue-600 text-[6px] text-white font-black uppercase tracking-tighter rounded-full shadow-lg z-30 flex items-center gap-1">
                                                                                        <Upload size={6} strokeWidth={4} /> Upl
                                                                                    </div>
                                                                                )}
                                                                            </div>
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
                                                                    const isPrimary = (color.primaryVariantIds || []).includes(v.id);
                                                                    const hasVariantMedia = (color.variantOverrides?.[v.id]?.media?.length || 0) > 0;
                                                                    const variantMedia = hasVariantMedia
                                                                        ? color.variantOverrides![v.id]!.media!
                                                                        : colorMediaWithFallback;

                                                                    return (
                                                                        <div key={v.id} className="flex flex-col gap-3">
                                                                            <div className="flex items-center justify-between group/var-row">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const currentIds = color.variantIds || [];
                                                                                        const newIds = isSelected ? currentIds.filter(id => id !== v.id) : [...currentIds, v.id];
                                                                                        handleUpdateColorLocal(color.id, 'variantIds', newIds);

                                                                                        if (isSelected) {
                                                                                            if (isPrimary) {
                                                                                                setPrimaryForVariant(v.id, color.id, false);
                                                                                            }
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
                                                                                    <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm transition-all">
                                                                                        <button
                                                                                            onClick={() => setPrimaryForVariant(v.id, color.id, !isPrimary)}
                                                                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${isPrimary
                                                                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                                                                : 'text-slate-400 hover:text-orange-500 hover:bg-white dark:hover:bg-white/10'
                                                                                                }`}
                                                                                            title={isPrimary ? 'Primary - This photo will represent this color in the Catalog' : 'Designate as Primary Photo'}
                                                                                        >
                                                                                            <Star size={10} fill={isPrimary ? 'currentColor' : 'none'} />
                                                                                            {isPrimary && <span className="text-[7px] font-black uppercase tracking-tighter">Primary</span>}
                                                                                        </button>
                                                                                        <div className="w-[1px] h-3 bg-slate-200 dark:bg-white/10" />
                                                                                        <label
                                                                                            className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                                                                                            title="Upload Photo specific to this Variant"
                                                                                        >
                                                                                            <Plus size={12} />
                                                                                            <input
                                                                                                type="file" className="hidden" accept="image/*"
                                                                                                onChange={(e) => {
                                                                                                    const file = e.target.files?.[0];
                                                                                                    if (file) {
                                                                                                        const reader = new FileReader();
                                                                                                        reader.onloadend = () => {
                                                                                                            const newItem = { id: Math.random().toString(), type: 'image' as const, url: reader.result as string };
                                                                                                            const currentOverrides = color.variantOverrides?.[v.id] || {};
                                                                                                            const newMedia = [...(currentOverrides.media || []), newItem];
                                                                                                            handleUpdateColorLocal(color.id, 'variantOverrides', {
                                                                                                                ...(color.variantOverrides || {}),
                                                                                                                [v.id]: { ...currentOverrides, media: newMedia }
                                                                                                            });
                                                                                                        };
                                                                                                        reader.readAsDataURL(file);
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                        </label>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const currentIds = color.variantIds || [];
                                                                                                handleUpdateColorLocal(color.id, 'variantIds', currentIds.filter(id => id !== v.id));
                                                                                            }}
                                                                                            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:bg-white/10 rounded-lg transition-all"
                                                                                            title="Detach Variant from this Color"
                                                                                        >
                                                                                            <X size={12} />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {isSelected && variantMedia.length > 0 && (
                                                                                <div className="flex flex-col gap-2 ml-4 border-l-2 border-blue-500/20 pl-4">
                                                                                    {!hasVariantMedia && (
                                                                                        <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic mb-1 flex items-center gap-1">
                                                                                            <Box size={8} /> Syncing from Color Master
                                                                                        </p>
                                                                                    )}
                                                                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                                                        {variantMedia.map((item) => (
                                                                                            <div key={item.id} className="relative group/var-asset flex-shrink-0">
                                                                                                <div
                                                                                                    onClick={() => setPreviewMedia({ color: { ...color, media: variantMedia }, initialIdx: variantMedia.indexOf(item) })}
                                                                                                    className={`w-12 h-12 rounded-lg bg-slate-50 dark:bg-white/5 border ${!hasVariantMedia ? 'border-blue-500/30' : 'border-slate-100 dark:border-white/10'} overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all`}
                                                                                                >
                                                                                                    {item.type === 'image' ? (
                                                                                                        <img src={item.url} className="w-full h-full object-cover" />
                                                                                                    ) : (
                                                                                                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                                                                            <Play size={12} className="text-white/50" />
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                                {hasVariantMedia && (
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
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

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
                return (
                    <div className="fixed inset-0 z-[999] bg-white/95 dark:bg-slate-950/95 flex flex-col items-center justify-center backdrop-blur-xl animate-in fade-in duration-500">
                        <button
                            onClick={() => setPreviewMedia(null)}
                            className="absolute top-10 right-10 p-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-full transition-all border border-slate-200 dark:border-white/10 shadow-xl"
                        >
                            <X size={32} />
                        </button>

                        <div className="w-full max-w-6xl px-10 flex flex-col items-center">
                            <div className="text-center mb-10">
                                <h2 className="text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{previewMedia.color.name}</h2>
                                <p className="text-blue-500 font-black uppercase tracking-[0.5em] mt-4 italic">Live Visual Discovery</p>
                            </div>

                            <div className="relative w-full aspect-video rounded-[48px] overflow-hidden bg-slate-50 dark:bg-black shadow-2xl border-4 border-slate-200 dark:border-white/5 animate-in zoom-in-95 duration-700 group/lightbox">
                                {currentMedia?.type === 'image' ? (
                                    <>
                                        <img src={currentMedia.url} className="w-full h-full object-contain" />
                                        {/* Floating Picker for accuracy */}
                                        <div className="absolute bottom-8 right-8 flex gap-4 opacity-0 group-hover/lightbox:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handlePickColor(previewMedia.color.id, 'primary')}
                                                className="flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
                                                title="Pick shade from anywhere on screen"
                                            >
                                                <Pipette size={20} />
                                                Pick Actual Shade
                                            </button>
                                            <button
                                                onClick={() => handlePickColor(previewMedia.color.id, 'secondary')}
                                                className="flex items-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 border border-white/10"
                                                title="Pick Dual Tone / Secondary Color"
                                            >
                                                <Pipette size={20} />
                                                Pick Secondary Frame
                                            </button>
                                        </div>
                                    </>
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
                                {previewMedia.color.media.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setPreviewMedia({ ...previewMedia, initialIdx: idx })}
                                        className={`w-32 h-20 rounded-2xl overflow-hidden cursor-pointer border-4 transition-all duration-300 ${previewMedia.initialIdx === idx ? 'border-orange-500 scale-105 shadow-xl shadow-orange-500/20' : 'border-slate-200 dark:border-white/5 opacity-50 hover:opacity-100'}`}
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
