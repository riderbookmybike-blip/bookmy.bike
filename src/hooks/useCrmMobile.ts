'use client';

import { useMemo } from 'react';
import { useBreakpoint, DeviceBreakpoint } from '@/hooks/useBreakpoint';
import { useTenant } from '@/lib/tenant/tenantContext';

/**
 * CRM Mobile access control hook.
 *
 * Reads `CRM_MOBILE_ENABLED` from tenantConfig.features.
 * Returns device-segmented access levels:
 *   - Phone (≤480px):   read-only always
 *   - Tablet (481–1024): limited edit (safe fields only)
 *   - Desktop (>1024):  full edit
 *
 * If feature flag is OFF or tenantConfig hasn't loaded yet → desktop-only behavior.
 */
export interface CrmMobileAccess {
    /** Current device breakpoint */
    device: DeviceBreakpoint;
    /** Whether CRM_MOBILE_ENABLED flag is on */
    isMobileEnabled: boolean;
    /** True when device is phone (read-only enforced) */
    isReadOnly: boolean;
    /** True when editing is allowed (desktop always, tablet if limited) */
    canEdit: boolean;
    /** True when full editing is allowed (desktop only) */
    canFullEdit: boolean;
    /** Whether client-side hydration is complete */
    hydrated: boolean;
    /** Whether tenantConfig has loaded (feature flag resolved) */
    configLoaded: boolean;
}

export function useCrmMobile(): CrmMobileAccess {
    const { device, hydrated } = useBreakpoint();
    const { tenantConfig } = useTenant();

    return useMemo(() => {
        const configLoaded = tenantConfig !== null;
        const isMobileEnabled = !!tenantConfig?.features?.CRM_MOBILE_ENABLED;

        // If flag is OFF → force desktop behavior (no mobile UI at all)
        if (!isMobileEnabled) {
            return {
                device,
                isMobileEnabled: false,
                isReadOnly: false,
                canEdit: true,
                canFullEdit: true,
                hydrated,
                configLoaded,
            };
        }

        // Flag is ON → apply device segmentation
        const isPhone = device === 'phone';
        const isDesktop = device === 'desktop';

        return {
            device,
            isMobileEnabled: true,
            isReadOnly: isPhone,
            canEdit: !isPhone, // tablet + desktop can edit
            canFullEdit: isDesktop, // only desktop gets full edit
            hydrated,
            configLoaded,
        };
    }, [device, hydrated, tenantConfig]);
}
