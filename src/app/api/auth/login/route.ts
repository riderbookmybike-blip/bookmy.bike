import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const { phone, otp } = await request.json();

    // Map Inputs to Dev Credentials
    // Input Pwd "6424" -> Real Pwd "bookmybike6424"
    if (otp !== '6424') {
        return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 401 });
    }

    const email = `${phone}@bookmybike.local`;
    const password = 'bookmybike6424';

    // SERVER-SIDE SUPABASE CLIENT (Auth only)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error || !data.user) {
        return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
    }

    // AUTH SUCCESS

    // Fetch Profile Role (using Admin Client or Public Client if RLS allows reading own profile)
    // We'll use Admin Client to be safe and fast for this P0 logic
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (!profile) {
        return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    const response = NextResponse.json({
        success: true,
        role: profile.role,
        name: profile.full_name,
        tenant_id: profile.tenant_id
    });

    // We can rely on Supabase's automatic cookie handling if we used the ssr helper, 
    // but here we might need to set a custom session cookie for our middleware logic 
    // OR just use the one we established before 'aums_session'.
    // Let's keep 'aums_session' for our middleware simple logic + Supabase's own session.

    response.cookies.set('aums_session', `session_${profile.role}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
}
