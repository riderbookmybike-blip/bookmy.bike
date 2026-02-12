import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const normalizePhone = (value: string) => {
    const digits = (value || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.length > 10 ? digits.slice(-10) : digits;
};

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();
        const clean = normalizePhone(phone || '');

        if (!clean || clean.length < 10) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }

        const candidates = [clean, `91${clean}`, `+91${clean}`];

        const { data: member } = await adminClient
            .from('id_members')
            .select('id, display_id, full_name, primary_email, primary_phone, date_of_birth, email, phone, whatsapp')
            .in('primary_phone', candidates)
            .order('created_at', { ascending: true })
            .maybeSingle();

        if (member) {
            return NextResponse.json({ member });
        }

        const { data: contact } = await adminClient
            .from('id_member_contacts')
            .select('member_id, value')
            .in('value', candidates)
            .in('contact_type', ['PHONE', 'WHATSAPP'])
            .order('created_at', { ascending: true })
            .maybeSingle();

        if (!contact?.member_id) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { data: contactMember } = await adminClient
            .from('id_members')
            .select('id, display_id, full_name, primary_email, primary_phone, date_of_birth, email, phone, whatsapp')
            .eq('id', contact.member_id)
            .maybeSingle();

        if (!contactMember) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ member: contactMember });
    } catch (error: any) {
        console.error('[FinancePartnerLookup] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
