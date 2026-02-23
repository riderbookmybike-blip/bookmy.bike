'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Construction } from 'lucide-react';

// TODO: Phase 3 — Rebuild with new inv_requests schema + inv_request_items
export default function RequisitionDetailPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-96 gap-6 text-center">
            <div className="p-4 bg-amber-500/10 rounded-3xl">
                <Construction size={48} className="text-amber-500" />
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Request Detail — Migrating
                </h2>
                <p className="text-xs font-bold text-slate-500 uppercase mt-2 max-w-sm">
                    Being rebuilt for the new INV-001 schema with bundled pricing, cost components, and auto-variance.
                </p>
            </div>
            <button
                onClick={() => router.push('/dashboard/inventory/requisitions')}
                className="flex items-center gap-2 text-sm font-bold text-indigo-500 hover:underline"
            >
                <ArrowLeft size={16} /> Back to Requests
            </button>
        </div>
    );
}
