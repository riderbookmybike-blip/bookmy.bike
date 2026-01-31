import React from 'react';
import { MobileHeader } from '@/components/mobile/layout/MobileHeader';
import { Footer } from '@/components/store/Footer';
import { MobileBottomNav } from '@/components/mobile/layout/MobileBottomNav';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';

export default function M2StoreLayout({ children }: { children: React.ReactNode }) {
    return (
        <FavoritesProvider>
            <div
                className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b0d10]"
                style={{ '--header-h': '58px' } as React.CSSProperties}
            >
                <MobileHeader />
                <main className="flex-1 pt-[var(--header-h)] pb-24 md:pb-0">{children}</main>
                <Footer />
                <div className="block md:hidden">
                    <MobileBottomNav />
                </div>
            </div>
        </FavoritesProvider>
    );
}
