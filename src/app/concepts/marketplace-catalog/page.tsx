export default function MarketplaceCatalogConcept() {
    return (
        <div
            className="min-h-screen bg-white text-slate-900"
            style={{ fontFamily: '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace' }}
        >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(37,99,235,0.12),transparent_45%),radial-gradient(circle_at_88%_0%,rgba(15,23,42,0.12),transparent_55%)]" />

            <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 flex items-center justify-center font-black">B</div>
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-700">Catalog</p>
                        <p className="text-xs font-semibold text-slate-400">Live inventory</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="rounded-full border border-slate-300 px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-700">Filters</button>
                    <button className="rounded-full bg-blue-700 px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-white">Compare</button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-6 pb-16">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Catalog</p>
                        <h1 className="text-3xl font-black uppercase text-slate-900">72 matches</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                        <button className="rounded-full bg-blue-700 px-4 py-2 text-white">Popular</button>
                        <button className="rounded-full border border-slate-200 px-4 py-2">Price</button>
                        <button className="rounded-full border border-slate-200 px-4 py-2">EMI</button>
                        <button className="rounded-full border border-slate-200 px-4 py-2">Range</button>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Search</p>
                            <input
                                placeholder="Find model"
                                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium"
                            />
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Price</p>
                            <div className="flex justify-between text-sm font-semibold text-slate-600">
                                <span>Rs 45k</span>
                                <span>Rs 1.8L</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                                <div className="h-2 w-1/2 rounded-full bg-blue-600" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Segments</p>
                            {['Scooter', 'Bike', 'EV', 'Commuter'].map((segment) => (
                                <label key={segment} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                                    {segment}
                                </label>
                            ))}
                        </div>
                        <button className="w-full rounded-full border border-slate-300 px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-slate-700">
                            Clear filters
                        </button>
                    </aside>

                    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {['Jupiter SmartX', 'Activa 125', 'Access 125', 'Ntorq 150', 'Chetak EV', 'Avenis'].map((item) => (
                            <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="h-36 rounded-2xl bg-slate-100" />
                                <div className="mt-4 flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-black uppercase text-slate-900">{item}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Best seller</p>
                                    </div>
                                    <div className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">4.8</div>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">On road</p>
                                        <p className="text-lg font-black">Rs 92,000</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">EMI</p>
                                        <p className="text-lg font-black">Rs 2,890</p>
                                    </div>
                                </div>
                                <button className="mt-4 w-full rounded-full bg-blue-700 px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-white">
                                    Get quote
                                </button>
                            </div>
                        ))}
                    </section>
                </div>
            </main>
        </div>
    );
}
