'use client';

import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    itemName
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    title: string,
    message: string,
    itemName?: string
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 text-left">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl uppercase italic text-slate-900 dark:text-white leading-none">{title}</h3>
                            <div className="h-1 w-8 bg-red-500 mt-2 rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {message}
                    </p>
                    {itemName && (
                        <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/10">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Deleting Item</span>
                            <span className="font-black text-lg text-slate-900 dark:text-white uppercase italic">{itemName}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/10 flex items-center justify-center gap-2"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
