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
}

interface VisualsRowProps {
    colors: ColorOption[];
    selectedColor: string;
    onColorSelect: (id: string) => void;
    productImage: string;
    videoSource: string;
    className?: string;
    isVideoOpen?: boolean;
    onCloseVideo?: () => void;
}

export default function VisualsRow({
    colors,
    selectedColor,
    onColorSelect,
    productImage,
    videoSource,
    className = '',
    isVideoOpen = false,
    onCloseVideo = () => {},
}: VisualsRowProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const activeColor = colors.find(c => c.id === selectedColor) || colors[0];
    const activeColorName = activeColor.name;

    // Reset loading state when image changes
    React.useEffect(() => {
        setImageLoaded(false);
    }, [productImage, currentImageIndex]);

    // Mock gallery for now, ensuring we have at least one image
    const galaxyImages = [productImage, productImage, productImage]; // Placeholder for multiple angles

    const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % galaxyImages.length);
    const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + galaxyImages.length) % galaxyImages.length);

    return (
        <div className={`relative ${className}`}>
            {/* 1. Primary Hero Visualizer - 3 Part Layout */}
            <div className="relative h-[600px] bg-white dark:bg-[#050505] rounded-[4rem] ring-1 ring-slate-100 dark:ring-white/10 overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-2xl transition-all duration-700 flex flex-col">
                {/* Atmospheric Background - Golden Spotlight */}
                <div className="absolute inset-x-0 bottom-0 top-1/2 z-0 bg-gradient-to-t from-[#F4B000]/20 to-transparent opacity-60 blur-3xl rounded-b-[4rem]" />
                <div className="absolute inset-0 z-0 bg-radial-at-c from-white/10 to-transparent opacity-50" />

                {/* Status Indicator (Top Right) - Glassmorphism */}
                <div className="absolute top-8 right-8 z-20 flex items-center gap-2 bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 px-4 py-1.5 rounded-full backdrop-blur-xl shadow-lg ring-1 ring-white/20">
                    <div className="w-2 h-2 bg-[#F4B000] rounded-full animate-pulse shadow-[0_0_10px_rgba(244,176,0,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F4B000]">In Stock</span>
                </div>

                {/* PART 1: Image Area (75%) - Strictly contained */}
                <div className="relative flex-[3] z-10 flex items-center justify-center overflow-hidden">
                    {/* Dynamic Backlight Glow */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] blur-[120px] opacity-20 dark:opacity-30 transition-all duration-1000 z-0 pointer-events-none"
                        style={{ backgroundColor: activeColor.hex }}
                    />

                    {/* Skeleton Loader */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[65%] h-[70%] bg-gradient-to-br from-slate-200 to-slate-100 dark:from-white/5 dark:to-white/[0.02] rounded-3xl animate-pulse" />
                        </div>
                    )}

                    <img
                        src={productImage || '/images/categories/scooter_nobg.png'}
                        alt="Product Visual"
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full max-w-[65%] max-h-[90%] object-contain brightness-[1.1] contrast-[1.1] drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_60px_100px_rgba(0,0,0,0.9)] transition-opacity duration-500 ${
                            imageLoaded ? 'opacity-100 animate-in fade-in zoom-in-95 duration-700' : 'opacity-0'
                        }`}
                        key={currentImageIndex}
                    />

                    {/* Gallery Navigation */}
                    <button
                        onClick={prevImage}
                        className={`absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-900 dark:text-white transition-all active:scale-95 hover:scale-110 ${!productImage || productImage.includes('categories/') ? 'hidden' : ''}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextImage}
                        className={`absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-900 dark:text-white transition-all active:scale-95 hover:scale-110 ${!productImage || productImage.includes('categories/') ? 'hidden' : ''}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* PART 2: Color Name (10%) */}
                <div className="flex-shrink-0 h-[50px] z-10 flex items-center justify-center bg-gradient-to-t from-white/50 to-transparent dark:from-[#050505]/50">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-[#F4B000] animate-in fade-in slide-in-from-bottom-2 duration-700">
                        {activeColorName}
                    </p>
                </div>

                {/* PART 3: Color Circles (15%) - Independent section */}
                <div className="flex-shrink-0 h-[70px] z-10 flex items-center justify-center gap-4 px-4 bg-white dark:bg-[#050505] overflow-hidden">
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
                                    className={`w-full h-full rounded-xl border border-black/10 dark:border-white/20 shadow-inner ${color.class}`}
                                    style={{ backgroundColor: color.hex }}
                                />
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/color:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
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
