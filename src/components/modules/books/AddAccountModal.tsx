'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Landmark, CreditCard, Hash, UserCircle } from 'lucide-react';
import { createBankAccount } from '@/actions/accounting';
import { toast } from 'sonner';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tenantId: string;
}

export default function AddAccountModal({ isOpen, onClose, onSuccess, tenantId }: AddAccountModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        beneficiary_name: '',
        account_type: 'SAVINGS',
        is_primary: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await createBankAccount({
                ...formData,
                tenant_id: tenantId,
            });

            if (res.success) {
                toast.success('Bank account added successfully');
                onSuccess();
                onClose();
            } else {
                toast.error(res.error || 'Failed to add bank account');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configure Bank Infrastructure" size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                            Bank Entity Name
                        </label>
                        <div className="relative">
                            <Landmark
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                                size={18}
                            />
                            <input
                                required
                                value={formData.bank_name}
                                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                placeholder="e.g. HDFC Bank"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 dark:focus:border-indigo-400 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                Account Number
                            </label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    required
                                    value={formData.account_number}
                                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 outline-none font-bold text-sm transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                IFSC Identifier
                            </label>
                            <div className="relative">
                                <CreditCard
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={14}
                                />
                                <input
                                    required
                                    value={formData.ifsc_code}
                                    onChange={e =>
                                        setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })
                                    }
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 outline-none font-bold text-sm transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                            Beneficiary Display Name
                        </label>
                        <div className="relative">
                            <UserCircle
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                                size={18}
                            />
                            <input
                                required
                                value={formData.beneficiary_name}
                                onChange={e => setFormData({ ...formData, beneficiary_name: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 dark:focus:border-indigo-400 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                Account Type
                            </label>
                            <select
                                value={formData.account_type}
                                onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 outline-none font-bold text-xs"
                            >
                                <option value="SAVINGS">SAVINGS</option>
                                <option value="CURRENT">CURRENT</option>
                                <option value="CASH">CASH</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <input
                                type="checkbox"
                                checked={formData.is_primary}
                                onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-600"
                            />
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                                Set as Primary
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-8 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Registering...' : 'Register Infrastructure'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
