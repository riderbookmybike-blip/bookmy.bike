'use client';

import React from 'react';
import { Home, ShoppingBag, Info, User, Search, Bike } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const TvLayout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: 'Home', href: '/tv', active: pathname === '/tv' },
        { icon: ShoppingBag, label: 'Catalog', href: '/tv/catalog', active: pathname === '/tv/catalog' },
        { icon: Search, label: 'Search', href: '/tv/search', active: pathname === '/tv/search' },
        { icon: User, label: 'Account', href: '/tv/account', active: pathname === '/tv/account' },
    ];

    return (
        <div className="tv-standalone selection:bg-[#f4b000] selection:text-black">
            {/* Sidebar Navigation HUD */}
            <nav className="fixed left-0 top-0 bottom-0 w-24 z-[100] flex flex-col items-center py-10 tv-hud-edge border-r border-white/5">
                <div className="mb-12">
                    <div className="w-12 h-12 bg-[#f4b000] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(244,176,0,0.3)]">
                        <Bike size={28} className="text-black" />
                    </div>
                </div>

                <div className="flex flex-col gap-8 flex-1">
                    {navItems.map(item => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                                item.active
                                    ? 'bg-white text-black scale-110 shadow-xl'
                                    : 'text-slate-500 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <item.icon size={24} />
                            {/* Tooltip labels for TV focus */}
                            <span className="absolute left-16 px-3 py-1 bg-white text-black text-[10px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="mt-auto">
                    <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <Info size={18} />
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="pl-24 min-h-screen relative">
                {children}

                {/* Ambient Glow */}
                <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-[#f4b000]/5 blur-[150px] rounded-full pointer-events-none" />
                <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />
            </main>
        </div>
    );
};
