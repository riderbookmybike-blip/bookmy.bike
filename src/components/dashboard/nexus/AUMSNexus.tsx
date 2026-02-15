'use client';

import React from 'react';
import { Activity, Globe, ShieldCheck, Zap, Server } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { NexusCard, NexusNumber } from './NexusPanels';

const NETWORK_DATA = [
    { name: '01', v: 400, y: 240 },
    { name: '02', v: 450, y: 300 },
    { name: '03', v: 420, y: 280 },
    { name: '04', v: 500, y: 350 },
    { name: '05', v: 480, y: 320 },
    { name: '06', v: 600, y: 400 },
];

export const AUMSNexus = ({ kpis }: { kpis: any }) => (
    <div className="space-y-8">
        <div className="grid grid-cols-12 gap-8">
            <NexusCard
                className="col-span-12 lg:col-span-12"
                title="Ecosystem Output"
                subtitle="Network-wide GMV Trajectory"
                icon={Activity}
                glow
            >
                <div className="h-80 w-full mt-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={NETWORK_DATA}>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0a0a0b',
                                    border: '1px solid rgba(255,215,0,0.2)',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    color: '#fff',
                                }}
                                itemStyle={{ color: '#FFD700', fontWeight: 'bold' }}
                            />
                            <Area
                                type="step"
                                dataKey="v"
                                stroke="#FFD700"
                                strokeWidth={3}
                                fill="#FFD700"
                                fillOpacity={0.05}
                            />
                            <Area
                                type="step"
                                dataKey="y"
                                stroke="#fff"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                fill="transparent"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </NexusCard>

            <NexusCard
                className="col-span-12 lg:col-span-4"
                title="Active Nodes"
                subtitle="Live Tenant Pulse"
                icon={Globe}
            >
                <div className="mt-8 flex gap-8">
                    <NexusNumber value={kpis?.activeDealers || 0} label="Dealer Nodes" />
                    <NexusNumber value={kpis?.activeFinanciers || 0} label="Capital Nodes" />
                </div>
                <div className="mt-8 p-4 bg-[#FFD700]/5 border border-[#FFD700]/10 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-[#FFD700] uppercase">Sync Status</span>
                        <span className="text-[9px] font-bold text-white tracking-widest">STABLE</span>
                    </div>
                </div>
            </NexusCard>

            <NexusCard
                className="col-span-12 lg:col-span-4"
                title="Platform Security"
                subtitle="Auth Integrity Index"
                icon={ShieldCheck}
            >
                <div className="mt-8">
                    <div className="text-4xl font-black text-white italic tracking-tighter">99.9%</div>
                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Secure Encryption UP
                    </div>
                </div>
            </NexusCard>

            <NexusCard
                className="col-span-12 lg:col-span-4"
                title="Operational Uptime"
                subtitle="Mean Server Response"
                icon={Zap}
            >
                <div className="mt-8">
                    <div className="text-4xl font-black text-white italic tracking-tighter">142ms</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">
                        P95 System Latency
                    </div>
                </div>
            </NexusCard>
        </div>

        <NexusCard title="Network Diagnostics" subtitle="Sub-System Logs" icon={Server}>
            <div className="mt-6 font-mono text-[10px] space-y-2 opacity-60">
                <p className="text-[#FFD700]">
                    [00:24:12] <span className="text-white">NODE_AUMS:</span> Re-indexing catalog state... COMPLETED
                </p>
                <p>
                    [00:24:10] <span className="text-white">NODE_DEALER_7:</span> New booking request received (REQ_992)
                </p>
                <p>
                    [00:24:08] <span className="text-white">SYSTEM:</span> Garbage collection cycle initiated (HEAP:
                    142MB)
                </p>
            </div>
        </NexusCard>
    </div>
);
