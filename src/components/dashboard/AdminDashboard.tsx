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
            {/* Header / Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                <KpiCard title="Total Tenants" value="42" sub="Dealerships" trend="up" icon={Building2} />
                <KpiCard title="Finance Partners" value="05" sub="Partners" trend="neutral" icon={Landmark} />
                <KpiCard title="System Uptime" value="99.99%" sub="Last 30 Days" trend="up" icon={CheckCircle2} />
                <KpiCard title="MRR" value="₹ 8.2 L" sub="Growing 5% MoM" trend="up" icon={Wallet} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Platform Activity</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requests per hour</p>
                        </div>
                        <select className="bg-slate-100 dark:bg-white/5 border-none text-xs font-bold rounded-lg px-3 py-1.5 outline-none hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                        </select>
                    </div>

                    {/* CSS Bar Chart Visualization */}
                    <div className="h-64 flex items-end justify-between gap-2 px-2">
                        {[40, 65, 45, 80, 55, 70, 40, 60, 75, 50, 85, 95, 60, 75, 45, 80, 65, 50, 70, 85, 40, 60, 80, 55].map((h, i) => (
                            <div key={i} className="w-full bg-slate-100 dark:bg-white/5 rounded-t-sm relative group/bar hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-crosshair">
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t-sm transition-all duration-500 group-hover/bar:bg-indigo-500"
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {h * 10} req
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Health / Usage Guages */}
                <div className="bg-white dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">System Health</h3>

                        <div className="space-y-6">
                            {[
                                { label: 'Database CPU', val: 24, color: 'bg-emerald-500' },
                                { label: 'Memory Usage', val: 56, color: 'bg-blue-500' },
                                { label: 'Storage', val: 82, color: 'bg-orange-500' },
                                { label: 'API Latency', val: 12, color: 'bg-emerald-500' }
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-500">{item.label}</span>
                                        <span className="text-slate-900 dark:text-white">{item.val}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                <ShieldCheck size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">All Systems Operational</h4>
                                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Last check: 42s ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
