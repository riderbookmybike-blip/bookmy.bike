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
    Download,
    QrCode,
    Landmark,
    Copy,
    Plus,
    Eye,
    EyeOff,
    Printer,
    Paperclip,
    ShieldCheck,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Transaction } from './BooksPage';
import ListPanel from '@/components/templates/ListPanel';
import ManualEntryModal from './ManualEntryModal';
import AddAccountModal from './AddAccountModal';
import { useRouter } from 'next/navigation';
import {
    getUnifiedLedger,
    reconcileTransaction,
    addManualTransaction,
    updateBankAccount,
    deleteBankAccount,
} from '@/actions/accounting';
import VoucherPrintModal from './VoucherPrintModal';

interface BankDetailWorkspaceProps {
    account: any;
    transactions: Transaction[];
    isLoading: boolean;
    onRefresh: () => void;
    isPrivate?: boolean;
    isSettings?: boolean;
    onAddAccount?: () => void;
    onReconcile?: () => void;
}

export default function BankDetailWorkspace({
    account,
    transactions,
    isLoading,
    onRefresh,
    isPrivate = false,
    isSettings = false,
    onAddAccount,
}: BankDetailWorkspaceProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'receive' | 'reconcile' | 'settings'>(
        'overview'
    );
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [printingTransaction, setPrintingTransaction] = useState<any>(null);

    // Ledger States
    const [ledgerSearch, setLedgerSearch] = useState('');
    const [ledgerStatus, setLedgerStatus] = useState<'ALL' | 'RECONCILED' | 'PENDING'>('ALL');

    // Static UPI States
    const [upiAmount, setUpiAmount] = useState('');
    const [upiNote, setUpiNote] = useState('');

    // Derived Analytics
    const monthlyInflow = transactions.filter(t => t.type === 'INFLOW').reduce((sum, t) => sum + t.amount, 0);

    const monthlyOutflow = transactions.filter(t => t.type === 'OUTFLOW').reduce((sum, t) => sum + t.amount, 0);

    const generateUpiUri = () => {
        if (!account || account.account_type !== 'UPI') return '';
        const pa = account.account_number;
        const pn = encodeURIComponent(account.beneficiary_name || '');
        const tn = encodeURIComponent(upiNote);
        const am = upiAmount ? `&am=${upiAmount}` : '';
        const noteStr = tn ? `&tn=${tn}` : '';
        return `upi://pay?pa=${pa}&pn=${pn}${am}${noteStr}&cu=INR`;
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesStatus =
            ledgerStatus === 'ALL' ||
            (ledgerStatus === 'RECONCILED' && t.isReconciled) ||
            (ledgerStatus === 'PENDING' && !t.isReconciled);

        const matchesSearch =
            t.description.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
            t.method.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
            t.displayId.toLowerCase().includes(ledgerSearch.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    if (isSettings) {
        return (
            <div className="flex-1 p-12 bg-slate-50/50 dark:bg-[#0b0d10] animate-in fade-in duration-500">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                Module Settings
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">
                                Manage your financial infrastructure and module preferences
                            </p>
                        </div>
                        <Settings
                            className="text-indigo-600 dark:text-indigo-400 animate-spin-slow opacity-20"
                            size={40}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Infrastructure Registration */}
                        <div className="p-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] group hover:border-indigo-500/50 transition-all duration-500">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Plus className="text-indigo-600 dark:text-indigo-400" size={24} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                                Register Infrastructure
                            </h3>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-8">
                                Add new bank accounts, UPI IDs, or cash registers to your financial cockpit.
                            </p>
                            <button
                                onClick={onAddAccount}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                            >
                                Add Account
                            </button>
                        </div>

                        {/* Privacy & Security */}
                        <div className="p-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] group hover:border-emerald-500/50 transition-all duration-500">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={24} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                                Privacy Governance
                            </h3>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-8">
                                Configure your visibility standards and audit logging for sensitive financial data.
                            </p>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Public visibility mode
                                </span>
                                <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!account)
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-[#0b0d10]">
                <div className="w-20 h-20 rounded-[32px] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 animate-pulse border border-indigo-100 dark:border-indigo-500/20">
                    <Wallet className="text-indigo-300 dark:text-indigo-400/30" size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 font-mono italic">
                    SELECT ACCOUNT
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60 max-w-xs leading-relaxed">
                    Pick an account from the left to view ledger or click the gear icon to manage your infrastructure.
                </p>
            </div>
        );

    const allTabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'ledger', label: 'Ledger', icon: ListFilter },
        {
            id: 'receive',
            label: 'Receive',
            icon: ArrowDownLeft,
            visible: ['UPI', 'SAVINGS', 'CURRENT', 'VIRTUAL', 'BANK'],
        },
        {
            id: 'reconcile',
            label: 'Reconcile',
            icon: CheckCircle2,
            visible: ['SAVINGS', 'CURRENT', 'VIRTUAL', 'CREDIT_CARD', 'BANK'],
        },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const tabs = allTabs.filter(tab => !tab.visible || tab.visible.includes(account.account_type));

    return (
        <AccountContainer
            account={account}
            onRefresh={onRefresh}
            activeTab={activeTab}
            showEditModal={showEditModal}
            setShowEditModal={setShowEditModal}
        >
            <div className="flex flex-col h-full bg-slate-50/50 dark:bg-[#0b0d10]">
                {/* Unified Header */}
                <div className="bg-white dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-white/5 p-8 shrink-0">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-[20px] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-white/20 shrink-0">
                                    <Wallet className="text-white" size={28} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                                        {account.bank_name}
                                    </h1>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 opacity-70">
                                        {account.account_number} <span className="mx-2 opacity-30">|</span>{' '}
                                        {account.account_type}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 mr-4 pr-4 border-r border-slate-200 dark:border-white/10">
                                {account.account_type !== 'CASH' && (
                                    <button
                                        onClick={() => setActiveTab('receive')}
                                        className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                                    >
                                        <ArrowDownLeft size={14} />
                                        Receive
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('reconcile')}
                                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                                >
                                    <CheckCircle2 size={14} />
                                    Reconcile
                                </button>
                            </div>

                            <button
                                onClick={() => setShowManualEntry(true)}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 border border-white/10 flex items-center gap-2"
                            >
                                <Plus size={14} />
                                New Transaction
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 border-b border-slate-200/60 dark:border-white/5 -mb-8 overflow-x-auto scrollbar-hide no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                                    activeTab === tab.id
                                        ? 'text-amber-600 dark:text-[#FFD700]'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 dark:bg-[#FFD700] rounded-full shadow-[0_0_10px_rgba(244,176,0,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <AccountStatCard
                                    label="Available Balance"
                                    value={`₹${(account.balance || 0).toLocaleString()}`}
                                    color="gold"
                                    icon={Wallet}
                                    isPrivate={isPrivate}
                                    trend="+2.4% vs last mo"
                                />
                                <AccountStatCard
                                    label="Monthly Inflow"
                                    value={`₹${monthlyInflow.toLocaleString()}`}
                                    color="emerald"
                                    trend={`+${transactions.filter(t => t.type === 'INFLOW').length} Txns`}
                                    icon={ArrowDownLeft}
                                    isPrivate={isPrivate}
                                />
                                <AccountStatCard
                                    label="Monthly Outflow"
                                    value={`₹${monthlyOutflow.toLocaleString()}`}
                                    color="rose"
                                    trend={`${transactions.filter(t => t.type === 'OUTFLOW').length} Txns`}
                                    icon={ArrowUpRight}
                                    isPrivate={isPrivate}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm">
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

                                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                        <CheckCircle2 className="text-emerald-500" size={32} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                                        Settlement Status
                                    </h4>
                                    <p className="text-[11px] text-slate-500 font-bold max-w-[200px]">
                                        Your transactions are up to date and reconciled.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ledger' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 -mx-8 -my-8">
                            <ListPanel
                                title="Transaction Ledger"
                                searchQuery={ledgerSearch}
                                onSearchChange={setLedgerSearch}
                                searchPlaceholder="Search entries..."
                                metrics={
                                    <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-fit">
                                        {(['ALL', 'RECONCILED', 'PENDING'] as const).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setLedgerStatus(status)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    ledgerStatus === status
                                                        ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                }
                                columns={[
                                    {
                                        key: 'date',
                                        header: 'Date',
                                        render: (item: any) => new Date(item.date).toLocaleDateString(),
                                        width: '100px',
                                    },
                                    { key: 'displayId', header: 'Ref', type: 'id', width: '100px' },
                                    {
                                        key: 'description',
                                        header: 'Description',
                                        type: 'rich',
                                        icon: Wallet,
                                        subtitle: (item: any) => item.method,
                                    },
                                    {
                                        key: 'debit',
                                        header: 'Debit (Out)',
                                        align: 'right' as const,
                                        render: (item: any) =>
                                            item.type === 'OUTFLOW' ? (
                                                <span
                                                    className={`font-black text-rose-600 dark:text-rose-500 ${isPrivate ? 'blur-[5px] select-none' : ''}`}
                                                >
                                                    ₹{item.amount.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="opacity-20">—</span>
                                            ),
                                    },
                                    {
                                        key: 'credit',
                                        header: 'Credit (In)',
                                        align: 'right' as const,
                                        render: (item: any) =>
                                            item.type === 'INFLOW' ? (
                                                <span
                                                    className={`font-black text-emerald-600 dark:text-emerald-500 ${isPrivate ? 'blur-[5px] select-none' : ''}`}
                                                >
                                                    ₹{item.amount.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="opacity-20">—</span>
                                            ),
                                    },
                                    {
                                        key: 'running_balance',
                                        header: 'Balance',
                                        align: 'right' as const,
                                        render: (item: any, idx: number) => {
                                            let currentBal = account.balance || 0;
                                            for (let i = 0; i < idx; i++) {
                                                const t = filteredTransactions[i];
                                                if (t.type === 'INFLOW') currentBal -= t.amount;
                                                else currentBal += t.amount;
                                            }
                                            return (
                                                <span
                                                    className={`font-black text-slate-900 dark:text-white ${isPrivate ? 'blur-[5px] select-none' : ''}`}
                                                >
                                                    ₹{currentBal.toLocaleString()}
                                                </span>
                                            );
                                        },
                                    },
                                    {
                                        key: 'isReconciled',
                                        header: 'Reco',
                                        render: (item: any) =>
                                            item.isReconciled ? (
                                                <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg w-fit">
                                                    <CheckCircle2 size={10} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                                        Done
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg w-fit">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                                        Pending
                                                    </span>
                                                </div>
                                            ),
                                    },
                                    {
                                        key: 'actions',
                                        header: '',
                                        align: 'right' as const,
                                        width: '80px',
                                        render: (item: any) => (
                                            <div className="flex items-center gap-1 justify-end">
                                                <button
                                                    onClick={() => setPrintingTransaction(item)}
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                                                    title="Print Receipt/Voucher"
                                                >
                                                    <Printer size={13} />
                                                </button>
                                                <button
                                                    onClick={() => toast.info('Opening Attachments...')}
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors"
                                                    title="Attachments"
                                                >
                                                    <Paperclip size={13} />
                                                </button>
                                            </div>
                                        ),
                                    },
                                ]}
                                data={filteredTransactions}
                                isLoading={isLoading}
                                tight
                            />
                        </div>
                    )}

                    {activeTab === 'receive' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
                            {account.account_type === 'UPI' ? (
                                <div className="flex flex-col md:flex-row gap-8 bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 rounded-[32px] p-8 shadow-sm">
                                    {/* QR Code Canvas */}
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                                            <QrCode className="text-emerald-500" size={32} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-2">
                                            Static UPI Collect
                                        </h3>
                                        <p className="text-xs text-slate-400 mb-8 max-w-sm">
                                            Scan using any UPI App. Funds will be directly credited to this VPA.
                                        </p>

                                        <div className="p-6 bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 dark:shadow-black/60 border border-slate-100 dark:border-white/10 mb-8 transition-all duration-500 hover:scale-[1.05] relative group flex flex-col items-center">
                                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px]" />
                                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl mb-6 border border-slate-100 dark:border-white/10 relative z-10">
                                                <QRCodeSVG
                                                    value={generateUpiUri()}
                                                    size={240}
                                                    level="H"
                                                    includeMargin={false}
                                                    className="relative z-10"
                                                />
                                            </div>
                                            <div className="text-center relative z-10">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                                    UPI ID / VPA
                                                </p>
                                                <p
                                                    className={`text-sm font-bold text-slate-900 dark:text-white ${isPrivate ? 'blur-[8px] select-none' : ''}`}
                                                >
                                                    {account.account_number}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className={`text-[10px] font-black uppercase tracking-widest text-[#F4B000] bg-[#F4B000]/10 px-4 py-2 rounded-full mb-2 ${isPrivate ? 'blur-[4px] select-none' : ''}`}
                                        >
                                            {account.account_number}
                                        </div>
                                    </div>

                                    {/* Intent Builder Form */}
                                    <div className="flex-1 space-y-6 pt-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                                    Amount (Optional)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                                                        ₹
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={upiAmount}
                                                        onChange={e => setUpiAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full pl-10 pr-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:border-[#F4B000] dark:focus:border-[#FFD700] outline-none font-bold text-sm transition-all text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                                    Note / Reference (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={upiNote}
                                                    onChange={e => setUpiNote(e.target.value)}
                                                    placeholder="e.g. Invoice #1024"
                                                    className="w-full px-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 focus:border-[#F4B000] dark:focus:border-[#FFD700] outline-none font-bold text-sm transition-all text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-200 dark:border-white/5">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-4 leading-relaxed">
                                                Manual Reconciliation Required: Since webhooks are disabled, you must
                                                manually record the inflow via "New Transaction" after receiving the
                                                bank alert.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Non-UPI: Static Bank Details view */
                                <div className="max-w-xl mx-auto w-full">
                                    <div className="bg-white dark:bg-slate-900/50 rounded-[32px] p-8 shadow-2xl overflow-hidden relative border border-slate-200/60 dark:border-white/10 group mb-8">
                                        {/* Carbon Gold Accent */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4B000]/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-150" />

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-8 opacity-80">
                                                <Landmark className="text-[#FFD700]" size={20} />
                                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                                    Bank Transfer Details
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-500 dark:text-slate-300 font-medium mb-8 leading-relaxed">
                                                Share these details with to receive payments via NEFT, RTGS, or IMPS.
                                            </p>

                                            <div className="space-y-4 mb-8">
                                                <div
                                                    className="p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md flex items-center justify-between group/copy cursor-pointer"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(account.beneficiary_name);
                                                        toast.success('Beneficiary Name copied!');
                                                    }}
                                                >
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                                            Account Name
                                                        </p>
                                                        <p className="text-lg font-bold text-slate-900 dark:text-white tracking-wider">
                                                            {account.beneficiary_name}
                                                        </p>
                                                    </div>
                                                    <Copy
                                                        size={16}
                                                        className="text-slate-400 group-hover/copy:text-slate-900 dark:group-hover/copy:text-white transition-colors"
                                                    />
                                                </div>

                                                <div
                                                    className="p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md flex items-center justify-between group/copy cursor-pointer"
                                                    onClick={() => {
                                                        if (!isPrivate) {
                                                            navigator.clipboard.writeText(account.account_number);
                                                            toast.success('Account Number copied!');
                                                        }
                                                    }}
                                                >
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                                            Account Number
                                                        </p>
                                                        <p
                                                            className={`text-xl font-mono text-slate-900 dark:text-white tracking-wider ${isPrivate ? 'blur-[8px] select-none' : ''}`}
                                                        >
                                                            {account.account_number}
                                                        </p>
                                                    </div>
                                                    <Copy
                                                        size={16}
                                                        className={`text-slate-400 group-hover/copy:text-slate-900 dark:group-hover/copy:text-white transition-colors ${isPrivate ? 'opacity-20' : ''}`}
                                                    />
                                                </div>

                                                <div
                                                    className="p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md flex items-center justify-between group/copy cursor-pointer"
                                                    onClick={() => {
                                                        if (!isPrivate) {
                                                            navigator.clipboard.writeText(account.ifsc_code);
                                                            toast.success('IFSC Code copied!');
                                                        }
                                                    }}
                                                >
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                                            IFSC Code
                                                        </p>
                                                        <p
                                                            className={`text-xl font-mono text-slate-900 dark:text-white tracking-wider ${isPrivate ? 'blur-[8px] select-none' : ''}`}
                                                        >
                                                            {account.ifsc_code}
                                                        </p>
                                                    </div>
                                                    <Copy
                                                        size={16}
                                                        className={`text-slate-400 group-hover/copy:text-slate-900 dark:group-hover/copy:text-white transition-colors ${isPrivate ? 'opacity-20' : ''}`}
                                                    />
                                                </div>
                                            </div>

                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-6 text-center">
                                                Click any detail to copy
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reconcile' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 -mx-8 -my-8">
                            <ListPanel
                                title="Reconciliation Workspace"
                                searchQuery={ledgerSearch}
                                onSearchChange={setLedgerSearch}
                                searchPlaceholder="Find transaction to match..."
                                metrics={
                                    <div className="flex items-center gap-3 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                                        <AlertTriangle className="text-amber-500" size={14} />
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">
                                            {transactions.filter(t => !t.isReconciled).length} Transactions to Verify
                                        </span>
                                    </div>
                                }
                                data={transactions.filter(t => !t.isReconciled)}
                                isLoading={isLoading}
                                columns={[
                                    {
                                        key: 'date',
                                        header: 'Date',
                                        render: (item: any) => new Date(item.date).toLocaleDateString(),
                                        width: '100px',
                                    },
                                    { key: 'displayId', header: 'Ref', type: 'id', width: '100px' },
                                    {
                                        key: 'description',
                                        header: 'Description',
                                        type: 'rich',
                                        icon: Wallet,
                                        subtitle: (item: any) => item.method,
                                    },
                                    {
                                        key: 'amount',
                                        header: 'Amount',
                                        align: 'right' as const,
                                        render: (item: any) => (
                                            <span
                                                className={`font-black ${item.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'} ${isPrivate ? 'blur-[5px]' : ''}`}
                                            >
                                                {item.type === 'INFLOW' ? '+' : '-'} ₹{item.amount.toLocaleString()}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: 'action',
                                        header: 'Manual Match',
                                        align: 'right' as const,
                                        render: (item: any) => (
                                            <button
                                                onClick={async () => {
                                                    const res = await reconcileTransaction(
                                                        item.id,
                                                        item.source as 'receipts' | 'payments'
                                                    );
                                                    if (res.success) {
                                                        toast.success('Transaction Reconciled');
                                                        onRefresh();
                                                    } else {
                                                        toast.error('Reconciliation failed');
                                                    }
                                                }}
                                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/10 transition-all hover:scale-105 active:scale-95"
                                            >
                                                Match & Verify
                                            </button>
                                        ),
                                    },
                                ]}
                                tight
                            />
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="max-w-2xl mx-auto space-y-12">
                                {/* Governance Header */}
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-2">
                                        Account Governance
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest opacity-60">
                                        Manage your financial infrastructure settings and security.
                                    </p>
                                </div>

                                <div className="grid gap-6">
                                    {/* Primary Account Toggle */}
                                    <div className="p-8 bg-white dark:bg-white/5 rounded-[32px] border border-slate-200 dark:border-white/10 flex items-center justify-between group hover:border-indigo-500/50 transition-all duration-500">
                                        <div className="flex gap-6 items-center">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                <ShieldCheck size={28} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                                    Primary Account Status
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                    Designate this as your default settlement gateway.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const res = await updateBankAccount(account.id, account.tenant_id, {
                                                    is_primary: !account.is_primary,
                                                });
                                                if (res.success) {
                                                    toast.success(
                                                        `Account set as ${!account.is_primary ? 'Primary' : 'Secondary'}`
                                                    );
                                                    router.refresh();
                                                    setTimeout(() => window.location.reload(), 500);
                                                }
                                            }}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                account.is_primary
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600'
                                            }`}
                                        >
                                            {account.is_primary ? 'PRIMARY' : 'SET AS PRIMARY'}
                                        </button>
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="px-6 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                        >
                                            EDIT META
                                        </button>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="p-8 bg-rose-50/50 dark:bg-rose-950/10 rounded-[32px] border border-rose-100 dark:border-rose-900/20 flex items-center justify-between">
                                        <div className="flex gap-6 items-center">
                                            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                <AlertTriangle size={28} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight italic">
                                                    Decommission Infrastructure
                                                </h4>
                                                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1">
                                                    This action is irreversible. All ledger links will remain.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (
                                                    confirm(
                                                        'Are you absolutely sure you want to decommission this account? This will remove it from your active infrastructure.'
                                                    )
                                                ) {
                                                    const res = await deleteBankAccount(account.id);
                                                    if (res.success) {
                                                        toast.success('Account decommissioned successfully');
                                                        router.push(`/${account.tenant_id}/books`);
                                                        router.refresh();
                                                    }
                                                }
                                            }}
                                            className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all hover:scale-105 active:scale-95"
                                        >
                                            DELETE ACCOUNT
                                        </button>
                                    </div>
                                </div>

                                {/* Audit Footer */}
                                <div className="pt-8 border-t border-slate-100 dark:border-white/5 text-center">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] opacity-40">
                                        UUID: {account.id} <span className="mx-4">|</span> ESTABLISHED:{' '}
                                        {new Date(account.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ManualEntryModal
                    isOpen={showManualEntry}
                    onClose={() => setShowManualEntry(false)}
                    onSuccess={onRefresh}
                    tenantId={account.tenant_id}
                    bankAccountId={account.id}
                />

                <VoucherPrintModal
                    isOpen={!!printingTransaction}
                    onClose={() => setPrintingTransaction(null)}
                    transaction={printingTransaction}
                    account={account}
                />
            </div>
        </AccountContainer>
    );
}

function AccountStatCard({
    label,
    value,
    color,
    trend,
    icon: Icon = Wallet,
    isPrivate = false,
}: {
    label: string;
    value: string;
    color: 'gold' | 'emerald' | 'rose';
    trend?: string;
    icon?: any;
    isPrivate?: boolean;
}) {
    const colors = {
        gold: 'bg-white dark:bg-[#F4B000]/10 text-amber-600 dark:text-[#FFD700] border-amber-200 dark:border-[#F4B000]/30 shadow-sm dark:shadow-none',
        emerald:
            'bg-white dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-none',
        rose: 'bg-white dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 shadow-sm dark:shadow-none',
    };

    const sparklineColor = {
        gold: '#F59E0B',
        emerald: '#10B981',
        rose: '#EF4444',
    };

    return (
        <div
            className={`p-6 rounded-[28px] border ${colors[color]} relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}
        >
            <div className="flex items-start justify-between mb-4 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                    <Icon size={12} />
                    {label}
                </p>
                {trend && (
                    <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}
                    >
                        {trend}
                    </span>
                )}
            </div>

            <div className="flex items-end justify-between relative z-10">
                <h4
                    className={`text-2xl font-black tracking-tighter italic ${isPrivate ? 'blur-[8px] select-none' : ''}`}
                >
                    {value}
                </h4>

                {/* Sparkline Visualization */}
                <div className="opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                    <svg className="w-16 h-8" viewBox="0 0 100 40">
                        <path
                            d={
                                trend?.startsWith('+')
                                    ? 'M0,35 Q10,35 20,25 T40,25 T60,15 T80,15 T100,5'
                                    : 'M0,5 Q10,5 20,15 T40,15 T60,25 T80,25 T100,35'
                            }
                            fill="none"
                            stroke={sparklineColor[color]}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>

            {/* Background Decoration */}
            <div
                className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-125 transition-all duration-700 pointer-events-none ${color === 'gold' ? 'text-amber-500' : ''}`}
            >
                <Icon size={120} strokeWidth={1} />
            </div>
        </div>
    );
}

function MetaItem({
    label,
    value,
    status,
}: {
    label: string;
    value?: string;
    status?: 'VERIFIED' | 'PENDING' | 'PRIMARY' | 'SECONDARY';
}) {
    return (
        <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
            {status ? (
                <span
                    className={`text-[10px] font-black uppercase tracking-widest ${status === 'VERIFIED' || status === 'PRIMARY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                >
                    {status}
                </span>
            ) : (
                <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {value || 'N/A'}
                </p>
            )}
        </div>
    );
}

function AccountContainer({
    account,
    onRefresh,
    activeTab,
    children,
    showEditModal,
    setShowEditModal,
}: {
    account: any;
    onRefresh: () => void;
    activeTab: string;
    children: React.ReactNode;
    showEditModal: boolean;
    setShowEditModal: (show: boolean) => void;
}) {
    return (
        <>
            {children}
            <AddAccountModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={() => {
                    onRefresh();
                    toast.success('Account meta updated');
                }}
                tenantId={account.tenant_id}
                initialData={account}
            />
        </>
    );
}
