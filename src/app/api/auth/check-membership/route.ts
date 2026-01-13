import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { phone, email, tenantId: providedTenantId } = await request.json();

        if (!phone && !email) {
            return NextResponse.json({ success: false, message: 'Phone or Email is required' }, { status: 400 });
        }

        let formattedPhone = '';
        if (phone) {
            // STRICT NORMALIZATION
            const cleaned = phone.replace(/\D/g, '');
            if (cleaned.length === 10) {
                formattedPhone = `91${cleaned}`;
            } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
                formattedPhone = cleaned;
            } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
                formattedPhone = `91${cleaned.substring(1)}`;
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid Phone Number. Please enter a valid 10-digit Indian number.',
                    },
                    { status: 400 }
                );
            }
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Subdomain Detection
        let tenantId: string | undefined = providedTenantId;
        if (!tenantId) {
            const host = request.headers.get('host') || '';
            const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';

            let subdomain = '';
            if (host.endsWith(`.${ROOT_DOMAIN}`)) {
                subdomain = host.replace(`.${ROOT_DOMAIN}`, '').split(':')[0];
            } else if (host.includes('localhost')) {
                const parts = host.split('.');
                if (parts.length > 1 && parts[0] !== 'www') subdomain = parts[0];
            }

            if (subdomain && !['we', 'www', 'aums'].includes(subdomain)) {
                const { data: tenant } = await supabaseAdmin
                    .from('tenants')
                    .select('id')
                    .eq('subdomain', subdomain)
                    .maybeSingle();
                if (tenant) tenantId = tenant.id;
            }
        }

        // 1. Find User by Phone or Email
        const {
            data: { users },
            error: listError,
        } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listError) throw listError;

        const user = users.find(u => {
            const hasEmail = email && u.email?.toLowerCase() === email.toLowerCase();
            const hasPhone =
                phone &&
                (u.phone === formattedPhone ||
                    u.phone === `+${formattedPhone}` ||
                    u.user_metadata?.phone === formattedPhone ||
                    u.user_metadata?.phone === phone);
            return hasEmail || hasPhone;
        });

        if (!user) {
            return NextResponse.json({
                success: true,
                isMember: false,
                isNew: true,
                message: tenantId ? 'Account not pre-registered for this portal.' : 'Account not found.',
            });
        }

        // 2. Check Membership
        let userRole = 'BMB_USER';
        let isMember = false;

        if (tenantId) {
            const { data: membership } = await supabaseAdmin
                .from('memberships')
                .select('role, status')
                .eq('user_id', user.id)
                .eq('tenant_id', tenantId)
                .eq('status', 'ACTIVE')
                .maybeSingle();

            if (membership) {
                isMember = true;
                userRole = membership.role;
            }
        } else {
            // Root domain
            isMember = true;
        }

        return NextResponse.json({
            success: true,
            isMember,
            isNew: false,
            role: userRole,
            userId: user.id,
        });
    } catch (err: unknown) {
        console.error('[CheckMembership] Error:', err);
        return NextResponse.json({ success: false, message: 'Check failed.' }, { status: 500 });
    }
}
