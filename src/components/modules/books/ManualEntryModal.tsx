'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { IndianRupee, ArrowUpRight, ArrowDownLeft, Calendar, FileText, CreditCard } from 'lucide-react';
import { addManualTransaction } from '@/actions/accounting';
import { toast } from 'sonner';

interface ManualEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tenantId: string;
    bankAccountId?: string;
}

export default function ManualEntryModal({
    isOpen,
    onClose,
    onSuccess,
    tenantId,
    bankAccountId,
}: ManualEntryModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'INFLOW' as 'INFLOW' | 'OUTFLOW',
        amount: '',
        method: 'CASH',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || isNaN(Number(formData.amount))) {
            toast.error('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            const res = await addManualTransaction({
                tenant_id: tenantId,
                type: formData.type,
                amount: Number(formData.amount),
                method: formData.method,
                description: formData.description,
                date: formData.date,
                bank_account_id: bankAccountId,
            });

            if (res.success) {
                toast.success('Transaction recorded successfully');
                onSuccess();
                onClose();
            } else {
                toast.error(res.error || 'Failed to record transaction');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manual Ledger Entry" size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction Type Selector */}
                <div className="flex gap-4 p-1.5 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'INFLOW' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                            formData.type === 'INFLOW'
                                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xl italic'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <ArrowDownLeft size={14} className={formData.type === 'INFLOW' ? 'animate-bounce' : ''} />
                        Capital Inflow
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'OUTFLOW' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                            formData.type === 'OUTFLOW'
                                ? 'bg-white dark:bg-rose-600 text-rose-600 dark:text-white shadow-xl italic'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <ArrowUpRight size={14} className={formData.type === 'OUTFLOW' ? 'animate-bounce' : ''} />
                        Expense Outflow
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Amount Input */}
                    <div className="relative group text-center py-8">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">
                            Transaction Value
                        </label>
                        <div className="relative inline-block">
                            <IndianRupee
                                className="absolute -left-10 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/10"
                                size={32}
                            />
                            <input
                                required
                                autoFocus
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-transparent text-5xl font-black text-slate-900 dark:text-white text-center outline-none tracking-tighter italic placeholder:text-slate-200 dark:placeholder:text-white/5"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                Entry Date
                            </label>
                            <div className="relative">
                                <Calendar
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={14}
                                />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 outline-none font-bold text-sm transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                Payment Instrument
                            </label>
                            <div className="relative">
                                <CreditCard
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={14}
                                />
                                <select
                                    value={formData.method}
                                    onChange={e => setFormData({ ...formData, method: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 outline-none font-bold text-[10px] uppercase tracking-widest transition-all appearance-none"
                                >
                                    <option value="CASH">CASH</option>
                                    <option value="UPI">UPI</option>
                                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                                    <option value="CHEQUE">CHEQUE</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                            Ledger Description
                        </label>
                        <div className="relative">
                            <FileText
                                className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                                size={18}
                            />
                            <textarea
                                required
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Purpose of this transaction..."
                                rows={3}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-indigo-600 dark:focus:border-indigo-400 outline-none font-bold text-sm transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-8 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex-[2] px-8 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl active:scale-95 disabled:opacity-50 italic ${
                            formData.type === 'INFLOW'
                                ? 'bg-indigo-600 shadow-indigo-500/20'
                                : 'bg-rose-600 shadow-rose-500/20'
                        }`}
                    >
                        {loading ? 'Committing...' : `Commit ${formData.type === 'INFLOW' ? 'Inflow' : 'Outflow'} →`}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
