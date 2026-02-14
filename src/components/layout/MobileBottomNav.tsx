'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, FileText, ShoppingBag, Menu } from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';

interface MobileBottomNavProps {
    onMoreClick: () => void;
}

const TABS = [
    { key: 'dashboard', label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
    { key: 'leads', label: 'Leads', icon: Megaphone, href: '/leads' },
    { key: 'quotes', label: 'Quotes', icon: FileText, href: '/quotes' },
    { key: 'orders', label: 'Orders', icon: ShoppingBag, href: '/sales-orders' },
] as const;

export function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
    const pathname = usePathname();
    const { tenantSlug } = useTenant();

    const resolveHref = (href: string) => (tenantSlug ? `/app/${tenantSlug}${href}` : href);

    const isTabActive = (href: string) => {
        const resolved = resolveHref(href);
        if (!pathname) return false;
        // Dashboard: exact match
        if (href === '/dashboard') return pathname === resolved;
        // Others: starts-with match
        return pathname.startsWith(resolved);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[55] bg-white/95 dark:bg-[#0b0d10]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/10"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex items-stretch justify-around h-[60px]">
                {TABS.map(tab => {
                    const active = isTabActive(tab.href);
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.key}
                            href={resolveHref(tab.href)}
                            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors min-h-[44px] ${
                                active
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-400 dark:text-slate-500 active:text-slate-600'
                            }`}
                        >
                            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                            <span
                                className={`text-[9px] tracking-wider uppercase ${active ? 'font-black' : 'font-bold'}`}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}

                {/* More tab — opens sidebar drawer */}
                <button
                    onClick={onMoreClick}
                    className="flex flex-col items-center justify-center flex-1 gap-0.5 text-slate-400 dark:text-slate-500 active:text-slate-600 transition-colors min-h-[44px]"
                >
                    <Menu size={20} strokeWidth={1.8} />
                    <span className="text-[9px] font-bold tracking-wider uppercase">More</span>
                </button>
            </div>
        </nav>
    );
}
