import {
    LayoutDashboard,
    Users,
    UserCheck,
    FileText,
    ShoppingCart,
    Landmark,
    Truck,
    ClipboardCheck,
    ShieldCheck,
    FileCheck,
    Box,
    History as HistoryIcon,
    Building2,
    BarChart4,
    PieChart,
    Megaphone,
    Columns,
    CreditCard,
    Settings,
    MapPin,
    ShoppingBag,
    Receipt,
    ScrollText,
    Wrench,
    Calculator,
    Warehouse,
    BadgeIndianRupee,
    Tags,
    FileOutput,
    Wallet,
    Lock,
    ArrowRightLeft,
    Database,
    Languages,
    Bookmark,
    MessageCircle,
    BookOpen,
} from 'lucide-react';
import { TenantType } from '@/lib/tenant/tenantContext';

// Define Permissions
export type PermissionAction = 'read' | 'write' | 'delete' | 'approve' | 'manage';

// Define strict types for sidebar items
export interface SidebarItem {
    title: string;
    href: string;
    icon?: any;
    color?: string;
    subGroup?: string; // Optional sub-section within a group
    allowedTenants?: TenantType[]; // Which tenants can see this?
    allowedRoles?: string[]; // Specific roles (e.g., 'SUPER_ADMIN')
    permissions?: PermissionAction[]; // Actions allowed in this module
}

export interface SidebarGroup {
    group: string;
    items: SidebarItem[];
    id?: string; // For permission targeting
}

// MASTER CONFIGURATION
// This single list defines ALL possible menus. Filtering Logic in Sidebar.tsx will handle visibility.

