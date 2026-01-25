import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { phone, email, tenantId: providedTenantId, tenantSlug } = await request.json();

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

        // Resolve tenant by slug if provided
        let tenantId: string | undefined = providedTenantId;
        if (!tenantId && tenantSlug) {
            const { data: tenant } = await supabaseAdmin
                .from('id_tenants')
                .select('id')
                .eq('slug', tenantSlug)
                .maybeSingle();
            if (tenant) tenantId = tenant.id;
        }

        // 1. Find User by Phone or Email
        let user: any = null;

        // NEW: Try to find in id_members first (more reliable for 21k migrated users)
        const { data: memberMatch } = await supabaseAdmin
            .from('id_members')
            .select('id, primary_email, primary_phone')
            .or(`primary_phone.eq.${phone},primary_phone.eq.${formattedPhone},primary_phone.eq.+${formattedPhone}${email ? `,primary_email.eq.${email}` : ''}`)
            .maybeSingle();

        if (memberMatch) {
            console.log('[CheckMembership] Member Match Found:', memberMatch.id);
            // Even if profile exists, we check if they have an Auth account
            const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(memberMatch.id);
            if (authUser) {
                user = authUser;
            } else {
                // Migrated user but no Auth yet
                return NextResponse.json({
                    success: true,
                    isMember: true, // They are technically a member if they have a profile
                    isNew: false,
                    isMigrated: true,
                    userId: memberMatch.id,
                    message: 'Pre-registered account found. Verification required.',
                });
            }
        }

        // Fallback to searching Auth directly if profile check didn't resolve it (Legacy/New users)
        if (!user) {
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            if (listError) throw listError;

            user = users.find(u => {
                const hasEmail = email && u.email?.toLowerCase() === email.toLowerCase();
                const hasPhone =
                    phone &&
                    (u.phone === formattedPhone ||
                        u.phone === `+${formattedPhone}` ||
                        u.user_metadata?.phone === formattedPhone ||
                        u.user_metadata?.phone === phone);
                return hasEmail || hasPhone;
            });
        }

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
                .from('id_member_tenants')
                .select('role, status')
                .eq('member_id', user.id)
                .eq('tenant_id', tenantId)
                .eq('status', 'ACTIVE')
                .maybeSingle();

            if (membership) {
                isMember = true;
                userRole = membership.role || 'BMB_USER';
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
