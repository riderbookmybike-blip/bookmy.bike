import React from 'react';
import { motion } from 'framer-motion';
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
    ArrowUpRight,
    Activity,
} from 'lucide-react';

// --- SHARED WIDGETS ---

export const KpiCard = ({ title, value, sub, trend = 'neutral', icon: Icon }: any) => {
    const isUp = trend === 'up';
    const accentColor = '#FFD700';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`tft-glass-panel rounded-[2rem] p-8 group relative overflow-hidden transition-all duration-500 
            hover:shadow-2xl hover:shadow-[#FFD700]/10
            neon-border-brand border border-[#FFD700]/10`}
        >
            {/* Speed-line Background Effect */}
            <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FFD700]/20 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FFD700]/10 blur-[80px] rounded-full" />
            </div>

            {/* Tachometer / Gauge Decorative SVG */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.03] dark:opacity-[0.08] group-hover:opacity-20 transition-all duration-700 -rotate-12 group-hover:rotate-0 group-hover:scale-125">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current text-[#FFD700]">
                    <path d="M 20 80 A 40 40 0 1 1 80 80" strokeWidth="8" strokeLinecap="round" />
                    <path
                        d="M 20 80 A 40 40 0 0 1 30 70"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="text-rose-500"
                    />
                    <line
                        x1="50"
                        y1="50"
                        x2="50"
                        y2="20"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="origin-bottom transform rotate-45 group-hover:rotate-[120deg] transition-transform duration-1000"
                    />
                    <circle cx="50" cy="50" r="4" fill="currentColor" />
                </svg>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div
                        className={`
                        p-3 rounded-2xl transition-all duration-500 border border-slate-100 dark:border-white/5 shadow-inner
                        ${isUp ? 'bg-[#FFD700]/10 text-[#FFD700]' : 'bg-slate-50 dark:bg-slate-900 text-[#FFD700]'}
                        group-hover:scale-110 group-hover:bg-[#FFD700] group-hover:text-black
                    `}
                    >
                        <Icon size={20} strokeWidth={2.5} />
                    </div>
                    {trend !== 'neutral' && (
                        <div
                            className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border-2
                            ${
                                isUp
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                            }
                        `}
                        >
                            {isUp ? (
                                <TrendingUp size={12} strokeWidth={3} />
                            ) : (
                                <TrendingUp size={12} strokeWidth={3} className="rotate-180" />
                            )}
                            {isUp ? 'ACCEL' : 'DECEL'}
                        </div>
                    )}
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                        <span className={`w-1 h-3 rounded-full bg-[#FFD700]`} />
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter racing-italic">
                            {value}
                        </p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] pt-3 flex items-center gap-2">
                        <Activity size={10} className="text-[#FFD700]" />
                        {sub}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export const FunnelWidget = () => (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden relative group">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#FFD700]/5 dark:bg-[#FFD700]/10 blur-3xl -z-0 group-hover:scale-110 transition-transform duration-1000" />
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">
            Sales Funnel // Throughput
        </h3>
        <div className="flex items-center justify-between relative z-10 px-4">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-700 -z-10 transform -translate-y-1/2"></div>

            {[
                { label: 'Quotes', val: '142', color: 'bg-[#FFD700]/40' },
                { label: 'Orders', val: '86', color: 'bg-[#FFD700]/60' },
                { label: 'Bookings', val: '64', color: 'bg-[#FFD700]/80' },
                { label: 'Delivered', val: '41', color: 'bg-[#FFD700]' },
            ].map((step, idx) => (
                <div
                    key={idx}
                    className="flex flex-col items-center bg-white dark:bg-[#0b1224] px-3 transition-transform hover:scale-110 duration-300"
                >
                    <div
                        className={`w-14 h-14 rounded-2xl ${step.color} text-black flex items-center justify-center text-sm font-black shadow-lg mb-3 font-mono transform -rotate-3 hover:rotate-0 transition-transform`}
                    >
                        {step.val}
                    </div>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {step.label}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

export const PaymentsWidget = () => (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm group">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Payments Pulse</h3>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-[#FFD700] group-hover:text-black transition-all duration-500 shadow-inner border border-slate-100 dark:border-white/5">
                <Wallet size={16} strokeWidth={2} />
            </div>
        </div>
        <div className="space-y-5">
            {[
                { label: 'Collected Today', val: '₹ 12,45,000', color: 'bg-[#FFD700]' },
                { label: 'Pending Invoices', val: '₹ 4,20,000', color: 'bg-[#FFD700]/60' },
                { label: 'Overdue > 7 Days', val: '₹ 1,15,000', color: 'bg-[#FFD700]/30' },
            ].map((p, i) => (
                <div
                    key={i}
                    className="flex justify-between items-center group/item hover:translate-x-1 transition-transform"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${p.color} animate-pulse`} />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {p.label}
                        </span>
                    </div>
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white tracking-tighter italic">
                        {p.val}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

export const RecentActivity = () => (
    <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex justify-between items-center mb-10">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">System Activity Trace</h3>
            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                Clear Logs
            </button>
        </div>
        <div className="space-y-6">
            {[
                {
                    icon: CheckCircle2,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10',
                    text: 'Booking confirmed for Mr. Sharma',
                    id: 'BK-2025-001',
                    time: '10m ago',
                },
                {
                    icon: AlertCircle,
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10',
                    text: 'Low stock warning: Honda Activa 6G',
                    id: 'SKU-ACT6G-MG',
                    time: '45m ago',
                },
                {
                    icon: Wallet,
                    color: 'text-indigo-500',
                    bg: 'bg-indigo-500/10',
                    text: 'Payment received ₹1,50,000',
                    id: 'INV-889',
                    time: '1h ago',
                },
                {
                    icon: Clock,
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                    text: 'Delivery scheduled for tomorrow',
                    id: 'DEL-V02',
                    time: '3h ago',
                },
            ].map((item, i) => (
                <div key={i} className="flex gap-5 items-start group/log">
                    <div
                        className={`${item.bg} p-3 rounded-2xl shrink-0 group-hover/log:scale-110 transition-transform duration-500 border border-white/5`}
                    >
                        <item.icon className={item.color} size={18} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-bold tracking-tight">
                            {item.text}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] font-black font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10">
                                {item.id}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {item.time}
                            </span>
                        </div>
                    </div>
                    <ArrowUpRight
                        className="text-slate-300 opacity-0 group-hover/log:opacity-100 transition-opacity"
                        size={16}
                    />
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
                { label: 'Uninvoiced Deliveries', val: '2' },
            ].map((a, i) => (
                <div
                    key={i}
                    className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex justify-between items-center group-hover:bg-white/20 transition-all cursor-pointer"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">{a.label}</span>
                    <span className="text-xs font-black font-mono bg-white text-rose-600 px-2.5 py-1 rounded-lg shadow-lg">
                        {a.val}
                    </span>
                </div>
            ))}
        </div>
    </div>
);
