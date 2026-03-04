'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    Upload,
    X,
    RotateCcw,
    RotateCw,
    Crop as CropIcon,
    Check,
    Loader2,
    Video,
    Image as ImageIcon,
    Pencil,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface GrnMediaUploaderProps {
    label: string;
    /** Entity ID — e.g. po_id, stock_id. Used as folder in inv_assets bucket */
    entityId: string;
    /** Purpose slug — becomes the filename prefix e.g. 'chassis', 'engine', 'qc_video' */
    purpose: string;
    accept?: string;
    optional?: boolean;
    value?: string;
    onUpload: (url: string) => void;
}

function centerAspectCrop(width: number, height: number, aspect: number): Crop {
    return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height);
}

export default function GrnMediaUploader({
    label,
    entityId,
    purpose,
    accept = 'image/*',
    optional = false,
    value,
    onUpload,
}: GrnMediaUploaderProps) {
    // Flat path: inv_assets/{entityId}/{purpose}_{timestamp}.ext
    const BUCKET = 'inv_assets';
    const makePath = (ext: string) => `${entityId}/${purpose}_${Date.now()}.${ext}`;
    const isVideo = accept.includes('video') || purpose === 'qc_video';

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Crop/rotate editor state
    const [editorOpen, setEditorOpen] = useState(false);
    const [srcUrl, setSrcUrl] = useState<string | null>(null); // local object URL for editing
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const [rotation, setRotation] = useState(0); // degrees
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Clean up blob URLs on unmount
    useEffect(() => {
        return () => {
            if (srcUrl) URL.revokeObjectURL(srcUrl);
        };
    }, [srcUrl]);

    // ── Handle file selection ──────────────────────────────────────────────────
    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = '';

            if (isVideo) {
                // Direct upload for videos
                setIsUploading(true);
                try {
                    const supabase = createClient();
                    const ext = file.name.split('.').pop() || 'mp4';
                    const path = makePath(ext);
                    const { error } = await supabase.storage
                        .from(BUCKET)
                        .upload(path, file, { contentType: file.type, upsert: true });
                    if (error) throw error;
                    const {
                        data: { publicUrl },
                    } = supabase.storage.from(BUCKET).getPublicUrl(path);
                    onUpload(publicUrl);
                    toast.success(`${label} uploaded`);
                } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'Upload failed');
                } finally {
                    setIsUploading(false);
                }
                return;
            }

            // Image → open crop/rotate editor
            if (srcUrl) URL.revokeObjectURL(srcUrl);
            const objectUrl = URL.createObjectURL(file);
            setSrcUrl(objectUrl);
            setCrop(undefined);
            setCompletedCrop(undefined);
            setRotation(0);
            setEditorOpen(true);
        },
        [isVideo, entityId, purpose, label, onUpload, srcUrl]
    );

    // Set initial crop when image loads in editor
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        const initialCrop = centerAspectCrop(naturalWidth, naturalHeight, naturalWidth / naturalHeight);
        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
    }, []);

    // ── Apply crop+rotate, export to WebP blob, upload ────────────────────────
    const handleSaveEdit = useCallback(async () => {
        const img = imgRef.current;
        const canvas = canvasRef.current;
        if (!img || !canvas || !completedCrop) return;

        setIsSavingEdit(true);
        try {
            const scaleX = img.naturalWidth / img.width;
            const scaleY = img.naturalHeight / img.height;

            const cropX = (completedCrop.x ?? 0) * scaleX;
            const cropY = (completedCrop.y ?? 0) * scaleY;
            const cropW = (completedCrop.width ?? img.naturalWidth) * scaleX;
            const cropH = (completedCrop.height ?? img.naturalHeight) * scaleY;

            // We'll draw into an offscreen canvas applying rotation
            const rad = (rotation * Math.PI) / 180;
            const sin = Math.abs(Math.sin(rad));
            const cos = Math.abs(Math.cos(rad));

            // After rotation the output dims change
            const rotW = Math.round(cropW * cos + cropH * sin);
            const rotH = Math.round(cropW * sin + cropH * cos);

            canvas.width = rotW;
            canvas.height = rotH;

            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, rotW, rotH);

            // Create temp canvas to draw the cropped region
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = cropW;
            cropCanvas.height = cropH;
            const cropCtx = cropCanvas.getContext('2d')!;

            cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            // Draw cropped onto main canvas with rotation
            ctx.save();
            ctx.translate(rotW / 2, rotH / 2);
            ctx.rotate(rad);
            ctx.drawImage(cropCanvas, -cropW / 2, -cropH / 2);
            ctx.restore();

            const blob = await new Promise<Blob>((res, rej) =>
                canvas.toBlob(b => (b ? res(b) : rej(new Error('Canvas empty'))), 'image/webp', 0.92)
            );

            const supabase = createClient();
            const path = makePath('webp');
            const { error } = await supabase.storage
                .from(BUCKET)
                .upload(path, blob, { contentType: 'image/webp', upsert: true });
            if (error) throw error;

            const {
                data: { publicUrl },
            } = supabase.storage.from(BUCKET).getPublicUrl(path);

            onUpload(publicUrl);
            toast.success(`${label} saved`);
            setEditorOpen(false);
            if (srcUrl) {
                URL.revokeObjectURL(srcUrl);
                setSrcUrl(null);
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to save image');
        } finally {
            setIsSavingEdit(false);
        }
    }, [completedCrop, rotation, entityId, purpose, label, onUpload, srcUrl]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Upload tile */}
            <div className="flex flex-col gap-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {label} {optional && <span className="normal-case font-bold text-slate-300">(optional)</span>}
                </p>

                {value ? (
                    /* Preview state */
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 aspect-video flex items-center justify-center">
                        {isVideo ? (
                            <video
                                src={value}
                                className="w-full h-full object-contain"
                                controls={false}
                                muted
                                preload="metadata"
                            />
                        ) : (
                            <img src={value} alt={label} className="w-full h-full object-contain p-1" />
                        )}

                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!isVideo && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        // re-open editor with current uploaded URL (fetch as blob)
                                        fetch(value)
                                            .then(r => r.blob())
                                            .then(blob => {
                                                if (srcUrl) URL.revokeObjectURL(srcUrl);
                                                const url = URL.createObjectURL(blob);
                                                setSrcUrl(url);
                                                setCrop(undefined);
                                                setCompletedCrop(undefined);
                                                setRotation(0);
                                                setEditorOpen(true);
                                            })
                                            .catch(() => toast.error('Cannot re-edit this image'));
                                    }}
                                    className="p-2.5 bg-white text-slate-900 rounded-xl hover:bg-emerald-500 hover:text-white transition-colors shadow-lg"
                                    title="Edit (crop/rotate)"
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
                            <label
                                className="p-2.5 bg-white text-slate-900 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors shadow-lg cursor-pointer"
                                title="Replace"
                            >
                                <Upload size={14} />
                                <input
                                    type="file"
                                    hidden
                                    accept={accept}
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => onUpload('')}
                                className="p-2.5 bg-white text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors shadow-lg"
                                title="Remove"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Status badge */}
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Check size={8} /> Uploaded
                        </div>
                    </div>
                ) : (
                    /* Empty drop zone */
                    <label className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/30 aspect-video cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group">
                        {isUploading ? (
                            <Loader2 size={20} className="animate-spin text-emerald-500" />
                        ) : isVideo ? (
                            <Video
                                size={20}
                                className="text-slate-300 group-hover:text-emerald-400 transition-colors"
                            />
                        ) : (
                            <ImageIcon
                                size={20}
                                className="text-slate-300 group-hover:text-emerald-400 transition-colors"
                            />
                        )}
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                            {isUploading ? 'Uploading...' : isVideo ? 'Tap to upload video' : 'Tap to upload photo'}
                        </span>
                        <input type="file" hidden accept={accept} onChange={handleFileChange} disabled={isUploading} />
                    </label>
                )}
            </div>

            {/* Hidden canvas for export */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ── Crop / Rotate Modal ─────────────────────────────────────── */}
            {editorOpen && srcUrl && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                        onClick={() => setEditorOpen(false)}
                    />

                    {/* Panel */}
                    <div className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[95dvh]">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <CropIcon size={14} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Edit Photo
                                    </p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                        {label}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditorOpen(false)}
                                className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                                <X size={16} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Crop workspace */}
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 min-h-0">
                            <ReactCrop
                                crop={crop}
                                onChange={c => setCrop(c)}
                                onComplete={c => setCompletedCrop(c)}
                                className="max-w-full max-h-full"
                            >
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
                        <div className="px-5 py-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-3">
                            {/* Rotation */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Rotation
                                    </p>
                                    <span className="text-[9px] font-black text-emerald-600">{rotation}°</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRotation(r => r - 90)}
                                        className="p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 hover:text-emerald-600 hover:border-emerald-400 transition-colors"
                                    >
                                        <RotateCcw size={14} />
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
                                        className="p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 hover:text-emerald-600 hover:border-emerald-400 transition-colors"
                                    >
                                        <RotateCw size={14} />
                                    </button>
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
                            </div>

                            {/* Aspect ratio presets */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Crop Preset
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: 'Free', aspect: undefined },
                                        { label: '1:1', aspect: 1 },
                                        { label: '4:3', aspect: 4 / 3 },
                                        { label: '16:9', aspect: 16 / 9 },
                                        { label: '3:4', aspect: 3 / 4 },
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
                                            className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Save button */}
                            <button
                                type="button"
                                disabled={isSavingEdit}
                                onClick={handleSaveEdit}
                                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                            >
                                {isSavingEdit ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Check size={14} /> Save & Upload
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
