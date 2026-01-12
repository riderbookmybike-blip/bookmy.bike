'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TenantType = 'DEALER' | 'BANK' | 'MARKETPLACE';

// Enhanced TenantContext with Status props
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL_EXPIRED';

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
    auth?: {
        msg91_widget_id?: string;
        msg91_auth_key?: string;
    };
    // Legacy support if needed
    landing?: {
        title?: string;
        subtitle?: string;
        ctaText?: string;
    };
}

interface TenantContextProps {
    tenantType: TenantType | undefined;
    setTenantType: (type: TenantType) => void;
    tenantName: string;
    tenantConfig: TenantConfig | null; // NEW
    userName: string;
    tenantId: string | undefined;
    userRole: string | undefined;
    activeRole: string | undefined;
    referralCode: string | undefined;
    switchRole: (role: string) => void;
    // Sidebar State
    isSidebarExpanded: boolean;
    setIsSidebarExpanded: (expanded: boolean) => void;
    // Legacy / Status props
    status: TenantStatus;
    isReadOnly: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memberships: Record<string, any>[]; // List of memberships
}

const TenantContext = createContext<TenantContextProps>({
    tenantType: undefined,
    setTenantType: () => { },
    tenantName: 'Loading...',
    tenantConfig: null,
    userName: 'Guest User',
    tenantId: undefined,
    userRole: undefined,
    activeRole: undefined,
    referralCode: undefined,
    switchRole: () => { },
    isSidebarExpanded: false,
    setIsSidebarExpanded: () => { },
    status: 'ACTIVE',
    isReadOnly: false,
    memberships: [],
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    // Lazy Initialize State
    const [tenantType, setTenantTypeState] = useState<TenantType | undefined>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('tenant_type') as TenantType) || undefined;
        }
        return undefined;
    });

    const [tenantName, setTenantName] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('tenant_name') || '';
        return '';
    });

    const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

    const [userName, setUserName] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('user_name') || '';
        return '';
    });

    const [tenantId, setTenantId] = useState<string | undefined>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('tenant_id') || undefined;
        return undefined;
    });

    const [userRole, setUserRole] = useState<string | undefined>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('user_role') || undefined;
        return undefined;
    });

    const [activeRole, setActiveRole] = useState<string | undefined>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('active_role') || undefined;
        return undefined;
    });

    const [referralCode, setReferralCode] = useState<string | undefined>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('referral_code') || undefined;
        return undefined;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [memberships, setMembershipsState] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('user_memberships');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { return []; }
            }
        }
        return [];
    });

    const setMemberships = (data: any[]) => {
        setMembershipsState(data);
        if (typeof window !== 'undefined') {
            localStorage.setItem('user_memberships', JSON.stringify(data));
        }
    };

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const status: TenantStatus = 'ACTIVE';
    const isReadOnly = status !== 'ACTIVE';

    const switchRole = (role: string) => {
        setActiveRole(role);
        localStorage.setItem('active_role', role);
        console.log('[TenantContext] Switched role to:', role);
    };

    useEffect(() => {
        let mounted = true;

        const fetchTenantDetails = async () => {
            try {
                const supabase = createClient();
                let { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (sessionData?.session?.user) {
                        user = sessionData.session.user;
                    }
                }

                // Subdomain Detection (Needed for both Guest & Auth users)
                const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
                const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';
                let currentSubdomain = '';
                if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
                    const sub = hostname.replace(`.${ROOT_DOMAIN}`, '');
                    if (sub !== 'www' && sub !== '') currentSubdomain = sub;
                } else if (hostname.includes('localhost')) {
                    const parts = hostname.split('.');
                    if (parts.length > 1 && parts[0] !== 'www') currentSubdomain = parts[0];
                }
                console.log(`[TenantContext] Hostname: ${hostname} | Subdomain: ${currentSubdomain || 'NONE'}`);

                // GUEST BRANDING FETCH
                if (!user && currentSubdomain) {
                    console.log(`[TenantContext] Guest access. Fetching branding for: ${currentSubdomain}`);
                    const { data: guestTenant } = await supabase.from('tenants').select('*').eq('subdomain', currentSubdomain).maybeSingle();
                    if (guestTenant && mounted) {
                        setTenantName(guestTenant.name);
                        setTenantConfig(guestTenant.config);
                        setTenantTypeState(guestTenant.type?.toUpperCase() as TenantType);
                        // FIX: Set tenantId for pre-login membership check
                        setTenantId(guestTenant.id);
                        localStorage.setItem('tenant_id', guestTenant.id);
                    }
                }

                // Disaster Recovery
                if (!user) {
                    const fallbackAccess = localStorage.getItem('sb-access-token');
                    const fallbackRefresh = localStorage.getItem('sb-refresh-token');
                    if (fallbackAccess && fallbackRefresh) {
                        console.warn('[TenantContext] Recovery attempt...');
                        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                            access_token: fallbackAccess,
                            refresh_token: fallbackRefresh
                        });
                        if (!sessionError && sessionData.session) {
                            user = sessionData.session.user;
                        }
                    }
                }

                if (user) {
                    // Fetch Core Data
                    const [membershipsResult, profileResult] = await Promise.all([
                        supabase.from('memberships').select('*, tenants(*)').eq('user_id', user.id).eq('status', 'ACTIVE'),
                        supabase.from('profiles').select('*').eq('id', user.id).single()
                    ]);

                    if (!mounted) return;

                    // Identity Sync
                    const fullName = profileResult.data?.full_name || user.phone || 'User';
                    setUserName(fullName);
                    localStorage.setItem('user_name', fullName);
                    if (profileResult.data?.referral_code) {
                        setReferralCode(profileResult.data.referral_code);
                        localStorage.setItem('referral_code', profileResult.data.referral_code);
                    }

                    // Tenant Resolution
                    const memberships = membershipsResult.data || [];
                    setMemberships(memberships);
                    const godModeMember = memberships.find(m => ['OWNER'].includes(m.role));
                    let activeMembership = null;

                    if (currentSubdomain) {
                        activeMembership = memberships.find(m => {
                            const mSub = m.tenants?.subdomain?.toLowerCase()?.replace(/\s+/g, '');
                            return mSub && mSub === currentSubdomain.toLowerCase().replace(/\s+/g, '');
                        });

                        if (!activeMembership && godModeMember) {
                            console.log(`[GodMode] Searching for tenant: ${currentSubdomain}`);
                            const { data: virtualTenant } = await supabase.from('tenants').select('*').eq('subdomain', currentSubdomain).maybeSingle();
                            if (virtualTenant) {
                                activeMembership = { tenant_id: virtualTenant.id, role: godModeMember.role, tenants: virtualTenant, user_id: user.id };
                            }
                        }
                    }

                    if (!activeMembership) {
                        const hintId = localStorage.getItem('last_active_tenant_id');
                        activeMembership = memberships.find(m => m.tenant_id === hintId) || memberships[0];
                    }

                    if (activeMembership) {
                        const resolvedTenant = activeMembership.tenants;
                        const resolvedRole = activeMembership.role;
                        const tId = activeMembership.tenant_id;

                        setTenantName(resolvedTenant?.name || 'Portal');
                        setTenantId(tId);
                        setUserRole(resolvedRole);
                        localStorage.setItem('tenant_name', resolvedTenant?.name || '');
                        localStorage.setItem('tenant_id', tId);
                        localStorage.setItem('user_role', resolvedRole);
                        localStorage.setItem('last_active_tenant_id', tId);

                        // Role Logic & Access Enforcement
                        const isPowerRole = ['OWNER', 'DEALERSHIP_ADMIN', 'DEALERSHIP_STAFF', 'BANK_STAFF'].includes(resolvedRole);
                        const savedActiveRole = localStorage.getItem('active_role');

                        // [Phase 12.1] Subdomain Restriction: USERs cannot access dealer subdomains
                        if (resolvedRole === 'BMB_USER' && currentSubdomain) {
                            console.warn(`[TenantContext] Access Denied: BMB_USER role found on subdomain ${currentSubdomain}`);
                            setTenantTypeState('MARKETPLACE');
                            setUserRole('BMB_USER');
                            setActiveRole('BMB_USER');
                            setTenantName('BookMyBike');
                            setTenantId(undefined);
                            return;
                        }

                        if (isPowerRole) {
                            // FORCE power role for owners/admins
                            setActiveRole(resolvedRole);
                            localStorage.setItem('active_role', resolvedRole);
                        } else if (savedActiveRole) {
                            setActiveRole(savedActiveRole);
                        } else {
                            setActiveRole(resolvedRole);
                            localStorage.setItem('active_role', resolvedRole);
                        }

                        // Tenant Type Logic
                        const rawType = (resolvedTenant?.type || 'DEALER').toUpperCase() as TenantType;
                        const isSuperOrMp = ['OWNER'].includes(resolvedRole);
                        if (isSuperOrMp && !currentSubdomain) {
                            setTenantTypeState('MARKETPLACE');
                            localStorage.setItem('tenant_type', 'MARKETPLACE');
                        } else {
                            setTenantTypeState(rawType);
                            localStorage.setItem('tenant_type', rawType);
                        }

                        if (resolvedTenant?.config) setTenantConfig(resolvedTenant.config);
                        console.log(`[TenantContext] Resolved: ${resolvedTenant?.name} | Role: ${resolvedRole}`);
                    } else {
                        // Retail Fallback
                        setTenantTypeState('MARKETPLACE');
                        setUserRole('MEMBER');
                        setActiveRole('MEMBER');
                        setTenantName('BookMyBike');
                    }
                } else {
                    if (window.location.pathname.startsWith('/dashboard')) {
                        setTenantName('Unauthorized');
                    }
                }
            } catch (err) {
                console.error('[TenantContext] Error:', err);
                setTenantName('Connection Lost');
            }
        };

        fetchTenantDetails();
        return () => { mounted = false; };
    }, []);

    return (
        <TenantContext.Provider value={{
            tenantType,
            setTenantType: setTenantTypeState,
            tenantName,
            tenantConfig,
            userName,
            tenantId,
            userRole,
            activeRole,
            referralCode,
            switchRole,
            isSidebarExpanded,
            setIsSidebarExpanded,
            status,
            isReadOnly,
            memberships
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
