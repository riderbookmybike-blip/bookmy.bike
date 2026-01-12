import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Terminal, LogOut, Bell, Settings, Menu, ArrowRightLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';

import { AppHeaderShell } from './AppHeaderShell';

interface AumsHeaderProps {
    onLoginClick?: () => void;
    onMenuClick?: () => void;
    showSearch?: boolean;
}

export const AumsHeader = ({ onLoginClick, onMenuClick, showSearch = false }: AumsHeaderProps) => {
    const { tenantType, activeRole, tenantName, userName: contextUserName, memberships } = useTenant();
    const router = useRouter();
    const [localUserName, setLocalUserName] = useState<string | null>(null);

    useEffect(() => {
        const storedName = localStorage.getItem('user_name');
        if (storedName) setLocalUserName(storedName);

        const handleLoginSync = () => {
            const name = localStorage.getItem('user_name');
            setLocalUserName(name);
        };
        window.addEventListener('storage', handleLoginSync);
        return () => window.removeEventListener('storage', handleLoginSync);
    }, []);

    const displayUserName = (contextUserName && contextUserName !== 'Guest User') ? contextUserName : localUserName;

    const handleLogout = () => {
        localStorage.removeItem('user_name');
        document.cookie = 'aums_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        router.push('/');
        window.location.reload();
    };

    return (
        <AppHeaderShell
            left={
                <div className="flex items-center gap-6 md:gap-12 h-full">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 text-slate-400 hover:text-white md:hidden"
                        >
                            <Menu size={24} />
                        </button>
                    )}
                    <Link href="/" className="flex items-center group">
                        <Logo mode="auto" size={30} />
                    </Link>
                </div>
            }
            right={
                <div className="flex items-center gap-4 lg:gap-6 h-full">
                    {displayUserName && (
                        <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative group">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
                        </button>
                    )}

                    <ThemeToggle />

                    {displayUserName ? (
                        <div className="relative group/avatar pl-2 flex items-center h-full">
                            <button className="flex items-center gap-3 group/btn px-1 py-1 rounded-2xl hover:bg-white/5 transition-all duration-300 max-w-[160px]">
                                <div className="flex flex-col items-end hidden sm:flex px-1 truncate">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover/btn:text-blue-600 transition-colors truncate w-full">
                                        {displayUserName}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate w-full">
                                        {tenantName !== 'Loading...' ? tenantName :
                                            (activeRole === 'OWNER' ? 'Platform Control' :
                                                activeRole === 'DEALERSHIP_ADMIN' ? 'Partner Workspace' :
                                                    activeRole === 'DEALERSHIP_STAFF' ? 'Staff Area' : 'Guest View')}
                                    </span>
                                </div>
                                <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20 border border-white/20 group-hover/btn:scale-105 transition-all duration-300">
                                    <Logo mode="auto" variant="icon" size={16} />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible translate-y-2 group-hover/avatar:translate-y-0 transition-all duration-300 z-50">
                                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-2 overflow-hidden">
                                    <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5 mb-2">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Authenticated Account</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayUserName.toLowerCase().replace(/ /g, '.')}@bookmy.bike</p>
                                    </div>

                                    <div className="space-y-1">
                                        <Link href="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-600 transition-all">
                                            <Terminal size={16} />
                                            <span>Dashboard</span>
                                        </Link>
                                        <Link href="/dashboard/profile" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-600 transition-all">
                                            <User size={16} />
                                            <span>Profile</span>
                                        </Link>
                                        <Link href="/dashboard/settings" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-600 transition-all">
                                            <Settings size={16} />
                                            <span>Settings</span>
                                        </Link>

                                        {memberships && memberships.length > 1 && (
                                            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/5">
                                                <p className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Switch Organisation</p>
                                                <div className="space-y-1">
                                                    {memberships.map((m: any) => (
                                                        <button
                                                            key={m.tenant_id}
                                                            onClick={() => {
                                                                // Logic to switch: redirected to the tenant's subdomain if exists, or change tenant context
                                                                // For now, let's assume we redirect if we have subdomain info, or just log
                                                                console.log('Switching to tenant:', m.tenant_id);
                                                                // This needs a proper domain resolution logic
                                                            }}
                                                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ArrowRightLeft size={12} className="text-blue-500" />
                                                                <span className="truncate max-w-[120px]">{m.tenants?.name || 'Showroom'}</span>
                                                            </div>
                                                            <span className="text-[8px] opacity-50 uppercase">{m.role}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-2 p-1 border-t border-slate-100 dark:border-white/5">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                        >
                                            <LogOut size={16} />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={onLoginClick}
                            className="px-6 h-9 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 flex-shrink-0"
                        >
                            <Terminal size={14} />
                            Terminal Login
                        </button>
                    )}
                </div>
            }
        />
    );
};

