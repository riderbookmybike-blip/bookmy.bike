'use client';

import React, { useState, useEffect } from 'react';

interface DeviceLayoutProps {
    mobile: React.ReactNode;
    tablet?: React.ReactNode;
    desktop: React.ReactNode;
    tv?: React.ReactNode;
}

export const DeviceLayout: React.FC<DeviceLayoutProps> = ({ mobile, tablet, desktop, tv }) => {
    const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // SSR fallback or initial load
    if (viewport === null) {
        return <div className="invisible">{desktop}</div>;
    }

    const { width } = viewport;
    const isTv = width >= 1536;

    // 768px - 1023px for Tablet (if provided, fallback to mobile or desktop)
    const content = isTv && tv ? tv : width >= 1024 ? desktop : width >= 768 && tablet ? tablet : mobile;

    return (
        <>
            {/* DEBUG OVERLAY: REMOVE AFTER DIAGNOSIS */}
            <div className="fixed top-0 left-0 bg-black/80 text-white p-2 z-[9999] text-xs font-mono border border-white/20">
                VP: {width}x{viewport.height} | Mode:{' '}
                {isTv ? 'TV' : width >= 1024 ? 'Desktop' : width >= 768 ? 'Tablet' : 'Mobile'}
            </div>
            {content}
        </>
    );
};
