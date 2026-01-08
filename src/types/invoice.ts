
export interface InvoiceLineItem {
    type: 'VEHICLE' | 'ACCESSORY' | 'SERVICE' | 'FEE';
    label: string;
    qty: number;
    unitPriceExclTax: number;
    taxableValue: number;
    gstRate: number; // 0, 18, 28
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    total: number;
}

export interface Invoice {
    id: string; // Internal UUID
    displayId: string; // INV-YY-LOC-XXX
    bookingId: string;
    bookingDisplayId: string;
    customerId: string;
    customerName: string;

    // Snapshot Reference
    pricingSnapshotRef: {
        snapshotId: string;
        snapshotLockedAt: string;
        variantLabel: string;
        stateCode: string;
    };

    lineItems: InvoiceLineItem[];

    totals: {
        taxableTotal: number;
        cgstTotal: number;
        sgstTotal: number;
        igstTotal: number;
        grandTotal: number;
    };

    // Payment Context (Computed/Updated)
    paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID';
    amountPaid: number;
    amountDue: number;

    gstContext: {
        supplyState: string;
        registrationType: 'INTRA_STATE' | 'INTER_STATE';
        note: string;
    };

    generatedAt: string;
    status: 'ISSUED';
    immutable: true;
}
