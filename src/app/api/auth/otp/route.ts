import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side verification of MSG91 OTP access token
 * 
 * Hybrid approach:
 * 1. Client-side widget handles OTP send/verify
 * 2. Widget returns an access token on successful verification
 * 3. This API verifies that token with MSG91 server
 */
export async function POST(request: NextRequest) {
    try {
        const { accessToken } = await request.json();

        if (!accessToken) {
            return NextResponse.json({
                success: false,
                message: 'Access token required'
            }, { status: 400 });
        }

        const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '477985Az5dYpYUze6965fd67P1';

        // Verify the access token with MSG91
        const response = await fetch(
            'https://control.msg91.com/api/v5/widget/verifyAccessToken',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    authkey: MSG91_AUTH_KEY,
                    'access-token': accessToken,
                }),
            }
        );

        const data = await response.json();
        console.log('[MSG91 Token Verify] Response:', data);

        if (data.type === 'success') {
            return NextResponse.json({
                success: true,
                message: 'Token verified successfully',
                data: data
            });
        }

        return NextResponse.json({
            success: false,
            message: data.message || 'Token verification failed'
        });

    } catch (error: any) {
        console.error('[MSG91 Token Verify] Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Token verification error'
        }, { status: 500 });
    }
}
