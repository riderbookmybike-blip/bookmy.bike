'use client';

import React, { useState } from 'react';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import LoginSidebar from '@/components/auth/LoginSidebar';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';
import { usePathname } from 'next/navigation';

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const pathname = usePathname();
    const isLandingPage = pathname === '/store' || pathname === '/';


    return (
        <FavoritesProvider>
            <div className="marketplace min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-red-500/30 transition-colors duration-300">
                <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />

                <main className="flex-1 pt-0">{children}</main>

                {!isLandingPage && <MarketplaceFooter />}

                {/* Global Login Sidebar */}
                <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="RETAIL" />
            </div>
        </FavoritesProvider>
    );
}
