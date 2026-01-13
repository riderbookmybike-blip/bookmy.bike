import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';
    const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname.includes('localhost') ||
            window.location.hostname.startsWith('127.') ||
            window.location.hostname.startsWith('0.0.0.0'));

    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookieOptions: {
            path: '/',
            sameSite: 'lax',
            secure: !isLocalhost,
            ...(isLocalhost ? {} : { domain: `.${rootDomain}` }),
        },
    });
}
