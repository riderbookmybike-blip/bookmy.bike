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

    const { width, height } = viewport;

    // Smart TV Detection:
    // 1. Explicit width >= 1536 (4K/Ultra-Wide)
    // 2. Viewport 960x540 with DPR >= 2 (1080p TV Scaling)
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    const isTv = width >= 1536 || (width === 960 && height === 540 && dpr >= 2);

    if (isTv && tv) {
        return <>{tv}</>;
    }

    if (width >= 1024) {
        return <>{desktop}</>;
    }

    if (width >= 768 && tablet) {
        return <>{tablet}</>;
    }

    // Default to Mobile
    return <>{mobile}</>;
};
