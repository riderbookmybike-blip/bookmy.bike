import { NextRequest, NextResponse } from 'next/server';

/**
 * Pure Server-Side OTP API
 * Bypasses MSG91 widget CORS restrictions on subdomains
 * 
 * Actions: 'send', 'verify', 'resend'
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, action, otp } = body;

        if (!phone || !action) {
            return NextResponse.json({
                success: false,
                message: 'Phone and action required'
            }, { status: 400 });
        }

        // Format phone with country code
        const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

        // MSG91 Credentials
        const AUTH_KEY = process.env.MSG91_AUTH_KEY || '477985Az5dYpYUze6965fd67P1';
        const TEMPLATE_ID = '6966079a8e1222c164607d3'; // OTP Template
        const OTP_EXPIRY = 15; // minutes

        console.log(`[Server OTP] Action: ${action}, Phone: ${formattedPhone}`);

        if (action === 'send') {
            // Send OTP using MSG91's OTP API with Template ID
            const url = `https://api.msg91.com/api/v5/otp?authkey=${AUTH_KEY}&template_id=${TEMPLATE_ID}&mobile=${formattedPhone}&otp_length=4&otp_expiry=${OTP_EXPIRY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            console.log('[Server OTP] Send Response:', data);

            if (data.type === 'success') {
                return NextResponse.json({
                    success: true,
                    message: 'OTP sent successfully',
                    requestId: data.request_id
                });
            }

            // Handle "already sent" case
            if (data.message?.includes('already sent')) {
                return NextResponse.json({
                    success: true,
                    message: 'OTP already sent. Please check your phone.'
                });
            }

            return NextResponse.json({
                success: false,
                message: data.message || 'Failed to send OTP',
                error: data
            });

        } else if (action === 'verify') {
            if (!otp) {
                return NextResponse.json({
                    success: false,
                    message: 'OTP required'
                }, { status: 400 });
            }

            // Verify OTP using MSG91's verify API
            const url = `https://api.msg91.com/api/v5/otp/verify?authkey=${AUTH_KEY}&mobile=${formattedPhone}&otp=${otp}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            console.log('[Server OTP] Verify Response:', data);

            if (data.type === 'success') {
                return NextResponse.json({
                    success: true,
                    message: 'OTP verified successfully'
                });
            }

            return NextResponse.json({
                success: false,
                message: data.message || 'Invalid OTP'
            });

        } else if (action === 'resend') {
            // Resend OTP using MSG91's retry API
            const retryType = body.retryType || 'text'; // 'text' or 'voice'
            const url = `https://api.msg91.com/api/v5/otp/retry?authkey=${AUTH_KEY}&mobile=${formattedPhone}&retrytype=${retryType}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            console.log('[Server OTP] Resend Response:', data);

            if (data.type === 'success') {
                return NextResponse.json({
                    success: true,
                    message: 'OTP resent successfully'
                });
            }

            return NextResponse.json({
                success: false,
                message: data.message || 'Failed to resend OTP'
            });
        }

        return NextResponse.json({
            success: false,
            message: 'Invalid action. Use: send, verify, or resend'
        }, { status: 400 });

    } catch (error: any) {
        console.error('[Server OTP] Error:', error);
        return NextResponse.json({
            success: false,
            message: 'OTP service error',
            error: error.message
        }, { status: 500 });
    }
}
