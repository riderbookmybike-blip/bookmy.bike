'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Terminal, Shield, LogOut, Search, Bell, Command, Settings, Menu, ShoppingBag, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
    onMenuClick?: () => void;
    showSearch?: boolean;
}

export const DashboardHeader = ({ onMenuClick, showSearch = false }: DashboardHeaderProps) => {
    const { tenantType, userRole, activeRole, switchRole, isSidebarExpanded, tenantName, userName } = useTenant();
    const router = useRouter();


    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('user_name');
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/');
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isSidebarExpanded ? 'md:left-[280px]' : 'md:left-[80px]'} backdrop-blur-2xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/5`}>
            <div className="w-full px-6 h-20 flex items-center justify-between">
                <div className="flex items-center flex-1">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 mr-4 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    {/* Command Bar style Search */}
                    {showSearch && (
                        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl w-64 lg:w-96 transition-all focus-within:w-[480px] focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 group">
                            <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Orders, Partners, VIN, Customers..."
                                className="bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white w-full placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-1.5 opacity-40 group-focus-within:opacity-100">
                                <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-500">⌘</kbd>
                                <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-500">K</kbd>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all relative group">
                        <Bell size={18} />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950" />
                    </button>

                    <ThemeToggle />

                    {/* User Profile + Role Switcher */}
                    <div className="relative group/avatar pl-4 border-l border-slate-200 dark:border-white/10 ml-2">
                        <button className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-xs font-black text-slate-900 dark:text-white leading-none">
                                    {userName || 'User'}
                                </span>
                                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-tighter mt-1">
                                    {tenantName || (activeRole === 'SUPER_ADMIN' ? 'Platform Control' : 'Marketplace View')}
                                </span>
                                {process.env.NODE_ENV === 'development' && (
                                    <span className="text-[8px] text-slate-400 mt-1 uppercase opacity-50">
                                        Role: {userRole} | Active: {activeRole}
                                    </span>
                                )}
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-indigo-500/20">
                                {userName ? userName.charAt(0) : 'U'}
                            </div>
                        </button>

                        {/* Enhanced Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-3 w-64 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible translate-y-2 group-hover/avatar:translate-y-0 transition-all duration-300 z-[100]">
                            <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 overflow-hidden ring-1 ring-black/5">

                                {/* Role Switcher - Always visible for debugging */}
                                <div className="mb-2 p-1.5 space-y-1 bg-slate-50 dark:bg-white/2 rounded-xl border border-slate-100 dark:border-white/5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1 opacity-80">Execution Context</p>
                                    <button
                                        onClick={() => switchRole('SUPER_ADMIN')}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeRole === 'SUPER_ADMIN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} />
                                            <span>Platform Admin</span>
                                        </div>
                                        {activeRole === 'SUPER_ADMIN' && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                                    </button>
                                    <button
                                        onClick={() => switchRole('MARKETPLACE_ADMIN')}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeRole === 'MARKETPLACE_ADMIN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag size={14} />
                                            <span>Marketplace View</span>
                                        </div>
                                        {activeRole === 'MARKETPLACE_ADMIN' && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                                    </button>
                                </div>

                                <div className="space-y-0.5">
                                    <Link href="/dashboard/profile" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white transition-all">
                                        <User size={14} />
                                        <span>User Profile</span>
                                    </Link>
                                    <Link href="/dashboard/settings" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white transition-all">
                                        <Settings size={14} />
                                        <span>System Settings</span>
                                    </Link>
                                    <div className="h-px bg-slate-100 dark:bg-white/10 my-1 mx-2" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
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
