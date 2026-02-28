'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Sparkles, Zap, Heart, Star, StarHalf } from 'lucide-react';
import type { ProductVariant } from '@/types/productMaster';

interface TvCatalogProps {
    items: ProductVariant[];
    isLoading?: boolean;
    needsLocation?: boolean;
    onLocationClick?: () => void;
}

/**
 * TvCatalog - The "Cinema Mode" 10ft Experience.
 * Optimized for Smart TVs (high contrast, large typography, remote-friendly).
 */
export const TvCatalog = ({
    items = [],
    isLoading = false,
    needsLocation = false,
    onLocationClick,
}: TvCatalogProps) => {
    return (
        <div className="min-h-screen bg-[#0b0d10] text-white font-sans overflow-hidden">
            {/* Immersive Header / Discovery Bar */}
            <header className="sticky top-0 z-50 px-28 py-12 flex items-center justify-between bg-gradient-to-b from-[#0b0d10] to-transparent">
                <div className="flex items-center gap-12">
                    <div className="text-4xl font-black italic tracking-tighter text-[#F4B000]">
                        BOOKMY<span className="text-white">.BIKE</span>
                    </div>
                    <nav className="flex items-center gap-12 text-sm font-black uppercase tracking-[0.3em] text-slate-400">
                        <span className="text-[#F4B000] border-b-2 border-[#F4B000] pb-1">Catalog</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Wishlist</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Comparison</span>
                    </nav>
                </div>

                <div className="flex items-center gap-8">
                    <button
                        onClick={onLocationClick}
                        className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                    >
                        <MapPin size={24} className="text-[#F4B000]" />
                        <span className="text-lg font-black uppercase tracking-widest group-hover:text-[#F4B000] transition-colors">
                            Set Location
                        </span>
                    </button>
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/20 overflow-hidden">
                        <img
                            src="/images/placeholders/user_avatar.jpg"
                            alt="User"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </header>

            <main className="px-28 pb-32">
                {/* Cinema Mode Category Title */}
                <div className="mb-16">
                    <h1 className="text-7xl font-black uppercase italic tracking-tighter mb-4">
                        Elite <span className="text-[#F4B000]">Machines</span>
                    </h1>
                    <p className="text-2xl text-slate-400 font-medium tracking-wide max-w-2xl leading-relaxed">
                        Curated collection of high-performance motorcycles and premium scooters for your next adventure.
                    </p>
                </div>

                {/* Ultra-High Whitespace Catalog Grid */}
                <div className="grid grid-cols-3 gap-24">
                    {items.map((v, idx) => (
                        <motion.div
                            key={v.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative"
                        >
                            {/* Cinematic Poster Card */}
                            <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden bg-white/5 border border-white/10 shadow-2xl transition-all duration-700 group-hover:scale-[1.03] group-hover:border-[#F4B000]/30 group-hover:shadow-[#F4B000]/10">
                                {/* Background Vignette / Brand Watermark */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                    <span className="text-[120px] font-black italic uppercase tracking-widest rotate-[-10deg]">
                                        {v.make}
                                    </span>
                                </div>

                                {/* Main Machine Image */}
                                <img
                                    src={v.imageUrl || '/images/placeholders/bike_placeholder.png'}
                                    className="absolute inset-0 w-full h-full object-contain p-12 z-20 transition-transform duration-700 group-hover:scale-110"
                                    alt={v.model}
                                />

                                {/* Elite Labels (Floating) */}
                                <div className="absolute top-10 left-10 z-30 flex flex-col gap-4">
                                    {(v.price?.discount || 0) > 0 && (
                                        <div className="px-6 py-3 bg-emerald-500 rounded-2xl shadow-xl flex items-center gap-3">
                                            <Sparkles size={18} className="fill-white text-white" />
                                            <span className="text-sm font-black uppercase tracking-widest text-white">
                                                Save ₹{(v.price?.discount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute top-10 right-10 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:text-rose-500 transition-colors">
                                        <Heart size={28} />
                                    </button>
                                </div>

                                {/* Info Panel - Glassmorphism */}
                                <div className="absolute bottom-0 inset-x-0 p-12 z-40 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-xl font-black text-[#F4B000] uppercase tracking-[0.2em] mb-3 italic">
                                        {v.make}
                                    </p>
                                    <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-6">
                                        {v.model}
                                    </h3>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                                                On-Road From
                                            </p>
                                            <p className="text-4xl font-black text-white italic">
                                                ₹{(v.price?.onRoad || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="px-8 py-5 bg-[#F4B000] text-black rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-2xl">
                                            Elite View
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
};
