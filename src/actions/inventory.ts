'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/auth/resolver';
import { revalidatePath } from 'next/cache';

// =============================================================================
// Types
// =============================================================================

export interface StockCheckResult {
    sku_id: string;
    available_qty: number;
    required_qty: number;
    shortage_qty: number;
    has_shortage: boolean;
}

export interface CreateRequisitionInput {
    tenant_id: string;
    items: Array<{
        sku_id: string;
        qty: number;
        notes?: string;
    }>;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    request_branch_id?: string;
    request_warehouse_id?: string;
    delivery_branch_id?: string;
    delivery_warehouse_id?: string;
    customer_name?: string;
}

export interface CreateProcurementQuoteInput {
    requisition_item_id: string;
    supplier_id: string;
    unit_cost: number;
    tax_amount: number;
    freight_amount: number;
    lead_time_days?: number;
    valid_till?: string;
}

// =============================================================================
// 1. Shortage Gate — Check Stock Availability
// =============================================================================

/**
 * Counts AVAILABLE stock units for a given SKU owned by the tenant.
 * inv_stock has no branch_id column yet — this is a global (tenant-scoped) check.
 * Each inv_stock row = 1 physical unit (vehicles and accessories alike).
 */
export async function checkStockAvailability(
    sku_id: string,
    required_qty: number,
    tenant_id: string
): Promise<StockCheckResult> {
    const { count, error } = await adminClient
        .from('inv_stock')
        .select('id', { count: 'exact', head: true })
        .eq('sku_id', sku_id)
        .eq('current_owner_id', tenant_id)
        .eq('status', 'AVAILABLE');

    if (error) {
        console.error('[checkStockAvailability] Error:', error);
        // On error, assume no stock to be safe
        return {
            sku_id,
            available_qty: 0,
            required_qty,
            shortage_qty: required_qty,
            has_shortage: true,
        };
    }

    const available_qty = count ?? 0;
    const shortage_qty = Math.max(0, required_qty - available_qty);

    return {
        sku_id,
        available_qty,
        required_qty,
        shortage_qty,
        has_shortage: shortage_qty > 0,
    };
}

// =============================================================================
// 2. Direct Requisition Creation
// =============================================================================

export async function createDirectRequisition(
    input: CreateRequisitionInput
): Promise<{ success: boolean; data?: any; message?: string }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    if (!input.items || input.items.length === 0) {
        return { success: false, message: 'At least one item is required.' };
    }

    try {
        // Create requisition header
        const { data: requisition, error: reqErr } = await adminClient
            .from('inv_requisitions')
            .insert({
                tenant_id: input.tenant_id,
                source_type: 'DIRECT',
                status: 'SUBMITTED',
                priority: input.priority || 'MEDIUM',
                requested_by_user_id: user.id,
                request_branch_id: input.request_branch_id || null,
                request_warehouse_id: input.request_warehouse_id || null,
                delivery_branch_id: input.delivery_branch_id || null,
                delivery_warehouse_id: input.delivery_warehouse_id || null,
                customer_name: input.customer_name || null,
            })
            .select()
            .single();

        if (reqErr) throw reqErr;

        // Create requisition items
        const itemRows = input.items.map(item => ({
            requisition_id: requisition.id,
            sku_id: item.sku_id,
            quantity: item.qty,
            notes: item.notes || null,
            tenant_id: input.tenant_id,
            status: 'OPEN',
        }));

        const { error: itemErr } = await adminClient.from('inv_requisition_items').insert(itemRows);

        if (itemErr) throw itemErr;

        revalidatePath('/dashboard/inventory/requisitions');
        return { success: true, data: requisition };
    } catch (err: any) {
        console.error('[createDirectRequisition] Error:', err);
        return { success: false, message: err.message || 'Failed to create requisition' };
    }
}

// =============================================================================
// 3. Booking Shortage Check — Auto-Create Requisition
// =============================================================================

/**
 * Called after booking creation. Checks stock for the booking's SKU and
 * auto-creates a BOOKING-sourced requisition if there's a shortage.
 *
 * Guard: will NOT create duplicate requisitions for the same booking.
 */
