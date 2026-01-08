export type Resource =
    | 'dashboard'
    | 'leads' | 'customers' | 'quotes' | 'sales-orders'
    | 'delivery-notes' | 'pdi' | 'insurance' | 'registration'
    | 'banking' | 'finance' | 'invoices' | 'receipts'
    | 'vendors' | 'purchase-orders' | 'receiving' | 'bills' | 'payments' | 'expenses'
    | 'products' | 'pricelists' | 'inventory' | 'stock-transfer' | 'physical-audit' | 'returns'
    | 'campaigns' | 'budget' | 'targets'
    | 'reports' | 'hr' | 'team'
    | 'users' | 'audit-logs' | 'subscriptions' | 'brand-enablement' | 'finance-applications'
    | 'settings' | 'tenants'
    | 'catalog-vehicles' | 'catalog-accessories' | 'catalog-registration' | 'catalog-insurance' | 'catalog-services';

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export type PermissionMatrix = {
    [key in Resource]?: Action[];
};

// Define Role Keys
export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'SALES' | 'OPS' | 'ACCOUNTS' | 'HR' | 'BANK_ADMIN';

export type RolePermissions = {
    [role: string]: PermissionMatrix;
};

// Define default permissions for each role
export const PERMISSIONS: RolePermissions = {
    'SUPER_ADMIN': {
        'dashboard': ['view', 'create', 'edit', 'delete', 'approve'],
        'leads': ['view', 'create', 'edit', 'delete', 'approve'],
        'customers': ['view', 'create', 'edit', 'delete', 'approve'],
        'quotes': ['view', 'create', 'edit', 'delete', 'approve'],
        'sales-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        'delivery-notes': ['view', 'create', 'edit', 'delete', 'approve'],
        'pdi': ['view', 'create', 'edit', 'delete', 'approve'],
        'insurance': ['view', 'create', 'edit', 'delete', 'approve'],
        'registration': ['view', 'create', 'edit', 'delete', 'approve'],
        'banking': ['view', 'create', 'edit', 'delete', 'approve'],
        'finance': ['view', 'create', 'edit', 'delete', 'approve'],
        'invoices': ['view', 'create', 'edit', 'delete', 'approve'],
        'receipts': ['view', 'create', 'edit', 'delete', 'approve'],
        'vendors': ['view', 'create', 'edit', 'delete', 'approve'],
        'purchase-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        'receiving': ['view', 'create', 'edit', 'delete', 'approve'],
        'bills': ['view', 'create', 'edit', 'delete', 'approve'],
        'payments': ['view', 'create', 'edit', 'delete', 'approve'],
        'expenses': ['view', 'create', 'edit', 'delete', 'approve'],
        'products': ['view', 'create', 'edit', 'delete', 'approve'],
        'pricelists': ['view', 'create', 'edit', 'delete', 'approve'],
        'inventory': ['view', 'create', 'edit', 'delete', 'approve'],
        'stock-transfer': ['view', 'create', 'edit', 'delete', 'approve'],
        'physical-audit': ['view', 'create', 'edit', 'delete', 'approve'],
        'returns': ['view', 'create', 'edit', 'delete', 'approve'],
        'campaigns': ['view', 'create', 'edit', 'delete', 'approve'],
        'budget': ['view', 'create', 'edit', 'delete', 'approve'],
        'targets': ['view', 'create', 'edit', 'delete', 'approve'],
        'reports': ['view', 'create', 'edit', 'delete', 'approve'],
        'hr': ['view', 'create', 'edit', 'delete', 'approve'],
        'team': ['view', 'create', 'edit', 'delete', 'approve'],
        'users': ['view', 'create', 'edit', 'delete', 'approve'],
        'audit-logs': ['view', 'create', 'edit', 'delete', 'approve'],
        'subscriptions': ['view', 'create', 'edit', 'delete', 'approve'],
        'settings': ['view', 'create', 'edit', 'delete', 'approve'],
        'brand-enablement': ['view', 'create', 'edit', 'delete', 'approve'],
        'finance-applications': ['view', 'create', 'edit', 'delete', 'approve'],
        'tenants': ['view', 'create', 'edit', 'delete', 'approve'],
        // Catalog Masters (Admin)
        'catalog-vehicles': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-accessories': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-registration': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-insurance': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-services': ['view', 'create', 'edit', 'delete', 'approve'],
    },
    'TENANT_ADMIN': {
        // Similar to SUPER_ADMIN but usually standard business admin
        'dashboard': ['view'],
        'leads': ['view', 'create', 'edit', 'delete'],
        'customers': ['view', 'create', 'edit'],
        'quotes': ['view', 'create', 'edit', 'delete', 'approve'],
        'sales-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        'delivery-notes': ['view', 'create', 'edit'],
        'pdi': ['view', 'create', 'edit'],
        'insurance': ['view', 'create', 'edit'],
        'registration': ['view', 'create', 'edit'],
        'banking': ['view', 'create', 'edit', 'approve'],
        'finance': ['view'],
        'invoices': ['view', 'create', 'edit'],
        'receipts': ['view', 'create', 'edit'],
        'vendors': ['view', 'create', 'edit'],
        'purchase-orders': ['view', 'create', 'edit', 'approve'],
        'receiving': ['view', 'create', 'edit'],
        'bills': ['view', 'create', 'edit', 'approve'],
        'payments': ['view', 'create', 'edit', 'approve'],
        'expenses': ['view', 'create', 'edit', 'approve'],
        'products': ['view', 'create', 'edit'],
        'pricelists': ['view', 'create', 'edit'],
        'inventory': ['view', 'create', 'edit'],
        'stock-transfer': ['view', 'create', 'edit', 'approve'],
        'physical-audit': ['view', 'create', 'edit', 'approve'],
        'returns': ['view', 'create', 'edit', 'approve'],
        'campaigns': ['view', 'create', 'edit'],
        'budget': ['view', 'create', 'edit'],
        'targets': ['view', 'create', 'edit'],
        'reports': ['view'],
        'hr': ['view', 'create', 'edit'],
        'team': ['view', 'create', 'edit'],
        'brand-enablement': ['view', 'create', 'edit'],
        'finance-applications': ['view', 'create'], // Initiation only
        'settings': ['view', 'edit'],
        // Catalog Masters (Dealer - Read Only)
        'catalog-vehicles': ['view'],
        'catalog-accessories': ['view'],
        'catalog-registration': ['view'],
        'catalog-insurance': ['view'],
        'catalog-services': ['view'],
    },
    'SALES': {
        'dashboard': ['view'],
        'leads': ['view', 'create', 'edit'],
        'customers': ['view', 'create', 'edit'],
        'quotes': ['view', 'create', 'edit'],
        'sales-orders': ['view', 'create', 'edit'],
        'products': ['view'],
        'pricelists': ['view'],
        'vendors': ['view'],
        'campaigns': ['view', 'create', 'edit'],
        'targets': ['view'],
        'reports': ['view'],
        'insurance': ['view', 'create'],
        'returns': ['view', 'create'],
    },
    'OPS': {
        'dashboard': ['view'],
        'customers': ['view'],
        'quotes': ['view'],
        'sales-orders': ['view'],
        'delivery-notes': ['view', 'create', 'edit'],
        'pdi': ['view', 'create', 'edit'],
        'registration': ['view', 'create', 'edit'],
        'vendors': ['view'],
        'purchase-orders': ['view', 'create', 'edit'],
        'receiving': ['view', 'create', 'edit'],
        'products': ['view', 'create', 'edit'],
        'pricelists': ['view'],
        'inventory': ['view', 'create', 'edit'],
        'stock-transfer': ['view', 'create', 'edit'],
        'physical-audit': ['view', 'create', 'edit'],
        'returns': ['view', 'create', 'edit'],
        'reports': ['view'],
    },
    'ACCOUNTS': {
        'dashboard': ['view'],
        'customers': ['view'],
        'quotes': ['view'],
        'sales-orders': ['view'],
        'banking': ['view', 'create', 'edit'],
        'finance': ['view', 'create', 'edit'],
        'invoices': ['view', 'create', 'edit'],
        'receipts': ['view', 'create', 'edit'],
        'vendors': ['view', 'create', 'edit'],
        'purchase-orders': ['view'],
        'bills': ['view', 'create', 'edit'],
        'payments': ['view', 'create', 'edit'],
        'expenses': ['view', 'create', 'edit'],
        'products': ['view'],
        'pricelists': ['view'],
        'physical-audit': ['view'],
        'budget': ['view', 'create', 'edit'],
        'reports': ['view'],
    },
    'HR': {
        'hr': ['view', 'create', 'edit', 'delete'],
        'team': ['view', 'create', 'edit', 'delete'],
    },
    'BANK_ADMIN': {
        'dashboard': ['view'],
        'finance-applications': ['view', 'create', 'edit', 'approve'],
        'settings': ['view', 'edit'],
        'team': ['view', 'create', 'edit'], // Bank Team
    }
};
