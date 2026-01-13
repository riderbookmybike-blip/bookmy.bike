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
            console.error('MSG91 Configuration Missing');
            return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
        }

        // 91 prefix is standard for India
        const mobile = `91${phone}`;
        const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${mobile}&authkey=${authKey}`;

        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();

        if (data.type === 'success') {
            return NextResponse.json({ success: true, message: 'OTP sent successfully' });
        } else {
            console.error('MSG91 Send Error:', data);
            return NextResponse.json(
                { success: false, message: data.message || 'Failed to send OTP' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('MSG91 Send Endpoint Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
