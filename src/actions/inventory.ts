'use server';

import { adminClient } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/auth/resolver';
import { revalidatePath } from 'next/cache';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import type {
    CreateRequestInput,
    AddDealerQuoteInput,
    ReceiveStockInput,
    InvRequestStatus,
    InvPoStatus,
    InvStockStatus,
} from '@/types/inventory';

// =============================================================================
// Types
// =============================================================================

type ActionResult<T = unknown> = {
    success: boolean;
    data?: T;
    message?: string;
};

const PO_STATUS_TRANSITIONS: Record<InvPoStatus, InvPoStatus[]> = {
    DRAFT: ['SENT'],
    SENT: ['SHIPPED'],
    SHIPPED: ['RECEIVED'],
    RECEIVED: [],
};

async function resolveQuoteItemsForRequest(
    requestId: string,
    bundledItemIds: string[]
): Promise<{ success: boolean; message?: string; resolvedItemIds?: string[]; expectedTotal?: number }> {
    const normalizedItemIds = Array.from(new Set((bundledItemIds || []).filter(Boolean)));
    let resolvedItemIds: string[] = normalizedItemIds;
    let expectedTotal = 0;

    if (normalizedItemIds.length > 0) {
        const { data: items, error: itemsErr } = await adminClient
            .from('inv_request_items')
            .select('id, expected_amount')
            .eq('request_id', requestId)
            .in('id', normalizedItemIds);

        if (itemsErr || !items) {
            return { success: false, message: 'Failed to fetch selected cost lines' };
        }

        if (items.length !== normalizedItemIds.length) {
            return { success: false, message: 'Some selected cost lines are invalid for this requisition' };
        }

        expectedTotal = items.reduce((sum, item) => sum + Number(item.expected_amount), 0);
    } else {
        const { data: allItems, error: allItemsErr } = await adminClient
            .from('inv_request_items')
            .select('id, expected_amount')
            .eq('request_id', requestId);

        if (allItemsErr || !allItems) {
            return { success: false, message: 'Failed to fetch requisition cost lines' };
        }

        resolvedItemIds = allItems.map(item => item.id);
        expectedTotal = allItems.reduce((sum, item) => sum + Number(item.expected_amount), 0);
    }

    return { success: true, resolvedItemIds, expectedTotal };
}

// =============================================================================
// 1. CREATE REQUEST — Auto-fills request items from catalog baseline
// =============================================================================

export async function createRequest(input: CreateRequestInput): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        // Create the request header
        const { data: request, error: reqError } = await adminClient
            .from('inv_requests')
            .insert({
                tenant_id: input.tenant_id,
                sku_id: input.sku_id,
                booking_id: input.booking_id || null,
                source_type: input.source_type || 'DIRECT',
                status: 'QUOTING',
                delivery_branch_id: input.delivery_branch_id || null,
                created_by: user.id,
            })
            .select('id, display_id')
            .single();

        if (reqError || !request) {
            return { success: false, message: reqError?.message || 'Failed to create request' };
        }

        // Insert cost component items
        if (input.items.length > 0) {
            const itemRows = input.items.map(item => ({
                request_id: request.id,
                cost_type: item.cost_type,
                expected_amount: item.expected_amount,
                description: item.description || null,
            }));

            const { error: itemsError } = await adminClient.from('inv_request_items').insert(itemRows);

            if (itemsError) {
                return { success: false, message: `Request created but items failed: ${itemsError.message}` };
            }
        }

        revalidatePath('/dashboard/inventory');
        return { success: true, data: request };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 2. ADD DEALER QUOTE — Staff selects bundled items, enters lumpsum
// =============================================================================

