import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ success: false, message: 'Phone number required' }, { status: 400 });
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        const templateId = process.env.MSG91_TEMPLATE_ID;
        const isProduction = process.env.NODE_ENV === 'production';
        const host = req.headers.get('host') || '';
        const hostName = host.split(':')[0]?.toLowerCase() || '';
        const isLocalhost = hostName === 'localhost' || hostName === '127.0.0.1' || hostName === '0.0.0.0';
        if (!authKey || !templateId) {
            if (!isProduction && isLocalhost) {
                return NextResponse.json({ success: true, message: 'Local dev mode: OTP not required' });
            }
            console.error('MSG91 Configuration Missing.');
            return NextResponse.json({ success: false, message: 'OTP service unavailable' }, { status: 500 });
        }

        // 91 prefix is standard for India
        // Normalize phone number: remove non-digits, take last 10 chars, add 91
        const cleanedPhone = phone.replace(/\D/g, '');
        // Take the last 10 digits to handle cases like 098..., +9198..., 9198...
        const tenDigitPhone = cleanedPhone.slice(-10);
        if (tenDigitPhone.length !== 10) {
            return NextResponse.json({ success: false, message: 'Invalid phone number' }, { status: 400 });
        }
        const mobile = `91${tenDigitPhone}`;
        const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${mobile}&authkey=${authKey}`;

        const res = await fetch(url, { method: 'POST' });
        const rawText = await res.text();
        let data: { type?: string; message?: string } | null = null;

        try {
            data = rawText ? JSON.parse(rawText) : null;
        } catch (parseError) {
            console.error('MSG91 Send Response Parse Error:', parseError);
        }

        if (data?.type === 'success') {
            return NextResponse.json({ success: true, message: 'OTP sent successfully' });
        } else {
            console.error('MSG91 Send Error:', {
                status: res.status,
                statusText: res.statusText,
                response: data || rawText,
            });
            return NextResponse.json(
                { success: false, message: data?.message || 'Failed to send OTP' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('MSG91 Send Endpoint Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
