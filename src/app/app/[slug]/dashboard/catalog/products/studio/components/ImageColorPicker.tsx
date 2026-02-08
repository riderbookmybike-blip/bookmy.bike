'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { getProxiedUrl } from '@/lib/utils/urlHelper';

interface ImageColorPickerProps {
    imageUrl: string;
    onPick: (hex: string) => void;
    onHover?: (hex: string) => void;
}

export default function ImageColorPicker({ imageUrl, onPick, onHover }: ImageColorPickerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [magnifier, setMagnifier] = useState<{
        x: number;
        y: number;
        color: string;
        imgX: number;
        imgY: number;
        locked: boolean;
    } | null>(null);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = getProxiedUrl(imageUrl);
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            setIsLoaded(true);
        };
    }, [imageUrl]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isLoaded) return;
        // If locked, do NOT update position or color
        if (magnifier?.locked) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;

        const x = relX * canvas.width;
        const y = relY * canvas.height;

        const clampedX = Math.max(0, Math.min(x, canvas.width - 1));
        const clampedY = Math.max(0, Math.min(y, canvas.height - 1));

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
        const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;

        setMagnifier({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            imgX: relX * 100,
            imgY: relY * 100,
            color: hex,
            locked: false,
        });

        if (onHover) onHover(hex);
    };

    const handleClick = () => {
        if (!magnifier) return;

        // Toggle Lock
        if (magnifier.locked) {
            // Unlock
            setMagnifier({ ...magnifier, locked: false });
        } else {
            // Lock
            setMagnifier({ ...magnifier, locked: true });
            onPick(magnifier.color);
        }
    };

    return (
        <div className="flex flex-col gap-6 items-center">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm z-20">
                {[1, 2, 4].map(z => (
                    <button
                        key={z}
                        onClick={() => setZoom(z)}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${zoom === z ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        {z}X
                    </button>
                ))}
            </div>

            <div
                className="relative bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden cursor-none group flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-2xl"
                style={{ width: '800px', height: '500px' }}
            >
                <div
                    className="w-full h-full transition-transform duration-300 ease-out flex items-center justify-center"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                >
                    <canvas
                        ref={canvasRef}
                        className={`max-w-full max-h-full object-contain transition-all duration-200 ${magnifier?.locked ? 'cursor-default' : 'cursor-none'}`}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => !magnifier?.locked && setMagnifier(null)}
                        onClick={handleClick}
                    />
                </div>

                {magnifier && (
                    <div
                        className="absolute pointer-events-none z-50 flex flex-col items-center gap-3"
                        style={{ left: magnifier.x, top: magnifier.y, transform: 'translate(-50%, -120%)' }}
                    >
                        <div
                            className="w-48 h-48 rounded-full border-[8px] border-white shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden relative"
                            style={{
                                backgroundColor: magnifier.color,
                                backgroundImage: `url(${getProxiedUrl(imageUrl)})`,
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: `${400 * zoom}%`,
                                backgroundPosition: `${magnifier.imgX}% ${magnifier.imgY}%`,
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-px bg-white/40 absolute mix-blend-difference" />
                                <div className="h-full w-px bg-white/40 absolute mix-blend-difference" />
                                <div className="w-3 h-3 rounded-full border-2 border-white/80 mix-blend-difference" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg font-black rounded-2xl uppercase shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/10 tracking-[0.1em] whitespace-nowrap animate-in zoom-in-95">
                            <div
                                className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-white/10"
                                style={{ backgroundColor: magnifier.color }}
                            />
                            {magnifier.color}
                            {magnifier.locked && (
                                <span className="text-[8px] ml-2 text-slate-400 font-bold">LOCKED</span>
                            )}
                        </div>
                    </div>
                )}

                {!isLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <Loader2 size={48} className="animate-spin text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Loading Canvas...
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
