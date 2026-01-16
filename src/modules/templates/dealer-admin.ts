import { DashboardConfig, SidebarConfig } from '../core/types';

export const DEALER_ADMIN_SIDEBAR: SidebarConfig = {
    tenantType: 'DEALER',
    groups: [
        {
            id: 'dashboard',
            title: 'Overview',
            order: 1,
            items: [
                { id: 'dashboard-main', title: 'Dealership Overview' }
            ]
        },
        {
            id: 'sales',
            title: 'Sales & Showroom',
            order: 2,
            items: [
                { id: 'leads-main' },
                { id: 'customers-main' },
                { id: 'quotes-main' },
                { id: 'sales-orders' },
                { id: 'finance-applications' }
            ]
        },
        {
            id: 'inventory',
            title: 'Inventory',
            order: 3,
            items: [
                { id: 'inventory-stock' },
                { id: 'inventory-requisitions' },
                { id: 'inventory-orders' }
            ]
        },
        {
            id: 'catalog',
            title: 'Catalog',
            order: 4,
            items: [
                { id: 'catalog-vehicles' },
                { id: 'catalog-accessories' }
            ]
        },
        {
            id: 'system',
            title: 'System',
            order: 5,
            items: [
                { id: 'admin-audit' }
            ]
        }
    ]
};

export const DEALER_ADMIN_DASHBOARD: DashboardConfig = {
    id: 'dealer-overview-main',
    title: 'Dealership Command Center',
    description: 'Sales & Inventory Overview',
    layout: 'grid',
    role: 'ADMIN',
    tenantType: 'DEALER',
    widgets: [
        // Row 1: KPI Cards (Sales Focused)
        {
            id: 'kpi-monthly-sales',
            type: 'kpi-card-v2',
            layout: { w: 3, h: 4 },
            props: { title: 'Monthly Sales', value: '₹42.5 L', sub: 'Target: ₹50L', icon: 'BadgeIndianRupee' }
        },
        {
            id: 'kpi-active-bookings',
            type: 'kpi-card-v2',
            layout: { w: 3, h: 4 },
            props: { title: 'Active Bookings', value: '18', sub: 'Delivery Pending', icon: 'ShoppingCart' }
        },
        {
            id: 'kpi-leads-today',
            type: 'kpi-card-v2',
            layout: { w: 3, h: 4 },
            props: { title: 'Leads (Today)', value: '14', sub: '4 Walk-ins', icon: 'Users' }
        },
        {
            id: 'kpi-stock-level',
            type: 'kpi-card-v2',
            layout: { w: 3, h: 4 },
            props: { title: 'Total Stock', value: '45', sub: 'Units Available', icon: 'Box' }
        },
        // Row 2: Funnel & Alerts
        {
            id: 'sales-funnel',
            type: 'funnel-widget',
            layout: { w: 6, h: 8 }
        },
        {
            id: 'urgent-alerts',
            type: 'alerts-widget',
            layout: { w: 6, h: 8 }
        },
        // Row 3: Recent Activity
        {
            id: 'recent-activity-list',
            type: 'recent-activity',
            layout: { w: 12, h: 6 }
        }
    ]
};