export async function bookingShortageCheck(
    bookingId: string
): Promise<{
    success: boolean;
    status: 'SUFFICIENT' | 'SHORTAGE_CREATED' | 'SKIPPED';
    requisition_id?: string;
    message?: string;
}> {
    try {
        // 1. Fetch booking details
        const { data: booking, error: bookErr } = await adminClient
            .from('crm_bookings')
            .select('id, sku_id, qty, delivery_branch_id, tenant_id')
            .eq('id', bookingId)
            .eq('is_deleted', false)
            .single();

        if (bookErr || !booking) {
            return { success: false, status: 'SKIPPED', message: 'Booking not found' };
        }

        if (!booking.sku_id) {
            return { success: true, status: 'SKIPPED', message: 'Booking has no sku_id — cannot check stock' };
        }

        if (!booking.tenant_id) {
            return { success: false, status: 'SKIPPED', message: 'Booking has no tenant_id' };
        }

        // 2. No-duplicate guard
        const { data: existingReq } = await adminClient
            .from('inv_requisitions')
            .select('id')
            .eq('booking_id', bookingId)
            .not('status', 'in', '("CANCELLED","FULFILLED")')
            .limit(1)
            .maybeSingle();

        if (existingReq) {
            return {
                success: true,
                status: 'SHORTAGE_CREATED',
                requisition_id: existingReq.id,
                message: 'Requisition already exists for this booking',
            };
        }

        // 3. Check stock
        const stockResult = await checkStockAvailability(booking.sku_id, booking.qty || 1, booking.tenant_id);

        if (!stockResult.has_shortage) {
            return { success: true, status: 'SUFFICIENT' };
        }

        // 4. Create requisition for shortage
        const { data: requisition, error: reqErr } = await adminClient
            .from('inv_requisitions')
            .insert({
                tenant_id: booking.tenant_id,
                source_type: 'BOOKING',
                booking_id: bookingId,
                status: 'SUBMITTED',
                priority: 'HIGH',
                delivery_branch_id: booking.delivery_branch_id || null,
            })
            .select()
            .single();

        if (reqErr) throw reqErr;

        // 5. Create requisition item for the shortage qty
        const { error: itemErr } = await adminClient.from('inv_requisition_items').insert({
            requisition_id: requisition.id,
            sku_id: booking.sku_id,
            quantity: stockResult.shortage_qty,
            tenant_id: booking.tenant_id,
            status: 'OPEN',
            notes: `Auto-created from booking ${bookingId}`,
        });

        if (itemErr) throw itemErr;

        revalidatePath('/dashboard/inventory/requisitions');
        return {
            success: true,
            status: 'SHORTAGE_CREATED',
            requisition_id: requisition.id,
        };
    } catch (err: any) {
        console.error('[bookingShortageCheck] Error:', err);
        return { success: false, status: 'SKIPPED', message: err.message };
    }
}

// =============================================================================
// 4. Procurement Quote — Create
// =============================================================================

export async function createProcurementQuote(
    input: CreateProcurementQuoteInput,
    tenant_id: string
): Promise<{ success: boolean; data?: any; message?: string }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    const landed_cost = (input.unit_cost || 0) + (input.tax_amount || 0) + (input.freight_amount || 0);

    try {
        const { data: quote, error } = await adminClient
            .from('inv_procurement_quotes')
            .insert({
                tenant_id,
                requisition_item_id: input.requisition_item_id,
                supplier_id: input.supplier_id,
                unit_cost: input.unit_cost,
                tax_amount: input.tax_amount,
                freight_amount: input.freight_amount,
                landed_cost,
                lead_time_days: input.lead_time_days || null,
                valid_till: input.valid_till || null,
                quoted_by_user_id: user.id,
                quoted_at: new Date().toISOString(),
                status: 'SUBMITTED',
                created_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: quote };
    } catch (err: any) {
        console.error('[createProcurementQuote] Error:', err);
        return { success: false, message: err.message };
    }
}

// =============================================================================
// 5. Procurement Quote — Select
// =============================================================================

