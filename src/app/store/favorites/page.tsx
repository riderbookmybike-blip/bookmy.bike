'use client';

import React from 'react';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { useCatalog } from '@/hooks/useCatalog';
import { useCompare } from '@/hooks/useCompare';
import { PageFrame } from '@/components/layout/PageFrame';
import { Heart, Search, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/utils/slugs';

export default function FavoritesPage() {
    const { favorites, toggleFavorite } = useFavorites();
    const { items: vehicles, isLoading } = useCatalog();
    const { addToCompare, isInCompare, removeFromCompare, compareList } = useCompare();

    // Filter vehicles that are in favorites
    const favoriteVehicles = vehicles.filter(v => favorites.includes(v.id));

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-white dark:border-t-transparent" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Loading Favorites...</p>
            </div>
        );
    }

    return (
        <PageFrame variant="wide" className="space-y-10">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">Garage</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 max-w-lg">
                        You've shortlisted <span className="font-bold text-slate-900 dark:text-white">{favorites.length}</span> machines. Compare them side-by-side or proceed to booking.
                    </p>
                </div>

                {compareList.length > 0 && (
                    <Link href="/store/compare" className="px-8 py-4 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-3 active:scale-95">
                        Compare {compareList.length} Items <ArrowRight size={14} />
                    </Link>
                )}
            </div>

            {/* Empty State */}
            {favoriteVehicles.length === 0 && (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-8 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[3rem]">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-white/10 rounded-full flex items-center justify-center">
                        <Heart size={32} className="text-slate-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Your Garage is Empty</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Start exploring machines to add them here</p>
                    </div>
                    <Link href="/store/catalog" className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                        Explore Catalog
                    </Link>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {favoriteVehicles.map((v, idx) => {
                    // Pricing Logic (Mock)
                    const basePriceStr = v.make === 'Royal Enfield' ? '2.15' : '0.85';
                    const basePrice = parseFloat(basePriceStr) * 100000;
                    const onRoadPrice = Math.round(basePrice * 1.15);
                    const offerPrice = Math.round(onRoadPrice * 0.94);

                    return (
                        <div
                            key={v.id}
                            className="group relative bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col"
                        >
                            {/* Image */}
                            <div className="aspect-[4/3] bg-slate-100 dark:bg-[#14161b] flex items-center justify-center p-6 overflow-hidden relative group-hover:bg-slate-200 dark:group-hover:bg-[#1b1e24] transition-colors">
                                {/* Remove Button */}
                                <button
                                    onClick={() => toggleFavorite(v.id)}
                                    className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                                >
                                    <X size={14} />
                                </button>

                                <div className="relative w-full h-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700 ease-out">
                                    <span className="font-black text-[10px] text-slate-300 dark:text-slate-700 uppercase italic opacity-40 text-center tracking-[0.5em] leading-relaxed">
                                        {v.make} <br /> {v.model}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6 flex-1 flex flex-col">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 italic mb-1">{v.make}</p>
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none">
                                        {v.model}
                                    </h3>
                                </div>

                                <div className="mt-auto pt-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">₹{offerPrice.toLocaleString('en-IN')}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href={`/store/${slugify(v.make)}/${slugify(v.model)}/${slugify(v.variant)}`}
                                            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-center transition-all italic shadow-lg shadow-blue-600/20"
                                        >
                                            Book Now
                                        </Link>
                                        <button
                                            onClick={() => isInCompare(v.id) ? removeFromCompare(v.id) : addToCompare(v)}
                                            className={`px-4 py-3 border rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all italic ${isInCompare(v.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white'}`}
                                        >
                                            {isInCompare(v.id) ? 'Added' : 'Compare'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </PageFrame>
    );
}
