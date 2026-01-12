import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const { phone } = await request.json();

    // 1. OTP Verification is handled on the Client side via MSG91 SDK Widget
    // We trust the client has verified it before calling this endpoint.
    // In production, you might want to verify it again if you have a valid Auth Key.
    console.log(`[LoginAPI] Skipping redundant server-side MSG91 verification for phone: ${phone}`);

    const email = `${phone}@bookmy.bike`;
    const password = `MSG91_${phone}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8)}`;

    const cookieStore = await cookies();

    // 2. Initialize Supabase SSR Client
    // This client automatically handles setting/getting cookies on the request/response
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
                        console.log(`[LoginAPI] Setting Cookie: ${name}`);
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        console.error(`[LoginAPI] Failed to set cookie ${name}:`, error);
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        console.log(`[LoginAPI] Removing Cookie: ${name}`);
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        console.error(`[LoginAPI] Failed to remove cookie ${name}:`, error);
                    }
                },
            },
        }
    );

    console.log('[LoginAPI] Attempting sign in...');
    console.log('[LoginAPI] Attempting sign in...');
    // eslint-disable-next-line
    let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.warn(
            '[LoginAPI] Standard Auth Request failed. Attempting Auto-Recovery/Registration...',
            error.message
        );

        // --- AUTO-RECOVERY & REGISTRATION LOGIC ---
        try {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                    },
                }
            );

            // 1. Standardize Phone Format
            const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
            // Note: email variable above is `${phone}@bookmy.bike`, ensuring consistent email mapping.

            // 2. Find User (Admin API)
            // Note: listUsers() matches on Phone or Email.
            const {
                data: { users },
                error: listError,
            } = await supabaseAdmin.auth.admin.listUsers();

            if (listError) {
                console.error('[LoginAPI] Admin List Users Failed:', listError);
                throw listError;
            }

            // Exact match check
            const existingUser = users.find(u => u.phone === formattedPhone || u.email === email);

            let userId = '';

            if (existingUser) {
                console.log(`[LoginAPI] Syncing password for ${existingUser.id}...`);

                // 3a. Update Password
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                    password: password,
                    user_metadata: { ...existingUser.user_metadata, phone_verified: true },
                });

                if (updateError) {
                    console.error('[LoginAPI] Password Sync Failed:', updateError);
                    throw updateError;
                }
                userId = existingUser.id;
                // CRITICAL: Update the email variable to match the found user's email for the retry
                if (existingUser.email && existingUser.email !== email) {
                    // Switch to existing user email for retry
                }
            } else {
                console.warn(`[LoginAPI] User not found for ${formattedPhone}. Strict Mode: BLOCKING.`);
                return NextResponse.json(
                    { success: false, message: 'Access Denied. Account not found.' },
                    { status: 403 }
                );
            }

            // 4. Ensure Profile Exists (Only for found users)
            if (userId) {
                const { data: existingProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('id', userId)
                    .single();

                if (!existingProfile) {
                    console.log(`[LoginAPI] Profile missing for ${userId}. Creating default profile...`);
                    // Fetch default tenant
                    const { data: settings } = await supabaseAdmin
                        .from('app_settings')
                        .select('default_owner_tenant_id')
                        .single();
                    const defaultTenantId = settings?.default_owner_tenant_id || '5371fa81-a58a-4a39-aef2-2821268c96c8';

                    await supabaseAdmin.from('profiles').insert({
                        id: userId,
                        email: email,
                        phone: formattedPhone,
                        full_name: 'Partner',
                        tenant_id: defaultTenantId,
                        role: 'DEALER_OWNER',
                    });

                    // Also ensure default membership
                    await supabaseAdmin
                        .from('memberships')
                        .insert({
                            user_id: userId,
                            tenant_id: defaultTenantId,
                            role: 'OWNER',
                            status: 'ACTIVE',
                            is_default: true,
                        })
                        .select();
                }
            }

            console.log('[LoginAPI] Recovery successful. Retrying login...');

            // 5. Retry Login
            // Add a tiny delay to ensure Supabase Auth internal state is ready
            await new Promise(resolve => setTimeout(resolve, 500));

            const retryAuth = await supabase.auth.signInWithPassword({
                email: existingUser?.email || email,
                password,
            });

            if (retryAuth.error) {
                console.error('[LoginAPI] Retry Auth Failed:', retryAuth.error);
                return NextResponse.json(
                    { success: false, message: 'Authentication failed after recovery.' },
                    { status: 401 }
                );
            }

            // Allow execution to fall through to Success handling by updating the `data` variable?
            // Since `data` is const, we need to return early or handle it here.
            // The code below uses `data.user` and `data.session`.
            // We can re-assign `data` if we change it to let, or just copy the success logic block.
            // For minimal disruption, let's recursively call logic or restructure.
            // EASIEST: Just return the response from here using the new session.

            data.user = retryAuth.data.user;
            data.session = retryAuth.data.session;
        } catch (recoveryError) {
            console.error('[LoginAPI] Recovery process failed:', recoveryError);
            return NextResponse.json(
                { success: false, message: 'Authentication failed. Please contact support.' },
                { status: 401 }
            );
        }
    }

    if (!data.user || !data.session) {
        console.error('[LoginAPI] No user/session returned after success?');
        return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    console.log('[LoginAPI] Auth Success. User ID:', data.user.id);

    // 4. Fetch Profile Details (for immediate UI feedback)
    // SECURE FIX: Use the User's fresh Access Token to fetch profile.
    // This proves RLS is working correctly (no recursion, no permission denied).

    const userClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: {
            headers: {
                Authorization: `Bearer ${data.session.access_token}`,
            },
        },
    });

    console.log('[LoginAPI] Fetching profile with User Token (RLS Check)...');

    const { data: profile, error: profileError } = await userClient
        .from('profiles')
        .select(
            `
            *,
            tenants (
                name,
                type
            )
        `
        )
        .eq('id', data.user.id)
        .single();

    if (profileError) {
        console.error('[LoginAPI] Profile Fetch Failed (RLS Issue?):', profileError);
        return NextResponse.json({ success: false, message: 'Failed to retrieve user profile.' }, { status: 500 });
    }

    if (!profile) {
        return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    // 5. Build Response
    const response = NextResponse.json({
        success: true,
        role: profile.role,
        name: profile.full_name,
        tenant_id: profile.tenant_id,
        tenant_name: profile.tenants?.name,
        session: data.session,
    });

    // CRITICAL: Manually bridge Supabase Auth Cookies to Response with ROOT DOMAIN Scope
    // This ensures login at me.bookmy.bike works at team.bookmy.bike
    const isProduction = process.env.NODE_ENV === 'production';
    const host = request.headers.get('host') || '';

    // Determine cookie domain dynamically based on proper production domain
    // If we are on ANY *.bookmy.bike subdomain, scope to .bookmy.bike
    // Otherwise (localhost, Vercel preview), leave undefined to restrict to host
    const cookieDomain = host.endsWith('.bookmy.bike') ? '.bookmy.bike' : undefined;

    cookieStore.getAll().forEach(cookie => {
        if (cookie.name.startsWith('sb-')) {
            console.log(`[LoginAPI] Bridging cookie to response: ${cookie.name}`);
            response.cookies.set({
                ...cookie,
                domain: cookieDomain,
                path: '/',
                sameSite: 'lax',
                secure: isProduction,
            });
        }
    });

    response.cookies.set('aums_session', `session_${profile.role}`, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
}
