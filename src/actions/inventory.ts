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
export async function bookingShortageCheck(bookingId: string): Promise<{
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
            .eq('requisition_item_id', quote.requisition_item_id as string)
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
            .eq('requisition_item_id', quote.requisition_item_id as string)
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

        const allowed = VALID_TRANSITIONS[req.status as keyof typeof VALID_TRANSITIONS] || [];
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

// =============================================================================
// PHASE C: PURCHASE ORDERS
// =============================================================================

export interface CreatePurchaseOrderInput {
    tenant_id: string;
    requisition_id?: string;
    vendor_name: string;
    transporter_name?: string;
    transporter_contact?: string;
    docket_number?: string;
    expected_date?: string;
    delivery_branch_id?: string;
    delivery_warehouse_id?: string;
    items: Array<{
        sku_id: string;
        ordered_qty: number;
        unit_cost?: number;
        requisition_item_id?: string;
    }>;
}

// 10. Create Purchase Order
export async function createPurchaseOrder(
    input: CreatePurchaseOrderInput
): Promise<{ success: boolean; data?: any; message?: string }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    if (!input.items || input.items.length === 0) {
        return { success: false, message: 'At least one item is required.' };
    }

    try {
        const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Create PO header — use 'ORDERED' (valid po_status enum value)
        const { data: po, error: poErr } = await adminClient
            .from('inv_purchase_orders')
            .insert({
                tenant_id: input.tenant_id,
                order_number: orderNumber,
                status: 'ORDERED',
                requisition_id: input.requisition_id || null,
                vendor_name: input.vendor_name,
                transporter_name: input.transporter_name || null,
                transporter_contact: input.transporter_contact || null,
                docket_number: input.docket_number || null,
                expected_date: input.expected_date || null,
                delivery_branch_id: input.delivery_branch_id || null,
                delivery_warehouse_id: input.delivery_warehouse_id || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (poErr) throw poErr;

        // Create PO items
        const poItems = input.items.map(item => ({
            po_id: po.id,
            purchase_order_id: po.id,
            sku_id: item.sku_id,
            ordered_qty: item.ordered_qty,
            unit_cost: item.unit_cost || null,
            requisition_item_id: item.requisition_item_id || null,
            tenant_id: input.tenant_id,
            status: 'ORDERED',
            created_by: user.id,
        }));

        const { error: itemErr } = await adminClient.from('inv_purchase_order_items').insert(poItems);
        if (itemErr) throw itemErr;

        // Transition linked requisition to IN_PROCUREMENT
        if (input.requisition_id) {
            await adminClient
                .from('inv_requisitions')
                .update({ status: 'IN_PROCUREMENT', updated_by: user.id, updated_at: new Date().toISOString() })
                .eq('id', input.requisition_id);
        }

        revalidatePath('/dashboard/inventory/orders');
        revalidatePath('/dashboard/inventory/requisitions');
        return { success: true, data: po };
    } catch (err: any) {
        console.error('[createPurchaseOrder] Error:', err);
        return { success: false, message: err.message };
    }
}

// 11. Get Purchase Orders List
export async function getPurchaseOrders(tenantId: string) {
    const { data, error } = await adminClient
        .from('inv_purchase_orders')
        .select(
            `
            *,
            items:inv_purchase_order_items (
                id, sku_id, ordered_qty, received_qty, unit_cost, status
            )
        `
        )
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getPurchaseOrders] Error:', error);
        return [];
    }
    return data || [];
}

// 12. Get PO Detail
export async function getPurchaseOrderById(poId: string) {
    const { data, error } = await adminClient
        .from('inv_purchase_orders')
        .select(
            `
            *,
            items:inv_purchase_order_items (
                id, sku_id, ordered_qty, received_qty, unit_cost, status, requisition_item_id
            ),
            grns:inv_grn (
                id, status, created_at,
                items:inv_grn_items (
                    id, sku_id, received, accepted, rejected,
                    vehicle_details:inv_grn_vehicle_details (
                        id, chassis_number, engine_number, key_number, manufacturing_date
                    )
                )
            )
        `
        )
        .eq('id', poId)
        .single();

    if (error) {
        console.error('[getPurchaseOrderById] Error:', error);
        return null;
    }
    return data;
}

