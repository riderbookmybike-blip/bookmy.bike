import React from 'react';
import {
    Building2,
    CheckCircle2,
    TrendingUp,
    Wallet,
    Package
} from 'lucide-react';
import { KpiCard, FunnelWidget, PaymentsWidget, RecentActivity, AlertsWidget } from './DashboardWidgets';
import { InventoryTable } from './InventoryTable';

export default function DealerDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Partner Node: ACTIVE</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-4 italic">
                        Dealer <span className="text-indigo-600 uppercase">Command</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-xl">
                        Monitor local sales performance, delivery funnels, and inventory health.
                    </p>
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard title="Total Bookings" value="128" sub="This Month" trend="up" icon={CheckCircle2} />
                <KpiCard title="Deliveries" value="42" sub="Pending PDI included" trend="up" icon={TrendingUp} />
                <KpiCard title="Receivables" value="₹ 24.5L" sub="Overdue over 30 Days: ₹2L" trend="down" icon={Wallet} />
                <KpiCard title="Inventory Value" value="₹ 1.8 Cr" sub="Healthy Mix" trend="neutral" icon={Package} />
            </div>

            {/* Inventory Table Section */}
            <div>
                <InventoryTable />
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
