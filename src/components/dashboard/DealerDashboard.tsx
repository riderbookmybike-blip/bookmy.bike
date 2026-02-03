'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    LayoutDashboard,
    CheckCircle2,
    TrendingUp,
    Wallet,
    Package,
    Plus,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Clock,
    Activity,
    Users,
    ChevronRight,
    Target,
    Calendar,
    FileText,
    ShieldCheck,
    Landmark,
    ChevronDown
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { KpiCard, FunnelWidget, PaymentsWidget, RecentActivity, AlertsWidget } from './DashboardWidgets';
import { InventoryTable } from './InventoryTable';

const salesData = [
    { day: 'Mon', value: 4 },
    { day: 'Tue', value: 7 },
    { day: 'Wed', value: 5 },
    { day: 'Thu', value: 12 },
    { day: 'Fri', value: 8 },
    { day: 'Sat', value: 15 },
    { day: 'Sun', value: 10 },
];

export default function DealerDashboard({ tenant, role }: any) {
    const isManagement = ['OWNER', 'ADMIN', 'DEALERSHIP_ADMIN'].includes(role);
    const [period, setPeriod] = useState('Today');
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name = user.user_metadata?.full_name?.split(' ')[0] ||
                    user.user_metadata?.name?.split(' ')[0] ||
                    user.email?.split('@')[0] ||
                    'User';
                setDisplayName(name);
            }
        };
        fetchUser();
    }, []);

    const periodOptions = [
        'Today', 'Yesterday', 'This Week', 'Last Week',
        'MTD', 'Last Month', 'QTD', 'YTD', 'All Time'
    ];

    const displayTitle = displayName ? `${displayName}'S` : 'USER';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
            {/* Supercharged Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mt-4 italic uppercase scale-y-110 origin-left">
                        {displayTitle} <span className="text-indigo-600">Dashboard</span>
                    </h1>
                </div>

                <div className="relative group">
                    <button
                        onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                        className="flex items-center gap-3 bg-white dark:bg-white/5 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-indigo-500/30 transition-all active:scale-95"
                    >
                        <Calendar size={16} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">{period}</span>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isPeriodDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsPeriodDropdownOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl z-50 overflow-hidden p-1.5"
                                >
                                    {periodOptions.map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => {
                                                setPeriod(p);
                                                setIsPeriodDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-between group/item ${period === p
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {p}
                                            {period === p && <div className="w-1 h-1 rounded-full bg-indigo-600" />}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Industrial KPI Grid - 6 Column Protocol */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard
                    title="Leads"
                    value="482"
                    sub="86 New Today"
                    trend="up"
                    icon={Users}
                />
                <KpiCard
                    title="Quotes"
                    value="156"
                    sub="12 Waiting"
                    trend="up"
                    icon={FileText}
                />
                <KpiCard
                    title="Bookings"
                    value="42"
                    sub="₹ 1.8 Cr Booked"
                    trend="up"
                    icon={CheckCircle2}
                />
                <KpiCard
                    title="Insurance"
                    value="38"
                    sub="4 Pending"
                    trend="neutral"
                    icon={ShieldCheck}
                />
                <KpiCard
                    title="Registration"
                    value="24"
                    sub="In RTO Queue"
                    trend="down"
                    icon={Landmark}
                />
                <KpiCard
                    title="Delivery"
                    value="18"
                    sub="Ready for PDI"
                    trend="up"
                    icon={Package}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Analytics Block */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                    <Target size={18} className="text-indigo-600" />
                                    Sales Velocity
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Booking Volume</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <ArrowUpRight size={12} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-600">BEATING TARGET</span>
                            </div>
                        </div>

                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.1} />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                                        labelStyle={{ fontWeight: 900, marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#6366f1"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <InventoryTable />
                </div>

                {/* Tactical Sidebar */}
                <div className="space-y-6">
                    <FunnelWidget />
                    <PaymentsWidget />
                    <AlertsWidget />

                    {/* Goal Progress Widget */}
                    <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Activity size={16} />
                            Monthly Target
                        </h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black italic tracking-tighter">72%</span>
                            <span className="text-[10px] font-bold pb-2 opacity-60">ACHIEVED</span>
                        </div>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-6">
                            <div className="h-full bg-white rounded-full transition-all duration-1000 w-[72%]" />
                        </div>
                        <p className="text-xs font-bold leading-relaxed opacity-80">
                            12 deliveries pending in the next 48 hours to reach Tier 1 incentive.
                        </p>
                        <button className="mt-8 w-full py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                            View Roadmap
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <RecentActivity />
                </div>
            </div>
        </div>
    );
}
