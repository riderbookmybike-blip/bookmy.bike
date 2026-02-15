'use client';

import React from 'react';
import { CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SalesOrderReceiptPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10 border border-emerald-500/20">
                <CreditCard size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                    Receipts & Payments
                </h2>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2 px-12 opacity-60">
                    Manage accounts receivables, collections, and settlement reconciliation.
                </p>
            </div>
            <Button className="bg-slate-900 dark:bg-white dark:text-black rounded-2xl px-8 h-12 text-[10px] font-black uppercase tracking-widest gap-2 group">
                View Transactions <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
    );
}
