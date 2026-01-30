'use client';

import React, { useState } from 'react';
import { BankPartner } from '@/types/bankPartner';
import { CircleDollarSign, Download, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PayoutRecord {
    id: string;
    period: string;
    amountEarned: number;
    amountPaid: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
    dueDate: string;
    paidDate?: string;
}

export default function PayoutsTab({ partner }: { partner: BankPartner }) {
    const [payouts, setPayouts] = useState<PayoutRecord[]>([
        { id: 'p1', period: 'Nov 2024', amountEarned: 450000, amountPaid: 450000, status: 'PAID', dueDate: '2024-12-05', paidDate: '2024-12-04' },
        { id: 'p2', period: 'Dec 2024', amountEarned: 520000, amountPaid: 200000, status: 'PARTIAL', dueDate: '2025-01-05' },
        { id: 'p3', period: 'Jan 2024', amountEarned: 125000, amountPaid: 0, status: 'OVERDUE', dueDate: '2025-02-05' }
    ]);

    const calculateAging = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = today.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} Days Overdue` : 'Due soon';
    };

    const totalEarned = payouts.reduce((acc, p) => acc + p.amountEarned, 0);
    const totalPaid = payouts.reduce((acc, p) => acc + p.amountPaid, 0);
    const totalBalance = totalEarned - totalPaid;

    return (
        <div className="p-12 pt-4">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                        <CircleDollarSign size={32} className="text-blue-500" />
                        Payout Ledger
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 ml-12">Track Commission & Overdue Earnings</p>
                </div>
                <button
                    className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 shadow-sm"
                >
                    <Download size={16} /> Export Statement
                </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[40px] p-10 flex flex-col justify-between shadow-sm">
                    <div className="p-3 bg-blue-500/10 rounded-2xl w-fit text-blue-600 mb-6">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lifetime Earned</p>
                        <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{(totalEarned / 100000).toFixed(1)}L</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[40px] p-10 flex flex-col justify-between shadow-sm">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit text-emerald-600 mb-6">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Disbursed</p>
                        <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{(totalPaid / 100000).toFixed(1)}L</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[40px] p-10 flex flex-col justify-between shadow-sm">
                    <div className="p-3 bg-red-500/10 rounded-2xl w-fit text-red-600 mb-6">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending Balance</p>
                        <div className="text-4xl font-black text-red-600 tracking-tighter italic">₹{(totalBalance / 100000).toFixed(1)}L</div>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[40px] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/5">
                            <th className="px-10 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Period</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Earned Amount</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Paid</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Balance</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {payouts.map((payout) => (
                            <tr key={payout.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-10 py-8">
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg">{payout.period}</h4>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Due: {payout.dueDate}</p>
                                </td>
                                <td className="px-10 py-8 font-black text-slate-900 dark:text-white text-lg tracking-tighter italic">₹{payout.amountEarned.toLocaleString()}</td>
                                <td className="px-10 py-8 font-black text-emerald-600 text-lg tracking-tighter italic">₹{payout.amountPaid.toLocaleString()}</td>
                                <td className="px-10 py-8 font-black text-red-600 text-lg tracking-tighter italic">₹{(payout.amountEarned - payout.amountPaid).toLocaleString()}</td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${payout.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                payout.status === 'OVERDUE' ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' :
                                                    'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                            }`}>
                                            {payout.status}
                                        </span>
                                        {payout.status === 'OVERDUE' && (
                                            <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter flex items-center gap-1">
                                                <AlertCircle size={10} /> {calculateAging(payout.dueDate)}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
