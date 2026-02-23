'use client';

import * as React from 'react';
import { Lock, Sun } from 'lucide-react';

interface ThemeModeSelectorProps {
    className?: string;
    compact?: boolean;
}

export function ThemeModeSelector({ className = '', compact = false }: ThemeModeSelectorProps) {
    return (
        <div
            role="note"
            aria-label="Theme mode is locked to light"
            className={`inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 gap-1 ${className}`}
        >
            <div className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-sm">
                <Sun size={14} strokeWidth={2.2} />
                {!compact && <span>Light</span>}
            </div>
            {!compact && (
                <span className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <Lock size={12} strokeWidth={2.2} />
                    Locked
                </span>
            )}
        </div>
    );
}
