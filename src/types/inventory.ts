// =============================================================================
// INV-001: Strict Inventory Types (matches new schema, zero JSONB)
// =============================================================================

// --- Enums (mirror DB enums) ---

export type InvRequestStatus = 'QUOTING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
export type InvCostType =
    | 'EX_SHOWROOM'
    | 'INSURANCE_TP'
    | 'INSURANCE_ZD'
    | 'RTO_REGISTRATION'
    | 'HYPOTHECATION'
    | 'TRANSPORT'
    | 'ACCESSORY'
    | 'OTHER';
export type InvQuoteStatus = 'SUBMITTED' | 'SELECTED' | 'REJECTED';
export type InvPaymentStatus = 'UNPAID' | 'PARTIAL_PAID' | 'FULLY_PAID';
export type InvPoStatus = 'DRAFT' | 'SENT' | 'SHIPPED' | 'RECEIVED';
export type InvQcStatus = 'PENDING' | 'PASSED' | 'FAILED_DAMAGE' | 'FAILED_MISSING';
export type InvStockStatus = 'AVAILABLE' | 'SOFT_LOCKED' | 'HARD_LOCKED' | 'SOLD' | 'IN_TRANSIT';
export type InvLedgerAction =
    | 'RECEIVED'
    | 'QC_PASSED'
    | 'QC_FAILED'
    | 'SOFT_LOCKED'
    | 'HARD_LOCKED'
    | 'UNLOCKED'
    | 'SOLD'
    | 'TRANSFERRED'
    | 'DAMAGED';
export type InvSourceType = 'BOOKING' | 'DIRECT';

// --- Row Types ---

export interface InvRequest {
    id: string;
    tenant_id: string;
    booking_id: string | null;
    sku_id: string;
    source_type: InvSourceType;
    status: InvRequestStatus;
    delivery_branch_id: string | null;
    display_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvRequestItem {
    id: string;
    request_id: string;
    cost_type: InvCostType;
    expected_amount: number;
    description: string | null;
}

export interface InvDealerQuote {
    id: string;
    request_id: string;
    dealer_tenant_id: string;
    quoted_by_user_id: string | null;
    bundled_item_ids: string[];
    bundled_amount: number;
    expected_total: number;
    variance_amount: number; // Generated column
    transport_amount: number;
    freebie_description: string | null;
    freebie_sku_id: string | null;
    status: InvQuoteStatus;
    created_at: string;
}

export interface InvQuoteLineItem {
    id: string;
    quote_id: string;
    request_item_id: string;
    offered_amount: number;
    notes: string | null;
    created_at: string;
}

export interface InvQuoteTerms {
    quote_id: string;
    payment_mode: 'ADVANCE' | 'PARTIAL' | 'CREDIT' | 'OTHER' | null;
    credit_days: number | null;
    advance_percent: number | null;
    expected_dispatch_days: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvPurchaseOrder {
    id: string;
    request_id: string;
    quote_id: string;
    dealer_tenant_id: string;
    total_po_value: number;
    payment_status: InvPaymentStatus;
    po_status: InvPoStatus;
    display_id: string | null;
    transporter_name: string | null;
    docket_number: string | null;
    expected_delivery_date: string | null;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvPoPayment {
    id: string;
    po_id: string;
    transaction_id: string | null; // FK to acc_transactions when Books module lands
    amount_paid: number;
    payment_date: string;
    created_by: string | null;
}

export interface InvStock {
    id: string;
    tenant_id: string;
    po_id: string;
    sku_id: string;
    branch_id: string;
    chassis_number: string;
    engine_number: string;
    battery_make: string | null;
    media_chassis_url: string;
    media_engine_url: string;
    media_sticker_url: string | null;
    media_damage_urls: string[] | null;
    media_qc_video_url: string;
    qc_status: InvQcStatus;
    qc_notes: string | null;
    status: InvStockStatus;
    is_shared: boolean;
    locked_by_tenant_id: string | null;
    locked_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvStockLedger {
    id: string;
    stock_id: string;
    action: InvLedgerAction;
    actor_tenant_id: string | null;
    actor_user_id: string | null;
    notes: string | null;
    created_at: string;
}

// --- Input Types for Server Actions ---

export interface CreateRequestInput {
    tenant_id: string;
    sku_id: string;
    booking_id?: string;
    source_type?: InvSourceType;
    delivery_branch_id?: string;
    items: Array<{
        cost_type: InvCostType;
        expected_amount: number;
        description?: string;
    }>;
}

export interface AddDealerQuoteInput {
    request_id: string;
    dealer_tenant_id: string;
    bundled_item_ids: string[];
    bundled_amount: number;
    transport_amount?: number;
    freebie_description?: string;
    freebie_sku_id?: string;
    line_items?: Array<{
        request_item_id: string;
        offered_amount: number;
        notes?: string | null;
    }>;
    payment_terms?: {
        payment_mode?: 'ADVANCE' | 'PARTIAL' | 'CREDIT' | 'OTHER' | null;
        credit_days?: number | null;
        advance_percent?: number | null;
        expected_dispatch_days?: number | null;
        notes?: string | null;
    } | null;
}

export interface ReceiveStockInput {
    po_id: string;
    tenant_id: string;
    sku_id: string;
    branch_id: string;
    chassis_number: string;
    engine_number: string;
    battery_make?: string;
    media_chassis_url: string;
    media_engine_url: string;
    media_sticker_url?: string;
    media_qc_video_url: string;
    qc_notes?: string;
}
