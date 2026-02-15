'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getDealerDashboardKpis, type DashboardKpis } from '@/actions/dashboardKpis';
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
    ChevronDown,
    Loader2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
    const [kpis, setKpis] = useState<DashboardKpis | null>(null);
    const [kpiLoading, setKpiLoading] = useState(true);
    const { device } = useBreakpoint();
    const { tenantId, tenantSlug } = useTenant();
    const isPhone = device === 'phone';

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                const name =
                    user.user_metadata?.full_name?.split(' ')[0] ||
                    user.user_metadata?.name?.split(' ')[0] ||
                    user.email?.split('@')[0] ||
                    'User';
                setDisplayName(name);
            }
        };
        fetchUser();
    }, []);

    // Fetch live KPIs
    useEffect(() => {
        if (!tenantId) return;
        setKpiLoading(true);
        getDealerDashboardKpis(tenantId)
            .then(data => setKpis(data))
            .catch(console.error)
            .finally(() => setKpiLoading(false));
    }, [tenantId]);

    // Format currency
    const formatValue = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
        return `₹${val}`;
    };

    const periodOptions = [
        'Today',
        'Yesterday',
        'This Week',
        'Last Week',
        'MTD',
        'Last Month',
        'QTD',
        'YTD',
        'All Time',
    ];

    const displayTitle = displayName ? `${displayName}'S` : 'USER';

    // ── PHONE DASHBOARD ──────────────────────────────────────────────
    if (isPhone) {
        const resolveHref = (path: string) => (tenantSlug ? `/app/${tenantSlug}${path}` : path);
        return (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Greeting */}
                <div className="pt-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                        Welcome back
                    </p>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white italic uppercase">
                        {displayName || 'User'} <span className="text-indigo-600">↗</span>
                    </h1>
                </div>

                {/* KPI Grid — 2 cols on phone */}
                {kpiLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                label: 'Leads',
                                value: String(kpis?.leads.total || 0),
                                sub: `${kpis?.leads.newToday || 0} new`,
                                color: 'indigo',
                            },
                            {
                                label: 'Quotes',
                                value: String(kpis?.quotes.total || 0),
                                sub: `${kpis?.quotes.pending || 0} waiting`,
                                color: 'violet',
                            },
                            {
                                label: 'Bookings',
                                value: String(kpis?.bookings.total || 0),
                                sub: kpis?.bookings.value ? formatValue(kpis.bookings.value) : '₹0',
                                color: 'emerald',
                            },
                            {
                                label: 'Delivery',
                                value: String(kpis?.deliveries.total || 0),
                                sub: `${kpis?.deliveries.pdiReady || 0} PDI ready`,
                                color: 'amber',
                            },
                        ].map(kpi => (
                            <div
                                key={kpi.label}
                                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-1.5"
                            >
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                    {kpi.label}
                                </p>
                                <p className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                                    {kpi.value}
                                </p>
                                <p className={`text-[9px] font-bold text-${kpi.color}-500 uppercase tracking-wider`}>
                                    {kpi.sub}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Ignition / Quick Start
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'New Lead', icon: Users, href: '/leads', color: 'indigo', pulse: true },
                            { label: 'Follow Up', icon: Clock, href: '/leads', color: 'amber', pulse: false },
                            { label: 'Quotes', icon: FileText, href: '/quotes', color: 'emerald', pulse: false },
                        ].map(action => (
                            <Link
                                key={action.label}
                                href={resolveHref(action.href)}
                                className={`
                                    flex flex-col items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 active:scale-95 transition-all
                                    ${action.pulse ? 'ignite-pulse border-amber-500/50' : ''}
                                `}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl bg-${action.color}-500/10 flex items-center justify-center border border-${action.color}-500/20`}
                                >
                                    <action.icon size={18} className={`text-${action.color}-500`} />
                                </div>
                                <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center">
                                    {action.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Target Progress */}
                <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Activity size={14} /> Monthly Target
                        </span>
                        <span className="text-xs font-black">72%</span>
                    </div>
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-white rounded-full w-[72%]" />
                    </div>
                    <p className="text-[10px] font-bold opacity-80 leading-relaxed">
                        12 deliveries to Tier 1 incentive
                    </p>
                </div>

                {/* Today&apos;s Feed */}
                <div className="space-y-2">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Today</h2>
                    {[
                        { text: '3 leads need follow-up', time: '2h ago', dot: 'bg-amber-500' },
                        { text: 'Quote #Q-0045 approved', time: '4h ago', dot: 'bg-emerald-500' },
                        { text: 'New lead from website', time: '5h ago', dot: 'bg-indigo-500' },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3"
                        >
                            <div className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex-1">
                                {item.text}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 shrink-0">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── DESKTOP DASHBOARD (unchanged) ────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black/95">
            {/* Supercharged Header with Carbon Detail */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/5 pt-12 pb-10 px-6 md:px-12">
                <div className="absolute inset-0 carbon-pattern opacity-[0.03] dark:opacity-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-600/5 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-indigo-600/10 text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-indigo-500/20">
                                Live Telemetry
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white racing-italic uppercase">
                            {displayTitle} <span className="text-indigo-600">MISSION</span> CONTROL
                        </h1>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
                            System Status: <span className="text-emerald-500">OPTIMAL</span> // Engine:{' '}
                            <span className="text-indigo-500">STABLE</span>
                        </p>
                    </div>

                    <div className="relative group">
                        <button
                            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                            className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 shadow-xl hover:border-indigo-500/40 transition-all active:scale-95 neon-border-indigo"
                        >
                            <Calendar size={18} className="text-indigo-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                                {period}
                            </span>
                            <ChevronDown
                                size={16}
                                className={`text-slate-400 transition-transform duration-300 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        <AnimatePresence>
                            {isPeriodDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsPeriodDropdownOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-white/10 shadow-2xl z-50 overflow-hidden p-2"
                                    >
                                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Select Timeline
                                        </div>
                                        {periodOptions.map(p => (
                                            <button
                                                key={p}
                                                onClick={() => {
                                                    setPeriod(p);
                                                    setIsPeriodDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-between group/item ${
                                                    period === p
                                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                                                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {p}
                                                {period === p && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-12 pb-12 space-y-12">
                {/* Industrial KPI Grid - 6 Column Protocol */}
                {kpiLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <KpiCard
                            title="Leads"
                            value={String(kpis?.leads.total || 0)}
                            sub={`${kpis?.leads.newToday || 0} New Today`}
                            trend="up"
                            icon={Users}
                        />
                        <KpiCard
                            title="Quotes"
                            value={String(kpis?.quotes.total || 0)}
                            sub={`${kpis?.quotes.pending || 0} Waiting`}
                            trend="up"
                            icon={FileText}
                        />
                        <KpiCard
                            title="Bookings"
                            value={String(kpis?.bookings.total || 0)}
                            sub={kpis?.bookings.value ? formatValue(kpis.bookings.value) + ' Booked' : '₹0'}
                            trend="up"
                            icon={CheckCircle2}
                        />
                        <KpiCard
                            title="Insurance"
                            value={String(kpis?.insurance.total || 0)}
                            sub={`${kpis?.insurance.pending || 0} Pending`}
                            trend="neutral"
                            icon={ShieldCheck}
                        />
                        <KpiCard
                            title="Receipts"
                            value={String(kpis?.receipts.total || 0)}
                            sub={`${kpis?.receipts.todayValue || 0} Today`}
                            trend="up"
                            icon={Landmark}
                        />
                        <KpiCard
                            title="Delivery"
                            value={String(kpis?.deliveries.total || 0)}
                            sub={`${kpis?.deliveries.pdiReady || 0} PDI Ready`}
                            trend="up"
                            icon={Package}
                        />
                    </div>
                )}

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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Daily Booking Volume
                                    </p>
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
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#64748b"
                                            strokeOpacity={0.1}
                                        />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: 'none',
                                                borderRadius: '12px',
                                                color: '#fff',
                                            }}
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
        </div>
    );
}
