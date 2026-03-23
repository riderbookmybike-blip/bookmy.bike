/**
 * PDP Loading Skeleton
 * Matches the general layout of ProductClient (desktop: side-by-side, mobile: stacked).
 * Eliminates the blank screen during heavy server-side fetches on PDP pages.
 * RES was 30 — this should drastically improve FCP.
 */
export default function PdpLoading() {
    return (
        <div className="min-h-screen bg-[var(--background)] animate-pulse">
            {/* ── Mobile Layout ── */}
            <div className="md:hidden">
                {/* Back button + title bar */}
                <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-black/[0.05] px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <div className="h-3 bg-slate-200 rounded w-16" />
                        <div className="h-4 bg-slate-300 rounded w-40" />
                    </div>
                    <div className="w-8 h-8 bg-slate-100 rounded-full" />
                </div>

                {/* Hero image area */}
                <div className="w-full aspect-[4/3] bg-slate-100 relative">
                    {/* Color swatches bottom-left */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-7 h-7 bg-slate-200 rounded-full" />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 py-5 space-y-4">
                    {/* Model name + brand */}
                    <div className="space-y-1">
                        <div className="h-3 bg-slate-200 rounded w-16" />
                        <div className="h-6 bg-slate-300 rounded w-56" />
                    </div>

                    {/* Price card */}
                    <div className="rounded-2xl bg-slate-100 p-4 flex justify-between items-center">
                        <div className="space-y-1.5">
                            <div className="h-2 bg-slate-200 rounded w-20" />
                            <div className="h-6 bg-slate-300 rounded w-32" />
                        </div>
                        <div className="h-10 w-28 bg-slate-200 rounded-xl" />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-slate-100 pb-2">
                        {[80, 64, 72, 56].map((w, i) => (
                            <div key={i} className={`h-7 bg-slate-100 rounded-full`} style={{ width: w }} />
                        ))}
                    </div>

                    {/* Spec grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                                <div className="h-2 bg-slate-200 rounded w-16" />
                                <div className="h-4 bg-slate-300 rounded w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Desktop Layout ── */}
            <div className="hidden md:flex max-w-[1440px] mx-auto px-6 py-8 gap-8">
                {/* Left — image gallery */}
                <div className="w-[55%] space-y-4">
                    <div className="aspect-[4/3] bg-slate-100 rounded-3xl" />
                    {/* Thumbnail strip */}
                    <div className="flex gap-3">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-20 h-16 bg-slate-100 rounded-xl" />
                        ))}
                    </div>
                </div>

                {/* Right — product info */}
                <div className="flex-1 space-y-6 py-2">
                    {/* Brand + Model */}
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-20" />
                        <div className="h-8 bg-slate-300 rounded-lg w-64" />
                        <div className="h-4 bg-slate-200 rounded w-40" />
                    </div>

                    {/* Color swatches */}
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 bg-slate-200 rounded-full" />
                        ))}
                    </div>

                    {/* Price + CTA */}
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-4">
                        <div className="flex justify-between">
                            <div className="space-y-1.5">
                                <div className="h-3 bg-slate-200 rounded w-24" />
                                <div className="h-7 bg-slate-300 rounded-lg w-36" />
                            </div>
                            <div className="space-y-1.5 items-end flex flex-col">
                                <div className="h-3 bg-slate-200 rounded w-24" />
                                <div className="h-7 bg-slate-300 rounded-lg w-32" />
                            </div>
                        </div>
                        <div className="h-12 bg-slate-200 rounded-2xl w-full" />
                    </div>

                    {/* Spec tiles */}
                    <div className="grid grid-cols-3 gap-3">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1.5">
                                <div className="h-2 bg-slate-200 rounded w-14" />
                                <div className="h-4 bg-slate-300 rounded w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
