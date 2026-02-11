'use client';

import React, { useState } from 'react';
import { Rocket } from 'lucide-react';
import { revalidateCatalog } from '@/actions/revalidateCatalog';
import { toast } from 'sonner';

export default function PublishStep({ onFinish }: any) {
    const [isPublishing, setIsPublishing] = useState(false);

    return (
        <div className="max-w-3xl mx-auto py-16 space-y-12 animate-in fade-in zoom-in-95 duration-700 text-center">
            <div className="relative">
                <div className="w-32 h-32 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 animate-bounce">
                    <Rocket size={64} />
                </div>
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl -z-10 rounded-full scale-150" />
            </div>

            <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter font-display leading-none">
                    Ready for Liftoff?
                </h2>
                <p className="text-slate-500 dark:text-slate-300 font-bold uppercase tracking-widest text-sm">
                    Your product catalog is configured and verified.
                </p>
            </div>

            <div className="bg-slate-900 dark:bg-white/5 p-12 rounded-[3rem] text-center space-y-8 shadow-2xl border border-slate-100 dark:border-white/10">
                <div className="space-y-2">
                    <p className="text-white/60 font-black uppercase tracking-[0.2em] text-xs">Final Action</p>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">
                        Publish to Live Catalog
                    </h3>
                </div>

                <button
                    onClick={async () => {
                        if (isPublishing) return;
                        setIsPublishing(true);
                        const result = await revalidateCatalog();
                        if (!result?.success) {
                            toast.error(result?.error || 'Catalog refresh failed');
                        } else {
                            toast.success('Catalog refreshed');
                        }
                        setIsPublishing(false);
                        onFinish();
                    }}
                    className="w-full py-6 bg-white dark:bg-white text-slate-900 hover:bg-emerald-400 hover:text-black rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] hover:scale-105 transition-all shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isPublishing}
                >
                    {isPublishing ? 'Publishing…' : 'Launch Product'}
                </button>

                <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest">
                    This action will sync all configurations to the database.
                </p>
            </div>
        </div>
    );
}
