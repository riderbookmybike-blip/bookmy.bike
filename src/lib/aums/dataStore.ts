import { Booking, OperationalStage } from '@/types/booking';
import { InventoryItem } from '@/types/inventory';
import { VehicleUnit } from '@/types/vehicleUnit';
import { LedgerEntry, TransactionType, PartyType } from '@/types/ledger';
import { ACCOUNT_MASTER } from './accounting/accountMaster';

// Types needed directly here to avoid circular deps if any, but simplistic for now
// Quote Interface
export interface Quote {
    id: string; // UUID
    displayId: string; // QT-24-LOC-XXX
    customerName: string;
    productName: string;
    productSku: string;
    price: number;
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED' | 'CONFIRMED' | 'Converted to Order';
    operationalStage?: OperationalStage;
    booking_amount_paid?: boolean;
    date: string;
    version?: number;
    isLatest?: boolean;
}

// Initial Mock Bookings
let BOOKINGS: Booking[] = [];

// Sales Order / Booking Interface
export interface MockOrder {
    id: string;
    displayId: string; // SO-24-LOC-XXX
    quoteId?: string;
    quoteDisplayId?: string;
    customer: string;
    brand: string;
    model: string;
    variant: string;
    price: number;
    status: string;
    date: string;
    operationalStage?: OperationalStage;
    currentStage?: string;
}

import { generateDisplayId } from './idEngine';

// Initial Mock Orders
let ORDERS: MockOrder[] = [
    {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayId: '9X2V3M1AB',
        quoteId: 'uuid-quote-001',
        quoteDisplayId: '8Z7L6K5CD',
        customer: 'Rahul Kumar',
        brand: 'Honda',
        model: 'Activa 6G',
        variant: 'Standard / Matte Axis Grey',
        price: 85000,
        status: 'BOOKED',
        date: '2024-01-02',
    },
];

// Initial Mock Quotes
let QUOTES: Quote[] = [
    {
        id: 'uuid-quote-001',
        displayId: '8Z7L6K5CD',
        customerName: 'Rahul Kumar',
        productName: 'Honda Activa 6G Standard',
        productSku: 'HND-ACT-6G-STD-GRY',
        price: 85000,
        status: 'Converted to Order',
        date: '2024-01-01',
    },
];

// MOCK INVENTORY
const MOCK_INVENTORY: InventoryItem[] = [
    {
        id: 'INV-001',
        sku: 'HND-ACT-6G-STD-GRY',
        brand: 'Honda',
        model: 'Activa 6G',
        variant: 'Standard',
        color: 'Matte Axis Grey',
        totalStock: 5,
        reserved: 0,
        allotted: 0,
        available: 5,
        lastUpdated: new Date().toISOString(),
    },
    {
        id: 'INV-002',
        sku: 'HND-ACT-6G-DLX-RED',
        brand: 'Honda',
        model: 'Activa 6G',
        variant: 'Deluxe',
        color: 'Red',
        totalStock: 2,
        reserved: 0,
        allotted: 0,
        available: 2,
        lastUpdated: new Date().toISOString(),
    },
];

// MOCK VINS
let MOCK_VINS: VehicleUnit[] = [
    {
        id: 'VIN-001',
        vin: 'HND2024ACT00001',
        sku: 'HND-ACT-6G-STD-GRY',
        status: 'AVAILABLE',
        location: 'Yard A',
        inwardDate: '2024-01-01',
    },
    {
        id: 'VIN-002',
        vin: 'HND2024ACT00002',
        sku: 'HND-ACT-6G-STD-GRY',
        status: 'AVAILABLE',
        location: 'Yard A',
        inwardDate: '2024-01-01',
    },
    {
        id: 'VIN-003',
        vin: 'HND2024ACT00003',
        sku: 'HND-ACT-6G-STD-GRY',
        status: 'AVAILABLE',
        location: 'Yard A',
        inwardDate: '2024-01-01',
    },
    {
        id: 'VIN-004',
        vin: 'HND2024ACT00004',
        sku: 'HND-ACT-6G-STD-GRY',
        status: 'AVAILABLE',
        location: 'Yard B',
        inwardDate: '2024-01-02',
    },
    {
        id: 'VIN-005',
        vin: 'HND2024ACT00005',
        sku: 'HND-ACT-6G-STD-GRY',
        status: 'AVAILABLE',
        location: 'Yard B',
        inwardDate: '2024-01-02',
    },
    {
        id: 'VIN-006',
        vin: 'HND2024ACT00006',
        sku: 'HND-ACT-6G-DLX-RED',
        status: 'AVAILABLE',
        location: 'Showroom',
        inwardDate: '2024-01-03',
    },
    {
        id: 'VIN-007',
        vin: 'HND2024ACT00007',
        sku: 'HND-ACT-6G-DLX-RED',
        status: 'AVAILABLE',
        location: 'Showroom',
        inwardDate: '2024-01-03',
    },
];

