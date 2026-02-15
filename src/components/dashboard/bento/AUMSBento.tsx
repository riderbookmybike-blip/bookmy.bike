'use client';

import React from 'react';
import { Users, TrendingUp, Star, Zap, Building2, DollarSign } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { BentoCard } from './BentoComponents';

const RECURRING_DATA = [
    { name: 'W1', value: 40 },
    { name: 'W2', value: 45 },
    { name: 'W3', value: 15 },
    { name: 'W4', value: 55 },
    { name: 'W5', value: 30 },
    { name: 'W6', value: 50 },
];

export const AUMSBento = {
    ANALYTICS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-12 lg:col-span-8" title="Platform Yield" subtitle="System-wide growth">
                <div className="h-[300px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={RECURRING_DATA}>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#FFD700"
                                strokeWidth={4}
                                fill="#FFD700"
                                fillOpacity={0.05}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '20px',
                                    border: 'none',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </BentoCard>
            <div className="col-span-12 lg:col-span-4 space-y-8">
                <BentoCard icon={Users} title="Active Sessions" subtitle="Real-time users">
                    <p className="text-4xl font-black text-slate-900 dark:text-white mt-4">1,842</p>
                    <p className="text-xs font-bold text-[#FFD700] mt-2 flex items-center gap-1">
                        <TrendingUp size={12} /> +12.4%
                    </p>
                </BentoCard>
                <BentoCard icon={Star} title="Dealer Satisfaction" subtitle="Network score">
                    <div className="flex items-center gap-4 mt-4">
                        <p className="text-4xl font-black text-slate-900 dark:text-white">4.8</p>
                        <div className="flex gap-1 text-[#FFD700]">
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                        </div>
                    </div>
                </BentoCard>
            </div>
        </div>
    ),
    OPERATIONS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-12 lg:col-span-4" title="System Health" icon={Zap}>
                <div className="flex flex-col items-center justify-center h-full space-y-4 py-8">
                    <div className="text-6xl font-black text-slate-900 dark:text-white italic">99.9%</div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#FFD700]">Uptime Stable</p>
                </div>
            </BentoCard>
            <BentoCard
                className="col-span-12 lg:col-span-8"
                title="Integration Queue"
                subtitle="Dealers/Financers pending"
                noPadding
            >
                <div className="p-8 pb-4">
                    {['Royal Enfield - Mumbai', 'HDFC Capital - Corp', 'TVS Motors - Pune'].map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl mb-2 hover:bg-[#FFD700]/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <Building2 size={18} className="text-slate-400 dark:text-slate-500" />
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{item}</span>
                            </div>
                            <span className="px-4 py-1.5 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-black uppercase rounded-full">
                                Pending Verification
                            </span>
                        </div>
                    ))}
                </div>
            </BentoCard>
        </div>
    ),
    FINANCIALS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-12 lg:col-span-7" title="Total AUM" subtitle="Platform capital flow">
                <div className="mt-8">
                    <p className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                        Rs. 142.8 Cr
                    </p>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={RECURRING_DATA}>
                                <Area
                                    type="stepBefore"
                                    dataKey="value"
                                    stroke="#FFD700"
                                    strokeWidth={3}
                                    fill="#FFD700"
                                    fillOpacity={0.05}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </BentoCard>
            <div className="col-span-12 lg:col-span-5 space-y-8">
                <BentoCard icon={DollarSign} title="Platform Commission" subtitle="Revenue Q4">
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">Rs. 18.4 Lakh</p>
                </BentoCard>
                <BentoCard title="Gateway Status" noPadding>
                    <div className="p-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                                Razorpay
                            </span>
                            <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                                PhonePe
                            </span>
                            <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                        </div>
                    </div>
                </BentoCard>
            </div>
        </div>
    ),
};
