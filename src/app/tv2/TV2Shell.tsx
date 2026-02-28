'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function TV2Shell({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const html = document.documentElement;
        const prevDevice = html.dataset.device;
        const prevTv = html.dataset.tv;

        html.dataset.device = 'desktop';
        html.dataset.tv = '1';

        return () => {
            if (prevDevice) html.dataset.device = prevDevice;
            else delete html.dataset.device;

            if (prevTv) html.dataset.tv = prevTv;
            else delete html.dataset.tv;
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="page-container pt-4 pb-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-black uppercase tracking-wider text-slate-900">TV2 Test Shell</p>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/tv2/home"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700"
                        >
                            Home
                        </Link>
                        <Link
                            href="/tv2/catalog"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700"
                        >
                            Catalog
                        </Link>
                        <Link
                            href="/tv2/pdp"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700"
                        >
                            PDP
                        </Link>
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
}
