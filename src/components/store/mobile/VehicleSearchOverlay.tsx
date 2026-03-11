'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowRight, Bike } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { searchVehicles, type SearchResult } from '@/actions/searchVehicles';

interface VehicleSearchOverlayProps {
    open: boolean;
    onClose: () => void;
}

export function VehicleSearchOverlay({ open, onClose }: VehicleSearchOverlayProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus input when overlay opens
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setResults([]);
            setActiveIndex(-1);
        }
    }, [open]);

    // Prevent body scroll when overlay is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // Debounced search
    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        setActiveIndex(-1);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.trim().length < 1) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const data = await searchVehicles(value.trim());
                setResults(data);
            } catch {
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 250);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, -1));
        }
        if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
            navigateTo(results[activeIndex]);
        }
    };

    const navigateTo = (result: SearchResult) => {
        onClose();
        router.push(result.href);
    };

    // Highlight matching text
    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;
        const words = query.toLowerCase().split(/\s+/);
        let result = text;
        words.forEach(word => {
            if (!word) return;
            const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            result = result.replace(regex, '⌈$1⌉');
        });
        // Now convert markers to JSX-safe format
        const parts = result.split(/⌈|⌉/);
        return parts.map((part, i) =>
            i % 2 === 1 ? (
                <span key={i} className="text-[#F4B000] font-black">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    const bodyTypeEmoji = (bt: string | null) => {
        if (!bt) return null;
        switch (bt.toUpperCase()) {
            case 'SCOOTER':
                return '🛵';
            case 'MOTORCYCLE':
                return '🏍️';
            case 'MOPED':
                return '🚲';
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[200] flex flex-col"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

                    {/* Search Panel */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative z-10 bg-white mx-0 mt-0 rounded-b-3xl shadow-2xl overflow-hidden"
                        style={{
                            paddingTop: 'env(safe-area-inset-top, 0px)',
                        }}
                    >
                        {/* Search Input Row */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                            <Search size={20} className="text-slate-400 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => handleSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search bikes... e.g. Honda Activa"
                                className="flex-1 text-[15px] font-semibold text-slate-900 placeholder:text-slate-300 outline-none bg-transparent"
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck={false}
                            />
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all shrink-0"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-[65vh] overflow-y-auto overscroll-contain">
                            {/* Loading state */}
                            {isLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-5 h-5 border-2 border-[#F4B000] border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Results list */}
                            {!isLoading && results.length > 0 && (
                                <div className="py-2">
                                    {results.map((result, index) => (
                                        <button
                                            key={result.id}
                                            onClick={() => navigateTo(result)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left ${
                                                index === activeIndex
                                                    ? 'bg-[#F4B000]/10'
                                                    : 'hover:bg-slate-50 active:bg-slate-100'
                                            }`}
                                        >
                                            {/* Vehicle thumbnail */}
                                            <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                {result.imageUrl ? (
                                                    <Image
                                                        src={result.imageUrl}
                                                        alt={result.label}
                                                        width={56}
                                                        height={56}
                                                        className="object-contain p-1"
                                                    />
                                                ) : (
                                                    <Bike size={20} className="text-slate-300" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                                                    {result.make}
                                                    {bodyTypeEmoji(result.bodyType) && (
                                                        <span className="ml-1">{bodyTypeEmoji(result.bodyType)}</span>
                                                    )}
                                                </p>
                                                <p className="text-[13px] font-black text-slate-900 leading-tight truncate">
                                                    {highlightMatch(`${result.model} ${result.variant}`, query)}
                                                </p>
                                            </div>

                                            {/* Arrow */}
                                            <ArrowRight
                                                size={16}
                                                className={`shrink-0 transition-colors ${
                                                    index === activeIndex ? 'text-[#F4B000]' : 'text-slate-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Empty state — only when query entered but no results */}
                            {!isLoading && query.trim().length > 0 && results.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 px-6">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                        <Search size={20} className="text-slate-300" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                        No vehicles found
                                    </p>
                                    <p className="text-[10px] text-slate-300 text-center">
                                        Try searching by brand, model, or variant name
                                    </p>
                                </div>
                            )}

                            {/* Hint — when input is empty */}
                            {!isLoading && query.trim().length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 px-6">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2">
                                        Quick search
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {['Honda', 'TVS', 'Bajaj', 'Hero', 'Yamaha'].map(brand => (
                                            <button
                                                key={brand}
                                                onClick={() => handleSearch(brand)}
                                                className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 hover:border-[#F4B000]/30 hover:text-[#F4B000] active:scale-95 transition-all"
                                            >
                                                {brand}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom accent */}
                        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#F4B000]/40 to-transparent" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
