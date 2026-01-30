'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/contexts/FavoritesContext';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';

export default function FavoritesPage() {
    const { favorites, removeFavorite } = useFavorites();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50">
            <MobileHeader />

            {/* Page Header */}
            <div className="pt-20 pb-6 px-6">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900">Saved Bikes</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            {favorites.length} {favorites.length === 1 ? 'bike' : 'bikes'} saved
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                        <Heart className="size-6 fill-red-500 stroke-red-500" />
                    </div>
                </motion.div>
            </div>

            {/* Favorites Grid */}
            <div className="px-6 pb-24">
                {favorites.length === 0 ? (
                    // Empty State
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
                            <Heart className="size-10 stroke-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">No saved bikes yet</h3>
                        <p className="text-sm text-zinc-500 mb-6 text-center max-w-xs">
                            Tap the heart icon on any bike to save it here
                        </p>
                        <button
                            onClick={() => router.push('/m')}
                            className="px-6 py-3 bg-black text-white rounded-full font-bold text-sm flex items-center gap-2"
                        >
                            Browse Bikes
                            <ChevronRight className="size-4" />
                        </button>
                    </motion.div>
                ) : (
                    // Grid of Favorites
                    <div className="grid grid-cols-2 gap-4">
                        <AnimatePresence>
                            {favorites.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative bg-white rounded-2xl overflow-hidden shadow-sm"
                                >
                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeFavorite(item.id)}
                                        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center"
                                    >
                                        <X className="size-4 stroke-white" />
                                    </button>

                                    {/* Card Content - Touchable */}
                                    <button
                                        onClick={() => router.push(`/m/product/${item.slug}`)}
                                        className="w-full"
                                    >
                                        {/* Image */}
                                        <div className="relative w-full h-32 bg-gradient-to-br from-zinc-100 to-zinc-50">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.model}
                                                fill
                                                className="object-contain p-2"
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="p-3">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                                {item.make}
                                            </p>
                                            <h3 className="text-sm font-black text-zinc-900 leading-tight mb-1">
                                                {item.model}
                                            </h3>
                                            <p className="text-xs text-zinc-500 mb-2">{item.variant}</p>
                                            <p className="text-base font-black text-zinc-900">
                                                ₹{(item.price / 100000).toFixed(2)}L
                                            </p>
                                        </div>
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
