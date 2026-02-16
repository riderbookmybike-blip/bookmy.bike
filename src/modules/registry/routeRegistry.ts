import { RegisteredRoute } from '../core/types';
import {
    LayoutDashboard,
    Users,
    Box,
    ShoppingBag,
    Calculator,
    FileCheck,
    ShieldCheck,
    MapPin,
    ScrollText,
    BadgeIndianRupee,
    FileOutput,
    Warehouse,
    UserCheck,
    FileText,
    ShoppingCart,
    Building2,
    Landmark,
    Settings,
    History,
    Tags,
} from 'lucide-react';

export const ROUTE_REGISTRY: Record<string, RegisteredRoute> = {
    // --- DASHBOARDS ---
    'dashboard-main': { path: '/dashboard', label: 'Platform Overview', icon: LayoutDashboard },

    // --- CATALOG ---
    'catalog-vehicles': { path: '/dashboard/catalog/products', label: 'Vehicle Catalog', icon: Box },
    'catalog-accessories': { path: '/dashboard/catalog/accessories', label: 'Accessories', icon: ShoppingBag },
    'catalog-pricing': { path: '/dashboard/catalog/pricing', label: 'Pricing Engine', icon: Calculator },
    'catalog-registration': { path: '/dashboard/catalog/registration', label: 'RTO / Registration', icon: FileCheck },
    'catalog-insurance': { path: '/dashboard/catalog/insurance', label: 'Insurance Logic', icon: ShieldCheck },
    'catalog-audit': { path: '/dashboard/catalog/audit', label: 'Catalog Audit', icon: History },

    // --- INVENTORY ---
    'inventory-requisitions': {
        path: '/dashboard/inventory/requisitions',
        label: 'Vehicle Requisitions',
        icon: FileOutput,
    },
    'inventory-orders': { path: '/dashboard/inventory/orders', label: 'Purchase Orders', icon: ShoppingBag },
    'inventory-stock': { path: '/dashboard/inventory/stock', label: 'Live Stock', icon: Warehouse },

    // --- SALES ---
    'leads-main': { path: '/leads', label: 'Leads & Enquiries', icon: Users },
    'members-main': { path: '/members', label: 'Members', icon: UserCheck },
    'quotes-main': { path: '/quotes', label: 'Quotes', icon: FileText },
    'sales-orders': { path: '/sales-orders', label: 'Sales Orders', icon: ShoppingCart },

    // --- ADMIN ---
    'admin-dealers': { path: '/dashboard/dealers', label: 'Dealership Network', icon: Building2 },
    'admin-finance': { path: '/dashboard/finance-partners', label: 'Finance Partners', icon: Landmark },
    'admin-users': { path: '/dashboard/users', label: 'System Users', icon: Users },
    'admin-audit': { path: '/audit-logs', label: 'Audit Logs', icon: History },
    'admin-brand': { path: '/dashboard/design-system', label: 'Brand Guidelines', icon: Tags },
    'admin-service-area': { path: '/superadmin/service-area', label: 'Service Areas', icon: MapPin },
    'admin-templates': { path: '/app/aums/dashboard/admin/templates', label: 'Template Studio', icon: LayoutDashboard },

    // --- CONTENT ---
    'content-blog': { path: '/dashboard/blog', label: 'Blog Management', icon: ScrollText },

    // --- FINANCE ---
    'finance-applications': { path: '/finance-applications', label: 'Finance Status', icon: BadgeIndianRupee },
    'bank-settings': { path: '/dashboard/settings', label: 'Bank Settings', icon: Settings },
};

export const getRouteConfig = (id: string) => {
    return ROUTE_REGISTRY[id];
};