export async function addDealerQuote(input: AddDealerQuoteInput): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        const { data: request, error: requestErr } = await adminClient
            .from('inv_requests')
            .select('id, status')
            .eq('id', input.request_id)
            .single();

        if (requestErr || !request) {
            return { success: false, message: 'Requisition not found' };
        }

        if (request.status !== 'QUOTING') {
            return { success: false, message: `Cannot add quote: requisition is ${request.status}` };
        }

        const { data: existingDealerQuote } = await adminClient
            .from('inv_dealer_quotes')
            .select('id, status')
            .eq('request_id', input.request_id)
            .eq('dealer_tenant_id', input.dealer_tenant_id)
            .in('status', ['SUBMITTED', 'SELECTED'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingDealerQuote) {
            return {
                success: false,
                message: 'Dealer already has an active quote for this requisition. Edit existing quote instead.',
            };
        }

        const resolved = await resolveQuoteItemsForRequest(input.request_id, input.bundled_item_ids || []);
        if (!resolved.success || !resolved.resolvedItemIds) {
            return { success: false, message: resolved.message || 'Failed to resolve quote cost lines' };
        }

        const { data: quote, error: quoteErr } = await adminClient
            .from('inv_dealer_quotes')
            .insert({
                request_id: input.request_id,
                dealer_tenant_id: input.dealer_tenant_id,
                quoted_by_user_id: user.id,
                bundled_item_ids: resolved.resolvedItemIds,
                bundled_amount: input.bundled_amount,
                expected_total: resolved.expectedTotal || 0,
                transport_amount: input.transport_amount || 0,
                freebie_description: input.freebie_description || null,
                freebie_sku_id: input.freebie_sku_id || null,
                status: 'SUBMITTED',
            })
            .select('id, variance_amount')
            .single();

        if (quoteErr || !quote) {
            return { success: false, message: quoteErr?.message || 'Failed to create quote' };
        }

        revalidatePath('/dashboard/inventory');
        return { success: true, data: quote, message: 'Dealer quote added' };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 3. UPDATE DEALER QUOTE — revise submitted quote during QUOTING phase
// =============================================================================

export async function updateDealerQuote(input: {
    quote_id: string;
    bundled_item_ids: string[];
    bundled_amount: number;
    transport_amount?: number;
    freebie_description?: string | null;
}): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        const { data: quote, error: quoteErr } = await adminClient
            .from('inv_dealer_quotes')
            .select('id, request_id, status')
            .eq('id', input.quote_id)
            .single();

        if (quoteErr || !quote) {
            return { success: false, message: 'Quote not found' };
        }

        if (quote.status !== 'SUBMITTED') {
            return { success: false, message: `Only submitted quotes can be edited. Current status: ${quote.status}` };
        }

        const { data: request, error: requestErr } = await adminClient
            .from('inv_requests')
            .select('id, status')
            .eq('id', quote.request_id)
            .single();

        if (requestErr || !request) {
            return { success: false, message: 'Requisition not found' };
        }

        if (request.status !== 'QUOTING') {
            return { success: false, message: `Cannot edit quote: requisition is ${request.status}` };
        }

        const resolved = await resolveQuoteItemsForRequest(quote.request_id, input.bundled_item_ids || []);
        if (!resolved.success || !resolved.resolvedItemIds) {
            return { success: false, message: resolved.message || 'Failed to resolve quote cost lines' };
        }

        const { data: updatedQuote, error: updateErr } = await adminClient
            .from('inv_dealer_quotes')
            .update({
                bundled_item_ids: resolved.resolvedItemIds,
                bundled_amount: input.bundled_amount,
                expected_total: resolved.expectedTotal || 0,
                transport_amount: input.transport_amount || 0,
                freebie_description: input.freebie_description || null,
                quoted_by_user_id: user.id,
            })
            .eq('id', input.quote_id)
            .select('id, variance_amount')
            .single();

        if (updateErr || !updatedQuote) {
            return { success: false, message: updateErr?.message || 'Failed to update quote' };
        }

        revalidatePath('/dashboard/inventory');
        return { success: true, data: updatedQuote, message: 'Dealer quote updated' };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 4. SELECT QUOTE — Marks one quote as SELECTED, rejects others, creates PO
// =============================================================================

export async function selectQuote(quoteId: string): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        // Fetch the winning quote
        const { data: quote, error: fetchErr } = await adminClient
            .from('inv_dealer_quotes')
            .select('id, request_id, dealer_tenant_id, bundled_amount, transport_amount, status')
            .eq('id', quoteId)
            .single();

        if (fetchErr || !quote) {
            return { success: false, message: 'Quote not found' };
        }

        if (quote.status === 'REJECTED') {
            return { success: false, message: 'Rejected quote cannot be selected' };
        }

        const { data: existingPO } = await adminClient
            .from('inv_purchase_orders')
            .select('id, display_id, quote_id')
            .eq('request_id', quote.request_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingPO && existingPO.quote_id !== quoteId) {
            return {
                success: false,
                message: `PO ${existingPO.display_id || existingPO.id} already exists for another selected quote`,
            };
        }

        if (existingPO && existingPO.quote_id === quoteId) {
            await adminClient.from('inv_dealer_quotes').update({ status: 'SELECTED' }).eq('id', quoteId);
            await adminClient
                .from('inv_dealer_quotes')
                .update({ status: 'REJECTED' })
                .eq('request_id', quote.request_id)
                .neq('id', quoteId)
                .eq('status', 'SUBMITTED');
            await adminClient
                .from('inv_requests')
                .update({ status: 'ORDERED', updated_at: new Date().toISOString() })
                .eq('id', quote.request_id);

            revalidatePath('/dashboard/inventory');
            return {
                success: true,
                data: existingPO,
                message: `PO ${existingPO.display_id || existingPO.id} already exists`,
            };
        }

        const totalPoValue = Number(quote.bundled_amount) + Number(quote.transport_amount);

        // Mark this quote as SELECTED
        await adminClient.from('inv_dealer_quotes').update({ status: 'SELECTED' }).eq('id', quoteId);

        // Reject all other quotes for the same request
        await adminClient
            .from('inv_dealer_quotes')
            .update({ status: 'REJECTED' })
            .eq('request_id', quote.request_id)
            .neq('id', quoteId)
            .eq('status', 'SUBMITTED');

        // Update request status to ORDERED
        await adminClient
            .from('inv_requests')
            .update({ status: 'ORDERED', updated_at: new Date().toISOString() })
            .eq('id', quote.request_id);

        // Create the Purchase Order
        const { data: po, error: poErr } = await adminClient
            .from('inv_purchase_orders')
            .insert({
                request_id: quote.request_id,
                quote_id: quoteId,
                dealer_tenant_id: quote.dealer_tenant_id,
                total_po_value: totalPoValue,
                payment_status: 'UNPAID',
                po_status: 'DRAFT',
                created_by: user.id,
            })
            .select('id, display_id')
            .single();

        if (poErr || !po) {
            return { success: false, message: poErr?.message || 'Failed to create PO' };
        }

        revalidatePath('/dashboard/inventory');
        return { success: true, data: po, message: `PO ${po.display_id} created` };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 4. CREATE PO FROM QUOTE — Used by Orders modal / manual PO conversion
// =============================================================================

export async function createPurchaseOrderFromQuote(input: {
    quote_id: string;
    request_id?: string;
    expected_delivery_date?: string | null;
    transporter_name?: string | null;
    docket_number?: string | null;
}): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        const { data: quote, error: quoteErr } = await adminClient
            .from('inv_dealer_quotes')
            .select('id, request_id')
            .eq('id', input.quote_id)
            .single();

        if (quoteErr || !quote) return { success: false, message: 'Quote not found' };

        if (input.request_id && input.request_id !== quote.request_id) {
            return { success: false, message: 'Quote does not belong to selected requisition' };
        }

        const selectionResult = await selectQuote(input.quote_id);
        if (!selectionResult.success || !selectionResult.data) {
            return selectionResult;
        }

        const poId = (selectionResult.data as { id: string }).id;
        const updates: {
            expected_delivery_date?: string | null;
            transporter_name?: string | null;
            docket_number?: string | null;
            updated_at: string;
            updated_by: string;
        } = {
            updated_at: new Date().toISOString(),
            updated_by: user.id,
        };

        if (input.expected_delivery_date !== undefined) updates.expected_delivery_date = input.expected_delivery_date;
        if (input.transporter_name !== undefined) updates.transporter_name = input.transporter_name || null;
        if (input.docket_number !== undefined) updates.docket_number = input.docket_number || null;

        if (
            input.expected_delivery_date !== undefined ||
            input.transporter_name !== undefined ||
            input.docket_number !== undefined
        ) {
            const { error: updateErr } = await adminClient.from('inv_purchase_orders').update(updates).eq('id', poId);
            if (updateErr) {
                return { success: false, message: updateErr.message };
            }
        }

        revalidatePath('/dashboard/inventory');
        return {
            success: true,
            data: selectionResult.data,
            message: selectionResult.message || 'Purchase order created',
        };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 5. UPDATE PO — lifecycle + logistics updates
// =============================================================================

export async function updatePurchaseOrder(input: {
    po_id: string;
    po_status?: InvPoStatus;
    transporter_name?: string | null;
    docket_number?: string | null;
    expected_delivery_date?: string | null;
}): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        const { data: currentPO, error: currentErr } = await adminClient
            .from('inv_purchase_orders')
            .select('id, po_status')
            .eq('id', input.po_id)
            .single();

        if (currentErr || !currentPO) {
            return { success: false, message: 'PO not found' };
        }

        const updates: {
            updated_at: string;
            updated_by: string;
            po_status?: InvPoStatus;
            transporter_name?: string | null;
            docket_number?: string | null;
            expected_delivery_date?: string | null;
        } = {
            updated_at: new Date().toISOString(),
            updated_by: user.id,
        };

        if (input.po_status && input.po_status !== currentPO.po_status) {
            const allowedNext = PO_STATUS_TRANSITIONS[currentPO.po_status as InvPoStatus] || [];
            if (!allowedNext.includes(input.po_status)) {
                return {
                    success: false,
                    message: `Invalid status transition: ${currentPO.po_status} -> ${input.po_status}`,
                };
            }
            updates.po_status = input.po_status;
        }

        if (input.transporter_name !== undefined) updates.transporter_name = input.transporter_name || null;
        if (input.docket_number !== undefined) updates.docket_number = input.docket_number || null;
        if (input.expected_delivery_date !== undefined) updates.expected_delivery_date = input.expected_delivery_date;

        const { data: updatedPO, error: updateErr } = await adminClient
            .from('inv_purchase_orders')
            .update(updates)
            .eq('id', input.po_id)
            .select(
                'id, display_id, po_status, payment_status, expected_delivery_date, transporter_name, docket_number'
            )
            .single();

        if (updateErr || !updatedPO) {
            return { success: false, message: updateErr?.message || 'Failed to update PO' };
        }

        revalidatePath('/dashboard/inventory');
        return { success: true, data: updatedPO, message: `PO updated to ${updatedPO.po_status}` };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 6. RECORD PAYMENT — Links advance/full payment to a PO
// =============================================================================

export async function recordPoPayment(poId: string, amountPaid: number, transactionId?: string): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        // Insert the payment record
        const { error: payErr } = await adminClient.from('inv_po_payments').insert({
            po_id: poId,
            amount_paid: amountPaid,
            transaction_id: transactionId || null,
            created_by: user.id,
        });

        if (payErr) {
            return { success: false, message: payErr.message };
        }

        // Calculate total paid so far
        const { data: payments, error: sumErr } = await adminClient
            .from('inv_po_payments')
            .select('amount_paid')
            .eq('po_id', poId);

        if (sumErr || !payments) {
            return { success: false, message: 'Payment recorded but status update failed' };
        }

        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount_paid), 0);

        // Get PO total to determine payment status
        const { data: po } = await adminClient
            .from('inv_purchase_orders')
            .select('total_po_value')
            .eq('id', poId)
            .single();

        if (po) {
            const newStatus = totalPaid >= Number(po.total_po_value) ? 'FULLY_PAID' : 'PARTIAL_PAID';
            await adminClient
                .from('inv_purchase_orders')
                .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', poId);
        }

        revalidatePath('/dashboard/inventory');
        return { success: true, message: `₹${amountPaid} recorded against PO` };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 7. RECEIVE STOCK — Creates physical stock unit with mandatory QC media
