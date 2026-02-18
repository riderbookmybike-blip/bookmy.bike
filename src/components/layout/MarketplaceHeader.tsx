import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, Home as HomeIcon, ArrowRight } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/providers/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import { useBreakpoint } from '@/hooks/useBreakpoint';

import { AppHeaderShell } from './AppHeaderShell';
import { ProfileDropdown } from './ProfileDropdown';
import { useFavorites } from '@/lib/favorites/favoritesContext';

interface MarketplaceHeaderProps {
    onLoginClick: () => void;
}

export const MarketplaceHeader = ({ onLoginClick }: MarketplaceHeaderProps) => {
    const { favorites, removeFavorite } = useFavorites();
    const [scrolled, setScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
    const { theme } = useTheme();
    const pathname = usePathname();
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrolled(currentScrollY > 100);
            setIsVisible(true);
        };

        const handleShowHeader = () => setIsVisible(true);
        const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('showHeader', handleShowHeader);
        window.addEventListener('resize', handleResize);

        // Listen for bottom nav menu toggle
        const handleMenuToggle = () => setIsSidebarOpen(prev => !prev);
        window.addEventListener('toggleMobileMenu', handleMenuToggle);

        handleResize();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('showHeader', handleShowHeader);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('toggleMobileMenu', handleMenuToggle);
        };
    }, []);

    const isHome = pathname === '/' || pathname === '/store';
    const isLight = mounted ? theme === 'light' : true;

    // Quick rollback: set navPreset to 'wide'.
    const navPreset: 'tight' | 'wide' = 'tight';
    const rightGapClass = navPreset === 'tight' ? 'gap-3 lg:gap-6' : 'gap-4 lg:gap-10';

    const isHeaderTransparent = isHome && !scrolled;

    const mobileMenuButtonClass = !isHeaderTransparent
        ? 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5'
        : isLight
          ? 'text-slate-900 hover:bg-slate-900/5'
          : 'text-white hover:bg-white/10';

    return (
        <AppHeaderShell
            scrolled={scrolled}
            visible={isVisible}
            transparentAtTop={true}
            variant="marketplace"
            className="header-transparent"
            left={
                <Link href="/" className="flex items-center group h-full">
                    <div className="flex items-center justify-center transition-all duration-300">
                        <Logo mode="light" size={40} variant="full" />
                    </div>
                </Link>
            }
            center={null}
            right={
                <div className={`flex items-center ${rightGapClass}`}>
                    {/* Desktop Navigation Group */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-10 h-10 rounded-full border transition-all duration-300 group flex items-center justify-center border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                        >
                            <HomeIcon size={18} />
                        </Link>
                        <Link
                            href="/store/catalog"
                            className="w-10 h-10 rounded-full border transition-all duration-300 group flex items-center justify-center border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                        >
                            <MotorcycleIcon size={20} />
                        </Link>
                        <Link
                            href="/wishlist"
                            className="w-10 h-10 rounded-full border transition-all duration-300 group relative flex items-center justify-center border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                        >
                            <Heart size={18} />
                            {favorites.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-in zoom-in duration-300">
                                    {favorites.length}
                                </span>
                            )}
                        </Link>
                        <ThemeToggle className="w-10 h-10 rounded-full border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all duration-300" />
                    </div>

                    <ProfileDropdown
                        onLoginClick={onLoginClick}
                        scrolled={!isHeaderTransparent}
                        theme={theme}
                        tone="light"
                        externalOpen={isSidebarOpen}
                        onOpenChange={setIsSidebarOpen}
                    />

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`w-10 h-10 rounded-xl transition-all lg:hidden ${isPhone ? 'hidden' : 'flex'} items-center justify-center ${mobileMenuButtonClass}`}
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            }
        />
    );
};
