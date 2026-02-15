'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AriaCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    icon?: React.ElementType;
    variant?: 'white' | 'glass' | 'accent';
}

export const AriaCard = ({
    children,
    className = '',
    title = '',
    subtitle = '',
    icon: Icon,
    variant = 'white',
}: AriaCardProps) => {
    const baseStyles =
        variant === 'accent'
            ? 'bg-[#696CFF] border-[#696CFF] text-white'
            : variant === 'glass'
              ? 'bg-white/70 backdrop-blur-xl border-white shadow-[0_2px_6px_0_rgba(67,89,113,0.12)]'
              : 'bg-white border-transparent shadow-[0_2px_6px_0_rgba(67,89,113,0.12)]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-xl border p-6 transition-all duration-300 hover:shadow-[0_4px_12px_0_rgba(67,89,113,0.2)] ${baseStyles} ${className}`}
        >
            {(title || Icon) && (
                <div className="flex justify-between items-start mb-4">
                    <div>
                        {title && (
                            <h3
                                className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${variant === 'accent' ? 'text-white/80' : 'text-slate-500'}`}
                            >
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p
                                className={`text-xl font-bold tracking-tight ${variant === 'accent' ? 'text-white' : 'text-slate-800'}`}
                            >
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {Icon && (
                        <div
                            className={`p-2.5 rounded-lg ${variant === 'accent' ? 'bg-white/20 text-white' : 'bg-[#696CFF]/10 text-[#696CFF]'}`}
                        >
                            <Icon size={18} />
                        </div>
                    )}
                </div>
            )}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};

export const AriaNumber = ({
    value,
    label,
    trend,
    suffix = '',
}: {
    value: number | string;
    label: string;
    trend?: number;
    suffix?: string;
}) => {
    return (
        <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-800 tracking-tighter">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                    {suffix}
                </span>
                {trend !== undefined && (
                    <span className={`text-[11px] font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend >= 0 ? '+' : ''}
                        {trend}%
                    </span>
                )}
            </div>
        </div>
    );
};

export const AriaPulse = ({
    label,
    value,
    status = 'success',
}: {
    label: string;
    value: string;
    status?: 'success' | 'warning' | 'error';
}) => {
    const statusColors = {
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        error: 'bg-rose-500',
    };

    return (
        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className={`relative flex h-2 w-2`}>
                <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColors[status]} opacity-75`}
                ></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColors[status]}`}></span>
            </span>
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">{label}</span>
                <span className="text-[11px] font-bold text-slate-700 leading-none">{value}</span>
            </div>
        </div>
    );
};

export const EnterpriseTable = ({ headers, rows }: { headers: string[]; rows: any[][] }) => {
    return (
        <div className="overflow-hidden bg-white rounded-xl shadow-[0_2px_6px_0_rgba(67,89,113,0.12)]">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                            {row.map((cell, j) => (
                                <td key={j} className="px-6 py-4 text-sm font-medium text-slate-600">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
