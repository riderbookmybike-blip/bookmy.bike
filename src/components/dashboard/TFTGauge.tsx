import React from 'react';
import { motion } from 'framer-motion';

interface TFTGaugeProps {
    value: number;
    max: number;
    label: string;
    unit?: string;
    color?: string;
    size?: number;
    type?: 'arc' | 'bar';
}

export const TFTGauge = ({
    value,
    max,
    label,
    unit,
    color = 'var(--tft-cyan)',
    size = 200,
    type = 'arc',
}: TFTGaugeProps) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = size * 0.4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    if (type === 'bar') {
        return (
            <div className="space-y-4 w-full">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                    <span className="text-xl font-black italic tracking-tighter tft-number">
                        {value}
                        <span className="text-[10px] ml-1 uppercase opacity-50">{unit}</span>
                    </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: 'circOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col items-center justify-center pt-4" style={{ width: size, height: size }}>
            <svg className="transform -rotate-[220deg]" width={size} height={size}>
                {/* Background Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={size * 0.08}
                    fill="transparent"
                    strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                />
                {/* Active Progress */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={size * 0.08}
                    fill="transparent"
                    strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                    initial={{ strokeDashoffset: circumference * 0.75 }}
                    animate={{ strokeDashoffset: circumference * 0.75 - (percentage / 100) * (circumference * 0.75) }}
                    transition={{ duration: 1.5, ease: 'circOut' }}
                    className="tft-gauge-arc"
                />
            </svg>

            {/* Central Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-4xl font-black italic tracking-tighter tft-number">{value}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 -mt-1">
                    {unit || label}
                </span>
            </div>
        </div>
    );
};
