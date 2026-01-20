import React from 'react';
import { getPartyLedger } from '@/lib/dataStore';

interface CustomerLedgerProps {
    customerId: string; // The ID to search for partition
    // In our mock store, we might be using Name or ID. 
    // The previous implementation used Name as ID in some places, so we need to be careful.
    // However, the Ledger entry uses whatever was passed as `partyId`.
}

export const CustomerLedger: React.FC<CustomerLedgerProps> = ({ customerId }) => {
    // We try to fetch by the ID passed. 
    // Note: In real app, this ID must match `partyId` exactly.
    const entries = getPartyLedger(customerId);

    // Calculate Running Balance
    let balance = 0;
    const entriesWithBalance = entries.map(e => {
        // Customer Ledger Logic:
        // Debit (Sales) increases Receivable (Debit Balance)
        // Credit (Receipt) decreases Receivable
        if (e.transactionType === 'INVOICE') balance += e.amount;
        if (e.transactionType === 'RECEIPT') balance -= e.amount;
        return { ...e, runningBalance: balance };
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700 dark:text-slate-200">Customer Ledger Account</h3>
                <span className="text-sm font-bold bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">Closing Balance: ₹{balance.toLocaleString()}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-200 dark:border-white/10">
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Ref</th>
                            <th className="px-4 py-2">Description</th>
                            <th className="px-4 py-2 text-right">Debit</th>
                            <th className="px-4 py-2 text-right">Credit</th>
                            <th className="px-4 py-2 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                        {entriesWithBalance.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-400 dark:text-slate-500">No transactions found.</td></tr>
                        ) : (
                            entriesWithBalance.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                    <td className="px-4 py-2 font-mono text-gray-600 dark:text-slate-400">{e.transactionDate.split('T')[0]}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{e.displayId}</td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-white">{e.description}</td>

                                    {/* Debit Column (Invoice) */}
                                    <td className="px-4 py-2 text-right text-gray-800 dark:text-slate-200">
                                        {e.transactionType === 'INVOICE' ? `₹${e.amount.toLocaleString()}` : '-'}
                                    </td>

                                    {/* Credit Column (Receipt) */}
                                    <td className="px-4 py-2 text-right text-green-700 dark:text-green-400">
                                        {e.transactionType === 'RECEIPT' ? `₹${e.amount.toLocaleString()}` : '-'}
                                    </td>

                                    <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white">
                                        ₹{e.runningBalance.toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
