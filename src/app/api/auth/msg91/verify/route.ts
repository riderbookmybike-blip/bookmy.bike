import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { adminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { phone, otp } = await req.json();

        if (!phone || !otp) {
            return NextResponse.json({ success: false, message: 'Phone and OTP required' }, { status: 400 });
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        const mobile = `91${phone}`;
        let isVerified = false;
        let errorMessage = 'Invalid OTP';

        if (!authKey) {
            console.warn('MSG91 Configuration Missing. Using developer bypass.');
            isVerified = otp === '1234' || otp === '0000' || process.env.NODE_ENV === 'development';
        } else {
            const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${mobile}&otp=${otp}&authkey=${authKey}`;
            const res = await fetch(url, { method: 'POST' });
            const data = await res.json();
            isVerified = data.type === 'success';
            if (!isVerified) errorMessage = data.message || 'Invalid OTP';
        }

        if (isVerified) {
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

            // SELF-VERIFY: Check if the token is actually valid right now
            const { error: verifyError } = await adminClient.auth.getUser(signInData.session.access_token);
            if (verifyError) {
                console.error('CRITICAL: Generated Token is Invalid at Birth:', verifyError);
                return NextResponse.json(
                    { success: false, message: 'Security token generation failed. Please try again.' },
                    { status: 500 }
                );
            } else {

            }

            const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', userId).single();

            const payload = {
                success: true,
                session: signInData.session,
                user: {
                    ...signInData.user,
                    user_metadata: { ...signInData.user.user_metadata, full_name: profile?.full_name },
                },
                message: 'Login successful',
            };

            const cookieStore = await cookies();
            const host = req.headers.get('host') || '';
            const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';
            const isLocalhost = host.includes('localhost') || host.startsWith('127.') || host.startsWith('0.0.0.0');
            const cookieDomain = !isLocalhost ? `.${rootDomain}` : undefined;
            const isSecure = !isLocalhost;

            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return cookieStore.getAll();
                        },
                        setAll(cookiesToSet) {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, {
                                    ...options,
                                    path: '/',
                                    sameSite: 'lax',
                                    secure: isSecure,
                                    ...(cookieDomain ? { domain: cookieDomain } : {}),
                                });
                            });
                        },
                    },
                }
            );

            const { error: sessionError } = await supabase.auth.setSession({
                access_token: signInData.session.access_token,
                refresh_token: signInData.session.refresh_token,
            });
            if (sessionError) {
                console.error('MSG91 Verify Session Error:', sessionError);
            }

            return NextResponse.json(payload);
        } else {
            return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
        }
    } catch (error) {
        console.error('MSG91 Verify Endpoint Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
