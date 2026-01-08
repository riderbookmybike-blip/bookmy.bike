import React from 'react';
import {
    Building2,
    CheckCircle2,
    TrendingUp,
    Wallet,
    Package
} from 'lucide-react';
import { KpiCard, FunnelWidget, PaymentsWidget, RecentActivity, AlertsWidget } from './DashboardWidgets';

export default function DealerDashboard() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
                    <Building2 size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dealer Command Center</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time operational overview</p>
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard title="Total Bookings" value="128" sub="This Month" trend="up" icon={CheckCircle2} />
                <KpiCard title="Deliveries" value="42" sub="Pending PDI included" trend="up" icon={TrendingUp} />
                <KpiCard title="Receivables" value="₹ 24.5L" sub="Overdue over 30 Days: ₹2L" trend="down" icon={Wallet} />
                <KpiCard title="Inventory Value" value="₹ 1.8 Cr" sub="Healthy Mix" trend="neutral" icon={Package} />
            </div>

            {/* Row 2: Funnel & Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <FunnelWidget />
                </div>
                <div className="lg:col-span-1">
                    <PaymentsWidget />
                </div>
            </div>

            {/* Row 3: Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <RecentActivity />
                <AlertsWidget />
            </div>
        </div>
    );
}
