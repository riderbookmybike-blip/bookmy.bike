import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ success: false, message: 'Phone number required' }, { status: 400 });
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        const templateId = process.env.MSG91_TEMPLATE_ID;

        if (!authKey || !templateId) {
            console.warn('MSG91 Configuration Missing. Using developer fallback.');
            // Fail-safe for local development - allow the user to proceed with a mock OTP
            return NextResponse.json({
                success: true,
                message: 'Developer Mode: Use 1234 or your favorite test OTP'
            });
        }

        // 91 prefix is standard for India
        // Normalize phone number: remove non-digits, take last 10 chars, add 91
        const cleanedPhone = phone.replace(/\D/g, '');
        // Take the last 10 digits to handle cases like 098..., +9198..., 9198...
        const tenDigitPhone = cleanedPhone.slice(-10);
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
