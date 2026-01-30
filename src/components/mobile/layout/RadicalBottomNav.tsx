'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, FileText, User, Disc, Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: Home, href: '/m' },
    { id: 'search', label: 'Search', icon: Search, href: '/m/search' },
    { id: 'quotes', label: 'Quotes', icon: FileText, href: '/m/quotes' },
    { id: 'oclub', label: 'O-Club', icon: Hexagon, href: '/m/oclub' },
    { id: 'profile', label: 'Profile', icon: User, href: '/m/profile' },
];

export const RadicalBottomNav = () => {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[110] bg-black/80 backdrop-blur-xl border-t border-white/10 safe-area-bottom h-[72px]">
            <div className="flex items-center justify-between h-full px-2">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/m' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[64px]"
                        >
                            <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'translate-y-[-4px]' : ''}`}>
                                {item.id === 'profile' ? (
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${isActive ? 'bg-[#F4B000] border-[#F4B000] text-black' : 'bg-zinc-800 border-white/10 text-zinc-400'}`}>
                                        AS
                                    </div>
                                ) : (
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`transition-colors duration-300 ${isActive ? 'text-[#F4B000]' : 'text-zinc-500'}`}
                                    />
                                )}

                                {isActive && (
                                    <motion.div
                                        layoutId="radical-glow"
                                        className="absolute inset-x-0 -bottom-1 h-1 bg-[#F4B000] rounded-full blur-[2px]"
                                    />
                                )}

                                {/* Status Dot for Quotes */}
                                {item.id === 'quotes' && (
                                    <div className="absolute -top-1 -right-1 flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                                        <div className="absolute w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75" />
                                    </div>
                                )}
                            </div>

                            <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors duration-300 mt-1 ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
