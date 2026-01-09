'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TenantType = 'DEALER' | 'BANK' | 'MARKETPLACE';

// Enhanced TenantContext with Status props
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL_EXPIRED';

interface TenantContextProps {
    tenantType: TenantType | undefined;
    setTenantType: (type: TenantType) => void;
    tenantName: string;
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
}

const TenantContext = createContext<TenantContextProps>({
    tenantType: undefined,
    setTenantType: () => { },
    tenantName: 'Loading...',
    userName: 'Guest User',
    tenantId: undefined,
    userRole: undefined,
    activeRole: undefined,
    switchRole: () => { },
    isSidebarExpanded: false,
    setIsSidebarExpanded: () => { },
    status: 'ACTIVE',
    isReadOnly: false,
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
                let { data: { user }, error: userError } = await supabase.auth.getUser();

                if (!user) {
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (sessionData?.session?.user) {
                        user = sessionData.session.user;
                    }
                }

                // DISASTER RECOVERY: If no user found, check for backed-up tokens in localStorage
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
                            // FAST RECOVERY: Trust the session we just set, don't wait for server roundtrip
                            const retry = await supabase.auth.getSession();
                            user = retry.data.session?.user || null;
                        } else {
                            console.error('[TenantContext] Recovery Failed:', sessionError);
                        }
                    }
                }

                if (user) {
                    const { data: profileData, error } = await supabase.rpc('get_session_profile');
                    if (!mounted) return;

                    if (error) {
                        console.error('RPC Error:', error);
                        // FALLBACK: Use Auth Data if Profile Table fails
                        setUserName(user.email?.split('@')[0] || 'Authenticated User');
                        setUserRole('DEALER'); // Safe Default

                        setTenantTypeState('DEALER');
                    } else if (profileData) {
                        const profile = profileData as any;
                        const originalRole = (profile.role || '').toUpperCase();

                        // CRITICAL: Set User Role immediately so switcher works
                        setUserRole(originalRole);
                        localStorage.setItem('user_role', originalRole);

                        // Set User Name
                        setUserName(profile.full_name || user.email?.split('@')[0] || 'User');
                        localStorage.setItem('user_name', profile.full_name || user.email?.split('@')[0] || 'User');

                        // Persistence Restore
                        const savedRole = localStorage.getItem('active_role');
                        const validRoles = ['SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'MARKETPLACE_STAFF', 'DEALER_ADMIN', 'BANK_ADMIN'];

                        let finalRole = originalRole;
                        if (originalRole === 'SUPER_ADMIN' || originalRole === 'MARKETPLACE_ADMIN') {
                            if (savedRole && validRoles.includes(savedRole)) {
                                finalRole = savedRole;
                            }
                        }

                        setActiveRole(finalRole);

                        // Robust Tenant Name & ID Extraction
                        // PRIORITY: 1. Direct DB Join (tenants.name) 2. RPC Result (tenant_name) 3. Unknown
                        const extractedTenantName = profile.tenants?.name || profile.tenant_name || 'Unknown Organization';
                        const extractedTenantId = profile.tenant_id;

                        // Save critical context to localStorage
                        localStorage.setItem('tenant_type', finalRole === 'SUPER_ADMIN' || finalRole === 'MARKETPLACE_ADMIN' ? 'MARKETPLACE' : (profile.tenant_type || 'DEALER'));
                        localStorage.setItem('tenant_name', extractedTenantName);
                        if (extractedTenantId) localStorage.setItem('tenant_id', extractedTenantId);

                        if (finalRole === 'SUPER_ADMIN' || finalRole === 'MARKETPLACE_ADMIN') {
                            setTenantTypeState('MARKETPLACE');
                            setTenantName(extractedTenantName);
                        } else {
                            const dbType = (profile.tenant_type || '').toUpperCase();
                            setTenantTypeState(dbType as TenantType || 'DEALER');
                            setTenantName(extractedTenantName);
                        }
                        setTenantId(extractedTenantId);
                    } else {
                        // User exists but no profile data ??
                        console.warn('No profile data found for user');
                        setTenantName('Unknown Organization');
                        setTenantTypeState('DEALER');
                    }
                } else {
                    // Fallback for no auth (dev/mock/reload)
                    const localName = localStorage.getItem('user_name');
                    const localRole = localStorage.getItem('active_role');
                    const localUserRole = localStorage.getItem('user_role'); // Try to get original role too
                    const localTenantType = localStorage.getItem('tenant_type');
                    const localTenantName = localStorage.getItem('tenant_name');
                    const localTenantId = localStorage.getItem('tenant_id');

                    if (localName) setUserName(localName);
                    if (localRole) setActiveRole(localRole);
                    if (localUserRole) setUserRole(localUserRole); // Restore userRole
                    if (localTenantType) setTenantTypeState(localTenantType as TenantType);
                    if (localTenantName) setTenantName(localTenantName);
                    if (localTenantId) setTenantId(localTenantId);

                    // If absolutely nothing is found, default to acceptable values
                    if (!localTenantType) setTenantTypeState('DEALER');

                    // FIX: "Loading..." is truthy, so explicit check needed
                    if (!localTenantName && tenantName === 'Loading...') {
                        // STRICT MODE: If we don't know the Org, we don't show the Dashboard.
                        // We do NOT default to "BookMyBike Terminal" anymore.
                        if (window.location.pathname.startsWith('/dashboard')) {
                            setTenantName('Verifying Identity...');
                        } else {

                        }
                    }

                    // AUTO-RECOVERY: If we are on dashboard but have no user, something is wrong with the session sync.
                    if (window.location.pathname.startsWith('/dashboard')) {
                        console.error('Session Mismatch: Middleware allowed access (cookie exists) but Client SDK found no user session.');

                        // Show visible error or force logout
                        setTenantName('Authentication Failed (Redirecting...)');
                        setUserName('Please Log In Again');

                        // Force logout immediately
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/';
                    }
                }
            } catch (err) {
                console.error('Tenant Context Error:', err);

                // If on dashboard, this is critical.
                if (window.location.pathname.startsWith('/dashboard')) {
                    // Try to recover from local storage first to show SOMETHING
                    const localName = localStorage.getItem('user_name');
                    if (localName) setUserName(localName);

                    setTenantName('Connection Lost');
                    // Do not auto-logout on simple network error, but show warning
                } else {
                    setTenantTypeState('DEALER');
                }
            }
        };

        fetchTenantDetails();
        return () => { mounted = false; };
    }, []); // CRITICAL FIX: Run only on mount. Do not depend on tenantName (causes loop).

    return (
        <TenantContext.Provider value={{
            tenantType,
            setTenantType: setTenantTypeState,
            tenantName,
            userName,
            tenantId,
            userRole,
            activeRole,
            switchRole,
            isSidebarExpanded,
            setIsSidebarExpanded,
            status,
            isReadOnly
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
