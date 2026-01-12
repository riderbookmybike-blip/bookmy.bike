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
  Lock
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
  allowedTenants?: TenantType[]; // Which tenants can see this?
  allowedRoles?: string[];       // Specific roles (e.g., 'SUPER_ADMIN')
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
        allowedTenants: ['MARKETPLACE'],
        allowedRoles: ['SUPER_ADMIN', 'MARKETPLACE_ADMIN']
      },
      {
        title: 'Overview',
        href: '/dashboard',
        icon: LayoutDashboard,
        color: 'text-indigo-500',
        allowedTenants: ['DEALER', 'BANK']
      },
      {
        title: 'Marketplace Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        color: 'text-indigo-500',
        allowedTenants: ['MARKETPLACE'], // Staff view
        allowedRoles: ['MARKETPLACE_STAFF']
      }
    ]
  },
  {
    group: 'Operations',
    items: [
      {
        title: 'Vehicle Catalog',
        href: '/dashboard/catalog/vehicles',
        icon: Box,
        color: 'text-indigo-500',
        allowedTenants: ['MARKETPLACE', 'DEALER'],
        permissions: ['read']
      },
      {
        title: 'Accessories',
        href: '/dashboard/catalog/accessories',
        icon: ShoppingBag,
        color: 'text-pink-500',
        allowedTenants: ['MARKETPLACE', 'DEALER']
      },
      {
        title: 'Service Areas',
        href: '/superadmin/service-area',
        icon: MapPin,
        color: 'text-red-500',
        allowedTenants: ['MARKETPLACE'],
        allowedRoles: ['SUPER_ADMIN']
      },
      {
        title: 'Inventory',
        href: '/inventory',
        icon: Warehouse,
        color: 'text-purple-500',
        allowedTenants: ['DEALER']
      },
      {
        title: 'Finance Status',
        href: '/finance-applications',
        icon: BadgeIndianRupee,
        color: 'text-emerald-500',
        allowedTenants: ['DEALER', 'BANK']
      },
    ]
  },
  {
    group: 'Sales & CRM',
    items: [
      {
        title: 'Leads & Enquiries',
        href: '/leads',
        icon: Users,
        color: 'text-blue-500',
        allowedTenants: ['DEALER']
      },
      {
        title: 'Customers',
        href: '/customers',
        icon: UserCheck,
        color: 'text-blue-400',
        allowedTenants: ['DEALER']
      },
      {
        title: 'Quotes',
        href: '/quotes',
        icon: FileText,
        color: 'text-blue-300',
        allowedTenants: ['DEALER']
      },
      {
        title: 'Sales Orders',
        href: '/sales-orders',
        icon: ShoppingCart,
        color: 'text-cyan-500',
        allowedTenants: ['DEALER']
      },
    ]
  },
  {
    group: 'Admin & Settings',
    items: [
      {
        title: 'Dealership Network',
        href: '/dashboard/dealers',
        icon: Building2,
        color: 'text-blue-600',
        allowedTenants: ['MARKETPLACE'],
        allowedRoles: ['SUPER_ADMIN', 'MARKETPLACE_ADMIN']
      },
      {
        title: 'Finance Partners',
        href: '/dashboard/finance-partners',
        icon: Landmark,
        color: 'text-emerald-600',
        allowedTenants: ['MARKETPLACE'],
        allowedRoles: ['SUPER_ADMIN']
      },
      {
        title: 'System Users',
        href: '/dashboard/users',
        icon: Users,
        color: 'text-purple-600',
        allowedTenants: ['MARKETPLACE'],
        allowedRoles: ['SUPER_ADMIN']
      },
      {
        title: 'Bank Settings',
        href: '/settings',
        icon: Settings,
        color: 'text-slate-400',
        allowedTenants: ['BANK']
      },
      {
        title: 'Audit Logs',
        href: '/audit-logs',
        icon: HistoryIcon,
        color: 'text-slate-400',
        allowedTenants: ['MARKETPLACE', 'DEALER', 'BANK'],
        permissions: ['read']
      },
      {
        title: 'Brand Guidelines',
        href: '/dashboard/design-system',
        icon: Tags,
        color: 'text-pink-500',
        allowedTenants: ['MARKETPLACE'],
        allowedRoles: ['SUPER_ADMIN']
      }
    ]
  }
];

// Helper to check if item is allowed
const isItemAllowed = (item: SidebarItem, tenantType: TenantType, userRole?: string): boolean => {
  // 1. Check Tenant
  if (item.allowedTenants && !item.allowedTenants.includes(tenantType)) return false;

  // 2. Check Role (if specified)
  if (item.allowedRoles && userRole) {
    if (!item.allowedRoles.includes(userRole)) return false;
  }

  // 3. Fallback for legacy behavior: If strict filtering is ON, we might want to hide items without explicit config
  // For now, if no restrictions are present, we assume it's NOT allowed to prevent leaking
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
