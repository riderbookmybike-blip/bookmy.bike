'use client';

import React from 'react';
import {
    ShoppingBag,
    Users,
    TrendingUp,
    Store,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Package,
    MousePointer2,
    Clock,
    BarChart3
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

const conversionData = [
    { name: 'Mon', views: 4000, orders: 240 },
    { name: 'Tue', views: 3000, orders: 139 },
    { name: 'Wed', views: 2000, orders: 980 },
    { name: 'Thu', views: 2780, orders: 390 },
    { name: 'Fri', views: 1890, orders: 480 },
    { name: 'Sat', views: 2390, orders: 380 },
    { name: 'Sun', views: 3490, orders: 430 },
];

const topVehicles = [
    { name: 'Electric Scooter X1', sales: 45, color: '#6366f1' },
    { name: 'Commuter 150cc', sales: 32, color: '#818cf8' },
    { name: 'Adventure ADV', sales: 28, color: '#a5b4fc' },
    { name: 'Retro Classic', sales: 24, color: '#c7d2fe' },
];

export default function MarketplaceDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 rounded-lg w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-pink-700 dark:text-pink-400">Marketplace Operations</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-4 italic">
                        Storefront <span className="text-pink-600">Analytics</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-xl">
                        Track consumer engagement, catalog conversion, and digital store performance.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
                        <Store size={14} />
                        Live Storefront
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-black hover:bg-slate-800 transition-all shadow-xl">
                        <Search size={14} />
                        Explore Catalog
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MarketMetric
                    title="Engaged Users"
                    value="42,850"
                    delta="+18%"
                    icon={Users}
                    color="pink"
                />
                <MarketMetric
                    title="Catalog Conversions"
                    value="3.2%"
                    delta="+0.8%"
                    icon={TrendingUp}
                    color="indigo"
                />
                <MarketMetric
                    title="Active Listings"
                    value="124"
                    delta="Normal"
                    icon={Package}
                    color="slate"
                />
                <MarketMetric
                    title="Avg Session"
                    value="4m 12s"
                    delta="+42s"
                    icon={Clock}
                    color="blue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic vs Orders */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tighter">
                                <MousePointer2 size={20} className="text-pink-600" />
                                CONVERSION FUNNEL
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Daily Views vs Placed Orders</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={conversionData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                                    itemStyle={{ fontWeight: 800 }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#6366f1" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
                                <Area type="monotone" dataKey="orders" stroke="#ec4899" fill="transparent" strokeWidth={3} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Selling Vehicles */}
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 tracking-tighter italic">TOP CATALOG ITEMS</h3>
                    <div className="space-y-6">
                        {topVehicles.map(v => (
                            <div key={v.name} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{v.name}</span>
                                    <span className="text-xs font-black text-indigo-600">{v.sales} sales</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${(v.sales / 50) * 100}%`, backgroundColor: v.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-10 py-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-500 transition-all">
                        Analyze Full Catalog
                    </button>
                </div>
            </div>
        </div>
    );
}

const MarketMetric = ({ title, value, delta, icon: Icon, color }: any) => {
    const colorClasses: any = {
        pink: 'text-pink-600 bg-pink-50 dark:bg-pink-500/10',
        indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
        slate: 'text-slate-600 bg-slate-50 dark:bg-slate-400/10',
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
    };

    return (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all group">
            <div className="flex justify-between items-center mb-4">
                <div className={`p-2.5 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
                    <Icon size={18} />
                </div>
                <div className="text-[10px] font-black text-emerald-500">{delta}</div>
            </div>
            <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
            </div>
        </div>
    );
};
