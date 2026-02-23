import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from '@/lib/utils/errorMessage';

const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { tenantId, memberId, role, designation, status, serviceability } = await req.json();

        if (!tenantId || !memberId) {
            return NextResponse.json({ error: 'Missing required fields: tenantId, memberId' }, { status: 400 });
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
                role: role || 'FINANCE',
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

        const { data: tenant } = await adminClient.from('id_tenants').select('config').eq('id', tenantId).maybeSingle();

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
