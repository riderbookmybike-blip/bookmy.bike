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
            // 2. Create User if Not Exists
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email: email,
                phone: formattedPhone,
                email_confirm: true,
                phone_confirm: true,
                user_metadata: { full_name: displayName, phone: phone },
                password: password
            });

            if (createError) {
                console.error('Supabase Create User Error:', createError);
                return NextResponse.json({ success: false, message: 'Failed to create user record' }, { status: 500 });
            }
            userId = newUser.user.id;
        }

        // 3. Upsert Profile
        if (userId) {
            // First check if profile already has a referral code
            const { data: existingProfile } = await adminClient
                .from('profiles')
                .select('referral_code')
                .eq('id', userId)
                .single();

            const referralCode = existingProfile?.referral_code || generateDisplayId();

            // Get existing full name to preserve it if it's a real name
            const { data: existingNameProfile } = await adminClient
                .from('profiles')
                .select('full_name')
                .eq('id', userId)
                .single();

            // Only update name if:
            // 1. No existing profile, OR
            // 2. Existing name is a placeholder (like 'Rider 0596', 'Partner', etc.)
            const isPlaceholderName = !existingNameProfile?.full_name ||
                existingNameProfile.full_name.startsWith('Rider ') ||
                existingNameProfile.full_name === 'Partner' ||
                existingNameProfile.full_name === 'Guest';

            const finalName = isPlaceholderName ? (displayName || existingNameProfile?.full_name || 'Partner') : existingNameProfile?.full_name;

            const { error: profileError } = await adminClient
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: finalName,
                    phone: phone, // Storing raw 10 digit in profile for display
                    role: 'BMB_USER', // Default role
                    referral_code: referralCode,
                    pincode: pincode || null,
                    city: city || null,
                    state: state || null,
                    country: country || null,
                    address: address || null,
                    latitude: latitude || null,
                    longitude: longitude || null,
                });

            if (profileError) {
                console.error('Profile Sync Error:', profileError);
                // If it's a missing column error, we might log it but continue
            }
        }

        return NextResponse.json({ success: true, userId });

    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
