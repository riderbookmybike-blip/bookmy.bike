import { createServerClient, type CookieOptions } from '@supabase/ssr';
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
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Handle server action/middleware context limitations if any
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Handle server action/middleware context limitations if any
                    }
                },
            },
        }
    );

    // 3. Sign In (Sets the cookie automatically via the methods above)
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error || !data.user) {
        return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    // 4. Fetch Profile Details (for immediate UI feedback)
    // We reuse the database connection to get the profile
    const { data: profile } = await supabase
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

    if (!profile) {
        return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    // 5. Set the custom middleware cookie as well (Redundancy for existing middleware)
    // Note: Supabase's own hash cookie is now ALSO set.
    const response = NextResponse.json({
        success: true,
        role: profile.role,
        name: profile.full_name,
        tenant_id: profile.tenant_id,
        tenant_name: profile.tenants?.name
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
