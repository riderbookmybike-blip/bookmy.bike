'use client';

import React, { useState } from 'react';
import { X, Building2, MapPin, User, Phone, Loader2, Rocket } from 'lucide-react';
import { onboardDealer } from '@/app/dashboard/dealers/actions';

const formatStudioId = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const digits = upper.replace(/[^0-9]/g, '').slice(0, 2);
    const letter = upper.replace(/[^A-Z]/g, '').slice(0, 1);
    return `${digits}${letter}`;
};

interface OnboardDealerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function OnboardDealerModal({ isOpen, onClose, onSuccess }: OnboardDealerModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        dealerName: '',
        studioId: '',
        pincode: '',
        adminName: '',
        adminPhone: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await onboardDealer(formData);

        if (result.success) {
            onSuccess();
            onClose();
        } else {
            setError(result.error || 'Failed to onboard dealer');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative p-8 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg w-fit">
                            <Rocket size={12} className="text-indigo-600" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Node Expansion</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                            Onboard <span className="text-indigo-600">New Dealer</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Quickly expand your network with a single step onboarding.</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                    {/* Dealer Section */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Dealership Details</label>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Dealership Name"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.dealerName}
                                    onChange={(e) => setFormData({ ...formData, dealerName: e.target.value })}
                                />
                            </div>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Studio ID (Optional)"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.studioId}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        studioId: formatStudioId(e.target.value)
                                    })}
                                />
                            </div>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Regional Pincode"
                                    maxLength={6}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Admin Section */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Primary Administrator</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Admin Name"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                />
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    required
                                    type="tel"
                                    placeholder="Mobile Number"
                                    maxLength={10}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.adminPhone}
                                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider text-center bg-rose-50 dark:bg-rose-500/10 py-2 rounded-lg border border-rose-100 dark:border-rose-500/20">
                            Error: {error}
                        </p>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <>
                                    <span>Deploy Node</span>
                                    <Rocket size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