// =============================================================================
// PHASE C: GOODS RECEIPT NOTE (GRN)
// =============================================================================

export interface GRNVehicleDetail {
    chassis_number: string;
    engine_number: string;
    key_number?: string;
    manufacturing_date?: string;
    battery_brand?: string;
    battery_number?: string;
    tyre_make?: string;
}

export interface CreateGRNInput {
    tenant_id: string;
    purchase_order_id: string;
    delivery_challan_id?: string;
    delivery_branch_id?: string;
    delivery_warehouse_id?: string;
    items: Array<{
        purchase_order_item_id: string;
        sku_id: string;
        received: number;
        accepted: number;
        rejected: number;
        vehicles: GRNVehicleDetail[];
    }>;
}

// 13. Create GRN (Draft)
export async function createGRN(input: CreateGRNInput): Promise<{ success: boolean; data?: any; message?: string }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    try {
        // Create GRN header
        const { data: grn, error: grnErr } = await adminClient
            .from('inv_grn')
            .insert({
                tenant_id: input.tenant_id,
                purchase_order_id: input.purchase_order_id,
                delivery_challan_id: input.delivery_challan_id || null,
                delivery_branch_id: input.delivery_branch_id || null,
                delivery_warehouse_id: input.delivery_warehouse_id || null,
                status: 'DRAFT',
                created_by: user.id,
            })
            .select()
            .single();

        if (grnErr) throw grnErr;

        // Create GRN items
        for (const item of input.items) {
            const { data: grnItem, error: itemErr } = await adminClient
                .from('inv_grn_items')
                .insert({
                    grn_id: grn.id,
                    purchase_order_item_id: item.purchase_order_item_id,
                    sku_id: item.sku_id,
                    received: item.received,
                    accepted: item.accepted,
                    rejected: item.rejected,
                    tenant_id: input.tenant_id,
                    created_by: user.id,
                })
                .select()
                .single();

            if (itemErr) throw itemErr;

            // Insert vehicle details for each accepted unit
            if (item.vehicles && item.vehicles.length > 0) {
                const vehicleRows = item.vehicles.map(v => ({
                    grn_item_id: grnItem.id,
                    chassis_number: v.chassis_number,
                    engine_number: v.engine_number,
                    key_number: v.key_number || null,
                    manufacturing_date: v.manufacturing_date || null,
                    battery_brand: v.battery_brand || null,
                    battery_number: v.battery_number || null,
                    tyre_make: v.tyre_make || null,
                }));

                const { error: vehErr } = await adminClient.from('inv_grn_vehicle_details').insert(vehicleRows);

                if (vehErr) throw vehErr;
            }
        }

        return { success: true, data: grn };
    } catch (err: any) {
        console.error('[createGRN] Error:', err);
        return { success: false, message: err.message };
    }
}

