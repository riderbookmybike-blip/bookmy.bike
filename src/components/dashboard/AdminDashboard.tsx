import React from 'react';
import {
    ShieldCheck,
    Building2,
    Landmark,
    CheckCircle2,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Activity,
    Database,
    Cpu,
    Zap,
    Users,
    ChevronRight,
    Plus,
    Flame
} from 'lucide-react';
import { KpiCard } from './DashboardWidgets';

export default function AdminDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Mesh Gradient Background Elements (Subtle) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Premium Header Container */}
            <div className="relative group">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/5 relative">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] shadow-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500">
                                <Activity size={32} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                    AUMS Enterprise v2.4
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live
                                </span>
                            </div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-400">Control</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 opacity-60">Global Platform Health & Fleet Intelligence</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm">
                            <Filter size={14} /> Filter View
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                            <Plus size={14} /> Add Resource
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Grid with Glassmorphism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Total Revenue', val: '₹ 1.42 Cr', sub: '+12.5% vs LW', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { title: 'Active Dealers', val: '542', sub: '24 pending', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { title: 'Fleet Volume', val: '12.8k', sub: 'Across 42 cities', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { title: 'System Security', val: 'A+', sub: '0 breaches', icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
                ].map((kpi, i) => (
                    <div key={i} className="group relative bg-white dark:bg-slate-950/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                                <kpi.icon size={20} strokeWidth={2.5} />
                            </div>
                            <div className="text-[10px] font-black text-emerald-500 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-lg uppercase">
                                <ArrowUpRight size={12} /> {kpi.sub.split(' ')[0]}
                            </div>
                        </div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.title}</h3>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{kpi.val}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 opacity-60 uppercase">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main Visuals: Big Chart + Stats Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Visual Chart Panel */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-950/60 backdrop-blur-2xl rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden group/chart">
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Fleet Velocity</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time throughput metrics</p>
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
                            {['1H', '1D', '1W', '1M'].map(t => (
                                <button key={t} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${t === '1D' ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Highly Visual Bars */}
                    <div className="h-80 w-full flex items-end justify-between gap-1.5 px-8 pb-8 pt-12 relative">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-x-8 inset-y-8 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                            {[1, 2, 3, 4, 5].map(l => <div key={l} className="h-px bg-slate-900 dark:bg-white w-full" />)}
                        </div>

                        {[30, 45, 35, 60, 85, 70, 50, 40, 65, 80, 55, 95, 70, 50, 45, 75, 90, 60, 40, 55, 70, 85, 95, 100].map((h, i) => (
                            <div key={i} className="flex-1 group/bar relative h-full flex items-end">
                                <div
                                    className={`w-full rounded-t-xl transition-all duration-1000 ease-out group-hover/bar:brightness-125 cursor-crosshair relative
                                        ${i % 4 === 0 ? 'bg-gradient-to-t from-blue-600 to-indigo-400' : 'bg-slate-100 dark:bg-white/5'}
                                    `}
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-2 opacity-0 group-hover/bar:opacity-100 transition-all">
                                        <div className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-2xl whitespace-nowrap">
                                            {h * 20} UNITs
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Legend */}
                    <div className="px-8 py-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Growth Units</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Baseline Fleet</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <ArrowUpRight size={12} className="text-emerald-500" />
                            Peak efficiency reached at <span className="text-slate-900 dark:text-white font-black">14:00 IST</span>
                        </p>
                    </div>
                </div>

                {/* Right Panel: Vital Monitoring */}
                <div className="lg:col-span-4 space-y-6">
                    {/* System Health Module */}
                    <div className="bg-white dark:bg-slate-950/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck size={80} />
                        </div>

                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 italic uppercase tracking-tighter flex items-center gap-2">
                            <Flame size={18} className="text-orange-500" /> Platform Vitals
                        </h3>

                        <div className="space-y-8">
                            {[
                                { label: 'Node Compute', val: 14, color: 'bg-blue-600', sub: 'Idle' },
                                { label: 'Query Latency', val: 82, color: 'bg-indigo-500', sub: 'Optimized' },
                                { label: 'Auth Throughput', val: 42, color: 'bg-emerald-500', sub: 'Stable' },
                            ].map(vital => (
                                <div key={vital.label} className="group/vital">
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{vital.label}</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{vital.sub}</p>
                                        </div>
                                        <p className="text-lg font-black text-blue-600 dark:text-blue-400">{vital.val}%</p>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${vital.color} rounded-full transition-all duration-[1.5s] ease-out group-hover/vital:opacity-80`}
                                            style={{ width: `${vital.val}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <Database size={20} />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Database Shard</h4>
                                <p className="text-[10px] font-bold text-slate-500">Node cluster is operational</p>
                            </div>
                        </div>
                    </div>

                    {/* Mini Quick Access */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-6 bg-slate-900 rounded-[2.5rem] text-white hover:bg-slate-800 transition-all shadow-xl group/btn">
                            <Users size={20} className="mb-3 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Manage</p>
                            <p className="text-xs font-bold opacity-60 italic">Users</p>
                        </button>
                        <button className="p-6 bg-indigo-600 rounded-[2.5rem] text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/10 group/btn">
                            <Zap size={20} className="mb-3 text-blue-200 group-hover/btn:scale-110 transition-transform" />
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Trigger</p>
                            <p className="text-xs font-bold opacity-60 italic">Reports</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Recent Activity feed */}
            <div className="bg-white dark:bg-slate-950/40 backdrop-blur-xl rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">System Pulse</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live platform event stream</p>
                    </div>
                    <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                        View Audit Log <ChevronRight size={14} />
                    </button>
                </div>

                <div className="space-y-1">
                    {[
                        { event: 'Tenant Created', target: 'Apex Motors, Mumbai', time: '2m ago', type: 'info' },
                        { event: 'Catalog Sync', target: 'TVS Global Master', time: '14m ago', type: 'success' },
                        { event: 'Security Prompt', target: 'Failed Login (JP Nagar, BLR)', time: '41m ago', type: 'warning' },
                        { event: 'Finance Approval', target: 'HDFC x Rider #429', time: '1h ago', type: 'success' }
                    ].map((entry, idx) => (
                        <div key={idx} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-default border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                            <div className="flex items-center gap-6">
                                <div className={`w-2 h-2 rounded-full ${entry.type === 'success' ? 'bg-emerald-500' :
                                        entry.type === 'warning' ? 'bg-rose-500' : 'bg-blue-500'
                                    } shadow-[0_0_10px_currentColor] animate-pulse`} />
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase italic tracking-tight">{entry.event}</p>
                                    <p className="text-[11px] font-bold text-slate-400">{entry.target}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.time}</span>
                                <div className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-600 transition-all">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
