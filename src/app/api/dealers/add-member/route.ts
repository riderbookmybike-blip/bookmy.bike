import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client for bypassing RLS
const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { tenantId, memberId, role } = await req.json();

        if (!tenantId || !memberId || !role) {
            return NextResponse.json({ error: 'Missing required fields: tenantId, memberId, role' }, { status: 400 });
        }

        // Validate role
        const validRoles = ['OWNER', 'MANAGER', 'SALES', 'FINANCE', 'VIEWER'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
                { status: 400 }
            );
        }

        // Check if member already exists in this team
        const { data: existingMember } = await adminClient
            .from('id_team')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('user_id', memberId)
            .maybeSingle();

        if (existingMember) {
            return NextResponse.json({ error: 'This member is already part of the team' }, { status: 409 });
        }

        // Add member to team
        const { data: teamMember, error: insertError } = await adminClient
            .from('id_team')
            .insert({
                tenant_id: tenantId,
                user_id: memberId,
                role: role,
                status: 'ACTIVE',
            })
            .select()
            .single();

        if (insertError) {
            console.error('[AddMember] Insert Error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // console.log('[AddMember] Successfully added member:', { teamMemberId: teamMember.id, tenantId, memberId, role });

        return NextResponse.json({
            success: true,
            teamMember,
        });
    } catch (error: unknown) {
        console.error('[AddMember] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
