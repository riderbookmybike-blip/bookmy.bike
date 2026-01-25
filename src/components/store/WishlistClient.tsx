'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Heart, ArrowRight, Plus } from 'lucide-react';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { useCatalog } from '@/hooks/useCatalog';
import { ProductCard } from '@/components/store/CatalogDesktop';

export const WishlistClient = () => {
    const { favorites, clearFavorites } = useFavorites();
    const { items: catalogItems, isLoading } = useCatalog();

    // UI Local State for Cards
    const [downpayment] = useState(25000);
    const [tenure] = useState(36);

    // Map favorites to full ProductVariant data from catalog
    const wishlistItems = useMemo(() => {
        if (!catalogItems.length) return [];
        return favorites
            .map(fav => catalogItems.find(item => item.id === fav.id))
            .filter((item): item is NonNullable<typeof item> => !!item);
    }, [favorites, catalogItems]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-pulse">
                <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-full mb-6" />
                <div className="h-8 w-48 bg-slate-200 dark:bg-white/5 rounded-lg mb-4" />
                <div className="h-4 w-64 bg-slate-200 dark:bg-white/5 rounded-lg" />
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <div className="w-32 h-32 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-10 relative">
                    <Heart size={48} className="text-slate-300 dark:text-slate-700" />
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="absolute -top-2 -right-2 w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center shadow-lg"
                    >
                        <Plus size={24} className="text-black" />
                    </motion.div>
                </div>

                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white mb-4">
                    Your Wishlist is Empty
                </h2>
                <p className="max-w-[40ch] text-slate-500 dark:text-slate-400 font-medium text-lg mb-10 leading-relaxed">
                    Bring home your dream ride. Start exploring our premium collection and save your favorites.
                </p>

                <Link
                    href="/store/catalog"
                    className="group flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-black px-10 py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-slate-100 transition-all hover:gap-5 shadow-2xl"
                >
                    Explore Catalog
                    <ArrowRight size={18} />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-4 text-brand-primary">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                        <Heart size={28} fill="currentColor" />
                    </div>
                    <span className="text-[14px] md:text-[16px] font-black uppercase tracking-[0.4em] italic">Personal Collection</span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={clearFavorites}
                        className="px-8 py-4 rounded-2xl border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white hover:text-rose-500 hover:border-rose-500/50 transition-all text-[12px] font-black uppercase tracking-[0.2em] bg-white dark:bg-white/5 shadow-sm active:scale-95"
                    >
                        Clear All
                    </button>
                    <Link
                        href="/store/catalog"
                        className="px-8 py-4 rounded-2xl bg-brand-primary text-black text-[12px] font-black uppercase tracking-[0.2em] hover:bg-[var(--brand-primary)] hover:scale-105 transition-all shadow-xl flex items-center gap-3 active:scale-95"
                    >
                        <Plus size={16} />
                        Add More
                    </Link>
                </div>
            </div>

            {/* Grid Section - Using exact same ProductCard from Catalog */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
                <AnimatePresence mode='popLayout'>
                    {wishlistItems.map((v) => (
                        <motion.div
                            key={v.id}
                            layout
                            variants={itemVariants}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        >
                            <ProductCard
                                v={v}
                                viewMode="grid"
                                downpayment={downpayment}
                                tenure={tenure}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* In case some items are not in catalog anymore */}
            {wishlistItems.length < favorites.length && (
                <div className="mt-8 p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/10 text-center">
                    <p className="text-sm text-slate-400">
                        Note: {favorites.length - wishlistItems.length} items from your wishlist are no longer available in the active catalog.
                    </p>
                </div>
            )}
        </div>
    );
};
