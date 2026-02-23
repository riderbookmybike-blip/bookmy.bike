import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { generateDisplayId } from '@/utils/displayId';
import { getAuthPassword } from '@/lib/auth/password-utils';
import { toAppStorageFormat, isValidPhone } from '@/lib/utils/phoneUtils';

export async function POST(req: NextRequest) {
    try {
        const { phone, displayName, pincode, state, district, taluka, area, latitude, longitude } = await req.json();

        if (!phone || !displayName) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Phone and Name are required',
                },
                { status: 400 }
            );
        }

        const cleanPhone = toAppStorageFormat(phone);
        if (!isValidPhone(cleanPhone)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid phone number',
                },
                { status: 400 }
            );
        }

        // Validate GPS coordinates (mandatory)
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'GPS location is required to create an account',
                    code: 'GPS_REQUIRED',
                },
                { status: 400 }
            );
        }

        const formattedPhone = `+91${cleanPhone}`;
        const email = `${cleanPhone}@bookmy.bike`;
        const password = getAuthPassword(cleanPhone);

        // 1. Check if User Already Exists
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const userExists = existingUsers?.users.some(u => u.phone === formattedPhone || u.email === email);

        if (userExists) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User already exists. Please login.',
                    code: 'USER_EXISTS',
                },
                { status: 409 }
            );
        }

        // 2. Create Auth User
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: email,
            phone: formattedPhone,
            email_confirm: true,
            phone_confirm: true,
            user_metadata: { full_name: displayName, phone: cleanPhone },
            password: password,
        });

        if (createError) {
            console.error('Signup Auth Error:', createError);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to create account.',
                },
                { status: 500 }
            );
        }

        const userId = newUser.user.id;
        const referralCode = generateDisplayId();

        // 3. Create Profile (BMB_USER role by default)
        const { error: profileError } = await adminClient.from('id_members').insert({
            id: userId,
            full_name: displayName,
            phone: cleanPhone,
            primary_phone: cleanPhone,
            role: 'BMB_USER',
            referral_code: referralCode,
            pincode: pincode || null,
            state: state || null,
            district: district || null,
            taluka: taluka || null,
            latitude: lat,
            longitude: lng,
        });

        if (profileError) {
            console.error('Signup Profile Error:', profileError);
            // Rollback? Deleting auth user might be dangerous if async, but ideally yes.
            // For now, allow it, but log error.
        }

        try {
            await adminClient.rpc('oclub_credit_signup', { p_member_id: userId });
        } catch (err) {
            console.error("Signup O' Circle bonus error:", err);
        }

        // 4. Auto-Login
        const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (signInError) {
            console.error('Signup Auto-Login Error:', signInError);
        }

        return NextResponse.json({
            success: true,
            userId,
            session: signInData?.session,
            user: signInData?.user,
            message: 'Account created successfully',
        });
    } catch (error) {
        console.error('Signup API Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal Server Error',
            },
            { status: 500 }
        );
    }
}
