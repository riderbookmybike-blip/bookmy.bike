import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, Home as HomeIcon } from 'lucide-react';
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

    useEffect(() => {
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

    // Universal: same transparent-dark header on every single page
    const navBtnClass =
        'w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center text-white hover:bg-white/10';

    return (
        <AppHeaderShell
            scrolled={scrolled}
            visible={isVisible}
            transparentAtTop={true}
            variant="marketplace"
            className="header-transparent"
            left={
                <Link href="/" className="flex items-center group h-full">
                    <Logo mode="dark" size={30} variant="full" />
                </Link>
            }
            center={null}
            right={
                <div className="flex items-center gap-3 lg:gap-6">
                    {/* Desktop nav icons */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link href="/" className={navBtnClass}>
                            <HomeIcon size={18} />
                        </Link>
                        <Link href="/store/catalog" className={navBtnClass}>
                            <MotorcycleIcon size={20} />
                        </Link>
                        <Link href="/wishlist" className={`${navBtnClass} relative`}>
                            <Heart size={18} />
                            {favorites.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                                    {favorites.length}
                                </span>
                            )}
                        </Link>
                    </div>

                    <ProfileDropdown
                        onLoginClick={onLoginClick}
                        scrolled={false}
                        theme="dark"
                        tone="dark"
                        externalOpen={isSidebarOpen}
                        onOpenChange={setIsSidebarOpen}
                    />

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-10 h-10 rounded-xl transition-all lg:hidden flex items-center justify-center text-white hover:bg-white/10"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            }
        />
    );
};
