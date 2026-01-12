import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const { phone } = await request.json();

    // 1. Initial Identity Preparation
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const password = `MSG91_${phone}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8)}`;

    const cookieStore = await cookies();

    // 2. Initialize Supabase SSR Client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        console.error(`[LoginAPI] Failed to set cookie ${name}:`, error);
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        console.error(`[LoginAPI] Failed to remove cookie ${name}:`, error);
                    }
                },
            },
        }
    );

    console.log(`[LoginAPI] Auth Attempt for Phone: ${formattedPhone}`);

    // 3. SECURE PROVISIONING FLOW (Avoids Rate Limits from failed attempts)
    let authSession: any = null;

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // A. Identity Search
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = users.find(u =>
            u.phone === formattedPhone ||
            u.phone === `+${formattedPhone}` ||
            u.user_metadata?.phone === formattedPhone
        );

        let userId = '';

        if (!existingUser) {
            console.log(`[LoginAPI] New User detected. Auto-creating account for: ${formattedPhone}`);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                phone: formattedPhone,
                password: password,
                phone_confirm: true,
                user_metadata: { phone_verified: true, role: 'DEALERSHIP_ADMIN' }
            });
            if (createError) throw createError;
            userId = newUser.user.id;
        } else {
            console.log(`[LoginAPI] Existing user found. Syncing credentials: ${existingUser.id}`);
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                password: password,
                phone_confirm: true,
                user_metadata: { ...existingUser.user_metadata, phone_verified: true }
            });
            if (updateError) throw updateError;
            userId = existingUser.id;
        }

        // B. Context Enforcement (Profile & Membership)
        if (userId) {
            const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', userId).maybeSingle();
            if (!profile) {
                console.log(`[LoginAPI] Initializing Profile/Membership for Owner: ${userId}`);
                const { data: settings } = await supabaseAdmin.from('app_settings').select('default_owner_tenant_id').maybeSingle();
                const defaultTenantId = settings?.default_owner_tenant_id || '5371fa81-a58a-4a39-aef2-2821268c96c8';

                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    phone: formattedPhone,
                    full_name: 'Partner',
                    tenant_id: defaultTenantId,
                    role: 'DEALERSHIP_ADMIN',
                });

                await supabaseAdmin.from('memberships').upsert({
                    user_id: userId,
                    tenant_id: defaultTenantId,
                    role: 'DEALERSHIP_ADMIN',
                    status: 'ACTIVE',
                    is_default: true,
                });
            }
        }

        // C. Final Identity Handshake (Client Session)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            phone: formattedPhone,
            password,
        });

        if (authError) {
            if (authError.status === 429) {
                return NextResponse.json(
                    { success: false, message: 'Too many attempts. Please wait 60 seconds.' },
                    { status: 429 }
                );
            }
            throw authError;
        }

        // Successfully negotiated session
        authSession = authData;
    } catch (err: any) {
        console.error('[LoginAPI] Fatal Auth Error:', err);
        return NextResponse.json(
            { success: false, message: err.message || 'Authentication system error.' },
            { status: 500 }
        );
    }

    if (!authSession?.user || !authSession?.session) {
        return NextResponse.json({ success: false, message: 'Session negotiation failed.' }, { status: 401 });
    }

    // 4. Fetch Final Profile & Membership Context
    const userClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${authSession.session.access_token}` } },
    });

    const [profileRes, membershipsRes] = await Promise.all([
        userClient.from('profiles').select(`*, tenants (name, type)`).eq('id', authSession.user.id).single(),
        userClient.from('memberships').select('*').eq('user_id', authSession.user.id).eq('status', 'ACTIVE')
    ]);

    if (profileRes.error || !profileRes.data) {
        console.error('[LoginAPI] Context fetch failed:', profileRes.error);
        return NextResponse.json({ success: false, message: 'Profile mismatch.' }, { status: 500 });
    }

    const profile = profileRes.data;
    const memberships = membershipsRes.data || [];

    // RESOLVE THE CORRECT ROLE (Priority: OWNER > DEALERSHIP_ADMIN > DEALERSHIP_STAFF > BMB_USER)
    const membershipRoles = memberships.map(m => m.role);
    let resolvedRole = profile.role || 'BMB_USER';

    if (profile.role === 'OWNER') resolvedRole = 'OWNER';
    else if (membershipRoles.includes('DEALERSHIP_ADMIN')) resolvedRole = 'DEALERSHIP_ADMIN';
    else if (membershipRoles.includes('DEALERSHIP_STAFF')) resolvedRole = 'DEALERSHIP_STAFF';
    else if (membershipRoles.includes('BANK_STAFF')) resolvedRole = 'BANK_STAFF';
    else if (membershipRoles.length > 0) resolvedRole = membershipRoles[0]; // Fallback to first membership role

    // 5. Response Assembly
    const response = NextResponse.json({
        success: true,
        role: resolvedRole,
        name: profile.full_name,
        tenant_id: profile.tenant_id,
        tenant_name: profile.tenants?.name,
        memberships: memberships, // Pass full list for switcher
        session: authSession.session,
    });

    // 6. Cookie Scoping
    const isProduction = process.env.NODE_ENV === 'production';
    const host = request.headers.get('host') || '';
    const cookieDomain = host.endsWith('.bookmy.bike') ? '.bookmy.bike' : undefined;

    cookieStore.getAll().forEach(cookie => {
        if (cookie.name.startsWith('sb-')) {
            response.cookies.set({
                ...cookie,
                domain: cookieDomain,
                path: '/',
                sameSite: 'lax',
                secure: isProduction,
            });
        }
    });

    return response;
}
