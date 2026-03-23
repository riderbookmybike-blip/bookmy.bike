import React from 'react';
import { OCircleClient } from './OCircleClient';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/resolver';
import MemberHubClient from './MemberHubClient';
import { getOClubLedger, getOClubWallet } from '@/actions/oclub';
import { getMemberTimeline } from '@/actions/member-tracker';

export const metadata: Metadata = {
    title: "O' Circle — Zero Downpayment Membership | BookMyBike",
    description:
        "Join O' Circle for zero downpayment, zero processing fee, and zero documentation. Instant digital eKYC. Earn B-Coins rewards on every purchase.",
    openGraph: {
        title: "O' Circle — Zero Downpayment Membership | BookMyBike",
        description:
            'Own your dream ride with zero barriers. Instant digital verification, no paperwork, no hidden fees.',
        type: 'website',
    },
};

export default async function OCirclePage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
    const user = await getAuthUser();

    if (!user) return <OCircleClient />;

    const supabase = await createClient();
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    void resolvedSearchParams;

    const { data: member } = await supabase
        .from('id_members')
        .select(
            'id, display_id, full_name, primary_phone, primary_email, avatar_url, preferences, pan_number, aadhaar_number, aadhaar_front, pan_card_url, pincode, aadhaar_pincode, created_at, updated_at, date_of_birth, whatsapp, father_name, mother_name, work_company, work_designation, work_address1, work_phone, work_email, address, current_address1, current_address2, aadhaar_address1, aadhaar_address2'
        )
        .eq('id', user.id)
        .maybeSingle();

    const { data: quotes } = await supabase
        .from('crm_quotes')
        .select(
            `
            *,
            crm_leads!inner (
                customer_name,
                customer_phone,
                customer_id
            )
        `
        )
        .eq('crm_leads.customer_id', user.id)
        .order('created_at', { ascending: false });

    const quoteIds = (quotes || []).map((q: any) => q.id).filter(Boolean);

    const { data: bookingsByUser } = await supabase
        .from('crm_bookings')
        .select(
            'id, display_id, status, operational_stage, delivery_date, created_at, quote_id, grand_total, booking_amount_received, registration_number, rto_receipt_number, insurance_policy_number, vin_number'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40);

    let bookingsByQuote: any[] = [];
    if (quoteIds.length > 0) {
        const { data } = await supabase
            .from('crm_bookings')
            .select(
                'id, display_id, status, operational_stage, delivery_date, created_at, quote_id, grand_total, booking_amount_received, registration_number, rto_receipt_number, insurance_policy_number, vin_number'
            )
            .in('quote_id', quoteIds)
            .order('created_at', { ascending: false })
            .limit(40);
        bookingsByQuote = data || [];
    }

    const bookingsMap = new Map<string, any>();
    [...(bookingsByUser || []), ...(bookingsByQuote || [])].forEach((b: any) => {
        if (b?.id) bookingsMap.set(b.id, b);
    });
    const bookings = Array.from(bookingsMap.values());

    const { data: payments } = await supabase
        .from('crm_payments')
        .select('id, display_id, amount, status, method, created_at, booking_id')
        .eq('member_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

    const { data: memberDocuments } = await supabase
        .from('crm_member_documents')
        .select('id, name, label, category, file_path, file_type, file_size, created_at')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

    // Fetch alternate contacts & addresses
    const { data: memberContacts } = await supabase
        .from('id_member_contacts')
        .select('id, contact_type, label, value, is_primary, verified_at, created_at')
        .eq('member_id', user.id)
        .order('is_primary', { ascending: false });

    const { data: memberAddresses } = await supabase
        .from('id_member_addresses')
        .select('id, label, line1, line2, line3, taluka, state, country, pincode, is_current, created_at')
        .eq('member_id', user.id)
        .order('is_current', { ascending: false });

    const [walletRes, ledgerRes, activityTimeline] = await Promise.all([
        getOClubWallet(user.id),
        getOClubLedger(user.id, 40),
        getMemberTimeline(user.id, 100),
    ]);
    const wallet = walletRes.success ? walletRes.wallet : null;
    const ledger = ledgerRes.success ? ledgerRes.ledger || [] : [];

    return (
        <MemberHubClient
            user={user}
            member={member}
            quotes={quotes || []}
            bookings={bookings}
            payments={payments || []}
            memberDocuments={memberDocuments || []}
            wallet={wallet}
            ledger={ledger}
            memberContacts={memberContacts || []}
            memberAddresses={memberAddresses || []}
            activityTimeline={activityTimeline}
        />
    );
}
