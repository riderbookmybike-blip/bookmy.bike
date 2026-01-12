'use client';

import React, { useState, useEffect } from 'react';

interface DeviceLayoutProps {
    mobile: React.ReactNode;
    tablet?: React.ReactNode;
    desktop: React.ReactNode;
}

export const DeviceLayout: React.FC<DeviceLayoutProps> = ({ mobile, tablet, desktop }) => {
    const [width, setWidth] = useState<number | null>(null);

    useEffect(() => {
        // Initial set
        setWidth(window.innerWidth);

        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // SSR fallback or initial load
    if (width === null) {
        return <div className="invisible">{desktop}</div>;
    }

    // 1024px+ for Desktop
    if (width >= 1024) {
        return <>{desktop}</>;
    }

    // 768px - 1023px for Tablet (if provided, fallback to mobile or desktop)
    if (width >= 768 && tablet) {
        return <>{tablet}</>;
    }

    // Default to Mobile
    return <>{mobile}</>;
};
