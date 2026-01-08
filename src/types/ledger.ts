export type TransactionType = 'INVOICE' | 'RECEIPT' | 'A_JOURNAL';

export type PartyType = 'CUSTOMER' | 'VENDOR' | 'BANK' | 'TAX_AUTHORITY' | 'INTERNAL';

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
    code: string;
    name: string;
    type: AccountType;
}

export interface LedgerEntry {
    id: string; // UUID
    displayId: string; // 9-char random alphanumeric
    transactionDate: string; // ISO8601
    transactionType: TransactionType;
    referenceId: string; // InvoiceID or ReceiptID

    // Party Context
    partyType: PartyType;
    partyId: string; // DisplayID of Customer/Vendor/Bank
    partyName?: string; // Denormalized for easier display

    description: string;

    debitAccount: string; // Account Name/Code
    creditAccount: string; // Account Name/Code

    amount: number; // Always Positive

    tenantId: string; // Strict separation
}

export interface CreditNote {
    id: string; // UUID
    displayId: string; // 9-char alphanumeric
    invoiceId: string; // Linked Invoice
    bookingId: string; // Linked Booking
    reason: string;
    lineItems: any[]; // Mirroring InvoiceLineItem
    taxableAmount: number;
    taxAmount: number;
    totalAmount: number;
    status: 'ISSUED' | 'REFUNDED';
    createdAt: string; // ISO
    tenantId: string;
}

export interface Refund {
    id: string; // UUID
    displayId: string; // 9-char alphanumeric
    creditNoteId: string; // Linked CreditNote
    amount: number;
    mode: 'CASH' | 'UPI' | 'BANK' | 'CHEQUE';
    reference?: string;
    refundedAt: string; // ISO
}
