'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSidebarConfig } from '@/config/sidebarConfig';
import { useTenant } from '@/lib/tenant/tenantContext';
import { UserRole } from '@/config/permissions';
import { Pin, PinOff, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Logo } from '@/components/brand/Logo';
import { can } from '@/lib/auth/rbac';

interface SidebarProps {
    role: UserRole;
    className?: string;
    isExpanded: boolean;
    isPinned: boolean;
    onHoverChange: (isHovered: boolean) => void;
    onPinToggle: () => void;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function Sidebar({
    role,
    className = '',
    isExpanded,
    isPinned,
    onHoverChange,
    onPinToggle,
    isMobileOpen = false,
    onMobileClose,
}: SidebarProps) {
    const pathname = usePathname();
    const { tenantType, tenantName, tenantSlug } = useTenant();

    // Width constants
    const EXPANDED_WIDTH = 280;
    const COLLAPSED_WIDTH = 80;

    const sidebarGroups = useMemo(() => {
        if (!tenantType) return [];
        const groups = getSidebarConfig(tenantType, role);

        // RBAC Filter
        return groups.map(group => ({
            ...group,
            items: group.items.filter(item => {
                // SUPERADMIN OVERRIDE: If in AUMS tenant, show everything that passed sidebarConfig check
                if (tenantType === 'AUMS') return true;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const perm = (item as any).permission || (item as any).permissions?.[0];
                if (perm) {
                    return can(role, perm);
                }
                return true;
            }),
        }));
    }, [tenantType, role]);

    if (!tenantType) {
        return (
            <aside className="fixed z-40 inset-y-0 left-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/5 w-20 transition-all">
                <div className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
                </div>
            </aside>
        );
    }

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
                        <div className="flex items-center gap-3">
                            <Logo
                                mode="auto"
                                variant={isExpanded ? 'full' : 'icon'}
                                className="transition-all duration-300"
                            />
                        </div>
                    </div>

                    {isExpanded && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={onPinToggle}
                            className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-brand-primary bg-brand-primary/10 dark:bg-brand-primary/5' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            {isPinned ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
                        </motion.button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-none">
                    {sidebarGroups.map((section, idx) => (
                        <div key={section.group + idx} className="space-y-2">
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
                                            {section.group}
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
                                {section.items.map(item => {
                                    // Rewrite URL for Tenant Context
                                    let href = item.href;
                                    const shouldPrefix =
                                        tenantSlug &&
                                        (href.startsWith('/dashboard') ||
                                            href.startsWith('/leads') ||
                                            href.startsWith('/members') ||
                                            href.startsWith('/customers') ||
                                            href.startsWith('/quotes') ||
                                            href.startsWith('/sales-orders') ||
                                            href.startsWith('/finance-applications') ||
                                            href.startsWith('/audit-logs') ||
                                            href.startsWith('/finance') ||
                                            href.startsWith('/superadmin') ||
                                            href.startsWith('/inventory') ||
                                            href.startsWith('/catalog'));
                                    if (shouldPrefix) {
                                        href = `/app/${tenantSlug}${href}`;
                                    }

                                    const isActive = pathname === href;
                                    const Icon = item.icon;
                                    return (
                                        <li key={item.href} className="relative group/item">
                                            <Link
                                                href={href}
                                                className={`
                                                    relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300
                                                    ${isActive
                                                        ? 'text-brand-primary'
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                    }
                                                `}
                                            >
                                                {/* Active Background Pill (Sliding Motion) */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="active-pill"
                                                        className="absolute inset-0 bg-brand-primary/[0.12] dark:bg-brand-primary/[0.15] rounded-xl shadow-[0_4px_20px_rgba(244,176,0,0.1)] z-0"
                                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}

                                                {/* Active Accent Bar */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="active-bar"
                                                        className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(244,176,0,0.6)] z-10"
                                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}

                                                <div
                                                    className={`relative z-10 shrink-0 ${isActive ? 'text-brand-primary' : item.color || 'text-slate-400'}`}
                                                >
                                                    {Icon && <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.span
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -10 }}
                                                            className="text-sm font-bold whitespace-nowrap"
                                                        >
                                                            {item.title}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>

                                                {/* Tooltip for Collapsed View */}
                                                {!isExpanded && (
                                                    <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-lg shadow-xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all whitespace-nowrap z-[100]">
                                                        {item.title}
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

                {/* Footer / System Status */}
                <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                    <div
                        className={`flex items-center gap-3 px-2 py-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-white dark:bg-white animate-pulse" />
                        </div>
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                        System Status
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                                        99.9% Operational
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.aside>

            {/* Mobile Drawer (Simplied for now) */}
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
                            {sidebarGroups.map((section, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                                        {section.group}
                                    </h3>
                                    <div className="space-y-1">
                                        {section.items.map(item => {
                                            let href = item.href;
                                            const shouldPrefix =
                                                tenantSlug &&
                                                (href.startsWith('/dashboard') ||
                                                    href.startsWith('/leads') ||
                                                    href.startsWith('/customers') ||
                                                    href.startsWith('/quotes') ||
                                                    href.startsWith('/sales-orders') ||
                                                    href.startsWith('/finance-applications') ||
                                                    href.startsWith('/audit-logs') ||
                                                    href.startsWith('/finance') ||
                                                    href.startsWith('/superadmin'));
                                            if (shouldPrefix) {
                                                href = `/app/${tenantSlug}${href}`;
                                            }
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={href}
                                                    onClick={onMobileClose}
                                                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-extrabold transition-all ${isActive
                                                            ? 'bg-brand-primary text-slate-900 shadow-lg shadow-brand-primary/20'
                                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    {item.icon && <item.icon size={20} />}
                                                    {item.title}
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
