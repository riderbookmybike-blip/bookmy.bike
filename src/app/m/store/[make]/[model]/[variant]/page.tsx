import { MobilePDPCarousel } from '@/components/mobile/pdp/MobilePDPCarousel';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { Suspense } from 'react';

interface PageProps {
    params: Promise<{
        make: string;
        model: string;
        variant: string;
    }>;
}

export default async function MobilePDPPage({ params }: PageProps) {
    const resolvedParams = await params;

    // TODO: Fetch actual product data from Supabase
    const product = {
        id: `${resolvedParams.make}-${resolvedParams.model}-${resolvedParams.variant}`,
        make: resolvedParams.make,
        model: resolvedParams.model,
        variant: resolvedParams.variant,
        slug: `${resolvedParams.make}-${resolvedParams.model}-${resolvedParams.variant}`,
    };

    return (
        <Suspense fallback={
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        }>
            <FavoritesProvider>
                <MobilePDPCarousel product={product} />
            </FavoritesProvider>
        </Suspense>
    );
}
