'use client';

import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { useCrmMobile } from '@/hooks/useCrmMobile';

/**
 * Mobile View Banner
 *
 * Shows a compact, non-intrusive banner at bottom of screen on phone.
 * Per-session dismissible (sessionStorage).
 *
 * - Phone + flag ON: "View Only — switch to desktop to edit"
 * - Tablet + flag ON: subtle "Limited Editing" badge (top-right)
 * - Phone/Tablet + flag OFF: "Desktop recommended" notice
 * - Desktop: renders nothing
 */

const DISMISS_KEY = 'crm_mobile_banner_dismissed';

export function MobileViewBanner() {
    const { device, isMobileEnabled, isReadOnly, hydrated } = useCrmMobile();
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
        }
    }, []);

    // Don't render anything on desktop or before hydration
    if (!hydrated || device === 'desktop' || dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem(DISMISS_KEY, '1');
    };

    // Flag OFF → show "Desktop recommended" (not a blocker, just info)
    if (!isMobileEnabled) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4 pointer-events-none">
                <div className="mx-auto max-w-sm pointer-events-auto">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-white/95 backdrop-blur-xl shadow-2xl border border-white/10 dark:border-black/10">
                        <Monitor size={16} className="text-amber-400 dark:text-amber-600 shrink-0" />
                        <span className="text-[11px] font-semibold text-white dark:text-slate-900 leading-snug flex-1">
                            CRM works best on desktop
                        </span>
                        <button
                            onClick={handleDismiss}
                            data-crm-allow
                            className="text-[10px] font-bold text-white/60 dark:text-slate-500 hover:text-white dark:hover:text-slate-900 transition-colors px-2 py-1 shrink-0"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Phone + flag ON → "View Only" banner
    if (isReadOnly) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4 pointer-events-none">
                <div className="mx-auto max-w-sm pointer-events-auto">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-zinc-100/95 backdrop-blur-xl shadow-2xl border border-white/10 dark:border-black/10">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                            <span className="text-[10px]">👁️</span>
                        </div>
                        <span className="text-[11px] font-semibold text-white dark:text-slate-900 leading-snug flex-1">
                            View Only — switch to desktop to edit
                        </span>
                        <button
                            onClick={handleDismiss}
                            data-crm-allow
                            className="text-[10px] font-bold text-white/60 dark:text-slate-500 hover:text-white dark:hover:text-slate-900 transition-colors px-2 py-1 shrink-0"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Tablet + flag ON → subtle "Limited Editing" badge
    return (
        <div className="fixed top-[72px] right-4 z-[55]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Limited Editing
                </span>
            </div>
        </div>
    );
}
