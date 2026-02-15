export type Resource =
    | 'dashboard'
    | 'leads'
    | 'customers'
    | 'quotes'
    | 'sales-orders'
    | 'delivery-notes'
    | 'pdi'
    | 'insurance'
    | 'registration'
    | 'banking'
    | 'finance'
    | 'invoices'
    | 'receipts'
    | 'vendors'
    | 'purchase-orders'
    | 'receiving'
    | 'bills'
    | 'payments'
    | 'expenses'
    | 'products'
    | 'pricelists'
    | 'inventory'
    | 'stock-transfer'
    | 'physical-audit'
    | 'returns'
    | 'campaigns'
    | 'budget'
    | 'targets'
    | 'reports'
    | 'hr'
    | 'team'
    | 'users'
    | 'audit-logs'
    | 'subscriptions'
    | 'brand-enablement'
    | 'finance-applications'
    | 'settings'
    | 'tenants'
    | 'catalog-vehicles'
    | 'catalog-accessories'
    | 'catalog-registration'
    | 'catalog-insurance'
    | 'catalog-services';

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export type PermissionMatrix = {
    [key in Resource]?: Action[];
};

// Define Role Keys
export type UserRole =
    | 'OWNER'
    | 'DEALERSHIP_ADMIN'
    | 'DEALERSHIP_STAFF'
    | 'BANK_STAFF'
    | 'FINANCE'
    | 'BMB_USER'
    | 'SUPER_ADMIN'
    | 'MARKETPLACE_ADMIN';

export type RolePermissions = {
    [role: string]: PermissionMatrix;
};

