'use client';

import React from 'react';
import { Construction } from 'lucide-react';

// TODO: Phase 3 — Rebuild with new inv_dealer_quotes bundled pricing comparison
export default function QuotePanel({
    item,
    tenantId,
    onRefresh,
}: {
    item: any;
    tenantId: string;
    onRefresh: () => void;
}) {
    return (
        <div className="mt-3 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-center">
            <Construction size={24} className="text-amber-500 mx-auto mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Quote Panel — Migrating to INV-001 bundled pricing
            </p>
        </div>
    );
}
