import { CatalogGridSkeleton } from '@/components/store/CatalogSkeleton';

/**
 * Catalog Loading Skeleton
 * Shown by Next.js during server-side data fetch (fetchCatalogV2).
 * Eliminates the blank white screen that was causing poor FCP scores.
 */
export default function CatalogLoading() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Filter Bar Skeleton */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-black/[0.05] px-4 md:px-6 py-3">
                <div className="max-w-[1440px] mx-auto flex items-center gap-3 animate-pulse">
                    {/* Search skeleton */}
                    <div className="h-10 bg-slate-100 rounded-full flex-1 max-w-xs" />
                    {/* Filter chips */}
                    <div className="flex gap-2 overflow-hidden">
                        {[80, 64, 72, 56].map((w, i) => (
                            <div key={i} className={`h-8 w-[${w}px] bg-slate-100 rounded-full`} />
                        ))}
                    </div>
                    {/* Sort button */}
                    <div className="h-8 w-20 bg-slate-100 rounded-full ml-auto hidden md:block" />
                </div>
            </div>

            {/* Grid Skeleton */}
            <main className="max-w-[1440px] mx-auto px-4 md:px-6 py-6">
                <CatalogGridSkeleton count={9} />
            </main>
        </div>
    );
}