export const getVins = () => MOCK_VINS;

// API-like Accessors
export const getOrders = () => ORDERS;
export const getBookings = () => BOOKINGS;
export const getInventory = () => MOCK_INVENTORY;
export const getQuotes = () => QUOTES;

// Quote Generation
export const createQuote = (details: {
    customerName: string;
    product: { label: string; sku: string; price: number };
}) => {
    const newQuote: Quote = {
        id: crypto.randomUUID(),
        displayId: generateDisplayId('QUOTE', QUOTES.length),
        customerName: details.customerName,
        productName: details.product.label,
        productSku: details.product.sku,
        price: details.product.price,
        status: 'DRAFT',
        operationalStage: 'QUOTE',
        booking_amount_paid: false,
        date: new Date().toISOString().split('T')[0],
    };
    QUOTES = [newQuote, ...QUOTES];
    return newQuote;
};

// Inventory Logic
export const adjustStock = (skuPartial: string, operation: 'RESERVE' | 'ALLOT' | 'DELIVER', qty: number): boolean => {
    // For Demo: simplified matching. In real app, perfect match on SKU.
    const itemIndex = MOCK_INVENTORY.findIndex(
        i => i.sku.includes(skuPartial) || (i.brand + i.model).includes(skuPartial) || true // Fallback to first item if completely ambiguous for demo flows
    );

    // Default to first item if logic fails to match string
    const targetIndex = itemIndex === -1 ? 0 : itemIndex;
    const item = { ...MOCK_INVENTORY[targetIndex] };

    if (operation === 'RESERVE') {
        if (item.available < qty) return false;
        item.available -= qty;
        item.reserved += qty;
    } else if (operation === 'ALLOT') {
        if (item.reserved < qty) {
            // Try to take from available if reserved is empty (direct Hard Lock)
            if (item.available >= qty) {
                item.available -= qty;
                item.allotted += qty;
            } else {
                return false;
            }
        } else {
            item.reserved -= qty;
            item.allotted += qty;
        }
    } else if (operation === 'DELIVER') {
        // Remove from Allotted and Total (Leaving the premises)
        if (item.allotted < qty) return false;
        item.allotted -= qty;
        item.totalStock -= qty;
    }

    item.lastUpdated = new Date().toISOString();
    MOCK_INVENTORY[targetIndex] = item;
    return true;
};

import { generateMockSnapshot } from './pricingEngine';

