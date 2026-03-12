import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
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

        // Prefer direct GPS; fallback to pincode-derived coordinates for BMB user creation.
        let lat = Number(latitude);
        let lng = Number(longitude);
        let resolvedState = state || null;
        let resolvedDistrict = district || null;
        let resolvedTaluka = taluka || null;
        if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && /^\d{6}$/.test(String(pincode || ''))) {
            const { data: pinRow } = await adminClient
                .from('loc_pincodes')
                .select('latitude, longitude, state, district, taluka')
                .eq('pincode', String(pincode))
                .maybeSingle();

            if (
                pinRow &&
                Number.isFinite(Number((pinRow as any).latitude)) &&
                Number.isFinite(Number((pinRow as any).longitude))
            ) {
                lat = Number((pinRow as any).latitude);
                lng = Number((pinRow as any).longitude);
                resolvedState = resolvedState || (pinRow as any).state || null;
                resolvedDistrict = resolvedDistrict || (pinRow as any).district || null;
                resolvedTaluka = resolvedTaluka || (pinRow as any).taluka || null;
            }
        }
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'GPS or valid pincode-based location is required to create an account',
                    code: 'LOCATION_REQUIRED',
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
        // 3. Create Profile (member role by default)
        const { error: profileError } = await adminClient.from('id_members').insert({
            id: userId,
            full_name: displayName,
            phone: cleanPhone,
            primary_phone: cleanPhone,
            role: 'member',
            pincode: pincode || null,
            state: resolvedState,
            district: resolvedDistrict,
            taluka: resolvedTaluka,
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
