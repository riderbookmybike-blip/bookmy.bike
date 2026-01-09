'use client';

import React, { useState } from 'react';
import { X, Loader2, ShoppingBag, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AddBrandModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (brandName: string) => void;
}

export default function AddBrandModal({ isOpen, onClose, onSuccess }: AddBrandModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        landingUrl: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();

            // Create a placeholder item for the brand to ensure it shows up in the catalog
            const { error } = await supabase.from('items').insert([{
                type: 'VEHICLE',
                make: formData.name,
                model: 'BASE-ENTRY', // Placeholder
                variant: 'STANDARD', // Placeholder
                color: 'STOCK', // Placeholder
                price: 0,
                specs: {
                    landingUrl: formData.landingUrl
                },
                is_active: true
            }]);

            if (error) throw error;

            onSuccess(formData.name);
            onClose();
            setFormData({ name: '', landingUrl: '' });

        } catch (error: any) {
            console.error('Error adding brand:', error);
            alert('Failed to add brand: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                    <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1 italic">Structural Inventory</p>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Register Brand</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Brand Identity (Make)</label>
                            <input
                                required
                                autoFocus
                                placeholder="e.g. HONDA, TVS, HERO"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl font-black focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase tracking-tight text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Brand Landing Page URL</label>
                            <div className="relative">
                                <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    placeholder="https://www.honda2wheelers.com"
                                    value={formData.landingUrl}
                                    onChange={e => setFormData({ ...formData, landingUrl: e.target.value })}
                                    className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 px-1">Official manufacturer website for reference</p>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name}
                            className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all border border-white/10"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <ShoppingBag size={16} />}
                            Initialize Brand
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
