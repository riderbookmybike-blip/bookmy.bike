import { NextRequest, NextResponse } from 'next/server';

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
        const AUTH_KEY = process.env.MSG91_AUTH_KEY || '477985T3uAd4stn6963525fP1'; // Valid Widget Key
        const TEMPLATE_ID = '6966079a8e1222c164607d3'; // Valid Template ID (v5 Required)
        const EXPIRY = 15; // Minutes

        // Format Phone (Force 91 prefix if missing, though typically handled by UI)
        const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

        let apiUrl = '';
        let method = 'POST';

        console.log(`[MSG91] Action: ${action} | Phone: ${formattedPhone}`);

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

            // 3. RESEND OTP
        } else if (action === 'resend') {
            const type = retryType || 'text'; // 'text' or 'voice'

            const baseUrl = `https://control.msg91.com/api/v5/otp/retry`;
            const params = new URLSearchParams({
                authkey: AUTH_KEY,
                mobile: formattedPhone,
                retrytype: type
            });
            apiUrl = `${baseUrl}?${params.toString()}`;

        } else {
            return NextResponse.json({ success: false, message: 'Invalid Action' }, { status: 400 });
        }

        // Execute Request
        const response = await fetch(apiUrl, {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        console.log(`[MSG91] Response (${action}):`, JSON.stringify(data));

        // Normalize Response
        if (data.type === 'success') {
            return NextResponse.json({
                success: true,
                message: data.message || 'Success',
                data: data
            });
        } else {
            // Handle "Already Sent" as success to prevent blocking UI
            if (data.message?.toLowerCase().includes('already sent')) {
                return NextResponse.json({ success: true, message: 'OTP already sent', data: data });
            }

            return NextResponse.json({
                success: false,
                message: data.message || 'MSG91 Error',
                error: data
            });
        }

    } catch (error: any) {
        console.error('[MSG91] Server Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
