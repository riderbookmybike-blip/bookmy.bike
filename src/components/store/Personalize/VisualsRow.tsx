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
    onCloseVideo = () => { }
}: VisualsRowProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const activeColorName = colors.find(c => c.id === selectedColor)?.name;

    // Mock gallery for now, ensuring we have at least one image
    const galaxyImages = [productImage, productImage, productImage]; // Placeholder for multiple angles

    const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % galaxyImages.length);
    const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + galaxyImages.length) % galaxyImages.length);

    return (
        <div className={`relative ${className}`}>

            {/* 1. Primary Hero Visualizer */}
            <div className="relative h-[600px] bg-white dark:bg-[#050505] rounded-[4rem] ring-1 ring-slate-100 dark:ring-white/10 overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-2xl transition-all duration-700">

                {/* Atmospheric Background - Removed for cleaner look */}
                <div className="absolute inset-0 z-0 bg-slate-50/50 dark:bg-white/5" />

                {/* Main Product Image (Static & Stable) */}
                <div className="absolute inset-0 z-10 p-12 flex items-center justify-center">
                    <img
                        src={galaxyImages[currentImageIndex] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop"}
                        alt="Product Visual"
                        className="w-full max-w-[85%] h-auto object-contain brightness-[1.1] contrast-[1.05] drop-shadow-[0_30px_60px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_40px_80px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-500"
                        key={currentImageIndex} // Force re-render for anim
                    />
                    {/* Shadow/Reflections */}
                    <div className="absolute bottom-[18%] w-[70%] h-6 bg-black/10 dark:bg-black/50 blur-[40px] dark:blur-[50px] rounded-full scale-x-125" />
                </div>

                {/* Gallery Navigation Controls */}
                <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 z-20 flex justify-between pointer-events-none">
                    <button
                        onClick={prevImage}
                        className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-900 dark:text-white pointer-events-auto transition-all active:scale-95 hover:scale-110"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={nextImage}
                        className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-900 dark:text-white pointer-events-auto transition-all active:scale-95 hover:scale-110"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Bottom Overlay: Identity & Color Selector */}
                <div className="absolute inset-x-0 bottom-0 p-12 z-30 flex items-end justify-between bg-gradient-to-t from-white dark:from-black via-white/80 dark:via-black/80 to-transparent pt-32 pointer-events-none">
                    <div className="max-w-[60%]">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-4 animate-in fade-in slide-in-from-left-4 duration-700">Selected Choice</p>
                        <h2 className="text-4xl font-black uppercase italic text-slate-900 dark:text-white tracking-tighter leading-[0.85] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            {activeColorName}
                        </h2>
                    </div>

                    <div className="flex flex-col items-end gap-3 pointer-events-auto">
                        {/* Status Overlay */}
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">In Stock</span>
                        </div>

                        <div className="flex gap-4 items-center p-2">
                            {colors.map(color => {
                                const isSelected = selectedColor === color.id;
                                return (
                                    <button
                                        key={color.id}
                                        onClick={() => onColorSelect(color.id)}
                                        className={`relative w-10 h-10 rounded-full transition-all duration-500 group/color ${isSelected ? 'scale-110' : 'hover:scale-110'}`}
                                    >
                                        <div className={`absolute inset-0 rounded-full border-2 transition-all ${isSelected ? 'border-blue-500 scale-125' : 'border-transparent'}`} />
                                        <div className={`w-full h-full rounded-full border border-black/10 dark:border-white/20 shadow-inner ${color.class}`} />
                                        {/* Tooltip */}
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/color:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                            {color.name}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
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
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Full Experience</span>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
