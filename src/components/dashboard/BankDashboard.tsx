import React from 'react';
import {
    Landmark,
    Users,
    Clock,
    Wallet,
    FileText
} from 'lucide-react';
import { KpiCard, RecentActivity } from './DashboardWidgets';

export default function BankDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-500/30">
                    <Landmark size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Finance Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Loan Processing & Disbursals</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <KpiCard title="New Applications" value="85" sub="Across 12 Dealerships" trend="up" icon={Users} />
                <KpiCard title="Pending Approval" value="22" sub="Action Required" trend="down" icon={Clock} />
                <KpiCard title="Disbursed MTD" value="₹ 4.5 Cr" sub="+8% vs Target" trend="up" icon={Wallet} />
                <KpiCard title="Active Schemes" value="06" sub="ROI 12.5%" trend="neutral" icon={FileText} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RecentActivity />
            </div>
        </div>
    );
}
