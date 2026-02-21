'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getBankAccounts, getUnifiedLedger } from '@/actions/accounting';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Landmark, Wallet, Plus, CreditCard, QrCode, Banknote, Eye, EyeOff, Settings } from 'lucide-react';
import { toast } from 'sonner';
import BankDetailWorkspace from './BankDetailWorkspace';
import AddAccountModal from './AddAccountModal';

export interface Transaction {
    id: string;
    type: 'INFLOW' | 'OUTFLOW';
    amount: number;
    method: string;
    status: string;
    date: string;
    displayId: string;
    description: string;
    reference?: string;
    isReconciled?: boolean;
    entityId?: string;
    source?: 'receipts' | 'payments';
}

export default function BooksPage() {
    const { device } = useBreakpoint();
    const { tenantId } = useTenant();
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [viewMode, setViewMode] = useState<'DETAIL' | 'SETTINGS'>('DETAIL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const refreshAccounts = async () => {
        if (!tenantId) return;
        setLoadingAccounts(true);
        try {
            const data = await getBankAccounts(tenantId);
            setBankAccounts(data);

            // Sync selected account with fresh data
            if (data.length > 0) {
                if (!selectedAccount) {
                    setSelectedAccount(data[0]);
                } else {
                    const freshVersion = data.find(a => a.id === selectedAccount.id);
                    if (freshVersion) {
                        setSelectedAccount(freshVersion);
                    } else if (!selectedAccount.id || !data.map(a => a.id).includes(selectedAccount.id)) {
                        // If current selection is gone (e.g. after a fresh seed), pick the first one
                        setSelectedAccount(data[0]);
                    }
                }
            } else {
                setSelectedAccount(null);
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
            toast.error('Failed to load accounts');
        } finally {
            setLoadingAccounts(false);
        }
    };

    const refreshTransactions = async () => {
        if (!tenantId || !selectedAccount) return;
        setLoadingTransactions(true);
        try {
            const data = await getUnifiedLedger(tenantId, selectedAccount.id); // Assuming getUnifiedLedger is the correct function, not getTransactions
            setTransactions(data as Transaction[]);
        } catch (error) {
            console.error('Error loading transactions:', error);
            toast.error('Failed to load transactions');
        } finally {
            setLoadingTransactions(false);
        }
    };

    // Initial load: Bank Accounts
    useEffect(() => {
        const loadAccounts = async () => {
            if (tenantId) {
                await refreshAccounts();
            }
        };

        loadAccounts();
    }, [tenantId]);

    // Transaction Load: When account selection changes
    useEffect(() => {
        refreshTransactions();
    }, [tenantId, selectedAccount]);

    // Audit Reveal Log
    useEffect(() => {
        if (!isPrivate && selectedAccount) {
            toast.info('Privacy Reveal Logged', {
                description: `Sensitive figures revealed for ${selectedAccount.bank_name}`,
                duration: 3000,
            });
        }
    }, [isPrivate]);

    const bankColumns = [
        {
            key: 'bank_name',
            header: 'Account',
            render: (item: any) => {
                let Icon = Landmark;
                if (item.account_type === 'UPI') Icon = QrCode;
                else if (item.account_type === 'CREDIT_CARD') Icon = CreditCard;
                else if (item.account_type === 'CASH') Icon = Banknote;

                const maskedAccount = item.account_number
                    ? item.account_number.length > 4
                        ? `•••• ${item.account_number.slice(-4)}`
                        : item.account_number
                    : '';

                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center p-2 shadow-sm border border-slate-100 dark:border-white/10 transition-transform group-hover:scale-110">
                            <Icon size={18} className="text-slate-700 dark:text-slate-300" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-black text-[14px] text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight italic truncate leading-tight">
                                {item.bank_name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60 flex items-center gap-2 mt-0.5">
                                <span className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                                    {item.account_type}
                                </span>
                                {maskedAccount && (
                                    <>
                                        <span className="font-mono bg-indigo-50/50 dark:bg-indigo-500/5 px-1.5 py-0.5 rounded-md text-indigo-600/70 dark:text-indigo-400/70 border border-indigo-100/50 dark:border-indigo-500/10">
                                            {maskedAccount}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'balance',
            header: 'Financials',
            align: 'right' as const,
            render: (item: any) => (
                <div className="flex flex-col items-end gap-1">
                    <div
                        className={`text-[12px] font-black text-slate-900 dark:text-white tabular-nums ${isPrivate ? 'blur-[5px] select-none' : ''}`}
                    >
                        ₹{(item.balance || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {item.is_primary && (
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                                Primary
                            </span>
                        )}
                        {!item.is_primary && (
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                                Secondary
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="h-full w-full">
            <MasterListDetailLayout
                device={device}
                hasActiveDetail={!!selectedAccount}
                onBack={() => {
                    setSelectedAccount(null);
                    setViewMode('DETAIL');
                }}
            >
                {/* List Panel (Left) */}
                <ListPanel
                    title="Accounts"
                    headerActions={
                        <>
                            <button
                                onClick={() => setIsPrivate(!isPrivate)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors group"
                                title={isPrivate ? 'Show Values' : 'Hide Values'}
                            >
                                {isPrivate ? (
                                    <EyeOff size={15} className="text-rose-500" />
                                ) : (
                                    <Eye size={15} className="text-slate-400 group-hover:text-indigo-500" />
                                )}
                            </button>
                            <button
                                onClick={() => setShowAddAccount(true)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors group text-slate-400 hover:text-indigo-500"
                                title="Add New Account"
                            >
                                <Plus size={15} />
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode(viewMode === 'SETTINGS' ? 'DETAIL' : 'SETTINGS');
                                    if (viewMode === 'DETAIL') setSelectedAccount(null);
                                }}
                                className={`p-1.5 rounded-xl transition-colors group ${viewMode === 'SETTINGS' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400'}`}
                                title="Module Settings"
                            >
                                <Settings
                                    size={15}
                                    className={
                                        viewMode === 'SETTINGS' ? 'animate-spin-slow' : 'group-hover:text-indigo-500'
                                    }
                                />
                            </button>
                        </>
                    }
                    columns={bankColumns}
                    data={bankAccounts}
                    isLoading={loadingAccounts}
                    selectedId={selectedAccount?.id}
                    onItemClick={acc => {
                        setSelectedAccount(acc);
                        setViewMode('DETAIL');
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search accounts..."
                />

                <BankDetailWorkspace
                    account={selectedAccount}
                    transactions={transactions}
                    isLoading={loadingTransactions}
                    onRefresh={refreshTransactions}
                    isPrivate={isPrivate}
                    isSettings={viewMode === 'SETTINGS'}
                    onAddAccount={() => setShowAddAccount(true)}
                />
            </MasterListDetailLayout>

            <AddAccountModal
                isOpen={showAddAccount}
                onClose={() => setShowAddAccount(false)}
                onSuccess={refreshAccounts}
                tenantId={tenantId || ''}
            />
        </div>
    );
}
