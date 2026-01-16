import { ComponentType, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// --- SHARED TYPES ---

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OWNER' | 'STAFF' | 'DEALERSHIP_ADMIN' | 'MARKETPLACE_ADMIN' | string;
export type TenantType = 'AUMS' | 'MARKETPLACE' | 'DEALER' | 'BANK' | string;

export interface Permission {
    action: 'read' | 'write' | 'delete' | 'approve' | 'manage';
    resource?: string;
}

// --- SIDEBAR TYPES ---

export interface SidebarItemConfig {
    id: string;              // Unique key for registry lookup (e.g. 'catalog-vehicles')
    title?: string;          // Override title from registry
    icon?: string;           // Override icon name from registry
    href?: string;           // Override href from registry
    children?: SidebarItemConfig[];
    isCollapsible?: boolean;
    requiredPermissions?: Permission[];
    allowedRoles?: Role[];
    allowedTenants?: TenantType[];
}

export interface SidebarGroupConfig {
    id: string;
    title: string;
    items: SidebarItemConfig[];
    order: number;
}

export interface SidebarConfig {
    groups: SidebarGroupConfig[];
    tenantType: TenantType;
}

// --- DASHBOARD TYPES ---

export interface WidgetProps {
    [key: string]: any;
}

export interface WidgetConfig {
    id: string;              // Unique instance ID (e.g. 'kpi-revenue-main')
    type: string;            // Registry key (e.g. 'kpi-card', 'chart-velocity')
    title?: string;
    props?: WidgetProps;     // Static props passed to the widget
    layout: {
        w: number;             // Width (1-12)
        h: number;             // Height units
        x?: number;            // Optional explicit X position
        y?: number;            // Optional explicit Y position
    };
    requiredPermissions?: Permission[];
}

export interface DashboardConfig {
    id: string;
    title: string;
    description?: string;
    layout: 'grid' | 'fixed'; // Future proofing
    widgets: WidgetConfig[];
    tenantType?: TenantType;
    role?: Role;
}

// --- REGISTRY INTERFACES ---

export interface RegisteredWidget {
    component: ComponentType<any>;
    defaultProps?: WidgetProps;
    defaultLayout?: { w: number; h: number };
    description?: string;
}

export interface RegisteredRoute {
    path: string;
    label: string;
    icon?: LucideIcon;
    tags?: string[];
}
