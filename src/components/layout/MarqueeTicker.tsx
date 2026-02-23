'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileEdit, CheckCircle2, ClipboardCheck, Truck, Zap } from 'lucide-react';

const STATS = [
    { label: 'LIVE USERS', value: '11', change: '+2.4%', isPositive: true },
    { label: 'QUOTES', value: '14', change: '+4.1%', isPositive: true },
    { label: 'BOOKINGS', value: '12', change: '-1.2%', isPositive: false },
    { label: 'PDI DONE', value: '4', change: '+0.5%', isPositive: true },
    { label: 'VEHICLE DISPATCH', value: '2', change: '-2.8%', isPositive: false },
];

export const MarqueeTicker = () => {
    const duplicatedStats = [...STATS, ...STATS, ...STATS, ...STATS];

    return (
        <div className="flex-1 max-w-5xl mx-auto overflow-hidden relative">
            <motion.div
                className="flex items-center gap-16 whitespace-nowrap py-1"
                animate={{
                    x: [0, -1200],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                {duplicatedStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2 font-mono tracking-tighter">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {stat.label}
                        </span>
                        <span className="text-sm font-black text-slate-900">
                            {stat.value}
                        </span>
                        <span className={`text-[10px] font-bold flex items-center ${stat.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {stat.isPositive ? '▲' : '▼'} {stat.change}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};