// 14. Confirm GRN — posts stock
export async function confirmGRN(
    grnId: string
): Promise<{ success: boolean; message?: string; stock_posted?: number }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    try {
        // Fetch GRN with items and vehicle details
        const { data: grn, error: fetchErr } = await adminClient
            .from('inv_grn')
            .select(
                `
                *,
                items:inv_grn_items (
                    id, purchase_order_item_id, sku_id, received, accepted, rejected,
                    vehicle_details:inv_grn_vehicle_details (
                        id, chassis_number, engine_number, key_number, manufacturing_date,
                        battery_brand, battery_number, tyre_make
                    )
                )
            `
            )
            .eq('id', grnId)
            .single();

        if (fetchErr || !grn) return { success: false, message: 'GRN not found' };

        if (grn.status === 'CONFIRMED') {
            return { success: false, message: 'GRN already confirmed' };
        }

        let totalStockPosted = 0;

        for (const item of grn.items) {
            // 1. Update PO item received_qty
            if (item.purchase_order_item_id) {
                const { data: poItem } = await adminClient
                    .from('inv_purchase_order_items')
                    .select('received_qty')
                    .eq('id', item.purchase_order_item_id)
                    .single();

                const newReceivedQty = (poItem?.received_qty || 0) + item.accepted;

                await adminClient
                    .from('inv_purchase_order_items')
                    .update({
                        received_qty: newReceivedQty,
                        status: 'RECEIVED',
                        updated_by: user.id,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', item.purchase_order_item_id);
            }

            // 2. Post stock — 1 inv_stock row per vehicle
            for (const vehicle of item.vehicle_details || []) {
                const { error: stockErr } = await (adminClient as any).from('inv_stock').insert({
                    sku_id: item.sku_id,
                    chassis_number: vehicle.chassis_number,
                    engine_number: vehicle.engine_number,
                    status: 'AVAILABLE',
                    current_owner_id: grn.tenant_id,
                });

                if (stockErr) {
                    console.error('[confirmGRN] Stock insert error:', stockErr);
                    continue; // Don't fail entire GRN for one stock error
                }
                totalStockPosted++;
            }

            // 3. Ledger entry
            if (item.accepted > 0) {
                const branchId =
                    grn.delivery_branch_id || grn.request_branch_id || '00000000-0000-0000-0000-000000000000';
                await (adminClient as any).from('inv_stock_ledger').insert({
                    tenant_id: grn.tenant_id,
                    sku_id: item.sku_id,
                    branch_id: branchId,
                    qty_delta: item.accepted,
                    balance_after: item.accepted, // Simplified — real balance needs aggregate
                    reason_code: 'GRN_INWARD',
                    ref_type: 'GRN',
                    ref_id: grn.id,
                    created_by: user.id,
                });
            }
        }

        // 4. Mark GRN confirmed
        await adminClient
            .from('inv_grn')
            .update({ status: 'CONFIRMED', updated_by: user.id, updated_at: new Date().toISOString() })
            .eq('id', grnId);

        // 5. Check if PO is fully received → auto-complete
        if (grn.purchase_order_id) {
            const { data: poItems } = await adminClient
                .from('inv_purchase_order_items')
                .select('ordered_qty, received_qty')
                .eq('po_id', grn.purchase_order_id);

            if (poItems) {
                const allReceived = poItems.every((i: any) => (i.received_qty || 0) >= i.ordered_qty);
                const someReceived = poItems.some((i: any) => (i.received_qty || 0) > 0);

                const newPoStatus = allReceived ? 'COMPLETED' : someReceived ? 'PARTIALLY_RECEIVED' : 'ORDERED';

                await adminClient
                    .from('inv_purchase_orders')
                    .update({ status: newPoStatus, updated_by: user.id, updated_at: new Date().toISOString() })
                    .eq('id', grn.purchase_order_id);

                // 6. If PO completed and linked to requisition → auto-fulfill
                if (allReceived) {
                    const { data: po } = await adminClient
                        .from('inv_purchase_orders')
                        .select('requisition_id')
                        .eq('id', grn.purchase_order_id)
                        .single();

                    if (po?.requisition_id) {
                        await adminClient
                            .from('inv_requisitions')
                            .update({
                                status: 'FULFILLED',
                                updated_by: user.id,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', po.requisition_id);
                    }
                }
            }
        }

        revalidatePath('/dashboard/inventory/orders');
        revalidatePath('/dashboard/inventory/requisitions');
        revalidatePath('/dashboard/inventory/stock');

        return { success: true, stock_posted: totalStockPosted };
    } catch (err: any) {
        console.error('[confirmGRN] Error:', err);
        return { success: false, message: err.message };
    }
}

// =============================================================================
// PHASE D: STOCK VISIBILITY
// =============================================================================

// 15. Get Stock List
export async function getStock(tenantId: string, filters?: { status?: string }) {
    let query = adminClient
        .from('inv_stock')
        .select('*')
        .eq('current_owner_id', tenantId)
        .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[getStock] Error:', error);
        return [];
    }

    // Resolve SKU names from cat_skus
    const skuIds = (data || []).map(s => s.sku_id).filter(Boolean);
    let skuMap: Record<string, string> = {};
    if (skuIds.length > 0) {
        const uniqueSkuIds = [...new Set(skuIds)];
        const { data: skus } = await adminClient.from('cat_skus').select('id, sku_code').in('id', uniqueSkuIds);
        if (skus) {
            skus.forEach(s => {
                skuMap[s.id] = s.sku_code || s.id.slice(0, 8);
            });
        }
    }

    return (data || []).map(item => ({
        ...item,
        sku_name: skuMap[item.sku_id] || item.sku_id?.slice(0, 12) || 'Unknown',
    }));
}

// 16. Get Stock Detail
export async function getStockById(stockId: string) {
    const { data: stock, error } = await adminClient.from('inv_stock').select('*').eq('id', stockId).single();

    if (error) {
        console.error('[getStockById] Error:', error);
        return null;
    }

    // Resolve SKU name
    let skuName = stock.sku_id?.slice(0, 12) || 'Unknown';
    if (stock.sku_id) {
        const { data: sku } = await adminClient.from('cat_skus').select('sku_code').eq('id', stock.sku_id).single();
        if (sku) skuName = sku.sku_code || skuName;
    }

    // Fetch ledger entries for this SKU + owner
    const { data: ledger } = await (adminClient as any)
        .from('inv_stock_ledger')
        .select('*')
        .eq('sku_id', stock.sku_id)
        .order('created_at', { ascending: false })
        .limit(50);

    return {
        ...stock,
        sku_name: skuName,
        ledger: ledger || [],
    };
}

// 17. Update Stock Status
const STOCK_TRANSITIONS: Record<string, string[]> = {
    IN_TRANSIT: ['AVAILABLE', 'DAMAGED'],
    AVAILABLE: ['RESERVED', 'SOLD', 'DAMAGED', 'IN_TRANSIT'],
    RESERVED: ['AVAILABLE', 'SOLD', 'DAMAGED'],
    SOLD: [], // terminal
    DAMAGED: ['AVAILABLE'], // can be repaired
};

export async function updateStockStatus(
    stockId: string,
    newStatus: string
): Promise<{ success: boolean; message?: string }> {
    const user = await getAuthUser();
    if (!user) return { success: false, message: 'Authentication required' };

    try {
        const { data: stock, error: fetchErr } = await adminClient
            .from('inv_stock')
            .select('id, status, sku_id, current_owner_id')
            .eq('id', stockId)
            .single();

        if (fetchErr || !stock) return { success: false, message: 'Stock item not found' };

        const allowed = STOCK_TRANSITIONS[stock.status as keyof typeof STOCK_TRANSITIONS] || [];
        if (!allowed.includes(newStatus)) {
            return {
                success: false,
                message: `Cannot transition from ${stock.status} to ${newStatus}`,
            };
        }

        const { error: updateErr } = await adminClient
            .from('inv_stock')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', stockId);

        if (updateErr) throw updateErr;

        // Ledger entry for status change
        await (adminClient as any).from('inv_stock_ledger').insert({
            sku_id: stock.sku_id,
            branch_id: '00000000-0000-0000-0000-000000000000',
            qty_delta: newStatus === 'SOLD' ? -1 : 0,
            balance_after: 0, // simplified
            reason_code: `STATUS_${newStatus}`,
            ref_type: 'STOCK_STATUS',
            ref_id: stockId,
            created_by: user.id,
        });

        revalidatePath('/dashboard/inventory/stock');
        return { success: true };
    } catch (err: any) {
        console.error('[updateStockStatus] Error:', err);
        return { success: false, message: err.message };
    }
}
