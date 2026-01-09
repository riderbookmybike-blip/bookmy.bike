'use client';

import { useTenant } from '@/lib/tenant/tenantContext';
import { PERMISSIONS, Resource, Action, UserRole } from '@/config/permissions';

export function usePermission() {
    const { activeRole, isReadOnly } = useTenant();

    const can = (resource: Resource, action: Action, roleOverride?: string): boolean => {
        // Use activeRole from context, or fallback to override/default
        const roleStr = roleOverride || activeRole || 'TENANT_ADMIN';
        const role = roleStr as UserRole;

        // 1. Check Matrix
        const rolePermissions = PERMISSIONS[role];
        if (!rolePermissions) {
            // If role not defined in matrix, deny all
            return false;
        }

        const resourcePermissions = rolePermissions[resource];
        if (!resourcePermissions) {
            // If resource not explicitly allowed for role, deny
            return false;
        }

        if (!resourcePermissions.includes(action)) {
            return false;
        }

        // 2. Check Read-Only State (Tenant Status)
        if (isReadOnly) {
            // If read-only, block mutation actions
            if (['create', 'edit', 'delete', 'approve'].includes(action)) {
                return false;
            }
        }

        return true;
    };

    return { can, role: activeRole };
}
