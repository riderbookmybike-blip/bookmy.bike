import { Resource } from './permissions';

export type PlanTier = 'TRIAL' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface SubscriptionPlan {
    id: PlanTier;
    name: string;
    maxUsers: number;
    features: Resource[]; // List of enabled resources (modules)
    isReadOnlyOnExpire: boolean;
    price?: string; // UI display only
}

// All resources available in the system
const ALL_RESOURCES: Resource[] = [
    'dashboard', 'leads', 'customers', 'quotes', 'sales-orders',
    'delivery-notes', 'pdi', 'insurance', 'registration',
    'banking', 'finance', 'invoices', 'receipts',
    'vendors', 'purchase-orders', 'receiving', 'bills', 'payments', 'expenses',
    'products', 'pricelists', 'inventory', 'stock-transfer', 'physical-audit', 'returns',
    'campaigns', 'budget', 'targets',
    'reports', 'hr', 'team',
    'users', 'audit-logs', 'subscriptions', 'settings',
    'brand-enablement', 'finance-applications'
];

export const SUBSCRIPTION_PLANS: Record<PlanTier, SubscriptionPlan> = {
    'TRIAL': {
        id: 'TRIAL',
        name: 'Free Trial',
        maxUsers: 5,
        features: ALL_RESOURCES, // All features enabled for trial
        isReadOnlyOnExpire: true,
        price: 'Free (14 Days)'
    },
    'STARTER': {
        id: 'STARTER',
        name: 'Starter Plan',
        maxUsers: 10,
        features: [
            'dashboard',
            'leads', 'customers', 'quotes', 'sales-orders', // Sales
            'products', 'pricelists', // Basic Inventory
            'invoices', 'receipts', // Basic Finance
            'settings'
        ],
        isReadOnlyOnExpire: true,
        price: '₹999/mo'
    },
    'GROWTH': {
        id: 'GROWTH',
        name: 'Growth Plan',
        maxUsers: 50,
        features: [
            'dashboard',
            'leads', 'customers', 'quotes', 'sales-orders',
            'delivery-notes', 'pdi', 'registration', // Ops
            'invoices', 'receipts', 'payments', 'expenses', 'banking', // Finance + Banking
            'products', 'pricelists', 'inventory', 'stock-transfer', // Full Inventory
            'vendors', 'purchase-orders', 'bills', // Procurement
            'reports', 'settings', 'users'
        ],
        isReadOnlyOnExpire: true,
        price: '₹2,999/mo'
    },
    'ENTERPRISE': {
        id: 'ENTERPRISE',
        name: 'Enterprise Plan',
        maxUsers: 9999,
        features: ALL_RESOURCES, // All features
        isReadOnlyOnExpire: false, // Maybe grace period instead
        price: 'Custom'
    }
};