const ALL_SIDEBAR_GROUPS: SidebarGroup[] = [
    {
        group: 'Dashboard',
        items: [
            {
                title: 'Platform Overview',
                href: '/dashboard',
                icon: LayoutDashboard,
                color: 'text-indigo-600',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                color: 'text-indigo-500',
                allowedTenants: ['DEALER', 'BANK'],
            },
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                color: 'text-indigo-500',
                allowedTenants: ['MARKETPLACE'], // Staff view
                allowedRoles: [
                    'DEALERSHIP_STAFF',
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                ],
            },
        ],
    },
    {
        group: 'Sales',
        items: [
            {
                title: 'Members',
                href: '/members',
                icon: UserCheck,
                color: 'text-violet-500', // Unique
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Leads',
                href: '/leads',
                icon: Megaphone,
                color: 'text-amber-500', // Unique (Lead = Gold)
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Quotes',
                href: '/quotes',
                icon: FileText,
                color: 'text-blue-500', // Unique
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Bookings',
                href: '/sales-orders',
                icon: ShoppingBag,
                color: 'text-indigo-600',
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Receipts',
                href: '/receipts',
                icon: CreditCard,
                color: 'text-emerald-500',
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Books',
                href: '/books',
                icon: BookOpen,
                color: 'text-fuchsia-500', // Unique
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Allotment',
                href: '/sales-orders?stage=ALLOTMENT',
                icon: Bookmark,
                color: 'text-purple-600', // Unique
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Pre-Delivery',
                href: '/sales-orders?stage=PDI',
                icon: ClipboardCheck,
                color: 'text-orange-600', // Unique
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Insurance',
                href: '/sales-orders?stage=INSURANCE',
                icon: ShieldCheck,
                color: 'text-cyan-600', // Unique
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Finance',
                href: '/sales-orders?stage=FINANCE',
                icon: Landmark,
                color: 'text-green-600', // Unique
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Registration',
                href: '/sales-orders?stage=REGISTRATION',
                icon: Receipt,
                color: 'text-yellow-600', // Unique (distinct from Amber)
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Compliance',
                href: '/sales-orders?stage=COMPLIANCE',
                icon: Lock,
                color: 'text-teal-600', // Unique
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Delivery',
                href: '/sales-orders?stage=DELIVERED',
                icon: Truck,
                color: 'text-rose-600', // Unique
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
            {
                title: 'Feedback',
                href: '/sales-orders?stage=FEEDBACK',
                icon: MessageCircle,
                color: 'text-sky-500',
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS', 'BANK'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                    'BANK_STAFF',
                    'FINANCE',
                ],
            },
        ],
    },
    {
        group: 'Rewards',
        items: [
            {
                title: 'O-Club',
                href: '/dashboard/oclub',
                icon: Wallet,
                color: 'text-emerald-500',
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                ],
            },
        ],
    },
    {
        group: 'Operations',
        items: [
            {
                title: 'Live Stock',
                href: '/dashboard/inventory/stock',
                icon: Warehouse,
                color: 'text-emerald-500',
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'Vehicle Requisitions',
                href: '/dashboard/inventory/requisitions',
                icon: FileOutput,
                color: 'text-purple-500',
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'Purchase Orders',
                href: '/dashboard/inventory/orders',
                icon: ShoppingBag,
                color: 'text-indigo-500',
                allowedTenants: ['DEALER', 'MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'Price List',
                href: '/dashboard/catalog/pricing',
                icon: Tags,
                color: 'text-amber-500',
                allowedTenants: ['DEALER'],
                allowedRoles: ['OWNER', 'ADMIN', 'DEALERSHIP_ADMIN'],
                permissions: ['read'],
            },
            {
                title: 'PDI Tasks',
                href: '/sales-orders?stage=PDI',
                icon: ClipboardCheck,
                color: 'text-orange-500',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                ],
            },
            {
                title: 'Service Areas',
                href: '/superadmin/service-area',
                icon: MapPin,
                color: 'text-red-500',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                ],
            },
            {
                title: 'Finance Status',
                href: '/finance-applications',
                icon: BadgeIndianRupee,
                color: 'text-emerald-500',
                allowedTenants: ['BANK'],
            },
            {
                title: 'Blog Management',
                href: '/dashboard/blog',
                icon: ScrollText,
                color: 'text-orange-500',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'RTO / Registration',
                href: '/dashboard/catalog/registration',
                icon: FileCheck,
                color: 'text-slate-500',
                allowedTenants: ['AUMS', 'MARKETPLACE'],
                allowedRoles: ['SUPER_ADMIN', 'MARKETPLACE_ADMIN'],
            },
            {
                title: 'Insurance Logic',
                href: '/dashboard/catalog/insurance',
                icon: ShieldCheck,
                color: 'text-emerald-500',
                allowedTenants: ['AUMS', 'MARKETPLACE'],
                allowedRoles: ['SUPER_ADMIN', 'MARKETPLACE_ADMIN'],
            },
        ],
    },
    {
        group: 'Settings',
        items: [
            {
                title: 'Company Profile',
                href: '/dashboard/company-profile',
                icon: Settings,
                color: 'text-slate-400',
                allowedTenants: ['DEALER'],
            },
            {
                title: 'Team',
                href: '/dashboard/users',
                icon: Users,
                color: 'text-purple-600',
                allowedTenants: ['DEALER'],
                allowedRoles: ['OWNER', 'ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'Financer',
                href: '/dashboard/settings/financer',
                icon: Landmark,
                color: 'text-emerald-600',
                allowedTenants: ['DEALER'],
                allowedRoles: ['OWNER', 'ADMIN', 'DEALERSHIP_ADMIN', 'DEALERSHIP_STAFF'],
            },

            {
                title: 'Product Catalog',
                href: '/dashboard/catalog/products',
                icon: Box,
                color: 'text-indigo-500',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: [
                    'OWNER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'MARKETPLACE_ADMIN',
                    'DEALERSHIP_ADMIN',
                    'DEALERSHIP_STAFF',
                ],
                permissions: ['read'],
            },
            {
                title: 'Pricing Engine',
                href: '/dashboard/catalog/pricing',
                icon: Calculator,
                color: 'text-amber-500',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
                permissions: ['read'],
            },
            {
                title: 'Audit Trail',
                href: '/dashboard/catalog/audit',
                icon: HistoryIcon,
                color: 'text-slate-500',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
                permissions: ['read'],
            },
            {
                title: 'Dealership Network',
                href: '/dashboard/dealers',
                icon: Building2,
                color: 'text-blue-600',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'Finance Partners',
                href: '/dashboard/finance-partners',
                icon: Landmark,
                color: 'text-emerald-600',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'System Users',
                href: '/dashboard/users',
                icon: Users,
                color: 'text-purple-600',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'Bank Settings',
                href: '/dashboard/settings',
                icon: Settings,
                color: 'text-slate-400',
                allowedTenants: ['BANK'],
            },

            {
                title: 'Brand Guidelines',
                href: '/dashboard/design-system',
                icon: Tags,
                color: 'text-pink-500',
                allowedTenants: ['MARKETPLACE', 'AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALERSHIP_ADMIN'],
            },
            {
                title: 'HSN Master',
                href: '/dashboard/catalog/hsn',
                icon: ScrollText,
                color: 'text-emerald-500',
                allowedTenants: ['AUMS'],
                allowedRoles: ['SUPER_ADMIN', 'MARKETPLACE_ADMIN'],
            },
            {
                title: 'System Blueprint',
                href: '/dashboard/whitepaper',
                icon: FileText,
                color: 'text-brand-primary',
                allowedTenants: ['AUMS'],
                allowedRoles: ['SUPER_ADMIN', 'MARKETPLACE_ADMIN'],
            },
            {
                title: 'Roles & Audit',
                href: '/dashboard/settings/roles',
                icon: ShieldCheck,
                color: 'text-indigo-500',
                allowedTenants: ['AUMS'],
                allowedRoles: ['SUPER_ADMIN'],
            },
            {
                title: 'Template Studio',
                href: '/app/aums/dashboard/admin/templates',
                icon: LayoutDashboard,
                color: 'text-indigo-600',
                allowedTenants: ['AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'],
            },
            {
                title: 'Translations',
                href: '/dashboard/admin/translations',
                icon: Languages,
                color: 'text-amber-600',
                allowedTenants: ['AUMS'],
                allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'],
            },
            {
                title: 'Migration Studio',
                href: '/dashboard/admin/migration',
                icon: Database,
                color: 'text-rose-600',
                allowedTenants: ['AUMS'],
                allowedRoles: ['SUPER_ADMIN'],
            },
        ],
    },
];

