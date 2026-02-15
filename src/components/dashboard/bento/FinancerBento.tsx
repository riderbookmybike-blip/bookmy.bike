'use client';

import React from 'react';
import { Activity, ShieldCheck, Landmark, Briefcase, ChevronRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { BentoCard } from './BentoComponents';

const RECURRING_DATA = [
    { name: 'W1', value: 40 },
    { name: 'W2', value: 45 },
    { name: 'W3', value: 15 },
    { name: 'W4', value: 55 },
    { name: 'W5', value: 30 },
    { name: 'W6', value: 50 },
];

const ACTIVITY_DATA = [
    { name: 'M', v: 30 },
    { name: 'T', v: 45 },
    { name: 'W', v: 25 },
    { name: 'T', v: 60 },
    { name: 'F', v: 35 },
    { name: 'S', v: 20 },
    { name: 'S', v: 40 },
];

export const FinancerBento = {
    ANALYTICS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard
                className="col-span-12 lg:col-span-8"
                title="Approval Velocity"
                subtitle="Average loan processing time"
            >
                <div className="h-[250px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ACTIVITY_DATA}>
                            <Area
                                type="natural"
                                dataKey="v"
                                stroke="#FFD700"
                                strokeWidth={4}
                                fill="#FFD700"
                                fillOpacity={0.05}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6 flex justify-between items-center bg-slate-50 dark:bg-white/5 p-6 rounded-[2.5rem] border border-transparent hover:border-[#FFD700]/20 transition-all">
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-900 dark:text-white">1.2 Hrs</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                            Avg Response
                        </p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
                    <div className="text-center">
                        <p className="text-2xl font-black text-[#FFD700]">88.4%</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                            Approval Rate
                        </p>
                    </div>
                </div>
            </BentoCard>
            <BentoCard className="col-span-12 lg:col-span-4" title="Portfolio Risk" icon={ShieldCheck}>
                <div className="mt-8 flex flex-col items-center">
                    <div className="w-32 h-32 bg-[#FFD700]/5 rounded-full flex items-center justify-center border-[8px] border-white dark:border-slate-900 shadow-xl">
                        <span className="text-3xl font-black text-[#FFD700] italic">LOW</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-6 text-center italic">
                        Standard deviation within target Q4 limits.
                    </p>
                </div>
            </BentoCard>
        </div>
    ),
    OPERATIONS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-12" title="Application Queue" subtitle="Pending Verifications" noPadding>
                <div className="p-8">
                    <div className="flex gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
                        {['All Apps', 'In-Review', 'Pending Docs', 'Verified'].map((cat, i) => (
                            <button
                                key={i}
                                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all ${i === 1 ? 'bg-black dark:bg-white text-white dark:text-black shadow-xl' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-black dark:hover:text-white'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: 'Amit Singh', id: 'APP_982', status: 'Identity Verified', time: '2m ago' },
                            { name: 'Rashmi Das', id: 'APP_712', status: 'Pending ITR', time: '14m ago' },
                            { name: 'John Doe', id: 'APP_009', status: 'Agent Field Visit', time: '1h ago' },
                        ].map((app, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] hover:border-[#FFD700]/40 hover:shadow-xl transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-[#FFD700] group-hover:text-black transition-all">
                                        <Briefcase size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {app.name}{' '}
                                            <span className="text-[10px] text-slate-300 dark:text-slate-600 ml-2">
                                                #{app.id}
                                            </span>
                                        </p>
                                        <p className="text-[10px] font-black text-[#FFD700] uppercase">{app.status}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                                        {app.time}
                                    </span>
                                    <button className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </BentoCard>
        </div>
    ),
    FINANCIALS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard
                className="col-span-12 lg:col-span-8"
                title="Capital Displacement"
                subtitle="Disbursed vs Allocated"
            >
                <div className="relative h-[300px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={RECURRING_DATA}>
                            <Area
                                type="natural"
                                dataKey="value"
                                stroke="#FFD700"
                                strokeWidth={5}
                                fill="#FFD700"
                                fillOpacity={0.1}
                            />
                            <Area
                                type="natural"
                                dataKey="value"
                                stroke="currentColor"
                                className="text-black dark:text-white"
                                strokeWidth={2}
                                fill="transparent"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </BentoCard>
            <div className="col-span-12 lg:col-span-4 space-y-8">
                <BentoCard icon={Landmark} title="Disbursed Total" subtitle="This Month">
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">Rs. 4.2 Cr</p>
                    <p className="text-[10px] font-black text-[#FFD700] uppercase mt-2">+14% Growth</p>
                </BentoCard>
                <BentoCard icon={Activity} title="Avg Margin" subtitle="Interest Yield">
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-4">9.4%</p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mt-2">
                        Stable Flow
                    </p>
                </BentoCard>
            </div>
        </div>
    ),
};
