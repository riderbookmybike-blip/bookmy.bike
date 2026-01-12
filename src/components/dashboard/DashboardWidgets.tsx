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
    ShieldCheck
} from 'lucide-react';

// --- SHARED WIDGETS ---

export const KpiCard = ({ title, value, sub, trend = 'neutral', icon: Icon }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl -z-0 group-hover:bg-indigo-500/15 transition-colors" />

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-500 border border-indigo-100 dark:border-indigo-500/10">
                    <Icon size={18} strokeWidth={1.5} />
                </div>
                {trend !== 'neutral' && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${trend === 'up'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/10'
                        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/10'
                        }`}>
                        {trend === 'up' ? '↑ 12%' : '↓ 5%'}
                    </span>
                )}
            </div>
            <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{title}</h3>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">{value}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 mt-2 uppercase tracking-wider">{sub}</p>
        </div>
    </div>
);

export const FunnelWidget = () => (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Sales Funnel</h3>
        <div className="flex items-center justify-between relative">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-700 -z-10 transform -translate-y-1/2"></div>

            {[
                { label: 'Quotes', val: '142', color: 'bg-indigo-500' },
                { label: 'Orders', val: '86', color: 'bg-violet-500' },
                { label: 'Bookings', val: '64', color: 'bg-purple-500' },
                { label: 'Delivered', val: '41', color: 'bg-emerald-500' }
            ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center bg-white dark:bg-slate-800/50 px-3">
                    <div className={`w-12 h-12 rounded-full ${step.color} text-white flex items-center justify-center text-sm font-bold shadow-lg mb-2 font-mono`}>
                        {step.val}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{step.label}</span>
                </div>
            ))}
        </div>
    </div>
);

export const PaymentsWidget = () => (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Payments Pulse</h3>
            <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Wallet size={16} className="text-slate-400" strokeWidth={1.5} />
            </div>
        </div>
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Collected (Today)</span>
                </div>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">₹ 12,45,000</span>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Pending Invoices</span>
                </div>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">₹ 4,20,000</span>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Overdue &gt; 7 Days</span>
                </div>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">₹ 1,15,000</span>
            </div>
        </div>
    </div>
);

export const RecentActivity = () => (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm col-span-1 lg:col-span-2">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Recent Activity</h3>
        <div className="space-y-5">
            {[
                { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'Booking confirmed for Mr. Sharma', id: 'BK-2025-001', time: '10 mins ago' },
                { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'Low stock warning: Honda Activa 6G', id: 'SKU-ACT6G-MG', time: '45 mins ago' },
                { icon: Wallet, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'Payment received ₹1,50,000', id: 'INV-889', time: '1 hour ago' },
            ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                    <div className={`${item.bg} p-2 rounded-lg shrink-0`}>
                        <item.icon className={item.color} size={16} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{item.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">{item.id}</span>
                            <span className="text-xs text-slate-400">{item.time}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const AlertsWidget = () => (
    <div className="bg-rose-50/50 dark:bg-rose-900/10 p-6 rounded-[32px] border border-rose-100 dark:border-rose-900/20 shadow-sm relative overflow-hidden">
        <h3 className="text-[11px] font-black text-rose-800 dark:text-rose-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <AlertCircle size={16} className="text-rose-600" strokeWidth={2.5} />
            Critical Intelligence
        </h3>
        <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-900/30 flex justify-between items-center group hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Pending PDI Checks</span>
                <span className="bg-rose-500 text-white text-[10px] font-black font-mono px-2.5 py-1 rounded-lg">5</span>
            </div>
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-900/30 flex justify-between items-center group hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Uninvoiced Deliveries</span>
                <span className="bg-rose-500 text-white text-[10px] font-black font-mono px-2.5 py-1 rounded-lg">2</span>
            </div>
        </div>
    </div>
);
