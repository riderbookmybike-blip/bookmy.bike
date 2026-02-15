'use client';

import React from 'react';
import { Activity, ShieldAlert, Landmark, Briefcase, ChevronRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { NexusCard, NexusNumber } from './NexusPanels';

const RISK_DATA = [
    { name: 'Low', value: 400 },
    { name: 'Med', value: 300 },
    { name: 'High', value: 100 },
];

const COLORS = ['#FFD700', 'rgba(255,215,0,0.4)', 'rgba(255,255,255,0.05)'];

export const FinancerNexus = ({ kpis }: { kpis: any }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-12 gap-8">
            <NexusCard
                className="col-span-12 lg:col-span-8"
                title="Approval Velocity"
                subtitle="Cycle Time vs Target"
                icon={Activity}
                glow
            >
                <div className="h-72 w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={[
                                { n: 'M', v: 40 },
                                { n: 'T', v: 45 },
                                { n: 'W', v: 30 },
                                { n: 'T', v: 55 },
                                { n: 'F', v: 60 },
                                { n: 'S', v: 40 },
                            ]}
                        >
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
            </NexusCard>

            <NexusCard
                className="col-span-12 lg:col-span-4"
                title="Risk Topology"
                subtitle="Portfolio Distribution"
                icon={ShieldAlert}
            >
                <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={RISK_DATA} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {RISK_DATA.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        stroke="transparent"
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-between mt-4">
                    <NexusNumber value="8.4%" label="NPL Threshold" trend="SAFE" />
                    <NexusNumber value="1.2hr" label="Avg Decision" />
                </div>
            </NexusCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <NexusCard title="Capital Displacement" subtitle="Live Disbursal Stream" icon={Landmark}>
                <div className="space-y-4 mt-8">
                    {[
                        { id: 'LN_992', status: 'Disbursed', val: '1.2L', time: '12m ago' },
                        { id: 'LN_812', status: 'Approved', val: '0.8L', time: '44m ago' },
                        { id: 'LN_101', status: 'In Review', val: '2.4L', time: '1h ago' },
                    ].map((tx, i) => (
                        <div
                            key={i}
                            className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-[#FFD700]/30 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/5 rounded-xl text-[#FFD700]">
                                    <Briefcase size={12} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white italic tracking-widest">{tx.id}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">{tx.status}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-white">Rs. {tx.val}</p>
                                <p className="text-[9px] font-bold text-slate-600 uppercase">{tx.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </NexusCard>

            <NexusCard title="Queue Priority" subtitle="Active Applications" icon={ChevronRight}>
                <div className="flex flex-col h-full justify-center items-center py-10">
                    <div className="text-7xl font-black text-white/5 italic">14</div>
                    <p className="text-[9px] font-black text-[#FFD700] uppercase tracking-[0.4em] mt-4">
                        Pending Verification
                    </p>
                    <button className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#FFD700] hover:text-black transition-all">
                        Execute Batch Review
                    </button>
                </div>
            </NexusCard>
        </div>
    </div>
);
