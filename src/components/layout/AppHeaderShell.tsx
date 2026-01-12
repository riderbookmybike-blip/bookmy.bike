'use client';

import React from 'react';

interface AppHeaderShellProps {
    left?: React.ReactNode;
    center?: React.ReactNode;
    right?: React.ReactNode;
    children?: React.ReactNode;
    scrolled?: boolean;
    transparentAtTop?: boolean;
    className?: string;
}

/**
 * Canonical Header Shell for BookMyBike.
 * Locks the header height to 80px (h-20) and provides theme-aware separation.
 */
export const AppHeaderShell: React.FC<AppHeaderShellProps> = ({
    left,
    center,
    right,
    children,
    scrolled = false,
    transparentAtTop = false,
    className = '',
}) => {
    // Standard separation and background based on theme and scroll state
    const bgClass =
        transparentAtTop && !scrolled
            ? 'bg-transparent border-b-transparent'
            : 'bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shadow-sm';

    return (
        <>
            <header
                className={`sticky top-0 z-50 h-24 w-full flex items-center transition-all duration-300 ${bgClass} ${className}`}
            >
                <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20 flex items-center justify-between h-full">
                    {/* Left Slot: Logo / Brand */}
                    <div className="flex-shrink-0 flex items-center h-full">{left}</div>

                    {/* Center Slot: Navigation Links */}
                    <div className="hidden md:flex flex-1 justify-center items-center h-full mx-8">{center}</div>

                    {/* Right Slot: Actions Cluster (Theme Toggle, User Profile, etc.) */}
                    <div className="flex-shrink-0 flex items-center justify-end gap-3 h-full">{right}</div>
                </div>
            </header>
            {children}
        </>
    );
};
