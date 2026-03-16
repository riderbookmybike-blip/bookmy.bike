import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAuthPassword } from '@/lib/auth/password-utils';
import { toAppStorageFormat, isValidPhone } from '@/lib/utils/phoneUtils';
import { normalizeGeoCoordinates } from '@/lib/location/coordinates';

export async function POST(req: NextRequest) {
    try {
        const { phone, displayName, referralCode, pincode, state, district, taluka, area, latitude, longitude } =
            await req.json();

        if (!phone || !referralCode) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Phone and Referral Code are required',
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

        const normalizedReferralCode = String(referralCode || '')
            .trim()
            .toUpperCase();
        if (!/^[A-Z0-9-]{4,32}$/.test(normalizedReferralCode)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid referral code format',
                },
                { status: 400 }
            );
        }
        const { data: referrer } = await adminClient
            .from('id_members')
            .select('id, referral_code, role, full_name, display_id')
            .eq('referral_code', normalizedReferralCode)
            .maybeSingle();
        if (!referrer?.id) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Referral code not found',
                    code: 'INVALID_REFERRAL_CODE',
                },
                { status: 400 }
            );
        }

        // Coordinates SOT: normalize once, support both lat/lng and latitude/longitude payloads.
        const normalizedCoords = normalizeGeoCoordinates({ latitude, longitude });
        let lat = normalizedCoords.latitude;
        let lng = normalizedCoords.longitude;
        let resolvedState = state || null;
        let resolvedDistrict = district || null;
        let resolvedTaluka = taluka || null;

        // Early specific guard: pincode provided but malformed (not exactly 6 digits)
        const pincodeStr = String(pincode || '').trim();
        if (pincodeStr && !/^\d{6}$/.test(pincodeStr)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Pincode must be exactly 6 digits.',
                    code: 'INVALID_PINCODE_FORMAT',
                },
                { status: 400 }
            );
        }

        if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && /^\d{6}$/.test(pincodeStr)) {
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
        const hasCoords = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

        const resolvedDisplayName = String(displayName || '').trim() || `Rider ${cleanPhone.slice(-4)}`;
        const referrerRole = String(referrer.role || '')
            .trim()
            .toUpperCase();
        const referrerType = referrerRole === 'MEMBER' ? 'MEMBER' : 'TEAM';
        const referralBenefitEligible = referrerType === 'MEMBER';

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
            user_metadata: {
                full_name: resolvedDisplayName,
                phone: cleanPhone,
                referral_code_used: normalizedReferralCode,
            },
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
            full_name: resolvedDisplayName,
            phone: cleanPhone,
            primary_phone: cleanPhone,
            role: 'member',
            pincode: pincode || null,
            state: resolvedState,
            district: resolvedDistrict,
            taluka: resolvedTaluka,
            latitude: hasCoords ? Number(lat) : null,
            longitude: hasCoords ? Number(lng) : null,
            preferences: {
                signup_referral_code: normalizedReferralCode,
                signup_referrer_member_id: referrer.id,
                signup_referrer_type: referrerType,
                signup_referrer_name: referrer.full_name || null,
                signup_referrer_display_id: referrer.display_id || null,
                signup_referral_benefit_eligible: referralBenefitEligible,
                signup_referral_benefit_status: referralBenefitEligible ? 'ELIGIBLE' : 'BLOCKED_TEAM_REFERRER',
                signup_area: area || null,
            },
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
            referredBy: {
                id: referrer.id,
                displayId: referrer.display_id || null,
                name: referrer.full_name || null,
                type: referrerType,
                referralBenefitEligible,
            },
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
