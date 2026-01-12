import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Menu, X, ChevronDown, LogOut, Zap, Briefcase } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/providers/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';

import { AppHeaderShell } from './AppHeaderShell';

interface MarketplaceHeaderProps {
    onLoginClick: () => void;
}

export const MarketplaceHeader = ({ onLoginClick }: MarketplaceHeaderProps) => {
    const { memberships } = useTenant();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        const storedName = localStorage.getItem('user_name');
        if (storedName) setUserName(storedName);

        const handleLoginSync = () => {
            const name = localStorage.getItem('user_name');
            setUserName(name);
        };
        const handleAuthSync = (e: any) => {
            if (e.detail?.name) setUserName(e.detail.name);
        };
        window.addEventListener('storage', handleLoginSync);
        window.addEventListener('auth_sync', handleAuthSync);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', handleLoginSync);
            window.removeEventListener('auth_sync', handleAuthSync);
        };
    }, []);

    const navLinkClass = scrolled
        ? "text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all duration-300"
        : `${theme === 'light' ? 'text-slate-900/90 hover:text-blue-600' : 'text-white/90 hover:text-blue-400'} text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300 drop-shadow-md`;

    const mobileMenuButtonClass = scrolled
        ? "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5"
        : (theme === 'light' ? "text-slate-900 hover:bg-slate-900/5" : "text-white hover:bg-white/10");

    const profileRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        if (isProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileOpen]);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        localStorage.removeItem('user_name');
        setUserName(null);
        setIsProfileOpen(false);
        window.location.reload();
    };

    return (
        <AppHeaderShell
            scrolled={scrolled}
            transparentAtTop={true}
            left={
                <Link href="/" className="flex items-center group">
                    {/* Full Logo on all screens */}
                    <Logo mode="auto" size={32} variant="full" />
                </Link>
            }
            center={null}
            right={
                <div className="flex items-center gap-4 lg:gap-10">
                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-10 mr-4">
                        <Link href="/" className={navLinkClass}>Home</Link>
                        <Link href="/compare" className={navLinkClass}>Compare</Link>
                        <Link href="/zero" className={navLinkClass}>Zero</Link>
                    </div>

                    {/* User Dropdown - Desktop Only */}
                    <div className="relative hidden md:block" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className={`flex items-center gap-2 md:gap-3 p-2 md:pl-3 md:pr-2 md:py-1.5 rounded-full border transition-all group ${scrolled || theme === 'light'
                                ? 'border-blue-600/20 dark:border-blue-600/40 bg-slate-100 dark:bg-black/40'
                                : 'border-blue-600/60 bg-black/40'
                                }`}
                        >
                            <User size={18} className={scrolled || theme === 'light' ? 'text-slate-900 dark:text-white' : 'text-white'} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${scrolled || theme === 'light' ? 'text-slate-900 dark:text-white' : 'text-white'
                                }`}>
                                {userName ? `Hi, ${userName.split(' ')[0]}` : 'Sign In'}
                            </span>
                            <div className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-blue-500' : 'text-slate-500'}`}>
                                <ChevronDown size={14} />
                            </div>
                        </button>

                        {/* Figma-Style Profile Dropdown */}
                        {isProfileOpen && (
                            <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                <div className="p-2 space-y-4">
                                    {/* Appearance Section */}
                                    <div>
                                        <p className="px-3 py-1 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Appearance</p>
                                        <div className="mt-1 flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-default">
                                            <div className="flex items-center gap-3">
                                                <div className="text-slate-400">
                                                    <Zap size={15} />
                                                </div>
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Change Theme</span>
                                            </div>
                                            <ThemeToggle />
                                        </div>
                                    </div>

                                    {/* Workspaces Section */}
                                    {userName && memberships && memberships.some(m => !['we', 'MARKETPLACE'].includes(m.tenants?.subdomain || m.tenants?.type)) && (
                                        <div>
                                            <p className="px-3 py-1 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Workspaces</p>
                                            <div className="mt-1 space-y-0.5">
                                                {memberships
                                                    .filter(m => !['we', 'MARKETPLACE'].includes(m.tenants?.subdomain || m.tenants?.type))
                                                    .map((m, idx) => (
                                                        <a
                                                            key={m.id || idx}
                                                            href={`https://${m.tenants.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike'}/dashboard`}
                                                            className="flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Briefcase size={15} className="text-slate-400 group-hover:text-red-600 transition-colors" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors">{m.tenants.name}</span>
                                                                    <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">{m.role}</span>
                                                                </div>
                                                            </div>
                                                            <ChevronDown size={14} className="text-slate-300 -rotate-90 group-hover:text-blue-600 transition-all" />
                                                        </a>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Account Section */}
                                    <div>
                                        <p className="px-3 py-1 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                                            {userName ? 'Member Access' : 'Guest'}
                                        </p>
                                        <div className="mt-1 space-y-0.5">
                                            {userName ? (
                                                <>
                                                    <Link
                                                        href="/members"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group"
                                                    >
                                                        <User size={15} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-white transition-colors" />
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">Elite Circle Home</span>
                                                    </Link>
                                                    <Link
                                                        href="/members"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group"
                                                    >
                                                        <ShoppingCart size={15} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-white transition-colors" />
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">My Orders</span>
                                                    </Link>
                                                    <button
                                                        onClick={handleSignOut}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-colors group"
                                                    >
                                                        <LogOut size={15} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-blue-500 transition-colors">Logout</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        onLoginClick();
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/20 group"
                                                >
                                                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        <User size={12} className="text-blue-600" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Login / Sign Up</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`p-2 rounded-xl transition-all lg:hidden ${mobileMenuButtonClass}`}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            }
        >
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 p-6 space-y-8 animate-in slide-in-from-top-4 duration-300 shadow-2xl h-screen fixed inset-0 top-20 z-40 overflow-y-auto">
                    <nav className="flex flex-col gap-6">
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Home</Link>
                        <Link href="/compare" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">Compare</Link>
                        <Link href="/zero" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">Zero</Link>
                        <Link href="/members" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase tracking-tighter text-blue-600">Elite Circle</Link>

                        {/* User Info in Mobile Menu */}
                        <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
                            {userName ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{userName}</p>
                                            <p className="text-xs text-slate-500">Member</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full py-3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold uppercase tracking-wide"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        onLoginClick();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest"
                                >
                                    Login / Sign Up
                                </button>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </AppHeaderShell>
    );
};
