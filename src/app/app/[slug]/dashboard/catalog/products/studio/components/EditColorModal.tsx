'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function EditColorModal({
    isOpen,
    onClose,
    onSave,
    initialName,
    initialStatus,
    existingNames,
    l2Label,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newName: string, newStatus: string) => void;
    initialName: string;
    initialStatus?: string;
    existingNames: string[];
    l2Label: string;
}) {
    const [name, setName] = useState(initialName);
    const [status, setStatus] = useState(initialStatus || 'INACTIVE');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setName(initialName);
        setStatus(initialStatus || 'INACTIVE');
    }, [initialName, initialStatus]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        // If name hasn't changed, just close
        if (trimmedName.toLowerCase() === initialName.toLowerCase()) {
            onClose();
            return;
        }

        if (existingNames.some(n => n.toLowerCase() === trimmedName.toLowerCase())) {
            setError(`Color "${trimmedName}" already exists.`);
            return;
        }

        onSave(trimmedName, status);
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 text-left">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-2xl uppercase italic text-slate-900 dark:text-white leading-none">
                            Edit {l2Label}
                        </h3>
                        <div className="h-1 w-12 bg-indigo-500 mt-2 rounded-full" />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors"
                    >
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                            Full Color Name
                        </label>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            placeholder="e.g. Matte Black..."
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/10 rounded-2xl font-bold text-xl outline-none focus:border-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                        {error && (
                            <p className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1.5">
                                <AlertCircle size={12} /> {error}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 disabled:opacity-20 disabled:grayscale transition-all shadow-xl shadow-slate-900/10"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
