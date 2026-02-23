'use server';

import { adminClient } from '@/lib/supabase/admin';
import { getErrorMessage } from '@/lib/utils/errorMessage';

export async function getOClubWallet(memberId: string) {
    const { data, error } = await adminClient
        .from('oclub_wallets')
        .select(
            'available_system, available_referral, available_sponsored, locked_referral, pending_sponsored, lifetime_earned, lifetime_redeemed, updated_at'
        )
        .eq('member_id', memberId)
        .maybeSingle();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, wallet: data || null };
}

export async function getOClubLedger(memberId: string, limit = 50) {
    const { data, error } = await adminClient
        .from('oclub_coin_ledger')
        .select('id, coin_type, delta, status, source_type, source_id, sponsor_id, metadata, created_at')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, ledger: data || [] };
}

export async function getSponsorByTenant(tenantId: string) {
    const { data, error } = await adminClient
        .from('oclub_sponsors')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, sponsor: data || null };
}

export async function getSponsorDashboard(sponsorId: string) {
    const { data: allocations } = await adminClient
        .from('oclub_sponsor_allocations')
        .select('coins')
        .eq('sponsor_id', sponsorId);

    const totalAssigned = (allocations || []).reduce((sum: number, r: any) => sum + (r.coins || 0), 0);

    const { data: redemptions } = await adminClient
        .from('oclub_redemption_requests')
        .select('coin_amount, status, agent_id')
        .eq('sponsor_id', sponsorId);

    const totalRedeemed = (redemptions || [])
        .filter((r: any) => r.status === 'PAID')
        .reduce((sum: number, r: any) => sum + (r.coin_amount || 0), 0);

    const pendingRequests = (redemptions || []).filter((r: any) => r.status === 'PENDING_APPROVAL').length;

    const agentPerformanceMap = new Map<string, number>();
    (redemptions || [])
        .filter((r: any) => r.status === 'PAID')
        .forEach((r: any) => {
            agentPerformanceMap.set(r.agent_id, (agentPerformanceMap.get(r.agent_id) || 0) + (r.coin_amount || 0));
        });

    const agentPerformance = Array.from(agentPerformanceMap.entries())
        .map(([agent_id, coins]) => ({ agent_id, coins }))
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 20);

    return {
        success: true,
        summary: {
            totalAssigned,
            totalRedeemed,
            pendingRequests,
        },
        agentPerformance,
    };
}

export async function listSponsorRedemptions(sponsorId: string, status?: string) {
    let query = adminClient
        .from('oclub_redemption_requests')
        .select('id, booking_id, agent_id, coin_amount, status, requested_at, approved_at, payment_ref')
        .eq('sponsor_id', sponsorId)
        .order('requested_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) return { success: false, error: error.message };

    return { success: true, requests: data || [] };
}

export async function createSponsorAllocation(input: {
    sponsorId: string;
    agentId: string;
    coins: number;
    expiresAt?: string | null;
    notes?: string | null;
}) {
    const { data: allocation, error } = await adminClient
        .from('oclub_sponsor_allocations')
        .insert({
            sponsor_id: input.sponsorId,
            agent_id: input.agentId,
            coins: input.coins,
            expires_at: input.expiresAt || null,
            notes: input.notes || null,
        })
        .select('id')
        .single();

    if (error) return { success: false, error: error.message };

    const allocationId = (allocation as any)?.id || null;

    try {
        await adminClient.rpc(
            'oclub_add_ledger' as any,
            {
                p_member_id: input.agentId,
                p_coin_type: 'SPONSORED',
                p_delta: input.coins,
                p_status: 'PENDING_BACKED',
                p_source_type: 'SPONSOR_ALLOC',
                p_source_id: allocationId,
                p_sponsor_id: input.sponsorId,
                p_metadata: { notes: input.notes || null },
            } as any
        );
    } catch (err: unknown) {
        return { success: false, error: getErrorMessage(err) || 'Ledger update failed' };
    }

    return { success: true, allocationId };
}

export async function applyOClubCoinsToBooking(input: {
    bookingId: string;
    memberId: string;
    systemCoins?: number;
    referralCoins?: number;
    sponsoredCoins?: number;
}) {
    const { data, error } = await adminClient.rpc(
        'oclub_apply_booking_coins' as any,
        {
            p_booking_id: input.bookingId,
            p_member_id: input.memberId,
            p_system_coins: input.systemCoins || 0,
            p_referral_coins: input.referralCoins || 0,
            p_sponsored_coins: input.sponsoredCoins || 0,
        } as any
    );

    if (error) return { success: false, error: error.message };

    return { success: true, redemptionRequestId: data || null };
}

export async function approveRedemptionRequest(requestId: string, approverId?: string | null) {
    const { error } = await adminClient.rpc(
        'oclub_approve_redemption' as any,
        {
            p_request_id: requestId,
            p_approved_by: approverId || null,
        } as any
    );

    if (error) return { success: false, error: error.message };

    return { success: true };
}

export async function rejectRedemptionRequest(requestId: string, approverId?: string | null) {
    const { error } = await adminClient.rpc(
        'oclub_reject_redemption' as any,
        {
            p_request_id: requestId,
            p_rejected_by: approverId || null,
        } as any
    );

    if (error) return { success: false, error: error.message };

    return { success: true };
}

export async function confirmRedemptionPayment(requestId: string, paymentRef?: string | null) {
    const { error } = await adminClient.rpc(
        'oclub_confirm_redemption_paid' as any,
        {
            p_request_id: requestId,
            p_payment_ref: paymentRef || null,
        } as any
    );

    if (error) return { success: false, error: error.message };

    return { success: true };
}
