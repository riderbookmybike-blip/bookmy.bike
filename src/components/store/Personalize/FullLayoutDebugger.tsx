/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';

/**
 * Dev-only overlay that displays real-time layout measurements:
 * header, sticky nav, content gaps, scroll position, and CSS variables.
 * Zero coupling to PDP state — reads DOM measurements only.
 */
const FullLayoutDebugger = () => {
    const [data, setData] = useState<any>({});

    useEffect(() => {
        const measure = () => {
            // 1. Main Header
            const header = document.querySelector('header[class*="fixed"], nav[class*="fixed"], [class*="AppHeader"]');
            const headerRect = header?.getBoundingClientRect();

            // 2. Sticky Nav
            const sticky = document.querySelector('.sticky-debug-target');
            const stickyRect = sticky?.getBoundingClientRect();
            const stickyComputed = sticky ? window.getComputedStyle(sticky) : null;

            // 3. First Content Card (after sticky)
            const content = document.querySelector('.content-debug-target');
            const contentRect = content?.getBoundingClientRect();

            // CSS Variable
            const headerH = getComputedStyle(document.documentElement).getPropertyValue('--header-h');

            setData({
                scrollY: Math.round(window.scrollY),
                headerH,
                header: {
                    bottom: Math.round(headerRect?.bottom || 0),
                    height: Math.round(headerRect?.height || 0),
                },
                sticky: {
                    top: Math.round(stickyRect?.top || 0),
                    bottom: Math.round(stickyRect?.bottom || 0),
                    height: Math.round(stickyRect?.height || 0),
                    computedTop: stickyComputed?.top || 'N/A',
                    zIndex: stickyComputed?.zIndex || 'N/A',
                },
                content: {
                    top: Math.round(contentRect?.top || 0),
                },
                gaps: {
                    headerToSticky: Math.round((stickyRect?.top || 0) - (headerRect?.bottom || 0)),
                    stickyToContent: Math.round((contentRect?.top || 0) - (stickyRect?.bottom || 0)),
                },
            });
        };

        window.addEventListener('scroll', measure);
        const interval = setInterval(measure, 500);
        measure();
        return () => {
            window.removeEventListener('scroll', measure);
            clearInterval(interval);
        };
    }, []);

    const gapColor = (gap: number) => (gap < 0 ? 'text-red-400' : gap === 0 ? 'text-yellow-400' : 'text-green-400');

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-black/95 text-white p-4 rounded-xl font-mono text-[10px] border-2 border-cyan-500 shadow-2xl max-w-xs pointer-events-none">
            <h3 className="font-bold text-cyan-400 mb-2 border-b border-white/10 pb-1">🔬 FULL LAYOUT DEBUGGER</h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                <p className="text-slate-400">Scroll Y:</p>
                <p>{data.scrollY}px</p>
                <p className="text-slate-400">--header-h:</p>
                <p>{data.headerH}</p>
            </div>

            <div className="border-t border-white/10 pt-2 mb-2">
                <p className="text-orange-400 font-bold mb-1">MAIN HEADER</p>
                <p>
                    Bottom: {data.header?.bottom}px | Height: {data.header?.height}px
                </p>
            </div>

            <div className="border-t border-white/10 pt-2 mb-2">
                <p className="text-red-400 font-bold mb-1">STICKY NAV</p>
                <p>
                    Top: {data.sticky?.top}px | Bottom: {data.sticky?.bottom}px
                </p>
                <p>
                    Height: {data.sticky?.height}px | Z: {data.sticky?.zIndex}
                </p>
                <p>CSS Top: {data.sticky?.computedTop}</p>
            </div>

            <div className="border-t border-white/10 pt-2 mb-2">
                <p className="text-blue-400 font-bold mb-1">CONTENT</p>
                <p>Top: {data.content?.top}px</p>
            </div>

            <div className="border-t border-white/10 pt-2">
                <p className="font-bold text-white mb-1">GAPS</p>
                <p className={gapColor(data.gaps?.headerToSticky || 0)}>
                    Header → Sticky: {data.gaps?.headerToSticky}px
                </p>
                <p className={gapColor(data.gaps?.stickyToContent || 0)}>
                    Sticky → Content: {data.gaps?.stickyToContent}px
                </p>
            </div>
        </div>
    );
};

export default FullLayoutDebugger;