// Helper to check if item is allowed
const isItemAllowed = (item: SidebarItem, tenantType: TenantType, userRole?: string): boolean => {
    const role = userRole?.toUpperCase();
    const type = tenantType?.toUpperCase();

    // 1. SUPERADMIN OVERRIDE: If user is in AUMS tenant, show everything allowed for AUMS regardless of role
    // This is a safety measure to ensure Superadmins never lose access to their tools.
    if (type === 'AUMS' && item.allowedTenants?.includes('AUMS')) return true;

    // 2. Check Tenant
    if (item.allowedTenants && !item.allowedTenants.includes(tenantType)) return false;

    // 3. Check Role (if specified)
    if (item.allowedRoles && role) {
        // Explicit list of variants to handle legacy or typoed roles
        const roleVariants = [role];
        if (role === 'SUPER_ADMIN') roleVariants.push('SUPERADMIN', 'ADMIN');
        if (role === 'SUPERADMIN') roleVariants.push('SUPER_ADMIN', 'ADMIN');
        if (role === 'ADMIN') roleVariants.push('SUPER_ADMIN', 'SUPERADMIN');
        if (role.startsWith('BANK')) roleVariants.push('BANK', 'BANK_STAFF', 'FINANCE', 'FINANCE_STAFF', 'FINANCIER');

        if (!item.allowedRoles.some(r => roleVariants.includes(r.toUpperCase()))) return false;
    } else if (item.allowedRoles && !role) {
        // No role info, deny
        return false;
    } else if (!item.allowedRoles) {
        // If roles not specified and tenant matches, allow (esp. for BANK)
        return true;
    }

    // 4. Fallback: If no restrictions are present, we assume it's NOT allowed for safety
    if (!item.allowedTenants && !item.allowedRoles) return false;

    return true;
};

// getSidebarConfig function to return the correct array
export const getSidebarConfig = (tenantType: TenantType, userRole?: string): SidebarGroup[] => {
    const role = userRole?.toUpperCase();
    const type = tenantType?.toUpperCase() as TenantType;

    // Filter groups
    return ALL_SIDEBAR_GROUPS.map(group => {
        // Filter items within group
        const visibleItems = group.items.filter(item => isItemAllowed(item, type, role));
        return { ...group, items: visibleItems };
    }).filter(group => group.items.length > 0); // Remove empty groups
};
