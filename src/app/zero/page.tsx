import Link from 'next/link';

export default function ZeroPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-6xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Zero <span className="text-blue-600">Emissions.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                        The future of riding is electric. Our curated selection of high-performance EVs is coming soon.
                    </p>
                </div>

                <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-xl">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Launching Phase 2</p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all"
                    >
                        Back to Marketplace
                    </Link>
                </div>
            </div>
        </div>
    );
}
