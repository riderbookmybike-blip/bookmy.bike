'use client';

import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

export const FleetVelocityWidget = () => {
    // Hardcoded data for visual parity with AdminDashboard
    const fleetData = [
        { time: '00:00', value: 400, projection: 420 },
        { time: '02:00', value: 300, projection: 350 },
        { time: '04:00', value: 200, projection: 220 },
        { time: '06:00', value: 500, projection: 480 },
        { time: '08:00', value: 900, projection: 850 },
        { time: '10:00', value: 1100, projection: 1000 },
        { time: '12:00', value: 1400, projection: 1300 },
        { time: '14:00', value: 1600, projection: 1550 },
        { time: '16:00', value: 1500, projection: 1600 },
        { time: '18:00', value: 1200, projection: 1100 },
        { time: '20:00', value: 800, projection: 850 },
        { time: '22:00', value: 600, projection: 550 },
    ];

    return (
        <div className="bg-white dark:bg-slate-950/40 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-10 shrink-0">
                <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 italic tracking-tighter">
                        <TrendingUp size={20} className="text-indigo-600" />
                        FLEET VELOCITY
                    </h3>
                    <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Unit Throughput Analysis</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                        <span className="w-2 h-2 rounded-full bg-indigo-600" /> Real-time
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                        <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" /> Projected
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fleetData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#gradientColor)" animationDuration={2000} />
                        <Area type="monotone" dataKey="projection" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-black">
                    <CheckCircle2 size={14} />
                    Peak efficiency reached
                </div>
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View Report</button>
            </div>
        </div>
    );
};
