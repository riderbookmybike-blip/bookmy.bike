import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

const ELEVATED_ROLES = ['SUPER_ADMIN', 'MARKETPLACE_ADMIN'];
const TENANT_ROLES = ['OWNER', 'DEALERSHIP_ADMIN', 'ADMIN'];

const normalizePhoneVariants = (input: string) => {
    const digits = input.replace(/\D/g, '');
    if (!digits) return [];
    const variants = new Set<string>();
    variants.add(digits);
    variants.add(`91${digits}`);
    variants.add(`+91${digits}`);
    return Array.from(variants);
};

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: { phone?: string; tenantId?: string; expiresAt?: string | null; reason?: string } | null = null;
    try {
        payload = await request.json();
    } catch {
        payload = null;
    }

    if (!payload?.phone || !payload?.tenantId) {
        return NextResponse.json({ error: 'Phone and tenantId are required' }, { status: 400 });
    }

    const { phone, tenantId, expiresAt, reason } = payload;

    const { data: elevated } = await supabase
        .from('id_team')
        .select('id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .in('role', ELEVATED_ROLES)
        .limit(1)
        .maybeSingle();

    if (!elevated) {
        const { data: membership } = await supabase
            .from('id_team')
            .select('id, role, status')
            .eq('user_id', user.id)
            .eq('tenant_id', tenantId)
            .eq('status', 'ACTIVE')
            .in('role', TENANT_ROLES)
            .limit(1)
            .maybeSingle();

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    const variants = normalizePhoneVariants(phone);
    if (!variants.length) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const orFilter = variants.map(value => `primary_phone.eq.${value}`).join(',');

    const { data: member } = await adminClient
        .from('id_members')
        .select('id')
        .or(orFilter)
        .maybeSingle();

    let memberId = member?.id ?? null;

    if (!memberId) {
        const { data: contact } = await adminClient
            .from('id_member_contacts')
            .select('member_id')
            .in('value', variants)
            .limit(1)
            .maybeSingle();
        if (contact?.member_id) memberId = contact.member_id;
    }

    if (!memberId) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const { data: existing } = await adminClient
        .from('id_member_spins')
        .select('id, status')
        .eq('member_id', memberId)
        .eq('status', 'ELIGIBLE')
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ error: 'Member already has an eligible spin', spinId: existing.id }, { status: 409 });
    }

    const { data: inserted, error } = await adminClient
        .from('id_member_spins')
        .insert({
            member_id: memberId,
            tenant_id: tenantId,
            status: 'ELIGIBLE',
            eligible_reason: reason || 'MANUAL_GRANT',
            eligible_at: new Date().toISOString(),
            expires_at: expiresAt || null
        })
        .select('id, status, eligible_at, expires_at')
        .single();

    if (error) {
        return NextResponse.json({ error: 'Failed to grant spin' }, { status: 500 });
    }

    return NextResponse.json({ success: true, spin: inserted });
}
