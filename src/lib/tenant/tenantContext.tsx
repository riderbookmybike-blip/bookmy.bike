'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export type TenantType = 'DEALER' | 'MARKETPLACE' | 'AUMS' | 'BANK';

// Enhanced TenantContext with Status props
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL_EXPIRED';

export interface Membership {
    id: string;
    role: string;
    status: string;
    tenant_id: string;
    user_id: string;
    tenants?: {
        id: string;
        name: string;
        slug: string;
        type: string;
        config?: Record<string, unknown>;
    };
}

export interface TenantConfig {
    brand: {
        displayName: string;
        primaryColor: string;
        logoUrl?: string;
        faviconUrl?: string;
    };
    portal?: {
        landingEnabled?: boolean;
        landingRedirectTo?: string;
    };
    features?: Record<string, boolean>;
    setup?: {
        isComplete: boolean;
        step: number;
    };
}

interface TenantContextType {
    tenantType?: TenantType;
    tenantName: string;
    tenantConfig: TenantConfig | null;
    userName: string;
    tenantId?: string;
    tenantSlug?: string;
    userRole?: string;
    activeRole?: string;
    referralCode?: string;
    memberships: Membership[];
    setTenantType: (type: TenantType) => void;
    setTenantName: (name: string) => void;
    setTenantConfig: (config: TenantConfig | null) => void;
    setUserName: (name: string) => void;
    setTenantId: (id: string) => void;
    setUserRole: (role: string) => void;
    setActiveRole: (role: string) => void;
    setReferralCode: (code: string) => void;
    setMemberships: (data: Membership[]) => void;
    switchRole: (role: string) => void;
    isSidebarExpanded: boolean;
    setIsSidebarExpanded: (expanded: boolean) => void;
    isReadOnly: boolean;
    status: TenantStatus;
}

const TenantContext = createContext<TenantContextType>({
    tenantName: '',
    tenantConfig: null,
    userName: '',
    memberships: [],
    setTenantType: () => {},
    setTenantName: () => {},
    setTenantConfig: () => {},
    setUserName: () => {},
    setTenantId: () => {},
    setUserRole: () => {},
    setActiveRole: () => {},
    setReferralCode: () => {},
    setMemberships: () => {},
    switchRole: () => {},
    isSidebarExpanded: false,
    setIsSidebarExpanded: () => {},
    isReadOnly: false,
    status: 'ACTIVE',
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    const pathname = usePathname();
    const [tenantType, setTenantTypeState] = useState<TenantType | undefined>(undefined);
    const [tenantName, setTenantNameState] = useState('');
    const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
    const [userName, setUserName] = useState('');
    const [tenantId, setTenantId] = useState<string | undefined>(undefined);
    const [tenantSlug, setTenantSlug] = useState<string | undefined>(undefined);
    const [userRole, setUserRole] = useState<string | undefined>(undefined);
    const [activeRole, setActiveRole] = useState<string | undefined>(undefined);
    const [referralCode, setReferralCode] = useState<string | undefined>(undefined);
    const [memberships, setMembershipsState] = useState<Membership[]>([]);

    const mapTenantType = (type?: string): TenantType => {
        switch (type) {
            case 'SUPER_ADMIN':
                return 'AUMS';
            case 'DEALER':
                return 'DEALER';
            case 'BANK':
                return 'BANK';
            default:
                return 'MARKETPLACE';
        }
    };

    // Hydration Effect
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const tType = localStorage.getItem('tenant_type') as TenantType;
            if (tType) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setTenantTypeState(tType);
            }

            const tName = localStorage.getItem('tenant_name');
            if (tName) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setTenantNameState(tName);
            }

            const uName = localStorage.getItem('user_name');
            if (uName) setUserName(uName);

            const tId = localStorage.getItem('tenant_id');
            if (tId) setTenantId(tId);

            const savedMems = localStorage.getItem('user_memberships');
            if (savedMems) {
                try {
                    setMembershipsState(JSON.parse(savedMems) as Membership[]);
                } catch {
                    /* ignore */
                }
            }

            const pathMatch = window.location.pathname.match(/^\/app\/([^/]+)/);
            const slug = pathMatch ? pathMatch[1] : null;
            if (slug) {
                setTenantSlug(slug);
                const supabase = createClient();
                (async () => {
                    try {
                        const { data } = await supabase
                            .from('id_tenants')
                            .select('id, name, slug, type, config')
                            .eq('slug', slug)
                            .maybeSingle();
                        if (!data) return;
                        const mappedType = mapTenantType(data.type);
                        setTenantId(data.id);
                        setTenantNameState(data.name);
                        setTenantTypeState(mappedType);
                        setTenantConfig(data.config || null);
                        localStorage.setItem('tenant_id', data.id);
                        localStorage.setItem('tenant_name', data.name);
                        localStorage.setItem('tenant_type', mappedType);
                        localStorage.setItem('tenant_slug', data.slug);
                    } catch {
                        // Swallow to avoid blocking UI
                    }
                })();
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const isMarketplaceRoute = !pathname.startsWith('/app/');
        const uRole = localStorage.getItem('user_role');
        const aRole = localStorage.getItem('active_role');
        const baseRole = localStorage.getItem('base_role');

        if (isMarketplaceRoute) {
            const resolvedBase = baseRole || 'BMB_USER';
            setUserRole(resolvedBase);
            setActiveRole(resolvedBase);
        } else {
            if (uRole) setUserRole(uRole);
            if (aRole) setActiveRole(aRole);
        }
    }, [pathname]);

    const setMemberships = (data: Membership[]) => {
        setMembershipsState(data);
        if (typeof window !== 'undefined') {
            localStorage.setItem('user_memberships', JSON.stringify(data));
        }
    };

    // /app/* role sync now handled server-side in dashboard layout.

    const switchRole = (role: string) => {
        setActiveRole(role);
        localStorage.setItem('active_role', role);
    };

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const status: TenantStatus = 'ACTIVE';
    const isReadOnly = status !== 'ACTIVE';

    const setTenantType = (type: TenantType) => {
        setTenantTypeState(type);
        localStorage.setItem('tenant_type', type);
    };

    const setTenantName = (name: string) => {
        setTenantNameState(name);
        localStorage.setItem('tenant_name', name);
    };

    return (
        <TenantContext.Provider
            value={{
                tenantType,
                tenantName,
                tenantConfig,
                userName,
                tenantId,
                tenantSlug,
                userRole,
                activeRole,
                referralCode,
                memberships,
                setTenantType,
                setTenantName,
                setTenantConfig,
                setUserName,
                setTenantId,
                setUserRole,
                setActiveRole,
                setReferralCode,
                setMemberships,
                switchRole,
                isSidebarExpanded,
                setIsSidebarExpanded,
                isReadOnly,
                status,
            }}
        >
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    return useContext(TenantContext);
};
