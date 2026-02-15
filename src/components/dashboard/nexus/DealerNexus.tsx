'use client';

import React from 'react';
import { Users, Package, TrendingUp, ArrowUpRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import { NexusCard, NexusNumber } from './NexusPanels';

const VELOCITY_DATA = [
    { name: '00', v: 40 },
    { name: '04', v: 30 },
    { name: '08', v: 65 },
    { name: '12', v: 80 },
    { name: '16', v: 55 },
    { name: '20', v: 90 },
];

export const DealerNexus = ({ kpis }: { kpis: any }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-12 gap-8">
            <NexusCard
                className="col-span-12 lg:col-span-8"
                title="Sales Velocity"
                subtitle="Floor Conversion Rate"
                icon={Zap}
                glow
            >
                <div className="h-64 w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={VELOCITY_DATA}>
                            <defs>
                                <linearGradient id="nexusGold" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="#FFD700" strokeWidth={4} fill="url(#nexusGold)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </NexusCard>

            <div className="col-span-12 lg:col-span-4 space-y-8">
                <NexusCard title="Active Leads" subtitle="Real-time Intent" icon={Users}>
                    <div className="mt-4 flex items-end justify-between">
                        <NexusNumber value={kpis?.leads?.newToday || 0} label="Captured Today" trend="+5.4%" />
                        <div className="h-12 w-24">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={VELOCITY_DATA.slice(-4)}>
                                    <Bar dataKey="v" fill="#FFD700" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </NexusCard>

                <NexusCard title="Inventory Node" subtitle="Stock Pulse" icon={Package}>
                    <div className="mt-4 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span>Floor Stock</span>
                            <span className="text-white">88% Capacity</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '88%' }}
                                transition={{ duration: 1 }}
                                className="h-full bg-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                            />
                        </div>
                    </div>
                </NexusCard>
            </div>
        </div>

        <NexusCard title="Floor Commands" subtitle="Pending Actions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {[
                    { label: 'PDI Readiness', value: kpis?.deliveries?.pdiReady || 0, icon: Package },
                    { label: 'Quotes Expiring', value: 3, icon: TrendingUp },
                    { label: 'Receipts Cycle', value: kpis?.receipts?.total || 0, icon: ArrowUpRight },
                ].map((item, i) => (
                    <div
                        key={i}
                        className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[#FFD700]/30 transition-all group"
                    >
                        <item.icon
                            size={20}
                            className="text-[#FFD700] mb-4 opacity-50 group-hover:opacity-100 transition-opacity"
                        />
                        <p className="text-2xl font-black text-white italic">{item.value}</p>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>
        </NexusCard>
    </div>
);
