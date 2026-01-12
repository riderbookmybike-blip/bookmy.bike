import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { phone, tenantId } = await request.json();

        if (!phone) {
            return NextResponse.json({ success: false, message: 'Phone is required' }, { status: 400 });
        }

        const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 1. Find User
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.find(u =>
            u.phone === formattedPhone ||
            u.phone === `+${formattedPhone}` ||
            u.user_metadata?.phone === formattedPhone
        );

        // If user doesn't exist, they can only proceed on the Marketplace (no tenantId)
        if (!user) {
            if (tenantId) {
                return NextResponse.json({
                    success: false,
                    isMember: false,
                    message: `Mobile number not linked to this dealership.`
                });
            }
            return NextResponse.json({ success: true, isMember: true, isNew: true });
        }

        // 2. If on a subdomain, check membership
        if (tenantId) {
            const { data: membership, error: memError } = await supabaseAdmin
                .from('memberships')
                .select('status')
                .eq('user_id', user.id)
                .eq('tenant_id', tenantId)
                .eq('status', 'ACTIVE')
                .maybeSingle();

            if (memError) throw memError;

            if (!membership) {
                // Check if user is an ADMIN (Core), they can access everything
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'OWNER') {
                    return NextResponse.json({ success: true, isMember: true });
                }

                return NextResponse.json({
                    success: false,
                    isMember: false,
                    message: `Mobile number not linked to this dealership.`
                });
            }
        }

        return NextResponse.json({ success: true, isMember: true });
    } catch (error: any) {
        console.error('[CheckMembership] Error:', error);
        return NextResponse.json({ success: false, message: 'Authorization check failed.' }, { status: 500 });
    }
}
