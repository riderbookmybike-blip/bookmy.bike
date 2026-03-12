'use client';

import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Plus,
    Trash2,
    CheckCircle,
    AlertOctagon,
    X,
    Wallet,
    Landmark,
    ArrowRightLeft,
    Activity,
    Loader2,
    Save,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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

    const handleDelete = async (id: string, bankName: string) => {
        if (!confirm(`Are you sure you want to remove ${bankName}?`)) return;
        const supabase = createClient();
        const { error } = await supabase.from('id_bank_accounts').delete().eq('id', id);
        if (error) {
            toast.error('Failed to decommission financial bridge');
        } else {
            toast.success('Financial node detached');
            fetchAccounts();
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">
                            Settlement Matrix Dashboard
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 opacity-70 flex items-center gap-2">
                            <Activity size={12} className="text-emerald-500" /> Authorized payout nodes & financial
                            settlement vectors.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 z-10"
                >
                    <Plus size={16} /> Establish Link
                </button>
            </div>

            {loading ? (
                <div className="py-24 bg-white/50 border border-slate-100 rounded-3xl flex justify-center items-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : accounts.length === 0 ? (
                <div className="py-24 bg-white border border-dashed border-slate-200 rounded-3xl flex flex-col items-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                        <Landmark size={32} />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        No Financial Bridges Defined
                    </p>
                    <p className="text-[10px] text-slate-300 mt-2 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
                        Financial payout vectors must be authenticated for nodal operations.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {accounts.map(acc => (
                        <div
                            key={acc.id}
                            className="group relative bg-white border border-slate-200 rounded-3xl p-8 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-300 flex flex-col justify-between min-h-[220px]"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                                        <Landmark size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">
                                            {acc.bank_name}
                                        </h4>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-70">
                                            NODE_IFSC: {acc.ifsc_code}
                                        </p>
                                    </div>
                                </div>
                                {acc.is_primary && (
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/10 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                                        Primary
                                    </span>
                                )}
                            </div>

                            <div className="mt-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-60">
                                    Sequence Identifier
                                </p>
                                <p className="text-xl font-mono font-black text-slate-900 tracking-[0.15em]">
                                    <span className="opacity-20">•••• •••• •••• </span> {acc.account_number.slice(-4)}
                                </p>
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div
                                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${acc.is_verified ? 'text-emerald-500' : 'text-amber-500'}`}
                                >
                                    {acc.is_verified ? (
                                        <CheckCircle size={14} className="animate-in fade-in fill-emerald-500/10" />
                                    ) : (
                                        <AlertOctagon size={14} />
                                    )}
                                    {acc.is_verified ? 'Authenticated Node' : 'Verification Required'}
                                </div>
                                <button
                                    onClick={() => handleDelete(acc.id, acc.bank_name)}
                                    className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                >
                                    <Trash2 size={14} />
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
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchAccounts();
                    }}
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
        account_type: 'CURRENT',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('id_bank_accounts')
                .insert({ ...formData, tenant_id: dealerId, is_verified: false, is_primary: false });
            if (!error) {
                toast.success('Financial bridge established');
                onSuccess();
            } else toast.error('Encryption sequence failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Plus size={20} />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
                            Define Financial Bridge
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Beneficiary Operational Name
                        </label>
                        <input
                            required
                            value={formData.beneficiary_name}
                            onChange={e => setFormData({ ...formData, beneficiary_name: e.target.value })}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-black text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 transition-all outline-none"
                            placeholder="Legal Entity Name"
                        />
                    </div>
                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Account Sequence
                        </label>
                        <input
                            required
                            value={formData.account_number}
                            onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-black text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 transition-all outline-none"
                            placeholder="Full Account Number"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Node IFSC Vector
                            </label>
                            <input
                                required
                                value={formData.ifsc_code}
                                onChange={e => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-black text-indigo-600 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 transition-all outline-none"
                                placeholder="BANK0001234"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Account Protocol
                            </label>
                            <select
                                value={formData.account_type}
                                onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-black text-slate-900 uppercase tracking-widest outline-none focus:bg-white focus:border-indigo-500/50 transition-all cursor-pointer"
                            >
                                <option value="CURRENT">CURRENT</option>
                                <option value="SAVINGS">SAVINGS</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-6 border-t border-slate-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {loading ? 'SYNCING...' : 'ESTABLISH LINK'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
