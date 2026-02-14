'use client';

import React, { createContext, useContext } from 'react';
import { useCrmMobile, CrmMobileAccess } from '@/hooks/useCrmMobile';

/**
 * CRM Read-Only Guard
 *
 * Wraps CRM content to enforce device-segmented access:
 *   - Phone: disables form inputs, buttons, textareas, selects (via CSS)
 *            BUT keeps links, tabs, navigation, scrolling, and text selection working.
 *   - Tablet: marks destructive/advanced actions with `data-crm-readonly`
 *   - Desktop: transparent pass-through (zero impact)
 *
 * Child components can use useCrmAccess() to check access level.
 */

const CrmAccessContext = createContext<CrmMobileAccess>({
    device: 'desktop',
    isMobileEnabled: false,
    isReadOnly: false,
    canEdit: true,
    canFullEdit: true,
    hydrated: false,
    configLoaded: false,
});

export const useCrmAccess = () => useContext(CrmAccessContext);

export function CrmReadOnlyGuard({ children }: { children: React.ReactNode }) {
    const access = useCrmMobile();

    // If flag OFF or desktop → pure pass-through, zero overhead
    if (!access.isMobileEnabled || access.device === 'desktop') {
        return <CrmAccessContext.Provider value={access}>{children}</CrmAccessContext.Provider>;
    }

    return (
        <CrmAccessContext.Provider value={access}>
            <div
                data-crm-device={access.device}
                data-crm-readonly={access.isReadOnly || undefined}
                data-crm-limited={access.device === 'tablet' || undefined}
            >
                {/* Smart CSS: blocks only interactive form elements, allows navigation */}
                {access.isReadOnly && (
                    <style>{`
                        [data-crm-readonly] button:not([data-crm-allow]),
                        [data-crm-readonly] input:not([data-crm-allow]),
                        [data-crm-readonly] textarea:not([data-crm-allow]),
                        [data-crm-readonly] select:not([data-crm-allow]),
                        [data-crm-readonly] [contenteditable]:not([data-crm-allow]),
                        [data-crm-readonly] [role="switch"]:not([data-crm-allow]),
                        [data-crm-readonly] [role="checkbox"]:not([data-crm-allow]),
                        [data-crm-readonly] [data-crm-action]:not([data-crm-allow]) {
                            pointer-events: none !important;
                            opacity: 0.5 !important;
                            cursor: not-allowed !important;
                            user-select: none !important;
                        }
                        /* Ensure tabs, links, and navigation remain clickable */
                        [data-crm-readonly] a,
                        [data-crm-readonly] [role="tab"],
                        [data-crm-readonly] [role="tablist"],
                        [data-crm-readonly] nav,
                        [data-crm-readonly] [data-crm-allow] {
                            pointer-events: auto !important;
                            opacity: 1 !important;
                            cursor: pointer !important;
                        }
                    `}</style>
                )}

                {/* Tablet: grey out destructive buttons only */}
                {access.device === 'tablet' && (
                    <style>{`
                        [data-crm-limited] [data-destructive],
                        [data-crm-limited] [data-crm-full-only] {
                            pointer-events: none !important;
                            opacity: 0.4 !important;
                            cursor: not-allowed !important;
                        }
                    `}</style>
                )}

                {children}
            </div>
        </CrmAccessContext.Provider>
    );
}
