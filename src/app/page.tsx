import { headers } from 'next/headers';
import { Suspense } from 'react';
import StorePage from './store/page';
import StoreLayout from './store/layout';
import { MobileContextFeed } from '@/components/mobile/feed/MobileContextFeed';
import { MobileBottomNav } from '@/components/mobile/layout/MobileBottomNav';
import { FavoritesProvider } from '@/contexts/FavoritesContext';

function MobileHome() {
  return (
    <FavoritesProvider>
      <div className="bg-black min-h-screen">
        <MobileContextFeed />
        <MobileBottomNav />
      </div>
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
