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

// Define strict types for sidebar items
export interface SidebarItem {
  title: string;
  href: string;
  icon?: any;
  color?: string; // Added color property
}

export interface SidebarGroup {
  group: string;
  items: SidebarItem[];
}

// 1. DEALER TENANT CONFIGURATION
const DEALER_SIDEBAR: SidebarGroup[] = [
  {
    group: 'Dashboard',
    items: [
      { title: 'Overview', href: '/dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    ],
  },
  {
    group: 'Sales',
    items: [
      { title: 'Leads & Enquiries', href: '/leads', icon: Users, color: 'text-blue-500' },
      { title: 'Customers', href: '/customers', icon: UserCheck, color: 'text-blue-400' },
      { title: 'Quotes', href: '/quotes', icon: FileText, color: 'text-blue-300' },
      { title: 'Sales Orders', href: '/sales-orders', icon: ShoppingCart, color: 'text-cyan-500' },
      { title: 'Finance Status', href: '/finance-applications', icon: BadgeIndianRupee, color: 'text-emerald-500' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { title: 'Delivery Notes', href: '/delivery-notes', icon: Truck, color: 'text-orange-500' },
      { title: 'Inspection', href: '/pdi', icon: ClipboardCheck, color: 'text-emerald-500' },
      { title: 'Insurance', href: '/insurance', icon: ShieldCheck, color: 'text-rose-500' },
      { title: 'Registration', href: '/registration', icon: FileCheck, color: 'text-amber-500' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { title: 'Inventory', href: '/inventory', icon: Warehouse, color: 'text-purple-500' },
      { title: 'Brand Enablement', href: '/brand-enablement', icon: Tags, color: 'text-pink-500' },
      { title: 'Price Lists', href: '/pricelists', icon: ScrollText, color: 'text-slate-400' },
      { title: 'Stock Transfer', href: '/stock-transfer', icon: FileOutput, color: 'text-orange-400' },
      { title: 'Physical Audit', href: '/physical-audit', icon: ClipboardCheck, color: 'text-red-400' },
      { title: 'Returns', href: '/returns', icon: HistoryIcon, color: 'text-slate-400' },
      // Catalog View
      { title: 'Vehicles', href: '/catalog/vehicles', icon: Box, color: 'text-indigo-400' },
      { title: 'Accessories', href: '/catalog/accessories', icon: ShoppingBag, color: 'text-pink-400' },
    ],
  },
  {
    group: 'Procurement',
    items: [
      { title: 'Vendors', href: '/vendors', icon: Building2, color: 'text-slate-500' },
      { title: 'Purchase Orders', href: '/purchase-orders', icon: ScrollText, color: 'text-blue-400' },
      { title: 'Receiving', href: '/receiving', icon: Warehouse, color: 'text-emerald-400' },
    ],
  },
  {
    group: 'Accounting',
    items: [
      { title: 'Invoices', href: '/invoices', icon: Receipt, color: 'text-purple-500' },
      { title: 'Receipts', href: '/receipts', icon: ScrollText, color: 'text-purple-400' },
      { title: 'General Ledger', href: '/ledger', icon: Calculator, color: 'text-slate-400' },
      { title: 'Day Book', href: '/daybook', icon: FileText, color: 'text-slate-400' },
      { title: 'Trial Balance', href: '/trial-balance', icon: BarChart4, color: 'text-orange-400' },
      { title: 'Profit & Loss', href: '/profit-loss', icon: PieChart, color: 'text-red-400' },
      { title: 'Balance Sheet', href: '/balance-sheet', icon: Columns, color: 'text-blue-400' },
      { title: 'Credit Notes', href: '/credit-notes', icon: FileText, color: 'text-red-300' },
      { title: 'Payments', href: '/payments', icon: Wallet, color: 'text-emerald-500' },
      { title: 'Bills', href: '/bills', icon: Receipt, color: 'text-orange-500' },
      { title: 'Expenses', href: '/expenses', icon: PieChart, color: 'text-red-500' },
      { title: 'Banking (Internal)', href: '/banking', icon: Landmark, color: 'text-indigo-500' },
    ],
  },
  {
    group: 'Strategy',
    items: [
      { title: 'Campaigns', href: '/campaigns', icon: Megaphone, color: 'text-pink-500' },
      { title: 'Budget', href: '/budget', icon: Calculator, color: 'text-emerald-400' },
      { title: 'Targets', href: '/targets', icon: BarChart4, color: 'text-blue-500' },
      { title: 'Reports', href: '/reports', icon: BarChart4, color: 'text-indigo-500' },
      { title: 'HR', href: '/hr', icon: Users, color: 'text-orange-400' },
      { title: 'Team', href: '/team', icon: Users, color: 'text-orange-500' },
    ],
  },
  {
    group: 'System',
    items: [
      { title: 'Audit Logs', href: '/audit-logs', icon: HistoryIcon, color: 'text-slate-400' },
    ]
  }
];

// 2. BANK TENANT CONFIGURATION
const BANK_SIDEBAR: SidebarGroup[] = [
  {
    group: 'Bank Dashboard',
    items: [
      { title: 'Overview', href: '/dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    ],
  },
  {
    group: 'Loan Processing',
    items: [
      { title: 'Applications', href: '/finance-applications', icon: FileText, color: 'text-blue-500' },
    ],
  },
  {
    group: 'Team Management',
    items: [
      { title: 'Bank Team', href: '/team', icon: Users, color: 'text-orange-500' },
    ],
  },
  {
    group: 'Settings',
    items: [
      { title: 'Bank Settings', href: '/settings', icon: Settings, color: 'text-slate-400' },
    ],
  },
];

// 3. SUPER ADMIN CONFIGURATION
// 3. SUPER ADMIN CONFIGURATION (Full Access)
const ADMIN_SIDEBAR: SidebarGroup[] = [
  {
    group: 'Super Admin',
    items: [
      { title: 'Mission Control', href: '/dashboard', icon: LayoutDashboard, color: 'text-indigo-600' },
    ],
  },
  {
    group: 'Platform Management',
    items: [
      { title: 'Dealerships', href: '/dashboard/dealers', icon: Building2, color: 'text-blue-600' },
      { title: 'Finance Partners', href: '/dashboard/finance-partners', icon: Landmark, color: 'text-emerald-600' },
    ],
  },
  {
    group: 'Access Control',
    items: [
      { title: 'System Users', href: '/dashboard/users', icon: Users, color: 'text-purple-600' },
      { title: 'Permissions', href: '/dashboard/permissions', icon: Lock, color: 'text-red-600' },
    ],
  },
  {
    group: 'Global Catalog',
    items: [
      { title: 'Vehicles', href: '/catalog/vehicles', icon: Box, color: 'text-indigo-500' },
      { title: 'Accessories', href: '/catalog/accessories', icon: ShoppingBag, color: 'text-pink-500' },
      { title: 'HSN Master', href: '/catalog/hsn', icon: FileText, color: 'text-slate-500' },
      { title: 'On-Road Pricing', href: '/catalog/pricing', icon: Calculator, color: 'text-emerald-500' },
      { title: 'Registration', href: '/catalog/registration', icon: FileCheck, color: 'text-amber-500' },
      { title: 'Insurance', href: '/catalog/insurance', icon: ShieldCheck, color: 'text-rose-500' },
      { title: 'Services', href: '/catalog/services', icon: Wrench, color: 'text-slate-500' },
      { title: 'Service Area', href: '/superadmin/service-area', icon: MapPin, color: 'text-red-500' },
    ],
  },
  {
    group: 'Infrastructure',
    items: [
      { title: 'Audit Logs', href: '/audit-logs', icon: HistoryIcon, color: 'text-slate-500' },
    ],
  },
];

// 4. MARKETPLACE STAFF CONFIGURATION (Restricted)
const MARKETPLACE_SIDEBAR: SidebarGroup[] = [
  {
    group: 'Marketplace',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    ],
  },
  {
    group: 'Catalog Operations',
    items: [
      { title: 'Vehicles', href: '/catalog/vehicles', icon: Box, color: 'text-indigo-400' },
      { title: 'Accessories', href: '/catalog/accessories', icon: ShoppingBag, color: 'text-pink-400' },
      { title: 'On-Road Pricing', href: '/catalog/pricing', icon: Calculator, color: 'text-emerald-400' },
    ],
  },
];

// getSidebarConfig function to return the correct array
export const getSidebarConfig = (tenantType: TenantType, userRole?: string): SidebarGroup[] => {
  const role = userRole?.toUpperCase();
  const type = tenantType?.toUpperCase();

  switch (type) {
    case 'BANK':
      return BANK_SIDEBAR;
    case 'MARKETPLACE':
    case 'SUPER_ADMIN':
    case 'MARKETPLACE_ADMIN':
      // If we directly know they are Super Admin from the type or role
      if (role === 'SUPER_ADMIN' || role === 'MARKETPLACE_ADMIN' || type === 'SUPER_ADMIN') {
        return ADMIN_SIDEBAR;
      }
      return MARKETPLACE_SIDEBAR;
    case 'DEALER':
    default:
      return DEALER_SIDEBAR;
  }
};
