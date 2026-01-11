import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();
        const MSG91_AUTH_KEY = '477985T3uAd4stn6963525fP1';

        // 4-digit OTP, 15 min expiry as per user widget settings
        const url = `https://control.msg91.com/api/v5/otp?mobile=91${phone}&authkey=${MSG91_AUTH_KEY}&otp_length=4&expiry=15`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (data.type === 'success') {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({
                success: false,
                message: data.message || 'Failed to send OTP'
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Send OTP API Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}
