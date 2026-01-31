import { MobileV2Home } from '@/components/mobile-v2/MobileV2Home';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';
import { Suspense } from 'react';

export default function MobileV2Page() {
    return (
        <Suspense fallback={
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        }>
            <FavoritesProvider>
                <MobileV2Home />
            </FavoritesProvider>
        </Suspense>
    );
}
