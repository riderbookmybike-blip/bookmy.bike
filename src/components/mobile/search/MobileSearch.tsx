'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Mic, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCatalog } from '@/hooks/useCatalog';
import Image from 'next/image';

const RECENT_SEARCHES_KEY = 'bookmy_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export const MobileSearch = () => {
    const router = useRouter();
    const { items, isLoading } = useCatalog();
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to load recent searches', e);
            }
        }
    }, []);

    // Save search to recent searches
    const saveRecentSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setRecentSearches((prev) => {
            const filtered = prev.filter((s) => s.toLowerCase() !== searchQuery.toLowerCase());
            const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            const lowerQuery = query.toLowerCase();
            const filtered = items.filter((product) => {
                const make = product.make?.toLowerCase() || '';
                const model = product.model?.toLowerCase() || '';
                const variant = product.variant?.toLowerCase() || '';
                return (
                    make.includes(lowerQuery) ||
                    model.includes(lowerQuery) ||
                    variant.includes(lowerQuery)
                );
            });
            setSearchResults(filtered);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, items]);

    const handleSearch = (searchQuery: string) => {
        setQuery(searchQuery);
        if (searchQuery.trim()) {
            saveRecentSearch(searchQuery);
        }
    };

    const handleClear = () => {
        setQuery('');
        setSearchResults([]);
    };

    const handleRecentSearchClick = (search: string) => {
        setQuery(search);
        saveRecentSearch(search);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const handleProductClick = (product: any) => {
        router.push(`/m/store/${product.make}/${product.model}/${product.variant}`);
    };

    return (
        <div className="min-h-screen bg-black pb-24">
            {/* Search Header - Sticky */}
            <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10 px-5 py-4">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search size={20} className="text-zinc-500" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search bikes..."
                        autoFocus
                        className="w-full h-14 pl-12 pr-24 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#F4B000] focus:border-transparent transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {query && (
                            <button
                                onClick={handleClear}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 active:scale-95 transition-transform"
                            >
                                <X size={18} className="text-zinc-400" />
                            </button>
                        )}
                        <button
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 active:scale-95 transition-transform"
                            title="Voice Search"
                        >
                            <Mic size={18} className="text-zinc-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-5 py-6">
                {/* Recent Searches (show when no query) */}
                {!query && recentSearches.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-zinc-500" />
                                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">
                                    Recent Searches
                                </h2>
                            </div>
                            <button
                                onClick={clearRecentSearches}
                                className="text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((search, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleRecentSearchClick(search)}
                                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm font-medium text-white hover:border-[#F4B000] hover:bg-zinc-800 transition-all active:scale-95"
                                >
                                    {search}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Popular Searches (show when no query) */}
                {!query && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={16} className="text-[#F4B000]" />
                            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">
                                Trending Searches
                            </h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['Honda Activa', 'Royal Enfield', 'Electric Scooter', 'Yamaha MT', 'Suzuki Gixxer'].map((trend) => (
                                <button
                                    key={trend}
                                    onClick={() => handleSearch(trend)}
                                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm font-medium text-white hover:border-[#F4B000] hover:bg-zinc-800 transition-all active:scale-95"
                                >
                                    {trend}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Search Results */}
                {query && (
                    <AnimatePresence mode="wait">
                        {isSearching ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <div className="w-12 h-12 border-4 border-zinc-800 border-t-[#F4B000] rounded-full animate-spin mb-4" />
                                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                                    Searching...
                                </p>
                            </motion.div>
                        ) : searchResults.length > 0 ? (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="mb-4">
                                    <p className="text-sm font-black uppercase tracking-wider text-zinc-400">
                                        {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''} Found
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {searchResults.map((product) => (
                                        <motion.button
                                            key={product.id}
                                            onClick={() => handleProductClick(product)}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-[#F4B000] transition-all active:scale-95"
                                        >
                                            <div className="relative aspect-[4/3] bg-zinc-800">
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.model}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="p-3">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                                                    {product.make}
                                                </p>
                                                <p className="text-sm font-black text-white mb-1 truncate">
                                                    {product.model}
                                                </p>
                                                <p className="text-xs font-bold text-[#F4B000]">
                                                    ₹{product.price?.onRoad?.toLocaleString('en-IN') || 'N/A'}
                                                </p>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                                    <Search size={32} className="text-zinc-700" />
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mb-2">
                                    No Results Found
                                </h3>
                                <p className="text-sm text-zinc-500 font-medium text-center max-w-xs">
                                    Try different keywords or browse our catalog
                                </p>
                                <button
                                    onClick={() => router.push('/m')}
                                    className="mt-6 px-6 py-3 bg-[#F4B000] rounded-xl text-sm font-black uppercase tracking-wider text-black active:scale-95 transition-transform"
                                >
                                    Browse All Bikes
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};
