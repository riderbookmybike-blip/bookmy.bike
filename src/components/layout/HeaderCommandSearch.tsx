'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSidebarConfig } from '@/config/sidebarConfig';
import { useTenant } from '@/lib/tenant/tenantContext';
import type { TenantType } from '@/lib/tenant/tenantContext';

interface HeaderCommandSearchProps {
    className?: string;
    iconSize?: number;
}

interface SearchItem {
    key: string;
    label: string;
    href: string;
    group: string;
}

const TENANT_PREFIX_PATTERNS = [
    '/dashboard',
    '/leads',
    '/members',
    '/customers',
    '/quotes',
    '/sales-orders',
    '/receipts',
    '/finance-applications',
    '/audit-logs',
    '/finance',
    '/superadmin',
    '/inventory',
    '/catalog',
    '/books',
];

const resolveHref = (href: string, tenantSlug?: string) => {
    if (!tenantSlug || href.startsWith(`/app/${tenantSlug}`)) return href;
    const shouldPrefix = TENANT_PREFIX_PATTERNS.some(prefix => href.startsWith(prefix));
    return shouldPrefix ? `/app/${tenantSlug}${href}` : href;
};

export function HeaderCommandSearch({ className, iconSize = 18 }: HeaderCommandSearchProps) {
    const router = useRouter();
    const { tenantType, tenantSlug, activeRole, userRole } = useTenant();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const searchItems = useMemo<SearchItem[]>(() => {
        if (!tenantType) {
            return [
                { key: 'catalog', label: 'Catalog', href: '/store/catalog', group: 'Marketplace' },
                { key: 'wishlist', label: 'Wishlist', href: '/wishlist', group: 'Marketplace' },
                { key: 'profile', label: 'Profile', href: '/profile', group: 'Account' },
                { key: 'orders', label: 'Orders', href: '/orders', group: 'Account' },
            ];
        }

        const role = activeRole || userRole;
        const groups = getSidebarConfig(tenantType as TenantType, role);
        const flattened = groups.flatMap(group =>
            group.items.map(item => ({
                key: `${group.group}-${item.href}`,
                label: item.title,
                href: resolveHref(item.href, tenantSlug),
                group: group.group,
            }))
        );

        const seen = new Set<string>();
        return flattened.filter(item => {
            const dedupeKey = `${item.label}::${item.href}`;
            if (seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
        });
    }, [tenantType, tenantSlug, activeRole, userRole]);

    const filteredItems = useMemo(() => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) return searchItems.slice(0, 10);
        return searchItems
            .filter(
                item =>
                    item.label.toLowerCase().includes(trimmed) ||
                    item.group.toLowerCase().includes(trimmed) ||
                    item.href.toLowerCase().includes(trimmed)
            )
            .slice(0, 12);
    }, [searchItems, query]);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            const commandPressed = event.metaKey || event.ctrlKey;
            if (commandPressed && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen(prev => !prev);
            }

            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, []);

    useEffect(() => {
        if (!open) return;
        const focusFrame = window.requestAnimationFrame(() => inputRef.current?.focus());
        return () => window.cancelAnimationFrame(focusFrame);
    }, [open]);

    const navigateTo = (href: string) => {
        setOpen(false);
        setQuery('');
        router.push(href);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open command search"
                aria-haspopup="dialog"
                aria-expanded={open}
                className={className}
                title="Search modules (Ctrl/Cmd + K)"
            >
                <Search size={iconSize} />
            </button>

            {open && (
                <div className="fixed inset-0 z-[140] flex items-start justify-center p-4 pt-20">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                        aria-label="Close search"
                    />

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Header search"
                        className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/5">
                            <Search size={16} className="text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                                placeholder="Search modules, route, or action..."
                                className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                aria-label="Close search"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="max-h-[55vh] overflow-y-auto p-2">
                            {filteredItems.length > 0 ? (
                                filteredItems.map(item => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => navigateTo(item.href)}
                                        className="w-full text-left px-3 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {item.label}
                                                </p>
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mt-0.5">
                                                    {item.group}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400 group-hover:text-brand-primary transition-colors">
                                                <span className="text-[10px] font-black uppercase tracking-wider">
                                                    Open
                                                </span>
                                                <ChevronRight size={14} />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                                            {item.href}
                                        </p>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-10 text-center">
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-300">
                                        No results for "{query}"
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        Try searching by module name or route.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
