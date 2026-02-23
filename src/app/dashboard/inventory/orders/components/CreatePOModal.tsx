'use client';

import React from 'react';
import { Construction } from 'lucide-react';

// TODO: Phase 3 — Rebuild with new inv_dealer_quotes + bundled pricing UI
export default function CreatePOModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    tenantId?: string;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-12 text-center max-w-md border border-slate-200 dark:border-white/5">
                <Construction size={48} className="text-amber-500 mx-auto mb-4" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase">PO Creation — Migrating</h2>
                <p className="text-xs font-bold text-slate-500 mt-2 uppercase">
                    Being rebuilt for INV-001 bundled pricing schema.
                </p>
                <button
                    onClick={onClose}
                    className="mt-6 px-6 py-2 bg-slate-200 dark:bg-white/10 rounded-xl text-xs font-black uppercase"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
