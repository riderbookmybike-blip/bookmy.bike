import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, Home as HomeIcon } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/providers/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

import { AppHeaderShell } from './AppHeaderShell';
import { ProfileDropdown } from './ProfileDropdown';

interface MarketplaceHeaderProps {
    onLoginClick: () => void;
}

export const MarketplaceHeader = ({ onLoginClick }: MarketplaceHeaderProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
    const { theme } = useTheme();
    const pathname = usePathname();

    useEffect(() => {
        const mountedFrame = window.requestAnimationFrame(() => setMounted(true));
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrolled(currentScrollY > 100);

            setScrolled(currentScrollY > 100);

            // Autohide removed as per user request (transparent icons are unobtrusive)
            setIsVisible(true);

            lastScrollY = currentScrollY;
        };

        const handleShowHeader = () => setIsVisible(true);
        const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('showHeader', handleShowHeader);
        window.addEventListener('resize', handleResize);
        handleResize();

        const supabase = createClient();
        const syncAuth = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            const fallbackName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : null;
            const name =
                user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                user?.email?.split('@')[0] ||
                fallbackName ||
                null;
            setUserName(name);
        };

        syncAuth();

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            const fallbackName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : null;
            const name =
                session?.user?.user_metadata?.full_name ||
                session?.user?.user_metadata?.name ||
                session?.user?.email?.split('@')[0] ||
                fallbackName ||
                null;
            setUserName(name);
        });
        return () => {
            window.cancelAnimationFrame(mountedFrame);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('showHeader', handleShowHeader);
            window.removeEventListener('resize', handleResize);
            data.subscription.unsubscribe();
        };
    }, []);

    // For the home page (StoreTV), we follow the global theme
    // We only use fallback if not mounted
    const isLight = mounted ? theme === 'light' : true;
    const isTv = Boolean(
        viewport &&
        (viewport.width >= 2000 ||
            (viewport.width === 960 && viewport.height === 540) ||
            (viewport.width === 1280 && viewport.height === 720) ||
            (viewport.width >= 1110 && viewport.width <= 1200 && viewport.height >= 600 && viewport.height <= 700))
    );
    const showTextNav = !isTv && (!pathname.startsWith('/store/') || pathname === '/store');

    // Quick rollback: set navPreset to 'wide'.
    const navPreset: 'tight' | 'wide' = 'tight';
    const navTextClass =
        navPreset === 'tight'
            ? 'text-[12px] font-black uppercase tracking-[0.18em]'
            : 'text-[11px] font-black uppercase tracking-[0.3em]';
    const navGapClass = navPreset === 'tight' ? 'gap-8 mr-4' : 'gap-14 mr-6';
    const rightGapClass = navPreset === 'tight' ? 'gap-3 lg:gap-6' : 'gap-4 lg:gap-10';

    const navLinkClass = scrolled
        ? `${navTextClass} text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all duration-300`
        : `${isLight ? 'text-slate-900/90 hover:text-blue-600' : 'text-white/90 hover:text-blue-400'} ${navTextClass} transition-all duration-300 drop-shadow-md`;
    const activeNavClass =
        'relative text-slate-900 dark:text-white after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-[2px] after:bg-brand-primary after:rounded-full';
    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    const mobileMenuButtonClass = scrolled
        ? 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5'
        : isLight
          ? 'text-slate-900 hover:bg-slate-900/5'
          : 'text-white hover:bg-white/10';

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();

        // Match the cleanup logic in ProfileDropdown
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        localStorage.removeItem('active_role');
        localStorage.removeItem('base_role');
        localStorage.removeItem('tenant_type');

        setUserName(null);
        window.location.reload();
    };

    return (
        <AppHeaderShell
            scrolled={scrolled}
            visible={isVisible}
            transparentAtTop={true}
            left={
                <Link href="/" className="flex items-center group">
                    {/* Full Logo on all screens */}
                    <Logo mode="auto" size={32} variant="full" />
                </Link>
            }
            center={null}
            right={
                <div className={`flex items-center ${rightGapClass}`}>
                    {/* Desktop Navigation - Always visible for better UX, except on TV/Catalog/PDP Mode where we want focus */}
                    {showTextNav && (
                        <div className={`hidden lg:flex items-center ${navGapClass}`}>
                            <Link href="/" className={`${navLinkClass} ${isActive('/') ? activeNavClass : ''}`}>
                                Home
                            </Link>
                            <Link
                                href="/store/catalog"
                                className={`${navLinkClass} ${isActive('/store/catalog') ? activeNavClass : ''}`}
                            >
                                Catalog
                            </Link>
                            {/* New Brands Link scrolling to footer or brands page */}
                            <Link
                                href="#brands"
                                onClick={e => {
                                    e.preventDefault();
                                    const footer = document.getElementById('footer-brands');
                                    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`${navLinkClass}`}
                            >
                                Brands
                            </Link>
                            <Link
                                href="/store/compare"
                                className={`${navLinkClass} ${isActive('/store/compare') ? activeNavClass : ''}`}
                            >
                                Compare
                            </Link>
                        </div>
                    )}

                    {/* Unified Action Group: Favorites, Home, Catalog, User */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/"
                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all group ${scrolled || isLight ? 'border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-white hover:text-blue-600' : 'border-white/20 text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            <HomeIcon size={18} />
                        </Link>
                        <Link
                            href="/store/catalog"
                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all group ${scrolled || isLight ? 'border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-white hover:text-blue-600' : 'border-white/20 text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            <MotorcycleIcon size={20} />
                        </Link>
                        <ProfileDropdown onLoginClick={onLoginClick} scrolled={scrolled} theme={theme} />
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
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-black font-bold">
                                                {(userName?.[0] || 'U').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{userName}</p>
                                                <p className="text-xs text-slate-500">Member</p>
                                            </div>
                                        </div>
                                        {/* Mobile Menu Theme Toggle */}
                                        <ThemeToggle className="w-10 h-10" />
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full py-3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold uppercase tracking-wide"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-500">Appearance</span>
                                        <ThemeToggle className="w-10 h-10" />
                                    </div>
                                    <button
                                        onClick={() => {
                                            onLoginClick();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full py-4 bg-brand-primary text-black rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#F4B000] transition-colors"
                                    >
                                        Login / Sign Up
                                    </button>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </AppHeaderShell>
    );
};
