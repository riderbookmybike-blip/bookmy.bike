import React from 'react';

// Simple utility to join classes conditionally
const clsx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface PageFrameProps {
    children: React.ReactNode;
    className?: string;
    /**
     * Layout Width Variant:
     * - 'wide': 1920px (Catalog, Dashboards) - Legacy 'Premium Frame' default
     * - 'default': 1440px (Standard Content)
     * - 'narrow': 1100px (Forms, Checkout)
     */
    variant?: 'wide' | 'default' | 'narrow';
    /**
     * If true, removes the dynamic top padding.
     * Use this for hero pages where content should flow behind header.
     */
    noTopPadding?: boolean;
}

/**
 * Premium Page Frame
 *
 * Enforces the global layout system:
 * 1. Background/Backdrop: Handled by parent layout (bg-slate-50/950)
 * 2. Canvas: Aligned with header container width.
 * 3. Breathing Room: Shared page container padding.
 * 4. Headroom: Dynamic top padding based on --header-h variable.
 */
export const PageFrame: React.FC<PageFrameProps> = ({ children, className = '', noTopPadding = false }) => {
    return (
        <div
            className={clsx(
                // Layout & Sizing
                'page-container section-transition', // animates padding changes

                // Headroom (Top Spacing)
                // Default: Standard headroom (Header Height only).
                // noTopPadding: Used for Heroes that bleed behind header.
                !noTopPadding ? 'pt-[var(--header-h,80px)]' : undefined,

                // Bottom Spacing (Desktop Store Spec)
                'pb-12 md:pb-16',

                className
            )}
        >
            {children}
        </div>
    );
};
