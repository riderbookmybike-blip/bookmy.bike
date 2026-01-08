import React from 'react';
import {
    ShieldCheck,
    Building2,
    Landmark,
    CheckCircle2,
    Wallet
} from 'lucide-react';
import { KpiCard } from './DashboardWidgets';

export default function AdminDashboard() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 border border-purple-500/10">
                    <ShieldCheck size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Super Admin</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Platform Health Monitor</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <KpiCard title="Total Tenants" value="42" sub="Dealerships" trend="up" icon={Building2} />
                <KpiCard title="Finance Partners" value="05" sub="Partners" trend="neutral" icon={Landmark} />
                <KpiCard title="System Uptime" value="99.99%" sub="Last 30 Days" trend="up" icon={CheckCircle2} />
                <KpiCard title="MRR" value="₹ 8.2 L" sub="Growing 5% MoM" trend="up" icon={Wallet} />
            </div>
        </div>
    );
}
