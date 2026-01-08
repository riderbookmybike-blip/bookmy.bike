import { Account } from "@/types/ledger";

export const ACCOUNT_MASTER = {
    // ASSETS
    CASH: { code: '1001', name: 'Cash Account', type: 'ASSET' } as Account,
    BANK: { code: '1002', name: 'Bank Account', type: 'ASSET' } as Account,
    ACCOUNTS_RECEIVABLE: { code: '1003', name: 'Accounts Receivable', type: 'ASSET' } as Account,

    // LIABILITIES
    OUTPUT_GST: { code: '2001', name: 'Duties & Taxes (Output GST)', type: 'LIABILITY' } as Account,
    CUSTOMER_ADVANCE: { code: '2002', name: 'Customer Advances', type: 'LIABILITY' } as Account,

    // REVENUE
    SALES_VEHICLE: { code: '3001', name: 'Sales - Vehicles', type: 'REVENUE' } as Account,
    SALES_INSURANCE: { code: '3002', name: 'Sales - Insurance Commission', type: 'REVENUE' } as Account,
    SALES_RTO: { code: '3003', name: 'Sales - RTO Services', type: 'REVENUE' } as Account,
    SALES_ACCESSORIES: { code: '3004', name: 'Sales - Accessories', type: 'REVENUE' } as Account,
    SALES_SERVICE: { code: '3005', name: 'Sales - Services', type: 'REVENUE' } as Account,
    SALES_RETURNS: { code: '3006', name: 'Sales Returns', type: 'REVENUE' } as Account, // Contra-Revenue
};

export const getAccountByName = (name: string): Account | undefined => {
    return Object.values(ACCOUNT_MASTER).find(acc => acc.name === name);
};

export const getAllAccounts = (): Account[] => {
    return Object.values(ACCOUNT_MASTER);
};
