'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';

type Device = 'phone' | 'tablet' | 'desktop';

interface MasterListDetailLayoutProps {
    children: React.ReactNode;
    mode?: 'list-only' | 'list-detail' | 'detail-only';
    listPosition?: 'left' | 'right';
    /** Device from useBreakpoint — drives stacked vs split layout */
    device?: Device;
    /** Whether a detail item is active (used for phone/tablet stacked mode) */
    hasActiveDetail?: boolean;
    /** Back button callback for phone/tablet full-screen detail */
    onBack?: () => void;
}

export default function MasterListDetailLayout({
    children,
    mode = 'list-detail',
    listPosition = 'left',
    device = 'desktop',
    hasActiveDetail = false,
    onBack,
}: MasterListDetailLayoutProps) {
    const childArray = React.Children.toArray(children);
    const listChild = childArray[0];
    const detailChild = childArray[1];

    const isCompact = device === 'phone' || device === 'tablet';

    // List-only mode: Full-width list, no detail panel
    if (mode === 'list-only') {
        return (
            <div className="flex h-full w-full overflow-hidden" style={{ height: '100%' }}>
                <div className="flex-1 h-full min-h-0">{listChild}</div>
            </div>
        );
    }

    // Detail-only mode: Full-width detail, no list panel
    if (mode === 'detail-only') {
        return (
            <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#0b0d10]">
                <div className="flex-1 h-full min-w-0">{detailChild}</div>
            </div>
        );
    }

    // ── PHONE / TABLET: Stacked mode (list OR full-screen detail) ──
    if (isCompact && mode === 'list-detail') {
        if (hasActiveDetail && detailChild) {
            return (
                <div
                    className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-[#0b0d10]"
                    style={{ height: '100%' }}
                >
                    {/* Back bar */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0b0d10] shrink-0">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors min-h-[44px] px-2"
                            data-crm-allow
                        >
                            <ChevronLeft size={16} />
                            Back
                        </button>
                    </div>
                    {/* Full-screen detail */}
                    <div className="flex-1 h-full min-w-0 overflow-hidden">{detailChild}</div>
                </div>
            );
        }

        // Show list only
        return (
            <div className="flex h-full w-full overflow-hidden" style={{ height: '100%' }}>
                <div className="flex-1 h-full min-h-0">{listChild}</div>
            </div>
        );
    }

    // ── DESKTOP: Original split-pane layout ──
    const isRight = listPosition === 'right';

    return (
        <div
            className={`w-full flex h-full overflow-hidden bg-white dark:bg-[#0b0d10] transition-colors duration-500 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}
            style={{ height: '100%' }}
        >
            {/* List Panel - Fixed width */}
            <div
                className={`w-[320px] min-w-[280px] max-w-[360px] h-full flex-shrink-0 relative z-10 ${isRight ? 'border-l' : 'border-r'} border-slate-200/60 dark:border-white/5`}
            >
                {listChild}
            </div>

            {/* Detail Panel - Takes remaining space */}
            <div className="flex-1 h-full min-w-[500px] overflow-hidden bg-slate-50/50 dark:bg-[#0b0d10]/50">
                {detailChild}
            </div>
        </div>
    );
}
