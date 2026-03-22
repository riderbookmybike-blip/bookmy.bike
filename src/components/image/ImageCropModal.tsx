'use client';

import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Check, Minus, Plus, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';

export type ImageCropVariant = 'avatar' | 'cover';

interface ImageCropModalProps {
    imageSrc: string;
    variant: ImageCropVariant;
    onCancel: () => void;
    onDone: (blob: Blob) => void;
}

const ASPECT: Record<ImageCropVariant, number> = {
    avatar: 1,
    cover: 1440 / 320, // 4.5
};

async function cropImageToBlob(imageSrc: string, cropArea: Area, variant: ImageCropVariant): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // Cap output dimensions to keep payload manageable
            const MAX_W = variant === 'avatar' ? 600 : 1440;
            const MAX_H = variant === 'avatar' ? 600 : 320;
            const scale = Math.min(MAX_W / cropArea.width, MAX_H / cropArea.height, 1);
            const outW = Math.round(cropArea.width * scale);
            const outH = Math.round(cropArea.height * scale);

            const canvas = document.createElement('canvas');
            canvas.width = outW;
            canvas.height = outH;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('No canvas context'));
            ctx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, outW, outH);
            canvas.toBlob(
                blob => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas toBlob failed'));
                },
                'image/jpeg',
                0.82 // quality: good balance of size vs clarity
            );
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
}

export function ImageCropModal({ imageSrc, variant, onCancel, onDone }: ImageCropModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleDone = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, variant);
            onDone(blob);
        } catch (err) {
            console.error('Crop failed', err);
            toast.error('Image crop failed — please try again');
            setIsProcessing(false);
        }
    };

    const isAvatar = variant === 'avatar';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl bg-[#0f1117] rounded-[28px] overflow-hidden shadow-2xl border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-indigo-400">
                            {isAvatar ? 'Profile Photo' : 'Cover Photo'}
                        </p>
                        <p className="text-white font-black text-base mt-0.5">Crop & Adjust</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Crop area */}
                <div className="relative w-full" style={{ height: isAvatar ? 340 : 260 }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={ASPECT[variant]}
                        cropShape={isAvatar ? 'round' : 'rect'}
                        showGrid={!isAvatar}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        style={{
                            containerStyle: { background: '#0a0c12' },
                            cropAreaStyle: {
                                border: '2px solid rgba(99,102,241,0.8)',
                                boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
                            },
                        }}
                    />
                </div>

                {/* Zoom control */}
                <div className="px-5 py-4 flex items-center gap-3 border-t border-white/10">
                    <ZoomIn size={14} className="text-indigo-400 shrink-0" />
                    <button
                        onClick={() => setZoom(z => Math.max(1, z - 0.1))}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors shrink-0"
                    >
                        <Minus size={12} />
                    </button>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={e => setZoom(Number(e.target.value))}
                        className="flex-1 accent-indigo-500 h-1.5 cursor-pointer"
                    />
                    <button
                        onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors shrink-0"
                    >
                        <Plus size={12} />
                    </button>
                    <span className="text-[11px] text-white/40 w-10 text-right shrink-0">{zoom.toFixed(1)}×</span>
                </div>

                {/* Hint */}
                <p className="px-5 pb-2 text-[10px] text-white/30 text-center">
                    {isAvatar ? 'Recommended: 400 × 400 px' : 'Recommended: 1440 × 320 px'} • Drag to reposition • Pinch
                    or slide to zoom
                </p>

                {/* Actions */}
                <div className="flex gap-3 px-5 pb-5 pt-1">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-2xl border border-white/20 py-3 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white hover:border-white/40 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDone}
                        disabled={isProcessing}
                        className="flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                    >
                        {isProcessing ? (
                            <span className="animate-spin inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full" />
                        ) : (
                            <Check size={13} />
                        )}
                        {isProcessing ? 'Processing…' : 'Apply & Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}
