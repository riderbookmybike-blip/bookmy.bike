import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ exists: false });
        }

        // Check profiles table first (faster/cleaner than auth)
        // Ensure phone format matches DB storage (assuming raw 10 digit or E.164)
        // stored as 10 digit in profile based on sync logic: `phone: phone` (raw)

        const { data: profile, error } = await adminClient
            .from('profiles')
            .select('full_name')
            .eq('phone', phone)
            .single();

        if (profile) {
            return NextResponse.json({
                exists: true,
                name: profile.full_name
            });
        }

        return NextResponse.json({ exists: false });

    } catch (err) {
        console.error('Check User Error:', err);
        return NextResponse.json({ exists: false }, { status: 500 });
    }
}
