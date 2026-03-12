'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTenant, Membership } from '@/lib/tenant/tenantContext';
import { useDealerSession } from '@/hooks/useDealerSession';
import { createClient } from '@/lib/supabase/client';

/**
 * DealershipGate — Full-screen overlay blocking marketplace for staff without active dealership.
 *
 * Shows when: isStaff === true && !sessionDealerId
 * Lists: memberships from useTenant() — dealerships for DEALER staff, financer-mapped dealers for BANK staff.
 * On select: calls setDealerContext() → persists in localStorage → gate closes.
 */
export function DealershipGate() {
    const { memberships, userRole, tenantType } = useTenant();
    const { dealerId: sessionDealerId, isLoaded, setDealerContext, setFinanceContext } = useDealerSession();
    const [mappedDealerMemberships, setMappedDealerMemberships] = useState<Membership[]>([]);
    const autoActivatedRef = useRef(false);

    // Staff detection (same logic as LeadCaptureModal)
    const normalizedRole = String(userRole || '').toLowerCase();
    const isStaff = !!normalizedRole && normalizedRole !== 'member' && normalizedRole !== 'customer';

    // Filter memberships to dealership-type tenants (type DEALER or DEALERSHIP)
    // For BANK staff, show dealer memberships they have access to
    const dealerMemberships = useMemo(
        () =>
            (memberships || []).filter((m: Membership) => {
                const tenantType = m.tenants?.type?.toUpperCase();
                return tenantType === 'DEALER' || tenantType === 'DEALERSHIP';
            }),
        [memberships]
    );

    const financerMemberships = useMemo(
        () => (memberships || []).filter((m: Membership) => m.tenants?.type?.toUpperCase() === 'BANK'),
        [memberships]
    );
    const financeFetchKeyRef = useRef<string>('');

    const isFinancer = tenantType === 'BANK' || financerMemberships.length > 0;

    useEffect(() => {
        const loadFinanceMappedDealers = async () => {
            if (!isFinancer || financerMemberships.length === 0) {
                financeFetchKeyRef.current = '';
                setMappedDealerMemberships([]);
                return;
            }

            const primaryFinance = financerMemberships[0];
            const financeTenantId = (primaryFinance?.tenant_id || primaryFinance?.tenants?.id || null) as string | null;
            if (financeTenantId) {
                setFinanceContext(financeTenantId);
            } else {
                setMappedDealerMemberships([]);
                return;
            }

            const nextKey = `${financeTenantId}:${financerMemberships.length}`;
            if (financeFetchKeyRef.current === nextKey) return;
            financeFetchKeyRef.current = nextKey;

            const supabase = createClient();
            const { data: links } = await supabase
                .from('dealer_finance_access')
                .select('dealer_tenant_id')
                .eq('finance_tenant_id', financeTenantId);
            const dealerIds = Array.from(
                new Set((links || []).map((r: any) => String(r.dealer_tenant_id || '')).filter(Boolean))
            );
            if (dealerIds.length === 0) {
                setMappedDealerMemberships([]);
                return;
            }

            const { data: tenants } = await supabase
                .from('id_tenants')
                .select('id, name, slug, type')
                .in('id', dealerIds);
            const mapped = (tenants || []).map((t: any) => ({
                role: primaryFinance?.role || 'BANK_STAFF',
                tenant_id: t.id,
                tenants: {
                    id: t.id,
                    name: t.name,
                    slug: t.slug || '',
                    type: t.type || 'DEALER',
                },
            })) as Membership[];
            setMappedDealerMemberships(prev => {
                const prevIds = prev.map(p => p.tenant_id).join(',');
                const nextIds = mapped.map(p => p.tenant_id).join(',');
                return prevIds === nextIds ? prev : mapped;
            });
        };

        void loadFinanceMappedDealers();
    }, [isFinancer, financerMemberships, setFinanceContext]);

    // For financers, show all dealer memberships they have access to
    // For dealer staff, show their dealerships
    const displayMemberships =
        isFinancer && mappedDealerMemberships.length > 0
            ? mappedDealerMemberships
            : dealerMemberships.length > 0
              ? dealerMemberships
              : financerMemberships;

    useEffect(() => {
        if (!isStaff || !isLoaded || sessionDealerId || autoActivatedRef.current) return;
        const first = displayMemberships[0];
        const dealerId = first?.tenants?.id || first?.tenant_id;
        if (!dealerId) return;
        autoActivatedRef.current = true;
        setDealerContext(dealerId);
    }, [isStaff, isLoaded, sessionDealerId, displayMemberships, setDealerContext]);

    // Soft mode only: no blocking overlay. Marketplace stays accessible for all users.
    return null;
}
