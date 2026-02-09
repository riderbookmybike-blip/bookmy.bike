export type BookingStatus =
    | 'DRAFT'
    | 'IN_REVIEW'
    | 'APPROVED'
    | 'DENIED'
    | 'CONFIRMED'
    | 'CANCELED'
    | 'SUPERSEDED'
    | 'DELIVERED';
export type AllotmentStatus = 'NONE' | 'SOFT_LOCK' | 'HARD_LOCK';
export type PdiStatus = 'PENDING' | 'PASSED' | 'FAILED';
export type OperationalStage = 'QUOTE' | 'BOOKING' | 'PAYMENT' | 'FINANCE' | 'ALLOTMENT' | 'COMPLIANCE' | 'DELIVERED';
import { PriceSnapshot } from './pricing';

export interface Booking {
    id: string; // Internal UUID
    displayId: string; // BK-24-LOC-XXX
    salesOrderId: string;
    salesOrderDisplayId?: string; // SO-24-LOC-XXX
    customerName: string;

    // Product Snapshot (inherited from SO)
    brandName: string;
    modelName: string;
    variantName: string;
    price: number;

    // Locked Price Context
    priceSnapshot?: PriceSnapshot;

    // Status & Stage
    status: BookingStatus;
    operationalStage: OperationalStage;
    allotmentStatus: AllotmentStatus;
    booking_amount_paid?: boolean;

    // Stage Audit
    stage_updated_at?: string;
    stage_updated_by?: string;

    // Step 6: Insurance & RTO
    insuranceStatus?: 'PENDING' | 'COMPLETED';
    insuranceAmount?: number;
    insuranceProvider?: string;

    rtoStatus?: 'PENDING' | 'REGISTRATION_REQUESTED' | 'SUBMITTED' | 'TAX_PAID' | 'NUMBER_ASSIGNED';
    rtoAmount?: number;
    registrationNumber?: string;

    // Step 9: VIN / Chassis
    assignedVin?: string;
    assignedEngineNumber?: string;

    // Step 11: PDI
    pdiStatus?: PdiStatus;
    pdiMeta?: Record<string, any>;

    // Step 12: Documents
    documents?: {
        invoiceAck: boolean;
        deliveryNoteAck: boolean;
        insurancePolicyNo?: string;
        rcStatus: 'PENDING' | 'APPLIED' | 'RECEIVED';
        customerAck: boolean;
        ackDate?: string;
    };

    // Step 15: Invoice
    invoiceId?: string;
    invoiceDisplayId?: string;

    // Audit
    history: BookingHistory[];
}

export interface BookingHistory {
    timestamp: string;
    action: string;
    user: string;
}

// Mock Super Admin Rules (Step 6)
export interface InsuranceRule {
    id: string;
    providerName: string;
    baseRate: number;
    addons: { name: string; cost: number }[];
}

export interface RTORule {
    state: string;
    roadTaxPercent: number;
    registrationFee: number;
}
