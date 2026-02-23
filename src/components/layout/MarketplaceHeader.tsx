import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, Home as HomeIcon } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Logo } from '@/components/brand/Logo';
import { usePathname } from 'next/navigation';
import { useBreakpoint } from '@/hooks/useBreakpoint';

import { AppHeaderShell } from './AppHeaderShell';
import { ProfileDropdown } from './ProfileDropdown';
import { useFavorites } from '@/lib/favorites/favoritesContext';

interface MarketplaceHeaderProps {
    onLoginClick: () => void;
}

export const MarketplaceHeader = ({ onLoginClick }: MarketplaceHeaderProps) => {
    const { favorites } = useFavorites();
    const [scrolled, setScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrolled(currentScrollY > 100);
            setIsVisible(true);
        };

        const handleShowHeader = () => setIsVisible(true);
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('showHeader', handleShowHeader);

        // Listen for bottom nav menu toggle
        const handleMenuToggle = () => setIsSidebarOpen(prev => !prev);
        window.addEventListener('toggleMobileMenu', handleMenuToggle);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('showHeader', handleShowHeader);
            window.removeEventListener('toggleMobileMenu', handleMenuToggle);
        };
    }, []);

    const isHome = pathname === '/' || pathname === '/store' || pathname?.match(/^\/d[2-8]$/);

    // Quick rollback: set navPreset to 'wide'.
    const navPreset: 'tight' | 'wide' = 'tight';
    const rightGapClass = navPreset === 'tight' ? 'gap-3 lg:gap-6' : 'gap-4 lg:gap-10';

    const isHeaderTransparent = isHome && !scrolled;

    const mobileMenuButtonClass = 'text-black hover:bg-black/5';

    const desktopNavButtonClass =
        'w-10 h-10 rounded-full transition-all duration-300 group flex items-center justify-center text-black hover:bg-black/5';

    return (
        <AppHeaderShell
            scrolled={scrolled}
            visible={isVisible}
            transparentAtTop={true}
            variant="marketplace"
            className={`${isHeaderTransparent || (isPhone && isHome) ? 'header-transparent' : ''}`}
            left={
                <Link href="/" className="flex items-center group h-full">
                    <div className="flex items-center justify-center transition-all duration-300">
                        <Logo mode="auto" size={30} variant="full" />
                    </div>
                </Link>
            }
            center={null}
            right={
                <div className={`flex items-center ${rightGapClass}`}>
                    {/* Desktop Navigation Group */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link href="/" className={desktopNavButtonClass}>
                            <HomeIcon size={18} />
                        </Link>
                        <Link href="/store/catalog" className={desktopNavButtonClass}>
                            <MotorcycleIcon size={20} />
                        </Link>
                        <Link href="/wishlist" className={`${desktopNavButtonClass} relative`}>
                            <Heart size={18} />
                            {favorites.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-in zoom-in duration-300">
                                    {favorites.length}
                                </span>
                            )}
                        </Link>
                    </div>

                    <ProfileDropdown
                        onLoginClick={onLoginClick}
                        scrolled={!isHeaderTransparent}
                        theme="light"
                        tone="dark"
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
