export default function MarketplacePdpConcept() {
    return (
        <div
            className="min-h-screen bg-white text-slate-900"
            style={{ fontFamily: '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace' }}
        >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(37,99,235,0.12),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(15,23,42,0.12),transparent_55%)]" />

            <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 flex items-center justify-center font-black">B</div>
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-700">Product detail</p>
                        <p className="text-xs font-semibold text-slate-400">Transparency view</p>
                    </div>
                </div>
                <button className="rounded-full border border-slate-300 px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-700">Share</button>
            </header>

            <main className="mx-auto w-full max-w-6xl px-6 pb-16">
                <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="h-80 rounded-3xl bg-slate-100" />
                        <div className="mt-6 flex gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-16 w-20 rounded-2xl bg-slate-100" />
                            ))}
                        </div>
                        <div className="mt-8 space-y-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">TVS</p>
                                <h1 className="text-4xl font-black uppercase text-slate-900">Jupiter SmartX</h1>
                                <p className="text-sm font-semibold text-slate-500">Disc | Smart connect | 125cc</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                {['Range', 'Mileage', 'Warranty'].map((label) => (
                                    <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                                        <p className="text-lg font-black">42 kmpl</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">On road price</p>
                            <p className="mt-2 text-3xl font-black">Rs 92,800</p>
                            <p className="mt-2 text-sm font-semibold text-slate-500">Includes RTO + insurance</p>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-slate-200 bg-blue-50 px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">EMI</p>
                                    <p className="text-lg font-black">Rs 2,890</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tenure</p>
                                    <p className="text-lg font-black">36 mo</p>
                                </div>
                            </div>
                            <button className="mt-6 w-full rounded-full bg-blue-700 px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-white">
                                Get quote
                            </button>
                        </div>

                        <div className="rounded-3xl border border-blue-700 bg-blue-700 p-6 text-white">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Financing partners</p>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-black uppercase tracking-widest text-blue-100">
                                <span>HDFC</span>
                                <span>Bajaj</span>
                                <span>IDFC</span>
                                <span>TVS</span>
                            </div>
                            <button className="mt-6 w-full rounded-full border border-white/30 px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-white">
                                Check eligibility
                            </button>
                        </div>
                    </aside>
                </div>

                <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6">
                        <h2 className="text-2xl font-black uppercase text-slate-900">Price breakup</h2>
                        <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
                            {[
                                ['Ex showroom', 'Rs 78,000'],
                                ['Insurance', 'Rs 4,200'],
                                ['RTO', 'Rs 8,100'],
                                ['Accessories', 'Rs 2,500']
                            ].map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span>{label}</span>
                                    <span className="font-black text-slate-900">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-6">
                        <h2 className="text-2xl font-black uppercase text-slate-900">Delivery and policies</h2>
                        <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
                            <p>Delivery in 48 hours for metro cities.</p>
                            <p>Refund initiated within 24 hours, reflects in 3 days.</p>
                            <p>All documents verified before allocation.</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
