'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Mic, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import Image from 'next/image';
import { PhoneBottomNav } from '@/components/phone/layout/PhoneBottomNav';

const RECENT_SEARCHES_KEY = 'bookmy_recent_searches';
const MAX_RECENT_SEARCHES = 3;

import { FullPageDeal } from './FullPageDeal';

const SearchFeed = ({ results }: { results: any[] }) => {
    return (
        <div className="flex flex-col gap-1 pb-24 bg-black">
            {results.map((product, index) => (
                <div key={product.id} className="h-[100dvh] w-full sticky top-0 md:relative">
                    <FullPageDeal
                        product={product}
                        isActive={true} // Always active for visibility in list
                    />
                </div>
            ))}

            {/* End of results spacer */}
            <div className="h-40 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                End of Results
            </div>
        </div>
    );
};

export const PhoneSearch = () => {
    const router = useRouter();
    const { items } = useSystemCatalogLogic();
    const { brands } = useSystemBrandsLogic();
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Initialize from localStorage
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

    const saveRecentSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;
        setRecentSearches((prev) => {
            const filtered = prev.filter((s) => s.toLowerCase() !== searchQuery.toLowerCase());
            const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Search logic derived from catalog items
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
    };

    const handleClear = () => {
        setQuery('');
        setSearchResults([]);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const handleProductClick = (product: any) => {
        saveRecentSearch(`${product.make} ${product.model}`);
        router.push(`/phone/store/catalog?model=${product.slug}`);
    };

    // Derived trending from actual brands and categories
    const trendingItems = useMemo(() => {
        const categories = ['Electric', 'Scooter', 'Motorcycle'];
        const dynamicBrands = brands.length > 0
            ? brands.slice(0, 3).map(b => b.name)
            : ['Honda', 'TVS', 'Hero'];
        return [...categories, ...dynamicBrands];
    }, [brands]);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Search Header */}
            <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10 px-5 py-6">
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
                        className="w-full h-14 pl-12 pr-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#ff9d00] transition-all"
                    />
                    {query && (
                        <button
                            onClick={handleClear}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800"
                        >
                            <X size={16} className="text-zinc-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div>
                {!query && (
                    <div className="space-y-8 px-5 py-6">
                        {recentSearches.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-zinc-500" />
                                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Recent</h2>
                                    </div>
                                    <button onClick={clearRecentSearches} className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Clear</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map((s, i) => (
                                        <button key={i} onClick={() => handleSearch(s)} className="px-5 py-2.5 bg-zinc-900 border border-white/5 rounded-full text-xs font-black uppercase tracking-widest text-white">{s}</button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={16} className="text-[#ff9d00]" />
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Trending</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {trendingItems.map((trend) => (
                                    <button key={trend} onClick={() => handleSearch(trend)} className="px-6 py-3 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white hover:border-[#ff9d00]/50 transition-colors">
                                        {trend}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {query && (
                    <div>
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <div className="w-10 h-10 border-2 border-zinc-800 border-t-[#ff9d00] rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Searching Ledger</span>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <SearchFeed results={searchResults} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                                <h3 className="text-lg font-black uppercase italic text-zinc-400 tracking-tighter">Zero Hits</h3>
                                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Adjustment Query Required</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            {/* Note: In full page search feed, bottom nav might overlap content, handled by pb-24 in SearchFeed */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <PhoneBottomNav />
            </div>
        </div>
    );
};
