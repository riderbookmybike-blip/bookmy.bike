import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/providers/ThemeProvider';
import { createClient } from '@/lib/supabase/client';

import { AppHeaderShell } from './AppHeaderShell';
import { ProfileDropdown } from './ProfileDropdown';

interface MarketplaceHeaderProps {
    onLoginClick: () => void;
}

export const MarketplaceHeader = ({ onLoginClick }: MarketplaceHeaderProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(() => {
        return null;
    });
    const [scrolled, setScrolled] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);

        const supabase = createClient();
        const syncAuth = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            const fallbackName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : null;
            const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || fallbackName || null;
            setUserName(name);
        };

        syncAuth();

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            const fallbackName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : null;
            const name =
                session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || fallbackName || null;
            setUserName(name);
        });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            data.subscription.unsubscribe();
        };
    }, []);

    const navLinkClass = scrolled
        ? 'text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all duration-300'
        : `${theme === 'light' ? 'text-slate-900/90 hover:text-blue-600' : 'text-white/90 hover:text-blue-400'} text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300 drop-shadow-md`;

    const mobileMenuButtonClass = scrolled
        ? 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5'
        : theme === 'light'
          ? 'text-slate-900 hover:bg-slate-900/5'
          : 'text-white hover:bg-white/10';

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();

        // Match the cleanup logic in ProfileDropdown
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        localStorage.removeItem('active_role');
        localStorage.removeItem('tenant_type');

        setUserName(null);
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
                    <div className="hidden lg:flex items-center gap-14 mr-6">
                        <Link href="/" className={navLinkClass}>
                            Home
                        </Link>
                        <Link href="/store/catalog" className={navLinkClass}>
                            Catalog
                        </Link>
                        <Link href="/store/compare" className={navLinkClass}>
                            Compare
                        </Link>
                        <Link href="/zero" className={navLinkClass}>
                            Zero
                        </Link>
                    </div>

                    {/* Theme Toggle */}
                    <div className="hidden md:block">
                        <ThemeToggle />
                    </div>

                    {/* User Dropdown */}
                    <ProfileDropdown onLoginClick={onLoginClick} scrolled={scrolled} theme={theme} />

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`p-2 rounded-xl transition-all lg:hidden ${mobileMenuButtonClass}`}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {/* Mobile Theme Toggle (Visible only on mobile) */}
                    <div className="md:hidden">
                        <ThemeToggle />
                    </div>
                </div>
            }
        >
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 p-6 space-y-8 animate-in slide-in-from-top-4 duration-300 shadow-2xl h-screen fixed inset-0 top-20 z-40 overflow-y-auto">
                    <nav className="flex flex-col gap-6">
                        <Link
                            href="/"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white"
                        >
                            Home
                        </Link>
                        <Link
                            href="/store/catalog"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400"
                        >
                            Catalog
                        </Link>
                        <Link
                            href="/store/compare"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400"
                        >
                            Compare
                        </Link>
                        <Link
                            href="/zero"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400"
                        >
                            Zero
                        </Link>
                        <Link
                            href="/members"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-xl font-black uppercase tracking-tighter text-blue-600"
                        >
                            Elite Circle
                        </Link>

                        {/* User Info in Mobile Menu */}
                        <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
                            {userName ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-black font-bold">
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
                                    className="w-full py-4 bg-brand-primary text-black rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#F4B000] transition-colors"
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
