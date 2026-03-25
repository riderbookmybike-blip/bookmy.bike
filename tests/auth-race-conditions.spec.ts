import { test, expect, type APIRequestContext } from '@playwright/test';
import { createClient, type User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aytdeqjxxjxbgiyslubx.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DEV_OTP = '1234';

function requireServiceClient() {
    test.skip(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY is required for auth race-condition E2E tests');
    return createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

function buildPhone(prefix = '98') {
    const seed = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    return `${prefix}${seed.slice(-8)}`;
}

async function findAuthUserByPhone(sb: ReturnType<typeof createClient>, phone: string): Promise<User | null> {
    const formatted = `+91${phone}`;
    let page = 1;
    while (page <= 5) {
        const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        const users = data?.users || [];
        const match = users.find(u => {
            const userPhone = String(u.phone || '');
            const metaPhone = String((u.user_metadata as Record<string, unknown> | undefined)?.phone || '');
            return userPhone === formatted || metaPhone.replace(/\D/g, '').slice(-10) === phone;
        });
        if (match) return match;
        if (users.length < 1000) break;
        page += 1;
    }
    return null;
}

async function deleteAuthUserByPhone(sb: ReturnType<typeof createClient>, phone: string) {
    const found = await findAuthUserByPhone(sb, phone);
    if (found?.id) {
        await sb.auth.admin.deleteUser(found.id);
    }
}

async function loginViaDevOtp(request: APIRequestContext, phone: string) {
    const res = await request.post('/api/auth/msg91/verify', {
        data: { phone, otp: DEV_OTP },
    });
    expect(res.ok()).toBeTruthy();
}

test.describe('Auth Race Conditions (Onboarding)', () => {
    test.describe.configure({ mode: 'serial' });

    test('signup: new user creates complete id_members profile', async ({ request }) => {
        const sb = requireServiceClient();
        const phone = buildPhone('97');

        const { data: referrer, error: refErr } = await sb
            .from('id_members')
            .select('referral_code')
            .not('referral_code', 'is', null)
            .limit(1)
            .maybeSingle();

        expect(refErr?.message || '').toBe('');
        expect(referrer?.referral_code).toBeTruthy();

        await deleteAuthUserByPhone(sb, phone);

        const res = await request.post('/api/auth/signup', {
            data: {
                phone,
                displayName: `E2E ${phone}`,
                referralCode: referrer?.referral_code,
                signupSource: 'E2E_TEST',
            },
        });

        const body = await res.json();
        expect(res.status(), JSON.stringify(body)).toBe(200);
        expect(body.success).toBe(true);

        const memberId = String(body.userId || '');
        expect(memberId).toMatch(/[0-9a-f-]{36}/i);

        const { data: member, error: memberErr } = await sb
            .from('id_members')
            .select('id, phone, primary_phone')
            .eq('id', memberId)
            .maybeSingle();

        expect(memberErr?.message || '').toBe('');
        expect(member?.phone).toBe(phone);
        expect(member?.primary_phone).toBe(phone);

        await deleteAuthUserByPhone(sb, phone);
    });

    test('signup: existing user path heals stranded profile before returning 409', async ({ request }) => {
        const sb = requireServiceClient();
        const phone = buildPhone('96');
        const email = `${phone}@bookmy.bike`;

        const { data: referrer } = await sb
            .from('id_members')
            .select('referral_code')
            .not('referral_code', 'is', null)
            .limit(1)
            .maybeSingle();

        await deleteAuthUserByPhone(sb, phone);

        const created = await sb.auth.admin.createUser({
            phone: `+91${phone}`,
            email,
            email_confirm: true,
            phone_confirm: true,
            password: `E2E-${phone}`,
            user_metadata: { full_name: `Existing ${phone}`, phone },
        });
        expect(created.error?.message || '').toBe('');
        const userId = created.data.user?.id;
        expect(userId).toBeTruthy();

        const { error: degradeErr } = await sb
            .from('id_members')
            .update({ phone: null, primary_phone: null })
            .eq('id', userId!);
        expect(degradeErr?.message || '').toBe('');

        const res = await request.post('/api/auth/signup', {
            data: {
                phone,
                displayName: `Existing ${phone}`,
                referralCode: referrer?.referral_code,
                signupSource: 'E2E_TEST',
            },
        });
        const body = await res.json();

        expect(res.status(), JSON.stringify(body)).toBe(409);
        expect(body.code).toBe('USER_EXISTS');

        const { data: healed, error: healedErr } = await sb
            .from('id_members')
            .select('id, phone, primary_phone')
            .eq('id', userId!)
            .maybeSingle();
        expect(healedErr?.message || '').toBe('');
        expect(healed?.phone).toBe(phone);
        expect(healed?.primary_phone).toBe(phone);

        await deleteAuthUserByPhone(sb, phone);
    });

    test('welcome: forced id_members unique conflict returns 500', async ({ request }) => {
        const sb = requireServiceClient();
        const phone = buildPhone('95');
        const conflictId = crypto.randomUUID();

        await deleteAuthUserByPhone(sb, phone);

        const { data: dealerTenant, error: dealerErr } = await sb
            .from('id_tenants')
            .select('id')
            .limit(1)
            .maybeSingle();
        expect(dealerErr?.message || '').toBe('');
        expect(dealerTenant?.id).toBeTruthy();

        const { error: conflictInsertErr } = await sb.from('id_members').insert({
            id: conflictId,
            full_name: `Conflict ${phone}`,
            primary_phone: phone,
            role: 'MEMBER',
        });
        expect(conflictInsertErr?.message || '').toBe('');

        const res = await request.post('/api/welcome/submit', {
            data: {
                fullName: `Welcome ${phone}`,
                phone,
                otp: DEV_OTP,
                pincode: '401208',
                requestedScopes: ['DEALERSHIP_TEAM'],
                dealershipTenantIds: [dealerTenant?.id],
            },
        });

        const body = await res.json();
        expect(res.status(), JSON.stringify(body)).toBe(500);
        expect(String(body.message || '').length).toBeGreaterThan(0);

        await sb.from('id_members').delete().eq('id', conflictId);
        await deleteAuthUserByPhone(sb, phone);
    });

    test('register: authenticated flow upserts id_members', async ({ request }) => {
        const sb = requireServiceClient();
        const phone = buildPhone('94');
        const email = `${phone}@bookmy.bike`;

        await deleteAuthUserByPhone(sb, phone);

        const created = await sb.auth.admin.createUser({
            phone: `+91${phone}`,
            email,
            email_confirm: true,
            phone_confirm: true,
            password: `E2E-${phone}`,
            user_metadata: { full_name: `Register ${phone}`, phone },
        });
        expect(created.error?.message || '').toBe('');

        await loginViaDevOtp(request, phone);

        const res = await request.post('/api/auth/register');
        const body = await res.json();
        expect(res.status(), JSON.stringify(body)).toBe(200);
        expect(body.success).toBe(true);

        const existing = await findAuthUserByPhone(sb, phone);
        expect(existing?.id).toBeTruthy();

        const { data: member, error: memberErr } = await sb
            .from('id_members')
            .select('id, phone')
            .eq('id', existing!.id)
            .maybeSingle();
        expect(memberErr?.message || '').toBe('');
        expect(member?.phone).toBe(phone);

        await deleteAuthUserByPhone(sb, phone);
    });

    test('verify-access: authenticated member redirects successfully', async ({ request }) => {
        const sb = requireServiceClient();
        const phone = buildPhone('93');
        const email = `${phone}@bookmy.bike`;

        await deleteAuthUserByPhone(sb, phone);

        const created = await sb.auth.admin.createUser({
            phone: `+91${phone}`,
            email,
            email_confirm: true,
            phone_confirm: true,
            password: `E2E-${phone}`,
            user_metadata: { full_name: `Verify ${phone}`, phone },
        });
        expect(created.error?.message || '').toBe('');

        await loginViaDevOtp(request, phone);

        const res = await request.get('/auth/verify-access', { maxRedirects: 0 });
        expect([302, 303, 307, 308]).toContain(res.status());

        await deleteAuthUserByPhone(sb, phone);
    });
});
