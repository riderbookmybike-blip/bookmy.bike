import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { toAppStorageFormat, isValidPhone } from '@/lib/utils/phoneUtils';

export async function POST() {
    const cookieStore = await cookies();
    const headerList = await headers();
    const host = headerList.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.startsWith('127.') || host.startsWith('0.0.0.0');
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, {
                            ...options,
                            path: '/',
                            sameSite: 'lax',
                            secure: !isLocalhost,
                        })
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Determine Tenant (MARKETPLACE OWNER from DB)
    const { data: settings } = await supabase.from('sys_settings').select('default_owner_tenant_id').single();

    const MARKETPLACE_TENANT_ID = settings?.default_owner_tenant_id || '5371fa81-a58a-4a39-aef2-2821268c96c8';

    // Explicitly create profile with required Marketplace context
    // Using 'STAFF' as 'MEMBER' is not in the DB enum 'app_role'
    const rawPhone = user.phone || user.user_metadata?.phone || '';
    const cleanPhone = toAppStorageFormat(rawPhone);
    if (cleanPhone && !isValidPhone(cleanPhone)) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const { error } = await supabase.from('id_members').insert({
        id: user.id,
        email: user.email,
        phone: cleanPhone,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        tenant_id: MARKETPLACE_TENANT_ID,
        role: 'STAFF',
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
