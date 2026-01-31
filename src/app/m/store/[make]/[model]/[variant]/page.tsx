import { MobilePDPCarousel } from '@/components/mobile/pdp/MobilePDPCarousel';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/actions/getProductBySlug';

interface PageProps {
    params: Promise<{
        make: string;
        model: string;
        variant: string;
    }>;
}

export default async function MobilePDPPage({ params }: PageProps) {
    const resolvedParams = await params;

    // Fetch actual product data from Supabase
    const product = await getProductBySlug(
        resolvedParams.make,
        resolvedParams.model,
        resolvedParams.variant
    );

    if (!product) {
        notFound();
    }

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
