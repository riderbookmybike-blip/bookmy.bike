export default function MarketplaceLandingConcept() {
    return (
        <div
            className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            style={{ fontFamily: '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace' }}
        >
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(37,99,235,0.12),transparent_45%),radial-gradient(circle_at_100%_0%,rgba(15,23,42,0.12),transparent_55%)]" />
                <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.2),transparent_65%)]" />

                <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 flex items-center justify-center font-black">B</div>
                        <div className="leading-none">
                            <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-700">BookMyBike</p>
                            <p className="text-xs font-semibold text-slate-400">Enterprise Marketplace</p>
                        </div>
                    </div>
                    <nav className="hidden items-center gap-6 text-xs font-black uppercase tracking-[0.25em] text-slate-500 md:flex">
                        <a className="hover:text-blue-700" href="#catalog">Catalog</a>
                        <a className="hover:text-blue-700" href="#process">Process</a>
                        <a className="hover:text-blue-700" href="#trust">Trust</a>
                        <a className="hover:text-blue-700" href="#policies">Policies</a>
                    </nav>
                    <button className="rounded-full border border-slate-300 dark:border-white/20 px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-200">
                        Sign in
                    </button>
                </header>

                <section className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 pb-16 pt-4 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-700">
                            Verified supply + financing network
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 md:text-6xl">
                            Precision logistics for two-wheelers
                            <span className="block text-blue-700">across India</span>
                        </h1>
                        <p className="max-w-xl text-base font-medium text-slate-600 md:text-lg">
                            Enterprise-grade marketplace with live inventory, lender-ready documentation, and transparent
                            pricing. Built to convert on mobile and convince on desktop.
                        </p>
                        <div className="flex flex-col gap-4 md:flex-row">
                            <button className="rounded-full bg-blue-700 px-8 py-4 text-xs font-black uppercase tracking-[0.3em] text-white">
                                Explore catalog
                            </button>
                            <button className="rounded-full border border-slate-300 dark:border-white/20 px-8 py-4 text-xs font-black uppercase tracking-[0.3em] text-slate-700 dark:text-slate-200">
                                Schedule a call
                            </button>
                        </div>
                        <div className="grid max-w-xl grid-cols-3 gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 text-center">
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">12k+</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bookings</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">48 hrs</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg delivery</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">3 days</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Refund TAT</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="rounded-[28px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-[0_40px_80px_-60px_rgba(15,23,42,0.45)]">
                            <div className="rounded-3xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 p-6 text-slate-900 dark:text-white">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-700">Instant quote</p>
                                <h3 className="mt-2 text-2xl font-black uppercase">Jupiter SmartX</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Live on-road pricing with EMI clarity</p>
                                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                                    <div className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-slate-900 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">On road</p>
                                        <p className="text-xl font-black">Rs 92,800</p>
                                    </div>
                                    <div className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-slate-900 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">EMI</p>
                                        <p className="text-xl font-black">Rs 2,890</p>
                                    </div>
                                </div>
                                <button className="mt-6 w-full rounded-full bg-blue-700 px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-white">
                                    Get quote
                                </button>
                            </div>
                            <div className="mt-6 space-y-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                <p>Verified dealers</p>
                                <p>Insurance + RTO included</p>
                                <p>24x7 WhatsApp support</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section id="trust" className="mx-auto w-full max-w-6xl px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-6 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Trusted by</p>
                    <div className="flex flex-wrap items-center gap-6 text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                        <span>Honda</span>
                        <span>TVS</span>
                        <span>Bajaj</span>
                        <span>Hero</span>
                        <span>Suzuki</span>
                        <span>NBFC</span>
                    </div>
                </div>
            </section>

            <section id="process" className="mx-auto w-full max-w-6xl px-6 py-12">
                <div className="grid gap-8 md:grid-cols-3">
                    {[
                        { title: 'Discover', text: 'Compare inventory, pricing, and EMI options.' },
                        { title: 'Book', text: 'Confirm availability, upload KYC, reserve instantly.' },
                        { title: 'Deliver', text: 'Dealer allocation, tracking, and documentation.' }
                    ].map((step, index) => (
                        <div key={step.title} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-700">Step 0{index + 1}</p>
                            <h3 className="mt-4 text-2xl font-black uppercase text-slate-900 dark:text-white">{step.title}</h3>
                            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">{step.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="catalog" className="mx-auto w-full max-w-6xl px-6 py-12">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Featured</p>
                        <h2 className="text-3xl font-black uppercase text-slate-900">High-demand scooters</h2>
                    </div>
                    <button className="rounded-full border border-slate-300 dark:border-white/20 px-6 py-2 text-xs font-black uppercase tracking-[0.3em] text-slate-700 dark:text-slate-200">
                        View all
                    </button>
                </div>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                    {['Jupiter', 'Activa', 'Access'].map((bike) => (
                        <div key={bike} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <div className="h-36 rounded-2xl bg-slate-100" />
                            <h3 className="mt-4 text-xl font-black uppercase text-slate-900 dark:text-white">{bike}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">From Rs 2,400 EMI</p>
                            <button className="mt-4 w-full rounded-full bg-blue-700 px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-white">
                                Get quote
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section id="policies" className="mx-auto w-full max-w-6xl px-6 py-12">
                <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Compliance ready</p>
                        <h3 className="mt-4 text-3xl font-black uppercase text-slate-900 dark:text-white">Policy clarity</h3>
                        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            GST invoicing, refund timelines, data privacy, and KYC guidelines are clear at every step.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            {['Refund policy', 'Privacy policy', 'Terms', 'KYC checklist'].map((item) => (
                                <span key={item} className="rounded-full border border-slate-200 dark:border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-3xl border border-blue-700 bg-blue-700 p-8 text-white">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Partner with us</p>
                        <h3 className="mt-4 text-3xl font-black uppercase">OEMs and NBFCs</h3>
                        <p className="mt-4 text-sm text-blue-100">Dedicated partner dashboard with lead flow, SLA, and compliance tracking.</p>
                        <button className="mt-6 w-full rounded-full bg-white dark:bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-blue-700">
                            Schedule a call
                        </button>
                    </div>
                </div>
            </section>

            <footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 py-10">
                <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>BookMyBike 2026</span>
                    <span>Contact: partnerships@bookmybike</span>
                </div>
            </footer>
        </div>
    );
}
