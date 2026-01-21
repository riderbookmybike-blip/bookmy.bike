'use client';

import React from 'react';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';

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
}

export default function ModuleLanding({
    title,
    subtitle,
    onNew,
    children,
    statsContent,
    searchPlaceholder = "Search records...",
    onSearch,
    view = 'list',
    onViewChange
}: ModuleLandingProps) {
    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0b0d10] p-8 overflow-y-auto no-scrollbar">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-indigo-500 rounded-full" />
                        {subtitle}
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
                        {title}
                        <span className="text-indigo-600">.</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Switcher */}
                    <div className="flex items-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-2xl">
                        <button
                            onClick={() => onViewChange?.('list')}
                            className={`p-3 rounded-xl transition-all ${view === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => onViewChange?.('grid')}
                            className={`p-3 rounded-xl transition-all ${view === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                    </div>

                    <div className="relative group max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            onChange={(e) => onSearch?.(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold min-w-[300px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
                        />
                    </div>

                    {onNew && (
                        <button
                            onClick={onNew}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-indigo-600/20 group"
                        >
                            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Section */}
            {statsContent && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    {statsContent}
                </div>
            )}

            {/* Main Content (Grid/List) */}
            <div className="flex-1 mt-4">
                {children}
            </div>
        </div>
    );
}
