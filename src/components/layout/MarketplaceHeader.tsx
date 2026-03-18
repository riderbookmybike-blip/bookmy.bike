import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Home as HomeIcon, Menu } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Logo } from '@/components/brand/Logo';
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

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 100);
            setIsVisible(true);
        };
        const handleShowHeader = () => setIsVisible(true);
        const handleMenuToggle = () => setIsSidebarOpen(prev => !prev);

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('showHeader', handleShowHeader);
        window.addEventListener('toggleMobileMenu', handleMenuToggle);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('showHeader', handleShowHeader);
            window.removeEventListener('toggleMobileMenu', handleMenuToggle);
        };
    }, []);

    const navBtnClass =
        'nav-icon-btn w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center text-white/90 hover:text-white bg-transparent border border-white/40 hover:border-white/70';

    return (
        <>
            <AppHeaderShell
                scrolled={scrolled}
                visible={isVisible}
                transparentAtTop={true}
                variant="marketplace"
                className="header-transparent"
                left={
                    <Link href="/" className="flex items-center group h-full">
                        <Logo mode="dark" size={28} variant="full" />
                    </Link>
                }
                center={null}
                right={
                    <div className="flex items-center gap-2 lg:gap-5">
                        {/* ── Desktop: nav icons + profile pill ── */}
                        <div className="hidden lg:flex items-center gap-2.5">
                            <Link href="/" className={navBtnClass}>
                                <HomeIcon size={18} />
                            </Link>
                            <Link href="/store/catalog" className={navBtnClass}>
                                <MotorcycleIcon size={18} />
                            </Link>
                            <Link href="/store/compare/favorites" className={`${navBtnClass} relative`}>
                                <Heart size={18} />
                                {mounted && favorites.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                                        {favorites.length}
                                    </span>
                                )}
                            </Link>
                            <ProfileDropdown
                                onLoginClick={onLoginClick}
                                scrolled={false}
                                theme="dark"
                                tone="dark"
                                externalOpen={isSidebarOpen}
                                onOpenChange={setIsSidebarOpen}
                                compactTrigger
                            />
                        </div>

                        {/* ── Mobile: hamburger button ── */}
                        <div className="lg:hidden flex items-center gap-2">
                            <button
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:text-white border border-white/25 hover:border-white/50 transition-all"
                                onClick={() => setIsSidebarOpen(prev => !prev)}
                                aria-label="Open menu"
                            >
                                <Menu size={20} />
                            </button>
                        </div>

                        {/* Mobile sidebar — trigger hidden, controlled by hamburger above */}
                        <div className="lg:hidden">
                            <ProfileDropdown
                                onLoginClick={onLoginClick}
                                scrolled={false}
                                theme="dark"
                                tone="dark"
                                externalOpen={isSidebarOpen}
                                onOpenChange={setIsSidebarOpen}
                                hideTrigger
                            />
                        </div>
                    </div>
                }
            />
        </>
    );
};
