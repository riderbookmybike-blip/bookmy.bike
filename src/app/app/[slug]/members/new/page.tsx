'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { ChevronLeft } from 'lucide-react';

export default function NewMemberPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const router = useRouter();

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#f3f4f6] dark:bg-[#08090a] overflow-hidden p-8">
            <div className="max-w-3xl mx-auto w-full space-y-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ChevronLeft size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Back to Registry</span>
                </button>

                <div className="bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-12 text-center space-y-6 shadow-sm">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">New Identity Entry</h1>
                    <p className="text-slate-500 max-w-sm mx-auto">Manual identity creation is currently being bridged. Please use the automated lead conversion pipeline for now.</p>
                </div>
            </div>
        </div>
    );
}
