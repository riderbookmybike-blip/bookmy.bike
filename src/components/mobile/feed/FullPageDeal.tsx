'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ChevronRight, Info, CheckCircle2, Heart, MapPin, Star, StarHalf, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useActiveColor } from '@/contexts/ColorContext';
import { useFavorites } from '@/contexts/FavoritesContext';

interface DealProps {
    product: any;
    isActive: boolean;
}

export const FullPageDeal = ({ product, isActive }: DealProps) => {
    const router = useRouter();
    const { setActiveColorHex } = useActiveColor();
    const { isFavorite, toggleFavorite } = useFavorites();

    // Adapt database structure to component needs
    const rawColors = product.availableColors || [];

    // Sort colors to put primary color first (the one used in catalogMapper with is_primary asset)
    // Primary color will have imageUrl from primaryAsset, others from firstImageAsset
    const colors = useMemo(() => {
        if (!rawColors.length) return rawColors;

        // Try to find which color is primary by checking various indicators
        const sorted = [...rawColors];

        // Sort: colors with more complete data (imageUrl, proper name) come first
        sorted.sort((a: any, b: any) => {
            // If one has imageUrl and other doesn't, prioritize the one with imageUrl
            if (a.imageUrl && !b.imageUrl) return -1;
            if (!a.imageUrl && b.imageUrl) return 1;

            // Both have or both don't have imageUrl, keep original order
            return 0;
        });

        return sorted;
    }, [rawColors]);

    const [activeColorIdx, setActiveColorIdx] = useState(0); // Now 0 is always primary after sorting
    const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const activeColor = colors[activeColorIdx] || colors[0] || { hexCode: '#E8E8E8', imageUrl: product.imageUrl, name: 'Default' };

    // Sync active color with context for header adaptation (on mount and color change)
    useEffect(() => {
        setActiveColorHex(activeColor.hexCode || '#E8E8E8');
    }, [activeColor.hexCode, setActiveColorHex, isActive]);

    const basePrice = product.price?.onRoad || 0;
    const emi = Math.round(basePrice * 0.035);
    const location = "PALGHAR";

    // Use discount as offer (negative for surge, positive for save)
    const offerAmount = product.price?.discount || 0;
    const isSurge = offerAmount < 0;
    const offerLabel = isSurge ? 'SURGE' : 'SAVE';
    const offerValue = Math.abs(offerAmount).toLocaleString('en-IN');

    // Extract specs
    const engine = product.specifications?.engine?.displacement || product.displacement + ' ' + product.powerUnit || 'N/A';
    const mileage = product.specifications?.battery?.range || 'N/A';
    const weight = product.specifications?.dimensions?.kerbWeight || product.specifications?.dimensions?.curbWeight || 'N/A';

    // Function to create a lighter shade of the hex color
    const getLighterShade = (hexColor: string, amount: number = 0.85): string => {
        // Remove # if present
        const hex = hexColor.replace('#', '');

        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Mix with white (255, 255, 255) to create lighter shade
        const newR = Math.round(r + (255 - r) * amount);
        const newG = Math.round(g + (255 - g) * amount);
        const newB = Math.round(b + (255 - b) * amount);

        // Convert back to hex
        const toHex = (n: number) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    };

    const lightShade = getLighterShade(activeColor.hexCode, 0.5); // More vibrant (50% mix)

    // Swipe handled by parent ModelCard component

    const handleColorSelect = (idx: number) => {
        setActiveColorIdx(idx);
        setIsColorSelectorOpen(false);
    };

    return (
        <div
            className="relative w-full overflow-hidden snap-start shrink-0 flex flex-col transition-all duration-700"
            style={{
                // Use dvh (dynamic viewport height) for proper mobile support
                height: '100dvh',
                maxHeight: '100dvh',
                // Full flood of color
                background: lightShade
            }}
        >
            {/* Texture Overlay (Noise) */}
            <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* 1. Immersive Gradient Overlay to keep bottom content readable but HIGHLY colored */}
            <div className="absolute inset-x-0 bottom-0 h-[55vh] bg-gradient-to-t from-white/40 via-white/20 to-transparent z-10" />

            {/* 2. Top Header Layer - REMOVED (Content moved to Detail Panel) */}
            <div className="relative z-30 px-6 pt-24 min-h-[50px] pointer-events-none" />
            <div className="relative flex-1 flex flex-col items-center justify-center z-20 px-6">
                {/* Brand Watermark behind image */}
                <span className="absolute font-black text-[90px] uppercase tracking-[0.2em] opacity-[0.03] italic text-zinc-900 select-none whitespace-nowrap z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    {product.make}
                </span>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeColorIdx}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="w-full h-full relative"
                    >
                        <Image
                            src={activeColor.imageUrl || product.imageUrl}
                            alt={product.model}
                            fill
                            className="object-contain drop-shadow-[0_45px_70px_rgba(0,0,0,0.5)]"
                            priority={isActive}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Favorite Heart Icon */}
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite({
                            id: product.id,
                            model: product.model,
                            make: product.make,
                            variant: product.variant,
                            imageUrl: activeColor.imageUrl || product.imageUrl,
                            price: product.price?.onRoad || 0,
                            slug: product.slug
                        });
                    }}
                    whileTap={{ scale: 0.85 }}
                    className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-lg border border-white/20 flex items-center justify-center"
                >
                    <motion.div
                        initial={false}
                        animate={{
                            scale: isFavorite(product.id) ? [1, 1.3, 1] : 1
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <Heart
                            className={`size-5 transition-colors ${isFavorite(product.id)
                                ? 'fill-red-500 stroke-red-500'
                                : 'fill-none stroke-white'
                                }`}
                        />
                    </motion.div>
                </motion.button>

                {/* Expanded Color Selector Modal */}
                <AnimatePresence>
                    {isColorSelectorOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
                            onClick={() => setIsColorSelectorOpen(false)}
                        >
                            <motion.div
                                initial={{ y: 20 }}
                                animate={{ y: 0 }}
                                className="bg-white rounded-3xl p-6 w-[90%] max-w-md shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black uppercase tracking-tight">Choose Color</h3>
                                    <button
                                        onClick={() => setIsColorSelectorOpen(false)}
                                        className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center active:scale-90 transition-all"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {colors.map((color: any, idx: number) => (
                                        <button
                                            key={color.id}
                                            onClick={() => handleColorSelect(idx)}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${idx === activeColorIdx
                                                ? 'bg-zinc-100 ring-2 ring-black'
                                                : 'hover:bg-zinc-50'
                                                }`}
                                        >
                                            <div
                                                className="w-16 h-16 rounded-full shadow-lg"
                                                style={{ backgroundColor: color.hexCode }}
                                            />
                                            <span className="text-[10px] font-bold text-zinc-700 text-center leading-tight">
                                                {color.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <p className="text-center text-[10px] text-zinc-400 mt-4 font-medium">
                                    Swipe left/right on image to change colors
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 4. Radical Detail Panel - Compressed Layout */}
            <div className="relative z-30 px-6 pt-4 pb-24 mt-auto">
                {/* Brand Logo & Model Info */}
                <div className="mb-4">
                    {/* Offer Pill (Moved Here - Compressed Margin) */}
                    <div className="mb-1.5 flex justify-start">
                        <AnimatePresence mode="wait">
                            {offerAmount !== 0 && (
                                <motion.div
                                    key={offerAmount}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-1.5 active:scale-95 transition-transform"
                                >
                                    <Zap size={9} className="fill-white text-white" />
                                    <span className="text-[9px] font-black uppercase tracking-wider text-white">
                                        {offerLabel} ₹{offerValue}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mb-0.5">
                        <span className="text-lg font-black uppercase italic tracking-tighter text-zinc-900">
                            {product.make}
                        </span>
                    </div>

                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 leading-none mb-1">
                        {product.model}
                    </h2>

                    <div className="flex flex-col items-start gap-1">
                        {/* Variant Name - Prominent */}
                        <p className="text-xl font-black text-zinc-900 uppercase tracking-tighter italic leading-none">
                            {product.variant}
                        </p>

                        {/* Active Color Name - Secondary - Dark Black */}
                        <div
                            className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mt-0.5"
                        >
                            {activeColor.name}
                        </div>

                        {/* Interactive Color Chips (Infinite Scroll - Static Selection) */}
                        <div className="flex items-center gap-3 mt-1 h-10 overflow-x-auto no-scrollbar mask-gradient pr-4">
                            {colors.length > 0 ? (
                                colors.map((color: any, idx: number) => (
                                    <div key={color.id || idx} className="relative flex items-center justify-center shrink-0 w-7 h-7">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveColorIdx(idx);
                                            }}
                                            className={`w-6 h-6 rounded-full shadow-sm transition-all duration-300 ${activeColorIdx === idx
                                                ? 'border-2 border-white ring-2 ring-zinc-900 z-10' // Static selection ring
                                                : 'border border-white/50 opacity-80 hover:opacity-100'
                                                }`}
                                            style={{ backgroundColor: color.hexCode }}
                                            title={color.name}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="text-[9px] font-bold text-zinc-900 uppercase tracking-widest italic opacity-60">
                                    Standard Color
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-end mb-3 translate-y-1">
                    <div className="flex flex-col items-start gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsInfoOpen(true); }}
                            className="flex items-center gap-1.5 active:opacity-70 group"
                        >
                            <span className="text-[10px] font-black italic text-zinc-900 uppercase tracking-widest group-hover:text-black transition-colors">On-Road Price</span>
                            <div className="w-3.5 h-3.5 rounded-full border border-zinc-300 flex items-center justify-center bg-white/50">
                                <Info size={9} className="text-zinc-400" />
                            </div>
                        </button>
                        <div className="flex items-baseline justify-start gap-0.5">
                            <span className="text-3xl font-black text-zinc-900 tracking-tighter italic">
                                ₹{basePrice.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-right">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsInfoOpen(true); }}
                            className="flex items-center gap-1.5 active:opacity-70 group"
                        >
                            <span className="text-[10px] font-black italic text-[#138808] uppercase tracking-widest">Lowest EMI</span>
                            <div className="w-3.5 h-3.5 rounded-full border border-[#138808]/20 flex items-center justify-center bg-[#138808]/5">
                                <Info size={9} className="text-[#138808]/60" />
                            </div>
                        </button>
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-3xl font-black text-[#138808] tracking-tighter italic">
                                ₹{emi.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] font-black text-zinc-400 uppercase">/mo</span>
                        </div>
                    </div>
                </div>

                {/* Pricing Info Sheet */}
                <AnimatePresence>
                    {isInfoOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-x-0 bottom-0 top-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-[2px] p-4"
                            onClick={(e) => { e.stopPropagation(); setIsInfoOpen(false); }}
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="w-full bg-white rounded-3xl p-6 shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900">Pricing Breakdown</h3>
                                    <button
                                        onClick={() => setIsInfoOpen(false)}
                                        className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center active:scale-95"
                                    >
                                        <X size={16} className="text-zinc-900" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 p-4 bg-zinc-50 rounded-2xl">
                                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                                            <span className="text-white font-black text-sm">₹</span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm uppercase text-zinc-900 mb-1">On-Road Price</h4>
                                            <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                                                Includes Ex-Showroom Price + Lifetime RTO Registration + 5-Year Comprehensive Insurance.
                                                <br />
                                                <span className="text-black font-bold mt-1 block">No hidden charges.</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-[#138808]/5 rounded-2xl border border-[#138808]/10">
                                        <div className="w-10 h-10 rounded-full bg-[#138808] flex items-center justify-center shrink-0">
                                            <span className="text-white font-black text-sm">%</span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm uppercase text-[#138808] mb-1">Lowest EMI</h4>
                                            <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                                                Calculated on 8.5% Interest for 60 Months tenure.
                                                <br />
                                                <span className="text-[#138808] font-bold mt-1 block">Downpayment starts at ₹0.</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mt-6" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 opacity-50">
                        <MapPin size={9} className="text-zinc-600" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">{location}</span>
                    </div>
                </div>

                {/* Ratings - Above button */}
                <div className="flex flex-col items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map(s => (
                                <Star key={s} size={10} className="fill-[#F4B000] text-[#F4B000]" />
                            ))}
                            <StarHalf size={10} className="fill-[#F4B000] text-[#F4B000]" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest leading-none">• 947K+ RATINGS</span>
                    </div>
                </div>

                <button
                    onClick={() => router.push(`/m/store/${product.make}/${product.model}/${product.variant}`)}
                    className="w-full h-14 bg-black border-2 border-black rounded-xl font-black text-white text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all relative overflow-hidden group hover:bg-zinc-900"
                >
                    <span className="relative z-10">KNOW MORE</span>
                    <div className="absolute inset-0 bg-zinc-800 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
            </div>
        </div>
    );
};
