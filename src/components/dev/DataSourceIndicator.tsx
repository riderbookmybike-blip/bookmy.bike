'use client';

import React from 'react';
import { Database, HardDrive, FileJson, AlertCircle } from 'lucide-react';

interface DataSourceIndicatorProps {
    source: 'LIVE' | 'LOCAL' | 'MOCK';
    className?: string;
}

/**
 * A small indicator to show where the page data is coming from.
 * Only renders in development mode.
 */
export default function DataSourceIndicator({ source, className = '' }: DataSourceIndicatorProps) {
    // Only show in development
    if (process.env.NODE_ENV === 'production' && source === 'LIVE') return null;

    const config = {
        LIVE: {
            icon: Database,
            text: 'Live DB',
            color: 'text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20',
            label: 'Data is synced with Supabase'
        },
        LOCAL: {
            icon: HardDrive,
            text: 'Local Storage',
            color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20',
            label: 'Data is ONLY in this browser (LocalStorage)'
        },
        MOCK: {
            icon: FileJson,
            text: 'Mock Data',
            color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20',
            label: 'Data is hardcoded in mock files'
        }
    };

    const style = config[source] || config.MOCK;
    const Icon = style.icon;

    return (
        <div
            title={style.label}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${style.color} ${className}`}
        >
            <Icon size={10} />
            <span>{style.text}</span>
            {source !== 'LIVE' && <AlertCircle size={10} className="animate-pulse" />}
        </div>
    );
}
