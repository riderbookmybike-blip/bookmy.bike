'use client';

import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { RotateCcw, RotateCw, Check, X, Loader2 } from 'lucide-react';

interface LogoCropperProps {
    src: string;
    onCancel: () => void;
    onComplete: (blob: Blob) => void;
}

type Area = { width: number; height: number; x: number; y: number };

const createImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
});

const getCroppedImage = async (imageSrc: string, crop: Area, rotation = 0): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Canvas context not available');

    const radians = (rotation * Math.PI) / 180;

    const safeArea = Math.max(image.width, image.height) * 2;
    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate(radians);
    ctx.translate(-safeArea / 2, -safeArea / 2);
    ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2);

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = crop.width;
    canvas.height = crop.height;
    ctx.putImageData(
        data,
        Math.round(-crop.x),
        Math.round(-crop.y)
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Failed to create image blob'));
                return;
            }
            resolve(blob);
        }, 'image/png');
    });
};

export default function LogoCropper({ src, onCancel, onComplete }: LogoCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels || isSaving) return;
        setIsSaving(true);
        try {
            const blob = await getCroppedImage(src, croppedAreaPixels, rotation);
            onComplete(blob);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col font-sans">
            <div className="flex-1 relative bg-black/70 flex items-center justify-center">
                <Cropper
                    image={src}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid={false}
                />
            </div>

            <div className="p-6 md:p-8 bg-slate-900/70 backdrop-blur-2xl border-t border-white/5 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Logo Cropper</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">Zoom & Position to fit the mark</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setRotation(prev => prev - 90)}
                            className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
                            disabled={isSaving}
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button
                            onClick={() => setRotation(prev => prev + 90)}
                            className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
                            disabled={isSaving}
                        >
                            <RotateCw size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Zoom</span>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                    />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        <X size={16} /> Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !croppedAreaPixels}
                        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        {isSaving ? 'Saving...' : 'Save Logo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
