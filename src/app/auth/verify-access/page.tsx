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
        currentSubdomain = host.replace(`.${ROOT_DOMAIN}`, '');
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

    if (profile) {
        redirect('/dashboard');
    }

    // AUTO-REGISTRATION for Marketplace (Root Domain)
    if (!currentSubdomain) {
        const { error } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email,
                phone: user.phone,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            });

        if (!error) {
            redirect('/');
        }
    }

    return <RegistrationConsent />;
}
