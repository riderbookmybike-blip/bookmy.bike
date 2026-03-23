import { CatalogGridSkeleton } from '@/components/store/CatalogSkeleton';

/**
 * Store Home Loading Skeleton
 * Shown during the fetchCatalogV2 server-side fetch.
 * Prevents blank screen FCP penalty on the high-traffic /store route.
 */
export default function StoreLoading() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Hero/Header Skeleton */}
            <div className="w-full h-[52px] bg-white border-b border-black/[0.05] animate-pulse" />

            {/* Grid Skeleton */}
            <main className="max-w-[1440px] mx-auto px-4 md:px-6 py-6">
                <CatalogGridSkeleton count={9} />
            </main>
        </div>
    );
}
