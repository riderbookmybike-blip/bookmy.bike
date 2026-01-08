'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTenant } from '@/lib/tenant/tenantContext';
import { LogOut, User, Bell, Search, Command, Menu, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
    onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
    const { tenantName, tenantType } = useTenant();
    const router = useRouter();

    const handleLogout = () => {
        // Mock logout
        document.cookie = 'aums_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        router.push('/login');
    };

    return (
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 sticky top-0 z-30 transition-colors duration-300">
            {/* Left: Mobile Menu + Search */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-white md:hidden"
                >
                    <Menu size={24} />
                </button>
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl w-80 group transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50">
                    <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-600 dark:text-slate-300 placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded text-[9px] font-black text-slate-400">
                        <Command size={10} />
                        <span>K</span>
                    </div>
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all relative group">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950" />
                </button>

                <div className="w-px h-6 bg-slate-200 dark:border-white/10 mx-1" />

                <ThemeToggle />

                <div className="w-px h-6 bg-slate-200 dark:border-white/10 mx-1" />

                {/* User Profile Dropdown */}
                <div className="relative group/avatar pl-2">
                    <button className="flex items-center gap-3 group/btn px-1 py-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-300">
                        <div className="flex flex-col items-end hidden sm:flex px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-400 transition-colors">
                                Ajit Singh
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                {tenantType.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20 border border-white/20 group-hover/btn:scale-105 group-hover/btn:shadow-indigo-500/40 transition-all duration-300">
                            AS
                        </div>
                    </button>

                    {/* Dropdown Menu (Glassmorphism) */}
                    <div className="absolute right-0 top-full mt-2 w-72 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible translate-y-2 group-hover/avatar:translate-y-0 transition-all duration-300 z-50">
                        <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-2 overflow-hidden ring-1 ring-black/5">
                            {/* Profile Section */}
                            <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5 mb-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Authenticated Account</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">ajit@bookmy.bike</p>
                            </div>

                            <div className="space-y-1">
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group/item">
                                    <User size={16} className="text-slate-400 group-hover/item:scale-110 transition-transform" />
                                    <span>My Profile</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group/item">
                                    <Settings size={16} className="text-slate-400 group-hover/item:scale-110 transition-transform" />
                                    <span>Settings</span>
                                </button>
                            </div>

                            {/* Organization Switcher */}
                            <div className="mt-4 px-4 py-2 border-t border-slate-100 dark:border-white/5">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Switch Store</p>
                                <div className="space-y-2">
                                    <button className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-indigo-600/5 dark:bg-indigo-500/10 border border-indigo-600/20 dark:border-indigo-400/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white italic">A</div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">Ace Honda Delhi</span>
                                                <span className="text-[8px] font-bold text-indigo-600/60 dark:text-indigo-400/60 uppercase">Active Terminal</span>
                                            </div>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                                    </button>

                                    <button className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group/store grayscale opacity-60 hover:grayscale-0 hover:opacity-100">
                                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/store:bg-indigo-500 group-hover/store:text-white transition-all italic">A</div>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover/store:text-slate-900 dark:group-hover/store:text-white">Ace Honda Mumbai</span>
                                    </button>
                                </div>
                            </div>

                            {/* Logout Section */}
                            <div className="mt-2 p-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                >
                                    <LogOut size={16} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
