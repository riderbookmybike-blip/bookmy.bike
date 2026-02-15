'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { BentoCard } from './BentoComponents';

const INVENTORY_DATA = [
    { model: 'Activa 6G', stock: 12, sales: 84 },
    { model: 'Dio Standard', stock: 8, sales: 62 },
    { model: 'CB Shine', stock: 5, sales: 45 },
    { model: 'Hornet 2.0', stock: 3, sales: 12 },
];

export const DealerBento = {
    ANALYTICS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-12 lg:col-span-4" title="Sales Conversions" subtitle="Lead to Booking">
                <div className="relative w-40 h-40 mx-auto mt-8 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-slate-50 dark:text-white/5"
                        />
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="transparent"
                            style={{ strokeDasharray: '440', strokeDashoffset: '110' }}
                            className="text-[#FFD700]"
                        />
                    </svg>
                    <span className="absolute text-4xl font-black italic dark:text-white">75%</span>
                </div>
                <p className="text-center text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mt-6 tracking-widest">
                    Efficiency Index
                </p>
            </BentoCard>
            <BentoCard
                className="col-span-12 lg:col-span-8"
                title="Model-wise Performance"
                subtitle="Top performing stock"
            >
                <div className="h-[300px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={INVENTORY_DATA}>
                            <XAxis
                                dataKey="model"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                            />
                            <Bar dataKey="sales" fill="#FFD700" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </BentoCard>
        </div>
    ),
    OPERATIONS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-12 lg:col-span-5" title="Live Inventory" icon={Package}>
                <div className="space-y-4 mt-6">
                    {INVENTORY_DATA.map((item, i) => (
                        <div
                            key={i}
                            className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-[#FFD700]/5 dark:hover:bg-[#FFD700]/10 hover:border-[#FFD700]/20 border border-transparent transition-all"
                        >
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{item.model}</span>
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500">
                                {item.stock} LEFT
                            </span>
                        </div>
                    ))}
                </div>
            </BentoCard>
            <div className="col-span-12 lg:col-span-7 space-y-8">
                <BentoCard title="Today's Appointments" subtitle="Test Rides & Deliveries">
                    <div className="flex gap-4 mt-4">
                        <div className="flex-1 p-4 bg-[#FFD700]/10 rounded-[2.5rem] border border-[#FFD700]/20 flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">12</span>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                                Test Rides
                            </span>
                        </div>
                        <div className="flex-1 p-4 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">04</span>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                                Deliveries
                            </span>
                        </div>
                    </div>
                </BentoCard>
                <BentoCard title="Staff Activity" noPadding>
                    <div className="p-8 flex items-center justify-between">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <img
                                    key={i}
                                    src={`https://i.pravatar.cc/100?u=${i}`}
                                    className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 shadow-sm -ml-2 first:ml-0"
                                />
                            ))}
                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400 -ml-2">
                                +3
                            </div>
                        </div>
                        <button className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest hover:underline">
                            Manage Team
                        </button>
                    </div>
                </BentoCard>
            </div>
        </div>
    ),
    FINANCIALS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-12" title="Revenue Tracking" subtitle="Dealer Payout Lifecycle">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[2.5rem]">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2">
                            Total Sales
                        </p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">Rs. 84.4 Lakh</p>
                    </div>
                    <div className="p-6 bg-[#FFD700]/5 rounded-[2.5rem] border border-[#FFD700]/10">
                        <p className="text-[10px] font-black text-[#FFD700] uppercase mb-2">Net Margin</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">Rs. 12.2 Lakh</p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[2.5rem]">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2">
                            Payouts Pending
                        </p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">Rs. 3.4 Lakh</p>
                    </div>
                    <div className="p-6 bg-black rounded-[2.5rem] flex items-center justify-center group overflow-hidden relative">
                        <div className="absolute inset-0 bg-[#FFD700] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <button className="text-white group-hover:text-black z-10 text-[10px] font-black uppercase tracking-widest transition-colors">
                            Request Settlement
                        </button>
                    </div>
                </div>
            </BentoCard>
        </div>
    ),
};
