'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, LayoutGrid, List, Zap, Banknote, GitCompareArrows, Share2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreSearchBar } from '@/components/store/ui/StoreSearchBar';

interface DiscoveryBarProps {
    onFilterClick?: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearchSubmit?: (query: string) => void;
    searchSuggestions?: {
        key: string;
        make: string;
        model: string;
        count: number;
        bodyType?: string;
        kind?: 'model' | 'brand';
    }[];
    onSuggestionSelect?: (make: string, model: string, kind?: 'model' | 'brand') => void;
    pricingMode: 'cash' | 'finance';
    onPricingModeChange: (mode: 'cash' | 'finance') => void;
    offerMode?: 'BEST_OFFER' | 'FAST_DELIVERY';
    onOfferModeChange?: (mode: 'BEST_OFFER' | 'FAST_DELIVERY') => void;
    onShareClick?: () => void;
    shareLabel?: string;
    shareActive?: boolean;
    centerContent?: React.ReactNode;
    onCompareClick?: () => void;
    compareCount?: number;
    compareCap?: number;
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
    allowedViewModes?: Array<'grid' | 'list'>;
    hasActiveFilters?: boolean;
    className?: string;
    disableSticky?: boolean;
    reduceEffects?: boolean;
}

export function DiscoveryBar({
    onFilterClick,
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    searchSuggestions = [],
    onSuggestionSelect,
    pricingMode,
    onPricingModeChange,
    offerMode,
    onOfferModeChange,
    onShareClick,
    shareLabel = 'Share',
    shareActive = false,
    centerContent,
    onCompareClick,
    compareCount = 0,
    compareCap,
    viewMode,
    onViewModeChange,
    allowedViewModes = ['grid', 'list'],
    hasActiveFilters = false,
    className = '',
    disableSticky = false,
    reduceEffects = false,
}: DiscoveryBarProps) {
    /* shared styles for pill buttons */
    const pillBase =
        'inline-flex items-center gap-1.5 px-4 h-10 rounded-2xl border transition-all duration-300 text-[9px] font-black uppercase tracking-[0.1em]';
    const pillInactive =
        'bg-white/70 text-slate-500 border-black/10 hover:bg-white hover:text-slate-900 hover:border-black/20';

    const canToggleView =
        onViewModeChange && viewMode && allowedViewModes.includes(viewMode) && allowedViewModes.length > 1;

    // Dropdown state
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const nextPricingMode: 'cash' | 'finance' = pricingMode === 'finance' ? 'cash' : 'finance';
    const nextViewMode: 'grid' | 'list' =
        viewMode === 'grid' && allowedViewModes.includes('list')
            ? 'list'
            : viewMode === 'list' && allowedViewModes.includes('grid')
              ? 'grid'
              : allowedViewModes[0];
    const displayCompareCount = typeof compareCap === 'number' ? Math.min(compareCount, compareCap) : compareCount;

    return (
        <header
            className={`hidden md:block ${disableSticky ? '' : `sticky z-[90] ${reduceEffects ? 'mb-2' : 'mb-6'}`} py-0 transition-all duration-700 ease-in-out ${className}`}
            style={disableSticky ? {} : { top: 'var(--header-h)' }}
        >
            <div className="w-full">
                <div
                    className={`${reduceEffects ? 'h-12' : 'h-14'} pr-2 pl-4 flex items-center rounded-[2rem] transition-all duration-500`}
                    style={{
                        background: reduceEffects ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.55)',
                        backdropFilter: reduceEffects ? 'none' : 'blur(32px) saturate(160%)',
                        WebkitBackdropFilter: reduceEffects ? 'none' : 'blur(32px) saturate(160%)',
                        border: reduceEffects ? '1px solid rgba(226,232,240,1)' : '1px solid rgba(255,255,255,0.7)',
                        boxShadow: [
                            '0 8px 32px rgba(0,0,0,0.08)',
                            '0 1px 0 rgba(255,255,255,0.9) inset',
                            '0 -1px 0 rgba(255,255,255,0.3) inset',
                            '0 0 0 1px rgba(255,255,255,0.4) inset',
                        ].join(','),
                    }}
                >
                    <div className="flex items-center gap-3 w-full">
                        {/* ── Search bar (left) with instant dropdown ── */}
                        <div className="flex-none min-w-[220px] lg:min-w-[300px] py-1 relative" ref={searchRef}>
                            <div
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        onSearchSubmit?.(searchQuery.trim());
                                        setDropdownOpen(false);
                                    }
                                    if (e.key === 'Escape') setDropdownOpen(false);
                                }}
                                className={`${reduceEffects ? 'h-9' : 'h-10'} rounded-full transition-all duration-300 border border-black/10`}
                                style={{
                                    background: reduceEffects ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)',
                                    backdropFilter: reduceEffects ? 'none' : 'blur(8px)',
                                    WebkitBackdropFilter: reduceEffects ? 'none' : 'blur(8px)',
                                }}
                            >
                                <StoreSearchBar
                                    value={searchQuery}
                                    placeholder="FIND YOUR NEXT RIDE PARTNER..."
                                    onChange={v => {
                                        onSearchChange(v);
                                        setDropdownOpen(true);
                                    }}
                                    onClear={() => {
                                        onSearchChange('');
                                        setDropdownOpen(false);
                                    }}
                                    onFocus={() => setDropdownOpen(true)}
                                    variant="smart"
                                    className="h-full bg-transparent border-0"
                                />
                            </div>

                            {/* Instant search dropdown */}
                            {dropdownOpen && searchSuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 z-[200] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                    {searchSuggestions.map((s, i) => (
                                        <button
                                            key={s.key}
                                            onMouseDown={e => {
                                                e.preventDefault();
                                                onSuggestionSelect?.(s.make, s.model, s.kind);
                                                onSearchChange(s.kind === 'brand' ? s.make : s.model);
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left ${
                                                i > 0 ? 'border-t border-slate-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Search size={11} className="text-slate-300 shrink-0" />
                                                <div className="min-w-0">
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 truncate block">
                                                        {s.kind === 'brand' ? s.make : s.model}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">
                                                        {s.kind === 'brand' ? 'Brand' : s.make}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black text-[#F4B000] shrink-0">
                                                {s.count}{' '}
                                                {s.kind === 'brand'
                                                    ? `model${s.count !== 1 ? 's' : ''}`
                                                    : `variant${s.count !== 1 ? 's' : ''}`}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Center: flexible slot ── */}
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar pl-1">
                            {centerContent}
                        </div>

                        {/* ── Right: All controls as separate pill buttons ── */}
                        <div className="flex-none flex items-center gap-1.5">
                            {/* ── PRICING MODE toggle (Single-button Flip) ── */}
                            <button
                                onClick={() => onPricingModeChange(nextPricingMode)}
                                className={`${pillBase} bg-white shadow-sm border-black/10 text-slate-900 hover:border-black/20`}
                                aria-label={
                                    nextPricingMode === 'finance'
                                        ? 'Switch to finance pricing'
                                        : 'Switch to cash pricing'
                                }
                            >
                                {nextPricingMode === 'finance' ? (
                                    <>
                                        <Zap size={11} className="text-amber-500" />
                                        <span>Finance</span>
                                    </>
                                ) : (
                                    <>
                                        <Banknote size={11} className="text-emerald-500" />
                                        <span>Cash</span>
                                    </>
                                )}
                            </button>

                            {/* ── VIEW MODE toggle (Grid ↔ List) ── */}
                            {canToggleView && (
                                <button
                                    onClick={() => onViewModeChange!(nextViewMode)}
                                    className={`${pillBase} bg-white shadow-sm border-black/10 text-slate-900 hover:border-black/20`}
                                    aria-label={nextViewMode === 'list' ? 'Switch to list view' : 'Switch to grid view'}
                                >
                                    {viewMode === 'grid' ? (
                                        <>
                                            <List size={13} className="text-slate-700" />
                                            <span>List</span>
                                        </>
                                    ) : (
                                        <>
                                            <LayoutGrid size={13} className="text-slate-700" />
                                            <span>Grid</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* ── FILTER / COMPARE Slot (Consolidated) ── */}
                            <AnimatePresence mode="wait">
                                {displayCompareCount > 0 ? (
                                    <motion.button
                                        key="compare"
                                        initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
                                        animate={{ opacity: 1, scale: 1.05, rotateY: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        onClick={onCompareClick}
                                        className={`${pillBase} bg-[#F4B000] border-amber-400 text-black shadow-lg shadow-amber-200/50`}
                                    >
                                        <GitCompareArrows size={14} className="rotate-12" />
                                        <span>Compare ({displayCompareCount})</span>
                                    </motion.button>
                                ) : (
                                    onFilterClick && (
                                        <motion.button
                                            key="filter"
                                            initial={{ opacity: 0, scale: 0.9, rotateY: -90 }}
                                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, rotateY: 90 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            onClick={onFilterClick}
                                            className={`${pillBase} bg-white shadow-sm border-black/10 text-slate-900 hover:border-black/20 group`}
                                        >
                                            <SlidersHorizontal
                                                size={13}
                                                className="group-hover:rotate-12 transition-transform duration-500 text-slate-900"
                                            />
                                            <span>Filter</span>
                                            {hasActiveFilters && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                                        </motion.button>
                                    )
                                )}
                            </AnimatePresence>

                            {/* ── SHARE button ── */}
                            {onShareClick && (
                                <button
                                    onClick={onShareClick}
                                    className={`${pillBase} ${
                                        shareActive ? 'bg-slate-900 text-white border-slate-900' : pillInactive
                                    }`}
                                    aria-label={shareLabel}
                                >
                                    <Share2 size={12} />
                                    <span>{shareLabel}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
