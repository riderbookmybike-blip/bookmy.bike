'use client';

import { useTenant } from '@/lib/tenant/tenantContext';
import { PERMISSIONS, Resource, Action, UserRole } from '@/config/permissions';

export function usePermission() {
    const { status, isReadOnly } = useTenant();
    // In a real app, user role would come from a UserContext or AuthContext.
    // For now, we will default to SUPER_ADMIN or allow it to be passed, 
    // but since our Sidebar takes a 'role' prop, we should ideally access that.
    // However, sidebar is a component.
    // Let's assume a hardcoded role for the "session" in this mock environment, 
    // or simple fallback. 
    // Since the user asked for "UI-only" and "Mock", we can simulate the role here 
    // or assume the component passing it knows best.

    // BUT: The hook needs to be usable by components that don't know the role.
    // Let's create a temporary mock role in TenantContext or just hardcode it here for testing.
    // For the purpose of this task, I'll allow passing the role to `can`, or default to 'SUPER_ADMIN'.

    // Map TenantType to a default Role for this PoC
    const { tenantType } = useTenant();

    let currentRole: UserRole = 'TENANT_ADMIN'; // Default fallback
    if (tenantType === 'MARKETPLACE') currentRole = 'SUPER_ADMIN';
    else if (tenantType === 'BANK') currentRole = 'BANK_ADMIN';
    else if (tenantType === 'DEALER') currentRole = 'TENANT_ADMIN';

    const can = (resource: Resource, action: Action, roleOverride?: string): boolean => {
        const role = roleOverride || currentRole;

        // 1. Check Matrix
        const rolePermissions = PERMISSIONS[role];
        if (!rolePermissions) return false;

        const resourcePermissions = rolePermissions[resource];
        if (!resourcePermissions) return false;

        if (!resourcePermissions.includes(action)) return false;

        // 2. Check Read-Only State (Tenant Status)
        if (isReadOnly) {
            // If read-only, block mutation actions
            if (['create', 'edit', 'delete', 'approve'].includes(action)) {
                return false;
            }
        }

        return true;
    };

    return { can, role: currentRole };
}
