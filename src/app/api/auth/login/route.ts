import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const { phone, otp } = await request.json();

    // 1. Validate OTP (Mock logic kept for P0)
    // Input Pwd "6424" -> Real Pwd "bookmybike6424"
    if (otp !== '6424' && otp !== '1234') {
        return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 401 });
    }

    const email = `${phone}@bookmybike.local`;
    const password = 'bookmybike6424';

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
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('[LoginAPI] Auth Error:', error);
        return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    if (!data.user || !data.session) {
        console.error('[LoginAPI] No user/session returned after success?');
        return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    console.log('[LoginAPI] Auth Success. User ID:', data.user.id);


    // 4. Fetch Profile Details (for immediate UI feedback)
    // SECURE FIX: Use the User's fresh Access Token to fetch profile.
    // This proves RLS is working correctly (no recursion, no permission denied).

    const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`
                }
            }
        }
    );

    console.log('[LoginAPI] Fetching profile with User Token (RLS Check)...');

    const { data: profile, error: profileError } = await userClient
        .from('profiles')
        .select(`
            *,
            tenants (
                name,
                type
            )
        `)
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
        session: data.session
    });

    // CRITICAL: Manually bridge Supabase Auth Cookies to Response
    cookieStore.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-')) {
            console.log(`[LoginAPI] Bridging cookie to response: ${cookie.name}`);
            response.cookies.set({
                ...cookie
            });
        }
    });

    response.cookies.set('aums_session', `session_${profile.role}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
}
