'use client';

import React, { useState } from 'react';
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
    BarChart3,
    TrendingUp,
    Clock,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { FilterDrawer } from './FilterDrawer';
import { KPICard } from './KPICard';
import { VitalTile } from './VitalTile';

const fleetData = [
    { time: '00:00', value: 400, projection: 420 },
    { time: '02:00', value: 300, projection: 350 },
    { time: '04:00', value: 200, projection: 220 },
    { time: '06:00', value: 500, projection: 480 },
    { time: '08:00', value: 900, projection: 850 },
    { time: '10:00', value: 1100, projection: 1000 },
    { time: '12:00', value: 1400, projection: 1300 },
    { time: '14:00', value: 1600, projection: 1550 },
    { time: '16:00', value: 1500, projection: 1600 },
    { time: '18:00', value: 1200, projection: 1100 },
    { time: '20:00', value: 800, projection: 850 },
    { time: '22:00', value: 600, projection: 550 },
];

const sparkData = [
    { v: 40 }, { v: 65 }, { v: 45 }, { v: 80 }, { v: 55 }, { v: 90 }, { v: 70 }
];

export default function AdminDashboard() {
    const [range, setRange] = useState('1D');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
            {/* Corporate Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">AUMS Enterprise Command v2.4</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-4">
                        Platform <span className="text-indigo-600">Overview</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-xl">
                        Monitor partners, fleet throughput, and system health across regions.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl mr-4 border border-slate-200 dark:border-white/10 shadow-inner">
                        {['1D', '1W', '1M'].map(t => (
                            <button
                                key={t}
                                onClick={() => setRange(t)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${range === t ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
                    >
                        <Filter size={14} />
                        Filter View
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
                        <Plus size={14} />
                        Add Partner
                    </button>
                </div>
            </div>

            {/* Premium Enterprise KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Gross Revenue"
                    value="₹1.42 Cr"
                    delta="+12.5%"
                    isUp={true}
                    icon={Landmark}
                    sub="vs last 30 days"
                />
                <KPICard
                    title="Active Dealers"
                    value="542"
                    delta="+24"
                    isUp={true}
                    icon={Users}
                    sub="+8.2% Growth"
                />
                <KPICard
                    title="Fleet Volume"
                    value="12,840"
                    delta="-2.1%"
                    isUp={false}
                    icon={Zap}
                    sub="Active Vehicles"
                />
                <KPICard
                    title="Service SLAs"
                    value="99.2%"
                    delta="Optimal"
                    isUp={true}
                    icon={Activity}
                    sub="System Health"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Flagship Fleet Velocity Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-950/40 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 italic tracking-tighter">
                                <TrendingUp size={20} className="text-indigo-600" />
                                FLEET VELOCITY
                            </h3>
                            <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Unit Throughput Analysis</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                <span className="w-2 h-2 rounded-full bg-indigo-600" /> Real-time
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" /> Projected
                            </div>
                        </div>
                    </div>

                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={fleetData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                                <XAxis
                                    dataKey="time"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900 dark:bg-white px-4 py-3 rounded-xl shadow-2xl border border-white/10">
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Throughput @ {payload[0].payload.time}</p>
                                                    <p className="text-lg font-black text-white dark:text-slate-900">{payload[0].value} Units</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#gradientColor)"
                                    animationDuration={2000}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="projection"
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    fill="transparent"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-500 text-xs font-black">
                            <CheckCircle2 size={14} />
                            Peak efficiency reached at 14:00 (1,600 units/hr)
                        </div>
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View Detailed Node Report</button>
                    </div>
                </div>

                {/* Actionable Platform Vitals */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 italic tracking-tighter">
                                <Database size={20} className="text-indigo-600" /> VITALS
                            </h3>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-500 leading-none">HEALTHY</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <VitalTile
                                icon={TrendingUp}
                                label="DB Sync Efficiency"
                                value="99.99%"
                                sub="Healthy"
                                meta="Last sync 42s ago"
                                color="emerald"
                            />
                            <VitalTile
                                icon={Clock}
                                label="Avg API Latency"
                                value="142ms"
                                sub="Optimal"
                                meta="p95: 210ms"
                                color="blue"
                            />
                            <VitalTile
                                icon={AlertCircle}
                                label="Traffic Error Rate"
                                value="0.02%"
                                sub="Stable"
                                meta="12 incidents (24h)"
                                color="indigo"
                            />
                        </div>

                        <div className="mt-10 p-5 rounded-2xl bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm group-hover:scale-110 transition-transform">
                                        <Server size={24} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Node</div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">Mumbai East Cluster</div>
                                    </div>
                                </div>
                                <ArrowUpRight className="text-slate-300 group-hover:text-indigo-500" size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

