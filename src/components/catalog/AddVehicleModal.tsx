'use client';

import React, { useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AddVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddVehicleModal({ isOpen, onClose, onSuccess }: AddVehicleModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-white/5">
                <div className="p-12 text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-blue-600/10 flex items-center justify-center mx-auto">
                        <Plus className="text-blue-600" size={40} />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Initiate New SKU</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs max-w-md mx-auto leading-relaxed">
                            You are about to enter the <span className="text-blue-600">Vehicle Studio</span> environment to create a high-fidelity hierarchical catalog entry.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-8 py-5 rounded-[2rem] bg-slate-100 dark:bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                router.push('/dashboard/catalog/vehicles/studio');
                                onClose();
                            }}
                            className="flex-[2] px-8 py-5 rounded-[2rem] bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3 italic"
                        >
                            Enter Studio Environment <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
