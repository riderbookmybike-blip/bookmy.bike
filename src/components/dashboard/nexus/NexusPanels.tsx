'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface NexusCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    icon?: React.ElementType;
    glow?: boolean;
}

export const NexusCard = ({
    children,
    className = '',
    title = '',
    subtitle = '',
    icon: Icon,
    glow = false,
}: NexusCardProps) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative overflow-hidden bg-[#0a0a0b]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 group transition-all duration-500 hover:border-[#FFD700]/30 shadow-2xl ${className}`}
    >
        {/* Ambient Glow */}
        {glow && (
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FFD700]/5 blur-[80px] group-hover:bg-[#FFD700]/10 transition-colors duration-700" />
        )}

        <div className="relative z-10">
            {(title || Icon) && (
                <div className="flex justify-between items-start mb-6">
                    <div>
                        {title && (
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
                                {title}
                            </h3>
                        )}
                        {subtitle && <p className="text-sm font-bold text-white tracking-tight">{subtitle}</p>}
                    </div>
                    {Icon && (
                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-[#FFD700] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all">
                            <Icon size={14} />
                        </div>
                    )}
                </div>
            )}
            <div className="flex-1">{children}</div>
        </div>

        {/* Scanline Effect */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFD700]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
    </motion.div>
);

export const NexusTicker = ({ items }: { items: string[] }) => (
    <div className="flex gap-12 overflow-hidden py-1 border-y border-white/5 bg-black/40 whitespace-nowrap">
        <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="flex gap-12 items-center"
        >
            {[...items, ...items, ...items].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-[#FFD700]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD700]/70">{item}</span>
                </div>
            ))}
        </motion.div>
    </div>
);

export const NexusNumber = ({ value, label, trend }: { value: string | number; label: string; trend?: string }) => (
    <div className="flex flex-col">
        <span className="text-3xl font-black text-white tracking-tighter italic">{value}</span>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            {trend && <span className="text-[9px] font-bold text-[#FFD700]">{trend}</span>}
        </div>
    </div>
);
