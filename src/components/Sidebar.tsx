'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSidebarConfig } from '@/config/sidebarConfig';
import { useTenant } from '@/lib/tenant/tenantContext';
import { UserRole } from '@/config/permissions';
import { Pin, PinOff, ChevronRight, Sun, Moon, Monitor } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useSubscription } from '@/hooks/useSubscription';
import { useTheme } from '@/components/providers/ThemeProvider';

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
    onMobileClose
}: SidebarProps) {
    const pathname = usePathname();
    const { tenantType, tenantName } = useTenant();
    const { theme, setTheme } = useTheme();
    const sidebarWidthClass = isExpanded ? 'w-64' : 'w-20';

    // Loading State (Prevent Dealer Flash)
    if (!tenantType) {
        return (
            <aside className={`fixed z-40 inset-y-0 left-0 bg-white dark:bg-slate-950/80 backdrop-blur-2xl flex flex-col border-r border-slate-200 dark:border-white/5 ${sidebarWidthClass} transition-all duration-300`}>
                <div className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
                </div>
                <div className="p-4 space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                    ))}
                </div>
            </aside>
        )
    }

    // Only fetch config when we have a valid Type
    const sidebarSections = getSidebarConfig(tenantType, role);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`
                    fixed z-[60] inset-y-0 left-0 
                    bg-white dark:bg-slate-950/80 backdrop-blur-2xl
                    flex flex-col 
                    transition-all duration-300 ease-in-out 
                    border-r border-slate-200 dark:border-white/10
                    hidden md:flex 
                    ${sidebarWidthClass} 
                    ${className}
                `}
                onMouseEnter={() => onHoverChange(true)}
                onMouseLeave={() => onHoverChange(false)}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-white/10 shrink-0">
                    <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 text-xs font-black shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20 text-white">
                                {tenantType[0]}
                            </div>
                            <span className="font-black text-xl whitespace-nowrap tracking-tighter italic text-slate-900 dark:text-white">STUDIO</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap truncate max-w-[180px] mt-0.5 opacity-60" title={tenantName}>
                            {tenantName}
                        </span>
                    </div>

                    {/* Collapsed Logo */}
                    {!isExpanded && (
                        <div className="w-full flex justify-center">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-sm font-black shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-white/10 text-white">
                                {tenantType[0]}
                            </div>
                        </div>
                    )}

                    {/* Actions: Pin + Theme */}
                    {isExpanded && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onPinToggle}
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200"
                                title={isPinned ? "Unpin" : "Pin"}
                            >
                                {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 space-y-2 scrollbar-none" key={tenantType}>
                    {sidebarSections.map((section, idx) => (
                        <div key={section.group + idx} className="mb-4">
                            {/* Section Title */}
                            <div className={`px-5 mb-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0'}`}>
                                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-80">
                                    {section.group}
                                </h3>
                            </div>

                            <ul className="space-y-1 px-3">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`
                                                    group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden
                                                    ${isActive
                                                        ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-[0_0_25px_rgba(79,70,229,0.3)] border border-white/10'
                                                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                    }
                                                `}
                                                title={!isExpanded ? item.title : ''}
                                            >
                                                {/* Hover Glow effect for non-active */}
                                                {!isActive && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-blue-500/0 group-hover:from-indigo-500/5 group-hover:to-blue-500/5 transition-all duration-500" />
                                                )}

                                                {Icon && (
                                                    <Icon
                                                        size={20}
                                                        strokeWidth={isActive ? 2.5 : 2}
                                                        className={`shrink-0 transition-transform duration-300 ${isActive
                                                            ? 'scale-110 text-white'
                                                            : `group-hover:scale-110 ${item.color || 'text-slate-400 dark:text-slate-500'} group-hover:text-slate-900 dark:group-hover:text-white`
                                                            }`}
                                                    />
                                                )}

                                                <span className={`whitespace-nowrap transition-all duration-500 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute left-14 hidden'} ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                                    {item.title}
                                                </span>

                                                {/* Tooltip for Collapsed */}
                                                {!isExpanded && (
                                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 md:block hidden border border-white/10 scale-95 group-hover:scale-100 transition-all duration-200">
                                                        {item.title}
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
            </aside>

            {/* Mobile Drawer */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onMobileClose}
                    />
                    <div className="relative w-72 bg-slate-950/90 backdrop-blur-2xl text-white h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-white/10">
                        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-sm font-black shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-white/10 text-white">
                                        {tenantType[0]}
                                    </div>
                                    <span className="font-black text-xl italic tracking-tighter text-slate-900 dark:text-white">STUDIO</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mt-0.5 opacity-60">{tenantName}</span>
                            </div>
                            <button onClick={onMobileClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
                            {sidebarSections.map((section, idx) => (
                                <div key={section.group + idx}>
                                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-3 opacity-80">
                                        {section.group}
                                    </h3>
                                    <ul className="space-y-1">
                                        {section.items.map((item) => {
                                            const isActive = pathname === item.href;
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.href}>
                                                    <Link
                                                        href={item.href}
                                                        onClick={onMobileClose}
                                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${isActive
                                                            ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-white/10'
                                                            : 'text-slate-300 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        {Icon && <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
                                                        {item.title}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
