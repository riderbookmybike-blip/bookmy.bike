import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Terminal, LogOut, Bell, Settings, Menu } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';

interface AumsHeaderProps {
    onLoginClick?: () => void;
    onMenuClick?: () => void;
    showSearch?: boolean;
}

export const AumsHeader = ({ onLoginClick, onMenuClick, showSearch = false }: AumsHeaderProps) => {
    const { tenantType, activeRole, tenantName, userName: contextUserName } = useTenant();
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
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/5 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6 md:gap-12">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 text-slate-400 hover:text-white md:hidden"
                        >
                            <Menu size={24} />
                        </button>
                    )}
                    <Link href="/" className="w-40 md:w-48">
                        <Logo variant="blue" className="text-white" />
                    </Link>

                </div>

                <div className="flex items-center gap-4 lg:gap-6">
                    {displayUserName && (
                        <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative group">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
                        </button>
                    )}

                    <ThemeToggle />

                    {displayUserName ? (
                        <div className="relative group/avatar pl-2">
                            <button className="flex items-center gap-3 group/btn px-1 py-1 rounded-2xl hover:bg-white/5 transition-all duration-300">
                                <div className="flex flex-col items-end hidden sm:flex px-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover/btn:text-indigo-400 transition-colors">
                                        {displayUserName}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                        {tenantName !== 'Loading...' ? tenantName :
                                            (activeRole === 'SUPER_ADMIN' ? 'Platform Control' :
                                                activeRole === 'MARKETPLACE_ADMIN' ? 'Marketplace View' :
                                                    activeRole === 'DEALER_ADMIN' ? 'Partner Workspace' :
                                                        activeRole === 'BANK_ADMIN' ? 'Finance Console' : 'Guest View')}
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20 border border-white/20 group-hover/btn:scale-105 transition-all duration-300">
                                    {displayUserName.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible translate-y-2 group-hover/avatar:translate-y-0 transition-all duration-300 z-50">
                                <div className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-2 overflow-hidden">
                                    <div className="px-4 py-4 border-b border-white/5 mb-2">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Authenticated Account</p>
                                        <p className="text-sm font-bold text-white truncate">{displayUserName.toLowerCase().replace(' ', '.')}@bookmy.bike</p>
                                    </div>

                                    <div className="space-y-1">
                                        <Link href="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all">
                                            <Terminal size={16} />
                                            <span>Dashboard</span>
                                        </Link>
                                        <Link href="/dashboard/profile" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all">
                                            <User size={16} />
                                            <span>Profile</span>
                                        </Link>
                                        <Link href="/dashboard/settings" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all">
                                            <Settings size={16} />
                                            <span>Settings</span>
                                        </Link>
                                    </div>

                                    <div className="mt-2 p-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
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
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                        >
                            <Terminal size={14} />
                            Terminal Login
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};
