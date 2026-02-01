'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Menu, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/components/providers/I18nProvider';



export const PhoneBottomNav = () => {
    const pathname = usePathname();
    const { t } = useI18n();

    // Strict Mobile V2 Routing
    const routePrefix = '/phone';

    const NAV_ITEMS = [
        { id: 'home', label: 'Home', icon: Home, href: routePrefix },
        { id: 'search', label: 'Search', icon: Search, href: `${routePrefix}/search` },
        { id: 'filter', label: 'Filter', icon: SlidersHorizontal, href: `${routePrefix}?filter=true` },
        { id: 'favorites', label: 'Saved', icon: Heart, href: `${routePrefix}/favorites` },
        { id: 'menu', label: 'Menu', icon: Menu, href: `${routePrefix}/menu` },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[110] safe-area-bottom h-[72px] bg-black/5 dark:bg-black/60 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/10 transition-all duration-500">
            <div className="flex items-center justify-between h-full px-5">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    // Active state logic: Precise match for query params or pathname
                    const isActive = pathname === item.href.split('?')[0] && (item.id === 'filter' ? false : true);

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[64px]"
                            scroll={false} // Prevent scroll jump
                        >
                            <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'translate-y-[-4px]' : ''}`}>
                                {Icon && (
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`transition-colors duration-300 ${isActive ? 'text-[#F4B000] drop-shadow-[0_0_10px_rgba(244,176,0,0.5)]' : 'text-slate-400 dark:text-white'}`}
                                    />
                                )}

                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-x-0 -bottom-1 h-0.5 bg-[#F4B000] rounded-full blur-[1px]"
                                    />
                                )}
                            </div>

                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-white/60'}`}>
                                {t(item.label)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