export const createBookingFromOrder = (orderId: string) => {
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    // 1. Generate Locked Price Snapshot
    // Construct a temporary variant object for the mock generator
    const mockVariantForSnapshot = {
        id: 'temp-var-id',
        type: 'VEHICLE',
        make: order.brand,
        model: order.model,
        variant: order.variant,
        sku: 'SKU-' + order.id, // Mock SKU
        label: `${order.brand} ${order.model} ${order.variant}`,
        status: 'ACTIVE',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const lockedSnapshot = generateMockSnapshot(mockVariantForSnapshot, 'DL', 'DL-01');

    // 2. Create Booking
    const newBooking: Booking = {
        id: crypto.randomUUID(),
        displayId: generateDisplayId('BOOKING'),
        salesOrderId: order.id, // Internal Link
        salesOrderDisplayId: order.displayId, // Visible Link
        customerName: order.customer,
        brandName: order.brand,
        modelName: order.model,
        variantName: order.variant,
        price: order.price,

        // LOCKED SNAPSHOT ATTACHMENT
        priceSnapshot: lockedSnapshot,

        status: 'DRAFT',
        operationalStage: 'BOOKING',
        allotmentStatus: 'NONE',
        pdiStatus: 'PENDING',
        pdiMeta: {},
        history: [
            {
                timestamp: new Date().toISOString(),
                action: 'Booking Created from ' + order.displayId,
                user: 'Sales Exec',
            },
        ],
    };

    BOOKINGS = [newBooking, ...BOOKINGS];
    ORDERS = ORDERS.map(o => (o.id === orderId ? { ...o, status: 'CONVERTED' } : o));

    return newBooking;
};

export const checkAndConvertQuoteToBooking = (quoteId: string) => {
    const quote = QUOTES.find(q => q.id === quoteId);
    if (!quote) return null;

    if (quote.status === 'CONFIRMED' && quote.booking_amount_paid) {
        // Create Mock Order first (since createBookingFromOrder expects it)
        const newOrder: MockOrder = {
            id: crypto.randomUUID(),
            displayId: generateDisplayId('ORDER'),
            quoteId: quote.id,
            quoteDisplayId: quote.displayId,
            customer: quote.customerName,
            brand: 'Yamaha', // Mocked or extracted from SKU
            model: quote.productName,
            variant: 'Standard',
            price: quote.price,
            status: 'BOOKED',
            date: new Date().toISOString().split('T')[0],
        };
        ORDERS = [newOrder, ...ORDERS];

        const booking = createBookingFromOrder(newOrder.id);
        quote.status = 'Converted to Order';
        return booking;
    }
    return null;
};

export const updateBookingStatus = (bookingId: string, updates: Partial<Booking>, auditNote: string) => {
    const bookingFound = BOOKINGS.find(b => b.id === bookingId);
    if (!bookingFound) throw new Error('Booking not found');

    // Intercept Allotment Changes for Inventory Check
    if (updates.allotmentStatus) {
        const skuParams = bookingFound.brandName;

        if (bookingFound.allotmentStatus === 'NONE' && updates.allotmentStatus === 'SOFT_LOCK') {
            if (!adjustStock(skuParams, 'RESERVE', 1)) {
                throw new Error('Inventory Limit: Not enough stock available to Reserve.');
            }
        } else if (bookingFound.allotmentStatus === 'SOFT_LOCK' && updates.allotmentStatus === 'HARD_LOCK') {
            // Insurance reset on Hard Lock
            updates.insuranceStatus = 'PENDING';
            if (!adjustStock(skuParams, 'ALLOT', 1)) {
                throw new Error('Inventory Error: Sync failed during Allotment.');
            }
        } else if (
            updates.allotmentStatus === 'NONE' &&
            (bookingFound.allotmentStatus === 'SOFT_LOCK' || bookingFound.allotmentStatus === 'HARD_LOCK')
        ) {
            // Revoke logic
            updates.pdiStatus = 'PENDING';
            updates.pdiMeta = {};
            updates.assignedVin = undefined;
        } else if (bookingFound.allotmentStatus === 'NONE' && updates.allotmentStatus === 'HARD_LOCK') {
            updates.insuranceStatus = 'PENDING';
            if (!adjustStock(skuParams, 'ALLOT', 1)) {
                throw new Error('Inventory Limit: Not enough stock available to Allot.');
            }
        }
    }

    // Apply Update
    BOOKINGS = BOOKINGS.map(b => {
        if (b.id === bookingId) {
            return {
                ...b,
                ...updates,
                history: [{ timestamp: new Date().toISOString(), action: auditNote, user: 'Manager' }, ...b.history],
            };
        }
        return b;
    });
};

export const assignVinToBooking = (bookingId: string, vin: string) => {
    const booking = BOOKINGS.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.allotmentStatus !== 'HARD_LOCK') throw new Error('Booking must be Hard Locked before assigning VIN');
    if (booking.assignedVin) throw new Error('Booking already has a VIN assigned');

    const vehicleUnit = MOCK_VINS.find(v => v.vin === vin);
    if (!vehicleUnit) throw new Error('VIN not found');
    if (vehicleUnit.status !== 'AVAILABLE') throw new Error('VIN is not available');

    // Demo Logic so simple match is enough
    if (!vehicleUnit.sku.includes(booking.brandName.substring(0, 3).toUpperCase())) {
        // Logic to validate SKU match would go here
    }

    // Update VIN State
    MOCK_VINS = MOCK_VINS.map(v =>
        v.vin === vin ? { ...v, status: 'ASSIGNED', bookingId, assignedDate: new Date().toISOString() } : v
    );

    // Update Booking State via the standard updater to ensure audit trail
    updateBookingStatus(
        bookingId,
        {
            assignedVin: vin,
            assignedEngineNumber: vehicleUnit.engineNumber || 'ENG-' + vin.slice(-5),
            pdiStatus: 'PENDING', // Start PDI
        },
        `Assigned VIN: ${vin}`
    );
};

