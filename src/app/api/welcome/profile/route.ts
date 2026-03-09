import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { toAppStorageFormat } from '@/lib/utils/phoneUtils';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as { phone?: string };
        const phone = toAppStorageFormat(body?.phone || '');
        if (!phone || phone.length !== 10) {
            return NextResponse.json(
                { success: false, message: 'Valid 10-digit mobile number required.' },
                { status: 400 }
            );
        }

        const { data: member, error: memberError } = await adminClient
            .from('id_members')
            .select('id, full_name, phone, primary_phone, primary_email, email, pincode')
            .or(`phone.eq.${phone},primary_phone.eq.${phone}`)
            .maybeSingle();
        if (memberError) {
            return NextResponse.json({ success: false, message: memberError.message }, { status: 500 });
        }

        if (!member?.id) {
            return NextResponse.json({
                success: true,
                exists: false,
                profile: {
                    fullName: '',
                    phone,
                    email: '',
                    pincode: '',
                },
                linked: {
                    financeTenantIds: [],
                    dealershipTenantIds: [],
                },
            });
        }

        const { data: teamMemberships, error: teamError } = await adminClient
            .from('id_team')
            .select('tenant_id, role, status, id_tenants!inner(id, type)')
            .eq('user_id', member.id)
            .eq('status', 'ACTIVE');
        if (teamError) {
            return NextResponse.json({ success: false, message: teamError.message }, { status: 500 });
        }

        const financeTenantIds = Array.from(
            new Set(
                (teamMemberships || [])
                    .filter((m: any) => String(m?.id_tenants?.type || '').toUpperCase() === 'BANK')
                    .map((m: any) => String(m?.tenant_id || ''))
                    .filter(Boolean)
            )
        );
        const dealershipFromTeam = (teamMemberships || [])
            .filter((m: any) => {
                const type = String(m?.id_tenants?.type || '').toUpperCase();
                return type === 'DEALER' || type === 'DEALERSHIP';
            })
            .map((m: any) => String(m?.tenant_id || ''))
            .filter(Boolean);

        const { data: accessRows, error: accessError } = await adminClient
            .from('dealer_finance_user_access')
            .select('dealer_tenant_id')
            .eq('user_id', member.id)
            .eq('crm_access', true);
        if (accessError) {
            return NextResponse.json({ success: false, message: accessError.message }, { status: 500 });
        }

        const dealershipTenantIds = Array.from(
            new Set([
                ...dealershipFromTeam,
                ...(accessRows || []).map((r: any) => String(r?.dealer_tenant_id || '')).filter(Boolean),
            ])
        );

        return NextResponse.json({
            success: true,
            exists: true,
            userId: member.id,
            profile: {
                fullName: member.full_name || '',
                phone: member.primary_phone || member.phone || phone,
                email: member.primary_email || member.email || '',
                pincode: member.pincode || '',
            },
            linked: {
                financeTenantIds,
                dealershipTenantIds,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
