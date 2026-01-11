import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccessDenied } from '@/components/auth/AccessDenied';
import { RegistrationConsent } from '@/components/auth/RegistrationConsent';

export default async function VerifyAccessPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Determine Subdomain context (We can't get hostname easily in Server Component without headers)
    // But we are in a route, so we can check headers.
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const host = headerList.get('host') || '';
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';

    let currentSubdomain = null;
    if (host.endsWith(`.${ROOT_DOMAIN}`)) {
        const sub = host.replace(`.${ROOT_DOMAIN}`, '');
        if (sub !== 'www') {
            currentSubdomain = sub;
        }
    }

    // 1. CRM Mode (Private) -> Check Membership
    const isCRM = ['aums', 'we', 'ltfinance'].includes(currentSubdomain || '');

    if (isCRM && currentSubdomain) {
        const { data: membership } = await supabase
            .from('memberships')
            .select('id, tenants!inner(subdomain)')
            .eq('user_id', user.id)
            .eq('tenants.subdomain', currentSubdomain)
            .eq('status', 'ACTIVE')
            .single();

        if (membership) {
            redirect('/dashboard');
        } else {
            return <AccessDenied />;
        }
    }

    // 2. Marketplace/Partner Mode -> Check Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();


    if (profile && currentSubdomain) {
        redirect('/dashboard');
    }

    if (profile && !currentSubdomain) {
        redirect('/');
    }

    // AUTO-REGISTRATION for Marketplace (Root Domain)
    if (!currentSubdomain) {
        // Fetch current Marketplace Tenant ID
        const { data: settings } = await supabase
            .from('app_settings')
            .select('default_owner_tenant_id')
            .single();

        const MARKETPLACE_TENANT_ID = settings?.default_owner_tenant_id || '5371fa81-a58a-4a39-aef2-2821268c96c8';

        // 1. Ensure Profile Exists
        if (!profile) {
            await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    phone: user.phone || user.user_metadata?.phone || '',
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
                    tenant_id: MARKETPLACE_TENANT_ID,
                    role: 'STAFF'
                });
        }

        // 2. Ensure Lead Entry Exists (Marketplace Hub)
        // This resolves the user's request for users to appear in leads after login.
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('customer_phone', user.phone || user.user_metadata?.phone || user.email)
            .eq('owner_tenant_id', MARKETPLACE_TENANT_ID)
            .single();

        if (!existingLead) {
            await supabase
                .from('leads')
                .insert({
                    customer_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Member',
                    customer_phone: user.phone || user.user_metadata?.phone || user.email || '',
                    owner_tenant_id: MARKETPLACE_TENANT_ID,
                    status: 'NEW',
                    interest_model: 'Marketplace Login',
                    utm_data: { source: 'direct_auth', mode: 'auto_sync' }
                });
        }

        redirect('/');
    }

    return <RegistrationConsent />;
}
