'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    Upload,
    Link as LinkIcon,
    Loader2,
    Image as ImageIcon,
    Check,
    Trash2,
    Star,
    Video,
    Plus,
    Copy,
    FileText,
    ZoomIn,
    RefreshCw,
    Maximize2,
    RotateCcw,
    Move,
    Eraser,
    AlertTriangle,
    ExternalLink,
    Crop,
    Ruler,
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { getProxiedUrl } from '@/lib/utils/urlHelper';

interface SKUMediaManagerProps {
    skuName: string;
    initialImages?: string[];
    initialVideos?: string[];
    initialPdfs?: string[];
    inheritedImages?: string[];
    inheritedVideos?: string[];
    inheritedPdfs?: string[];
    inheritedFrom?: string;
    initialPrimary?: string | null;
    initialZoomFactor?: number;
    initialIsFlipped?: boolean;
    initialOffsetX?: number;
    initialOffsetY?: number;
    onSave: (
        images: string[],
        videos: string[],
        pdfs: string[],
        primary: string | null,
        applyVideosToAll?: boolean,
        zoomFactor?: number,
        isFlipped?: boolean,
        offsetX?: number,
        offsetY?: number
    ) => void | Promise<void>;
    onClose: () => void;
}

export default function SKUMediaManager({
    skuName,
    initialImages = [],
    initialVideos = [],
    initialPdfs = [],
    inheritedImages = [],
    inheritedVideos = [],
    inheritedPdfs = [],
    inheritedFrom = 'Family',
    initialPrimary = null,
    initialZoomFactor = 1.0,
    initialIsFlipped = false,
    initialOffsetX = 0,
    initialOffsetY = 0,
    onSave,
    onClose,
}: SKUMediaManagerProps) {
    const [images, setImages] = useState<string[]>(initialImages);
    const [skuVideos, setSkuVideos] = useState<string[]>(initialVideos.filter(v => !inheritedVideos.includes(v)));
    const [selectedInheritedVideos, setSelectedInheritedVideos] = useState<string[]>(
        inheritedVideos.filter(v => initialVideos.includes(v))
    );
    const [skuPdfs, setSkuPdfs] = useState<string[]>(initialPdfs.filter(p => !inheritedPdfs.includes(p)));

    const [primaryImage, setPrimaryImage] = useState<string | null>(
        initialPrimary || (initialImages.length > 0 ? initialImages[0] : null)
    );
    const [applyVideosToAll, setApplyVideosToAll] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [videoInput, setVideoInput] = useState('');
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Alignment State
    const [zoomFactor, setZoomFactor] = useState(initialZoomFactor);
    const [isFlipped, setIsFlipped] = useState(initialIsFlipped);
    const [offsetX, setOffsetX] = useState(initialOffsetX);
    const [offsetY, setOffsetY] = useState(initialOffsetY);

    // Remove BG State
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [activeTab, setActiveTab] = useState<'alignment' | 'media'>('alignment');

    // Delete/Replace Confirmation State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        type: 'DELETE' | 'REPLACE';
        file?: File;
        title: string;
        message: React.ReactNode;
    }>({ isOpen: false, type: 'DELETE', title: '', message: '' });

    // Image Dimensions State
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [fileMeta, setFileMeta] = useState<{ type: string; size: string } | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [activeCrop, setActiveCrop] = useState<string | null>(null);
    const [contentPadding, setContentPadding] = useState(8); // Internal padding percentage

    // Load image dimensions + file metadata when primary image changes
    useEffect(() => {
        if (primaryImage) {
            const img = new Image();
            img.onload = () => {
                setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = getProxiedUrl(primaryImage);

            // Fetch file type & size via HEAD request
            fetch(getProxiedUrl(primaryImage), { method: 'HEAD' })
                .then(res => {
                    const contentType = res.headers.get('content-type') || '';
                    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
                    const ext = contentType.split('/').pop()?.toUpperCase() || '?';
                    const sizeStr = contentLength > 1048576
                        ? `${(contentLength / 1048576).toFixed(1)} MB`
                        : contentLength > 0
                            ? `${Math.round(contentLength / 1024)} KB`
                            : '?';
                    setFileMeta({ type: ext, size: sizeStr });
                })
                .catch(() => setFileMeta(null));
        } else {
            setImageDimensions(null);
            setFileMeta(null);
        }
    }, [primaryImage]);

    // Smart Crop: Auto-trim transparent pixels and optionally fit to aspect ratio
    const handleSmartCrop = async (targetAspectRatio?: number, cropLabel?: string) => {
        if (!primaryImage) return;
        setIsCropping(true);

        try {
            // Load image into canvas using proxy to avoid CORS
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = getProxiedUrl(primaryImage);
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);

            // Get image data to find content bounds
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const { data, width, height } = imageData;

            // Find content bounds (non-transparent pixels)
            let minX = width,
                minY = height,
                maxX = 0,
                maxY = 0;
            const alphaThreshold = 10; // Pixels with alpha < this are considered transparent

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const alpha = data[(y * width + x) * 4 + 3];
                    if (alpha > alphaThreshold) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            // If no content found, use full image
            if (minX > maxX || minY > maxY) {
                minX = 0;
                minY = 0;
                maxX = width - 1;
                maxY = height - 1;
            }

            // Add content padding (percentage)
            const paddingPx = Math.max(maxX - minX, maxY - minY) * (contentPadding / 100);
            minX = Math.max(0, minX - paddingPx);
            minY = Math.max(0, minY - paddingPx);
            maxX = Math.min(width - 1, maxX + paddingPx);
            maxY = Math.min(height - 1, maxY + paddingPx);

            let cropWidth = maxX - minX + 1;
            let cropHeight = maxY - minY + 1;
            let cropX = minX;
            let cropY = minY;

            // Adjust for target aspect ratio if provided
            if (targetAspectRatio) {
                const currentRatio = cropWidth / cropHeight;
                if (currentRatio > targetAspectRatio) {
                    // Wider than target, need more height
                    const newHeight = cropWidth / targetAspectRatio;
                    const heightDiff = newHeight - cropHeight;
                    cropY = Math.max(0, cropY - heightDiff / 2);
                    cropHeight = Math.min(height - cropY, newHeight);
                } else {
                    // Taller than target, need more width
                    const newWidth = cropHeight * targetAspectRatio;
                    const widthDiff = newWidth - cropWidth;
                    cropX = Math.max(0, cropX - widthDiff / 2);
                    cropWidth = Math.min(width - cropX, newWidth);
                }
            }

            // Create cropped canvas
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = Math.round(cropWidth);
            croppedCanvas.height = Math.round(cropHeight);
            const croppedCtx = croppedCanvas.getContext('2d')!;
            croppedCtx.drawImage(
                canvas,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                0,
                0,
                croppedCanvas.width,
                croppedCanvas.height
            );

            // Convert to blob and upload — prefer WebP for smaller files
            const blob = await new Promise<Blob>(resolve => {
                croppedCanvas.toBlob(b => resolve(b!), 'image/webp', 0.92);
            });

            const supabase = createClient();
            const fileName = `catalog/cropped_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;

            const { error: uploadError } = await supabase.storage.from('vehicles').upload(fileName, blob, {
                contentType: 'image/webp',
                upsert: false,
            });

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from('vehicles').getPublicUrl(fileName);

            // Replace current image with the cropped one
            const newImages = images.map(img => (img === primaryImage ? publicUrl : img));
            setImages(newImages);
            setPrimaryImage(publicUrl);
            setActiveCrop(cropLabel || null);
            toast.success(`Cropped to ${croppedCanvas.width}×${croppedCanvas.height}px`);
        } catch (err) {
            console.error('[Smart Crop] Error:', err);
            toast.error('Crop failed. Please try again.');
        } finally {
            setIsCropping(false);
        }
    };

    const handleRemoveBg = async () => {
        if (!primaryImage) return;
        setIsRemovingBg(true);
        try {
            const BG_TIMEOUT_MS = 120000;
            const MAX_BG_DIM = 1600;
            const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
                Promise.race([
                    promise,
                    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('BG removal timed out')), ms)),
                ]);

            const normalizeImageBlob = async (blob: Blob) => {
                try {
                    const img = await createImageBitmap(blob);
                    const maxDim = Math.max(img.width, img.height);
                    const needsResize = maxDim > MAX_BG_DIM;
                    const needsConvert = blob.type !== 'image/png' && blob.type !== 'image/webp';
                    if (!needsResize && !needsConvert) return blob;

                    const scale = needsResize ? MAX_BG_DIM / maxDim : 1;
                    const width = Math.max(1, Math.round(img.width * scale));
                    const height = Math.max(1, Math.round(img.height * scale));
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return blob;
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedBlob = await new Promise<Blob>((resolve, reject) => {
                        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Resize failed'))), blob.type === 'image/webp' ? 'image/webp' : 'image/png', 0.92);
                    });
                    return resizedBlob;
                } catch {
                    return blob;
                }
            };

            const { removeBackground } = await import('@imgly/background-removal');
            const imageResponse = await fetch(getProxiedUrl(primaryImage));
            const imageBlob = await imageResponse.blob();

            const optimizedBlob = await normalizeImageBlob(imageBlob);
            const resultBlob = await withTimeout(
                removeBackground(optimizedBlob, {
                    progress: (key, current, total) => {
                        console.log(`[BG Removal] ${key}: ${Math.round((current / total) * 100)}%`);
                    },
                }),
                BG_TIMEOUT_MS
            );

            const supabase = createClient();
            const ext = resultBlob.type === 'image/webp' ? 'webp' : 'png';
            const fileName = `catalog/nobg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
            const arrayBuffer = await resultBlob.arrayBuffer();

            const { error: uploadError } = await supabase.storage.from('vehicles').upload(fileName, arrayBuffer, {
                contentType: resultBlob.type || 'image/png',
                upsert: false,
            });

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from('vehicles').getPublicUrl(fileName);

            const newImages = images.map(img => (img === primaryImage ? publicUrl : img));
            setImages(newImages);
            setPrimaryImage(publicUrl);
        } catch (err) {
            console.error('[BG Removal] Error:', err);
            toast.error('Background removal failed. Try again.');
        } finally {
            setIsRemovingBg(false);
        }
    };

    const initiateDelete = () => {
        if (!primaryImage) return;
        setConfirmation({
            isOpen: true,
            type: 'DELETE',
            title: 'Delete Image',
            message: 'Are you sure you want to delete this image? This action cannot be undone.',
        });
    };

    const initiateReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setConfirmation({
            isOpen: true,
            type: 'REPLACE',
            file,
            title: 'Replace Image',
            message: (
                <span>
                    Are you sure you want to replace the current image with{' '}
                    <span className="font-bold text-indigo-600">{file.name}</span>?
                </span>
            ),
        });
        e.target.value = '';
    };

    const confirmAction = async () => {
        if (confirmation.type === 'DELETE') {
            const newImages = images.filter(img => img !== primaryImage);
            const newPrimary = newImages.length > 0 ? newImages[0] : null;
            setImages(newImages);
            setPrimaryImage(newPrimary);
            await onSave(
                newImages,
                skuVideos,
                skuPdfs,
                newPrimary,
                applyVideosToAll,
                zoomFactor,
                isFlipped,
                offsetX,
                offsetY
            );
            toast.success('Image deleted and saved');
        } else if (confirmation.type === 'REPLACE' && confirmation.file) {
            setIsUploading(true);
            const supabase = createClient();
            try {
                const file = confirmation.file;
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `catalog/${fileName}`;
                const { error } = await supabase.storage.from('vehicles').upload(filePath, file);
                if (error) throw error;
                const {
                    data: { publicUrl },
                } = supabase.storage.from('vehicles').getPublicUrl(filePath);

                const newImages = images.map(img => (img === primaryImage ? publicUrl : img));
                setImages(newImages);
                setPrimaryImage(publicUrl);
                await onSave(
                    newImages,
                    skuVideos,
                    skuPdfs,
                    publicUrl,
                    applyVideosToAll,
                    zoomFactor,
                    isFlipped,
                    offsetX,
                    offsetY
                );
                toast.success('Image replaced and saved');
            } catch (err) {
                toast.error('Replacement failed. Try again.');
            } finally {
                setIsUploading(false);
            }
        }
        setConfirmation({ ...confirmation, isOpen: false });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        const supabase = createClient();
        const newUrls: string[] = [];
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `catalog/${fileName}`;
                const { error } = await supabase.storage.from('vehicles').upload(filePath, file);
                if (error) throw error;
                const {
                    data: { publicUrl },
                } = supabase.storage.from('vehicles').getPublicUrl(filePath);
                newUrls.push(publicUrl);
            }
            if (type === 'image') {
                const updatedImages = [...images, ...newUrls];
                setImages(updatedImages);
                if (!primaryImage && updatedImages.length > 0) setPrimaryImage(updatedImages[0]);
            } else {
                setSkuPdfs([...skuPdfs, ...newUrls]);
            }
        } catch (err: any) {
            toast.error('Upload failed. Try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            const allVideos = [...skuVideos, ...selectedInheritedVideos];
            const allPdfs = [...skuPdfs];
            await onSave(
                images,
                allVideos,
                allPdfs,
                primaryImage,
                applyVideosToAll,
                zoomFactor,
                isFlipped,
                offsetX,
                offsetY
            );
            onClose();
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-[0]"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                onClick={e => e.stopPropagation()}
                className="relative z-10 w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Maximize2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">
                                Catalog Studio
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Refining {skuName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl transition-colors group"
                    >
                        <X
                            size={24}
                            className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                        />
                    </button>
                </div>

                {/* Sub-Header Tabs */}
                <div className="relative z-20 flex px-8 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            setActiveTab('alignment');
                        }}
                        className={`px-6 py-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${activeTab === 'alignment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Visual Alignment
                    </button>
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            setActiveTab('media');
                        }}
                        className={`px-6 py-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${activeTab === 'media' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Media Assets
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {activeTab === 'alignment' ? (
                        <>
                            {/* LEFT: Alignment Workspace */}
                            <div className="flex-[3] bg-slate-50 dark:bg-black/40 p-6 flex flex-col gap-4 border-r border-slate-100 dark:border-white/5">
                                <div className="relative flex-1 flex items-center justify-center min-h-0">
                                    <div
                                        className="relative rounded-[2rem] border-4 border-white dark:border-slate-800 overflow-hidden shadow-inner group"
                                        style={{
                                            width: '100%',
                                            maxWidth: '480px',
                                            aspectRatio: '300 / 344',
                                            background: `repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 20px 20px`,
                                        }}
                                    >
                                        <div
                                            className="absolute inset-0 hidden dark:block pointer-events-none"
                                            style={{
                                                background: `repeating-conic-gradient(#374151 0% 25%, #1f2937 0% 50%) 50% / 20px 20px`,
                                            }}
                                        />

                                        <div
                                            className="absolute border-2 border-dashed border-emerald-500 rounded-xl pointer-events-none z-30"
                                            style={{
                                                left: '4%',
                                                top: '4%',
                                                width: '92%',
                                                height: '92%',
                                            }}
                                        >
                                            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
                                            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-500 rounded-br" />
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 rounded text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                                                Card Safe Zone (92%)
                                            </div>
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div
                                                className={`absolute w-[1px] h-full transition-colors duration-300 ${Math.abs(offsetX) < 5 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] z-20' : 'bg-rose-500/30'}`}
                                                style={{ opacity: Math.abs(offsetX) < 20 ? 1 : 0.2 }}
                                            />
                                            <div
                                                className={`absolute h-[1px] w-full transition-colors duration-300 ${Math.abs(offsetY) < 5 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] z-20' : 'bg-rose-500/30'}`}
                                                style={{ opacity: Math.abs(offsetY) < 20 ? 1 : 0.2 }}
                                            />
                                            {Math.abs(offsetX) < 5 && Math.abs(offsetY) < 5 && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500/20 backdrop-blur-sm z-30"
                                                />
                                            )}
                                        </div>

                                        <div className="absolute inset-0 flex items-end justify-center pb-2 overflow-hidden">
                                            <motion.div
                                                drag
                                                dragMomentum={false}
                                                onDrag={(_, info: PanInfo) => {
                                                    setOffsetX(prev => prev + info.delta.x);
                                                    setOffsetY(prev => prev + info.delta.y);
                                                }}
                                                style={{ x: offsetX, y: offsetY }}
                                                className="cursor-move relative w-[92%] h-[92%] flex items-center justify-center"
                                            >
                                                {primaryImage ? (
                                                    <motion.img
                                                        src={getProxiedUrl(primaryImage)}
                                                        alt="Alignment Preview"
                                                        className="max-w-full max-h-full object-contain transition-transform duration-100"
                                                        style={{
                                                            transform: `scale(${zoomFactor}) ${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'}`,
                                                            pointerEvents: 'none',
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-4 text-slate-400">
                                                        <ImageIcon size={64} strokeWidth={1} />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                                            Drop or Select Image
                                                        </span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        </div>

                                        <div className="absolute bottom-3 left-3 flex items-center gap-3 z-40">
                                            <div className="px-2.5 py-1 bg-black/80 backdrop-blur-xl rounded-lg border border-white/10 text-white flex items-center gap-1.5 shadow-2xl">
                                                <span className="text-[8px] font-black tracking-widest uppercase opacity-60">
                                                    Scale
                                                </span>
                                                <span className="text-[9px] font-black italic">
                                                    {(zoomFactor * 100).toFixed(0)}%
                                                </span>
                                                <div className="w-[1px] h-2 bg-white/20" />
                                                <span className="text-[8px] font-black tracking-widest uppercase opacity-60">
                                                    Pos
                                                </span>
                                                <span className="text-[8px] font-mono opacity-80">
                                                    {offsetX.toFixed(0)}, {offsetY.toFixed(0)}
                                                </span>
                                                {imageDimensions && (
                                                    <>
                                                        <div className="w-[1px] h-2 bg-white/20" />
                                                        <Ruler size={9} className="opacity-60" />
                                                        <span className="text-[8px] font-mono opacity-80">
                                                            {imageDimensions.width}×{imageDimensions.height}
                                                        </span>
                                                    </>
                                                )}
                                                {fileMeta && (
                                                    <>
                                                        <div className="w-[1px] h-2 bg-white/20" />
                                                        <span className="text-[8px] font-mono opacity-80">
                                                            {fileMeta.type}
                                                        </span>
                                                        <div className="w-[1px] h-2 bg-white/20" />
                                                        <span className="text-[8px] font-mono opacity-80">
                                                            {fileMeta.size}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Compact Controls */}
                            <div className="flex-[2] p-5 flex flex-col gap-4 bg-white dark:bg-slate-900">
                                {/* Zoom */}
                                <div className="p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            Zoom
                                        </label>
                                        <div className="flex gap-1">
                                            {[0.8, 1.0, 1.2].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => setZoomFactor(v)}
                                                    className={`px-2 py-0.5 rounded text-[8px] font-bold ${zoomFactor === v ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-black/20 text-slate-400'}`}
                                                >
                                                    {v.toFixed(1)}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2.0"
                                        step="0.01"
                                        value={zoomFactor}
                                        onChange={e => setZoomFactor(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full appearance-none accent-indigo-600 cursor-pointer"
                                    />
                                </div>

                                {/* Action Buttons — 2×3 grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setIsFlipped(!isFlipped)}
                                        className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all ${isFlipped ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] text-slate-400 hover:border-slate-200 hover:text-slate-600'}`}
                                    >
                                        <RefreshCw size={16} className="mb-1" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Mirror</span>
                                    </button>

                                    <label className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer">
                                        <RefreshCw size={16} className="mb-1" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Replace</span>
                                        <input type="file" hidden accept="image/*" onChange={initiateReplace} disabled={!primaryImage} />
                                    </label>

                                    <button
                                        onClick={handleRemoveBg}
                                        disabled={!primaryImage || isRemovingBg}
                                        className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all ${isRemovingBg ? 'border-violet-500 bg-violet-50 dark:bg-violet-600/10 text-violet-600' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] text-slate-400 hover:border-violet-400 hover:text-violet-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isRemovingBg ? <Loader2 size={16} className="mb-1 animate-spin" /> : <Eraser size={16} className="mb-1" />}
                                        <span className="text-[8px] font-black uppercase tracking-widest">Remove BG</span>
                                    </button>

                                    <button
                                        onClick={initiateDelete}
                                        disabled={!primaryImage}
                                        className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] text-slate-400 hover:border-red-400 hover:text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={16} className="mb-1" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Delete</span>
                                    </button>

                                    <label className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer">
                                        <Plus size={16} className="mb-1" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Add New</span>
                                        <input type="file" hidden accept="image/*" onChange={e => handleFileUpload(e, 'image')} />
                                    </label>

                                    <button
                                        onClick={() => {
                                            setZoomFactor(1.0);
                                            setOffsetX(0);
                                            setOffsetY(0);
                                            setIsFlipped(false);
                                        }}
                                        className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03] text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-all"
                                    >
                                        <RotateCcw size={16} className="mb-1" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Reset</span>
                                    </button>
                                </div>

                                {/* Smart Crop */}
                                <div className="p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
                                    <div className="flex items-center gap-2">
                                        {isCropping ? <Loader2 size={12} className="animate-spin text-amber-600" /> : <Crop size={12} className="text-slate-400" />}
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Smart Crop</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {([
                                            { label: 'Auto Trim', ratio: undefined },
                                            { label: '1:1', ratio: 1 },
                                            { label: '4:3', ratio: 4 / 3 },
                                            { label: '16:9', ratio: 16 / 9 },
                                            { label: 'Card', ratio: 300 / 344 },
                                        ] as { label: string; ratio: number | undefined }[]).map(opt => (
                                            <button
                                                key={opt.label}
                                                onClick={() => handleSmartCrop(opt.ratio, opt.label)}
                                                disabled={!primaryImage || isCropping}
                                                className={[
                                                    'rounded-lg font-black uppercase tracking-widest border transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                                                    opt.label === 'Card'
                                                        ? 'px-4 py-1.5 text-[9px]'
                                                        : 'px-2.5 py-1 text-[8px]',
                                                    activeCrop === opt.label
                                                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-600/10 text-amber-600 ring-1 ring-amber-400/50'
                                                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-500 dark:text-slate-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-600/10',
                                                ].join(' ')}
                                            >
                                                {activeCrop === opt.label && '✓ '}{opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Verify + Apply toggle */}
                                <div className="mt-auto space-y-3">
                                    {primaryImage && (
                                        <a
                                            href={primaryImage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors w-full"
                                        >
                                            <ExternalLink size={10} /> Open Original Image
                                        </a>
                                    )}

                                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-black/20 rounded-xl cursor-pointer group">
                                        <div
                                            className={`w-9 h-5 border-2 rounded-full relative transition-all shrink-0 ${applyVideosToAll ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-white/10'}`}
                                        >
                                            <div
                                                className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${applyVideosToAll ? 'right-0.5 bg-white' : 'left-0.5 bg-slate-300'}`}
                                            />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            Apply to all variants
                                        </span>
                                        <input
                                            type="checkbox"
                                            hidden
                                            checked={applyVideosToAll}
                                            onChange={e => setApplyVideosToAll(e.target.checked)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-12 bg-slate-50 dark:bg-black/20">
                            <div className="max-w-5xl mx-auto space-y-12">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                                            Media Gallery
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            Manage all {images.length} assets for this SKU
                                        </p>
                                    </div>
                                    <label className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-900 transition-all flex items-center gap-2">
                                        <Plus size={14} /> Add Angle
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            multiple
                                            onChange={e => handleFileUpload(e, 'image')}
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {images.map((img, i) => (
                                        <motion.div
                                            key={i}
                                            layout
                                            className={`group relative aspect-square rounded-[2rem] border-2 overflow-hidden transition-all ${primaryImage === img ? 'border-indigo-600 ring-4 ring-indigo-500/20 shadow-2xl' : 'border-white dark:border-white/5 bg-white dark:bg-slate-800'}`}
                                        >
                                            <img
                                                src={getProxiedUrl(img)}
                                                alt=""
                                                className="w-full h-full object-contain p-4"
                                            />
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                                                    Angle {i + 1}
                                                </div>
                                                {primaryImage === img && (
                                                    <div className="p-1 px-2 bg-indigo-600 rounded-lg text-white">
                                                        <Star size={8} fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {primaryImage !== img && (
                                                    <button
                                                        onClick={() => setPrimaryImage(img)}
                                                        className="p-3 bg-white text-slate-900 rounded-xl hover:bg-slate-900 hover:text-white transition-colors shadow-lg"
                                                    >
                                                        <Star size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setImages(prev => prev.filter(p => p !== img))}
                                                    className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-colors shadow-lg"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setPrimaryImage(img);
                                                        setActiveTab('alignment');
                                                    }}
                                                    className="p-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors shadow-lg"
                                                >
                                                    <Move size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
                    <div className="hidden md:flex items-center gap-2 text-slate-400">
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                            All changes auto-saved
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-12 py-4 rounded-2xl bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-black text-white text-xs font-black uppercase tracking-widest shadow-2xl transition-all transform hover:-translate-y-1"
                        >
                            Commit Alignment
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmation.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
                    >
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setConfirmation({ ...confirmation, isOpen: false })}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl max-w-md w-full border border-slate-200 dark:border-white/10"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div
                                    className={`p-3 rounded-2xl ${confirmation.type === 'DELETE' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}
                                >
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {confirmation.title}
                                </h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">{confirmation.message}</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmation({ ...confirmation, isOpen: false })}
                                    className="flex-1 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAction}
                                    disabled={isUploading}
                                    className={`flex-1 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all ${confirmation.type === 'DELETE' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50`}
                                >
                                    {isUploading ? (
                                        <Loader2 className="animate-spin mx-auto" size={16} />
                                    ) : confirmation.type === 'DELETE' ? (
                                        'Delete'
                                    ) : (
                                        'Replace'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
