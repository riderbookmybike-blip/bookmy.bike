'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import type { ThemePreference } from '@/lib/theme/themePreference';

interface ThemeModeSelectorProps {
    className?: string;
    compact?: boolean;
}

const options: Array<{
    value: ThemePreference;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeModeSelector({ className = '', compact = false }: ThemeModeSelectorProps) {
    const { theme, setTheme } = useTheme();

    return (
        <div
            role="radiogroup"
            aria-label="Theme Mode"
            className={`inline-flex items-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-1 gap-1 ${className}`}
        >
            {options.map(option => {
                const isActive = theme === option.value;
                const Icon = option.icon;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setTheme(option.value)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 ${
                            isActive
                                ? 'bg-slate-900 text-white dark:bg-brand-primary dark:text-black shadow-sm'
                                : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                        title={`Use ${option.label} theme`}
                    >
                        <Icon size={14} strokeWidth={2.2} />
                        {!compact && <span>{option.label}</span>}
                    </button>
                );
            })}
        </div>
    );
}
