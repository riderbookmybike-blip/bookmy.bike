import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccessDenied } from '@/components/auth/AccessDenied';
import { RegistrationConsent } from '@/components/auth/RegistrationConsent';

export default async function VerifyAccessPage({ searchParams }: { searchParams?: { next?: string } }) {
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
        redirect('/login');
    }

    const nextPath = typeof searchParams?.next === 'string' ? searchParams.next : null;
    const tenantSlug = nextPath?.match(/^\/app\/([^/]+)/)?.[1] ?? null;

    if (tenantSlug) {
        const { data: membership } = await supabase
            .from('memberships')
            .select('id, tenants!inner(slug)')
            .eq('user_id', user.id)
            .eq('tenants.slug', tenantSlug)
            .eq('status', 'ACTIVE')
            .maybeSingle();

        if (membership) {
            redirect(nextPath || `/app/${tenantSlug}/dashboard`);
        } else {
            return <AccessDenied />;
        }
    }

    // Marketplace flow
    const { data: profile } = await supabase.from('id_members').select('id').eq('id', user.id).single();

    if (profile) {
        redirect('/');
    }

    // AUTO-REGISTRATION for Marketplace
    const { data: settings } = await supabase.from('sys_settings').select('default_owner_tenant_id').single();

    const MARKETPLACE_TENANT_ID = settings?.default_owner_tenant_id || '5371fa81-a58a-4a39-aef2-2821268c96c8';

    // 1. Ensure Profile Exists
    if (!profile) {
        const resolvedPhone = user.phone || user.user_metadata?.phone || '';
        await supabase.from('id_members').insert({
            id: user.id,
            email: user.email,
            primary_email: user.email,
            primary_phone: resolvedPhone || null,
            whatsapp: resolvedPhone || null,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            tenant_id: MARKETPLACE_TENANT_ID,
            role: 'MEMBER',
        });
    }

    // 2. Ensure Lead Entry Exists (Marketplace Hub)
    const { data: existingLead } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('customer_phone', user.phone || user.user_metadata?.phone || user.email || '')
        .eq('owner_tenant_id', MARKETPLACE_TENANT_ID)
        .single();

    if (!existingLead) {
        await supabase.from('crm_leads').insert({
            customer_name:
                user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Member',
            customer_phone: user.phone || user.user_metadata?.phone || user.email || '',
            owner_tenant_id: MARKETPLACE_TENANT_ID,
            status: 'NEW',
            interest_model: 'Marketplace Login',
            utm_data: { source: 'direct_auth', mode: 'auto_sync' },
        });
    }

    redirect('/');

    return <RegistrationConsent />;
}
