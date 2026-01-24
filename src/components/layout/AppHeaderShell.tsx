'use client';

import React from 'react';

interface AppHeaderShellProps {
    left?: React.ReactNode;
    center?: React.ReactNode;
    right?: React.ReactNode;
    children?: React.ReactNode;
    scrolled?: boolean;
    visible?: boolean;
    transparentAtTop?: boolean;
    className?: string;
}

/**
 * Canonical Header Shell for BookMyBike.
 * Compact preset defaults to 80px height with tighter content width.
 */
export const AppHeaderShell: React.FC<AppHeaderShellProps> = ({
    left,
    center,
    right,
    children,
    scrolled = false,
    visible = true,
    transparentAtTop = false,
    className = '',
}) => {
    // Quick rollback: switch to 'spacious' for the previous 96px height + wider container.
    const containerClass = 'max-w-[1600px] px-6 md:px-12 lg:px-20';

    // Premium Unified States from Plan:
    // 1. Home Top: Transparent background, border-b-white/5.
    // 2. Scrolled/Inner: bg-black/60, backdrop-blur-md, border-b-white/10.
    const bgClass =
        transparentAtTop && !scrolled
            ? 'bg-transparent border-b border-transparent'
            : 'bg-black/85 md:bg-black/60 backdrop-blur-md backdrop-saturate-150 border-b border-white/5 md:border-white/10 shadow-2xl';

    return (
        <>
            {/* Top trigger zone for mouse interaction when header is hidden */}
            <div
                className="fixed top-0 left-0 right-0 h-4 z-[60] pointer-events-auto"
                onMouseEnter={() =>
                    visible === false &&
                    typeof window !== 'undefined' &&
                    window.dispatchEvent(new CustomEvent('showHeader'))
                }
            />
            <header
                className={`sticky top-0 z-50 w-full flex items-center transition-all duration-500 ${bgClass} ${className}`}
                style={{ height: 'var(--header-h)' }}
                onMouseEnter={() =>
                    typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('showHeader'))
                }
            >
                <div className={`w-full mx-auto flex items-center justify-between h-full ${containerClass}`}>
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
