import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAuthPassword } from '@/lib/auth/password-utils';

export async function POST(req: NextRequest) {
    const adminSecret = process.env.ADMIN_API_SECRET;
    const providedSecret = req.headers.get('x-admin-secret') || '';

    if (!adminSecret || providedSecret !== adminSecret) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ success: false, message: 'Phone number required' }, { status: 400 });
        }

        const formattedPhone = `91${phone}`; // Legacy numeric format
        const e164Phone = `+91${phone}`; // E.164 format
        const email = `${phone}@bookmy.bike`; // Synthesized email
        const password = getAuthPassword(phone);

        // 1. Check if User Exists in Supabase Auth
        const { data: existingUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

        // Find user by phone OR synthesized email
        const normalizePhone = (value?: string | null) => (value || '').replace(/\D/g, '').slice(-10);
        const targetPhone = normalizePhone(phone);
        const foundUser = existingUsers?.users.find(u => {
            const userPhone = normalizePhone(u.phone || '');
            const metaPhone = normalizePhone((u.user_metadata as { phone?: string })?.phone);
            return (
                userPhone === targetPhone ||
                metaPhone === targetPhone ||
                u.phone === e164Phone ||
                u.phone === formattedPhone ||
                u.phone === phone ||
                u.email === email
            );
        });

        if (!foundUser) {
            // 2. User MUST exist for Login flow
            return NextResponse.json(
                {
                    success: false,
                    message: 'Account not found. Please create an account first.',
                    code: 'USER_NOT_FOUND',
                },
                { status: 404 }
            );
        }

        const userId = foundUser.id;
        const actualEmail = foundUser.email || email; // Use real email if exists, else synthesized
        const shouldSetEmail = !foundUser.email;

        // 3. MIGRATION FIX: Ensure Password is Set for Legacy Users
        const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
            password: password,
            ...(shouldSetEmail ? { email: actualEmail, email_confirm: true } : { email_confirm: true }),
            user_metadata: { phone_login_migrated: true },
        });

        if (updateError) {
            console.error('Migration Error:', updateError);
        }

        // 4. GENERATE SESSION
        const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
            email: actualEmail,
            password: password,
        });

        if (signInError || !signInData.session) {
            console.error('Session Generation Error:', signInError);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to generate session token.',
                },
                { status: 500 }
            );
        }

        // 5. Fetch Profile Name for Header Display
        const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', userId).single();

        return NextResponse.json({
            success: true,
            userId,
            session: signInData.session,
            displayName: profile?.full_name || foundUser.user_metadata?.name || null,
        });
    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
