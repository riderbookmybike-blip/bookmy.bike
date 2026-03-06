import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { getErrorMessage } from '@/lib/utils/errorMessage';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tenantId, memberId, role, designation, status, serviceability } = await req.json();

        if (!tenantId || !memberId) {
            return NextResponse.json({ error: 'Missing required fields: tenantId, memberId' }, { status: 400 });
        }

        const { data: tenant } = await adminClient
            .from('id_tenants')
            .select('id, type, config')
            .eq('id', tenantId)
            .maybeSingle();
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }
        if (tenant.type !== 'BANK') {
            return NextResponse.json({ error: 'Invalid tenant type for finance member onboarding' }, { status: 400 });
        }

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

        const { data: existing } = await adminClient
            .from('id_team')
            .select('id, role, status')
            .eq('tenant_id', tenantId)
            .eq('user_id', memberId)
            .maybeSingle();

        if (!existing) {
            const { error: insertError } = await adminClient.from('id_team').insert({
                tenant_id: tenantId,
                user_id: memberId,
                role: role || 'FINANCER_EXEC',
                status: 'ACTIVE',
            });

            if (insertError) {
                console.error('[FinancePartnerAddMember] Insert Error:', insertError);
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }
        }

        const { data: member, error: memberError } = await adminClient
            .from('id_members')
            .select('id, display_id, full_name, primary_email, primary_phone, date_of_birth, email, phone, whatsapp')
            .eq('id', memberId)
            .maybeSingle();

        if (memberError || !member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        const existingTeam = Array.isArray(tenant?.config?.team) ? tenant?.config?.team : [];
        const updatedTeam = existingTeam.filter((m: any) => m?.id !== member.id);
        updatedTeam.push({
            id: member.id,
            name: member.full_name || 'Unnamed Member',
            designation: designation || 'EXECUTIVE',
            email: member.primary_email || '',
            phone: member.primary_phone || '',
            status: status || 'ACTIVE',
            serviceability: serviceability || { states: [], areas: [], dealerIds: [] },
        });

        await adminClient
            .from('id_tenants')
            .update({
                config: {
                    ...(tenant?.config || {}),
                    team: updatedTeam,
                },
            })
            .eq('id', tenantId);

        return NextResponse.json({
            success: true,
            member: {
                id: member.id,
                display_id: member.display_id,
                name: member.full_name || 'Unnamed Member',
                email: member.primary_email || '',
                phone: member.primary_phone || '',
                date_of_birth: member.date_of_birth || null,
            },
            alreadyMember: !!existing,
        });
    } catch (error: unknown) {
        console.error('[FinancePartnerAddMember] Error:', error);
        return NextResponse.json({ error: getErrorMessage(error) || 'Internal server error' }, { status: 500 });
    }
}
