import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { phone, tenantId: providedTenantId } = await request.json();

        if (!phone) {
            return NextResponse.json({ success: false, message: 'Phone is required' }, { status: 400 });
        }

        const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // === CRITICAL: Subdomain Detection from Headers ===
        let tenantId = providedTenantId;
        if (!tenantId) {
            const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || '';
            const origin = request.headers.get('origin') || '';
            const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';

            let subdomain = '';
            // Check host header
            if (host.endsWith(`.${ROOT_DOMAIN}`)) {
                subdomain = host.replace(`.${ROOT_DOMAIN}`, '').split(':')[0];
            } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
                const parts = host.split('.')[0];
                if (parts && parts !== 'localhost' && parts !== 'www') subdomain = parts;
            }
            // Fallback to origin
            if (!subdomain && origin) {
                try {
                    const originUrl = new URL(origin);
                    if (originUrl.hostname.endsWith(`.${ROOT_DOMAIN}`)) {
                        subdomain = originUrl.hostname.replace(`.${ROOT_DOMAIN}`, '');
                    } else if (originUrl.hostname.includes('localhost')) {
                        const parts = originUrl.hostname.split('.');
                        if (parts.length > 1 && parts[0] !== 'www') subdomain = parts[0];
                    }
                } catch { }
            }

            console.log(`[CheckMembership] Host: ${host} | Origin: ${origin} | Subdomain: ${subdomain || 'NONE'}`);

            // Lookup tenantId from subdomain
            if (subdomain && subdomain !== 'we' && subdomain !== 'www') {
                const { data: tenant } = await supabaseAdmin
                    .from('tenants')
                    .select('id')
                    .eq('subdomain', subdomain)
                    .maybeSingle();
                if (tenant) tenantId = tenant.id;
            }
        }

        // 1. Find User
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.find(u =>
            u.phone === formattedPhone ||
            u.phone === `+${formattedPhone}` ||
            u.user_metadata?.phone === formattedPhone ||
            u.user_metadata?.phone === phone
        );

        // If user doesn't exist
        if (!user) {
            if (tenantId) {
                // Subdomain: TEMPORARILY ALLOW SIGNUP (User Request)
                // Was: Block - only existing authorized members can login
                return NextResponse.json({ success: true, isMember: false, isNew: true });
            }
            // Main domain (Marketplace): Allow signup flow
            return NextResponse.json({ success: true, isMember: false, isNew: true });
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
                // Check if user is an OWNER (Core), they can access everything
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
