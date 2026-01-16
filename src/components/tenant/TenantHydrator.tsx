'use client';

import { useEffect } from 'react';
import { useTenant, Membership, TenantType, TenantConfig } from '@/lib/tenant/tenantContext';

interface TenantHydratorProps {
    userName: string | null;
    role: string | null;
    tenantId: string | null;
    tenantName: string | null;
    tenantSlug: string | null;
    tenantType: TenantType | null;
    tenantConfig: TenantConfig | null;
    memberships: Membership[];
}

export default function TenantHydrator({
    userName,
    role,
    tenantId,
    tenantName,
    tenantSlug,
    tenantType,
    tenantConfig,
    memberships,
}: TenantHydratorProps) {
    const {
        setUserName,
        setUserRole,
        setActiveRole,
        setTenantId,
        setTenantName,
        setTenantType,
        setTenantConfig,
        setMemberships,
    } = useTenant();

    useEffect(() => {
        if (userName) {
            localStorage.setItem('user_name', userName);
            setUserName(userName);
        }
        if (role) {
            localStorage.setItem('user_role', role);
            localStorage.setItem('active_role', role);
            setUserRole(role);
            setActiveRole(role);
        }
        if (tenantId) {
            localStorage.setItem('tenant_id', tenantId);
            setTenantId(tenantId);
        }
        if (tenantName) {
            localStorage.setItem('tenant_name', tenantName);
            setTenantName(tenantName);
        }
        if (tenantSlug) {
            localStorage.setItem('tenant_slug', tenantSlug);
        }
        if (tenantType) {
            localStorage.setItem('tenant_type', tenantType);
            setTenantType(tenantType);
        }
        if (tenantConfig) {
            setTenantConfig(tenantConfig);
        }
        if (memberships.length > 0) {
            setMemberships(memberships);
        }
        if (!localStorage.getItem('base_role')) {
            localStorage.setItem('base_role', 'BMB_USER');
        }
    }, [
        userName,
        role,
        tenantId,
        tenantName,
        tenantSlug,
        tenantType,
        tenantConfig,
        memberships,
        setUserName,
        setUserRole,
        setActiveRole,
        setTenantId,
        setTenantName,
        setTenantType,
        setTenantConfig,
        setMemberships,
    ]);

    return null;
}