export async function selectProcurementQuote(
    quoteId: string,
    selectionReason?: string
): Promise<{ success: boolean; message?: string }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    try {
        // Fetch the quote to get requisition_item_id
        const { data: quote, error: fetchErr } = await adminClient
            .from('inv_procurement_quotes')
            .select('id, requisition_item_id, landed_cost')
            .eq('id', quoteId)
            .single();

        if (fetchErr || !quote) return { success: false, message: 'Quote not found' };

        // Check if this is the cheapest quote — if not, require selection_reason
        const { data: cheapest } = await adminClient
            .from('inv_procurement_quotes')
            .select('id, landed_cost')
            .eq('requisition_item_id', quote.requisition_item_id)
            .not('status', 'in', '("REJECTED","EXPIRED")')
            .order('landed_cost', { ascending: true })
            .limit(1)
            .single();

        if (cheapest && cheapest.id !== quoteId && !selectionReason) {
            return {
                success: false,
                message: 'Selection reason required when not selecting the lowest landed cost quote.',
            };
        }

        // Deselect any previously selected quote for this item
        await adminClient
            .from('inv_procurement_quotes')
            .update({ status: 'SUBMITTED', updated_by: user.id, updated_at: new Date().toISOString() })
            .eq('requisition_item_id', quote.requisition_item_id)
            .eq('status', 'SELECTED');

        // Select this quote
        const { error: updateErr } = await adminClient
            .from('inv_procurement_quotes')
            .update({
                status: 'SELECTED',
                selection_reason: selectionReason || null,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', quoteId);

        if (updateErr) throw updateErr;

        return { success: true };
    } catch (err: any) {
        console.error('[selectProcurementQuote] Error:', err);
        return { success: false, message: err.message };
    }
}

// =============================================================================
// 6. Requisition Status Transitions
// =============================================================================

const VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['IN_PROCUREMENT', 'CANCELLED'],
    PENDING: ['SUBMITTED', 'IN_PROCUREMENT', 'CANCELLED'], // legacy compat
    IN_PROCUREMENT: ['FULFILLED', 'CANCELLED'],
};

export async function updateRequisitionStatus(
    requisitionId: string,
    newStatus: string,
    reason?: string
): Promise<{ success: boolean; message?: string }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    try {
        const { data: req, error: fetchErr } = await adminClient
            .from('inv_requisitions')
            .select('id, status, booking_id')
            .eq('id', requisitionId)
            .single();

        if (fetchErr || !req) return { success: false, message: 'Requisition not found' };

        const allowed = VALID_TRANSITIONS[req.status] || [];
        if (!allowed.includes(newStatus)) {
            return {
                success: false,
                message: `Cannot transition from ${req.status} to ${newStatus}. Allowed: ${allowed.join(', ')}.`,
            };
        }

        const { error: updateErr } = await adminClient
            .from('inv_requisitions')
            .update({
                status: newStatus,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', requisitionId);

        if (updateErr) throw updateErr;

        revalidatePath('/dashboard/inventory/requisitions');
        return { success: true };
    } catch (err: any) {
        console.error('[updateRequisitionStatus] Error:', err);
        return { success: false, message: err.message };
    }
}

// =============================================================================
// 7. Data Fetching — Requisitions List
// =============================================================================

export async function getRequisitions(tenantId: string) {
    const { data, error } = await adminClient
        .from('inv_requisitions')
        .select(
            `
            *,
            items:inv_requisition_items (
                id, sku_id, quantity, notes, status
            )
        `
        )
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getRequisitions] Error:', error);
        return [];
    }

    return data || [];
}

// =============================================================================
// 8. Data Fetching — Requisition Detail
// =============================================================================

export async function getRequisitionById(requisitionId: string) {
    const { data, error } = await adminClient
        .from('inv_requisitions')
        .select(
            `
            *,
            items:inv_requisition_items (
                id, sku_id, quantity, notes, status,
                quotes:inv_procurement_quotes (
                    id, supplier_id, unit_cost, tax_amount, freight_amount,
                    landed_cost, lead_time_days, valid_till, status,
                    selection_reason, quoted_at
                )
            )
        `
        )
        .eq('id', requisitionId)
        .single();

    if (error) {
        console.error('[getRequisitionById] Error:', error);
        return null;
    }

    return data;
}

// =============================================================================
// 9. Data Fetching — Suppliers (Tenants)
// =============================================================================

export async function getSupplierTenants() {
    const { data, error } = await adminClient.from('id_tenants').select('id, name').order('name');

    if (error) {
        console.error('[getSupplierTenants] Error:', error);
        return [];
    }

    return data || [];
}
