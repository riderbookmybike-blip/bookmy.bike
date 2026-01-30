'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Hexagon, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: Home, href: '/m' },
    { id: 'search', label: 'Search', icon: Search, href: '/m/search' },
    { id: 'filter', label: 'Filter', icon: SlidersHorizontal, href: '/m?filter=true' },
    { id: 'favorites', label: 'Saved', icon: Heart, href: '/m/favorites' },
    { id: 'oclub', label: 'O-Club', icon: Hexagon, href: '/m/oclub' },
];

export const MobileBottomNav = () => {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[110] safe-area-bottom h-[72px] bg-black/80 backdrop-blur-lg">
            <div className="flex items-center justify-between h-full px-2">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    // Active state logic: Precise match for query params is hard here, so we fallback to simple pathname check or 'filter' special case if needed.
                    // For now, keep visual active state simple.
                    const isActive = pathname === item.href.split('?')[0] && (item.id === 'filter' ? false : true);
                    // Note: Filter is an action, usually doesn't stay 'active' like a page. Or we can let it be active if query param exists.
                    // Let's keep it simple: Filter acts like a button.

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
                                        className={`transition-colors duration-300 ${isActive ? 'text-[#F4B000] drop-shadow-[0_0_10px_rgba(244,176,0,0.5)]' : 'text-white'}`}
                                    />
                                )}

                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-x-0 -bottom-1 h-0.5 bg-[#F4B000] rounded-full blur-[1px]"
                                    />
                                )}
                            </div>

                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/80'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
