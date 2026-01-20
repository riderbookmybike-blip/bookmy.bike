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
 * 2. Canvas: Max-width constraints based on variant.
 * 3. Breathing Room: Responsive h-padding (px-6 to px-20).
 * 4. Headroom: Dynamic top padding based on --header-h variable.
 */
export const PageFrame: React.FC<PageFrameProps> = ({
    children,
    className = "",
    variant = 'wide',
    noTopPadding = false
}) => {

    // Variant Max-Width Map (Phase 2 Spec)
    const maxWidthClass = {
        wide: 'max-w-[1800px]', // Catalog, Dashboard
        default: 'max-w-[1280px]', // Standard Content
        narrow: 'max-w-[1024px]', // Forms, Text
    }[variant];

    return (
        <div
            className={clsx(
                // Layout & Sizing
                "w-full mx-auto section-transition", // animates padding changes
                maxWidthClass,

                // Side Breathing Room (Desktop Store Spec: 6 -> 12 -> 20 scale)
                "px-6 md:px-12 lg:px-20",

                // Headroom (Top Spacing)
                // Default: Standard headroom (Header Height only).
                // noTopPadding: Used for Heroes that bleed behind header.
                !noTopPadding ? "pt-[var(--header-h,80px)]" : undefined,

                // Bottom Spacing (Desktop Store Spec)
                "pb-12 md:pb-16",

                className
            )}
        >
            {children}
        </div>
    );
};
