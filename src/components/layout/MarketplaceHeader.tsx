import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search, MapPin, Menu, X, ChevronDown, LayoutDashboard, Settings, LogOut, ShieldCheck, Zap, Repeat } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/providers/ThemeProvider';

import { AppHeaderShell } from './AppHeaderShell';

interface MarketplaceHeaderProps {
    onLoginClick: () => void;
}

export const MarketplaceHeader = ({ onLoginClick }: MarketplaceHeaderProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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
        window.addEventListener('storage', handleLoginSync);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', handleLoginSync);
        };
    }, []);

    const navLinkClass = scrolled
        ? "text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all duration-300"
        : `${theme === 'light' ? 'text-slate-900/90 hover:text-blue-600' : 'text-white/90 hover:text-blue-400'} text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300 drop-shadow-md`;

    const mobileMenuButtonClass = scrolled
        ? "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5"
        : (theme === 'light' ? "text-slate-900 hover:bg-slate-900/5" : "text-white hover:bg-white/10");

    const handleSignOut = () => {
        localStorage.removeItem('user_name');
        setUserName(null);
        setIsProfileOpen(false);
    };

    return (
        <AppHeaderShell
            scrolled={scrolled}
            transparentAtTop={true}
            left={
                <Link href="/" className="flex items-center group">
                    <Logo mode="auto" size={36} />
                </Link>
            }
            center={null}
            right={
                <div className="flex items-center gap-10">
                    <div className="hidden lg:flex items-center gap-10 mr-4">
                        <Link href="/" className={navLinkClass}>Home</Link>
                        <Link href="/compare" className={navLinkClass}>Compare</Link>
                        <Link href="/zero" className={navLinkClass}>Zero</Link>
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`p-2 rounded-xl transition-all md:hidden ${mobileMenuButtonClass}`}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className={`${navLinkClass} flex items-center gap-3 group cursor-pointer flex-shrink-0 transition-all`}
                        >
                            {userName ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl group-hover:scale-110 transition-all">
                                        {userName.charAt(0)}
                                    </div>
                                    <span className="truncate max-w-[100px]">
                                        Hi, {userName.split(' ')[0]}
                                    </span>
                                </div>
                            ) : (
                                <span onClick={(e) => { e.stopPropagation(); onLoginClick(); }}>Hi, Member</span>
                            )}
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileOpen && (
                            <div className="absolute top-full right-0 mt-4 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl p-4 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                                <div className="space-y-2">
                                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-2">Member Preferences</p>

                                    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500">
                                                <Repeat size={16} />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest">Interface Mode</span>
                                        </div>
                                        <ThemeToggle />
                                    </div>

                                    <Link
                                        href="/members"
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-rose-600"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-rose-600/10 flex items-center justify-center">
                                            <LayoutDashboard size={16} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest">Elite Dashboard</span>
                                    </Link>

                                    {userName && (
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-500"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                                <LogOut size={16} />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            }
        >
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 p-6 space-y-8 animate-in slide-in-from-top-4 duration-300 shadow-2xl h-screen fixed inset-0 top-16 z-40 overflow-y-auto">
                    <nav className="flex flex-col gap-6">
                        <Link href="/" className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Home</Link>
                        <Link href="/compare" className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">Compare</Link>
                        <Link href="/zero" className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">Zero</Link>
                        <Link href="/members" className="text-xl font-black uppercase tracking-tighter text-rose-600">Elite Circle</Link>

                        {!userName && (
                            <button
                                onClick={() => {
                                    onLoginClick();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest mt-8"
                            >
                                Members Login
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </AppHeaderShell>
    );
};
