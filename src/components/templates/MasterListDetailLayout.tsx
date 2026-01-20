'use client';

import React from 'react';

interface MasterListDetailLayoutProps {
    children: React.ReactNode;
    mode?: 'list-only' | 'list-detail' | 'detail-only';
}

export default function MasterListDetailLayout({
    children,
    mode = 'list-detail',
}: MasterListDetailLayoutProps) {
    const childArray = React.Children.toArray(children);
    const listChild = childArray[0];
    const detailChild = childArray[1];

    // List-only mode: Full-width list, no detail panel
    if (mode === 'list-only') {
        return (
            <div className="flex h-full overflow-hidden" style={{ height: '100%' }}>
                <div className="flex-1 h-full min-h-0">
                    {listChild}
                </div>
            </div>
        );
    }

    // Detail-only mode: Full-width detail, no list panel
    if (mode === 'detail-only') {
        return (
            <div className="flex h-full overflow-hidden bg-white dark:bg-slate-950">
                <div className="flex-1 h-full min-w-0">
                    {detailChild}
                </div>
            </div>
        );
    }

    // List-detail mode: Split view
    return (
        <div className="flex h-full overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500" style={{ height: '100%' }}>
            {/* List Panel - Fixed width */}
            <div className="w-[320px] min-w-[280px] max-w-[360px] h-full flex-shrink-0 relative z-10 border-r border-slate-200/60 dark:border-white/5">
                {listChild}
            </div>

            {/* Detail Panel - Takes remaining space */}
            <div className="flex-1 h-full min-w-[500px] overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
                {detailChild}
            </div>
        </div>
    );
}
