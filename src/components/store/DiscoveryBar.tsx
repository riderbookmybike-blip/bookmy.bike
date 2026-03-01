'use client';

import React from 'react';
import { Menu, Search, Share2, X } from 'lucide-react';

interface DiscoveryBarProps {
    /** Called when the hamburger/filter button is clicked */
    onFilterClick?: () => void;
    /** Current search text */
    searchQuery: string;
    /** Called whenever the search input changes */
    onSearchChange: (query: string) => void;
    /** Called when the user presses Enter in the search box */
    onSearchSubmit?: (query: string) => void;
    /** Active pricing mode */
    pricingMode: 'cash' | 'finance';
    /** Called when the user switches cash/finance */
    onPricingModeChange: (mode: 'cash' | 'finance') => void;
    /** Optional share action shown before cash/finance toggle */
    onShareClick?: () => void;
    /** Optional label override for share button */
    shareLabel?: string;
    /** Optional copied/success visual state */
    shareActive?: boolean;
    /** Optional content rendered in the flexible center area (chips, breadcrumbs, etc.) */
    centerContent?: React.ReactNode;
    /**
     * Extra class names applied to the outer <header> element.
     * Use this to control visibility / slide-in animation from the parent.
     * Defaults to 'opacity-100 translate-y-0'.
     */
    className?: string;
}

/**
 * DiscoveryBar — the single shared second sticky navbar used on
 * Catalog, Wishlist, and Compare pages.
 *
 * Drop it anywhere inside a `page-container` div and pass the
 * page-specific state/handlers as props.
 */
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
    className = '',
}: DiscoveryBarProps) {
    return (
        <header
            className={`hidden md:block sticky z-[90] py-0 mb-6 transition-all duration-700 ease-in-out ${className}`}
            style={{ top: 'var(--header-h)', marginTop: '20px' }}
        >
            <div className="w-full">
                <div className="rounded-[2rem] bg-white/75 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.4)_inset] h-14 pr-2 pl-4 flex items-center transition-all duration-500 hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)]">
                    <div className="flex items-center gap-4 w-full">
                        {/* ── Left: Filter / Menu button ── */}
                        <button
                            onClick={onFilterClick}
                            className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/40 border border-slate-200/40 text-slate-500 hover:text-slate-900 hover:bg-white hover:border-slate-300 transition-all duration-300 shrink-0 group"
                        >
                            <Menu size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                        </button>

                        {/* ── Search bar ── */}
                        <div className="flex-none min-w-[240px] lg:min-w-[320px]">
                            <div className="relative flex items-center gap-3 w-full bg-slate-100/30 hover:bg-slate-100/50 border border-slate-200/30 rounded-2xl px-4 h-10 transition-all duration-500 group focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-primary/5 focus-within:border-brand-primary/10">
                                <Search
                                    size={16}
                                    className="text-slate-400 group-focus-within:text-brand-primary group-focus-within:scale-110 transition-all duration-300"
                                />
                                <input
                                    type="text"
                                    placeholder="FIND YOUR NEXT MACHINE..."
                                    value={searchQuery}
                                    onChange={e => onSearchChange(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            onSearchSubmit?.(searchQuery.trim());
                                        }
                                    }}
                                    className="flex-1 min-w-0 bg-transparent text-[10px] font-black tracking-[0.2em] uppercase focus:outline-none placeholder:text-slate-400/50"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => onSearchChange('')}
                                        className="flex items-center justify-center w-6 h-6 rounded-full text-slate-300 hover:text-slate-900 hover:bg-slate-200/50 transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── Center: flexible slot for chips / breadcrumbs ── */}
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar pl-2">
                            {centerContent}
                        </div>

                        {/* ── Right: Share + Cash / Finance toggle ── */}
                        <div className="flex-none flex items-center ml-4 pl-6 border-l border-slate-200/40">
                            {onShareClick && (
                                <button
                                    onClick={onShareClick}
                                    className={`mr-2 inline-flex items-center gap-1.5 px-4 h-10 rounded-2xl border transition-all duration-300 text-[9px] font-black uppercase tracking-[0.1em] ${
                                        shareActive
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-white/70 text-slate-600 border-slate-200/60 hover:bg-white hover:text-slate-900'
                                    }`}
                                >
                                    <Share2 size={13} />
                                    {shareActive ? 'Copied' : shareLabel}
                                </button>
                            )}
                            <div className="flex items-center p-1 bg-slate-100/60 rounded-2xl border border-slate-200/40 h-10 shadow-inner">
                                {(
                                    [
                                        { id: 'finance', label: 'Finance' },
                                        { id: 'cash', label: 'Cash' },
                                    ] as const
                                ).map(mode => (
                                    <button
                                        key={mode.id}
                                        onClick={() => onPricingModeChange(mode.id)}
                                        className={`px-6 h-full rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                            pricingMode === mode.id
                                                ? 'bg-[#FFD700] text-black shadow-sm'
                                                : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/50'
                                        }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