export const completePDI = (
    bookingId: string,
    details: { inspectorName: string; odoReading: string; notes: string }
) => {
    const booking = BOOKINGS.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    // Ensure VIN
    if (!booking.assignedVin) throw new Error('Cannot perform PDI without Assigned VIN');
    if (booking.pdiStatus === 'PASSED') throw new Error('PDI already approved');

    // Update Status
    updateBookingStatus(
        bookingId,
        {
            pdiStatus: 'PASSED',
            pdiMeta: {
                inspectorName: details.inspectorName,
                odoReading: details.odoReading,
                allChecksPassed: true,
                notes: details.notes,
            },
        },
        `PDI Approved by ${details.inspectorName}`
    );
};

export const deliverBooking = (bookingId: string, details: { receiverName: string; notes: string }) => {
    const booking = BOOKINGS.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    // Ensure VIN Assigned
    if (!booking.assignedVin) throw new Error('Cannot deliver without Assigned VIN');

    // Ensure PDI Approved (Step 11)
    if (booking.pdiStatus !== 'PASSED') throw new Error('Cannot deliver: PDI not Approved');

    if (booking.status === 'DELIVERED') throw new Error('Booking already delivered');

    // 1. Update Vehicle Unit Status
    if (booking.assignedVin) {
        MOCK_VINS = MOCK_VINS.map(v => (v.vin === booking.assignedVin ? { ...v, status: 'DELIVERED' } : v));
    }

    // 2. Adjust Stock (Remove from Inventory - Allotted -> Gone)
    const skuParams = booking.brandName;
    if (!adjustStock(skuParams, 'DELIVER', 1)) {
        throw new Error('Inventory Error: Sync failed during Delivery.');
    }

    // 3. Update Booking Status
    updateBookingStatus(
        bookingId,
        {
            status: 'DELIVERED',
        },
        `Vehicle Delivered to ${details.receiverName}. Notes: ${details.notes}`
    );
};

export const acknowledgeDocuments = (bookingId: string, details: { insurancePolicyNo: string }) => {
    const booking = BOOKINGS.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    // Rule: Only after Delivery
    if (booking.status !== 'DELIVERED') throw new Error('Cannot acknowledge documents before Delivery');

    if (booking.documents?.customerAck) throw new Error('Documents already acknowledged');

    updateBookingStatus(
        bookingId,
        {
            documents: {
                invoiceAck: true,
                deliveryNoteAck: true,
                insurancePolicyNo: details.insurancePolicyNo,
                rcStatus: 'APPLIED', // Auto-set to Applied on handover
                customerAck: true,
                ackDate: new Date().toISOString(),
            },
        },
        `Documents Acknowledged & Policy #${details.insurancePolicyNo} Recorded`
    );
};
import { Invoice, InvoiceLineItem } from '@/types/invoice';

let INVOICES: Invoice[] = [];

export const getInvoice = (bookingId: string) => INVOICES.find(i => i.bookingId === bookingId);
export const getAllInvoices = () => INVOICES;

