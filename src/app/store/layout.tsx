'use client';

import React, { useState, useEffect } from 'react';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import LoginSidebar from '@/components/auth/LoginSidebar';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';
import { usePathname } from 'next/navigation';
import { PhoneHeader } from '@/components/phone/layout/PhoneHeader';
import { PhoneBottomNav } from '@/components/phone/layout/PhoneBottomNav';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    useEffect(() => {
        const handleOpenLogin = () => setIsLoginOpen(true);
        window.addEventListener('openLogin', handleOpenLogin);
        return () => window.removeEventListener('openLogin', handleOpenLogin);
    }, []);

    const pathname = usePathname();
    const isLandingPage = pathname === '/store' || pathname === '/';

    return (
        <FavoritesProvider>
            <div className="marketplace min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-red-500/30 transition-colors duration-300 pb-20 md:pb-0">
                {/* Desktop Header */}
                <div className="hidden md:block">
                    <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />
                </div>

                {/* Mobile Header */}
                <div className="block md:hidden">
                    <PhoneHeader />
                </div>

                <main className="flex-1 pt-0">{children}</main>

                {!isLandingPage && <MarketplaceFooter />}

                {/* Mobile Bottom Nav */}
                <div className="block md:hidden">
                    <PhoneBottomNav />
                </div>

                {/* Global Login Sidebar */}
                <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="RETAIL" />
            </div>
        </FavoritesProvider>
    );
}
