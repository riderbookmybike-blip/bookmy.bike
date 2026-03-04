'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    Plus,
    X,
    RotateCcw,
    RotateCw,
    Crop as CropIcon,
    Check,
    Loader2,
    Video,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Expand,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export type MediaPurpose =
    | 'chassis'
    | 'engine'
    | 'sticker'
    | 'vehicle'
    | 'qc_video'
    | 'battery_number'
    | 'odometer'
    | 'other';

export interface GrnMediaItem {
    url: string;
    purpose: MediaPurpose;
    isVideo: boolean;
}

interface GrnMediaGalleryProps {
    entityId: string;
    items: GrnMediaItem[];
    onChange: (items: GrnMediaItem[]) => void;
}

const PURPOSE_LABELS: Record<MediaPurpose, string> = {
    chassis: 'Chassis',
    engine: 'Engine',
    sticker: 'Sticker',
    vehicle: 'Vehicle',
    qc_video: 'QC Video',
    battery_number: 'Battery No.',
    odometer: 'Odometer',
    other: 'Other',
};
const PURPOSE_OPTS: MediaPurpose[] = [
    'chassis',
    'engine',
    'sticker',
    'vehicle',
    'qc_video',
    'battery_number',
    'odometer',
    'other',
];

function centerAspectCrop(w: number, h: number, aspect: number): Crop {
    return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h), w, h);
}
interface Pending {
    id: string;
    name: string;
}

