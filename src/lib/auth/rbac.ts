export type Role =
    | 'OWNER'
    | 'DEALERSHIP_ADMIN'
    | 'DEALERSHIP_STAFF'
    | 'BANK_STAFF'
    | 'BMB_USER';

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
    | 'manage_marketplace'
    | 'transfer_ownership';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    OWNER: [
        'manage_organization', 'manage_team', 'manage_billing', 'view_analytics',
        'manage_inventory', 'manage_leads', 'access_marketplace', 'manage_marketplace', 'view_inventory', 'view_leads',
        'transfer_ownership'
    ],
    DEALERSHIP_ADMIN: [
        'manage_organization', 'manage_team', 'manage_billing', 'view_analytics',
        'manage_inventory', 'manage_leads', 'view_inventory', 'view_leads',
        'transfer_ownership'
    ],
    DEALERSHIP_STAFF: [
        'view_analytics',
        'manage_inventory', 'manage_leads', 'view_inventory', 'view_leads'
    ],
    BANK_STAFF: [
        'view_analytics',
        'manage_organization' // For bank-level tenant management
    ],
    BMB_USER: [
        'view_inventory', 'view_leads', 'access_marketplace'
    ]
};

export function can(role: string | undefined, permission: Permission): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role.toUpperCase() as Role];
    return permissions ? permissions.includes(permission) : false;
}

export const ROLES_LABEL: Record<Role, string> = {
    OWNER: 'System Owner',
    DEALERSHIP_ADMIN: 'Dealership Admin',
    DEALERSHIP_STAFF: 'Dealership Staff',
    BANK_STAFF: 'Bank Staff',
    BMB_USER: 'BMB User'
};
