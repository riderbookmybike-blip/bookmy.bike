'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { RotateCcw, RotateCw, Check, X, Loader2 } from 'lucide-react';

interface ImageEditorProps {
    images: string[]; // Still an array for compatibility, but we focus on images[0]
    onComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
}

function defaultCrop(mediaWidth: number, mediaHeight: number) {
    return centerCrop(
        {
            unit: '%',
            width: 90,
            height: 90,
        },
        mediaWidth,
        mediaHeight,
    );
}

export default function ImageEditor({ images, onComplete, onCancel }: ImageEditorProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [rotation, setRotation] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const imageSource = images[0];

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(defaultCrop(width, height));
    };

    const getCroppedImg = async (image: HTMLImageElement, pixelCrop: PixelCrop, rotation: number): Promise<Blob> => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('No 2d context');

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const width = Math.max(1, Math.floor(pixelCrop.width * scaleX));
        const height = Math.max(1, Math.floor(pixelCrop.height * scaleY));

        canvas.width = width;
        canvas.height = height;

        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const sx = pixelCrop.x * scaleX;
        const sy = pixelCrop.y * scaleY;

        ctx.save();
        if (rotation !== 0) {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        ctx.drawImage(image, sx, sy, width, height, 0, 0, width, height);
        ctx.restore();

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty (toBlob failed)'));
                    return;
                }
                resolve(blob);
            }, 'image/webp', 0.9);
        });
    };

    const handleComplete = async () => {
        if (isSaving || !completedCrop || !imgRef.current) return;
        setIsSaving(true);
        try {
            const blob = await getCroppedImg(imgRef.current, completedCrop, rotation);
            onComplete(blob);
        } catch (e) {
            console.error(e);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col font-sans">
            <div className="flex-1 relative bg-black flex items-center justify-center p-4 overflow-auto">
                <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    className="max-h-full"
                >
                    <img
                        ref={imgRef}
                        src={imageSource}
                        alt="Crop me"
                        onLoad={onImageLoad}
                        style={{ transform: `rotate(${rotation}deg)`, maxHeight: '70vh' }}
                        crossOrigin="anonymous"
                    />
                </ReactCrop>
            </div>

            <div className="p-8 bg-slate-900/50 backdrop-blur-2xl border-t border-white/5 space-y-8">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex flex-col items-center text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            Adjust Document Area
                        </p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-indigo-400 mt-1">
                            FREEFORM MODE: Drag corners to fit document
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setRotation(prev => prev - 90)}
                            className="w-14 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white"
                            disabled={isSaving}
                        >
                            <RotateCcw size={20} />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setRotation(prev => prev + 90)}
                            className="w-14 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white"
                            disabled={isSaving}
                        >
                            <RotateCw size={20} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between max-w-2xl mx-auto pt-6 border-t border-white/5">
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        <X size={16} /> Discard
                    </button>

                    <button
                        onClick={handleComplete}
                        disabled={isSaving || !completedCrop}
                        className="h-16 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Check size={20} className="group-hover:scale-110 transition-transform" />
                        )}
                        {isSaving ? 'Saving...' : 'Finalize Crop'}
                    </button>
                </div>
            </div>
        </div>
    );
}
