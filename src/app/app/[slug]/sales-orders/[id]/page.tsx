'use client';

import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SalesOrderOverviewPage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[3rem] p-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">
                        Order Summary
                    </h2>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest opacity-60">
                        This order is currently in the booking stage. Complete finance and payment to proceed to
                        allotment.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all cursor-pointer group">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            Customer Profile
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                View Details
                            </span>
                            <ArrowRight
                                size={14}
                                className="text-slate-300 group-hover:text-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all cursor-pointer group">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            Vehicle Specifications
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Technical Specs
                            </span>
                            <ArrowRight
                                size={14}
                                className="text-slate-300 group-hover:text-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">
                            Next Step
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-6">
                            Process Finance
                        </h3>
                        <Button className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-2xl h-14 font-black uppercase tracking-widest text-xs gap-2">
                            Get Started <ArrowRight size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
