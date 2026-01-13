import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { phone, otp } = await req.json();

        if (!phone || !otp) {
            return NextResponse.json({ success: false, message: 'Phone and OTP required' }, { status: 400 });
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        if (!authKey) {
            return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
        }

        const mobile = `91${phone}`;
        const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${mobile}&otp=${otp}&authkey=${authKey}`;

        const res = await fetch(url, { method: 'POST' }); // Verify endpoint often uses POST or GET, depending on version. v5 docs usually say POST/GET works.
        const data = await res.json();

        if (data.type === 'success') {
            // OTP Verified. Now generate a session for the user.
            // logic reused from sync/route.ts

            // 1. Check if User Exists
            const { data: existingUsers } = await adminClient.auth.admin.listUsers();

            // Create synthesized email consistently
            const email = `${phone}@bookmy.bike`;
            const formattedPhone = mobile;

            const foundUser = existingUsers?.users.find(
                u => u.phone === formattedPhone || u.phone === phone || u.email === email
            );

            if (!foundUser) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Account not found. Please create an account first.',
                    },
                    { status: 404 }
                );
            }

            const userId = foundUser.id;
            // Use `MSG91_` prefix hack for session generation if we don't have a real password
            // But ideally, we should use magic lik or just admin.signInWithId? Supabase doesn't support that easily.
            // We'll stick to the "sync" route logic: Password bypass for simplicity as per existing design.
            const password = `MSG91_${phone}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8)}`;
            const actualEmail = foundUser.email || email;

            // Ensure password is set (idempotent)
            await adminClient.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true,
                user_metadata: { phone_login_migrated: true },
            });

            const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
                email: actualEmail,
                password: password,
            });

            if (signInError || !signInData.session) {
                return NextResponse.json({ success: false, message: 'Session generation failed' }, { status: 500 });
            }

            const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', userId).single();

            return NextResponse.json({
                success: true,
                session: signInData.session,
                user: {
                    ...signInData.user,
                    user_metadata: { ...signInData.user.user_metadata, full_name: profile?.full_name },
                },
                message: 'Login successful',
            });
        } else {
            return NextResponse.json({ success: false, message: data.message || 'Invalid OTP' }, { status: 400 });
        }
    } catch (error) {
        console.error('MSG91 Verify Endpoint Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
