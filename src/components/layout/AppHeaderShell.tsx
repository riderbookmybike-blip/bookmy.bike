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
        if (className.includes('header-solid-pdp')) {
            return 'bg-white/92 border-b border-slate-200/90 backdrop-blur-xl shadow-sm transition-all duration-300';
        }
        if (className.includes('header-transparent') || (transparentAtTop && !scrolled)) {
            return 'bg-transparent border-transparent shadow-none backdrop-blur-none';
        }
        if (variant === 'dashboard') {
            return 'bg-white/95 border-b border-slate-200/60 backdrop-blur-md shadow-sm transition-all duration-300';
        }
        if (className.includes('dark-theme')) {
            return 'bg-white/90 border-b border-slate-200/60 backdrop-blur-md shadow-none transition-all duration-500';
        }
        return 'bg-white/70 border-b border-slate-200 backdrop-blur-md shadow-none transition-all duration-500';
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
