import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

/**
 * MSG91 OTP Integration (Clean Implementation)
 * 
 * Documentation: https://docs.msg91.com/p/tf9GTextN/api/5/otp
 * Endpoint: control.msg91.com (Legacy Compatible)
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, action, otp, retryType } = body;

        // Validation
        if (!phone || !action) {
            return NextResponse.json({ success: false, message: 'Missing phone or action' }, { status: 400 });
        }

        // Configuration
        // Configuration
        // FALLBACK UPDATED: "vercelotp" Key (IP Security OFF) - 13 Jan 2026
        const AUTH_KEY = process.env.MSG91_AUTH_KEY || '477985AKrYM3Z2qGB69663f79P1';
        // FALLBACK UPDATED: Verified by User (Fixed Typo: 8e -> 8ee) - 13 Jan 2026
        const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || '6966079a8ee1222c164607d3';

        if (!AUTH_KEY) {
            console.error('[MSG91] Critical: Missing MSG91_AUTH_KEY env variable');
            return NextResponse.json({ success: false, message: 'Server Configuration Error' }, { status: 500 });
        }

        const EXPIRY = 15; // Minutes

        // STRICT NORMALIZATION & VALIDATION
        // 1. Strip all non-numeric characters
        const cleaned = phone.replace(/\D/g, '');
        let formattedPhone = '';

        // 2. Strict Logic for Indian Mobiles
        if (cleaned.length === 10) {
            formattedPhone = `91${cleaned}`;
        } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
            formattedPhone = cleaned;
        } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
            formattedPhone = `91${cleaned.substring(1)}`;
        } else {
            // REJECT invalid formats (e.g. 0091..., 11 digit non-zero, etc)
            return NextResponse.json({
                success: false,
                message: 'Invalid Phone Number. Please enter a valid 10-digit Indian number.'
            }, { status: 400 });
        }

        let apiUrl = '';
        let method = 'POST';

        console.log(`[MSG91] Action: ${action} | Phone: ${formattedPhone} | Cleaned: ${cleaned}`);

        // 1. SEND OTP
        if (action === 'send') {
            // URL Construction
            const baseUrl = `https://control.msg91.com/api/v5/otp`;
            const params = new URLSearchParams({
                authkey: AUTH_KEY,
                template_id: TEMPLATE_ID,
                mobile: formattedPhone,
                otp_length: '4',
                expiry: EXPIRY.toString()
            });
            apiUrl = `${baseUrl}?${params.toString()}`;

            // 2. VERIFY OTP
        } else if (action === 'verify') {
            if (!otp) return NextResponse.json({ success: false, message: 'OTP Required' }, { status: 400 });

            const baseUrl = `https://control.msg91.com/api/v5/otp/verify`;
            const params = new URLSearchParams({
                authkey: AUTH_KEY,
                mobile: formattedPhone,
                otp: otp
            });
            apiUrl = `${baseUrl}?${params.toString()}`;

            // Execute MSG91 Verification
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (data.type === 'success') {
                // BRIDGE: Create Supabase Session
                const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    { auth: { autoRefreshToken: false, persistSession: false } }
                );

                // 1. Find User
                const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                const user = users?.find(u =>
                    u.phone === formattedPhone ||
                    u.phone === `+${formattedPhone}` ||
                    u.user_metadata?.phone === formattedPhone
                );

                if (!user) {
                    return NextResponse.json({ success: false, message: 'User not found. Please Sign Up first.' }, { status: 404 });
                }

                // 2. Mint Custom JWT (Session)
                const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
                const token = await new SignJWT({
                    aud: 'authenticated',
                    sub: user.id,
                    role: 'authenticated',
                    phone: user.phone
                })
                    .setProtectedHeader({ alg: 'HS256' })
                    .setIssuedAt()
                    .setExpirationTime('1h') // Short-lived custom token
                    .sign(secret);

                console.log(`[Auth Bridge] Session created for ${user.id}`);

                return NextResponse.json({
                    success: true,
                    message: 'Verified & Logged In',
                    session: {
                        access_token: token,
                        token_type: 'bearer',
                        user: user,
                        refresh_token: null // Custom flow doesn't support refresh yet (Client handles re-auth)
                    }
                });

            } else {
                return NextResponse.json({ success: false, message: data.message || 'Invalid OTP', error: data });
            }

            // 3. RESEND OTP
        } else if (action === 'resend') {
            // ... (rest remains same)
            const type = retryType || 'text'; // 'text' or 'voice'

            const baseUrl = `https://control.msg91.com/api/v5/otp/retry`;
            const params = new URLSearchParams({
                authkey: AUTH_KEY,
                mobile: formattedPhone,
                retrytype: type
            });
            apiUrl = `${baseUrl}?${params.toString()}`;

            // Execute Request (Consolidated for Resend/Send only)
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            // ... (Log & Return)
            if (data.type === 'success') {
                return NextResponse.json({
                    success: true,
                    message: data.message || 'Success',
                    data: data
                });
            } else {
                if (data.message?.toLowerCase().includes('already sent')) {
                    return NextResponse.json({ success: true, message: 'OTP already sent', data: data });
                }
                return NextResponse.json({ success: false, message: data.message || 'MSG91 Error', error: data });
            }
        }

        // Final fallback for safety
        return NextResponse.json({ success: false, message: 'Unknown Action' }, { status: 400 });

    } catch (error: any) {
        console.error('[MSG91] Server Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
