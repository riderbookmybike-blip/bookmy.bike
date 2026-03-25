import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAuthPassword } from '@/lib/auth/password-utils';
import { toAppStorageFormat, isValidPhone } from '@/lib/utils/phoneUtils';
import { normalizeGeoCoordinates } from '@/lib/location/coordinates';
import { markCampaignRecipientByMember } from '@/lib/campaigns/wa-tracking';

export async function POST(req: NextRequest) {
    try {
        const {
            phone,
            displayName,
            referralCode,
            referralCodeFromLink,
            signupSource,
            pincode,
            state,
            district,
            taluka,
            area,
            latitude,
            longitude,
        } = await req.json();
        const cleanPhone = toAppStorageFormat(phone || '');
        const normalizedDisplayName = String(displayName || '').trim();
        const adminAny = adminClient as any;
        const capturePendingMembership = async (reason: string, referralCodeAttempt?: string) => {
            try {
                await adminAny.from('id_pending_memberships').upsert(
                    {
                        phone: cleanPhone,
                        full_name: String(displayName || '').trim() || null,
                        pincode: pincode || null,
                        state: state || null,
                        district: district || null,
                        taluka: taluka || null,
                        area: area || null,
                        latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
                        longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
                        referral_code_input:
                            String(referralCodeAttempt || '')
                                .trim()
                                .toUpperCase() || null,
                        referral_code_from_link:
                            String(referralCodeFromLink || '')
                                .trim()
                                .toUpperCase() || null,
                        source:
                            String(signupSource || 'DIRECT_LINK')
                                .trim()
                                .toUpperCase() || 'DIRECT_LINK',
                        reason,
                        status: 'PENDING',
                        last_seen_at: new Date().toISOString(),
                    },
                    { onConflict: 'phone' }
                );
            } catch (error) {
                console.error('[signup] pending-membership capture failed:', error);
            }
        };

        if (!phone || !referralCode) {
            if (isValidPhone(cleanPhone)) {
                await capturePendingMembership('SIGNUP_BLOCKED_MISSING_REFERRAL_CODE', referralCode);
            }
            return NextResponse.json(
                {
                    success: false,
                    message: 'Phone and Referral Code are required',
                    code: 'MISSING_REFERRAL_CODE',
                },
                { status: 400 }
            );
        }

        if (!isValidPhone(cleanPhone)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid phone number',
                },
                { status: 400 }
            );
        }

        if (!normalizedDisplayName) {
            await capturePendingMembership('SIGNUP_BLOCKED_MISSING_NAME');
            return NextResponse.json(
                {
                    success: false,
                    message: 'Full name is required',
                    code: 'MISSING_DISPLAY_NAME',
                },
                { status: 400 }
            );
        }

        // Canonical normalization: strip all non-alphanumeric chars, uppercase.
        // This makes raw codes (8UHQ3KFZ4), hyphenated (8UH-Q3K-FZ4), and
        // any other formatting variants all resolve to the same canonical form.
        const canonicalReferralCode = String(referralCode || '')
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
        if (!/^[A-Z0-9]{4,32}$/.test(canonicalReferralCode)) {
            await capturePendingMembership('SIGNUP_BLOCKED_INVALID_REFERRAL_FORMAT', canonicalReferralCode);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid referral code format',
                    code: 'INVALID_REFERRAL_FORMAT',
                },
                { status: 400 }
            );
        }
        // Single canonical lookup on referral_code (SOT).
        // Incoming code is already canonicalized above (non-alnum stripped, uppercased),
        // so hyphenated and raw variants both resolve to the same DB value.
        const { data: referrer } = await adminClient
            .from('id_members')
            .select('id, referral_code, role, full_name, display_id')
            .eq('referral_code', canonicalReferralCode)
            .maybeSingle();

        if (!referrer?.id) {
            await capturePendingMembership('SIGNUP_BLOCKED_INVALID_REFERRAL_CODE', canonicalReferralCode);
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

        // Early specific guard: pincode missing or malformed
        const pincodeStr = String(pincode || '').trim();
        if (!/^\d{6}$/.test(pincodeStr)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Pincode is required and must be exactly 6 digits.',
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
        if (!hasCoords) {
            await capturePendingMembership('SIGNUP_BLOCKED_MISSING_COORDINATES', canonicalReferralCode);
            return NextResponse.json(
                {
                    success: false,
                    message: 'GPS coordinates are required to complete signup.',
                    code: 'MISSING_COORDINATES',
                },
                { status: 400 }
            );
        }

        const resolvedDisplayName = normalizedDisplayName;
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
        const existingUser = existingUsers?.users.find(u => u.phone === formattedPhone || u.email === email);

        let userId: string;
        let isExistingUser = false;

        if (existingUser) {
            userId = existingUser.id;
            isExistingUser = true;
        } else {
            // 2. Create Auth User
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email: email,
                phone: formattedPhone,
                email_confirm: true,
                phone_confirm: true,
                user_metadata: {
                    full_name: resolvedDisplayName,
                    phone: cleanPhone,
                    referral_code_used: canonicalReferralCode,
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
            userId = newUser.user.id;
        }
        // 3. Create Profile (member role by default)
        const { error: profileError } = await adminClient.from('id_members').upsert(
            {
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
                    signup_referral_code: canonicalReferralCode,
                    signup_referrer_member_id: referrer.id,
                    signup_referrer_type: referrerType,
                    signup_referrer_name: referrer.full_name || null,
                    signup_referrer_display_id: referrer.display_id || null,
                    signup_referral_benefit_eligible: referralBenefitEligible,
                    signup_referral_benefit_status: referralBenefitEligible ? 'ELIGIBLE' : 'BLOCKED_TEAM_REFERRER',
                    signup_area: area || null,
                },
            },
            { onConflict: 'id' }
        );

        if (profileError) {
            console.error('Signup Profile Error:', profileError);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to create member profile. Please try again.',
                },
                { status: 500 }
            );
        }

        if (isExistingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User already exists. Please login.',
                    code: 'USER_EXISTS',
                },
                { status: 409 }
            );
        }

        // Campaign attribution (best effort): mark latest recipient row for this member as signed up.
        try {
            await markCampaignRecipientByMember({ memberId: userId, event: 'signup' });
        } catch (err) {
            console.error('[signup] campaign signup tracking failed:', err);
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
