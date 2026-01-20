import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { adminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getAuthPassword } from '@/lib/auth/password-utils';

export async function POST(req: NextRequest) {
    try {
        const { phone, otp } = await req.json();

        if (!phone || !otp) {
            return NextResponse.json({ success: false, message: 'Phone and OTP required' }, { status: 400 });
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        const templateId = process.env.MSG91_TEMPLATE_ID;
        const isProduction = process.env.NODE_ENV === 'production';
        // Normalize phone: remove non-digits, take last 10, prefix 91
        const cleanedPhone = phone.replace(/\D/g, '');
        const tenDigitPhone = cleanedPhone.slice(-10);
        const mobile = `91${tenDigitPhone}`;
        const e164Phone = `+${mobile}`; // +91XXXXXXXXXX
        const email = `${phone}@bookmy.bike`;
        let isVerified = false;
        let errorMessage = 'Invalid OTP';

        // 1. Explicit Developer/Bypass Check (Works even if Keys are set)
        const host = req.headers.get('host') || '';
        const hostName = host.split(':')[0]?.toLowerCase() || '';
        const isLocalhost = hostName === 'localhost' || hostName === '127.0.0.1' || hostName === '0.0.0.0';
        const bypassHosts = (process.env.SUPERADMIN_DEV_BYPASS_HOSTS || '')
            .split(',')
            .map(entry => entry.trim().toLowerCase())
            .filter(Boolean);
        const bypassFlag = ['1', 'true', 'yes'].includes((process.env.SUPERADMIN_DEV_BYPASS || '').toLowerCase());
        const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase();
        const isBypassHost = bypassHosts.includes(hostName) || bypassHosts.includes(host.toLowerCase());
        const isBypassEnv = isLocalhost || bypassFlag || isBypassHost || vercelEnv === 'preview' || vercelEnv === 'development';

        console.log('[Login Debug] Request:', { phone, otp, host, isLocalhost, isProduction, env: process.env.NODE_ENV });

        const normalizePhone = (value?: string | null) => (value || '').replace(/\D/g, '').slice(-10);
        const targetPhone = normalizePhone(tenDigitPhone);
        let cachedUsers: Array<{ id: string; phone?: string | null; email?: string | null; user_metadata?: { phone?: string | null } }> | null = null;
        let cachedUser:
            | { id: string; phone?: string | null; email?: string | null; user_metadata?: { phone?: string | null } }
            | null
            | undefined;

        const resolveUser = async () => {
            if (cachedUser !== undefined) return cachedUser;

            // 1. Try finding in Auth first
            const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
            if (listError) throw listError;
            cachedUsers = existingUsers?.users || [];

            cachedUser = cachedUsers.find(u => {
                const userPhone = normalizePhone(u.phone || '');
                const metaPhone = normalizePhone((u.user_metadata as { phone?: string })?.phone);
                const emailMatch = u.email?.toLowerCase() === email.toLowerCase();
                return userPhone === targetPhone || metaPhone === targetPhone || u.phone === e164Phone || u.phone === mobile || emailMatch;
            });

            if (cachedUser) {
                console.log(`[Login Debug] Found existing auth user: ${cachedUser.id}`);
                return cachedUser;
            }

            // 2. JIT: Check profiles table if not in Auth
            console.log(`[Login Debug] User not in Auth. Checking profiles for ${phone}...`);
            const { data: profile } = await adminClient
                .from('profiles')
                .select('id, full_name, email')
                .or(`phone.eq.${phone},phone.eq.${tenDigitPhone},phone.eq.${mobile},phone.eq.${e164Phone}`)
                .maybeSingle();

            if (profile) {
                console.log(`[Login Debug] JIT: Found migrated profile ${profile.id}. Provisioning Auth...`);
                const jitPassword = getAuthPassword(phone);
                const jitEmail = profile.email || `${phone}@bookmy.bike`;

                const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                    id: profile.id, // CRITICAL: Use existing profile ID
                    email: jitEmail,
                    phone: e164Phone,
                    email_confirm: true,
                    phone_confirm: true,
                    password: jitPassword,
                    user_metadata: { full_name: profile.full_name, phone_login_migrated: true }
                });

                if (createError) {
                    console.error('[Login Debug] JIT Provisioning failed:', createError);
                    return null;
                }

                cachedUser = newUser.user;
                return cachedUser;
            }

            return null;
        };

        const canBypassSuperadmin = async () => {
            if (!isBypassEnv) return false;
            const user = await resolveUser();
            if (!user) return false;
            const { data: memberships, error: membershipError } = await adminClient
                .from('memberships')
                .select('role, tenants!inner(slug, type)')
                .eq('user_id', user.id)
                .eq('status', 'ACTIVE')
                .eq('tenants.slug', 'aums')
                .in('role', ['SUPER_ADMIN', 'SUPERADMIN']);
            if (membershipError) {
                console.warn('Superadmin bypass check failed:', membershipError);
                return false;
            }
            return (memberships || []).length > 0;
        };

        if (await canBypassSuperadmin()) {
            console.log('Using Superadmin Dev Bypass for OTP');
            isVerified = true;
        } else if ((!isProduction || isLocalhost) && (otp === '1234' || otp === '0000')) {
            console.log('Using Developer Bypass for OTP');
            isVerified = true;
        }
        // 2. Missing Config Check
        else if (!authKey || !templateId) {
            if (isProduction) {
                console.error('MSG91 Configuration Missing.');
                return NextResponse.json({ success: false, message: 'OTP service unavailable' }, { status: 500 });
            }

            console.warn('MSG91 Configuration Missing. Using developer bypass.');
            isVerified = otp === '1234' || otp === '0000' || process.env.NODE_ENV === 'development';
        }
        // 3. Real Verification
        else {
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
            const foundUser = await resolveUser();

            if (!foundUser) {
                // Allow new users to proceed to signup (Deadlock Fix)
                return NextResponse.json({
                    success: true,
                    isNew: true,
                    session: null,
                    message: 'Verification successful. Please complete signup.',
                });
            }

            const userId = foundUser.id;
            let password;
            try {
                password = getAuthPassword(phone);
            } catch (e: any) {
                return NextResponse.json({ success: false, message: e.message }, { status: 500 });
            }
            const actualEmail = foundUser.email || email;
            const shouldSetEmail = !foundUser.email;

            // Ensure password is set (idempotent)
            const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
                password: password,
                ...(shouldSetEmail ? { email: actualEmail, email_confirm: true } : { email_confirm: true }),
                user_metadata: { ...foundUser.user_metadata, phone_login_migrated: true },
            });

            if (updateError) {
                console.error('[Login Debug] updateUserById failed:', updateError);
                // NOT returning here because if the password already matches, signIn might still work.
            }

            const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
                email: actualEmail,
                password: password,
            });

            if (signInError || !signInData.session) {
                console.error('[Login Debug] signInWithPassword failed:', signInError);
                return NextResponse.json({
                    success: false,
                    message: `Session generation failed: ${signInError?.message || 'Unknown error'}`
                }, { status: 500 });
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
            // Host and isLocalhost are already defined in outer scope
            const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';
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
