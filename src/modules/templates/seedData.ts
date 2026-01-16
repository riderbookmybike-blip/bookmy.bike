import { DashboardConfig, SidebarConfig } from '../core/types';

export interface TemplateSeed {
    name: string;
    description: string;
    tenant_type: string;
    role: string; // The primary role this is designed for
    layout_config: DashboardConfig;
    sidebar_config: SidebarConfig;
}

// --- HELPER WRAPPERS ---
const wrapDashboard = (id: string, title: string, widgets: any[]): DashboardConfig => ({
    id, title, layout: 'grid', widgets
});

const wrapSidebar = (tenantType: string, groups: any[]): SidebarConfig => ({
    tenantType,
    groups: groups.map((g, i) => ({ ...g, id: g.group?.toLowerCase() || 'grp' + i, title: g.group, order: i }))
});

const fullLayout = { w: 12, h: 4 };
const halfLayout = { w: 6, h: 4 };
const quarterLayout = { w: 3, h: 4 };

// --- DEALER SIDEBAR ---
const dealerSidebarGroups = [
    {
        group: 'Overview',
        items: [{ id: 'dashboard', title: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' }]
    },
    // ... sales, ops, finance
];
// (Simplifying for brevity in seedData - the actual sidebar content is what matters)

export const TEMPLATES: TemplateSeed[] = [
    // 1. DEALER OWNER
    {
        name: 'Dealership Owner',
        description: 'Full visibility.',
        tenant_type: 'DEALER',
        role: 'OWNER',
        sidebar_config: wrapSidebar('DEALER', [
            { group: 'Overview', items: [{ id: 'dashboard', title: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' }] },
            { group: 'Sales', items: [{ id: 'leads', title: 'Leads', icon: 'Users', href: '/dashboard/leads' }] },
            { group: 'Finance', items: [{ id: 'payments', title: 'Payments', icon: 'Wallet', href: '/dashboard/payments' }] }
        ]),
        layout_config: wrapDashboard('dealer-owner', 'Owner Dashboard', [
            { id: 'kpi-rev', type: 'kpi-card', layout: fullLayout, props: { title: 'Total Revenue', value: '₹1.2Cr', delta: '+15%', isUp: true, icon: 'Landmark' } },
            { id: 'kpi-profit', type: 'kpi-card', layout: halfLayout, props: { title: 'Net Profit', value: '₹18L', delta: '+5%', isUp: true, icon: 'Wallet' } },
            { id: 'kpi-sales', type: 'kpi-card', layout: halfLayout, props: { title: 'Bike Sales', value: '142', delta: '+12%', isUp: true, icon: 'TrendingUp' } },
            { id: 'chart-sales', type: 'chart-fleet-velocity', layout: { w: 8, h: 8 } },
            { id: 'alerts', type: 'alerts-widget', layout: { w: 4, h: 8 } }
        ])
    },
    // ... (For other Dealer Roles, using simplified sidebar for now to save tokens, focus on structure)
    {
        name: 'Dealership GM',
        description: 'Operational focus.',
        tenant_type: 'DEALER',
        role: 'GM',
        sidebar_config: wrapSidebar('DEALER', [{ group: 'Overview', items: [{ id: 'dashboard' }] }]),
        layout_config: wrapDashboard('dealer-gm', 'GM Dashboard', [
            { id: 'kpi-sales', type: 'kpi-card', layout: quarterLayout, props: { title: 'Monthly Sales', value: '142', delta: '+12%', isUp: true, icon: 'TrendingUp' } },
            { id: 'kpi-bookings', type: 'kpi-card', layout: quarterLayout, props: { title: 'Active Bookings', value: '45', delta: '-2%', isUp: false, icon: 'FileText' } },
            { id: 'kpi-stock', type: 'kpi-card', layout: quarterLayout, props: { title: 'Stock Levels', value: '85%', sub: 'Healthy', icon: 'Box' } },
            { id: 'kpi-staff', type: 'kpi-card', layout: quarterLayout, props: { title: 'Staff Active', value: '24/25', icon: 'Users' } }
        ])
    },
    // ... (Skipping middle roles to focus on AUMS)

    // 11. AUMS OWNER (SUPER ADMIN)
    {
        name: 'AUMS SuperAdmin',
        description: 'Global Platform Health.',
        tenant_type: 'AUMS',
        role: 'OWNER',
        sidebar_config: wrapSidebar('AUMS', [
            {
                group: 'Admin',
                items: [
                    { id: 'system', title: 'System', href: '/admin' },
                    { id: 'admin-templates', title: 'Template Studio', icon: 'LayoutDashboard', href: '/app/aums/dashboard/admin/templates' }
                ]
            }
        ]),
        layout_config: wrapDashboard('aums-owner', 'SuperAdmin Dashboard', [
            { id: 'vital-db', type: 'vital-tile', layout: { w: 3, h: 2 }, props: { label: 'DB Health', value: '100%', icon: 'Database' } },
            { id: 'vital-api', type: 'vital-tile', layout: { w: 3, h: 2 }, props: { label: 'API Latency', value: '45ms', icon: 'Activity' } },
            { id: 'kpi-users', type: 'kpi-card', layout: { w: 3, h: 4 }, props: { title: 'Total Users', value: '15k', icon: 'Users' } },
            { id: 'kpi-rev', type: 'kpi-card', layout: { w: 3, h: 4 }, props: { title: 'ARR', value: '₹12Cr', icon: 'Landmark' } }
        ])
    }
];

