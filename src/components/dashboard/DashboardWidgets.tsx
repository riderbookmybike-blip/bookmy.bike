import React from 'react';
import {
    Users,
    FileText,
    CheckCircle,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Wallet,
    Package,
    Building2,
    Landmark,
    ShieldCheck,
    ArrowUpRight
} from 'lucide-react';

// --- SHARED WIDGETS ---

export const KpiCard = ({ title, value, sub, trend = 'neutral', icon: Icon }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group relative overflow-hidden active:scale-95 cursor-default">
        {/* Decorative Background Element */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl -z-0 group-hover:bg-indigo-500/20 group-hover:scale-150 transition-all duration-700" />

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 transition-all duration-500 border border-slate-100 dark:border-white/5 shadow-inner">
                    <Icon size={20} strokeWidth={2} />
                </div>
                {trend !== 'neutral' && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${trend === 'up'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/10'
                        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/10'
                        }`}>
                        {trend === 'up' ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                        {trend === 'up' ? '+12.5%' : '-4.2%'}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic scale-x-95 origin-left">
                    {value}
                </p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest pt-2 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                    {sub}
                </p>
            </div>
        </div>
    </div>
);

export const FunnelWidget = () => (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden relative group">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl -z-0 group-hover:scale-110 transition-transform duration-1000" />
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">Sales Funnel // Throughput</h3>
        <div className="flex items-center justify-between relative z-10 px-4">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-700 -z-10 transform -translate-y-1/2"></div>

            {[
                { label: 'Quotes', val: '142', color: 'bg-indigo-500' },
                { label: 'Orders', val: '86', color: 'bg-violet-500' },
                { label: 'Bookings', val: '64', color: 'bg-purple-500' },
                { label: 'Delivered', val: '41', color: 'bg-emerald-500' }
            ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center bg-white dark:bg-[#0b1224] px-3 transition-transform hover:scale-110 duration-300">
                    <div className={`w-14 h-14 rounded-2xl ${step.color} text-white flex items-center justify-center text-sm font-black shadow-lg mb-3 font-mono transform -rotate-3 hover:rotate-0 transition-transform`}>
                        {step.val}
                    </div>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{step.label}</span>
                </div>
            ))}
        </div>
    </div>
);

export const PaymentsWidget = () => (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm group">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Payments Pulse</h3>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner border border-slate-100 dark:border-white/5">
                <Wallet size={16} strokeWidth={2} />
            </div>
        </div>
        <div className="space-y-5">
            {[
                { label: 'Collected Today', val: '₹ 12,45,000', color: 'bg-emerald-500' },
                { label: 'Pending Invoices', val: '₹ 4,20,000', color: 'bg-amber-500' },
                { label: 'Overdue > 7 Days', val: '₹ 1,15,000', color: 'bg-rose-500' }
            ].map((p, i) => (
                <div key={i} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${p.color} animate-pulse`} />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{p.label}</span>
                    </div>
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white tracking-tighter italic">{p.val}</span>
                </div>
            ))}
        </div>
    </div>
);

export const RecentActivity = () => (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex justify-between items-center mb-10">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">System Activity Trace</h3>
            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Clear Logs</button>
        </div>
        <div className="space-y-6">
            {[
                { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'Booking confirmed for Mr. Sharma', id: 'BK-2025-001', time: '10m ago' },
                { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', text: 'Low stock warning: Honda Activa 6G', id: 'SKU-ACT6G-MG', time: '45m ago' },
                { icon: Wallet, color: 'text-indigo-500', bg: 'bg-indigo-500/10', text: 'Payment received ₹1,50,000', id: 'INV-889', time: '1h ago' },
                { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', text: 'Delivery scheduled for tomorrow', id: 'DEL-V02', time: '3h ago' },
            ].map((item, i) => (
                <div key={i} className="flex gap-5 items-start group/log">
                    <div className={`${item.bg} p-3 rounded-2xl shrink-0 group-hover/log:scale-110 transition-transform duration-500 border border-white/5`}>
                        <item.icon className={item.color} size={18} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-bold tracking-tight">{item.text}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] font-black font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10">{item.id}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.time}</span>
                        </div>
                    </div>
                    <ArrowUpRight className="text-slate-300 opacity-0 group-hover/log:opacity-100 transition-opacity" size={16} />
                </div>
            ))}
        </div>
    </div>
);

export const AlertsWidget = () => (
    <div className="bg-rose-500 p-8 rounded-[32px] text-white shadow-xl shadow-rose-500/20 relative overflow-hidden group">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
        <h3 className="text-[11px] font-black mb-6 flex items-center gap-2 uppercase tracking-[0.2em] relative z-10">
            <AlertCircle size={16} strokeWidth={3} className="animate-pulse" />
            Critical Intelligence
        </h3>
        <div className="space-y-4 relative z-10">
            {[
                { label: 'Pending PDI Checks', val: '5' },
                { label: 'Uninvoiced Deliveries', val: '2' }
            ].map((a, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex justify-between items-center group-hover:bg-white/20 transition-all cursor-pointer">
                    <span className="text-[10px] font-black uppercase tracking-widest">{a.label}</span>
                    <span className="text-xs font-black font-mono bg-white text-rose-600 px-2.5 py-1 rounded-lg shadow-lg">
                        {a.val}
                    </span>
                </div>
            ))}
        </div>
    </div>
);
