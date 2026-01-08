export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID';

export interface Receipt {
    id: string; // UUID
    displayId: string; // RC-YY-LOC-XXX
    invoiceId: string;
    invoiceDisplayId: string;
    bookingId: string;

    amount: number;
    mode: PaymentMode;
    reference?: string; // Txn ID, Cheque No

    receivedBy: string; // User Name
    receivedAt: string; // ISO Timestamp

    // Snapshot of Invoice State at time of Receipt
    invoiceTotalAtReceipt: number;

    isImmutable: true;
}
