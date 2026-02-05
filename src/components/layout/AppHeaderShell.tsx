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
    variant?: 'marketplace' | 'dashboard';
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
    variant = 'marketplace',
    className = '',
}) => {
    // Quick rollback: switch to 'spacious' for the previous 96px height + wider container.
    const containerClass = 'page-container';

    // Variant-based background and border styles
    const getBgClass = () => {
        // Premium behavior: Transparent at top, Glass when scrolled
        if (variant === 'dashboard') {
            // Dashboard: Clean, solid, professional
            return 'bg-white dark:bg-[#0B0D10] border-b border-slate-200/60 dark:border-white/5 shadow-sm dark:shadow-none transition-all duration-300';
        }

        // Marketplace: Premium Dark Glass (both modes)
        // Light: black @ 40% for darker look with white icons visible
        // Dark: black @ 30%
        return 'bg-black/40 dark:bg-black/30 backdrop-blur-[24px] dark:backdrop-blur-[12px] backdrop-saturate-150 border-b border-white/10 dark:border-white/10 shadow-lg dark:shadow-2xl transition-all duration-500';
    };

    const bgClass = getBgClass();

    return (
        <>
            {/* Top trigger zone for mouse interaction when header is hidden */}
            <div
                className="fixed top-0 left-0 right-0 h-4 z-[110] pointer-events-auto"
                onMouseEnter={() =>
                    visible === false &&
                    typeof window !== 'undefined' &&
                    window.dispatchEvent(new CustomEvent('showHeader'))
                }
            />
            <header
                className={`fixed top-0 left-0 right-0 z-[100] w-full flex items-center transition-all duration-500 header ${bgClass} ${className}`}
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
