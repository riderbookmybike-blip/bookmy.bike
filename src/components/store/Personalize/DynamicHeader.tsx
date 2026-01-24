'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface DynamicHeaderProps {
    breadcrumb?: React.ReactNode;
    onBack?: () => void;
    className?: string;
}

/**
 * Minimal DynamicHeader for Desktop PDP.
 * Identity & Pricing are handled by the Sidebar HUD.
 * This component only provides contextual navigation.
 */
export default function DynamicHeader({ breadcrumb, onBack, className = '' }: DynamicHeaderProps) {
    if (!breadcrumb && !onBack) return null;

    return (
        <div className={`flex items-center gap-6 py-2 pt-8 ${className}`}>
            {onBack && (
                <button
                    onClick={onBack}
                    className="group w-10 h-10 flex items-center justify-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full hover:bg-slate-900 dark:hover:bg-brand-primary transition-all duration-300 hover:scale-110 shadow-sm"
                >
                    <ArrowLeft size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                </button>
            )}
            {breadcrumb && (
                <h2 className="flex flex-wrap items-center gap-x-5 gap-y-2 animate-in fade-in slide-in-from-left-6 duration-1000">
                    <div className="flex items-center gap-2 group cursor-default">
                        <div className="relative flex items-center justify-center">
                            <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_#F4B000]" />
                            <span className="absolute w-2 h-2 bg-brand-primary rounded-full animate-ping opacity-75" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                            YOU ARE HERE
                        </span>
                    </div>

                    <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden sm:block mx-1" />

                    <div className="text-[10px] font-black tracking-[0.25em] uppercase italic flex items-center gap-3">
                        {breadcrumb}
                    </div>
                </h2>
            )}
        </div>
    );
}
