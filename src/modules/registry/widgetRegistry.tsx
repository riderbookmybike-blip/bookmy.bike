import React from 'react';
import { RegisteredWidget } from '../core/types';
import {
    FunnelWidget,
    PaymentsWidget,
    RecentActivity,
    AlertsWidget,
    KpiCard
} from '@/components/dashboard/DashboardWidgets';
import { VitalTile } from '@/components/dashboard/VitalTile';
import { KPICard as KPIV1 } from '@/components/dashboard/KPICard';
import { FleetVelocityWidget } from '@/components/dashboard/FleetVelocityWidget';

export const WIDGET_REGISTRY: Record<string, RegisteredWidget> = {
    'kpi-card': {
        component: KPIV1,
        defaultProps: { title: 'Metric', value: '0', delta: '0%' },
        defaultLayout: { w: 3, h: 4 },
        description: 'Standard KPI Card with trend indicator'
    },
    'kpi-card-v2': {
        component: KpiCard,
        defaultProps: { title: 'Metric', value: '0', sub: 'Subtitle' },
        defaultLayout: { w: 3, h: 4 },
        description: 'Alternative KPI Card visual'
    },
    'chart-fleet-velocity': {
        component: FleetVelocityWidget,
        defaultLayout: { w: 8, h: 10 },
        description: 'Area chart showing fleet throughput vs projection'
    },
    'funnel-widget': {
        component: FunnelWidget,
        defaultLayout: { w: 6, h: 8 },
        description: 'Visual sales funnel from Quote to Delivery'
    },
    'payments-widget': {
        component: PaymentsWidget,
        defaultLayout: { w: 6, h: 8 },
        description: 'Payments pulse and overdue summary'
    },
    'recent-activity': {
        component: RecentActivity,
        defaultLayout: { w: 6, h: 8 },
        description: 'List of recent system events'
    },
    'alerts-widget': {
        component: AlertsWidget,
        defaultLayout: { w: 4, h: 8 },
        description: 'Critical alerts and warnings list'
    },
    'vital-tile': {
        component: VitalTile,
        defaultProps: { label: 'Metric', value: '0', sub: 'Status', meta: 'Meta', color: 'indigo', icon: 'Activity' },
        defaultLayout: { w: 12, h: 2 },
        description: 'Single row system vital indicator'
    }
};

export const getWidgetComponent = (type: string) => {
    return WIDGET_REGISTRY[type]?.component || (() => <div className="p-4 bg-red-50 text-red-500 font-bold border border-red-200 rounded-lg">Widget Not Found: {type}</div>);
};
