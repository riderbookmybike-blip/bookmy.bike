'use client';

import React from 'react';
import { Search, Plus, List, LayoutGrid } from 'lucide-react';

type Device = 'phone' | 'tablet' | 'desktop';

interface ModuleLandingProps {
    title: string;
    subtitle: string;
    onNew?: () => void;
    children: React.ReactNode;
    statsContent?: React.ReactNode;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    view?: 'grid' | 'list';
    onViewChange?: (view: 'grid' | 'list') => void;
    /** Device from useBreakpoint — drives responsive sizing */
    device?: Device;
    /** Whether to hide action buttons (read-only mode) */
    hideActions?: boolean;
}

export default function ModuleLanding({
    title,
    subtitle,
    onNew,
    children,
    statsContent,
    searchPlaceholder = 'Search records...',
    onSearch,
    view = 'list',
    onViewChange,
    device = 'desktop',
    hideActions = false,
}: ModuleLandingProps) {
    const isPhone = device === 'phone';
    const isTablet = device === 'tablet';

    // Enterprise Responsive sizing
    const wrapperPadding = isPhone ? 'p-4' : 'px-6 py-6';
    const titleSize = isPhone ? 'text-xl' : 'text-2xl';

    return (
        <div className={`flex flex-col h-full bg-[#f8fafc] ${wrapperPadding} overflow-y-auto no-scrollbar`}>
            {/* 1. Header Section - Clean & Persistent */}
            <div
                className={`flex flex-col ${isPhone ? 'gap-4 mb-6' : 'md:flex-row md:items-center justify-between gap-6 mb-8'}`}
            >
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-[1.5px] bg-indigo-500 rounded-full" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                            {subtitle}
                        </span>
                    </div>
                    <h1 className={`${titleSize} font-black text-slate-900 uppercase tracking-tight`}>
                        {title}
                        <span className="text-indigo-600">.</span>
                    </h1>
                </div>

                <div className={`flex items-center gap-2 ${isPhone ? 'w-full' : ''}`}>
                    {/* Compact Search */}
                    <div className={`relative group ${isPhone ? 'flex-1' : 'w-72'}`}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            onChange={e => onSearch?.(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>

                    {/* View Switcher - Enterprise Compact */}
                    {!isPhone && (
                        <div className="flex items-center bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
                            <button
                                onClick={() => onViewChange?.('list')}
                                className={`p-1.5 rounded transition-all ${view === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => onViewChange?.('grid')}
                                className={`p-1.5 rounded transition-all ${view === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    )}

                    {onNew && !hideActions && (
                        <button
                            onClick={onNew}
                            className="bg-slate-900 hover:bg-indigo-600 text-white p-2.5 rounded-lg transition-all active:scale-95 shadow-md shadow-slate-900/10 group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Stats Section - Gated Visibility */}
            {statsContent && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">{statsContent}</div>
            )}

            {/* 3. Main Content Rendering */}
            <div className="flex-1">{children}</div>
        </div>
    );
}
