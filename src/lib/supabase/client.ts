import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { resolveCookieDomain } from '@/lib/supabase/cookieDomain';

export function createClient() {
    // Check if we are on client side
    const isClient = typeof window !== 'undefined';
    const hostname = isClient ? window.location.hostname : '';
    const cookieDomain = resolveCookieDomain(hostname, process.env.NEXT_PUBLIC_COOKIE_DOMAIN);

    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                path: '/',
                domain: cookieDomain,
                sameSite: 'lax',
                secure: isClient && window.location.protocol === 'https:',
            },
        }
    );
}
