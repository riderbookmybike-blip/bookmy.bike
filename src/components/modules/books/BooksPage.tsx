'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getBankAccounts, getUnifiedLedger } from '@/actions/accounting';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Landmark, Wallet, Plus, CreditCard } from 'lucide-react';
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

    const refreshAccounts = async () => {
        if (!tenantId) return;
        setLoadingAccounts(true);
        try {
            const accounts = await getBankAccounts(tenantId);
            setBankAccounts(accounts);
        } finally {
            setLoadingAccounts(false);
        }
    };

    const refreshTransactions = async () => {
        if (!tenantId || !selectedAccount) return;
        setLoadingTransactions(true);
        try {
            const data = await getUnifiedLedger(tenantId, selectedAccount.id);
            setTransactions(data as Transaction[]);
        } finally {
            setLoadingTransactions(false);
        }
    };

    // Initial load: Bank Accounts
    useEffect(() => {
        if (!tenantId) return;

        async function loadAccounts() {
            setLoadingAccounts(true);
            try {
                const accounts = await getBankAccounts(tenantId || '');
                setBankAccounts(accounts);
                // Auto-select primary account
                if (accounts.length > 0) {
                    const primary = accounts.find(a => a.is_primary) || accounts[0];
                    setSelectedAccount(primary);
                }
            } catch (err) {
                console.error('Failed to load bank accounts:', err);
                toast.error('Error loading bank accounts');
            } finally {
                setLoadingAccounts(false);
            }
        }

        loadAccounts();
    }, [tenantId]);

    // Transaction Load: When account selection changes
    useEffect(() => {
        refreshTransactions();
    }, [tenantId, selectedAccount]);

    const bankColumns = [
        {
            key: 'bank_name',
            header: 'Bank',
            type: 'rich' as const,
            icon: Landmark,
            subtitle: (item: any) => `${item.account_number} • ${item.account_type}`,
        },
        {
            key: 'status',
            header: 'Type',
            render: (item: any) => (
                <span
                    className={`text-[9px] font-black uppercase tracking-widest ${item.is_primary ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                    {item.is_primary ? 'Primary' : 'Secondary'}
                </span>
            ),
        },
    ];

    return (
        <>
            <MasterListDetailLayout
                device={device}
                hasActiveDetail={!!selectedAccount}
                onBack={() => {}} // Handle back for mobile/tablet if needed
            >
                {/* List Panel (Left) */}
                <ListPanel
                    title="Accounts"
                    columns={bankColumns}
                    data={bankAccounts}
                    isLoading={loadingAccounts}
                    selectedId={selectedAccount?.id}
                    onItemClick={acc => setSelectedAccount(acc)}
                    actionLabel="Add Account"
                    onActionClick={() => setShowAddAccount(true)}
                />

                {/* Detail Panel (Right) */}
                <BankDetailWorkspace
                    account={selectedAccount}
                    transactions={transactions}
                    isLoading={loadingTransactions}
                    onRefresh={refreshTransactions}
                />
            </MasterListDetailLayout>

            <AddAccountModal
                isOpen={showAddAccount}
                onClose={() => setShowAddAccount(false)}
                onSuccess={refreshAccounts}
                tenantId={tenantId || ''}
            />
        </>
    );
}
