/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { Play, X, ChevronLeft, ChevronRight, Maximize2, Youtube } from 'lucide-react';
import ChromelessVideo from '@/components/ui/ChromelessVideo';

interface ColorOption {
    id: string;
    name: string;
    hex: string;
    class: string;
    assets?: any[];
}

interface VisualsRowProps {
    colors: ColorOption[];
    selectedColor: string;
    onColorSelect: (id: string) => void;
    productImage: string;
    assets?: any[];
    videoSource: string;
    className?: string;
    isVideoOpen?: boolean;
    onCloseVideo?: () => void;
    /** Mirror the hero image horizontally */
    isFlipped?: boolean;
    /** Zoom scale factor for the hero image */
    zoomFactor?: number | null;
    /** Horizontal offset (px) for the hero image */
    offsetX?: number;
    /** Vertical offset (px) for the hero image */
    offsetY?: number;
}

export default function VisualsRow({
    colors,
    selectedColor,
    onColorSelect,
    productImage,
    assets = [],
    videoSource,
    className = '',
    isVideoOpen = false,
    onCloseVideo = () => { },
    isFlipped = false,
    zoomFactor = null,
    offsetX = 0,
    offsetY = 0,
}: VisualsRowProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [is360Active, setIs360Active] = useState(false);
    const activeColor = colors.find(c => c.id === selectedColor) || colors[0];
    const activeColorName = activeColor.name;

    // Reset loading state when the displayed image URL changes
    const imgRef = React.useRef<HTMLImageElement | null>(null);
    React.useEffect(() => {
        setImageLoaded(false);
        setIs360Active(false);
        // Handle browser-cached images that fire onLoad synchronously
        requestAnimationFrame(() => {
            if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
                setImageLoaded(true);
            }
        });
    }, [productImage]);

    const v360Assets = assets.filter(a => a.type === '360').sort((a, b) => (a.position || 0) - (b.position || 0));
    const has360 = v360Assets.length > 0;

    // Cloudimage 360 initialization
    React.useEffect(() => {
        if (is360Active && has360) {
            // Need to wait for DOM to be ready
            const timer = setTimeout(() => {
                if ((window as any).CI360) {
                    (window as any).CI360.init();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [is360Active, has360, selectedColor]);

    const get360Config = () => {
        if (!has360) return null;
        const firstAsset = v360Assets[0].url;
        const lastSlash = firstAsset.lastIndexOf('/');
        const folder = firstAsset.substring(0, lastSlash);
        // Pattern assumes {index}.webp or similar.
        // Our script linked as path/1.webp, path/2.webp etc.
        return {
            folder,
            filename: '{index}.webp',
            amount: v360Assets.length,
        };
    };

    const config360 = get360Config();

    // Build real gallery from assets — only unique images
    const galleryImages =
        assets && assets.length > 0
            ? assets
                .filter((a: any) => a.type === 'image' || a.url?.match(/\.(png|jpg|jpeg|webp|avif)$/i))
                .map((a: any) => a.url)
            : [productImage];
    // Deduplicate
    const galaxyImages = [...new Set(galleryImages.length > 0 ? galleryImages : [productImage])] as string[];

    const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % galaxyImages.length);
    const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + galaxyImages.length) % galaxyImages.length);

    return (
        <div className={`relative ${className}`}>
            {/* 1. Primary Hero Visualizer - 3 Part Layout */}
            <div className="relative h-[600px] md:h-full bg-white md:bg-transparent rounded-[4rem] md:rounded-none ring-1 ring-slate-100 md:ring-0 overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:shadow-none transition-all duration-700 flex flex-col">
                {/* Atmospheric Background - Golden Spotlight (mobile only) */}
                <div className="absolute inset-x-0 bottom-0 top-1/2 z-0 bg-gradient-to-t from-[#F4B000]/20 to-transparent opacity-60 blur-3xl rounded-b-[4rem] md:hidden" />
                <div className="absolute inset-0 z-0 bg-radial-at-c from-white/10 to-transparent opacity-50 md:hidden" />

                {/* Status Indicator (Top Right) - mobile only, desktop uses swatch dots */}
                <div className="absolute top-8 right-8 z-20 flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full backdrop-blur-xl shadow-lg ring-1 ring-white/20 md:hidden">
                    <div className="w-2 h-2 bg-[#F4B000] rounded-full animate-pulse shadow-[0_0_10px_rgba(244,176,0,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F4B000]">In Stock</span>
                </div>

                {/* PART 1: Image Area (75%) - Strictly contained */}
                <div className="relative flex-[3] z-10 flex items-center justify-center overflow-hidden">
                    {/* Dynamic Backlight Glow */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] blur-[120px] opacity-20 transition-all duration-1000 z-0 pointer-events-none"
                        style={{ backgroundColor: activeColor.hex }}
                    />

                    {/* Skeleton Loader */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[65%] h-[70%] bg-gradient-to-br from-slate-200 to-slate-100 rounded-3xl animate-pulse" />
                        </div>
                    )}

                    {has360 && is360Active && config360 ? (
                        <div
                            className="cloudimage-360 w-full h-full flex items-center justify-center p-8"
                            data-folder={config360.folder}
                            data-filename-x={config360.filename}
                            data-amount-x={config360.amount}
                            data-spin-reverse
                            data-drag-speed="150"
                            data-autoplay
                            data-speed="50"
                        />
                    ) : (
                        <img
                            ref={imgRef}
                            src={productImage || '/images/categories/scooter_nobg.png'}
                            alt="Product Visual"
                            onLoad={() => setImageLoaded(true)}
                            className={`w-full max-w-[65%] max-h-[90%] object-contain brightness-[1.1] contrast-[1.1] drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)],0,0,0.9)] transition-opacity duration-500 ${imageLoaded ? 'opacity-100 animate-in fade-in zoom-in-95 duration-700' : 'opacity-0'
                                }`}
                            style={{
                                transform: [
                                    isFlipped ? 'scaleX(-1)' : '',
                                    zoomFactor ? `scale(${zoomFactor})` : '',
                                    offsetX ? `translateX(${offsetX}px)` : '',
                                    offsetY ? `translateY(${offsetY}px)` : '',
                                ].filter(Boolean).join(' '),
                            }}
                        />
                    )}

                    {/* Gallery Navigation / 360 Toggle */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
                        {has360 && (
                            <button
                                onClick={() => setIs360Active(!is360Active)}
                                className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${is360Active
                                        ? 'bg-[#F4B000] text-black shadow-[0_0_20px_rgba(244,176,0,0.5)]'
                                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                                    }`}
                            >
                                {is360Active ? 'Static View' : '360 View'}
                            </button>
                        )}
                    </div>

                    {/* Gallery Navigation */}
                    <button
                        onClick={prevImage}
                        className={`absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-900 transition-all active:scale-95 hover:scale-110 ${galaxyImages.length <= 1 ? 'hidden' : ''}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextImage}
                        className={`absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-900 transition-all active:scale-95 hover:scale-110 ${galaxyImages.length <= 1 ? 'hidden' : ''}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* PART 2: Color Name (10%) */}
                <div className="flex-shrink-0 h-[50px] z-10 flex items-center justify-center bg-gradient-to-t from-white/50 to-transparent md:hidden">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-[#F4B000] animate-in fade-in slide-in-from-bottom-2 duration-700">
                        {activeColorName}
                    </p>
                </div>

                {/* PART 3: Color Circles (15%) - Independent section */}
                <div className="flex-shrink-0 h-[70px] z-10 flex items-center justify-center gap-4 px-4 bg-white overflow-hidden md:hidden">
                    {colors.map(color => {
                        const isSelected = selectedColor === color.id;
                        return (
                            <button
                                key={color.id}
                                onClick={() => onColorSelect(color.id)}
                                className={`relative w-12 h-12 rounded-xl transition-all duration-500 group/color ${isSelected ? 'scale-110' : 'hover:scale-110'}`}
                            >
                                <div
                                    className={`absolute inset-0 rounded-xl border-2 transition-all ${isSelected ? 'border-[#F4B000] scale-125' : 'border-transparent'}`}
                                />
                                <div
                                    className={`w-full h-full rounded-xl border border-black/10 shadow-inner ${color.class}`}
                                    style={{ backgroundColor: color.hex }}
                                />
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/color:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    {color.name}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Video Pop-out Modal */}
            {isVideoOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8 md:p-20">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500"
                        onClick={onCloseVideo}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-6xl aspect-video bg-black rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.3)] border border-white/10 animate-in zoom-in-95 duration-500">
                        {/* Close button inside modal frame but top right */}
                        <button
                            onClick={onCloseVideo}
                            className="absolute top-8 right-8 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all hover:rotate-90"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-full h-full">
                            <iframe
                                src={`https://www.youtube.com/embed/${videoSource}?autoplay=1&rel=0`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        {/* Video Caption Indicator */}
                        <div className="absolute bottom-10 left-10 flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                                Full Experience
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
