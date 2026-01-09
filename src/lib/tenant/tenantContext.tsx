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
    const [tenantType, setTenantTypeState] = useState<TenantType | undefined>(undefined);
    const [tenantName, setTenantName] = useState('Loading...');
    const [userName, setUserName] = useState('Guest User');
    const [tenantId, setTenantId] = useState<string | undefined>(undefined);
    const [userRole, setUserRole] = useState<string | undefined>(undefined);
    const [activeRole, setActiveRole] = useState<string | undefined>(undefined);
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
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: profileData, error } = await supabase.rpc('get_session_profile');
                    if (!mounted) return;

                    if (error) {
                        console.error('RPC Error:', error);
                        // Fallback to local storage or defaults on error
                        throw new Error('Profile fetch failed');
                    }

                    if (profileData) {
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

                        // Save critical context to localStorage
                        localStorage.setItem('tenant_type', finalRole === 'SUPER_ADMIN' || finalRole === 'MARKETPLACE_ADMIN' ? 'MARKETPLACE' : (profile.tenant_type || 'DEALER'));
                        localStorage.setItem('tenant_name', profile.tenant_name || 'BookMyBike Platform');
                        if (profile.tenant_id) localStorage.setItem('tenant_id', profile.tenant_id);

                        if (finalRole === 'SUPER_ADMIN' || finalRole === 'MARKETPLACE_ADMIN') {
                            setTenantTypeState('MARKETPLACE');
                            setTenantName(profile.tenant_name || 'BookMyBike Platform');
                        } else {
                            const dbType = (profile.tenant_type || '').toUpperCase();
                            setTenantTypeState(dbType as TenantType || 'DEALER');
                            setTenantName(profile.tenant_name || 'Business Partner');
                        }
                        setTenantId(profile.tenant_id);
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
                        setTenantName('Guest Workspace');
                    }

                    // AUTO-RECOVERY: If we are on dashboard but have no user, something is wrong with the session sync.
                    // Middleware let us in (valid cookie?), but Client SDK says no user.
                    // We should probably force a re-login to fix the loop.
                    if (window.location.pathname.startsWith('/dashboard')) {
                        console.warn('Session Mismatch: Middleware allowed access but Client SDK found no user. Force clearing.');
                        // Optional: Trigger logout to clean state
                        fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                            window.location.href = '/';
                        });
                    }
                }
            } catch (err) {
                console.error(err);
                // On error, try to restore from local storage as last resort
                const localName = localStorage.getItem('user_name');
                const localTenantName = localStorage.getItem('tenant_name');
                if (localName) setUserName(localName);
                if (localTenantName) setTenantName(localTenantName);
                else if (tenantName === 'Loading...') setTenantName('Connection Error');

                setTenantTypeState('DEALER');
            }
        };

        fetchTenantDetails();
        return () => { mounted = false; };
    }, []); // Add dependency on tenantName to ensure check updates if needed, though empty array is better for fetch once. Keep empty array but fix logic inside.

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
