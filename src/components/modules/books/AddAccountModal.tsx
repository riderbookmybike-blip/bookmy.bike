'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Landmark, CreditCard, Hash, UserCircle, QrCode, Banknote } from 'lucide-react';
import { createBankAccount, updateBankAccount } from '@/actions/accounting';
import { toast } from 'sonner';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tenantId: string;
    initialData?: any;
}

export default function AddAccountModal({ isOpen, onClose, onSuccess, tenantId, initialData }: AddAccountModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bank_name: initialData?.bank_name || '',
        account_number: initialData?.account_number || '',
        ifsc_code: initialData?.ifsc_code || '',
        beneficiary_name: initialData?.beneficiary_name || '',
        account_type: initialData?.account_type || 'BANK',
        is_primary: initialData?.is_primary || false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let res;
            if (initialData?.id) {
                res = await updateBankAccount(initialData.id, tenantId, formData);
            } else {
                res = await createBankAccount({
                    ...formData,
                    tenant_id: tenantId,
                });
            }

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

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            Infrastructure Type
                        </label>
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-full">
                            {[
                                { id: 'BANK', label: 'Bank', icon: Landmark },
                                { id: 'UPI', label: 'UPI / VPA', icon: QrCode },
                                { id: 'VIRTUAL', label: 'E-Collect', icon: Landmark },
                                { id: 'CREDIT_CARD', label: 'Card', icon: CreditCard },
                                { id: 'CASH', label: 'Cash', icon: Banknote },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, account_type: type.id })}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                        formData.account_type === type.id
                                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <type.icon size={16} />
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                {formData.account_type === 'UPI'
                                    ? 'UPI ID (VPA)'
                                    : formData.account_type === 'CREDIT_CARD'
                                      ? 'Card Number (Last 4)'
                                      : formData.account_type === 'VIRTUAL'
                                        ? 'Virtual Account Number'
                                        : 'Account Number'}
                            </label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    required={formData.account_type !== 'CASH'}
                                    value={formData.account_number}
                                    disabled={formData.account_type === 'CASH'}
                                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                    placeholder={
                                        formData.account_type === 'UPI'
                                            ? 'merchant@kotak'
                                            : formData.account_type === 'CREDIT_CARD'
                                              ? 'e.g., 4242'
                                              : 'Account Digits'
                                    }
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 outline-none font-bold text-sm transition-all disabled:opacity-50"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                {formData.account_type === 'UPI' || formData.account_type === 'CREDIT_CARD'
                                    ? 'Network / App (Optional)'
                                    : 'IFSC Identifier'}
                            </label>
                            <div className="relative">
                                <CreditCard
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={14}
                                />
                                <input
                                    required={formData.account_type === 'BANK' || formData.account_type === 'VIRTUAL'}
                                    value={formData.ifsc_code}
                                    disabled={
                                        formData.account_type === 'CASH' ||
                                        formData.account_type === 'UPI' ||
                                        formData.account_type === 'CREDIT_CARD'
                                    }
                                    onChange={e =>
                                        setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })
                                    }
                                    placeholder={
                                        formData.account_type === 'UPI' || formData.account_type === 'CREDIT_CARD'
                                            ? 'N/A'
                                            : 'KKBK000xxxx'
                                    }
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 outline-none font-bold text-sm transition-all disabled:opacity-20"
                                />
                            </div>
                        </div>
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