export const generateInvoice = (bookingId: string) => {
    const booking = BOOKINGS.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.invoiceId) return INVOICES.find(i => i.id === booking.invoiceId);

    // Rule: Must be Delivered (or ready for it) - Prompt said "Invoice created ONLY after Delivery"
    if (booking.status !== 'DELIVERED') throw new Error('Cannot generate invoice before Delivery');

    if (!booking.priceSnapshot) throw new Error('Critical: No Price Snapshot attached to Booking');

    const snap = booking.priceSnapshot;

    // 1. Establish GST Context
    const dealerState = 'DL'; // Mock Tenant Context

    if (!snap.stateCode) throw new Error('Critical: Customer State Code missing in Snapshot');
    const customerState = snap.stateCode;
    const registrationType = dealerState === customerState ? 'INTRA_STATE' : 'INTER_STATE';

    // 2. Helper for rounding
    const money = (val: number) => Math.round(val);

    const lineItems: InvoiceLineItem[] = [];

    // 3. Vehicle Item Calculation (28% GST)
    // Formula: Taxable = Total / (1 + Rate)
    const vehicleGstRate = 28;
    const vehicleExShowroom = snap.exShowroom;
    const vehicleTaxable = money(vehicleExShowroom / (1 + vehicleGstRate / 100));

    // Tax Amounts
    const vehicleTotalTax = vehicleExShowroom - vehicleTaxable;
    const isIntra = registrationType === 'INTRA_STATE';

    // Split Tax
    const vCgst = isIntra ? money(vehicleTotalTax / 2) : 0;
    const vSgst = isIntra ? vehicleTotalTax - vCgst : 0; // Balance to matching total
    const vIgst = !isIntra ? vehicleTotalTax : 0;

    lineItems.push({
        type: 'VEHICLE',
        label: `${booking.brandName} ${booking.modelName} ${booking.variantName}`,
        qty: 1,
        unitPriceExclTax: vehicleTaxable,
        taxableValue: vehicleTaxable,
        gstRate: vehicleGstRate,
        cgstRate: isIntra ? vehicleGstRate / 2 : 0,
        sgstRate: isIntra ? vehicleGstRate / 2 : 0,
        igstRate: !isIntra ? vehicleGstRate : 0,
        cgstAmount: vCgst,
        sgstAmount: vSgst,
        igstAmount: vIgst,
        total: vehicleExShowroom,
    });

    // 4. RTO Item (Fee, 0% GST)
    if (snap.rtoCharges > 0) {
        lineItems.push({
            type: 'FEE',
            label: `RTO Registration Charges (${snap.rtoCode})`,
            qty: 1,
            unitPriceExclTax: snap.rtoCharges,
            taxableValue: snap.rtoCharges,
            gstRate: 0,
            cgstRate: 0,
            sgstRate: 0,
            igstRate: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            total: snap.rtoCharges,
        });
    }

    // 5. Insurance Item (Service, 18% GST)
    if (snap.insuranceBase > 0) {
        const insGstRate = 18;
        const insTotal = snap.insuranceBase;
        const insTaxable = money(insTotal / (1 + insGstRate / 100));
        const insTotalTax = insTotal - insTaxable;

        const iCgst = isIntra ? money(insTotalTax / 2) : 0;
        const iSgst = isIntra ? insTotalTax - iCgst : 0;
        const iIgst = !isIntra ? insTotalTax : 0;

        lineItems.push({
            type: 'SERVICE',
            label: 'Insurance Premium',
            qty: 1,
            unitPriceExclTax: insTaxable,
            taxableValue: insTaxable,
            gstRate: insGstRate,
            cgstRate: isIntra ? insGstRate / 2 : 0,
            sgstRate: isIntra ? insGstRate / 2 : 0,
            igstRate: !isIntra ? insGstRate : 0,
            cgstAmount: iCgst,
            sgstAmount: iSgst,
            igstAmount: iIgst,
            total: insTotal,
        });
    }

    // 6. Aggregates
    const totals = lineItems.reduce(
        (acc, item) => ({
            taxableTotal: acc.taxableTotal + item.taxableValue,
            cgstTotal: acc.cgstTotal + item.cgstAmount,
            sgstTotal: acc.sgstTotal + item.sgstAmount,
            igstTotal: acc.igstTotal + item.igstAmount,
            grandTotal: acc.grandTotal + item.total,
        }),
        {
            taxableTotal: 0,
            cgstTotal: 0,
            sgstTotal: 0,
            igstTotal: 0,
            grandTotal: 0,
        }
    );

    const newInvoice: Invoice = {
        id: crypto.randomUUID(),
        displayId: generateDisplayId('INVOICE'),
        bookingId: booking.id,
        bookingDisplayId: booking.displayId,
        customerId: booking.customerName, // Mock ID as Name
        customerName: booking.customerName,
        pricingSnapshotRef: {
            snapshotId: snap.id,
            snapshotLockedAt: snap.calculatedAt,
            variantLabel: `${booking.brandName} ${booking.modelName} ${booking.variantName}`,
            stateCode: snap.stateCode,
        },

        lineItems,
        totals,

        gstContext: {
            supplyState: dealerState,
            registrationType,
            note: `Supply Code: ${dealerState}`,
        },

        generatedAt: new Date().toISOString(),
        status: 'ISSUED',
        immutable: true,

        // Payment Initialization
        paymentStatus: 'UNPAID',
        amountPaid: 0,
        amountDue: totals.grandTotal,
    };

    INVOICES = [newInvoice, ...INVOICES];

    // Link to Booking
    updateBookingStatus(
        bookingId,
        {
            invoiceId: newInvoice.id,
            invoiceDisplayId: newInvoice.displayId,
        },
        `Invoice Generated: ${newInvoice.displayId}`
    );

    // --- LEDGER POSTING (INVOICE) ---
    // Rule: Debit Customer (Receivable), Credit Revenue & GST

    // 1. Debit Accounts Receivable (Full Amount)
    postLedgerEntry({
        transactionType: 'INVOICE',
        referenceId: newInvoice.id,
        partyType: 'CUSTOMER',
        partyId: newInvoice.customerId, // Using customer name/ID as key
        partyName: newInvoice.customerName,
        description: `Invoice ${newInvoice.displayId} - Sales`,
        debitAccount: ACCOUNT_MASTER.ACCOUNTS_RECEIVABLE.name,
        creditAccount: 'Sales Clearing', // Temporary contra for multi-split
        amount: newInvoice.totals.grandTotal,
    });

    // 2. Credit Revenue (Vegetable/Insurance/RTO splits)
    newInvoice.lineItems.forEach(item => {
        let revenueAccount = ACCOUNT_MASTER.SALES_VEHICLE;
        if (item.type === 'SERVICE' && item.label.includes('Insurance'))
            revenueAccount = ACCOUNT_MASTER.SALES_INSURANCE;
        if (item.type === 'FEE' && item.label.includes('RTO')) revenueAccount = ACCOUNT_MASTER.SALES_RTO;

        if (item.taxableValue > 0) {
            postLedgerEntry({
                transactionType: 'INVOICE',
                referenceId: newInvoice.id,
                partyType: 'CUSTOMER',
                partyId: newInvoice.customerId,
                partyName: newInvoice.customerName,
                description: `Rev: ${item.label}`,
                debitAccount: 'Sales Clearing',
                creditAccount: revenueAccount.name,
                amount: item.taxableValue,
            });
        }
    });

    // 3. Credit Output GST
    const totalGst = newInvoice.totals.cgstTotal + newInvoice.totals.sgstTotal + newInvoice.totals.igstTotal;
    if (totalGst > 0) {
        postLedgerEntry({
            transactionType: 'INVOICE',
            referenceId: newInvoice.id,
            partyType: 'TAX_AUTHORITY',
            partyId: 'GST-AUTH', // Generic Tax Authority
            partyName: 'GST Authority',
            description: `GST on Invoice ${newInvoice.displayId}`,
            debitAccount: 'Sales Clearing',
            creditAccount: ACCOUNT_MASTER.OUTPUT_GST.name,
            amount: totalGst,
        });
    }

    return newInvoice;
};

