import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { generateDisplayId } from '@/utils/displayId';

export async function POST(req: NextRequest) {
    try {
        const { phone, displayName, pincode, city, state, country, latitude, longitude, address } = await req.json();

        if (!phone) {
            return NextResponse.json({ success: false, message: 'Phone number required' }, { status: 400 });
        }

        const formattedPhone = `91${phone}`; // Ensure E.164 format (India)
        const email = `${phone}@bookmy.bike`; // Synthesized email for Supabase Auth
        const password = `MSG91_${phone}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8)}`; // Secure-ish password bypass

        // 1. Check if User Exists in Supabase Auth
        const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
        let userId = existingUsers?.users.find(u => u.phone === formattedPhone || u.email === email)?.id;

        if (!userId) {
            // 2. User MUST exist for Login flow
            return NextResponse.json({
                success: false,
                message: 'Account not found. Please create an account first.',
                code: 'USER_NOT_FOUND'
            }, { status: 404 });
        }

        // 3. Update Last Seen (Optional) - No Profiler Overwrite

        // 4. GENERATE SESSION
        // Since we synthesized the password, we can use it to sign in on behalf of the user
        const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (signInError || !signInData.session) {
            console.error('Session Generation Error:', signInError);
            return NextResponse.json({
                success: false,
                message: 'Failed to generate session token.'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            userId,
            session: signInData.session
        });

    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
