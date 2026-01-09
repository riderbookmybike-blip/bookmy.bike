'use client';

import React from 'react';
import {
    LayoutDashboard,
    Users,
    Landmark,
    Shield,
    ArrowUpRight,
    ArrowDownRight,
    Database,
    Zap,
    Activity,
    Server,
    Filter,
    Plus,
    BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Corporate Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">AUMS Enterprise v2.4</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-4">
                        Platform <span className="text-blue-600">Overview</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                        Monitor global fleet operations and system health across the BookMyBike network.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
                        <Filter size={14} />
                        Filter View
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-lg shadow-slate-200 dark:shadow-blue-900/20">
                        <Plus size={14} />
                        Add Partner
                    </button>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Revenue"
                    value="₹1.42 Cr"
                    trend="+12.5%"
                    isUp={true}
                    icon={Landmark}
                    color="blue"
                />
                <MetricCard
                    title="Active Dealers"
                    value="542"
                    trend="+24"
                    isUp={true}
                    icon={Users}
                    color="indigo"
                />
                <MetricCard
                    title="Fleet Volume"
                    value="12.8k"
                    trend="Across regions"
                    isUp={true}
                    icon={Zap}
                    color="amber"
                />
                <MetricCard
                    title="Platform Security"
                    value="A+"
                    trend="0 Breaches"
                    isUp={true}
                    icon={Shield}
                    color="emerald"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Performance Chart Area */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <BarChart3 size={18} className="text-blue-600" />
                                Fleet Velocity
                            </h3>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">Daily unit throughput across all active nodes</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                            {['1D', '1W', '1M'].map(t => (
                                <button key={t} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${t === '1D' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Modern Clean Bar Chart */}
                    <div className="h-[280px] flex items-end justify-between gap-3 px-2 pt-10">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 50].map((h, i) => (
                            <div key={i} className="group relative flex-1">
                                <div
                                    className={`w-full rounded-t-lg transition-all duration-500 ease-out group-hover:opacity-80 ${i === 9 ? 'bg-blue-600' : 'bg-slate-100 dark:bg-white/5'}`}
                                    style={{ height: `${h}%` }}
                                />
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400 opacity-60">
                                    {i + 1}h
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-100 dark:border-white/5 pt-6">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600" /> Actual
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" /> Projected
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-500 font-bold">
                            Peak efficiency reached at 14:00
                        </div>
                    </div>
                </div>

                {/* Sub-Metrics Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Database size={18} className="text-blue-600" /> Platform Vitals
                            </h3>
                            <Activity size={16} className="text-emerald-500" />
                        </div>

                        <div className="space-y-8">
                            <VitalRow label="Database Sync" value="99.9%" status="Healthy" progress={99} />
                            <VitalRow label="API Response" value="142ms" status="Optimal" progress={85} />
                            <VitalRow label="Security Mesh" value="Active" status="SECURE" progress={100} />
                        </div>

                        <div className="mt-10 p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-sm">
                                    <Server size={20} className="text-slate-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Node</div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">Mumbai East Cluster</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const MetricCard = ({ title, value, trend, isUp, icon: Icon, color }: any) => {
    const colorClasses: any = {
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
        indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
        amber: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
        emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${colorClasses[color]} transition-transform duration-300 group-hover:scale-105`}>
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend}
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
            </div>
            <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
            </div>
        </div>
    );
};

const VitalRow = ({ label, value, status, progress }: any) => (
    <div className="space-y-3">
        <div className="flex justify-between items-end">
            <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{value}</div>
            </div>
            <div className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${status === 'Healthy' || status === 'Optimal' || status === 'SECURE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {status}
            </div>
        </div>
        <div className="h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
            />
        </div>
    </div>
);
