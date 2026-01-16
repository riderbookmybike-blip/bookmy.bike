import { DashboardConfig, SidebarConfig } from '../core/types';

export const AUMS_SUPERADMIN_SIDEBAR: SidebarConfig = {
    tenantType: 'AUMS',
    groups: [
        {
            id: 'dashboard',
            title: 'Dashboard',
            order: 1,
            items: [
                { id: 'dashboard-main', title: 'Platform Overview' }
            ]
        },
        {
            id: 'operations',
            title: 'Operations',
            order: 2,
            items: [
                { id: 'catalog-vehicles' },
                { id: 'catalog-accessories' },
                { id: 'catalog-pricing' },
                { id: 'catalog-registration' },
                { id: 'catalog-insurance' },
                { id: 'admin-service-area' },
                { id: 'content-blog' }
            ]
        },
        {
            id: 'inventory',
            title: 'Inventory & Supply',
            order: 3,
            items: [
                { id: 'inventory-requisitions' },
                { id: 'inventory-orders' },
                { id: 'inventory-stock' }
            ]
        },
        {
            id: 'crm',
            title: 'Sales & CRM',
            order: 4,
            items: [
                { id: 'leads-main' },
                { id: 'customers-main' },
                { id: 'quotes-main' },
                { id: 'sales-orders' }
            ]
        },
        {
            id: 'admin',
            title: 'Admin & Settings',
            order: 5,
            items: [
                { id: 'admin-dealers' },
                { id: 'admin-finance' },
                { id: 'admin-users' },
                { id: 'admin-audit' },
                { id: 'admin-brand' },
                { id: 'admin-templates' }
            ]
        }
    ]
};

export const AUMS_SUPERADMIN_DASHBOARD: DashboardConfig = {
    id: 'aums-overview-main',
    title: 'AUMS Enterprise Command v2.4',
    description: 'Platform Overview',
    layout: 'grid',
    role: 'SUPER_ADMIN',
    tenantType: 'AUMS',
    widgets: [
        // Row 1: KPI Cards
        {
            id: 'kpi-gross-revenue',
            type: 'kpi-card',
            layout: { w: 3, h: 4, x: 0, y: 0 },
            props: { title: 'Gross Revenue', value: '₹1.42 Cr', delta: '+12.5%', isUp: true, sub: 'vs last 30 days', icon: 'Landmark' }
        },
        {
            id: 'kpi-active-dealers',
            type: 'kpi-card',
            layout: { w: 3, h: 4, x: 3, y: 0 },
            props: { title: 'Active Dealers', value: '542', delta: '+24', isUp: true, sub: '+8.2% Growth', icon: 'Users' }
        },
        {
            id: 'kpi-fleet-volume',
            type: 'kpi-card',
            layout: { w: 3, h: 4, x: 6, y: 0 },
            props: { title: 'Fleet Volume', value: '12,840', delta: '-2.1%', isUp: false, sub: 'Active Vehicles', icon: 'Zap' }
        },
        {
            id: 'kpi-service-slas',
            type: 'kpi-card',
            layout: { w: 3, h: 4, x: 9, y: 0 },
            props: { title: 'Service SLAs', value: '99.2%', delta: 'Optimal', isUp: true, sub: 'System Health', icon: 'Activity' }
        },
        // Row 2: Charts & Vitals
        {
            id: 'chart-fleet-velocity',
            type: 'chart-fleet-velocity',
            title: 'Fleet Velocity',
            layout: { w: 8, h: 10, x: 0, y: 4 }
        },
        // Vital Tiles Row
        {
            id: 'vital-db-sync',
            type: 'vital-tile',
            layout: { w: 3, h: 1, x: 8, y: 4 },
            props: {
                label: 'DB Sync Efficiency',
                value: '99.99%',
                sub: 'Healthy',
                meta: 'Last sync 42s ago',
                color: 'emerald',
                icon: 'Database'
            }
        },
        {
            id: 'vital-api-latency',
            type: 'vital-tile',
            layout: { w: 3, h: 1, x: 8, y: 5 },
            props: {
                label: 'Avg API Latency',
                value: '142ms',
                sub: 'Optimal',
                meta: 'p95: 210ms',
                color: 'blue',
                icon: 'Activity'
            }
        },
        {
            id: 'vital-error-rate',
            type: 'vital-tile',
            layout: { w: 3, h: 1, x: 8, y: 6 },
            props: {
                label: 'Traffic Error Rate',
                value: '0.02%',
                sub: 'Stable',
                meta: '12 incidents (24h)',
                color: 'indigo',
                icon: 'AlertTriangle'
            }
        },
        {
            id: 'widget-master-node',
            type: 'vital-tile',
            layout: { w: 3, h: 1, x: 8, y: 7 },
            props: {
                label: 'Master Node',
                value: 'Mumbai East',
                sub: 'Cluster Active',
                color: 'slate',
                icon: 'Server'
            }
        }
    ]
};
