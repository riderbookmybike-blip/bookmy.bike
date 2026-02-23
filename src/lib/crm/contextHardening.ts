import { SupabaseClient } from '@supabase/supabase-js';

export interface HardeningSettings {
    unified_context_strict_mode: boolean;
}

/**
 * Validates that a quote creation attempt matches the dealer context of the associated lead.
 * @returns { success: boolean; message?: string }
 */
export async function validateQuoteDealerContext(
    supabase: SupabaseClient,
    leadId: string,
    requestedDealerId: string,
    settings: HardeningSettings
): Promise<{ success: boolean; message?: string }> {
    const { data: lead } = await supabase
        .from('crm_leads')
        .select('selected_dealer_tenant_id')
        .eq('is_deleted', false)
        .eq('id', leadId)
        .maybeSingle();

    if (!lead) return { success: true }; // Lead not found, or not a lead-linked quote (might be direct)

    const lockedDealerId = lead.selected_dealer_tenant_id;
    if (lockedDealerId && requestedDealerId && lockedDealerId !== requestedDealerId) {
        if (settings.unified_context_strict_mode !== false) {
            return {
                success: false,
                message: `Dealer context mismatch: Lead is locked to ${lockedDealerId}, but quote attempted for ${requestedDealerId}.`,
            };
        } else {
            console.warn(
                `[LOG_ONLY] Dealer context mismatch: Lead ${leadId} is locked to ${lockedDealerId}, but quote attempted for ${requestedDealerId}.`
            );
        }
    }

    return { success: true };
}

/**
 * Validates that a lead creation attempt for finance simulation has a dealer selected.
 */
export function validateFinanceLeadDealer(
    source: string | undefined,
    selectedDealerId: string | undefined,
    settings: HardeningSettings
): { success: boolean; message?: string } {
    if (source === 'PDP_FINANCE_SIMULATOR' && !selectedDealerId) {
        if (settings.unified_context_strict_mode !== false) {
            return {
                success: false,
                message: 'Dealer selection required for finance simulation.',
            };
        } else {
            console.warn('[LOG_ONLY] Dealer selection missing for finance simulation (Strict Mode OFF).');
        }
    }
    return { success: true };
}

/**
 * Validates that an authenticated user is authorized for a specific dealer (tenant).
 */
export async function validateDealerAuthorization(
    supabase: SupabaseClient,
    userId: string,
    requestedTenantId: string,
    settings: HardeningSettings
): Promise<{ success: boolean; message?: string }> {
    // Check if user has an active membership for this tenant
    const { data: membership } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('tenant_id', requestedTenantId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

    if (!membership) {
        if (settings.unified_context_strict_mode !== false) {
            return {
                success: false,
                message: `Authorization failure: User not authorized for dealer ${requestedTenantId}.`,
            };
        } else {
            console.warn(
                `[LOG_ONLY] Authorization failure: User ${userId} attempted action for dealer ${requestedTenantId} without active membership.`
            );
        }
    }

    return { success: true };
}

/**
 * Validates that a booking creation attempt matches the dealer context of the source quote.
 */
export async function validateBookingDealerContext(
    supabase: SupabaseClient,
    quoteId: string,
    authorizedTenantIds: string[], // Tenants the current user can manage
    settings: HardeningSettings
): Promise<{ success: boolean; message?: string }> {
    const { data: quote } = await supabase.from('crm_quotes').select('tenant_id').eq('id', quoteId).single();

    if (!quote) {
        return { success: false, message: 'Source quote not found.' };
    }

    if (!authorizedTenantIds.includes(quote.tenant_id)) {
        if (settings.unified_context_strict_mode !== false) {
            return {
                success: false,
                message: `Dealer context mismatch: Quote belongs to ${quote.tenant_id}, which is outside your authorized scope.`,
            };
        } else {
            console.warn(
                `[LOG_ONLY] Dealer context mismatch for booking: Quote ${quoteId} belongs to ${quote.tenant_id}.`
            );
        }
    }

    return { success: true };
}
