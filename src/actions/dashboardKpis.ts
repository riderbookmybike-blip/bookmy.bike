'use server';

import { adminClient } from '@/lib/supabase/admin';

export interface DashboardKpis {
    leads: { total: number; newToday: number };
    quotes: { total: number; pending: number };
    bookings: { total: number; value: number };
    deliveries: { total: number; pdiReady: number };
    receipts: { total: number; todayValue: number };
    insurance: { total: number; pending: number };
}

export interface PlatformKpis extends DashboardKpis {
    activeDealers: number;
    activeFinanciers: number;
    totalMembers: number;
}

/**
 * Fetch live KPI counts for a DEALER dashboard.
 * Uses lightweight count queries with head:true for performance.
 */
export async function getDealerDashboardKpis(tenantId: string): Promise<DashboardKpis> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [
        leadsTotal,
        leadsToday,
        quotesTotal,
        quotesPending,
        bookingsTotal,
        bookingsValue,
        deliveriesTotal,
        pdiReady,
        receiptsTotal,
        receiptsToday,
        insuranceTotal,
        insurancePending,
    ] = await Promise.all([
        // Leads
        adminClient.from('crm_leads').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        adminClient
            .from('crm_leads')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', today),
        // Quotes
        adminClient.from('crm_quotes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        adminClient
            .from('crm_quotes')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .in('status', ['DRAFT', 'IN_REVIEW', 'SENT']),
        // Bookings (sales orders with stage BOOKING or later)
        adminClient.from('crm_bookings').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        adminClient.from('crm_bookings').select('grand_total').eq('tenant_id', tenantId),
        // Deliveries
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('operational_stage', 'DELIVERED'),
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('operational_stage', 'PDI'),
        // Receipts
        adminClient.from('crm_receipts').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        adminClient
            .from('crm_receipts')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('created_at', today),
        // Insurance (Using COMPLIANCE as the operational stage for insurance tracking)
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('operational_stage', 'COMPLIANCE'),
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('operational_stage', 'COMPLIANCE')
            .neq('status', 'COMPLETED'),
    ]);

    // Calculate booking value from grand_total
    const totalBookingValue = (bookingsValue.data || []).reduce(
        (sum: number, row: any) => sum + (row.grand_total || 0),
        0
    );

    return {
        leads: { total: leadsTotal.count || 0, newToday: leadsToday.count || 0 },
        quotes: { total: quotesTotal.count || 0, pending: quotesPending.count || 0 },
        bookings: { total: bookingsTotal.count || 0, value: totalBookingValue },
        deliveries: { total: deliveriesTotal.count || 0, pdiReady: pdiReady.count || 0 },
        receipts: { total: receiptsTotal.count || 0, todayValue: receiptsToday.count || 0 },
        insurance: { total: insuranceTotal.count || 0, pending: insurancePending.count || 0 },
    };
}

/**
 * Fetch live KPI counts for the AUMS (platform admin) dashboard.
 */
export async function getPlatformDashboardKpis(): Promise<PlatformKpis> {
    const today = new Date().toISOString().slice(0, 10);

    const [
        leadsTotal,
        leadsToday,
        quotesTotal,
        quotesPending,
        bookingsTotal,
        bookingsValue,
        deliveriesTotal,
        pdiReady,
        receiptsTotal,
        receiptsToday,
        insuranceTotal,
        insurancePending,
        activeDealers,
        activeFinanciers,
        totalMembers,
    ] = await Promise.all([
        adminClient.from('crm_leads').select('*', { count: 'exact', head: true }),
        adminClient.from('crm_leads').select('*', { count: 'exact', head: true }).gte('created_at', today),
        adminClient.from('crm_quotes').select('*', { count: 'exact', head: true }),
        adminClient
            .from('crm_quotes')
            .select('*', { count: 'exact', head: true })
            .in('status', ['DRAFT', 'IN_REVIEW', 'SENT']),
        adminClient.from('crm_bookings').select('*', { count: 'exact', head: true }),
        adminClient.from('crm_bookings').select('grand_total'),
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('operational_stage', 'DELIVERED'),
        adminClient.from('crm_bookings').select('*', { count: 'exact', head: true }).eq('operational_stage', 'PDI'),
        adminClient.from('crm_receipts').select('*', { count: 'exact', head: true }),
        adminClient.from('crm_receipts').select('*', { count: 'exact', head: true }).gte('created_at', today),
        // Insurance (Using COMPLIANCE as the operational stage for insurance tracking)
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('operational_stage', 'COMPLIANCE'),
        adminClient
            .from('crm_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('operational_stage', 'COMPLIANCE')
            .neq('status', 'COMPLETED'),
        adminClient
            .from('id_tenants')
            .select('*', { count: 'exact', head: true })
            .eq('type', 'DEALER')
            .eq('status', 'ACTIVE'),
        adminClient
            .from('id_tenants')
            .select('*', { count: 'exact', head: true })
            .eq('type', 'BANK')
            .eq('status', 'ACTIVE'),
        adminClient.from('id_members').select('*', { count: 'exact', head: true }),
    ]);

    const totalBookingValue = (bookingsValue.data || []).reduce(
        (sum: number, row: any) => sum + (row.grand_total || 0),
        0
    );

    return {
        leads: { total: leadsTotal.count || 0, newToday: leadsToday.count || 0 },
        quotes: { total: quotesTotal.count || 0, pending: quotesPending.count || 0 },
        bookings: { total: bookingsTotal.count || 0, value: totalBookingValue },
        deliveries: { total: deliveriesTotal.count || 0, pdiReady: pdiReady.count || 0 },
        receipts: { total: receiptsTotal.count || 0, todayValue: receiptsToday.count || 0 },
        insurance: { total: insuranceTotal.count || 0, pending: insurancePending.count || 0 },
        activeDealers: activeDealers.count || 0,
        activeFinanciers: activeFinanciers.count || 0,
        totalMembers: totalMembers.count || 0,
    };
}
