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
        <div className={`flex items-center gap-4 py-2 pt-24 ${className}`}>
            {onBack && (
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={16} />
                </button>
            )}
            {breadcrumb && (
                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 animate-in fade-in duration-500">
                    {breadcrumb}
                </div>
            )}
        </div>
    );
}