// =============================================================================

export async function receiveStock(input: ReceiveStockInput): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        // Create the stock unit
        const { data: stock, error: stockErr } = await adminClient
            .from('inv_stock')
            .insert({
                tenant_id: input.tenant_id,
                po_id: input.po_id,
                sku_id: input.sku_id,
                branch_id: input.branch_id,
                chassis_number: input.chassis_number,
                engine_number: input.engine_number,
                battery_make: input.battery_make || null,
                media_chassis_url: input.media_chassis_url,
                media_engine_url: input.media_engine_url,
                media_sticker_url: input.media_sticker_url || null,
                media_qc_video_url: input.media_qc_video_url,
                qc_status: 'PASSED',
                qc_notes: input.qc_notes || null,
                status: 'AVAILABLE',
                is_shared: false,
            })
            .select('id, chassis_number')
            .single();

        if (stockErr || !stock) {
            return { success: false, message: stockErr?.message || 'Failed to create stock' };
        }

        // Write ledger entry
        await adminClient.from('inv_stock_ledger').insert({
            stock_id: stock.id,
            action: 'RECEIVED',
            actor_tenant_id: input.tenant_id,
            actor_user_id: user.id,
            notes: `Received chassis ${input.chassis_number}`,
        });

        // QC passed ledger entry
        await adminClient.from('inv_stock_ledger').insert({
            stock_id: stock.id,
            action: 'QC_PASSED',
            actor_tenant_id: input.tenant_id,
            actor_user_id: user.id,
        });

        // Update PO status to RECEIVED
        await adminClient
            .from('inv_purchase_orders')
            .update({ po_status: 'RECEIVED', updated_at: new Date().toISOString() })
            .eq('id', input.po_id);

        // Update request status to RECEIVED
        const { data: po } = await adminClient
            .from('inv_purchase_orders')
            .select('request_id')
            .eq('id', input.po_id)
            .single();

        if (po) {
            await adminClient
                .from('inv_requests')
                .update({ status: 'RECEIVED', updated_at: new Date().toISOString() })
                .eq('id', po.request_id);
        }

        revalidatePath('/dashboard/inventory');
        return { success: true, data: stock, message: `Stock ${stock.chassis_number} received` };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 8. STOCK VISIBILITY — Cross-tenant stock query
