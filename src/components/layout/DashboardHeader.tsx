'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Terminal, Shield, LogOut, Search, Bell, Command, Settings, Menu } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
    onMenuClick?: () => void;
    showSearch?: boolean;
}

export const DashboardHeader = ({ onMenuClick, showSearch = false }: DashboardHeaderProps) => {
    const { tenantType } = useTenant();
    const router = useRouter();
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        const storedName = localStorage.getItem('user_name');
        if (storedName) setUserName(storedName);

        const handleLoginSync = () => {
            const name = localStorage.getItem('user_name');
            setUserName(name);
        };
        window.addEventListener('storage', handleLoginSync);
        return () => window.removeEventListener('storage', handleLoginSync);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('user_name');
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
            // Fallback redirect
            router.push('/');
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="w-full px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    {/* Search Bar - CRM Specific */}
                    {showSearch && (
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl w-64 lg:w-96 transition-all focus-within:w-full focus-within:max-w-xl focus-within:ring-2 focus-within:ring-blue-500/20">
                            <Search size={16} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Global Search (Orders, Customers, VIN...)"
                                className="bg-transparent border-none outline-none text-xs font-medium text-slate-900 dark:text-white w-full placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-1">
                                <span className="p-1 rounded bg-white dark:bg-white/10 text-[10px] font-bold text-slate-400">⌘</span>
                                <span className="p-1 rounded bg-white dark:bg-white/10 text-[10px] font-bold text-slate-400">K</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all relative group">
                        <Bell size={18} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    <ThemeToggle />

                    {/* User Profile - Compact for Dashboard */}
                    <div className="relative group/avatar pl-2 border-l border-slate-200 dark:border-white/10 ml-2">
                        <button className="flex items-center gap-3 group/btn px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-[11px] font-bold text-slate-900 dark:text-white group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400">
                                    {userName || 'User'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    {(() => {
                                        if (!tenantType) return 'Loading...';
                                        switch (tenantType) {
                                            case 'MARKETPLACE': return 'Super Admin';
                                            case 'DEALER': return 'Dealer Partner';
                                            case 'BANK': return 'Finance Partner';
                                            default: return tenantType;
                                        }
                                    })()}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-lg">
                                {userName ? userName.charAt(0) : 'U'}
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible translate-y-2 group-hover/avatar:translate-y-0 transition-all duration-200 z-50">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-1 overflow-hidden">
                                <div className="space-y-0.5">
                                    <Link href="/dashboard/profile" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
                                        <User size={14} />
                                        <span>Profile</span>
                                    </Link>
                                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all">
                                        <Settings size={14} />
                                        <span>Settings</span>
                                    </button>
                                    <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                    >
                                        <LogOut size={14} />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
