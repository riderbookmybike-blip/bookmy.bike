import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

/**
 * MSG91 OTP Integration (Secure Widget Flow)
 *
 * Documentation: https://docs.msg91.com/p/tf9GTextN/api/5/otp
 * Endpoint: control.msg91.com (Legacy Compatible)
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, action, otp } = body;

        // Validation
        if (!phone || !action) {
            return NextResponse.json({ success: false, message: 'Missing phone or action' }, { status: 400 });
        }

        // Configuration
        const AUTH_KEY = '451395A5xCupqOIY6966490cP1';
        // Template ID not needed for Widget Flow Verification

        // STRICT NORMALIZATION
        const cleaned = phone.replace(/\D/g, '');
        let formattedPhone = '';
        if (cleaned.length === 10) formattedPhone = `91${cleaned}`;
        else if (cleaned.length === 12 && cleaned.startsWith('91')) formattedPhone = cleaned;
        else if (cleaned.length === 11 && cleaned.startsWith('0')) formattedPhone = `91${cleaned.substring(1)}`;
        else formattedPhone = `91${cleaned}`; // Default fallback

        // 1. VERIFY WIDGET TOKEN
        if (action === 'verify') {
            if (!otp) return NextResponse.json({ success: false, message: 'Token Required' }, { status: 400 });

            const verifyUrl = `https://control.msg91.com/api/v5/widget/verifyAccessToken`;

            const response = await fetch(verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authkey: AUTH_KEY,
                },
                body: JSON.stringify({
                    authkey: AUTH_KEY,
                    'access-token': otp,
                }),
            });

            const data = await response.json();

            // SUCCESS CHECK
            if (data.type === 'success' || data.message === 'success') {
                // SECURITY CRITICAL: Use Verified Mobile from Response
                // We do NOT trust the 'phone' sent by the client.
                const verifiedMobileNum =
                    data.mobile ||
                    data.identifier ||
                    (typeof data.message === 'string' && data.message.match(/^\d+$/) ? data.message : null);

                if (!verifiedMobileNum) {
                    console.error('[Auth Security] Critical: No verified mobile in MSG91 response', data);
                    return NextResponse.json(
                        { success: false, message: 'Security Error: Provider did not return verified identifier.' },
                        { status: 403 }
                    );
                }

                // BRIDGE: Create Supabase Session
                const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    { auth: { autoRefreshToken: false, persistSession: false } }
                );

                // Find User by VERIFIED MOBILE (Targeted Lookup)
                const { data: listData, error: listError } = await (supabaseAdmin.auth.admin as any).listUsers({
                    filters: {
                        phone: verifiedMobileNum,
                    },
                });

                let user = listData?.users?.[0];

                // Fallback: Try with + prefix if exact match fails
                if (!user && !verifiedMobileNum.startsWith('+')) {
                    const { data: usersPlus } = await (supabaseAdmin.auth.admin as any).listUsers({
                        filters: {
                            phone: `+${verifiedMobileNum}`,
                        },
                    });
                    user = usersPlus?.users?.[0];
                }

                if (!user) {
                    // Start of New User Logic?
                    // For now, fail if not found. Client needs to handle Sign Up.
                    // But usually, we might want to allow sign up here?
                    return NextResponse.json(
                        { success: false, message: 'User not found. Please Sign Up first.' },
                        { status: 404 }
                    );
                }

                // Mint Session
                const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
                const token = await new SignJWT({
                    aud: 'authenticated',
                    sub: user.id,
                    role: 'authenticated',
                    phone: user.phone,
                })
                    .setProtectedHeader({ alg: 'HS256' })
                    .setIssuedAt()
                    .setExpirationTime('1h')
                    .sign(secret);

                return NextResponse.json({
                    success: true,
                    message: 'Verified & Logged In',
                    session: {
                        access_token: token,
                        token_type: 'bearer',
                        user: user,
                        refresh_token: null,
                    },
                });
            } else {
                return NextResponse.json({ success: false, message: 'Token Verification Failed', error: data });
            }
        }

        // 2. SEND OTP / RESEND (Client-Side Widget Should Handle This)
        // Keeping this as a stub or fallback if absolutely necessary, but advising client to use widget.
        return NextResponse.json(
            { success: false, message: 'Please use Client-Side Widget for Sending OTP.' },
            { status: 400 }
        );
    } catch (error) {
        console.error('[MSG91] Server Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
