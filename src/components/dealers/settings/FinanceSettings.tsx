'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle, AlertOctagon, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FinanceSettingsProps {
    dealerId: string;
}

export default function FinanceSettings({ dealerId }: FinanceSettingsProps) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAccounts = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
            .from('id_bank_accounts')
            .select('*')
            .eq('tenant_id', dealerId)
            .order('is_primary', { ascending: false });

        if (data) setAccounts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchAccounts();
    }, [dealerId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this bank account?')) return;
        const supabase = createClient();
        await supabase.from('id_bank_accounts').delete().eq('id', id);
        fetchAccounts();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Financial Setup</h3>
                    <p className="text-sm text-slate-500">Manage bank accounts for payouts and settlements.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={16} />
                    ADD BANK ACCOUNT
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Loading accounts...</div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                    <CreditCard className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">No bank accounts linked</p>
                    <p className="text-xs text-slate-500 mt-1">Add a primary account for settlements.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map((acc) => (
                        <div key={acc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                            {acc.is_primary && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-bl-xl shadow-sm">
                                    PRIMARY
                                </div>
                            )}

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{acc.bank_name}</h4>
                                    <p className="text-xs text-slate-500 font-medium">IFSC: {acc.ifsc_code}</p>
                                </div>
                            </div>

                            <div className="space-y-1 mb-4">
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Account Number</p>
                                <p className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                                    •••• •••• {acc.account_number.slice(-4)}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    {acc.is_verified ? (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                            <CheckCircle size={14} /> Verified
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                                            <AlertOctagon size={14} /> Verification Pending
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(acc.id)}
                                    className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <BankAccountModal
                    dealerId={dealerId}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => { setIsModalOpen(false); fetchAccounts(); }}
                />
            )}
        </div>
    );
}

function BankAccountModal({ dealerId, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        account_number: '',
        ifsc_code: '',
        bank_name: '',
        beneficiary_name: '',
        account_type: 'CURRENT'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();

        try {
            const { error } = await supabase.from('id_bank_accounts').insert({
                ...formData,
                tenant_id: dealerId,
                is_verified: false, // Explicitly false initially
                is_primary: false // Logic to make first one primary can be added
            });

            if (error) throw error;
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to add bank account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Bank Account</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Beneficiary Name</label>
                        <input
                            required
                            value={formData.beneficiary_name}
                            onChange={e => setFormData({ ...formData, beneficiary_name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            placeholder="As per bank records"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Account Number</label>
                        <input
                            required
                            value={formData.account_number}
                            onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">IFSC Code</label>
                            <input
                                required
                                value={formData.ifsc_code}
                                onChange={e => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Account Type</label>
                            <select
                                value={formData.account_type}
                                onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            >
                                <option value="CURRENT">Current</option>
                                <option value="SAVINGS">Savings</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Bank Name</label>
                        <input
                            required
                            value={formData.bank_name}
                            onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-600/20 mt-4 disabled:opacity-50"
                    >
                        {loading ? 'SAVING...' : 'LINK ACCOUNT'}
                    </button>
                    <p className="text-xs text-slate-400 text-center">A penny-drop verification will be initiated.</p>
                </form>
            </div>
        </div>
    );
}
