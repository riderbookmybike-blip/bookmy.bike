'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    FileEdit,
    FileCheck,
    Activity,
    Target,
    ClipboardCheck,
    Package,
    Calendar,
    ArrowUpRight,
    TrendingUp,
    Shield
} from 'lucide-react';
import { TenantType } from '@/lib/tenant/tenantContext';
import { UserRole } from '@/config/permissions';

export interface KPIItemProps {
    label: string;
    value: string | number;
    icon: React.ElementType | React.ReactNode;
    description: string;
    trend?: {
        value: string;
        positive: boolean;
    };
    color?: string;
}

export const KPIItem = ({ label, value, icon: Icon, description, trend, color = 'indigo' }: KPIItemProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const colorClasses: Record<string, string> = {
        indigo: 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:dark:shadow-[0_0_25px_rgba(99,102,241,0.2)] group-hover:border-indigo-400 dark:group-hover:border-indigo-500/50',
        emerald: 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:dark:shadow-[0_0_25px_rgba(16,185,129,0.2)] group-hover:border-emerald-400 dark:group-hover:border-emerald-500/50',
        amber: 'bg-white dark:bg-slate-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:dark:shadow-[0_0_25px_rgba(245,158,11,0.2)] group-hover:border-amber-400 dark:group-hover:border-amber-500/50',
        rose: 'bg-white dark:bg-slate-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(244,63,94,0.1)] group-hover:dark:shadow-[0_0_25px_rgba(244,63,94,0.2)] group-hover:border-rose-400 dark:group-hover:border-rose-500/50',
        blue: 'bg-white dark:bg-slate-950 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(14,165,233,0.1)] group-hover:dark:shadow-[0_0_25px_rgba(14,165,233,0.2)] group-hover:border-sky-400 dark:group-hover:border-sky-500/50',
        slate: 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(100,116,139,0.1)] group-hover:dark:shadow-[0_0_25px_rgba(100,116,139,0.2)] group-hover:border-slate-400 dark:group-hover:border-slate-500/50',
    };

    return (
        <div
            className="relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300 ${colorClasses[color]} group-hover:shadow-lg group-hover:shadow-${color}-500/10 group-hover:scale-[1.02] cursor-default`}>
                {/* Smoothing Icon */}
                <motion.div
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                    animate={{ rotate: isHovered ? [0, -10, 10, 0] : 0, scale: isHovered ? 1.1 : 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    {typeof Icon === 'function' ? <Icon size={16} strokeWidth={2.5} className="drop-shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" /> : Icon}
                </motion.div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black tracking-tight leading-none drop-shadow-[0_0_10px_currentColor]">
                            {value}
                        </span>
                        {trend && (
                            <span className={`text-[8px] font-bold px-1 rounded-md ${trend.positive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {trend.value}
                            </span>
                        )}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none mt-1">
                        {label}
                    </span>
                </div>
            </div>

            {/* Description Tooltip */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute top-full left-0 mt-3 w-48 z-[100] pointer-events-none"
                    >
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-3 ring-1 ring-black/5">
                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                {description}
                            </p>
                            <div className="absolute -top-1 left-6 w-2 h-2 bg-white dark:bg-slate-900 border-t border-l border-slate-200 dark:border-white/10 rotate-45" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface KPIBarProps {
    tenantType?: TenantType | 'AUMS';
    activeRole?: UserRole;
    items?: KPIItemProps[];
}

export const KPIBar = ({ tenantType, activeRole, items }: KPIBarProps) => {
    // Role-based Config
    const isSuperAdmin = activeRole === 'SUPER_ADMIN' || tenantType === 'AUMS';

    const kpisByRole: Record<string, KPIItemProps[]> = {
        SUPER_ADMIN: [
            { label: 'Live Users', value: '1,242', icon: RadioIcon, description: 'Concurrent active users across all tenants', trend: { value: '+12%', positive: true }, color: 'indigo' },
            { label: 'Creating Quote', value: '86', icon: FileEdit, description: 'Users currently in the product studio', color: 'amber' },
            { label: 'Quotes Today', value: '428', icon: FileCheck, description: 'Total configuration finalized in last 24h', trend: { value: '+5%', positive: true }, color: 'emerald' },
            { label: 'Sys Health', value: '99.9%', icon: Activity, description: 'Real-time platform infrastructure status', color: 'blue' },
        ],
        DEALERSHIP_ADMIN: [
            { label: 'Today Leads', value: '14', icon: Target, description: 'New showroom enquiries generated today', trend: { value: 'New', positive: true }, color: 'indigo' },
            { label: 'Booking PDI', value: '3', icon: ClipboardCheck, description: 'Vehicles awaiting Pre-Delivery Inspection', color: 'amber' },
            { label: 'Stock Value', value: '4.8Cr', icon: Package, description: 'Total on-hand inventory valuation (INR)', color: 'emerald' },
            { label: 'Schedules', value: '8', icon: Calendar, description: 'Test drives and deliveries today', color: 'blue' },
        ],
        DEFAULT: [
            { label: 'Platform Status', value: 'Active', icon: Shield, description: 'SaaS Core Engine is running normally', color: 'slate' },
            { label: 'Active Session', value: 'Live', icon: TrendingUp, description: 'Your secure encrypted session status', color: 'slate' },
        ]
    };

    const currentKPIs = items || kpisByRole[activeRole as string] || (isSuperAdmin ? kpisByRole['SUPER_ADMIN'] : kpisByRole['DEFAULT']);

    return (
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500 overflow-x-auto pb-2 lg:pb-0">
            {currentKPIs.map((kpi, idx) => (
                <KPIItem key={idx} {...kpi} />
            ))}
        </div>
    );
};

// Internal icon wrapper for Radio to match Lucide naming if missing
function RadioIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
            <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
        </svg>
    );
}
