import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { getPhoneLookupVariants } from '@/lib/utils/phoneUtils';

const normalizePhone = (value: string) => {
    const digits = (value || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.length > 10 ? digits.slice(-10) : digits;
};

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phone } = await req.json();
        const clean = normalizePhone(phone || '');

        const { data: superAdminMembership } = await supabase
            .from('id_team')
            .select('id, id_tenants!inner(slug)')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .in('role', ['SUPER_ADMIN', 'SUPERADMIN'])
            .eq('id_tenants.slug', 'aums')
            .limit(1)
            .maybeSingle();

        if (!superAdminMembership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!clean || clean.length < 10) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }

        const candidates = getPhoneLookupVariants(clean);
        if (!candidates.length) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }

        const memberPhoneFilter = candidates.flatMap(p => [`primary_phone.eq.${p}`, `phone.eq.${p}`]).join(',');

        const { data: member } = await adminClient
            .from('id_members')
            .select('id, display_id, full_name, primary_phone, phone')
            .or(memberPhoneFilter)
            .order('created_at', { ascending: true })
            .maybeSingle();

        if (member) {
            return NextResponse.json({
                member: {
                    id: member.id,
                    display_id: member.display_id,
                    full_name: member.full_name,
                    primary_phone: member.primary_phone || clean,
                    phone: member.phone || '',
                },
            });
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

        return NextResponse.json({
            member: {
                id: contactMember.id,
                display_id: contactMember.display_id,
                full_name: contactMember.full_name,
                primary_phone: contactMember.primary_phone || clean,
                phone: contactMember.phone || '',
            },
        });
    } catch (error: unknown) {
        console.error('[FinancePartnerLookup] Error:', error);
        return NextResponse.json({ error: getErrorMessage(error) || 'Internal server error' }, { status: 500 });
    }
}