// Define default permissions for each role
export const PERMISSIONS: RolePermissions = {
    OWNER: {
        dashboard: ['view', 'create', 'edit', 'delete', 'approve'],
        leads: ['view', 'create', 'edit', 'delete', 'approve'],
        customers: ['view', 'create', 'edit', 'delete', 'approve'],
        quotes: ['view', 'create', 'edit', 'delete', 'approve'],
        'sales-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        'delivery-notes': ['view', 'create', 'edit', 'delete', 'approve'],
        pdi: ['view', 'create', 'edit', 'delete', 'approve'],
        insurance: ['view', 'create', 'edit', 'delete', 'approve'],
        registration: ['view', 'create', 'edit', 'delete', 'approve'],
        banking: ['view', 'create', 'edit', 'delete', 'approve'],
        finance: ['view', 'create', 'edit', 'delete', 'approve'],
        invoices: ['view', 'create', 'edit', 'delete', 'approve'],
        receipts: ['view', 'create', 'edit', 'delete', 'approve'],
        vendors: ['view', 'create', 'edit', 'delete', 'approve'],
        'purchase-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        receiving: ['view', 'create', 'edit', 'delete', 'approve'],
        bills: ['view', 'create', 'edit', 'delete', 'approve'],
        payments: ['view', 'create', 'edit', 'delete', 'approve'],
        expenses: ['view', 'create', 'edit', 'delete', 'approve'],
        products: ['view', 'create', 'edit', 'delete', 'approve'],
        pricelists: ['view', 'create', 'edit', 'delete', 'approve'],
        inventory: ['view', 'create', 'edit', 'delete', 'approve'],
        'stock-transfer': ['view', 'create', 'edit', 'delete', 'approve'],
        'physical-audit': ['view', 'create', 'edit', 'delete', 'approve'],
        returns: ['view', 'create', 'edit', 'delete', 'approve'],
        campaigns: ['view', 'create', 'edit', 'delete', 'approve'],
        budget: ['view', 'create', 'edit', 'delete', 'approve'],
        targets: ['view', 'create', 'edit', 'delete', 'approve'],
        reports: ['view', 'create', 'edit', 'delete', 'approve'],
        hr: ['view', 'create', 'edit', 'delete', 'approve'],
        team: ['view', 'create', 'edit', 'delete', 'approve'],
        users: ['view', 'create', 'edit', 'delete', 'approve'],
        'audit-logs': ['view', 'create', 'edit', 'delete', 'approve'],
        subscriptions: ['view', 'create', 'edit', 'delete', 'approve'],
        settings: ['view', 'create', 'edit', 'delete', 'approve'],
        'brand-enablement': ['view', 'create', 'edit', 'delete', 'approve'],
        'finance-applications': ['view', 'create', 'edit', 'delete', 'approve'],
        tenants: ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-vehicles': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-accessories': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-registration': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-insurance': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-services': ['view', 'create', 'edit', 'delete', 'approve'],
    },
    DEALERSHIP_ADMIN: {
        dashboard: ['view', 'create', 'edit', 'delete', 'approve'],
        leads: ['view', 'create', 'edit', 'delete', 'approve'],
        customers: ['view', 'create', 'edit', 'delete', 'approve'],
        quotes: ['view', 'create', 'edit', 'delete', 'approve'],
        'sales-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        'delivery-notes': ['view', 'create', 'edit', 'delete', 'approve'],
        pdi: ['view', 'create', 'edit', 'delete', 'approve'],
        insurance: ['view', 'create', 'edit', 'delete', 'approve'],
        registration: ['view', 'create', 'edit', 'delete', 'approve'],
        banking: ['view', 'create', 'edit', 'delete', 'approve'],
        finance: ['view', 'create', 'edit', 'delete', 'approve'],
        invoices: ['view', 'create', 'edit', 'delete', 'approve'],
        receipts: ['view', 'create', 'edit', 'delete', 'approve'],
        vendors: ['view', 'create', 'edit', 'delete', 'approve'],
        'purchase-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        receiving: ['view', 'create', 'edit', 'delete', 'approve'],
        bills: ['view', 'create', 'edit', 'delete', 'approve'],
        payments: ['view', 'create', 'edit', 'delete', 'approve'],
        expenses: ['view', 'create', 'edit', 'delete', 'approve'],
        products: ['view', 'create', 'edit', 'delete', 'approve'],
        pricelists: ['view', 'create', 'edit', 'delete', 'approve'],
        inventory: ['view', 'create', 'edit', 'delete', 'approve'],
        'stock-transfer': ['view', 'create', 'edit', 'delete', 'approve'],
        'physical-audit': ['view', 'create', 'edit', 'delete', 'approve'],
        returns: ['view', 'create', 'edit', 'delete', 'approve'],
        campaigns: ['view', 'create', 'edit', 'delete', 'approve'],
        budget: ['view', 'create', 'edit', 'delete', 'approve'],
        targets: ['view', 'create', 'edit', 'delete', 'approve'],
        reports: ['view', 'create', 'edit', 'delete', 'approve'],
        hr: ['view', 'create', 'edit', 'delete', 'approve'],
        team: ['view', 'create', 'edit', 'delete', 'approve'],
        users: ['view', 'create', 'edit', 'delete', 'approve'],
        'audit-logs': ['view', 'create', 'edit', 'delete', 'approve'],
        subscriptions: ['view', 'create', 'edit', 'delete', 'approve'],
        settings: ['view', 'create', 'edit', 'delete', 'approve'],
        'brand-enablement': ['view', 'create', 'edit', 'delete', 'approve'],
        'finance-applications': ['view', 'create', 'edit', 'delete', 'approve'],
        tenants: ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-vehicles': ['view'],
        'catalog-accessories': ['view'],
        'catalog-registration': ['view'],
        'catalog-insurance': ['view'],
        'catalog-services': ['view'],
    },
    DEALERSHIP_STAFF: {
        dashboard: ['view'],
        leads: ['view', 'create', 'edit'],
        customers: ['view', 'create', 'edit'],
        quotes: ['view', 'create', 'edit'],
        'sales-orders': ['view', 'create', 'edit'],
        'delivery-notes': ['view', 'create', 'edit'],
        pdi: ['view', 'create', 'edit'],
        insurance: ['view', 'create', 'edit'],
        registration: ['view', 'create', 'edit'],
        invoices: ['view', 'create'],
        receipts: ['view', 'create'],
        products: ['view'],
        inventory: ['view', 'create', 'edit'],
        reports: ['view'],
        'catalog-vehicles': ['view'],
    },
    BANK_STAFF: {
        dashboard: ['view'],
        leads: ['view', 'create', 'edit'],
        quotes: ['view', 'create', 'edit'],
        'sales-orders': ['view', 'create', 'edit'],
        insurance: ['view', 'create', 'edit'],
        registration: ['view', 'create', 'edit'],
        'finance-applications': ['view', 'approve'],
        receipts: ['view', 'create'],
        reports: ['view'],
    },
    FINANCE: {
        dashboard: ['view'],
        leads: ['view', 'create', 'edit'],
        quotes: ['view', 'create', 'edit'],
        'sales-orders': ['view', 'create', 'edit'],
        insurance: ['view', 'create', 'edit'],
        registration: ['view', 'create', 'edit'],
        'finance-applications': ['view', 'approve'],
        receipts: ['view', 'create'],
        reports: ['view'],
    },
    BMB_USER: {
        dashboard: ['view'],
        products: ['view'],
        'catalog-vehicles': ['view'],
        'catalog-accessories': ['view'],
        'catalog-registration': ['view'],
        'catalog-insurance': ['view'],
        'catalog-services': ['view'],
    },
    SUPER_ADMIN: {
        dashboard: ['view', 'create', 'edit', 'delete', 'approve'],
        leads: ['view', 'create', 'edit', 'delete', 'approve'],
        customers: ['view', 'create', 'edit', 'delete', 'approve'],
        quotes: ['view', 'create', 'edit', 'delete', 'approve'],
        'sales-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        'delivery-notes': ['view', 'create', 'edit', 'delete', 'approve'],
        pdi: ['view', 'create', 'edit', 'delete', 'approve'],
        insurance: ['view', 'create', 'edit', 'delete', 'approve'],
        registration: ['view', 'create', 'edit', 'delete', 'approve'],
        banking: ['view', 'create', 'edit', 'delete', 'approve'],
        finance: ['view', 'create', 'edit', 'delete', 'approve'],
        invoices: ['view', 'create', 'edit', 'delete', 'approve'],
        receipts: ['view', 'create', 'edit', 'delete', 'approve'],
        vendors: ['view', 'create', 'edit', 'delete', 'approve'],
        'purchase-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        receiving: ['view', 'create', 'edit', 'delete', 'approve'],
        bills: ['view', 'create', 'edit', 'delete', 'approve'],
        payments: ['view', 'create', 'edit', 'delete', 'approve'],
        expenses: ['view', 'create', 'edit', 'delete', 'approve'],
        products: ['view', 'create', 'edit', 'delete', 'approve'],
        pricelists: ['view', 'create', 'edit', 'delete', 'approve'],
        inventory: ['view', 'create', 'edit', 'delete', 'approve'],
        'stock-transfer': ['view', 'create', 'edit', 'delete', 'approve'],
        'physical-audit': ['view', 'create', 'edit', 'delete', 'approve'],
        returns: ['view', 'create', 'edit', 'delete', 'approve'],
        campaigns: ['view', 'create', 'edit', 'delete', 'approve'],
        budget: ['view', 'create', 'edit', 'delete', 'approve'],
        targets: ['view', 'create', 'edit', 'delete', 'approve'],
        reports: ['view', 'create', 'edit', 'delete', 'approve'],
        hr: ['view', 'create', 'edit', 'delete', 'approve'],
        team: ['view', 'create', 'edit', 'delete', 'approve'],
        users: ['view', 'create', 'edit', 'delete', 'approve'],
        'audit-logs': ['view', 'create', 'edit', 'delete', 'approve'],
        subscriptions: ['view', 'create', 'edit', 'delete', 'approve'],
        settings: ['view', 'create', 'edit', 'delete', 'approve'],
        'brand-enablement': ['view', 'create', 'edit', 'delete', 'approve'],
        'finance-applications': ['view', 'create', 'edit', 'delete', 'approve'],
        tenants: ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-vehicles': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-accessories': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-registration': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-insurance': ['view', 'create', 'edit', 'delete', 'approve'],
        'catalog-services': ['view', 'create', 'edit', 'delete', 'approve'],
    },
    MARKETPLACE_ADMIN: {
        dashboard: ['view', 'create', 'edit', 'delete', 'approve'],
        leads: ['view', 'create', 'edit', 'delete', 'approve'],
        customers: ['view', 'create', 'edit', 'delete', 'approve'],
        quotes: ['view', 'create', 'edit', 'delete', 'approve'],
        'sales-orders': ['view', 'create', 'edit', 'delete', 'approve'],
        'finance-applications': ['view', 'approve'],
        'catalog-vehicles': ['view', 'create', 'edit'],
        'catalog-accessories': ['view', 'create', 'edit'],
        'catalog-registration': ['view'],
        'catalog-insurance': ['view'],
        'catalog-services': ['view'],
    },
};
