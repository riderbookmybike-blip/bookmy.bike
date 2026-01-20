'use client';

import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';

interface AddAccessoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddAccessoryModal({ isOpen, onClose }: AddAccessoryModalProps) {
    const router = useRouter();
    const { tenantSlug } = useTenant();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-white/5">
                <div className="p-12 text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-indigo-600/10 flex items-center justify-center mx-auto">
                        <Plus className="text-indigo-600" size={40} />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Initiate New Accessory</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs max-w-md mx-auto leading-relaxed">
                            You are about to enter the <span className="text-indigo-600">Accessory Studio</span> environment to create a high-fidelity catalog entry for Gear, Parts, or Merchandise.
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
                                router.push(tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/accessories/studio` : '/dashboard/catalog/accessories/studio');
                                onClose();
                            }}
                            className="flex-[2] px-8 py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3 italic"
                        >
                            Enter Studio Environment <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
