'use client';

import React, { useState } from 'react';
import {
    LayoutDashboard,
    ListFilter,
    CheckCircle2,
    Settings,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Calendar,
    Search,
} from 'lucide-react';
import { Transaction } from './BooksPage';
import ListPanel from '@/components/templates/ListPanel';
import ManualEntryModal from './ManualEntryModal';
import StatsHeader from '@/components/modules/shared/StatsHeader';

interface BankDetailWorkspaceProps {
    account: any;
    transactions: Transaction[];
    isLoading: boolean;
    onRefresh: () => void;
}

export default function BankDetailWorkspace({ account, transactions, isLoading, onRefresh }: BankDetailWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'reconcile' | 'settings'>('overview');
    const [showManualEntry, setShowManualEntry] = useState(false);

    if (!account)
        return (
            <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                Select an account to view details
            </div>
        );

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'ledger', label: 'Ledger', icon: ListFilter },
        { id: 'reconcile', label: 'Reconcile', icon: CheckCircle2 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-[#0b0d10]">
            {/* Unified Header */}
            <div className="bg-white dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-white/5 p-8 shrink-0">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-white/20">
                                <Wallet className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                                    {account.bank_name}
                                </h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-60">
                                    {account.account_number} • {account.account_type}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowManualEntry(true)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 border border-white/10"
                        >
                            New Transaction
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-8 border-b border-slate-200/60 dark:border-white/5 -mb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                                activeTab === tab.id
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <AccountStatCard
                                    label="Available Balance"
                                    value={`₹${(account.balance || 0).toLocaleString()}`}
                                    color="indigo"
                                />
                                <AccountStatCard
                                    label="Monthly Inflow"
                                    value="₹1,24,500"
                                    color="emerald"
                                    trend="+12%"
                                />
                                <AccountStatCard label="Monthly Outflow" value="₹84,200" color="rose" trend="-4%" />
                            </div>

                            <div className="bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 rounded-[32px] p-8 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">
                                    Account Meta
                                </h3>
                                <div className="grid grid-cols-2 gap-y-6">
                                    <MetaItem label="Beneficiary" value={account.beneficiary_name} />
                                    <MetaItem label="IFSC Code" value={account.ifsc_code} />
                                    <MetaItem
                                        label="Verification"
                                        status={account.is_verified ? 'VERIFIED' : 'PENDING'}
                                    />
                                    <MetaItem
                                        label="Primary Account"
                                        status={account.is_primary ? 'PRIMARY' : 'SECONDARY'}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ledger' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 -mx-8 -my-8">
                            <ListPanel
                                title="Transaction Ledger"
                                columns={[
                                    { key: 'displayId', header: 'Ref', type: 'id', width: '120px' },
                                    {
                                        key: 'description',
                                        header: 'Description',
                                        type: 'rich',
                                        icon: Wallet,
                                        subtitle: item =>
                                            `${item.method} • ${new Date(item.date).toLocaleDateString()}`,
                                    },
                                    {
                                        key: 'amount',
                                        header: 'Amount',
                                        align: 'right',
                                        render: item => (
                                            <span
                                                className={`font-black ${item.type === 'INFLOW' ? 'text-emerald-500' : 'text-rose-500'}`}
                                            >
                                                {item.type === 'INFLOW' ? '+' : '-'} ₹{item.amount.toLocaleString()}
                                            </span>
                                        ),
                                    },
                                    { key: 'status', header: 'Status', type: 'badge' },
                                    {
                                        key: 'isReconciled',
                                        header: 'Audit',
                                        render: item =>
                                            item.isReconciled ? (
                                                <div className="flex items-center gap-1.5 text-emerald-500">
                                                    <CheckCircle2 size={12} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                        Reconciled
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                        Pending
                                                    </span>
                                                </div>
                                            ),
                                    },
                                ]}
                                data={transactions}
                                isLoading={isLoading}
                                tight
                            />
                        </div>
                    )}

                    {activeTab === 'reconcile' && (
                        <div className="flex flex-col items-center justify-center p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            Reconciliation Engine Coming Soon
                        </div>
                    )}
                </div>
            </div>

            <ManualEntryModal
                isOpen={showManualEntry}
                onClose={() => setShowManualEntry(false)}
                onSuccess={onRefresh}
                tenantId={account.tenant_id}
                bankAccountId={account.id}
            />
        </div>
    );
}

function AccountStatCard({
    label,
    value,
    color,
    trend,
}: {
    label: string;
    value: string;
    color: 'indigo' | 'emerald' | 'rose';
    trend?: string;
}) {
    const colors = {
        indigo: 'bg-indigo-600/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20',
        emerald:
            'bg-emerald-600/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
        rose: 'bg-rose-600/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
    };

    return (
        <div
            className={`p-6 rounded-[28px] border ${colors[color]} relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}
        >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">{label}</p>
            <div className="flex items-end justify-between">
                <h4 className="text-2xl font-black tracking-tighter italic">{value}</h4>
                {trend && (
                    <span
                        className={`text-[10px] font-black uppercase tracking-widest ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}
                    >
                        {trend}
                    </span>
                )}
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                <Wallet size={80} />
            </div>
        </div>
    );
}

function MetaItem({ label, value, status }: { label: string; value?: string; status?: string }) {
    return (
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">{label}</p>
            {value && <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{value}</p>}
            {status && (
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                        status === 'VERIFIED' || status === 'PRIMARY'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}
                >
                    {status}
                </span>
            )}
        </div>
    );
}
