'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '@/lib/tenant/tenantContext';
import { Pin, PinOff, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { SidebarConfig, SidebarItemConfig } from '@/modules/core/types';
import { getRouteConfig } from '@/modules/registry/routeRegistry';

interface DynamicSidebarProps {
    config: SidebarConfig;
    className?: string;
    isExpanded: boolean;
    isPinned: boolean;
    onHoverChange: (isHovered: boolean) => void;
    onPinToggle: () => void;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function DynamicSidebar({
    config,
    className = '',
    isExpanded,
    isPinned,
    onHoverChange,
    onPinToggle,
    isMobileOpen = false,
    onMobileClose,
}: DynamicSidebarProps) {
    const pathname = usePathname();
    const { tenantSlug } = useTenant();

    // Width constants
    const EXPANDED_WIDTH = 280;
    const COLLAPSED_WIDTH = 80;

    // Helper to resolve item props from registry or override
    const resolveItem = (itemConfig: SidebarItemConfig) => {
        const route = getRouteConfig(itemConfig.id);

        let href = itemConfig.href || route?.path || '#';
        const title = itemConfig.title || route?.label || 'Untitled';
        const Icon = route?.icon;

        // Tenant URL prefixing logic
        const shouldPrefix = tenantSlug && href.startsWith('/');
        if (shouldPrefix) {
            // Basic heuristic: if it's already prefixed, don't double prefix
            if (!href.includes(`/app/${tenantSlug}`)) {
                href = `/app/${tenantSlug}${href.startsWith('/') ? '' : '/'}${href}`;
            }
        }

        return { href, title, Icon };
    };

    const iconPalette = [
        'text-emerald-500',
        'text-indigo-500',
        'text-amber-500',
        'text-rose-500',
        'text-sky-500',
        'text-violet-500',
        'text-teal-500',
        'text-orange-500',
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
                onMouseEnter={() => onHoverChange(true)}
                onMouseLeave={() => onHoverChange(false)}
                className={`
                    fixed z-[60] inset-y-0 left-0 
                    bg-white dark:bg-slate-950/90 backdrop-blur-xl
                    flex flex-col 
                    border-r border-slate-200 dark:border-white/10
                    hidden md:flex overflow-hidden
                    ${className}
                `}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-white/5 shrink-0 overflow-hidden">
                    <div className="flex items-center gap-3">
                        <Logo
                            mode="auto"
                            variant={isExpanded ? 'full' : 'icon'}
                            className="transition-all duration-300"
                        />
                    </div>

                    {isExpanded && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={onPinToggle}
                            className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            {isPinned ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
                        </motion.button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-none">
                    {config.groups.map(group => (
                        <div key={group.id} className="space-y-2">
                            {/* Section Label */}
                            <div className="h-4 flex items-center">
                                <AnimatePresence mode="wait">
                                    {isExpanded ? (
                                        <motion.h3
                                            key="expanded-label"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2"
                                        >
                                            {group.title}
                                        </motion.h3>
                                    ) : (
                                        <motion.div
                                            key="collapsed-divider"
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            className="w-full h-px bg-slate-100 dark:bg-white/5 mx-2"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            <ul className="space-y-1">
                                {group.items.map((itemConfig, index) => {
                                    const { href, title, Icon } = resolveItem(itemConfig);
                                    const isActive = pathname === href || pathname.startsWith(href + '/');
                                    const iconColor = iconPalette[index % iconPalette.length];

                                    return (
                                        <li key={itemConfig.id} className="relative group/item">
                                            <Link
                                                href={href}
                                                className={`
                                                    flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200
                                                    ${
                                                        isActive
                                                            ? 'bg-brand-primary/[0.08] text-slate-900 shadow-sm border-l-4 border-brand-primary rounded-r-none'
                                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                    }
                                                `}
                                            >
                                                <div
                                                    className={`shrink-0 ${isActive ? 'text-brand-primary font-bold' : iconColor}`}
                                                >
                                                    {Icon ? (
                                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                                    ) : (
                                                        <div className="w-5 h-5 bg-slate-200 rounded-full" />
                                                    )}
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.span
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -10 }}
                                                            className="text-sm font-bold whitespace-nowrap"
                                                        >
                                                            {title}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>

                                                {/* Tooltip for Collapsed View */}
                                                {!isExpanded && (
                                                    <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-lg shadow-xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all whitespace-nowrap z-[100]">
                                                        {title}
                                                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900 dark:border-r-white" />
                                                    </div>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </motion.aside>

            {/* Mobile Sidebar */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
                    <div className="relative w-72 bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-6">
                            <Logo mode="auto" variant="icon" />
                            <button onClick={onMobileClose} className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto space-y-6">
                            {config.groups.map(group => (
                                <div key={group.id} className="space-y-3">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                                        {group.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {group.items.map(itemConfig => {
                                            const { href, title, Icon } = resolveItem(itemConfig);
                                            const isActive = pathname === href;
                                            return (
                                                <Link
                                                    key={itemConfig.id}
                                                    href={href}
                                                    onClick={onMobileClose}
                                                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {Icon && <Icon size={20} />}
                                                    {title}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