// --- LEDGER MODULE ---
const LEDGER: LedgerEntry[] = [];

export const getLedgerEntries = () => LEDGER;

export const getPartyLedger = (partyId: string) => LEDGER.filter(e => e.partyId === partyId);

export const postLedgerEntry = (entry: Omit<LedgerEntry, 'id' | 'displayId' | 'transactionDate' | 'tenantId'>) => {
    // 1. Idempotency Check
    const exists = LEDGER.some(
        e =>
            e.referenceId === entry.referenceId &&
            e.creditAccount === entry.creditAccount &&
            e.debitAccount === entry.debitAccount
    );
    if (exists) {
        console.warn(`Duplicate Ledger Posting Prevented: Ref ${entry.referenceId}`);
        return;
    }

    // 2. Create Entry
    const newEntry: LedgerEntry = {
        ...entry,
        id: crypto.randomUUID(),
        displayId: generateDisplayId('A_JOURNAL'), // Using generic random ID
        transactionDate: new Date().toISOString(),
        tenantId: 'dealer-001', // Mock Context
    };

    // 3. Post
    LEDGER.push(newEntry);
    return newEntry;
};

// --- RECEIPTS MODULE ---
import { Receipt, PaymentMode } from '@/types/payment';
let RECEIPTS: Receipt[] = [];

