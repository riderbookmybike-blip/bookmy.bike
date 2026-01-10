export type Role =
    | 'SUPER_ADMIN'
    | 'MARKETPLACE_ADMIN'
    | 'DEALER_OWNER'
    | 'DEALER_ADMIN'
    | 'SALES_EXEC'
    | 'OPERATIONS'
    | 'VIEWER';

export type Permission =
    | 'manage_organization'
    | 'manage_team'
    | 'manage_billing'
    | 'view_analytics'
    | 'manage_inventory'
    | 'view_inventory'
    | 'manage_leads'
    | 'view_leads'
    | 'access_marketplace'
    | 'manage_marketplace';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    SUPER_ADMIN: [
        'manage_organization', 'manage_team', 'manage_billing', 'view_analytics',
        'manage_inventory', 'manage_leads', 'access_marketplace', 'manage_marketplace', 'view_inventory', 'view_leads'
    ],
    MARKETPLACE_ADMIN: [
        'access_marketplace', 'manage_marketplace', 'view_analytics'
    ],
    DEALER_OWNER: [
        'manage_organization', 'manage_team', 'manage_billing', 'view_analytics',
        'manage_inventory', 'manage_leads', 'view_inventory', 'view_leads'
    ],
    DEALER_ADMIN: [
        'manage_team', 'view_analytics',
        'manage_inventory', 'manage_leads', 'view_inventory', 'view_leads'
    ],
    SALES_EXEC: [
        'manage_leads', 'view_leads', 'view_inventory'
    ],
    OPERATIONS: [
        'manage_inventory', 'view_inventory', 'view_leads'
    ],
    VIEWER: [
        'view_inventory', 'view_leads'
    ]
};

export function can(role: string | undefined, permission: Permission): boolean {
    if (!role) return false;
    // Normalize string to Role type if possible, else return false
    const permissions = ROLE_PERMISSIONS[role as Role];
    return permissions ? permissions.includes(permission) : false;
}

export const ROLES_LABEL: Record<Role, string> = {
    SUPER_ADMIN: 'Super Admin',
    MARKETPLACE_ADMIN: 'Marketplace Admin',
    DEALER_OWNER: 'Dealer Owner',
    DEALER_ADMIN: 'Manager',
    SALES_EXEC: 'Sales Executive',
    OPERATIONS: 'Operations',
    VIEWER: 'Viewer'
};
