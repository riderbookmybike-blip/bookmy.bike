'use client';

import React from 'react';
import { SlidersHorizontal, LayoutGrid, List, Zap, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import { StoreSearchBar } from '@/components/store/ui/StoreSearchBar';

interface DiscoveryBarProps {
    onFilterClick?: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearchSubmit?: (query: string) => void;
    pricingMode: 'cash' | 'finance';
    onPricingModeChange: (mode: 'cash' | 'finance') => void;
    onShareClick?: () => void;
    shareLabel?: string;
    shareActive?: boolean;
    centerContent?: React.ReactNode;
    onCompareClick?: () => void;
    compareCount?: number;
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
    hasActiveFilters?: boolean;
    className?: string;
    disableSticky?: boolean;
}

export function DiscoveryBar({
    onFilterClick,
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    pricingMode,
    onPricingModeChange,
    onShareClick,
    shareLabel = 'Share',
    shareActive = false,
    centerContent,
    onCompareClick,
    compareCount = 0,
    viewMode,
    onViewModeChange,
    hasActiveFilters = false,
    className = '',
    disableSticky = false,
}: DiscoveryBarProps) {
    /* shared styles for pill buttons */
    const pillBase =
        'inline-flex items-center gap-1.5 px-4 h-10 rounded-2xl border transition-all duration-300 text-[9px] font-black uppercase tracking-[0.1em]';
    const pillInactive =
        'bg-white/70 text-slate-500 border-black/10 hover:bg-white hover:text-slate-900 hover:border-black/20';

    return (
        <header
            className={`hidden md:block ${disableSticky ? '' : 'sticky z-[90] mb-6'} py-0 transition-all duration-700 ease-in-out ${className}`}
            style={disableSticky ? {} : { top: 'var(--header-h)' }}
        >
            <div className="w-full">
                <div
                    className="h-14 pr-2 pl-4 flex items-center rounded-[2rem] transition-all duration-500"
                    style={{
                        background: 'rgba(255,255,255,0.55)',
                        backdropFilter: 'blur(32px) saturate(160%)',
                        WebkitBackdropFilter: 'blur(32px) saturate(160%)',
                        border: '1px solid rgba(255,255,255,0.7)',
                        boxShadow: [
                            '0 8px 32px rgba(0,0,0,0.08)',
                            '0 1px 0 rgba(255,255,255,0.9) inset',
                            '0 -1px 0 rgba(255,255,255,0.3) inset',
                            '0 0 0 1px rgba(255,255,255,0.4) inset',
                        ].join(','),
                    }}
                >
                    <div className="flex items-center gap-3 w-full">
                        {/* ── Search bar (left) ── */}
                        <div className="flex-none min-w-[220px] lg:min-w-[300px] py-1">
                            <div
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        onSearchSubmit?.(searchQuery.trim());
                                    }
                                }}
                                className="h-10 rounded-2xl transition-all duration-300 border border-black/10"
                                style={{
                                    background: 'rgba(255,255,255,0.45)',
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                }}
                            >
                                <StoreSearchBar
                                    value={searchQuery}
                                    placeholder="FIND YOUR NEXT RIDE PARTNER..."
                                    onChange={onSearchChange}
                                    onClear={() => onSearchChange('')}
                                    className="h-full bg-transparent border-0"
                                />
                            </div>
                        </div>

                        {/* ── Center: flexible slot ── */}
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar pl-1">
                            {centerContent}
                        </div>

                        {/* ── Right: All controls as separate pill buttons ── */}
                        <div className="flex-none flex items-center gap-1.5">
                            {/* ── VIEW MODE toggle button (shows opposite mode) ── */}
                            {onViewModeChange && viewMode && (
                                <button
                                    onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
                                    className={`${pillBase} ${pillInactive}`}
                                    aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                                >
                                    {viewMode === 'grid' ? <List size={13} /> : <LayoutGrid size={13} />}
                                    <span>{viewMode === 'grid' ? 'List View' : 'Grid View'}</span>
                                </button>
                            )}

                            {/* ── PRICING MODE toggle button (shows opposite mode) ── */}
                            <button
                                onClick={() => onPricingModeChange(pricingMode === 'finance' ? 'cash' : 'finance')}
                                className={`${pillBase} ${pillInactive}`}
                                aria-label={
                                    pricingMode === 'finance' ? 'Switch to cash pricing' : 'Switch to finance pricing'
                                }
                            >
                                {pricingMode === 'finance' ? <Banknote size={12} /> : <Zap size={12} />}
                                {pricingMode === 'finance' ? 'Cash' : 'Finance'}
                            </button>

                            {/* ── FILTER button ── */}
                            {onFilterClick && (
                                <button
                                    onClick={onFilterClick}
                                    className={`${pillBase} relative group ${
                                        hasActiveFilters ? 'bg-[#F4B000] text-black border-black/20' : pillInactive
                                    }`}
                                >
                                    <SlidersHorizontal
                                        size={13}
                                        className="group-hover:rotate-12 transition-transform duration-500"
                                    />
                                    <span>Filter</span>
                                    {hasActiveFilters && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#F4B000] rounded-full ring-2 ring-white" />
                                    )}
                                </button>
                            )}

                            {/* ── COMPARE button ── */}
                            {onCompareClick && (
                                <button
                                    onClick={onCompareClick}
                                    className={`${pillBase} ${
                                        compareCount > 0
                                            ? 'bg-[#F4B000] text-black border-black/10 shadow-lg shadow-black/20'
                                            : pillInactive
                                    } group active:scale-[0.98]`}
                                >
                                    <svg
                                        width="11"
                                        height="11"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="group-hover:rotate-180 transition-transform duration-500"
                                    >
                                        <path d="M16 3h5v5" />
                                        <path d="M8 3H3v5" />
                                        <path d="M16 21h5v-5" />
                                        <path d="M8 21H3v-5" />
                                        <path d="M10 10l4 4" />
                                        <path d="M14 10l-4 4" />
                                    </svg>
                                    <span>Compare</span>
                                    {compareCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="flex items-center justify-center min-w-[16px] h-[16px] bg-brand-primary text-black text-[8px] font-black rounded-full"
                                        >
                                            {compareCount}
                                        </motion.span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
