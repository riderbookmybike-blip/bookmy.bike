import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { phone, otp } = await request.json();

    // Mock Credentials Mapping
    const credentials: Record<string, { pin: string, role: string }> = {
        '9820760596': { pin: '6424', role: 'SUPER_ADMIN' },
        '7447403491': { pin: '6424', role: 'DEALER' },
        '7447403493': { pin: '6424', role: 'BANK' }
    };

    const user = credentials[phone];

    if (!user || user.pin !== otp) {
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({
        success: true,
        role: user.role
    });

    // Set the aums_session cookie
    response.cookies.set('aums_session', `session_${user.role.toLowerCase()}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
}
