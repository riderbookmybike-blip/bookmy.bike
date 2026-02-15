'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BentoCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    icon?: React.ElementType;
    action?: React.ReactNode;
    noPadding?: boolean;
}

export const BentoCard = ({
    children,
    className = '',
    title = '',
    subtitle = '',
    icon: Icon,
    action,
    noPadding = false,
}: BentoCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] dark:hover:bg-slate-800/50 transition-all duration-500 flex flex-col ${noPadding ? 'p-0' : ''} ${className}`}
    >
        {(title || Icon) && (
            <div className={`flex justify-between items-start mb-6 ${noPadding ? 'p-8 pb-0' : ''}`}>
                <div>
                    {title && <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{title}</h3>}
                    {subtitle && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{subtitle}</p>
                    )}
                </div>
                {Icon && (
                    <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 dark:text-slate-500">
                        <Icon size={16} />
                    </div>
                )}
                {action && <div>{action}</div>}
            </div>
        )}
        <div className={`flex-1 ${noPadding && !title && !Icon ? 'p-0' : ''}`}>{children}</div>
    </motion.div>
);
