'use client';

import React from 'react';
import { DashboardConfig } from '@/modules/core/types';
import { getWidgetComponent } from '@/modules/registry/widgetRegistry';
import { getIcon } from '@/modules/registry/iconRegistry';
import { Filter } from 'lucide-react';

interface DynamicDashboardProps {
    config: DashboardConfig;
    className?: string;
}

export default function DynamicDashboard({ config, className = '' }: DynamicDashboardProps) {
    return (
        <div className={`space-y-8 animate-in fade-in duration-700 pb-12 ${className}`}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-lg w-fit">
                        <span className="w-1.1 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD700]">
                            {config.title}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-4">
                        {config.description || 'Dashboard'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
                        <Filter size={14} />
                        Filter View
                    </button>
                    {/* Add more global actions here if needed */}
                </div>
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min">
                {config.widgets.map(widgetConfig => {
                    const WidgetComponent = getWidgetComponent(widgetConfig.type);
                    const { w, h, x, y } = widgetConfig.layout;

                    // Convert grid units to tailwind classes
                    // This is a naive implementation; for complex layouts we might want a dedicated grid library
                    const colSpanClass = `col-span-1 md:col-span-${Math.min(w, 12)} lg:col-span-${w}`;

                    // Enforce height based on layout.h (assuming 1 unit = 4rem or similar + gap)
                    // Or just let it be auto for now but ensure min-height for charts
                    // For now, let's just make sure it's not 0 height
                    const style = { minHeight: `${h * 4}rem` };

                    // Helper to resolve Props
                    const resolvedProps = { ...widgetConfig.props };

                    // Resolve Icon: If props.icon is a string, replace it with the component
                    if (resolvedProps && typeof resolvedProps.icon === 'string') {
                        resolvedProps.icon = getIcon(resolvedProps.icon);
                    }

                    return (
                        <div key={widgetConfig.id} className={`${colSpanClass}`} style={style}>
                            <WidgetComponent {...resolvedProps} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
