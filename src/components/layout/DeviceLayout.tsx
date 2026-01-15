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
