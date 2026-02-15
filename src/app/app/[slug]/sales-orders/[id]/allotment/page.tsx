'use client';

import React from 'react';
import { Truck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SalesOrderAllotmentPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-xl shadow-indigo-500/10 border border-indigo-500/20">
                <Truck size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                    Vehicle Allotment
                </h2>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2 px-12 opacity-60">
                    Assign Frame, Motor, and Battery numbers to this sales order.
                </p>
            </div>
            <Button className="bg-slate-900 dark:bg-white dark:text-black rounded-2xl px-8 h-12 text-[10px] font-black uppercase tracking-widest gap-2 group">
                Scan QR / Map Vehicle{' '}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
    );
}