export default function GrnMediaGallery({ entityId, items, onChange }: GrnMediaGalleryProps) {
    const BUCKET = 'inv_assets';
    const [pending, setPending] = useState<Pending[]>([]);

    // ── Lightbox ──────────────────────────────────────────────────────────
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    const openLightbox = (idx: number) => setLightboxIdx(idx);
    const closeLightbox = () => setLightboxIdx(null);
    const lightboxPrev = () => setLightboxIdx(i => (i !== null ? Math.max(0, i - 1) : null));
    const lightboxNext = () => setLightboxIdx(i => (i !== null ? Math.min(items.length - 1, i + 1) : null));

    // keyboard nav for lightbox
    useEffect(() => {
        if (lightboxIdx === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') lightboxPrev();
            if (e.key === 'ArrowRight') lightboxNext();
            if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIdx]);

    // ── Crop/Rotate editor ────────────────────────────────────────────────
    const [editorOpen, setEditorOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [srcUrl, setSrcUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const [rotation, setRotation] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(
        () => () => {
            if (srcUrl) URL.revokeObjectURL(srcUrl);
        },
        [srcUrl]
    );

    // ── Upload ────────────────────────────────────────────────────────────
    const handleFiles = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files ?? []);
            if (!files.length) return;
            e.target.value = '';
            const supabase = createClient();
            const newPending: Pending[] = files.map(f => ({ id: crypto.randomUUID(), name: f.name }));
            setPending(prev => [...prev, ...newPending]);
            const uploaded: GrnMediaItem[] = [];
            await Promise.all(
                files.map(async (file, i) => {
                    const isVid = file.type.startsWith('video/');
                    const ext = file.name.split('.').pop() || (isVid ? 'mp4' : 'jpg');
                    const path = `${entityId}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
                    try {
                        const { error } = await supabase.storage
                            .from(BUCKET)
                            .upload(path, file, { contentType: file.type, upsert: true });
                        if (error) throw error;
                        const {
                            data: { publicUrl },
                        } = supabase.storage.from(BUCKET).getPublicUrl(path);
                        const name = file.name.toLowerCase();
                        let purpose: MediaPurpose = 'other';
                        if (name.includes('chassis') || name.includes('ch_')) purpose = 'chassis';
                        else if (name.includes('engine') || name.includes('eng')) purpose = 'engine';
                        else if (name.includes('stick')) purpose = 'sticker';
                        else if (name.includes('vehicle') || name.includes('bike')) purpose = 'vehicle';
                        else if (isVid) purpose = 'qc_video';
                        uploaded.push({ url: publicUrl, purpose, isVideo: isVid });
                    } catch {
                        toast.error(`Failed: ${file.name}`);
                    } finally {
                        setPending(prev => prev.filter(p => p.id !== newPending[i].id));
                    }
                })
            );
            if (uploaded.length) onChange([...items, ...uploaded]);
        },
        [entityId, items, onChange]
    );

    const setTag = (idx: number, purpose: MediaPurpose) =>
        onChange(items.map((it, i) => (i === idx ? { ...it, purpose } : it)));
    const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

    // ── Open crop editor ──────────────────────────────────────────────────
    const openEditor = (idx: number) => {
        const item = items[idx];
        if (item.isVideo) return;
        fetch(item.url)
            .then(r => r.blob())
            .then(blob => {
                if (srcUrl) URL.revokeObjectURL(srcUrl);
                setSrcUrl(URL.createObjectURL(blob));
                setCrop(undefined);
                setCompletedCrop(undefined);
                setRotation(0);
                setEditIndex(idx);
                setEditorOpen(true);
            })
            .catch(() => toast.error('Cannot edit this image'));
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
        const c = centerAspectCrop(w, h, w / h);
        setCrop(c);
        setCompletedCrop(c);
    }, []);

    // ── Save crop ─────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        const img = imgRef.current,
            canvas = canvasRef.current;
        if (!img || !canvas || !completedCrop || editIndex === null) return;
        setIsSaving(true);
        try {
            const sx = img.naturalWidth / img.width,
                sy = img.naturalHeight / img.height;
            const cx = (completedCrop.x ?? 0) * sx,
                cy = (completedCrop.y ?? 0) * sy;
            const cw = (completedCrop.width ?? img.naturalWidth) * sx,
                ch = (completedCrop.height ?? img.naturalHeight) * sy;
            const rad = (rotation * Math.PI) / 180;
            const sin = Math.abs(Math.sin(rad)),
                cos = Math.abs(Math.cos(rad));
            const rw = Math.round(cw * cos + ch * sin),
                rh = Math.round(cw * sin + ch * cos);
            canvas.width = rw;
            canvas.height = rh;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, rw, rh);
            const tmp = document.createElement('canvas');
            tmp.width = cw;
            tmp.height = ch;
            tmp.getContext('2d')!.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
            ctx.save();
            ctx.translate(rw / 2, rh / 2);
            ctx.rotate(rad);
            ctx.drawImage(tmp, -cw / 2, -ch / 2);
            ctx.restore();
            const blob = await new Promise<Blob>((res, rej) =>
                canvas.toBlob(b => (b ? res(b) : rej(new Error('empty'))), 'image/webp', 0.92)
            );
            const supabase = createClient();
            const path = `${entityId}/edit_${Date.now()}.webp`;
            const { error } = await supabase.storage
                .from(BUCKET)
                .upload(path, blob, { contentType: 'image/webp', upsert: true });
            if (error) throw error;
            const {
                data: { publicUrl },
            } = supabase.storage.from(BUCKET).getPublicUrl(path);
            onChange(items.map((it, i) => (i === editIndex ? { ...it, url: publicUrl } : it)));
            toast.success('Image saved');
            setEditorOpen(false);
            if (srcUrl) {
                URL.revokeObjectURL(srcUrl);
                setSrcUrl(null);
            }
        } catch {
            toast.error('Failed to save');
        } finally {
            setIsSaving(false);
        }
    }, [completedCrop, rotation, editIndex, items, onChange, srcUrl, entityId]);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <>
            {/* Gallery strip */}
            <div className="flex flex-wrap gap-3 items-start">
                {items.map((item, idx) => (
                    <div key={`${item.url}-${idx}`} className="flex flex-col items-center gap-1.5">
                        {/* Thumbnail — click opens lightbox */}
                        <div
                            className="relative group w-24 h-24 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 overflow-hidden cursor-pointer"
                            onClick={() => openLightbox(idx)}
                        >
                            {item.isVideo ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800">
                                    <Video size={24} className="text-slate-400" />
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                        Video
                                    </span>
                                </div>
                            ) : (
                                <img
                                    src={item.url}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                            )}

                            {/* Expand hint on hover */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Expand size={18} className="text-white" />
                            </div>

                            {/* Tagged badge */}
                            {item.purpose !== 'other' && (
                                <div className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[7px] font-black text-center py-0.5 uppercase tracking-wide">
                                    {PURPOSE_LABELS[item.purpose]}
                                </div>
                            )}

                            {/* Remove */}
                            <button
                                type="button"
                                onClick={e => {
                                    e.stopPropagation();
                                    remove(idx);
                                }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            >
                                <X size={9} />
                            </button>

                            {/* Edit/Crop button (images only) */}
                            {!item.isVideo && (
                                <button
                                    type="button"
                                    onClick={e => {
                                        e.stopPropagation();
                                        openEditor(idx);
                                    }}
                                    className="absolute top-1 left-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                >
                                    <CropIcon size={9} />
                                </button>
                            )}
                        </div>

                        {/* Tag dropdown */}
                        <div className="relative">
                            <select
                                value={item.purpose}
                                onChange={e => setTag(idx, e.target.value as MediaPurpose)}
                                onClick={e => e.stopPropagation()}
                                className="w-24 h-6 rounded-lg text-[8px] font-black uppercase appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 pl-2 pr-5 outline-none focus:border-emerald-400 cursor-pointer"
                            >
                                {PURPOSE_OPTS.map(p => (
                                    <option key={p} value={p}>
                                        {PURPOSE_LABELS[p]}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={8}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                        </div>
                    </div>
                ))}

                {/* Upload placeholders */}
                {pending.map(p => (
                    <div
                        key={p.id}
                        className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-center"
                    >
                        <Loader2 size={20} className="animate-spin text-emerald-500" />
                    </div>
                ))}

                {/* Add button */}
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group">
                    <Plus size={20} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500">
                        Add Photos
                    </span>
                    <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFiles} />
                </label>
            </div>

            {/* Hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ── Lightbox ──────────────────────────────────────────────── */}
            {lightboxIdx !== null && items[lightboxIdx] && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center" onClick={closeLightbox}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />

                    {/* Image / Video */}
                    <div
                        className="relative z-10 max-w-[92vw] max-h-[88dvh] flex flex-col items-center gap-3"
                        onClick={e => e.stopPropagation()}
                    >
                        {items[lightboxIdx].isVideo ? (
                            <video
                                src={items[lightboxIdx].url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[78dvh] rounded-2xl shadow-2xl"
                            />
                        ) : (
                            <img
                                src={items[lightboxIdx].url}
                                alt=""
                                className="max-w-full max-h-[78dvh] rounded-2xl shadow-2xl object-contain select-none"
                            />
                        )}

                        {/* Tag label */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest">
                            <span>{PURPOSE_LABELS[items[lightboxIdx].purpose]}</span>
                            <span className="text-white/40">•</span>
                            <span className="text-white/50">
                                {lightboxIdx + 1} / {items.length}
                            </span>
                        </div>

                        {/* Edit button */}
                        {!items[lightboxIdx].isVideo && (
                            <button
                                type="button"
                                onClick={() => {
                                    closeLightbox();
                                    openEditor(lightboxIdx);
                                }}
                                className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest transition-colors"
                            >
                                <CropIcon size={11} /> Edit
                            </button>
                        )}
                    </div>

                    {/* Prev arrow */}
                    {lightboxIdx > 0 && (
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                lightboxPrev();
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}

                    {/* Next arrow */}
                    {lightboxIdx < items.length - 1 && (
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                lightboxNext();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    )}

                    {/* Close */}
                    <button
                        type="button"
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ── Crop / Rotate modal ───────────────────────────────────── */}
            {editorOpen && srcUrl && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                        onClick={() => setEditorOpen(false)}
                    />
                    <div className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[95dvh]">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <CropIcon size={12} className="text-emerald-600" />
                                </div>
                                <p className="text-xs font-black text-slate-900 dark:text-white">Edit Photo</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditorOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                                <X size={14} className="text-slate-500" />
                            </button>
                        </div>
                        {/* Crop workspace */}
                        <div className="flex-1 overflow-auto p-3 flex items-center justify-center bg-slate-950 min-h-0">
                            <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                                <img
                                    ref={imgRef}
                                    src={srcUrl}
                                    alt="Edit"
                                    onLoad={onImageLoad}
                                    style={{
                                        transform: `rotate(${rotation}deg)`,
                                        maxHeight: '50dvh',
                                        maxWidth: '100%',
                                        objectFit: 'contain',
                                        transition: 'transform 0.2s ease',
                                    }}
                                />
                            </ReactCrop>
                        </div>
                        {/* Controls */}
                        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRotation(r => r - 90)}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 hover:text-emerald-600 hover:border-emerald-400 transition-colors"
                                >
                                    <RotateCcw size={13} />
                                </button>
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    step="1"
                                    value={rotation}
                                    onChange={e => setRotation(Number(e.target.value))}
                                    className="flex-1 h-1.5 rounded-full appearance-none accent-emerald-500 bg-slate-200 dark:bg-white/10 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={() => setRotation(r => r + 90)}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 hover:text-emerald-600 hover:border-emerald-400 transition-colors"
                                >
                                    <RotateCw size={13} />
                                </button>
                                <span className="text-[9px] font-black text-emerald-600 w-8 text-center">
                                    {rotation}°
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRotation(0);
                                        setCrop(undefined);
                                        setCompletedCrop(undefined);
                                    }}
                                    className="text-[9px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { label: 'Free', aspect: undefined },
                                    { label: '1:1', aspect: 1 },
                                    { label: '4:3', aspect: 4 / 3 },
                                    { label: '16:9', aspect: 16 / 9 },
                                ].map(opt => (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() => {
                                            const img = imgRef.current;
                                            if (!img) return;
                                            if (!opt.aspect) {
                                                setCrop(undefined);
                                                return;
                                            }
                                            const c = centerAspectCrop(img.width, img.height, opt.aspect);
                                            setCrop(c);
                                            setCompletedCrop(c);
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleSave}
                                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check size={13} /> Save & Upload
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