export const getReceiptsForInvoice = (invoiceId: string) => RECEIPTS.filter(r => r.invoiceId === invoiceId);

export const recordPayment = (
    invoiceId: string,
    amount: number,
    mode: PaymentMode,
    reference: string = '',
    receivedBy: string = 'System User'
): Receipt => {
    const invoice = INVOICES.find(i => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (amount <= 0) throw new Error('Payment amount must be greater than 0');

    const newReceipt: Receipt = {
        id: crypto.randomUUID(),
        displayId: generateDisplayId('RECEIPT'),
        invoiceId: invoice.id,
        invoiceDisplayId: invoice.displayId,
        bookingId: invoice.bookingId,
        amount,
        mode,
        reference,
        receivedBy,
        receivedAt: new Date().toISOString(),
        invoiceTotalAtReceipt: invoice.totals.grandTotal, // Locked Snapshot of Total
        isImmutable: true,
    };

    RECEIPTS = [newReceipt, ...RECEIPTS];

    // Update Invoice Payment Status
    invoice.amountPaid = (invoice.amountPaid || 0) + amount;
    invoice.amountDue = invoice.totals.grandTotal - invoice.amountPaid;

    if (invoice.amountPaid >= invoice.totals.grandTotal) {
        if (invoice.amountPaid > invoice.totals.grandTotal) {
            invoice.paymentStatus = 'OVERPAID';
        } else {
            invoice.paymentStatus = 'PAID';
        }
    } else if (invoice.amountPaid > 0) {
        invoice.paymentStatus = 'PARTIALLY_PAID';
    } else {
        invoice.paymentStatus = 'UNPAID';
    }

    // Audit Log
    updateBookingStatus(invoice.bookingId, {}, `Payment Received: ${newReceipt.displayId} (${mode}) - ₹${amount}`);

    // --- LEDGER POSTING (RECEIPT) ---
    // Rule: Debit Cash/Bank, Credit Customer (Receivable)
    const debitAcc = mode === 'CASH' ? ACCOUNT_MASTER.CASH : ACCOUNT_MASTER.BANK;

    postLedgerEntry({
        transactionType: 'RECEIPT',
        referenceId: newReceipt.id,
        partyType: 'CUSTOMER',
        partyId: invoice.customerId,
        partyName: invoice.customerName,
        description: `Receipt ${newReceipt.displayId} (${mode})`,
        debitAccount: debitAcc.name,
        creditAccount: ACCOUNT_MASTER.ACCOUNTS_RECEIVABLE.name,
        amount: amount,
    });

    return newReceipt;
};

// --- CREDIT NOTES MODULE ---
import { CreditNote, Refund } from '@/types/ledger';

let CREDIT_NOTES: CreditNote[] = [];
let REFUNDS: Refund[] = [];

export const getAllCreditNotes = () => CREDIT_NOTES;
export const getCreditNotesForInvoice = (invoiceId: string) => CREDIT_NOTES.filter(cn => cn.invoiceId === invoiceId);

export const generateCreditNote = (invoiceId: string, reason: string) => {
    const invoice = INVOICES.find(i => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    // Reversal Logic (Simplistic: Full Reversal for now as per prompt)
    const reversalAmount = invoice.totals.grandTotal;
    const reversalTax = invoice.totals.cgstTotal + invoice.totals.sgstTotal + invoice.totals.igstTotal;
    const reversalTaxable = invoice.totals.taxableTotal;

    const newCN: CreditNote = {
        id: crypto.randomUUID(),
        displayId: generateDisplayId('INVOICE'),
        invoiceId: invoice.id,
        bookingId: invoice.bookingId,
        reason,
        lineItems: invoice.lineItems, // Full Mirror
        taxableAmount: reversalTaxable,
        taxAmount: reversalTax,
        totalAmount: reversalAmount,
        status: 'ISSUED',
        createdAt: new Date().toISOString(),
        tenantId: 'dealer-001',
    };

    CREDIT_NOTES = [newCN, ...CREDIT_NOTES];

    // --- LEDGER POSTING (CREDIT NOTE) ---
    // Rule: Dr Sales Return, Dr GST, Cr Accounts Receivable

    // 1. Dr Sales Return (Contra Revenue)
    postLedgerEntry({
        transactionType: 'A_JOURNAL', // CN is a journal adjustment effectively
        referenceId: newCN.id,
        partyType: 'CUSTOMER',
        partyId: invoice.customerId,
        partyName: invoice.customerName,
        description: `CN ${newCN.displayId} - Sales Return`,
        debitAccount: ACCOUNT_MASTER.SALES_RETURNS.name,
        creditAccount: 'Accounts Receivable (Clearing)',
        amount: reversalTaxable,
    });

    // 2. Dr Output GST (Reversing Liability)
    if (reversalTax > 0) {
        postLedgerEntry({
            transactionType: 'A_JOURNAL',
            referenceId: newCN.id,
            partyType: 'TAX_AUTHORITY',
            partyId: 'GST-AUTH',
            partyName: 'GST Authority',
            description: `CN ${newCN.displayId} - GST Reversal`,
            debitAccount: ACCOUNT_MASTER.OUTPUT_GST.name,
            creditAccount: 'Accounts Receivable (Clearing)',
            amount: reversalTax,
        });
    }

    // 3. Cr Accounts Receivable (Total)
    postLedgerEntry({
        transactionType: 'A_JOURNAL',
        referenceId: newCN.id,
        partyType: 'CUSTOMER',
        partyId: invoice.customerId,
        partyName: invoice.customerName,
        description: `CN ${newCN.displayId} - Credit Given`,
        debitAccount: 'Sales Returns/GST (Clearing)',
        creditAccount: ACCOUNT_MASTER.ACCOUNTS_RECEIVABLE.name,
        amount: reversalAmount,
    });

    // Update Booking Status
    updateBookingStatus(invoice.bookingId, {}, `Credit Note Issued: ${newCN.displayId} - Full Reversal`);

    return newCN;
};

// --- REFUND MODULE ---

export const getRefunds = () => REFUNDS;
export const getRefundsForCreditNote = (cnId: string) => REFUNDS.filter(r => r.creditNoteId === cnId);

export const processRefund = (creditNoteId: string, amount: number, mode: 'CASH' | 'BANK' | 'UPI' | 'CHEQUE') => {
    const cn = CREDIT_NOTES.find(c => c.id === creditNoteId);
    if (!cn) throw new Error('Credit Note not found');

    if (amount > cn.totalAmount) throw new Error('Refund amount cannot exceed Credit Note amount');

    const newRefund: Refund = {
        id: crypto.randomUUID(),
        displayId: generateDisplayId('RECEIPT'), // Reusing Receipt ID style
        creditNoteId: cn.id,
        amount,
        mode,
        refundedAt: new Date().toISOString(),
    };

    REFUNDS = [newRefund, ...REFUNDS];

    // --- LEDGER POSTING (REFUND) ---
    // Rule: Dr Accounts Receivable, Cr Bank/Cash

    const creditAcc = mode === 'CASH' ? ACCOUNT_MASTER.CASH : ACCOUNT_MASTER.BANK;

    postLedgerEntry({
        transactionType: 'A_JOURNAL', // Refund is an adjustment/payment
        referenceId: newRefund.id,
        partyType: 'CUSTOMER',
        partyId: 'Unknown', // Need to lookup from CN -> Invoice -> Customer
        partyName: 'Customer', // Simplified
        description: `Refund ${newRefund.displayId} for CN ${cn.displayId}`,
        debitAccount: ACCOUNT_MASTER.ACCOUNTS_RECEIVABLE.name,
        creditAccount: creditAcc.name,
        amount: amount,
    });

    // Update CN Status if fully refunded
    const totalRefunded = REFUNDS.filter(r => r.creditNoteId === cn.id).reduce((sum, r) => sum + r.amount, 0);
    if (totalRefunded >= cn.totalAmount) {
        cn.status = 'REFUNDED';
    }

    return newRefund;
};
