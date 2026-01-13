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
        // We can update last_login or location here if needed, but strictly NO overwriting critical profile data.

        // For now, we just return success to confirm session validity
        return NextResponse.json({ success: true, userId });

        return NextResponse.json({ success: true, userId });

    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