// =============================================================================

export async function getAvailableStock(
    tenantId: string,
    filters?: { sku_id?: string; include_shared?: boolean; available_only?: boolean }
): Promise<ActionResult> {
    try {
        let query = adminClient.from('inv_stock').select(
            `
                id, tenant_id, po_id, sku_id, branch_id, chassis_number, engine_number, battery_make,
                media_chassis_url, media_engine_url, media_sticker_url, media_qc_video_url,
                qc_status, status, is_shared, locked_by_tenant_id, locked_at, created_at, updated_at,
                sku:cat_skus(name),
                po:inv_purchase_orders(total_po_value)
                `
        );

        if (filters?.include_shared) {
            // Cross-tenant: own stock + shared stock from other tenants
            query = query.or(`tenant_id.eq.${tenantId},is_shared.eq.true`);
        } else {
            query = query.eq('tenant_id', tenantId);
        }

        if (filters?.available_only) {
            query = query.in('status', ['AVAILABLE', 'SOFT_LOCKED']);
        }

        if (filters?.sku_id) {
            query = query.eq('sku_id', filters.sku_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) return { success: false, message: error.message };
        return { success: true, data };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 9. TOGGLE STOCK SHARING — Make stock visible to other tenants
// =============================================================================

export async function toggleStockSharing(stockId: string, isShared: boolean): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        const { error } = await adminClient
            .from('inv_stock')
            .update({ is_shared: isShared, updated_at: new Date().toISOString() })
            .eq('id', stockId);

        if (error) return { success: false, message: error.message };

        revalidatePath('/dashboard/inventory');
        return { success: true, message: isShared ? 'Stock shared across tenants' : 'Stock unshared' };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 10. SOFT LOCK — Another tenant locks a shared stock unit
// =============================================================================

export async function softLockStock(stockId: string, lockingTenantId: string): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        // Verify the stock is AVAILABLE and shared (or owned by locking tenant)
        const { data: stock, error: fetchErr } = await adminClient
            .from('inv_stock')
            .select('id, status, tenant_id, is_shared')
            .eq('id', stockId)
            .single();

        if (fetchErr || !stock) return { success: false, message: 'Stock not found' };
        if (stock.status !== 'AVAILABLE') return { success: false, message: `Cannot lock: status is ${stock.status}` };
        if (stock.tenant_id !== lockingTenantId && !stock.is_shared) {
            return { success: false, message: 'Stock is not shared — cannot lock from another tenant' };
        }

        const { error: updateErr } = await adminClient
            .from('inv_stock')
            .update({
                status: 'SOFT_LOCKED',
                locked_by_tenant_id: lockingTenantId,
                locked_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', stockId);

        if (updateErr) return { success: false, message: updateErr.message };

        // Ledger
        await adminClient.from('inv_stock_ledger').insert({
            stock_id: stockId,
            action: 'SOFT_LOCKED',
            actor_tenant_id: lockingTenantId,
            actor_user_id: user.id,
        });

        revalidatePath('/dashboard/inventory');
        return { success: true, message: 'Stock soft-locked' };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 11. UNLOCK STOCK — Release a soft/hard lock
// =============================================================================

export async function unlockStock(stockId: string): Promise<ActionResult> {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, message: 'Unauthorized' };

        const { error } = await adminClient
            .from('inv_stock')
            .update({
                status: 'AVAILABLE',
                locked_by_tenant_id: null,
                locked_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', stockId);

        if (error) return { success: false, message: error.message };

        await adminClient.from('inv_stock_ledger').insert({
            stock_id: stockId,
            action: 'UNLOCKED',
            actor_user_id: user.id,
        });

        revalidatePath('/dashboard/inventory');
        return { success: true, message: 'Stock unlocked' };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 12. DATA FETCHING — Requests Pipeline
// =============================================================================

export async function getRequests(tenantId: string): Promise<ActionResult> {
    try {
        const { data, error } = await adminClient
            .from('inv_requests')
            .select('*, inv_request_items(*), inv_dealer_quotes(*)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) return { success: false, message: error.message };
        return { success: true, data };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 13. DATA FETCHING — Request Detail
// =============================================================================

export async function getRequestById(requestId: string): Promise<ActionResult> {
    try {
        const { data, error } = await adminClient
            .from('inv_requests')
            .select(
                `
                *,
                inv_request_items(*),
                inv_dealer_quotes(*, id_tenants:dealer_tenant_id(name, slug)),
                inv_purchase_orders(*, inv_po_payments(*))
            `
            )
            .eq('id', requestId)
            .single();

        if (error) return { success: false, message: error.message };
        return { success: true, data };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 14. DATA FETCHING — Stock with Ledger
// =============================================================================

export async function getStockById(stockId: string): Promise<ActionResult> {
    try {
        const { data, error } = await adminClient
            .from('inv_stock')
            .select(
                `
                *,
                sku:cat_skus(name),
                branch:id_locations(name, city),
                po:inv_purchase_orders(id, display_id, request_id, total_po_value, po_status, payment_status, created_at),
                owner:id_tenants!inv_stock_tenant_id_fkey(name, slug),
                locker:id_tenants!inv_stock_locked_by_tenant_id_fkey(name, slug),
                inv_stock_ledger(*)
                `
            )
            .eq('id', stockId)
            .single();

        if (error) return { success: false, message: error.message };
        return { success: true, data };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 15. DATA FETCHING — Supplier Tenants
// =============================================================================

export async function getSupplierTenants(): Promise<ActionResult> {
    try {
        const { data, error } = await adminClient
            .from('id_tenants')
            .select('id, name, slug, type')
            .eq('status', 'ACTIVE')
            .order('name');

        if (error) return { success: false, message: error.message };
        return { success: true, data };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

// =============================================================================
// 16. STOCK CHECK — For booking shortage gate
// =============================================================================

export async function checkStockAvailability(
    skuId: string,
    tenantId: string,
    requiredQty: number = 1
): Promise<ActionResult<{ available: number; shortage: number; has_shortage: boolean }>> {
    try {
        const { data, error } = await adminClient
            .from('inv_stock')
            .select('id')
            .eq('sku_id', skuId)
            .eq('status', 'AVAILABLE')
            .or(`tenant_id.eq.${tenantId},and(is_shared.eq.true,locked_by_tenant_id.is.null)`);

        if (error) return { success: false, message: error.message };

        const available = data?.length || 0;
        const shortage = Math.max(0, requiredQty - available);

        return {
            success: true,
            data: { available, shortage, has_shortage: shortage > 0 },
        };
    } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}

/**
 * INV-004: Non-blocking shortage check — auto-creates request if needed.
 * This is called during booking creation.
 */
export async function bookingShortageCheck(bookingId: string) {
    try {
        // 1. Fetch booking details to get SKU and Tenant
        const { data: booking, error: fetchErr } = await adminClient
            .from('crm_bookings')
            .select('sku_id, tenant_id, delivery_branch_id')
            .eq('id', bookingId)
            .single();

        if (fetchErr || !booking || !booking.sku_id) {
            return { status: 'ERROR', message: fetchErr?.message || 'Booking or SKU not found' };
        }

        // 2. Check availability
        const { data: stockAvail } = await checkStockAvailability(booking.sku_id, booking.tenant_id as string, 1);

        if (stockAvail && !stockAvail.has_shortage) {
            return { status: 'OK', available: stockAvail.available };
        }

        // 3. Create Procurement Request if shortage exists
        const requestInput: CreateRequestInput = {
            tenant_id: booking.tenant_id as string,
            sku_id: booking.sku_id as string,
            booking_id: bookingId,
            source_type: 'BOOKING',
            delivery_branch_id: booking.delivery_branch_id || undefined,
            items: [], // Will be filled by createRequest logic from catalog baseline if implemented there, or empty for now
        };

        const result = await createRequest(requestInput);
        if (result.success && result.data) {
            return {
                status: 'SHORTAGE_CREATED',
                request_id: (result.data as any).id,
                display_id: (result.data as any).display_id,
            };
        }

        return { status: 'ERROR', message: result.message };
    } catch (err: unknown) {
        console.error('[bookingShortageCheck] Exception:', err);
        return { status: 'ERROR', message: err instanceof Error ? getErrorMessage(err) : 'Unknown error' };
    }
}
