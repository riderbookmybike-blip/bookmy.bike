import { getLedgerEntries } from "../dataStore";
import { LedgerEntry, Account, AccountType } from "@/types/ledger";
import { getAllAccounts } from "./accountMaster"; // Need to export this from accountMaster

// Types
export interface TrialBalanceItem {
    accountName: string;
    accountCode: string;
    accountType: AccountType;
    totalDebit: number;
    totalCredit: number;
    netBalance: number; // Positive = Debit, Negative = Credit usually, or strictly signed
    netDebit: number;
    netCredit: number;
}

export interface TrialBalanceReport {
    items: TrialBalanceItem[];
    totals: {
        debit: number;
        credit: number;
    };
    isBalanced: boolean;
}

export interface ProfitLossReport {
    revenue: TrialBalanceItem[];
    expenses: TrialBalanceItem[];
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
}

export interface BalanceSheetReport {
    assets: TrialBalanceItem[];
    liabilities: TrialBalanceItem[];
    equity: TrialBalanceItem[];

    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;

    validation: {
        isBalanced: boolean;
        diff: number;
    };
}

// 1. GENERATE TRIAL BALANCE
// Groups all ledger entries by account and sums Dr/Cr
export const generateTrialBalance = (startDate?: string, endDate?: string): TrialBalanceReport => {
    const entries = getLedgerEntries();

    // Filter by Date (Inclusive)
    const filteredEntries = entries.filter(e => {
        if (!startDate && !endDate) return true;
        const d = e.transactionDate;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
    });

    const accountMap = new Map<string, TrialBalanceItem>();

    // Helper to get or init item
    const getOrInit = (accName: string, accCode: string, type: AccountType): TrialBalanceItem => {
        if (!accountMap.has(accName)) {
            accountMap.set(accName, {
                accountName: accName,
                accountCode: accCode,
                accountType: type,
                totalDebit: 0,
                totalCredit: 0,
                netBalance: 0,
                netDebit: 0,
                netCredit: 0
            });
        }
        return accountMap.get(accName)!;
    };

    // Process Entries
    // For every entry, we have Debit Account and Credit Account names.
    // We need to look up their types from Master.
    // Note: LedgerEntry stores Names. We need to match with Master.
    const masterAccounts = getAllAccounts();

    filteredEntries.forEach(entry => {
        // Debit Side
        const drAccDef = masterAccounts.find(a => a.name === entry.debitAccount);
        if (drAccDef) {
            const item = getOrInit(drAccDef.name, drAccDef.code, drAccDef.type);
            item.totalDebit += entry.amount;
        }

        // Credit Side
        const crAccDef = masterAccounts.find(a => a.name === entry.creditAccount);
        if (crAccDef) {
            const item = getOrInit(crAccDef.name, crAccDef.code, crAccDef.type);
            item.totalCredit += entry.amount;
        }
    });

    // Calculate Nets
    let grandDebit = 0;
    let grandCredit = 0;

    const items = Array.from(accountMap.values()).map(item => {
        // Net Logic:
        // Asset/Expense: Normal Balance is Debit
        // Liab/Equity/Revenue: Normal Balance is Credit

        const netVal = item.totalDebit - item.totalCredit;

        item.netBalance = netVal;

        if (netVal > 0) item.netDebit = netVal;
        else item.netCredit = Math.abs(netVal);

        grandDebit += item.totalDebit;
        grandCredit += item.totalCredit;

        return item;
    });

    // Validations (Floating point tolerance)
    const diff = Math.abs(grandDebit - grandCredit);
    const isBalanced = diff < 0.01;

    return {
        items: items.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
        totals: {
            debit: grandDebit,
            credit: grandCredit
        },
        isBalanced
    };
};

// 2. GENERATE PROFIT & LOSS
export const generateProfitAndLoss = (tb: TrialBalanceReport): ProfitLossReport => {
    // Revenue: Account.Type === 'REVENUE'
    // Expenses: Account.Type === 'EXPENSE'

    const revenue = tb.items.filter(i => i.accountType === 'REVENUE');
    const expenses = tb.items.filter(i => i.accountType === 'EXPENSE');

    // Revenue in TB has Credit Balance (Negative Net in our simple math above? No wait)
    // In TB logic above: netBalance = Debit - Credit.
    // So Revenue (Credit normal) will have NEGATIVE netBalance.
    // We want ABS values for presentation.

    const totalRevenue = revenue.reduce((sum, item) => sum + item.netCredit, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.netDebit, 0);

    return {
        revenue,
        expenses,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses
    };
};

// 3. GENERATE BALANCE SHEET
export const generateBalanceSheet = (tb: TrialBalanceReport, pl: ProfitLossReport): BalanceSheetReport => {
    const assets = tb.items.filter(i => i.accountType === 'ASSET');
    const liabilities = tb.items.filter(i => i.accountType === 'LIABILITY');
    const equity = tb.items.filter(i => i.accountType === 'EQUITY');

    const totalAssets = assets.reduce((sum, item) => sum + item.netDebit, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.netCredit, 0);

    // Equity Calculation: Existing Equity + Net Profit (Retained Earnings)
    let totalEquity = equity.reduce((sum, item) => sum + item.netCredit, 0);

    // Apply Net Profit to Equity
    // We can simulate a "Retained Earnings" line item or add to total
    // Creating a virtual item for display
    if (pl.netProfit !== 0) {
        equity.push({
            accountName: 'Retained Earnings (Net Profit)',
            accountCode: 'EQ-RET',
            accountType: 'EQUITY',
            totalDebit: 0,
            totalCredit: pl.netProfit,
            netBalance: -pl.netProfit,
            netDebit: 0,
            netCredit: pl.netProfit
        });
        totalEquity += pl.netProfit;
    }

    // Validation: Assets = Liabilities + Equity
    const rhs = totalLiabilities + totalEquity;
    const diff = Math.abs(totalAssets - rhs);

    return {
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
        validation: {
            isBalanced: diff < 0.01,
            diff
        }
    };
};
