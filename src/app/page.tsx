import { headers } from 'next/headers';
import { Suspense } from 'react';
import StorePage from './store/page';
import StoreLayout from './store/layout';
import { MobileV2Home } from '@/components/mobile-v2/MobileV2Home';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';

function MobileHome() {
  return (
    <FavoritesProvider>
      <MobileV2Home />
    </FavoritesProvider>
  );
}

export default async function RootPage() {
  // Detect mobile devices via user-agent
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Render mobile version directly (no redirect for SEO)
  if (isMobile) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <MobileHome />
      </Suspense>
    );
  }

  // Desktop users see the store page
  return (
    <StoreLayout>
      <StorePage />
    </StoreLayout>
  );
}
