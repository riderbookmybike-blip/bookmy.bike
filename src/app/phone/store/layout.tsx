import React from 'react';
import { PhoneHeader } from '@/components/phone/layout/PhoneHeader';
import { PhoneBottomNav } from '@/components/phone/layout/PhoneBottomNav';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';

export default function M2StoreLayout({ children }: { children: React.ReactNode }) {
    return (
        <FavoritesProvider>
            <div
                className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b0d10]"
                style={{ '--header-h': '58px' } as React.CSSProperties}
            >
                <PhoneHeader />
                <main className="flex-1 pt-[var(--header-h)] pb-24 md:pb-0">{children}</main>
                <div className="block md:hidden">
                    <PhoneBottomNav />
                </div>
            </div>
        </FavoritesProvider>
    );
}
