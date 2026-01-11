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
    switchRole: () => { },
    isSidebarExpanded: false,
    setIsSidebarExpanded: () => { },
    status: 'ACTIVE',
    isReadOnly: false,
    memberships: [],
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    // FIX: Lazy Initialize State to prevent "Guest Flash"
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
        if (typeof window !== 'undefined') return localStorage.getItem('user_name') || ''; // No 'Guest User' default
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [memberships, setMemberships] = useState<any[]>([]);

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const status: TenantStatus = 'ACTIVE';
    const isReadOnly = status !== 'ACTIVE';

    const switchRole = (role: string) => {
        setActiveRole(role);
        localStorage.setItem('active_role', role);
        console.log('DEBUG: Switched role to:', role);
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


                // DISASTER RECOVERY
                if (!user) {
                    const fallbackAccess = localStorage.getItem('sb-access-token');
                    const fallbackRefresh = localStorage.getItem('sb-refresh-token');

                    if (fallbackAccess && fallbackRefresh) {
                        console.warn('[TenantContext] Attempting Disaster Recovery from localStorage...');
                        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                            access_token: fallbackAccess,
                            refresh_token: fallbackRefresh
                        });

                        if (!sessionError && sessionData.session) {
                            console.log('[TenantContext] Recovery Successful. Re-hydrating...');
                            const retry = await supabase.auth.getSession();
                            user = retry.data.session?.user || null;
                        } else {
                            console.error('[TenantContext] Recovery Failed:', sessionError);
                        }
                    }
                }

                if (user) {
                    // PHASE 2: Fetch Memberships instead of Profile
                    // We also fetch profile just for the 'Full Name' of the user (generic)
                    const [membershipsResult, profileResult] = await Promise.all([
                        supabase
                            .from('memberships')
                            .select('*, tenants(name, type, subdomain, config)')
                            .eq('user_id', user.id)
                            .eq('status', 'ACTIVE'),
                        supabase
                            .from('profiles')
                            .select('full_name')
                            .eq('id', user.id)
                            .single()
                    ]);

                    if (!mounted) return;

                    // 1. User Identity
                    const fullName = profileResult.data?.full_name || user.email?.split('@')[0] || 'User';
                    setUserName(fullName);
                    localStorage.setItem('user_name', fullName);
                    // Notify other components (like MarketplaceHeader) that auth state changed
                    window.dispatchEvent(new Event('storage'));

                    // 2. Tenant Resolution Logic
                    const memberships = membershipsResult.data || [];
                    setMemberships(memberships); // NEW

                    if (memberships.length === 0) {
                        // CASE 0: No Memberships
                        console.error('No active memberships found for user.');
                        setTenantName('No Access');
                        setTenantTypeState('DEALER'); // Safe default to prevent crash
                        // Optional: Redirect to "Request Access" page
                        return;
                    }

                    let activeMembership = memberships[0]; // Default to first

                    if (memberships.length > 1) {
                        // CASE >1: Selection Logic
                        // A. Check LocalStorage Hint (last_active_tenant_id)
                        const hintId = localStorage.getItem('tenant_id');
                        const matchedHint = memberships.find(m => m.tenant_id === hintId);

                        if (matchedHint) {
                            activeMembership = matchedHint;
                        } else {
                            // B. Fallback to Default
                            const defaultMembership = memberships.find(m => m.is_default);
                            if (defaultMembership) {
                                activeMembership = defaultMembership;
                            }
                            // C. Else kept as [0]
                        }
                    }

                    // 3. Set Application Context from Resolved Membership
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const resolvedTenant = activeMembership.tenants as any;
                    const resolvedRole = activeMembership.role;

                    // Tenant Name
                    const tName = resolvedTenant?.name || 'Unknown Organization';
                    setTenantName(tName);
                    localStorage.setItem('tenant_name', tName);

                    // Tenant ID
                    const tId = activeMembership.tenant_id;
                    setTenantId(tId);
                    localStorage.setItem('tenant_id', tId);

                    // Roles
                    setUserRole(resolvedRole);
                    localStorage.setItem('user_role', resolvedRole);

                    // Active Role (Persistent switching support)
                    const savedActiveRole = localStorage.getItem('active_role');
                    const isSuperOrMp = resolvedRole === 'SUPER_ADMIN' || resolvedRole === 'MARKETPLACE_ADMIN';

                    if (isSuperOrMp && savedActiveRole) {
                        setActiveRole(savedActiveRole);
                    } else {
                        setActiveRole(resolvedRole);
                    }

                    // Tenant Type
                    // Super Admins usually view as MARKETPLACE by default
                    const tType = (resolvedTenant?.type || 'DEALER').toUpperCase() as TenantType;
                    if (resolvedRole === 'SUPER_ADMIN') {
                        setTenantTypeState('MARKETPLACE');
                        localStorage.setItem('tenant_type', 'MARKETPLACE');
                    } else {
                        setTenantTypeState(tType);
                        localStorage.setItem('tenant_type', tType);
                    }

                    // Config Resolution
                    if (resolvedTenant?.config) {
                        setTenantConfig(resolvedTenant.config);
                    }

                    console.log(`[TenantContext] Resolved Tenant: ${tName} (${tId}) | Role: ${resolvedRole}`);

                } else {
                    // Fallback for no auth (dev/mock/reload) logic remains...
                    // (Retaining existing logic for basic safety)
                    const localName = localStorage.getItem('user_name');
                    if (localName) setUserName(localName);

                    const localTenantName = localStorage.getItem('tenant_name');
                    if (!localTenantName && tenantName === 'Loading...') {
                        if (window.location.pathname.startsWith('/dashboard')) {
                            setTenantName('Verifying Identity...');
                        }
                    }
                    // Force re-auth on mismatch handled below...
                }
            } catch (err) {
                console.error('Tenant Context Error:', err);
                if (window.location.pathname.startsWith('/dashboard')) {
                    setTenantName('Connection Lost');
                }
            }
        };

        fetchTenantDetails();
        return () => { mounted = false; };
    }, []); // CRITICAL FIX: Run only on mount.

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
            switchRole,
            isSidebarExpanded,
            setIsSidebarExpanded,
            status,
            isReadOnly,
            memberships // NEW
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
