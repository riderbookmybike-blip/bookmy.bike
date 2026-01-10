'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search, MapPin, Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/providers/ThemeProvider';

import { AppHeaderShell } from './AppHeaderShell';

interface MarketplaceHeaderProps {
    onLoginClick: () => void;
}

export const MarketplaceHeader = ({ onLoginClick }: MarketplaceHeaderProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    return (
        <AppHeaderShell
            scrolled={scrolled}
            transparentAtTop={true}
            left={
                <Link href="/" className="flex items-center group">
                    <Logo mode="auto" size={36} />
                </Link>
            }
            center={
                <nav className="flex items-center gap-10">
                    {['HOME', 'BLOG', 'ABOUT', 'CONTACT'].map((item) => (
                        <Link
                            key={item}
                            href={item === 'HOME' ? '/store' : `/${item.toLowerCase()}`}
                            className={`${navLinkClass} relative group/link`}
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-600 transition-all duration-300 group-hover/link:w-full" />
                        </Link>
                    ))}
                </nav>
            }
            right={
                <div className="flex items-center gap-6">
                    <ThemeToggle />

                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`p-2 rounded-xl transition-all md:hidden ${mobileMenuButtonClass}`}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {userName ? (
                        <Link
                            href="/dashboard"
                            className={`${navLinkClass} flex items-center gap-3 group cursor-pointer max-w-[180px] flex-shrink-0`}
                        >
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl group-hover:scale-110 transition-all flex-shrink-0">
                                {userName.charAt(0)}
                            </div>
                            <span className="truncate group-hover:translate-x-1 transition-transform">
                                Hi, {userName.split(' ')[0]}
                            </span>
                        </Link>
                    ) : (
                        <button
                            onClick={onLoginClick}
                            className={`${navLinkClass} hover:translate-x-1 transition-transform flex-shrink-0`}
                        >
                            Hi, Member
                        </button>
                    )}
                </div>
            }
        >
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 p-6 space-y-8 animate-in slide-in-from-top-4 duration-300 shadow-2xl h-screen fixed inset-0 top-16 z-40">
                    <nav className="flex flex-col gap-6">
                        <Link href="/store" className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Home</Link>
                        <Link href="/store/catalog?category=ELECTRIC" className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">Electric</Link>
                        <Link href="/store/finance" className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">Finance</Link>
                        <Link href="/members" className="text-xl font-black uppercase tracking-tighter text-amber-600">Members Club</Link>

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
