'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getMemberAnalytics, getMemberSummaryForTenant } from '@/actions/members';
import { createClient } from '@/lib/supabase/client';
import {
    Plus,
    Activity,
    TrendingUp,
    RefreshCw,
    List,
    LayoutGrid
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import { motion } from 'framer-motion';

export default function MembersDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const { tenantId } = useTenant();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const [analytics, setAnalytics] = useState<any[]>([]);
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | '3m' | '12m'>('7d');
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [totalMembers, setTotalMembers] = useState(0);
    const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [isDark, setIsDark] = useState(true);

    // Advanced Analytics State
    const [conversionData, setConversionData] = useState({
        avgLeads: 0,
        avgQuotes: 0,
        avgBookings: 0,
        totalLeads: 0,
        totalQuotes: 0,
        totalBookings: 0
    });
    const [topRtoData, setTopRtoData] = useState<{ rto: string; count: number }[]>([]);
    const [topDistrictData, setTopDistrictData] = useState<{ district: string; count: number }[]>([]);

    useEffect(() => {
        const root = document.documentElement;
        const syncTheme = () => setIsDark(root.classList.contains('dark'));
        syncTheme();
        const observer = new MutationObserver(syncTheme);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Force AUMS Tenant ID if slug is 'aums'
    const targetTenantId = (slug && slug.toLowerCase() === 'aums')
        ? 'f3e6e266-3ca5-4c67-91ce-b7cc98e30ee5'
        : tenantId;

    // Presence Sync
    useEffect(() => {
        if (!targetTenantId) return;

        const channel = supabase.channel(`members_presence_${targetTenantId}`, {
            config: {
                presence: {
                    key: 'user_id',
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const userIds = new Set<string>();
                Object.values(newState).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.user_id) userIds.add(p.user_id);
                    });
                });
                setOnlineUsers(userIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
                    }
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [targetTenantId, supabase]);

    // Initial Fetch & Analytics
    useEffect(() => {
        if (!targetTenantId) return;

        Promise.all([
            getMemberAnalytics(targetTenantId, timeframe),
            getMemberSummaryForTenant(targetTenantId)
        ]).then(([analyticsData, summary]) => {
            setAnalytics(analyticsData);
            setTotalMembers(summary?.length || 0);

            let totalLeads = 0;
            let totalQuotes = 0;
            let totalBookings = 0;
            const rtoCounts: Record<string, number> = {};
            const districtCounts: Record<string, number> = {};
            const statusCounts: Record<string, number> = {
                ACTIVE: 0,
                INACTIVE: 0,
                BANNED: 0,
                OTHER: 0
            };

            (summary || []).forEach((member) => {
                // Status
                const status = (member.member_status || 'ACTIVE').toUpperCase();
                if (statusCounts[status] !== undefined) statusCounts[status] += 1;
                else statusCounts.OTHER += 1;

                // Metrics
                totalLeads += member.leads_count || 0;
                totalQuotes += member.quotes_count || 0;
                totalBookings += member.bookings_count || 0;

                // RTO
                if (member.rto) {
                    const rto = member.rto.toUpperCase();
                    rtoCounts[rto] = (rtoCounts[rto] || 0) + 1;
                }

                // District
                if (member.district) {
                    const dist = member.district;
                    districtCounts[dist] = (districtCounts[dist] || 0) + 1;
                }
            });

            // Set Derived State
            const memberCount = summary.length || 1; // Prevent div by zero
            setConversionData({
                avgLeads: parseFloat((totalLeads / memberCount).toFixed(2)),
                avgQuotes: parseFloat((totalQuotes / memberCount).toFixed(2)),
                avgBookings: parseFloat((totalBookings / memberCount).toFixed(2)),
                totalLeads,
                totalQuotes,
                totalBookings
            });

            setTopRtoData(
                Object.entries(rtoCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([rto, count]) => ({ rto, count }))
            );

            setTopDistrictData(
                Object.entries(districtCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([district, count]) => ({ district, count }))
            );

            setStatusData([
                { name: 'Active', value: statusCounts.ACTIVE, color: '#10b981' },
                { name: 'Inactive', value: statusCounts.INACTIVE, color: '#f59e0b' },
                { name: 'Banned', value: statusCounts.BANNED, color: '#f43f5e' },
                { name: 'Other', value: statusCounts.OTHER, color: '#94a3b8' },
            ]);
        });
    }, [targetTenantId, timeframe]);

    const chartAxisColor = isDark ? '#94a3b8' : '#64748b';
    const chartGridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.08)';
    const tooltipStyle = isDark
        ? { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '10px' }
        : { backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.12)', borderRadius: '12px', color: '#0f172a', fontSize: '10px' };
    const tooltipLabelStyle = isDark
        ? { color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }
        : { color: '#64748b', fontSize: '10px', fontWeight: 'bold' };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 text-slate-900 dark:bg-[#0b0d10] dark:text-white overflow-hidden font-sans selection:bg-[#F4B000]/30">
            {/* Command Bar */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-[#0b0d10]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                        <Activity size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">Command Center</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">{onlineUsers.size} Live Agents</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 dark:bg-white/5 dark:border-white/5">
                        {['7d', '30d', '3m', '12m'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t as any)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2" />
                    <button
                        onClick={() => router.push(`/app/${slug}/members/list`)}
                        className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:bg-white/5 dark:border-white/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-all"
                        title="List View"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => router.push(`/app/${slug}/members/new`)}
                        className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                        title="New Entry"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Bento Grid Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-12 gap-6 max-w-[1920px] mx-auto">

                    {/* Hero Metric: Total Members */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white border border-slate-200/70 dark:bg-[#13151a] dark:border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity size={80} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Registry</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{totalMembers.toLocaleString()}</h2>
                        </div>
                        <div className="mt-6 h-12 w-full opacity-50">
                            {/* Micro-sparkline */}
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics}>
                                    <defs>
                                        <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="new" stroke="#6366f1" strokeWidth={2} fill="url(#miniGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Efficiency Score */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white border border-slate-200/70 dark:bg-[#13151a] dark:border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Conversion Efficiency</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{(conversionData.avgLeads * 100).toFixed(1)}%</h2>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Lead Rate</span>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <div className="bg-slate-100 rounded-lg p-2 dark:bg-white/5">
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Quotes</p>
                                <p className="text-lg font-bold text-amber-400">{conversionData.avgQuotes}</p>
                            </div>
                            <div className="bg-slate-100 rounded-lg p-2 dark:bg-white/5">
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Bookings</p>
                                <p className="text-lg font-bold text-emerald-400">{conversionData.avgBookings}</p>
                            </div>
                        </div>
                    </div>

                    {/* Funnel Visualization */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white border border-slate-200/70 dark:bg-[#13151a] dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Funnel Health</p>
                            <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400">Live</div>
                        </div>
                        <div className="space-y-3">
                            <div className="relative h-2 bg-slate-200/70 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-slate-600 w-full" />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                                <span>Total</span>
                                <span>{totalMembers}</span>
                            </div>

                            <div className="relative h-2 bg-slate-200/70 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-indigo-500" style={{ width: `${Math.min((conversionData.totalLeads / (totalMembers || 1)) * 100, 100)}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-indigo-400 uppercase font-bold">
                                <span>Leads</span>
                                <span>{conversionData.totalLeads}</span>
                            </div>

                            <div className="relative h-2 bg-slate-200/70 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-amber-500" style={{ width: `${Math.min((conversionData.totalQuotes / (totalMembers || 1)) * 100, 100)}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-amber-400 uppercase font-bold">
                                <span>Quotes</span>
                                <span>{conversionData.totalQuotes}</span>
                            </div>

                            <div className="relative h-2 bg-slate-200/70 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-emerald-500" style={{ width: `${Math.min((conversionData.totalBookings / (totalMembers || 1)) * 100, 100)}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-emerald-400 uppercase font-bold">
                                <span>Bookings</span>
                                <span>{conversionData.totalBookings}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Breakdown (Donut) */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white border border-slate-200/70 dark:bg-[#13151a] dark:border-white/5 rounded-3xl p-6 relative">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Registry Composition</p>
                        <div className="h-32 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={55}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ ...tooltipStyle, borderRadius: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="text-xl font-black text-slate-900 dark:text-white">{statusData[0]?.value || 0}</span>
                                <p className="text-[8px] uppercase tracking-widest text-slate-500">Active</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Chart: Velocity (Big Area Chart) */}
                    <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200/70 dark:bg-[#13151a] dark:border-white/5 rounded-3xl p-6 min-h-[300px]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registry Velocity</h3>
                                <p className="text-xs text-slate-500">Acquisition trend over selected period</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                                    <TrendingUp size={12} />
                                    Growth Phase
                                </span>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics}>
                                    <defs>
                                        <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: chartAxisColor, fontSize: 10, fontWeight: '700' }} tickFormatter={(val) => val.slice(8)} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: chartAxisColor, fontSize: 10, fontWeight: '700' }} />
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        labelStyle={tooltipLabelStyle}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="new"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fill="url(#velocityGradient)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: isDark ? '#fff' : '#0f172a' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top RTOs (List/Bar Hybrid) */}
                    <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200/70 dark:bg-[#13151a] dark:border-white/5 rounded-3xl p-6 overflow-hidden flex flex-col">
                        <div className="mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Geo Intelligence</p>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Distributions</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {topRtoData.map((item, idx) => (
                                <div key={item.rto} className="group cursor-default">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{idx + 1}. {item.rto}</span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-200/70 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 group-hover:bg-purple-400 transition-colors rounded-full"
                                            style={{ width: `${(item.count / (topRtoData[0]?.count || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {topRtoData.length === 0 && (
                                <div className="text-center py-10 text-slate-500 text-xs italic">
                                    No location data available
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
