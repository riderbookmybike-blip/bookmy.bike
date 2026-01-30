import { MobileContextFeed } from '@/components/mobile/feed/MobileContextFeed';
import { MobileBottomNav } from '@/components/mobile/layout/MobileBottomNav';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { Suspense } from 'react';

function HomeContent() {
    return (
        <FavoritesProvider>
            <div className="bg-black min-h-screen">
                {/* Feed IS the page content */}
                <MobileContextFeed />

                {/* Dedicated Radical Nav */}
                <MobileBottomNav />
            </div>
        </FavoritesProvider>
    );
}

export default function MobileHomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <HomeContent />
        </Suspense>
    );
}
