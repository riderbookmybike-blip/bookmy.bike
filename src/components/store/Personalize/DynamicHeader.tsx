'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface DynamicHeaderProps {
    breadcrumb?: React.ReactNode;
    actions?: React.ReactNode;
    onBack?: () => void;
    className?: string;
}

/**
 * Enhanced DynamicHeader for Desktop PDP.
 * Provides contextual navigation (breadcrumbs) and global actions (Utility Navbar).
 */
export default function DynamicHeader({ breadcrumb, actions, onBack, className = '' }: DynamicHeaderProps) {
    if (!breadcrumb && !onBack && !actions) return null;

    return (
        <div className={`flex items-center justify-between ${className}`}>
            <div className="flex items-center gap-6">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="group w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full hover:bg-slate-900 transition-all duration-300 hover:scale-110 shadow-sm"
                    >
                        <ArrowLeft size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                )}
                {breadcrumb && (
                    <div className="text-[10px] font-black tracking-[0.25em] uppercase italic flex items-center gap-3 animate-in fade-in slide-in-from-left-6 duration-1000">
                        {breadcrumb}
                    </div>
                )}
            </div>

            {/* Global Actions Navbar */}
            {actions && <div className="flex items-center animate-in fade-in zoom-in duration-700">{actions}</div>}
        </div>
    );
}
